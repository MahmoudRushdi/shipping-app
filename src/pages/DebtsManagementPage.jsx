import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useLanguage } from '../hooks/useLanguage';
import { motion } from 'framer-motion';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import { useNavigate } from 'react-router-dom';
import { Users, Receipt, Plus, ArrowLeft, Home } from 'lucide-react';
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

function AddDebtModal({ isOpen, onClose, customer, onAdded }) {
  const { tr } = useLanguage();
  const [form, setForm] = useState({ type: 'debt', amount: '', currency: 'USD', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({ type: 'debt', amount: '', currency: 'USD', description: '' });
    }
  }, [isOpen]);

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount) return;
    setLoading(true);
    try {
      // Generate reference number
      const referenceNumber = await generateReferenceNumber();
      
      await addDoc(collection(db, 'financial_transactions'), {
        type: form.type, // debt: دين على العميل, payment: دفع من العميل
        amount: parseFloat(form.amount),
        currency: form.currency,
        description: form.description,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        reference: referenceNumber,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerRole: customer.type || '',
        createdAt: serverTimestamp(),
        status: 'completed'
      });
      onAdded?.();
      onClose();
    } catch (err) {
      console.error('Error adding debt transaction:', err);
      alert(tr('errorAddingTransaction') || 'حدث خطأ عند إضافة العملية');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <h3 className="text-xl font-bold mb-4">{tr('addTransaction') || 'إضافة عملية'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('transactionType') || 'نوع العملية'}</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="type" 
                  value="debt" 
                  checked={form.type === 'debt'}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="mr-3"
                />
                <span className="text-red-600 font-medium">{tr('addDebt') || 'تسجيل دين'}</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="type" 
                  value="payment" 
                  checked={form.type === 'payment'}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="mr-3"
                />
                <span className="text-green-600 font-medium">{tr('addPayment') || 'تسجيل دفع'}</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tr('amount') || 'المبلغ'}</label>
              <input className="w-full p-2 border rounded-md" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tr('currency') || 'العملة'}</label>
              <select className="w-full p-2 border rounded-md" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="USD">USD</option>
                <option value="TRY">TRY</option>
                <option value="SYP">SYP</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('description') || 'الوصف'}</label>
            <input className="w-full p-2 border rounded-md" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={form.type === 'debt' ? 'سبب الدين...' : 'تفاصيل الدفع...'} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">{tr('cancel') || 'إلغاء'}</button>
            <button type="submit" disabled={loading} className={`px-4 py-2 text-white rounded-md ${form.type === 'debt' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
              {loading ? (tr('saving') || 'حفظ...') : (form.type === 'debt' ? (tr('addDebt') || 'تسجيل دين') : (tr('addPayment') || 'تسجيل دفع'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DebtsManagementPage() {
  const { tr } = useLanguage();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledgerFilter, setLedgerFilter] = useState({ type: '', dateFrom: '', dateTo: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCustomers(list);
    });
    const unsubTx = onSnapshot(collection(db, 'financial_transactions'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(list);
    });
    return () => { unsubCustomers(); unsubTx(); };
  }, []);

  const rows = useMemo(() => {
    const byCustomerId = new Map();
    customers.forEach(c => {
      byCustomerId.set(c.id, { customer: c, totalDebt: 0, totalPaid: 0 });
    });
    transactions.forEach(t => {
      const matchById = t.customerId && byCustomerId.get(t.customerId);
      const entry = matchById || null;
      if (entry) {
        if (t.type === 'debt') entry.totalDebt += t.amount || 0;
        if (t.type === 'payment') entry.totalPaid += t.amount || 0;
      }
    });
    const result = Array.from(byCustomerId.values()).map(r => ({
      ...r,
      balance: r.totalDebt - r.totalPaid
    }));
    const filtered = result.filter(r => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (r.customer.name || '').toLowerCase().includes(q) || (r.customer.phone || '').includes(q);
    });
    return filtered.sort((a, b) => (b.balance - a.balance));
  }, [customers, transactions, search]);

  const customerLedger = useMemo(() => {
    if (!selectedCustomer) return [];
    return transactions
      .filter(t => t.customerId === selectedCustomer.id)
      .filter(t => !ledgerFilter.type || t.type === ledgerFilter.type)
      .filter(t => !ledgerFilter.dateFrom || (t.date || '').localeCompare(ledgerFilter.dateFrom) >= 0)
      .filter(t => !ledgerFilter.dateTo || (t.date || '').localeCompare(ledgerFilter.dateTo) <= 0)
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [transactions, selectedCustomer, ledgerFilter]);

  const exportLedger = async () => {
    if (!selectedCustomer) return;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Ledger');
    ws.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Time', key: 'time', width: 10 },
      { header: 'Reference', key: 'reference', width: 16 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Amount', key: 'amount', width: 14 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Description', key: 'description', width: 40 }
    ];
    customerLedger.forEach(t => ws.addRow({
      date: t.date,
      time: t.time,
      reference: t.reference || '',
      type: t.type === 'debt' ? 'تسجيل دين' : 'تسجيل دفع',
      amount: t.amount,
      currency: t.currency,
      description: t.description
    }));
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `ledger_${selectedCustomer.name}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 font-sans" dir="rtl">
      <motion.div className="max-w-6xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="mb-6 flex items-center justify-between" variants={itemVariants}>
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold">{tr('debtsManagement') || 'إدارة الديون'}</h1>
          </div>
          <div className="flex gap-3">
            <AnimatedButton variant="outline" onClick={() => navigate('/dashboard')} icon={Home}>{tr('dashboard') || 'الداشبورد'}</AnimatedButton>
            <AnimatedButton variant="outline" onClick={() => navigate('/daily-journal')} icon={Receipt}>{tr('dailyJournal') || 'دفتر اليومية'}</AnimatedButton>
          </div>
        </motion.div>

        <AnimatedCard className="p-4 mb-6">
          <div className="flex items-center gap-3">
            <input className="w-full px-3 py-2 border rounded-md" placeholder={tr('searchCustomers') || 'ابحث عن عميل...'} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-1/6 p-4 text-right font-semibold text-gray-700 border-b">{tr('customerName') || 'اسم العميل'}</th>
                  <th className="w-1/6 p-4 text-right font-semibold text-gray-700 border-b">{tr('phone') || 'الهاتف'}</th>
                  <th className="w-1/6 p-4 text-right font-semibold text-gray-700 border-b">{tr('totalDebt') || 'إجمالي الديون'}</th>
                  <th className="w-1/6 p-4 text-right font-semibold text-gray-700 border-b">{tr('totalPaid') || 'المدفوع'}</th>
                  <th className="w-1/6 p-4 text-right font-semibold text-gray-700 border-b">{tr('balance') || 'الرصيد'}</th>
                  <th className="w-1/6 p-4 text-right font-semibold text-gray-700 border-b">{tr('actions') || 'إجراءات'}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.customer.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-right font-medium text-gray-900">{r.customer.name}</td>
                    <td className="p-4 text-right text-gray-600">{r.customer.phone}</td>
                    <td className="p-4 text-right text-red-600 font-medium">{r.totalDebt.toLocaleString()} USD</td>
                    <td className="p-4 text-right text-green-600 font-medium">{r.totalPaid.toLocaleString()} USD</td>
                    <td className={`p-4 text-right font-bold ${r.balance < 0 ? 'text-red-600' : r.balance > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {r.balance.toLocaleString()} USD
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg inline-flex items-center gap-2 hover:bg-indigo-700 transition-colors text-sm font-medium" 
                        onClick={() => { setSelectedCustomer(r.customer); setIsModalOpen(true); }}
                      >
                        <Plus className="w-4 h-4" /> {tr('addTransaction') || 'إضافة عملية'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="text-center py-12 text-gray-500 text-lg">{tr('noCustomers') || 'لا يوجد عملاء'}</div>
            )}
          </div>
        </AnimatedCard>

        {selectedCustomer && (
          <AnimatedCard className="mt-6 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{tr('customerLedger') || 'كشف حساب العميل'}: {selectedCustomer.name}</h3>
              <div className="flex gap-3">
                <AnimatedButton variant="outline" onClick={exportLedger}><Receipt className="w-4 h-4" /> {tr('export') || 'تصدير'}</AnimatedButton>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <select className="p-2 border rounded-md" value={ledgerFilter.type} onChange={(e) => setLedgerFilter({ ...ledgerFilter, type: e.target.value })}>
                <option value="">{tr('allTypes') || 'كل الأنواع'}</option>
                <option value="debt">{tr('addDebt') || 'تسجيل دين'}</option>
                <option value="payment">{tr('addPayment') || 'تسجيل دفع'}</option>
              </select>
              <input className="p-2 border rounded-md" type="date" value={ledgerFilter.dateFrom} onChange={(e) => setLedgerFilter({ ...ledgerFilter, dateFrom: e.target.value })} />
              <input className="p-2 border rounded-md" type="date" value={ledgerFilter.dateTo} onChange={(e) => setLedgerFilter({ ...ledgerFilter, dateTo: e.target.value })} />
              <button className="p-2 border rounded-md" onClick={() => setLedgerFilter({ type: '', dateFrom: '', dateTo: '' })}>{tr('clearFilters') || 'مسح الفلاتر'}</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-1/5 p-3 text-right font-semibold text-gray-700 border-b">{tr('transactionDate') || 'التاريخ'}</th>
                    <th className="w-1/5 p-3 text-right font-semibold text-gray-700 border-b">{tr('reference') || 'رقم المرجع'}</th>
                    <th className="w-1/5 p-3 text-right font-semibold text-gray-700 border-b">{tr('transactionType') || 'النوع'}</th>
                    <th className="w-1/5 p-3 text-right font-semibold text-gray-700 border-b">{tr('amount') || 'المبلغ'}</th>
                    <th className="w-1/5 p-3 text-right font-semibold text-gray-700 border-b">{tr('description') || 'الوصف'}</th>
                  </tr>
                </thead>
                <tbody>
                  {customerLedger.map(t => (
                    <tr key={t.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-right text-gray-600 font-medium">{t.date} {t.time}</td>
                      <td className="p-3 text-right text-gray-500 font-mono text-sm">{t.reference || '-'}</td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          t.type === 'debt' ? 'bg-red-100 text-red-800' : 
                          'bg-green-100 text-green-800'
                        }`}>
                          {t.type === 'debt' ? (tr('addDebt') || 'تسجيل دين') : (tr('addPayment') || 'تسجيل دفع')}
                        </span>
                      </td>
                      <td className={`p-3 text-right font-bold ${t.type === 'debt' ? 'text-red-600' : 'text-green-600'}`}>
                        {t.type === 'debt' ? '+' : '-'}{(t.amount || 0).toLocaleString()} {t.currency}
                      </td>
                      <td className="p-3 text-right text-gray-700 max-w-xs truncate">{t.description || '-'}</td>
                    </tr>
                  ))}
                  {customerLedger.length === 0 && (
                    <tr><td className="p-6 text-center text-gray-500 text-lg" colSpan={5}>{tr('noTransactions') || 'لا توجد عمليات'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </AnimatedCard>
        )}

        <AddDebtModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} customer={selectedCustomer} onAdded={() => {}} />
      </motion.div>
    </div>
  );
}


