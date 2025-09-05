import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useLanguage } from '../hooks/useLanguage';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';

export default function CustomersManagementPage() {
  const { tr, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'both',
    notes: ''
  });

  // استخراج العملاء من الشحنات الموجودة
  const extractCustomersFromShipments = async () => {
    try {
      const shipmentsRef = collection(db, 'shipments');
      const shipmentsSnapshot = await getDocs(shipmentsRef);
      
      const customersMap = new Map();
      
      shipmentsSnapshot.forEach(doc => {
        const shipment = doc.data();
        
        // إضافة المرسل
        if (shipment.senderName && shipment.senderPhone) {
          const senderKey = `${shipment.senderName}-${shipment.senderPhone}`;
          if (!customersMap.has(senderKey)) {
            customersMap.set(senderKey, {
              name: shipment.senderName,
              phone: shipment.senderPhone,
              type: 'sender',
              totalShipments: 0,
              totalDebt: 0,
              totalPaid: 0,
              balance: 0,
              lastShipmentDate: shipment.createdAt?.toDate() || new Date(),
              status: 'active',
              notes: 'مستخرج من الشحنات',
              createdAt: new Date(),
              extractedFromShipments: true
            });
          }
          customersMap.get(senderKey).totalShipments += 1;
        }
        
        // إضافة المستلم
        if (shipment.customerName && shipment.recipientPhone) {
          const receiverKey = `${shipment.customerName}-${shipment.recipientPhone}`;
          if (!customersMap.has(receiverKey)) {
            customersMap.set(receiverKey, {
              name: shipment.customerName,
              phone: shipment.recipientPhone,
              type: 'receiver',
              totalShipments: 0,
              totalDebt: 0,
              totalPaid: 0,
              balance: 0,
              lastShipmentDate: shipment.createdAt?.toDate() || new Date(),
              status: 'active',
              notes: 'مستخرج من الشحنات',
              createdAt: new Date(),
              extractedFromShipments: true
            });
          }
          customersMap.get(receiverKey).totalShipments += 1;
        }
      });
      
      return Array.from(customersMap.values());
    } catch (error) {
      console.error('Error extracting customers from shipments:', error);
      return [];
    }
  };

  // جلب العملاء
  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      
      // جلب العملاء من مجموعة customers
      const customersRef = collection(db, 'customers');
      const customersSnapshot = await getDocs(customersRef);
      const existingCustomers = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // إذا لم توجد عملاء، استخرج من الشحنات مرة واحدة فقط
      if (existingCustomers.length === 0) {
        console.log('No customers found, extracting from shipments...');
        const extractedCustomers = await extractCustomersFromShipments();
        
        // حفظ العملاء المستخرجين في قاعدة البيانات
        for (const customer of extractedCustomers) {
          await addDoc(collection(db, 'customers'), customer);
        }
        
        console.log(`Extracted and saved ${extractedCustomers.length} customers`);
        setCustomers(extractedCustomers);
        setFilteredCustomers(extractedCustomers);
      } else {
        console.log(`Found ${existingCustomers.length} existing customers`);
        setCustomers(existingCustomers);
        setFilteredCustomers(existingCustomers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // فلترة العملاء
  useEffect(() => {
    let filtered = customers;
    
    // فلترة حسب النوع
    if (filterType !== 'all') {
      filtered = filtered.filter(customer => customer.type === filterType);
    }
    
    // فلترة حسب البحث
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      );
    }
    
    setFilteredCustomers(filtered);
  }, [customers, searchTerm, filterType]);

  // إضافة عميل جديد
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      const customerData = {
        ...formData,
        totalShipments: 0,
        totalDebt: 0,
        totalPaid: 0,
        balance: 0,
        status: 'active',
        createdAt: new Date()
      };
      
      await addDoc(collection(db, 'customers'), customerData);
      setShowAddModal(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        type: 'both',
        notes: ''
      });
      fetchCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  // حذف عميل
  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm(tr('confirmDelete'))) {
      try {
        await deleteDoc(doc(db, 'customers', customerId));
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  // إحصائيات سريعة
  const getStats = () => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const totalDebt = customers.reduce((sum, c) => sum + (c.totalDebt || 0), 0);
    const totalPaid = customers.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
    
    return { totalCustomers, activeCustomers, totalDebt, totalPaid };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
            <span>{tr('back')}</span>
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {tr('customersManagement')}
        </h1>
        <p className="text-gray-600">
          {tr('customersManagementDescription')}
        </p>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">{tr('totalCustomers')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">{tr('activeCustomers')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCustomers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">{tr('totalDebt')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDebt.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">{tr('totalPaid')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* أدوات البحث والفلترة */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={tr('searchCustomers')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div className="md:w-48">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">{tr('allTypes')}</option>
              <option value="sender">{tr('senders')}</option>
              <option value="receiver">{tr('receivers')}</option>
              <option value="both">{tr('both')}</option>
            </select>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            {tr('addCustomer')}
          </button>
        </div>
      </div>

      {/* قائمة العملاء */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  {tr('customer')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  {tr('type')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  {tr('shipments')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  {tr('balance')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  {tr('lastShipment')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  {tr('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer, index) => (
                <motion.tr
                  key={customer.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Users className="h-4 w-4 text-indigo-600" />
                        </div>
                      </div>
                      <div className="mr-3 min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate text-right">
                          {customer.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate text-right">
                          {customer.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.type === 'sender' ? 'bg-blue-100 text-blue-800' :
                      customer.type === 'receiver' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {customer.type === 'sender' ? tr('sender') :
                       customer.type === 'receiver' ? tr('receiver') :
                       tr('both')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    {customer.totalShipments || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={`font-medium ${
                      (customer.balance || 0) > 0 ? 'text-red-600' :
                      (customer.balance || 0) < 0 ? 'text-green-600' :
                      'text-gray-600'
                    }`}>
                      {(customer.balance || 0).toLocaleString()} USD
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <div className="text-center">
                      {customer.lastShipmentDate ? 
                        new Date(customer.lastShipmentDate.seconds * 1000).toLocaleDateString() :
                        '-'
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setEditingCustomer(customer)}
                        className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
                        title={tr('viewDetails') || 'عرض التفاصيل'}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate('/debts')}
                        className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                        title={tr('debtsManagement') || 'إدارة الديون'}
                      >
                        <DollarSign className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                        title={tr('delete') || 'حذف'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-lg">
              {tr('noCustomers') || 'لا يوجد عملاء'}
            </div>
          )}
        </div>
      </div>

      {/* Modal إضافة عميل */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {tr('addCustomer')}
            </h3>
            
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tr('customerName')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tr('phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tr('email')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tr('type')}
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="sender">{tr('sender')}</option>
                  <option value="receiver">{tr('receiver')}</option>
                  <option value="both">{tr('both')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tr('notes')}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  {tr('add')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  {tr('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal عرض تفاصيل العميل */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {tr('customerDetails') || 'تفاصيل العميل'}
              </h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{editingCustomer.name}</h4>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {editingCustomer.phone}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">{tr('type')}</p>
                  <p className="font-medium text-gray-900">
                    {editingCustomer.type === 'sender' ? tr('sender') :
                     editingCustomer.type === 'receiver' ? tr('receiver') :
                     tr('both')}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">{tr('shipments')}</p>
                  <p className="font-medium text-gray-900">{editingCustomer.totalShipments || 0}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">{tr('totalDebt')}</p>
                  <p className="font-medium text-gray-900">{(editingCustomer.totalDebt || 0).toLocaleString()} USD</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-gray-600">{tr('totalPaid')}</p>
                  <p className="font-medium text-gray-900">{(editingCustomer.totalPaid || 0).toLocaleString()} USD</p>
                </div>
              </div>
              
              {editingCustomer.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{tr('notes')}</p>
                  <p className="text-gray-900">{editingCustomer.notes}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => navigate('/debts')}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  {tr('debtsManagement') || 'إدارة الديون'}
                </button>
                <button
                  onClick={() => setEditingCustomer(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  {tr('close') || 'إغلاق'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
