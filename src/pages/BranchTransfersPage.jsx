import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, orderBy, where, getDocs, runTransaction } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useLanguage } from '../hooks/useLanguage';
import { ArrowLeftIcon, PlusIcon, DownloadIcon, FilterIcon, SearchIcon, TrashIcon } from '../components/Icons';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedLoader from '../components/AnimatedLoader';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  Calendar,
  Filter,
  Search,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  Printer,
  Wallet,
  CreditCard,
  Banknote,
  Receipt,
  Building2,
  ArrowRightLeft,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Function to generate automatic transfer number
const generateTransferNumber = async () => {
  try {
    const counterRef = doc(db, 'counters', 'transfer_counter');
    
    const newCounter = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      if (!counterDoc.exists()) {
        transaction.set(counterRef, { count: 1 });
        return 1;
      } else {
        const newCount = counterDoc.data().count + 1;
        transaction.update(counterRef, { count: newCount });
        return newCount;
      }
    });
    
    return `TR-${newCounter.toString().padStart(5, '0')}`;
  } catch (error) {
    console.error('Error generating transfer number:', error);
    return `TR-${Date.now().toString().slice(-5)}`;
  }
};

// Modal for adding/editing transfers
function TransferModal({ isOpen, onClose, onSave, transfer = null, branches = [] }) {
  const { tr } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fromBranch: '',
    toBranch: '',
    amount: '',
    currency: 'USD',
    transferType: 'send',
    description: '',
    transferNumber: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5)
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initializeForm = async () => {
      if (transfer) {
        // Editing existing transfer
        setFormData({
          fromBranch: transfer.fromBranch || '',
          toBranch: transfer.toBranch || '',
          amount: transfer.amount?.toString() || '',
          currency: transfer.currency || 'USD',
          transferType: transfer.transferType || 'send',
          description: transfer.description || '',
          transferNumber: transfer.transferNumber || '',
          date: transfer.date || new Date().toISOString().split('T')[0],
          time: transfer.time || new Date().toTimeString().slice(0, 5)
        });
      } else {
        // Adding new transfer - generate transfer number
        const transferNumber = await generateTransferNumber();
        setFormData({
          fromBranch: '',
          toBranch: '',
          amount: '',
          currency: 'USD',
          transferType: 'send',
          description: '',
          transferNumber: transferNumber,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5)
        });
      }
      setErrors({});
    };

    if (isOpen) {
      initializeForm();
    }
  }, [transfer, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = tr('pleaseEnterAmount');
    }
    
    if (!formData.description.trim()) {
      newErrors.description = tr('pleaseEnterDescription');
    }
    
    if (!formData.fromBranch) {
      newErrors.fromBranch = tr('pleaseSelectFromBranch');
    }
    
    if (!formData.toBranch) {
      newErrors.toBranch = tr('pleaseSelectToBranch');
    }
    
    if (formData.fromBranch === formData.toBranch) {
      newErrors.toBranch = tr('branchesCannotBeSame');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const transferData = {
        ...formData,
        amount: parseFloat(formData.amount),
        createdAt: new Date(),
        createdBy: auth.currentUser?.email || 'unknown',
        status: 'pending'
      };

      if (transfer) {
        await updateDoc(doc(db, 'branch_transfers', transfer.id), transferData);
      } else {
        await addDoc(collection(db, 'branch_transfers'), transferData);
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving transfer:', error);
      alert(transfer ? tr('errorUpdatingTransfer') : tr('errorAddingTransfer'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {transfer ? tr('editTransfer') : tr('addTransfer')}
        </h2>
        
                 <form onSubmit={handleSubmit} className="space-y-4">
           {branches.length === 0 && (
             <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
               <div className="flex items-center">
                 <div className="flex-shrink-0">
                   <Building2 className="h-5 w-5 text-yellow-400" />
                 </div>
                 <div className="mr-3">
                   <h3 className="text-sm font-medium text-yellow-800">
                     {tr('noBranchesAvailable')}
                   </h3>
                   <div className="mt-2 text-sm text-yellow-700">
                     <p>{tr('pleaseAddBranchesFirst')}</p>
                     <button
                       type="button"
                       onClick={() => {
                         onClose();
                         navigate('/branches');
                       }}
                       className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                     >
                       <Building2 className="w-4 h-4 ml-1" />
                       {tr('goToBranchManagement')}
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           )}
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tr('fromBranch')} *
              </label>
                             <select
                 value={formData.fromBranch}
                 onChange={(e) => setFormData({ ...formData, fromBranch: e.target.value })}
                 className={`w-full p-2 border rounded-md ${errors.fromBranch ? 'border-red-500' : 'border-gray-300'}`}
                 required
               >
                 <option value="">{tr('selectBranch')}</option>
                 {branches.length > 0 ? (
                   branches.map((branch, index) => (
                     <option key={index} value={branch.branchName}>{branch.branchName}</option>
                   ))
                 ) : (
                   <option value="" disabled>{tr('noBranchesAvailable')}</option>
                 )}
               </select>
              {errors.fromBranch && <p className="text-red-500 text-sm mt-1">{errors.fromBranch}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tr('toBranch')} *
              </label>
                             <select
                 value={formData.toBranch}
                 onChange={(e) => setFormData({ ...formData, toBranch: e.target.value })}
                 className={`w-full p-2 border rounded-md ${errors.toBranch ? 'border-red-500' : 'border-gray-300'}`}
                 required
               >
                 <option value="">{tr('selectBranch')}</option>
                 {branches.length > 0 ? (
                   branches.map((branch, index) => (
                     <option key={index} value={branch.branchName}>{branch.branchName}</option>
                   ))
                 ) : (
                   <option value="" disabled>{tr('noBranchesAvailable')}</option>
                 )}
               </select>
              {errors.toBranch && <p className="text-red-500 text-sm mt-1">{errors.toBranch}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tr('amount')} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className={`w-full p-2 border rounded-md ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={tr('enterAmount')}
                required
              />
              {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tr('currency')} *
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="USD">{tr('usd')}</option>
                <option value="TRY">{tr('try')}</option>
                <option value="SYP">{tr('syp')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tr('transferType')} *
            </label>
            <select
              value={formData.transferType}
              onChange={(e) => setFormData({ ...formData, transferType: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="send">{tr('sendTransfer')}</option>
              <option value="receive">{tr('receiveTransfer')}</option>
              <option value="confirm">{tr('confirmTransfer')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tr('description')} *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full p-2 border rounded-md ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
              placeholder={tr('enterDescription')}
              rows="3"
              required
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tr('transferNumber')}
              </label>
              <input
                type="text"
                value={formData.transferNumber}
                readOnly
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                placeholder={tr('autoGenerated')}
              />
              <p className="text-xs text-gray-500 mt-1">
                {tr('transferNumberAutoGenerated')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tr('transferDate')}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tr('transferTime')}
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
            >
              {tr('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 font-semibold"
            >
              {isSubmitting ? tr('saving') : (transfer ? tr('update') : tr('add'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BranchTransfersPage() {
  const navigate = useNavigate();
  const { tr } = useLanguage();
  const [transfers, setTransfers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [filters, setFilters] = useState({
    fromBranch: '',
    toBranch: '',
    transferType: '',
    currency: '',
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setIsLoading(true);
    
    // Fetch transfers
    const transfersRef = collection(db, 'branch_transfers');
    const transfersQuery = query(transfersRef, orderBy('createdAt', 'desc'));
    const transfersUnsubscribe = onSnapshot(transfersQuery, (snapshot) => {
      const transfersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransfers(transfersData);
      setIsLoading(false);
    });

    // Fetch branches
    const branchesRef = collection(db, 'branches');
    const branchesUnsubscribe = onSnapshot(branchesRef, (snapshot) => {
      const branchesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // If no branches exist, create default branches
      if (branchesData.length === 0) {
        createDefaultBranches();
      } else {
        setBranches(branchesData);
      }
    });

    return () => {
      transfersUnsubscribe();
      branchesUnsubscribe();
    };
  }, []);

  // Function to create default branches
  const createDefaultBranches = async () => {
    try {
      const defaultBranches = [
        {
          branchName: 'حلب',
          location: 'حلب، سوريا',
          phone: '+963-21-1234567',
          managerName: 'مدير فرع حلب',
          managerPhone: '+963-21-1234567',
          status: 'active',
          notes: 'الفرع الرئيسي في حلب'
        },
        {
          branchName: 'اللاذقية',
          location: 'اللاذقية، سوريا',
          phone: '+963-41-1234567',
          managerName: 'مدير فرع اللاذقية',
          managerPhone: '+963-41-1234567',
          status: 'active',
          notes: 'فرع اللاذقية'
        },
        {
          branchName: 'دمشق',
          location: 'دمشق، سوريا',
          phone: '+963-11-1234567',
          managerName: 'مدير فرع دمشق',
          managerPhone: '+963-11-1234567',
          status: 'active',
          notes: 'فرع دمشق'
        },
        {
          branchName: 'حمص',
          location: 'حمص، سوريا',
          phone: '+963-31-1234567',
          managerName: 'مدير فرع حمص',
          managerPhone: '+963-31-1234567',
          status: 'active',
          notes: 'فرع حمص'
        }
      ];

      // Add default branches to Firestore
      for (const branch of defaultBranches) {
        await addDoc(collection(db, 'branches'), {
          ...branch,
          createdAt: new Date()
        });
      }
      
      console.log('Default branches created successfully');
    } catch (error) {
      console.error('Error creating default branches:', error);
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    const todayTransfers = transfers.filter(t => t.date === today);
    const thisMonthTransfers = transfers.filter(t => t.date.startsWith(thisMonth));
    
    const totalSent = transfers.filter(t => t.transferType === 'send').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalReceived = transfers.filter(t => t.transferType === 'receive').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalConfirmed = transfers.filter(t => t.transferType === 'confirm').reduce((sum, t) => sum + (t.amount || 0), 0);
    const pendingTransfers = transfers.filter(t => t.status === 'pending').length;
    
    return {
      totalSent,
      totalReceived,
      totalConfirmed,
      pendingTransfers,
      todayTransfers: todayTransfers.length,
      thisMonthTransfers: thisMonthTransfers.length,
      totalTransfers: transfers.length
    };
  };

  const stats = calculateStats();

  // Filter transfers
  const filteredTransfers = transfers.filter(transfer => {
    const matchesFromBranch = !filters.fromBranch || transfer.fromBranch === filters.fromBranch;
    const matchesToBranch = !filters.toBranch || transfer.toBranch === filters.toBranch;
    const matchesTransferType = !filters.transferType || transfer.transferType === filters.transferType;
    const matchesCurrency = !filters.currency || transfer.currency === filters.currency;
    const matchesDateFrom = !filters.dateFrom || transfer.date >= filters.dateFrom;
    const matchesDateTo = !filters.dateTo || transfer.date <= filters.dateTo;
    const matchesAmountFrom = !filters.amountFrom || transfer.amount >= parseFloat(filters.amountFrom);
    const matchesAmountTo = !filters.amountTo || transfer.amount <= parseFloat(filters.amountTo);
    const matchesSearch = !searchTerm || 
      transfer.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.fromBranch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.toBranch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.transferNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFromBranch && matchesToBranch && matchesTransferType && 
           matchesCurrency && matchesDateFrom && matchesDateTo && 
           matchesAmountFrom && matchesAmountTo && matchesSearch;
  });

  const handleDeleteTransfer = async (transferId) => {
    if (window.confirm(tr('confirmDeleteTransfer'))) {
      try {
        await deleteDoc(doc(db, 'branch_transfers', transferId));
        alert(tr('transferDeletedSuccess'));
      } catch (error) {
        console.error('Error deleting transfer:', error);
        alert(tr('errorDeletingTransfer'));
      }
    }
  };

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('عمليات الزمم');
    
    // Add headers
    sheet.columns = [
      { header: 'التاريخ', key: 'date', width: 12 },
      { header: 'الوقت', key: 'time', width: 10 },
      { header: 'رقم الحوالة', key: 'transferNumber', width: 15 },
      { header: 'الفرع المرسل', key: 'fromBranch', width: 20 },
      { header: 'الفرع المستقبل', key: 'toBranch', width: 20 },
      { header: 'نوع العملية', key: 'transferType', width: 15 },
      { header: 'المبلغ', key: 'amount', width: 15 },
      { header: 'العملة', key: 'currency', width: 10 },
      { header: 'الوصف', key: 'description', width: 30 },
      { header: 'الحالة', key: 'status', width: 12 }
    ];

    // Add data
    filteredTransfers.forEach(transfer => {
      sheet.addRow({
        date: transfer.date,
        time: transfer.time,
        transferNumber: transfer.transferNumber || '',
        fromBranch: transfer.fromBranch || '',
        toBranch: transfer.toBranch || '',
        transferType: transfer.transferType === 'send' ? 'إرسال' : 
                     transfer.transferType === 'receive' ? 'استلام' : 'تأكيد',
        amount: transfer.amount,
        currency: transfer.currency,
        description: transfer.description,
        status: transfer.status === 'pending' ? 'معلق' : 
               transfer.status === 'confirmed' ? 'مؤكد' : 'مكتمل'
      });
    });

    // Save file
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `عمليات_الزمم_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getTransferIcon = (type) => {
    switch (type) {
      case 'send': return <ArrowUpRight className="w-5 h-5 text-blue-600" />;
      case 'receive': return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
      case 'confirm': return <CheckCircle className="w-5 h-5 text-purple-600" />;
      default: return <ArrowRightLeft className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransferColor = (type) => {
    switch (type) {
      case 'send': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'receive': return 'text-green-600 bg-green-50 border-green-200';
      case 'confirm': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 font-sans" dir="rtl">
      <motion.div 
        className="max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <AnimatedButton
                onClick={() => navigate('/dashboard')}
                variant="outline"
                icon={ArrowLeftIcon}
                size="sm"
              >
                {tr('backToDashboard')}
              </AnimatedButton>
              <h1 className="text-3xl font-bold gradient-text">{tr('branchTransfers')}</h1>
            </div>
            <div className="flex gap-3">
              <AnimatedButton
                onClick={handleExport}
                variant="outline"
                icon={DownloadIcon}
              >
                {tr('exportTransfers')}
              </AnimatedButton>
              <AnimatedButton
                onClick={() => setIsModalOpen(true)}
                variant="primary"
                icon={PlusIcon}
              >
                {tr('addTransfer')}
              </AnimatedButton>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" variants={itemVariants}>
          <AnimatedCard className="p-6" delay={0.1}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{tr('totalSent')}</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalSent.toLocaleString()} USD</p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-blue-600" />
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" delay={0.2}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{tr('totalReceived')}</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalReceived.toLocaleString()} USD</p>
              </div>
              <ArrowDownLeft className="w-8 h-8 text-green-600" />
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" delay={0.3}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{tr('pendingTransfers')}</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingTransfers}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" delay={0.4}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{tr('totalTransfers')}</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.totalTransfers}</p>
              </div>
              <Building2 className="w-8 h-8 text-indigo-600" />
            </div>
          </AnimatedCard>
        </motion.div>

        {/* Filters */}
        <motion.div className="mb-6" variants={itemVariants}>
          <AnimatedCard className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tr('filterByFromBranch')}</label>
                                 <select
                   value={filters.fromBranch}
                   onChange={(e) => setFilters({ ...filters, fromBranch: e.target.value })}
                   className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                 >
                   <option value="">{tr('allBranches')}</option>
                   {branches.map((branch, index) => (
                     <option key={index} value={branch.branchName}>{branch.branchName}</option>
                   ))}
                 </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tr('filterByToBranch')}</label>
                                 <select
                   value={filters.toBranch}
                   onChange={(e) => setFilters({ ...filters, toBranch: e.target.value })}
                   className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                 >
                   <option value="">{tr('allBranches')}</option>
                   {branches.map((branch, index) => (
                     <option key={index} value={branch.branchName}>{branch.branchName}</option>
                   ))}
                 </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tr('filterByType')}</label>
                <select
                  value={filters.transferType}
                  onChange={(e) => setFilters({ ...filters, transferType: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">{tr('allTypes')}</option>
                  <option value="send">{tr('sendTransfer')}</option>
                  <option value="receive">{tr('receiveTransfer')}</option>
                  <option value="confirm">{tr('confirmTransfer')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tr('filterByDate')}</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={() => setFilters({
                  fromBranch: '',
                  toBranch: '',
                  transferType: '',
                  currency: '',
                  dateFrom: '',
                  dateTo: '',
                  amountFrom: '',
                  amountTo: ''
                })}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {tr('clearFilters')}
              </button>
              <span className="text-sm text-gray-600">
                {tr('showing')} {filteredTransfers.length} {tr('of')} {transfers.length} {tr('transfers')}
              </span>
            </div>
          </AnimatedCard>
        </motion.div>

        {/* Transfers List */}
        <AnimatedCard className="p-6" delay={0.5}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{tr('branchTransfers')}</h3>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={tr('searchTransfers')}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-20 text-center">
              <AnimatedLoader 
                type="ring" 
                size="xl" 
                color="indigo" 
                text={tr('loadingData')}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-right">{tr('transferDate')}</th>
                    <th className="p-3 text-right">{tr('transferNumber')}</th>
                    <th className="p-3 text-right">{tr('fromBranch')}</th>
                    <th className="p-3 text-right">{tr('toBranch')}</th>
                    <th className="p-3 text-right">{tr('transferType')}</th>
                    <th className="p-3 text-right">{tr('amount')}</th>
                    <th className="p-3 text-right">{tr('status')}</th>
                    <th className="p-3 text-right">{tr('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransfers.map((transfer) => (
                    <motion.tr 
                      key={transfer.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                      variants={itemVariants}
                    >
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="font-medium">{transfer.date}</div>
                          <div className="text-gray-500">{transfer.time}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-medium text-indigo-600">
                          {transfer.transferNumber}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-medium">
                          {transfer.fromBranch}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-medium">
                          {transfer.toBranch}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getTransferColor(transfer.transferType)}`}>
                          {getTransferIcon(transfer.transferType)}
                          {transfer.transferType === 'send' ? tr('sendTransfer') : 
                           transfer.transferType === 'receive' ? tr('receiveTransfer') : tr('confirmTransfer')}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {transfer.amount.toLocaleString()} {transfer.currency}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transfer.status)}
                          <span className="text-sm">
                            {transfer.status === 'pending' ? tr('pending') : 
                             transfer.status === 'confirmed' ? tr('confirmed') : tr('completed')}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingTransfer(transfer);
                              setIsModalOpen(true);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title={tr('editTransfer')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransfer(transfer.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title={tr('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              
              {filteredTransfers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>{tr('noTransfers')}</p>
                  <p className="text-sm mt-2">
                    {tr('addNewTransfer')}
                  </p>
                </div>
              )}
            </div>
          )}
        </AnimatedCard>
      </motion.div>

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransfer(null);
        }}
        onSave={() => {
          // Transfers will be updated via real-time listener
        }}
        transfer={editingTransfer}
        branches={branches}
      />
    </div>
  );
}
