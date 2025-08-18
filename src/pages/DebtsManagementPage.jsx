import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ArrowLeftIcon, PlusIcon, DownloadIcon, UserCheck, UserX } from '../components/Icons';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedLoader from '../components/AnimatedLoader';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function DebtsManagementPage() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingDebt, setIsAddingDebt] = useState(false);
    const [isAddingPayment, setIsAddingPayment] = useState(false);
    
    // Filters
    const [selectedCustomerType, setSelectedCustomerType] = useState('both');
    const [selectedBalanceType, setSelectedBalanceType] = useState('');
    const [minAmount, setMinAmount] = useState(0);
    
    // New debt form
    const [newDebt, setNewDebt] = useState({
        customerId: '',
        customerName: '',
        customerType: 'both', // both = مرسل ومستلم، sender = مرسل فقط، recipient = مستلم فقط
        debtType: 'debt', // debt = عليه دين، credit = له دين
        amount: '',
        currency: 'USD',
        description: '',
        dueDate: '',
        notes: ''
    });

    // New payment form
    const [newPayment, setNewPayment] = useState({
        customerId: '',
        customerName: '',
        amount: '',
        currency: 'USD',
        paymentMethod: '',
        description: '',
        notes: ''
    });

    useEffect(() => {
        setIsLoading(true);
        
        // Fetch customers
        const customersCollection = collection(db, 'customer_accounts');
        const customersQuery = query(customersCollection, orderBy('customerName'));
        const customersUnsubscribe = onSnapshot(customersQuery, (snapshot) => {
            const customersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCustomers(customersData);
        });

        // Fetch transactions
        const transactionsCollection = collection(db, 'financial_transactions');
        const transactionsQuery = query(transactionsCollection, orderBy('createdAt', 'desc'));
        const transactionsUnsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
            const transactionsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(transactionsData);
            setIsLoading(false);
        });

        return () => {
            customersUnsubscribe();
            transactionsUnsubscribe();
        };
    }, []);

    // Calculate customer balances from transactions
    const customersWithBalances = customers.map(customer => {
        const customerTransactions = transactions.filter(t => 
            t.customerId === customer.id || t.customerName === customer.customerName
        );

        let balance = 0;
        customerTransactions.forEach(transaction => {
            if (transaction.type === 'income') {
                balance += parseFloat(transaction.amount) || 0;
            } else if (transaction.type === 'expense') {
                balance -= parseFloat(transaction.amount) || 0;
            }
        });

        return {
            ...customer,
            balance: balance,
            totalDebt: balance < 0 ? Math.abs(balance) : 0,
            totalCredit: balance > 0 ? balance : 0,
            lastTransaction: customerTransactions.length > 0 ? customerTransactions[0].createdAt : null
        };
    });

    // Filter customers
    const filteredCustomers = customersWithBalances.filter(customer => {
        const matchesType = !selectedCustomerType || customer.customerType === selectedCustomerType;
        const matchesBalance = !selectedBalanceType || 
            (selectedBalanceType === 'debt' && customer.balance < 0) ||
            (selectedBalanceType === 'credit' && customer.balance > 0) ||
            (selectedBalanceType === 'zero' && customer.balance === 0);
        const matchesAmount = Math.abs(customer.balance) >= minAmount;
        
        return matchesType && matchesBalance && matchesAmount;
    });

    // Calculate statistics
    const totalDebts = filteredCustomers
        .filter(c => c.balance < 0)
        .reduce((sum, c) => sum + Math.abs(c.balance), 0);
    
    const totalCredits = filteredCustomers
        .filter(c => c.balance > 0)
        .reduce((sum, c) => sum + c.balance, 0);
    
    const netBalance = totalCredits - totalDebts;

    const handleAddDebt = async (e) => {
        e.preventDefault();
        
        if (!newDebt.customerId || !newDebt.amount || !newDebt.description) {
            alert('يرجى إدخال العميل والمبلغ والوصف');
            return;
        }

        setIsAddingDebt(true);

        try {
            const debtData = {
                ...newDebt,
                amount: parseFloat(newDebt.amount),
                date: new Date().toISOString().split('T')[0],
                type: newDebt.debtType === 'debt' ? 'expense' : 'income',
                status: 'completed',
                createdBy: 'current_user_id', // TODO: Get from auth
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'financial_transactions'), debtData);

            // Reset form
            setNewDebt({
                customerId: '',
                customerName: '',
                customerType: '',
                debtType: 'debt',
                amount: '',
                currency: 'USD',
                description: '',
                dueDate: '',
                notes: ''
            });

            alert('تم إضافة الدين بنجاح!');
        } catch (error) {
            console.error('Error adding debt:', error);
            alert('حدث خطأ أثناء إضافة الدين');
        }

        setIsAddingDebt(false);
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        
        if (!newPayment.customerId || !newPayment.amount || !newPayment.description) {
            alert('يرجى إدخال العميل والمبلغ والوصف');
            return;
        }

        setIsAddingPayment(true);

        try {
            const paymentData = {
                ...newPayment,
                amount: parseFloat(newPayment.amount),
                date: new Date().toISOString().split('T')[0],
                type: 'income', // Payment is always income
                status: 'completed',
                createdBy: 'current_user_id', // TODO: Get from auth
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'financial_transactions'), paymentData);

            // Reset form
            setNewPayment({
                customerId: '',
                customerName: '',
                amount: '',
                currency: 'USD',
                paymentMethod: '',
                description: '',
                notes: ''
            });

            alert('تم تسجيل الدفعة بنجاح!');
        } catch (error) {
            console.error('Error adding payment:', error);
            alert('حدث خطأ أثناء تسجيل الدفعة');
        }

        setIsAddingPayment(false);
    };

    const handleExport = async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('إدارة الديون');

        // Define columns
        sheet.columns = [
            { header: 'اسم العميل', key: 'customerName', width: 25 },
            { header: 'نوع العميل', key: 'customerType', width: 15 },
            { header: 'رصيد الحساب', key: 'balance', width: 20 },
            { header: 'إجمالي الدين عليه', key: 'totalDebt', width: 20 },
            { header: 'إجمالي ما له', key: 'totalCredit', width: 20 },
            { header: 'آخر عملية', key: 'lastTransaction', width: 20 },
            { header: 'الحالة', key: 'status', width: 15 }
        ];

        // Add header
        const headerRow = sheet.addRow([
            'اسم العميل', 'نوع العميل', 'رصيد الحساب', 'إجمالي الدين عليه', 
            'إجمالي ما له', 'آخر عملية', 'الحالة'
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
        filteredCustomers.forEach(customer => {
            const row = sheet.addRow([
                customer.customerName,
                customer.customerType === 'sender' ? 'مرسل فقط' : 
                customer.customerType === 'receiver' ? 'مستلم فقط' : 'مرسل ومستلم',
                customer.balance,
                customer.totalDebt,
                customer.totalCredit,
                customer.lastTransaction ? new Date(customer.lastTransaction.toDate()).toLocaleDateString('ar-EG') : 'N/A',
                customer.balance < 0 ? 'عليه دين' : customer.balance > 0 ? 'له دين' : 'متوازن'
            ]);

            // Style data rows
            row.eachCell((cell, colNumber) => {
                cell.style = {
                    alignment: { horizontal: 'center', vertical: 'middle' }
                };
                
                // Color balance column
                if (colNumber === 3) {
                    if (customer.balance < 0) {
                        cell.style.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
                    } else if (customer.balance > 0) {
                        cell.style.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } };
                    }
                }
            });
        });

        // Save file
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `إدارة_الديون_${new Date().toISOString().split('T')[0]}.xlsx`);
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
                            <h1 className="text-3xl font-bold gradient-text">إدارة الديون</h1>
                        </div>
                        <div className="flex gap-3">
                            <AnimatedButton
                                onClick={() => setIsAddingDebt(true)}
                                variant="primary"
                                icon={PlusIcon}
                            >
                                إضافة دين جديد
                            </AnimatedButton>
                            <AnimatedButton
                                onClick={() => setIsAddingPayment(true)}
                                variant="outline"
                                icon={UserCheck}
                            >
                                تسديد دين
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
                                <p className="text-sm font-medium text-gray-600">صافي الرصيد</p>
                                <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {netBalance.toLocaleString()} USD
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                    </AnimatedCard>

                    <AnimatedCard className="p-6" delay={0.2}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">إجمالي الديون</p>
                                <p className="text-2xl font-bold text-red-600">{totalDebts.toLocaleString()} USD</p>
                            </div>
                            <UserX className="w-8 h-8 text-red-600" />
                        </div>
                    </AnimatedCard>

                    <AnimatedCard className="p-6" delay={0.3}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">إجمالي ما للعملاء</p>
                                <p className="text-2xl font-bold text-green-600">{totalCredits.toLocaleString()} USD</p>
                            </div>
                            <UserCheck className="w-8 h-8 text-green-600" />
                        </div>
                    </AnimatedCard>

                    <AnimatedCard className="p-6" delay={0.4}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">عدد العملاء</p>
                                <p className="text-2xl font-bold text-gray-900">{filteredCustomers.length}</p>
                            </div>
                            <Users className="w-8 h-8 text-gray-600" />
                        </div>
                    </AnimatedCard>
                </motion.div>

                {/* Filters */}
                <motion.div className="mb-6" variants={itemVariants}>
                    <AnimatedCard className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">نوع العميل</label>
                                <select
                                    value={selectedCustomerType}
                                    onChange={(e) => setSelectedCustomerType(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="both">جميع الأنواع</option>
                                    <option value="sender">مرسل فقط</option>
                                    <option value="receiver">مستلم فقط</option>
                                    <option value="both">مرسل ومستلم</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">حالة الحساب</label>
                                <select
                                    value={selectedBalanceType}
                                    onChange={(e) => setSelectedBalanceType(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">جميع الحالات</option>
                                    <option value="debt">عليه دين</option>
                                    <option value="credit">له دين</option>
                                    <option value="zero">متوازن</option>
                                </select>
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

                            <div className="flex items-end">
                                <AnimatedButton
                                    onClick={() => {
                                        setSelectedCustomerType('both');
                                        setSelectedBalanceType('');
                                        setMinAmount(0);
                                    }}
                                    variant="outline"
                                    size="sm"
                                >
                                    إعادة تعيين الفلاتر
                                </AnimatedButton>
                            </div>
                        </div>
                    </AnimatedCard>
                </motion.div>

                {/* Customers List */}
                <AnimatedCard className="p-6" delay={0.5}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">قائمة حسابات العملاء</h3>
                        <span className="text-sm text-gray-600">
                            عرض {filteredCustomers.length} من {customers.length} عميل
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
                                        <th className="p-3 text-right">اسم العميل</th>
                                        <th className="p-3 text-right">نوع العميل</th>
                                        <th className="p-3 text-right">رصيد الحساب</th>
                                        <th className="p-3 text-right">إجمالي الدين عليه</th>
                                        <th className="p-3 text-right">إجمالي ما له</th>
                                        <th className="p-3 text-right">آخر عملية</th>
                                        <th className="p-3 text-right">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomers.map((customer) => (
                                        <motion.tr 
                                            key={customer.id}
                                            className="border-b hover:bg-gray-50 transition-colors"
                                            variants={itemVariants}
                                        >
                                            <td className="p-3 font-medium">{customer.customerName}</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                    customer.customerType === 'sender' 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : customer.customerType === 'receiver'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                    {customer.customerType === 'sender' ? 'مرسل فقط' : 
                                                     customer.customerType === 'receiver' ? 'مستلم فقط' : 'مرسل ومستلم'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center font-medium">
                                                <span className={`${customer.balance < 0 ? 'text-red-600' : customer.balance > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                                                    {customer.balance.toLocaleString()} USD
                                                </span>
                                            </td>
                                            <td className="p-3 text-center text-red-600">
                                                {customer.totalDebt.toLocaleString()} USD
                                            </td>
                                            <td className="p-3 text-center text-green-600">
                                                {customer.totalCredit.toLocaleString()} USD
                                            </td>
                                            <td className="p-3 text-center text-sm text-gray-600">
                                                {customer.lastTransaction ? 
                                                    new Date(customer.lastTransaction.toDate()).toLocaleDateString('ar-EG') : 'N/A'}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                    customer.balance < 0 
                                                        ? 'bg-red-100 text-red-800' 
                                                        : customer.balance > 0 
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {customer.balance < 0 ? 'عليه دين' : 
                                                     customer.balance > 0 ? 'له دين' : 'متوازن'}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            {filteredCustomers.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <p>لا توجد عملاء لعرضهم</p>
                                    <p className="text-sm mt-2">
                                        تأكد من:
                                        <br />• وجود عملاء مسجلين
                                        <br />• تطبيق الفلاتر المحددة
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </AnimatedCard>
            </motion.div>

            {/* Add Debt Modal */}
            {isAddingDebt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">إضافة دين جديد</h3>
                        
                        <form onSubmit={handleAddDebt} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        العميل <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={newDebt.customerId}
                                        onChange={(e) => {
                                            const customer = customers.find(c => c.id === e.target.value);
                                            setNewDebt(prev => ({ 
                                                ...prev, 
                                                customerId: e.target.value,
                                                customerName: customer ? customer.customerName : '',
                                                customerType: customer ? customer.customerType : ''
                                            }));
                                        }}
                                        required
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">اختر العميل</option>
                                        {customers.map(customer => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.customerName} ({customer.customerType === 'sender' ? 'مرسل فقط' : 
                                                                       customer.customerType === 'receiver' ? 'مستلم فقط' : 'مرسل ومستلم'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        نوع الدين <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={newDebt.debtType}
                                        onChange={(e) => setNewDebt(prev => ({ ...prev, debtType: e.target.value }))}
                                        required
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="debt">عليه دين (مدين)</option>
                                        <option value="credit">له دين (دائن)</option>
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
                                        value={newDebt.amount}
                                        onChange={(e) => setNewDebt(prev => ({ ...prev, amount: e.target.value }))}
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
                                        value={newDebt.currency}
                                        onChange={(e) => setNewDebt(prev => ({ ...prev, currency: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="TRY">TRY</option>
                                        <option value="SYP">SYP</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    الوصف <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newDebt.description}
                                    onChange={(e) => setNewDebt(prev => ({ ...prev, description: e.target.value }))}
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="وصف الدين"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        تاريخ الاستحقاق
                                    </label>
                                    <input
                                        type="date"
                                        value={newDebt.dueDate}
                                        onChange={(e) => setNewDebt(prev => ({ ...prev, dueDate: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ملاحظات
                                    </label>
                                    <textarea
                                        value={newDebt.notes}
                                        onChange={(e) => setNewDebt(prev => ({ ...prev, notes: e.target.value }))}
                                        rows="3"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="ملاحظات إضافية..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t">
                                <AnimatedButton
                                    type="button"
                                    onClick={() => setIsAddingDebt(false)}
                                    variant="outline"
                                >
                                    إلغاء
                                </AnimatedButton>
                                <AnimatedButton
                                    type="submit"
                                    variant="primary"
                                    disabled={isAddingDebt}
                                >
                                    {isAddingDebt ? 'جاري الإضافة...' : 'إضافة الدين'}
                                </AnimatedButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Payment Modal */}
            {isAddingPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">تسديد دين</h3>
                        
                        <form onSubmit={handleAddPayment} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        العميل <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={newPayment.customerId}
                                        onChange={(e) => {
                                            const customer = customers.find(c => c.id === e.target.value);
                                            setNewPayment(prev => ({ 
                                                ...prev, 
                                                customerId: e.target.value,
                                                customerName: customer ? customer.customerName : ''
                                            }));
                                        }}
                                        required
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">اختر العميل</option>
                                        {customers.map(customer => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.customerName} ({customer.customerType === 'sender' ? 'مرسل فقط' : 
                                                                       customer.customerType === 'receiver' ? 'مستلم فقط' : 'مرسل ومستلم'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        المبلغ المسدد <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={newPayment.amount}
                                        onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
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
                                        value={newPayment.currency}
                                        onChange={(e) => setNewPayment(prev => ({ ...prev, currency: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="TRY">TRY</option>
                                        <option value="SYP">SYP</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        طريقة الدفع
                                    </label>
                                    <select
                                        value={newPayment.paymentMethod}
                                        onChange={(e) => setNewPayment(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">اختر طريقة الدفع</option>
                                        <option value="cash">نقداً</option>
                                        <option value="bank">تحويل بنكي</option>
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
                                    value={newPayment.description}
                                    onChange={(e) => setNewPayment(prev => ({ ...prev, description: e.target.value }))}
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="وصف الدفعة"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ملاحظات
                                </label>
                                <textarea
                                    value={newPayment.notes}
                                    onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                                    rows="3"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="ملاحظات إضافية..."
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t">
                                <AnimatedButton
                                    type="button"
                                    onClick={() => setIsAddingPayment(false)}
                                    variant="outline"
                                >
                                    إلغاء
                                </AnimatedButton>
                                <AnimatedButton
                                    type="submit"
                                    variant="primary"
                                    disabled={isAddingPayment}
                                >
                                    {isAddingPayment ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
                                </AnimatedButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
