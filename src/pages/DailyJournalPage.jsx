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
  Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Function to generate automatic reference number
const generateReferenceNumber = async () => {
  try {
    const counterRef = doc(db, 'counters', 'transaction_counter');
    
    const newCounter = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      if (!counterDoc.exists()) {
        // Create counter for the first time
        transaction.set(counterRef, { count: 1 });
        return 1;
      } else {
        // Increment counter
        const newCount = counterDoc.data().count + 1;
        transaction.update(counterRef, { count: newCount });
        return newCount;
      }
    });
    
    // Return formatted reference number
    return `SH-${newCounter.toString().padStart(5, '0')}`;
  } catch (error) {
    console.error('Error generating reference number:', error);
    // Fallback reference number
    return `SH-${Date.now().toString().slice(-5)}`;
  }
};

// Modal for adding/editing transactions
function TransactionModal({ isOpen, onClose, onSave, transaction = null, customers = [], customersRegistered = [] }) {
  const { tr } = useLanguage();
  const [formData, setFormData] = useState({
    type: 'debt',
    customerName: '',
    customerPhone: '',
    customerId: '',
    customerRole: '', // 'sender' | 'receiver'
    amount: '',
    currency: 'USD',
    description: '',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5)
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerSelectType, setCustomerSelectType] = useState('new'); // 'new' | 'existing'
  const [existingRole, setExistingRole] = useState('receiver'); // filter for existing
  const [newRole, setNewRole] = useState('receiver'); // role for new customer entry

  useEffect(() => {
    const initializeForm = async () => {
      if (transaction) {
        // Editing existing transaction
        setFormData({
          type: transaction.type,
          customerName: transaction.customerName || '',
          customerPhone: transaction.customerPhone || '',
          customerId: transaction.customerId || '',
          customerRole: transaction.customerRole || '',
          amount: transaction.amount?.toString() || '',
          currency: transaction.currency || 'USD',
          description: transaction.description || '',
          reference: transaction.reference || '',
          date: transaction.date || new Date().toISOString().split('T')[0],
          time: transaction.time || new Date().toTimeString().slice(0, 5)
        });
      } else {
        // Adding new transaction - generate reference number
        const referenceNumber = await generateReferenceNumber();
        setFormData({
          type: 'debt',
          customerName: '',
          customerPhone: '',
          customerId: '',
          customerRole: '',
          amount: '',
          currency: 'USD',
          description: '',
          reference: referenceNumber,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5)
        });
      }
      setErrors({});
    };

    if (isOpen) {
      initializeForm();
    }
  }, [transaction, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = tr('pleaseEnterAmount');
    }
    
    if (!formData.description.trim()) {
      newErrors.description = tr('pleaseEnterDescription');
    }
    
    if (!formData.type) {
      newErrors.type = tr('pleaseSelectType');
    }
    
    if (!formData.currency) {
      newErrors.currency = tr('pleaseSelectCurrency');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        createdAt: new Date(),
        createdBy: auth.currentUser?.email || 'unknown',
        status: 'completed'
      };

      if (transaction) {
        await updateDoc(doc(db, 'financial_transactions', transaction.id), transactionData);
      } else {
        await addDoc(collection(db, 'financial_transactions'), transactionData);
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert(transaction ? tr('errorUpdatingTransaction') : tr('errorAddingTransaction'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {transaction ? tr('editTransaction') : tr('addTransaction')}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tr('transactionType')} *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={`w-full p-2 border rounded-md ${errors.type ? 'border-red-500' : 'border-gray-300'}`}
                required
              >
                <option value="debt">{tr('addDebt') || 'تسجيل دين'}</option>
                <option value="payment">{tr('addPayment') || 'تسجيل دفع'}</option>
              </select>
              {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tr('currency')} *
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className={`w-full p-2 border rounded-md ${errors.currency ? 'border-red-500' : 'border-gray-300'}`}
                required
              >
                <option value="USD">{tr('usd')}</option>
                <option value="TRY">{tr('try')}</option>
                <option value="SYP">{tr('syp')}</option>
              </select>
              {errors.currency && <p className="text-red-500 text-sm mt-1">{errors.currency}</p>}
            </div>
          </div>

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

          {/* Customer selection block */}
          <div className="space-y-3">
            <div className="flex gap-6 items-center">
              <label className="flex items-center gap-2">
                <input type="radio" name="customerSelectType" value="new" checked={customerSelectType === 'new'} onChange={(e) => setCustomerSelectType(e.target.value)} />
                {tr('newCustomer') || 'عميل جديد'}
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="customerSelectType" value="existing" checked={customerSelectType === 'existing'} onChange={(e) => setCustomerSelectType(e.target.value)} />
                {tr('existingCustomer') || 'عميل مسجل'}
              </label>
            </div>

            {customerSelectType === 'existing' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex gap-6 items-center">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="existingRole" value="receiver" checked={existingRole === 'receiver'} onChange={(e) => setExistingRole(e.target.value)} />
                    {tr('receivers') || 'المستلمين'}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="existingRole" value="sender" checked={existingRole === 'sender'} onChange={(e) => setExistingRole(e.target.value)} />
                    {tr('senders') || 'المرسلين'}
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('selectCustomer') || 'اختر العميل'}</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const c = customersRegistered.find(x => x.id === id);
                      setFormData(prev => ({
                        ...prev,
                        customerId: id,
                        customerName: c?.name || '',
                        customerPhone: c?.phone || '',
                        customerRole: existingRole
                      }));
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">{tr('chooseCustomer') || 'اختر عميل...'}</option>
                    {customersRegistered
                      .filter(c => existingRole === 'receiver' ? (c.type === 'receiver' || c.type === 'both') : (c.type === 'sender' || c.type === 'both'))
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name} - {c.phone}{c.type ? ` (${c.type === 'sender' ? 'مرسل' : c.type === 'receiver' ? 'مستلم' : 'كلاهما'})` : ''}</option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tr('type') || 'النوع'}</label>
                  <div className="flex gap-6 items-center">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="newRole" value="receiver" checked={newRole === 'receiver'} onChange={(e) => setNewRole(e.target.value)} />
                      {tr('receiver') || 'مستلم'}
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="newRole" value="sender" checked={newRole === 'sender'} onChange={(e) => setNewRole(e.target.value)} />
                      {tr('sender') || 'مرسل'}
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {tr('customerName')}
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value, customerRole: newRole })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder={tr('enterCustomerName')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {tr('customerPhone')}
                  </label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value, customerRole: newRole })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder={tr('enterCustomerPhone')}
                  />
                </div>
              </div>
            )}
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
                {tr('reference')}
              </label>
              <input
                type="text"
                value={formData.reference}
                readOnly
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                placeholder={tr('autoGenerated')}
              />
              <p className="text-xs text-gray-500 mt-1">
                {tr('referenceAutoGenerated')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tr('transactionDate')}
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
                {tr('transactionTime')}
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
              {isSubmitting ? tr('saving') : (transaction ? tr('update') : tr('add'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DailyJournalPage() {
  const navigate = useNavigate();
  const { tr } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]); // extracted from shipments (legacy)
  const [customersRegistered, setCustomersRegistered] = useState([]); // from customers collection
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    customer: '',
    currency: '',
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setIsLoading(true);
    
    // Fetch transactions
    const transactionsRef = collection(db, 'financial_transactions');
    const transactionsQuery = query(transactionsRef, orderBy('createdAt', 'desc'));
    const transactionsUnsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(transactionsData);
      setIsLoading(false);
    });

    // Fetch customers from shipments (legacy extract)
    const shipmentsRef = collection(db, 'shipments');
    const shipmentsUnsubscribe = onSnapshot(shipmentsRef, (snapshot) => {
      const customersSet = new Set();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.senderName) customersSet.add(JSON.stringify({ name: data.senderName, phone: data.senderPhone }));
        if (data.customerName) customersSet.add(JSON.stringify({ name: data.customerName, phone: data.customerPhone }));
      });
      
      const customersList = Array.from(customersSet).map(customer => JSON.parse(customer));
      setCustomers(customersList);
    });

    // Fetch registered customers (with roles)
    const customersRef = collection(db, 'customers');
    const customersUnsubscribe = onSnapshot(customersRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCustomersRegistered(list);
    });

    return () => {
      transactionsUnsubscribe();
      shipmentsUnsubscribe();
      customersUnsubscribe();
    };
  }, []);

  // Calculate statistics
  const calculateStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    const todayTransactions = transactions.filter(t => t.date === today);
    const thisMonthTransactions = transactions.filter(t => t.date.startsWith(thisMonth));
    
    const totalDebts = transactions.filter(t => t.type === 'debt').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalPayments = transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + (t.amount || 0), 0);
    const netBalance = totalDebts - totalPayments;
    
    const todayDebts = todayTransactions.filter(t => t.type === 'debt').reduce((sum, t) => sum + (t.amount || 0), 0);
    const todayPayments = todayTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + (t.amount || 0), 0);
    
    return {
      totalDebts,
      totalPayments,
      netBalance,
      todayDebts,
      todayPayments,
      todayTransactions: todayTransactions.length,
      thisMonthTransactions: thisMonthTransactions.length,
      totalTransactions: transactions.length
    };
  };

  const stats = calculateStats() || {
    totalDebts: 0,
    totalPayments: 0,
    netBalance: 0,
    todayDebts: 0,
    todayPayments: 0,
    todayTransactions: 0,
    thisMonthTransactions: 0,
    totalTransactions: 0
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = !filters.type || transaction.type === filters.type;
    const matchesCustomer = !filters.customer || 
      transaction.customerName?.toLowerCase().includes(filters.customer.toLowerCase()) ||
      transaction.customerPhone?.includes(filters.customer);
    const matchesCurrency = !filters.currency || transaction.currency === filters.currency;
    const matchesDateFrom = !filters.dateFrom || transaction.date >= filters.dateFrom;
    const matchesDateTo = !filters.dateTo || transaction.date <= filters.dateTo;
    const matchesAmountFrom = !filters.amountFrom || transaction.amount >= parseFloat(filters.amountFrom);
    const matchesAmountTo = !filters.amountTo || transaction.amount <= parseFloat(filters.amountTo);
    const matchesSearch = !searchTerm || 
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesCustomer && matchesCurrency && 
           matchesDateFrom && matchesDateTo && matchesAmountFrom && 
           matchesAmountTo && matchesSearch;
  });

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm(tr('confirmDeleteTransaction'))) {
      try {
        await deleteDoc(doc(db, 'financial_transactions', transactionId));
        alert(tr('transactionDeletedSuccess'));
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert(tr('errorDeletingTransaction'));
      }
    }
  };

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('دفتر اليومية');
    
    // Add headers
    sheet.columns = [
      { header: 'التاريخ', key: 'date', width: 12 },
      { header: 'الوقت', key: 'time', width: 10 },
      { header: 'نوع العملية', key: 'type', width: 15 },
      { header: 'اسم العميل', key: 'customerName', width: 25 },
      { header: 'هاتف العميل', key: 'customerPhone', width: 15 },
      { header: 'المبلغ', key: 'amount', width: 15 },
      { header: 'العملة', key: 'currency', width: 10 },
      { header: 'الوصف', key: 'description', width: 30 },
      { header: 'رقم المرجع', key: 'reference', width: 15 },
      { header: 'الحالة', key: 'status', width: 12 }
    ];

    // Add data
    filteredTransactions.forEach(transaction => {
      sheet.addRow({
        date: transaction.date,
        time: transaction.time,
        type: transaction.type === 'debt' ? 'تسجيل دين' : 'تسجيل دفع',
        customerName: transaction.customerName || '',
        customerPhone: transaction.customerPhone || '',
        amount: transaction.amount,
        currency: transaction.currency,
        description: transaction.description,
        reference: transaction.reference || '',
        status: transaction.status === 'completed' ? 'مكتملة' : 'معلقة'
      });
    });

    // Save file
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `دفتر_اليومية_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'debt': return <ArrowDownLeft className="w-5 h-5 text-red-600" />;
      case 'payment': return <ArrowUpRight className="w-5 h-5 text-green-600" />;
      default: return <Receipt className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'debt': return 'text-red-600 bg-red-50 border-red-200';
      case 'payment': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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
              <h1 className="text-3xl font-bold gradient-text">{tr('dailyJournal')}</h1>
            </div>
            <div className="flex gap-3">
              <AnimatedButton
                onClick={handleExport}
                variant="outline"
                icon={DownloadIcon}
              >
                {tr('exportTransactions')}
              </AnimatedButton>
              <AnimatedButton
                onClick={() => setIsModalOpen(true)}
                variant="primary"
                icon={PlusIcon}
              >
                {tr('addTransaction')}
              </AnimatedButton>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" variants={itemVariants}>
          <AnimatedCard className="p-6" delay={0.1}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{tr('netBalance')}</p>
                <p className="text-2xl font-bold text-gray-900">{(stats.netBalance || 0).toLocaleString()} USD</p>
              </div>
              <Wallet className="w-8 h-8 text-indigo-600" />
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" delay={0.2}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{tr('addDebt') || 'إجمالي الديون'}</p>
                <p className="text-2xl font-bold text-red-600">{(stats.totalDebts || 0).toLocaleString()} USD</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" delay={0.3}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{tr('addPayment') || 'إجمالي المدفوعات'}</p>
                <p className="text-2xl font-bold text-green-600">{(stats.totalPayments || 0).toLocaleString()} USD</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" delay={0.4}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{tr('totalTransactions')}</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalTransactions}</p>
              </div>
              <Receipt className="w-8 h-8 text-blue-600" />
            </div>
          </AnimatedCard>
        </motion.div>

        {/* Filters */}
        <motion.div className="mb-6" variants={itemVariants}>
          <AnimatedCard className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tr('filterByType')}</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">{tr('allTypes')}</option>
                  <option value="debt">{tr('addDebt') || 'تسجيل دين'}</option>
                  <option value="payment">{tr('addPayment') || 'تسجيل دفع'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tr('filterByCustomer')}</label>
                <input
                  type="text"
                  value={filters.customer}
                  onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={tr('searchTransactions')}
                />
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tr('filterByAmount')}</label>
                <input
                  type="number"
                  value={filters.amountFrom}
                  onChange={(e) => setFilters({ ...filters, amountFrom: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={tr('fromAmount')}
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={() => setFilters({
                  type: '',
                  customer: '',
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
                {tr('showing')} {filteredTransactions.length} {tr('of')} {transactions.length} {tr('transactions')}
              </span>
            </div>
          </AnimatedCard>
        </motion.div>

        {/* Transactions List */}
        <AnimatedCard className="p-6" delay={0.5}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{tr('financialTransactions')}</h3>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={tr('searchTransactions')}
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
                    <th className="p-3 text-center">{tr('transactionDate')}</th>
                    <th className="p-3 text-center">{tr('transactionType')}</th>
                    <th className="p-3 text-center">{tr('customerName')}</th>
                    <th className="p-3 text-center">{tr('amount')}</th>
                    <th className="p-3 text-center">{tr('description')}</th>
                    <th className="p-3 text-center">{tr('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <motion.tr 
                      key={transaction.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                      variants={itemVariants}
                    >
                      <td className="p-3 text-center">
                        <div className="text-sm">
                          <div className="font-medium">{transaction.date}</div>
                          <div className="text-gray-500">{transaction.time}</div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getTransactionColor(transaction.type)}`}>
                          {getTransactionIcon(transaction.type)}
                          {transaction.type === 'debt' ? (tr('addDebt') || 'تسجيل دين') : (tr('addPayment') || 'تسجيل دفع')}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="text-sm">
                          <div className="font-medium">{transaction.customerName || '-'}</div>
                          <div className="text-gray-500">{transaction.customerPhone || '-'}</div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="text-sm">
                          <div className={`font-medium ${transaction.type === 'debt' ? 'text-red-600' : 'text-green-600'}`}>
                            {transaction.type === 'debt' ? '+' : '-'}{(transaction.amount || 0).toLocaleString()} {transaction.currency}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="text-sm text-gray-700 max-w-xs">
                          <div className="truncate">{transaction.description}</div>
                          {transaction.reference && (
                            <div className="text-xs text-gray-500">
                              {tr('reference')}: {transaction.reference}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingTransaction(transaction);
                              setIsModalOpen(true);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title={tr('editTransaction')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id)}
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
              
              {filteredTransactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>{tr('noTransactions')}</p>
                  <p className="text-sm mt-2">
                    {tr('addNewTransaction')}
                  </p>
                </div>
              )}
            </div>
          )}
        </AnimatedCard>
      </motion.div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={() => {
          // Transactions will be updated via real-time listener
        }}
        transaction={editingTransaction}
        customers={customers}
        customersRegistered={customersRegistered}
      />
    </div>
  );
}
