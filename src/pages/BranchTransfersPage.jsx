import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ArrowLeftIcon, PlusIcon, DownloadIcon, FilterIcon } from '../components/Icons';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedLoader from '../components/AnimatedLoader';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Building, ArrowRight, Calendar, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function BranchTransfersPage() {
    const navigate = useNavigate();
    const [transfers, setTransfers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingTransfer, setIsAddingTransfer] = useState(false);
    
    // Filters
    const [selectedFromBranch, setSelectedFromBranch] = useState('');
    const [selectedToBranch, setSelectedToBranch] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [minAmount, setMinAmount] = useState(0);
    
    // New transfer form
    const [newTransfer, setNewTransfer] = useState({
        fromBranch: '',
        toBranch: '',
        amount: '',
        currency: 'USD',
        description: '',
        transferType: 'payment', // payment = دفع، collection = تحصيل
        transferMethod: '',
        referenceNumber: '',
        notes: ''
    });

    useEffect(() => {
        setIsLoading(true);
        
        // Fetch transfers
        const transfersCollection = collection(db, 'financial_transactions');
        const transfersQuery = query(
            transfersCollection, 
            where('type', '==', 'transfer'),
            orderBy('createdAt', 'desc')
        );
        const transfersUnsubscribe = onSnapshot(transfersQuery, (snapshot) => {
            const transfersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransfers(transfersData);
        });

        // Fetch branches
        const branchesCollection = collection(db, 'branch_accounts');
        const branchesUnsubscribe = onSnapshot(branchesCollection, (snapshot) => {
            const branchesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBranches(branchesData);
            setIsLoading(false);
        });

        return () => {
            transfersUnsubscribe();
            branchesUnsubscribe();
        };
    }, []);

    // Filter transfers
    const filteredTransfers = transfers.filter(transfer => {
        const matchesFromBranch = !selectedFromBranch || transfer.fromBranch === selectedFromBranch;
        const matchesToBranch = !selectedToBranch || transfer.toBranch === selectedToBranch;
        const matchesStatus = !selectedStatus || transfer.status === selectedStatus;
        const matchesDate = !dateRange.start || !dateRange.end || 
            (transfer.date >= dateRange.start && transfer.date <= dateRange.end);
        const matchesAmount = transfer.amount >= minAmount;
        
        return matchesFromBranch && matchesToBranch && matchesStatus && matchesDate && matchesAmount;
    });

    // Calculate statistics
    const totalTransfers = filteredTransfers.length;
    const totalAmount = filteredTransfers.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const completedTransfers = filteredTransfers.filter(t => t.status === 'completed').length;
    const pendingTransfers = filteredTransfers.filter(t => t.status === 'pending').length;

    const handleAddTransfer = async (e) => {
        e.preventDefault();
        
        if (!newTransfer.fromBranch || !newTransfer.toBranch || !newTransfer.amount || !newTransfer.description) {
            alert('يرجى إدخال الفرع المرسل والفرع المستلم والمبلغ والوصف');
            return;
        }

        if (newTransfer.fromBranch === newTransfer.toBranch) {
            alert('لا يمكن إجراء عملية زمم لنفس الفرع');
            return;
        }

        setIsAddingTransfer(true);

        try {
            const transferData = {
                ...newTransfer,
                amount: parseFloat(newTransfer.amount),
                date: new Date().toISOString().split('T')[0],
                type: 'transfer',
                status: 'completed',
                createdBy: 'current_user_id', // TODO: Get from auth
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'financial_transactions'), transferData);

            // Reset form
            setNewTransfer({
                fromBranch: '',
                toBranch: '',
                amount: '',
                currency: 'USD',
                description: '',
                transferType: 'payment',
                transferMethod: '',
                referenceNumber: '',
                notes: ''
            });

            alert('تم إضافة عملية الزمم بنجاح!');
        } catch (error) {
            console.error('Error adding transfer:', error);
            alert('حدث خطأ أثناء إضافة عملية الزمم');
        }

        setIsAddingTransfer(false);
    };

    const handleExport = async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('عمليات زمم');

        // Define columns
        sheet.columns = [
            { header: 'التاريخ', key: 'date', width: 15 },
            { header: 'الفرع المرسل', key: 'fromBranch', width: 20 },
            { header: 'الفرع المستلم', key: 'toBranch', width: 20 },
            { header: 'المبلغ', key: 'amount', width: 15 },
            { header: 'العملة', key: 'currency', width: 10 },
            { header: 'نوع العملية', key: 'transferType', width: 15 },
            { header: 'الوصف', key: 'description', width: 30 },
            { header: 'طريقة التحويل', key: 'transferMethod', width: 20 },
            { header: 'رقم المرجع', key: 'referenceNumber', width: 20 },
            { header: 'الحالة', key: 'status', width: 15 },
            { header: 'ملاحظات', key: 'notes', width: 25 }
        ];

        // Add header
        const headerRow = sheet.addRow([
            'التاريخ', 'الفرع المرسل', 'الفرع المستلم', 'المبلغ', 'العملة', 
            'نوع العملية', 'الوصف', 'طريقة التحويل', 'رقم المرجع', 'الحالة', 'ملاحظات'
        ]);

        // Style header
        headerRow.eachCell((cell) => {
            cell.style = {
                font: { bold: true, color: { argb: 'FFFFFFFF' } },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } },
                alignment: { horizontal: 'center', vertical: 'middle' }
            };
        });

        // Add data
        filteredTransfers.forEach(transfer => {
            const row = sheet.addRow([
                transfer.date || 'N/A',
                transfer.fromBranch || 'N/A',
                transfer.toBranch || 'N/A',
                transfer.amount,
                transfer.currency,
                transfer.transferType === 'payment' ? 'دفع' : 'تحصيل',
                transfer.description,
                transfer.transferMethod || 'غير محدد',
                transfer.referenceNumber || 'غير محدد',
                transfer.status === 'completed' ? 'مكتمل' : 'معلق',
                transfer.notes || ''
            ]);

            // Style data rows
            row.eachCell((cell) => {
                cell.style = {
                    alignment: { horizontal: 'center', vertical: 'middle' }
                };
            });
        });

        // Save file
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `عمليات_زمم_${new Date().toISOString().split('T')[0]}.xlsx`);
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
                                العودة للوحة التحكم
                            </AnimatedButton>
                            <h1 className="text-3xl font-bold gradient-text">عمليات زمم</h1>
                        </div>
                        <div className="flex gap-3">
                            <AnimatedButton
                                onClick={() => setIsAddingTransfer(true)}
                                variant="primary"
                                icon={PlusIcon}
                            >
                                إضافة عملية زمم جديدة
                            </AnimatedButton>
                            <AnimatedButton
                                onClick={handleExport}
                                variant="outline"
                                icon={DownloadIcon}
                            >
                                تصدير التقرير
                            </AnimatedButton>
                        </div>
                    </div>
                </motion.div>

                {/* Statistics Cards */}
                <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" variants={itemVariants}>
                    <AnimatedCard className="p-6" delay={0.1}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">إجمالي العمليات</p>
                                <p className="text-2xl font-bold text-blue-600">{totalTransfers}</p>
                            </div>
                            <Building className="w-8 h-8 text-blue-600" />
                        </div>
                    </AnimatedCard>

                    <AnimatedCard className="p-6" delay={0.2}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">إجمالي المبالغ</p>
                                <p className="text-2xl font-bold text-green-600">{totalAmount.toLocaleString()} USD</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-600" />
                        </div>
                    </AnimatedCard>

                    <AnimatedCard className="p-6" delay={0.3}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">العمليات المكتملة</p>
                                <p className="text-2xl font-bold text-green-600">{completedTransfers}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                    </AnimatedCard>

                    <AnimatedCard className="p-6" delay={0.4}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">العمليات المعلقة</p>
                                <p className="text-2xl font-bold text-orange-600">{pendingTransfers}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-orange-600" />
                        </div>
                    </AnimatedCard>
                </motion.div>

                {/* Filters */}
                <motion.div className="mb-6" variants={itemVariants}>
                    <AnimatedCard className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الفرع المرسل</label>
                                <select
                                    value={selectedFromBranch}
                                    onChange={(e) => setSelectedFromBranch(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">جميع الفروع</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.branchName}>
                                            {branch.branchName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الفرع المستلم</label>
                                <select
                                    value={selectedToBranch}
                                    onChange={(e) => setSelectedToBranch(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">جميع الفروع</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.branchName}>
                                            {branch.branchName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">جميع الحالات</option>
                                    <option value="completed">مكتمل</option>
                                    <option value="pending">معلق</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ الأدنى</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={minAmount}
                                    onChange={(e) => setMinAmount(parseFloat(e.target.value) || 0)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </AnimatedCard>
                </motion.div>

                {/* Transfers List */}
                <AnimatedCard className="p-6" delay={0.5}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">قائمة عمليات الزمم</h3>
                        <span className="text-sm text-gray-600">
                            عرض {filteredTransfers.length} من {transfers.length} عملية
                        </span>
                    </div>
                    
                    {isLoading ? (
                        <div className="p-20 text-center">
                            <AnimatedLoader 
                                type="ring" 
                                size="xl" 
                                color="indigo" 
                                text="جاري تحميل البيانات..."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="p-3 text-right">التاريخ</th>
                                        <th className="p-3 text-right">الفرع المرسل</th>
                                        <th className="p-3 text-right">الفرع المستلم</th>
                                        <th className="p-3 text-right">المبلغ</th>
                                        <th className="p-3 text-right">نوع العملية</th>
                                        <th className="p-3 text-right">الوصف</th>
                                        <th className="p-3 text-right">الحالة</th>
                                        <th className="p-3 text-right">ملاحظات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransfers.map((transfer) => (
                                        <motion.tr 
                                            key={transfer.id}
                                            className="border-b hover:bg-gray-50 transition-colors"
                                            variants={itemVariants}
                                        >
                                            <td className="p-3 text-center">
                                                {transfer.date || 'N/A'}
                                            </td>
                                            <td className="p-3 text-center font-medium text-red-600">
                                                {transfer.fromBranch || 'N/A'}
                                            </td>
                                            <td className="p-3 text-center font-medium text-green-600">
                                                {transfer.toBranch || 'N/A'}
                                            </td>
                                            <td className="p-3 text-center font-medium">
                                                {transfer.amount?.toLocaleString()} {transfer.currency}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                    transfer.transferType === 'payment' 
                                                        ? 'bg-red-100 text-red-800' 
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {transfer.transferType === 'payment' ? 'دفع' : 'تحصيل'}
                                                </span>
                                            </td>
                                            <td className="p-3">{transfer.description}</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                    transfer.status === 'completed' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                    {transfer.status === 'completed' ? 'مكتمل' : 'معلق'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center text-sm text-gray-600">
                                                {transfer.notes || '-'}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            {filteredTransfers.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <p>لا توجد عمليات زمم لعرضها</p>
                                    <p className="text-sm mt-2">
                                        تأكد من:
                                        <br />• وجود عمليات زمم مسجلة
                                        <br />• تطبيق الفلاتر المحددة
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </AnimatedCard>
            </motion.div>

            {/* Add Transfer Modal */}
            {isAddingTransfer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">إضافة عملية زمم جديدة</h3>
                        
                        <form onSubmit={handleAddTransfer} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        الفرع المرسل <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={newTransfer.fromBranch}
                                        onChange={(e) => setNewTransfer(prev => ({ ...prev, fromBranch: e.target.value }))}
                                        required
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">اختر الفرع المرسل</option>
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.branchName}>
                                                {branch.branchName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        الفرع المستلم <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={newTransfer.toBranch}
                                        onChange={(e) => setNewTransfer(prev => ({ ...prev, toBranch: e.target.value }))}
                                        required
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">اختر الفرع المستلم</option>
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.branchName}>
                                                {branch.branchName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        المبلغ <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={newTransfer.amount}
                                        onChange={(e) => setNewTransfer(prev => ({ ...prev, amount: e.target.value }))}
                                        required
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        العملة
                                    </label>
                                    <select
                                        value={newTransfer.currency}
                                        onChange={(e) => setNewTransfer(prev => ({ ...prev, currency: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="TRY">TRY</option>
                                        <option value="SYP">SYP</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        نوع العملية
                                    </label>
                                    <select
                                        value={newTransfer.transferType}
                                        onChange={(e) => setNewTransfer(prev => ({ ...prev, transferType: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="payment">دفع (فرع يدفع لفرع آخر)</option>
                                        <option value="collection">تحصيل (فرع يحصل من فرع آخر)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        طريقة التحويل
                                    </label>
                                    <select
                                        value={newTransfer.transferMethod}
                                        onChange={(e) => setNewTransfer(prev => ({ ...prev, transferMethod: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">اختر طريقة التحويل</option>
                                        <option value="bank_transfer">تحويل بنكي</option>
                                        <option value="cash">نقداً</option>
                                        <option value="check">شيك</option>
                                        <option value="other">أخرى</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    الوصف <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newTransfer.description}
                                    onChange={(e) => setNewTransfer(prev => ({ ...prev, description: e.target.value }))}
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="وصف عملية الزمم"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        رقم المرجع
                                    </label>
                                    <input
                                        type="text"
                                        value={newTransfer.referenceNumber}
                                        onChange={(e) => setNewTransfer(prev => ({ ...prev, referenceNumber: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="رقم المرجع أو الفاتورة"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ملاحظات
                                    </label>
                                    <textarea
                                        value={newTransfer.notes}
                                        onChange={(e) => setNewTransfer(prev => ({ ...prev, notes: e.target.value }))}
                                        rows="3"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="ملاحظات إضافية..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t">
                                <AnimatedButton
                                    type="button"
                                    onClick={() => setIsAddingTransfer(false)}
                                    variant="outline"
                                >
                                    إلغاء
                                </AnimatedButton>
                                <AnimatedButton
                                    type="submit"
                                    variant="primary"
                                    disabled={isAddingTransfer}
                                >
                                    {isAddingTransfer ? 'جاري الإضافة...' : 'إضافة العملية'}
                                </AnimatedButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
