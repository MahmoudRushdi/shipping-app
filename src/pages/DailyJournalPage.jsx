import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ArrowLeftIcon, PlusIcon, DownloadIcon, FilterIcon } from '../components/Icons';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedLoader from '../components/AnimatedLoader';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Calendar, User, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function DailyJournalPage() {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingTransaction, setIsAddingTransaction] = useState(false);
    
    // Filters
    const [selectedType, setSelectedType] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [minAmount, setMinAmount] = useState(0);
    
    // New transaction form
    const [newTransaction, setNewTransaction] = useState({
        type: 'income',
        amount: '',
        currency: 'USD',
        description: '',
        category: '',
        customerId: '',
        customerName: '',
        customerType: '',
        fromBranch: '',
        toBranch: '',
        shipmentId: '',
        tripId: '',
        notes: ''
    });

    useEffect(() => {
        setIsLoading(true);
        
        // Fetch transactions
        const transactionsCollection = collection(db, 'financial_transactions');
        const transactionsQuery = query(transactionsCollection, orderBy('createdAt', 'desc'));
        const transactionsUnsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
            const transactionsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(transactionsData);
        });

        // Fetch customers
        const customersCollection = collection(db, 'customer_accounts');
        const customersUnsubscribe = onSnapshot(customersCollection, (snapshot) => {
            const customersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCustomers(customersData);
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
            transactionsUnsubscribe();
            customersUnsubscribe();
            branchesUnsubscribe();
        };
    }, []);

    // Calculate statistics
    const filteredTransactions = transactions.filter(transaction => {
        const matchesType = !selectedType || transaction.type === selectedType;
        const matchesBranch = !selectedBranch || 
            transaction.fromBranch === selectedBranch || 
            transaction.toBranch === selectedBranch;
        const matchesCustomer = !selectedCustomer || transaction.customerId === selectedCustomer;
        const matchesDate = !dateRange.start || !dateRange.end || 
            (transaction.date >= dateRange.start && transaction.date <= dateRange.end);
        const matchesAmount = transaction.amount >= minAmount;
        
        return matchesType && matchesBranch && matchesCustomer && matchesDate && matchesAmount;
    });

    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    const totalExpenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    const currentBalance = totalIncome - totalExpenses;

    const handleAddTransaction = async (e) => {
        e.preventDefault();
        
        if (!newTransaction.amount || !newTransaction.description) {
            alert('يرجى إدخال المبلغ والوصف');
            return;
        }

        setIsAddingTransaction(true);

        try {
            const transactionData = {
                ...newTransaction,
                amount: parseFloat(newTransaction.amount),
                date: new Date().toISOString().split('T')[0],
                status: 'completed',
                createdBy: 'current_user_id', // TODO: Get from auth
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'financial_transactions'), transactionData);

            // Reset form
            setNewTransaction({
                type: 'income',
                amount: '',
                currency: 'USD',
                description: '',
                category: '',
                customerId: '',
                customerName: '',
                customerType: '',
                fromBranch: '',
                toBranch: '',
                shipmentId: '',
                tripId: '',
                notes: ''
            });

            alert('تم إضافة العملية بنجاح!');
        } catch (error) {
            console.error('Error adding transaction:', error);
            alert('حدث خطأ أثناء إضافة العملية');
        }

        setIsAddingTransaction(false);
    };

    const handleExport = async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('دفتر اليومية');

        // Define columns
        sheet.columns = [
            { header: 'التاريخ', key: 'date', width: 15 },
            { header: 'نوع العملية', key: 'type', width: 15 },
            { header: 'المبلغ', key: 'amount', width: 15 },
            { header: 'العملة', key: 'currency', width: 10 },
            { header: 'الوصف', key: 'description', width: 30 },
            { header: 'الفئة', key: 'category', width: 20 },
            { header: 'العميل', key: 'customerName', width: 20 },
            { header: 'الفرع', key: 'branch', width: 15 },
            { header: 'الحالة', key: 'status', width: 15 },
            { header: 'ملاحظات', key: 'notes', width: 25 }
        ];

        // Add header
        const headerRow = sheet.addRow([
            'التاريخ', 'نوع العملية', 'المبلغ', 'العملة', 'الوصف', 
            'الفئة', 'العميل', 'الفرع', 'الحالة', 'ملاحظات'
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
        filteredTransactions.forEach(transaction => {
            const row = sheet.addRow([
                transaction.date || 'N/A',
                transaction.type === 'income' ? 'إيراد' : 
                transaction.type === 'expense' ? 'مصروف' : 
                transaction.type === 'transfer' ? 'تحويل' : 'دين',
                transaction.amount,
                transaction.currency,
                transaction.description,
                transaction.category || 'غير محدد',
                transaction.customerName || 'غير محدد',
                transaction.fromBranch || transaction.toBranch || 'غير محدد',
                transaction.status === 'completed' ? 'مكتمل' : 'معلق',
                transaction.notes || ''
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
        saveAs(new Blob([buffer]), `دفتر_اليومية_${new Date().toISOString().split('T')[0]}.xlsx`);
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
                            <h1 className="text-3xl font-bold gradient-text">دفتر اليومية</h1>
                        </div>
                        <div className="flex gap-3">
                            <AnimatedButton
                                onClick={() => setIsAddingTransaction(true)}
                                variant="primary"
                                icon={PlusIcon}
                            >
                                إضافة عملية جديدة
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
                                <p className="text-sm font-medium text-gray-600">رصيد الصندوق</p>
                                <p className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {currentBalance.toLocaleString()} USD
                                </p>
                            </div>
                            <Wallet className="w-8 h-8 text-blue-600" />
                        </div>
                    </AnimatedCard>

                    <AnimatedCard className="p-6" delay={0.2}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
                                <p className="text-2xl font-bold text-green-600">{totalIncome.toLocaleString()} USD</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                    </AnimatedCard>

                    <AnimatedCard className="p-6" delay={0.3}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">إجمالي المصروفات</p>
                                <p className="text-2xl font-bold text-red-600">{totalExpenses.toLocaleString()} USD</p>
                            </div>
                            <TrendingDown className="w-8 h-8 text-red-600" />
                        </div>
                    </AnimatedCard>

                    <AnimatedCard className="p-6" delay={0.4}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">عدد العمليات</p>
                                <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-gray-600" />
                        </div>
                    </AnimatedCard>
                </motion.div>

                {/* Filters */}
                <motion.div className="mb-6" variants={itemVariants}>
                    <AnimatedCard className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">نوع العملية</label>
                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">جميع الأنواع</option>
                                    <option value="income">إيراد</option>
                                    <option value="expense">مصروف</option>
                                    <option value="transfer">تحويل</option>
                                    <option value="debt">دين</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الفرع</label>
                                <select
                                    value={selectedBranch}
                                    onChange={(e) => setSelectedBranch(e.target.value)}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
                                <select
                                    value={selectedCustomer}
                                    onChange={(e) => setSelectedCustomer(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">جميع العملاء</option>
                                    {customers.map(customer => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.customerName}
                                        </option>
                                    ))}
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

                {/* Transactions List */}
                <AnimatedCard className="p-6" delay={0.5}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">قائمة العمليات المالية</h3>
                        <span className="text-sm text-gray-600">
                            عرض {filteredTransactions.length} من {transactions.length} عملية
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
                                        <th className="p-3 text-right">نوع العملية</th>
                                        <th className="p-3 text-right">المبلغ</th>
                                        <th className="p-3 text-right">الوصف</th>
                                        <th className="p-3 text-right">العميل/الفرع</th>
                                        <th className="p-3 text-right">الحالة</th>
                                        <th className="p-3 text-right">ملاحظات</th>
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
                                                {transaction.date || 'N/A'}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                    transaction.type === 'income' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : transaction.type === 'expense'
                                                        ? 'bg-red-100 text-red-800'
                                                        : transaction.type === 'transfer'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {transaction.type === 'income' ? 'إيراد' : 
                                                     transaction.type === 'expense' ? 'مصروف' : 
                                                     transaction.type === 'transfer' ? 'تحويل' : 'دين'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center font-medium">
                                                {transaction.amount?.toLocaleString()} {transaction.currency}
                                            </td>
                                            <td className="p-3">{transaction.description}</td>
                                            <td className="p-3 text-center">
                                                {transaction.customerName || transaction.fromBranch || transaction.toBranch || 'غير محدد'}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                    transaction.status === 'completed' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                    {transaction.status === 'completed' ? 'مكتمل' : 'معلق'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center text-sm text-gray-600">
                                                {transaction.notes || '-'}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            {filteredTransactions.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <p>لا توجد عمليات مالية لعرضها</p>
                                    <p className="text-sm mt-2">
                                        تأكد من:
                                        <br />• وجود عمليات مالية مسجلة
                                        <br />• تطبيق الفلاتر المحددة
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </AnimatedCard>
            </motion.div>

            {/* Add Transaction Modal */}
            {isAddingTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">إضافة عملية مالية جديدة</h3>
                        
                        <form onSubmit={handleAddTransaction} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        نوع العملية <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={newTransaction.type}
                                        onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value }))}
                                        required
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="income">إيراد</option>
                                        <option value="expense">مصروف</option>
                                        <option value="transfer">تحويل</option>
                                        <option value="debt">دين</option>
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
                                        value={newTransaction.amount}
                                        onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
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
                                        value={newTransaction.currency}
                                        onChange={(e) => setNewTransaction(prev => ({ ...prev, currency: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="TRY">TRY</option>
                                        <option value="SYP">SYP</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        الفئة
                                    </label>
                                    <select
                                        value={newTransaction.category}
                                        onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">اختر الفئة</option>
                                        <option value="shipping_fees">أجور الشحن</option>
                                        <option value="goods_value">قيمة البضاعة</option>
                                        <option value="driver_commission">عمولة المندوب</option>
                                        <option value="vehicle_expenses">مصروفات السيارة</option>
                                        <option value="branch_transfer">تحويل فرع</option>
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
                                    value={newTransaction.description}
                                    onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="وصف العملية المالية"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        العميل
                                    </label>
                                    <select
                                        value={newTransaction.customerId}
                                        onChange={(e) => {
                                            const customer = customers.find(c => c.id === e.target.value);
                                            setNewTransaction(prev => ({ 
                                                ...prev, 
                                                customerId: e.target.value,
                                                customerName: customer ? customer.customerName : '',
                                                customerType: customer ? customer.customerType : ''
                                            }));
                                        }}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">اختر العميل</option>
                                        {customers.map(customer => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.customerName} ({customer.customerType === 'sender' ? 'مرسل' : 'مستلم'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        الفرع
                                    </label>
                                    <select
                                        value={newTransaction.fromBranch}
                                        onChange={(e) => setNewTransaction(prev => ({ ...prev, fromBranch: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">اختر الفرع</option>
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.branchName}>
                                                {branch.branchName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ملاحظات
                                </label>
                                <textarea
                                    value={newTransaction.notes}
                                    onChange={(e) => setNewTransaction(prev => ({ ...prev, notes: e.target.value }))}
                                    rows="3"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="ملاحظات إضافية..."
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t">
                                <AnimatedButton
                                    type="button"
                                    onClick={() => setIsAddingTransaction(false)}
                                    variant="outline"
                                >
                                    إلغاء
                                </AnimatedButton>
                                <AnimatedButton
                                    type="submit"
                                    variant="primary"
                                    disabled={isAddingTransaction}
                                >
                                    {isAddingTransaction ? 'جاري الإضافة...' : 'إضافة العملية'}
                                </AnimatedButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
