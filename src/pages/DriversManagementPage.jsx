import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ArrowLeftIcon, PlusCircleIcon } from '../components/Icons';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedLoader from '../components/AnimatedLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MapPin, Edit, Trash2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DriversManagementPage() {
    const navigate = useNavigate();
    const [drivers, setDrivers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [formData, setFormData] = useState({
        driverName: '',
        driverPhone: '',
        location: '',
        status: 'active',
        notes: ''
    });

    useEffect(() => {
        setIsLoading(true);
        const driversCollection = collection(db, 'drivers');
        const unsubscribe = onSnapshot(driversCollection, (snapshot) => {
            const driversData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDrivers(driversData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (editingDriver) {
                // Update existing driver
                await updateDoc(doc(db, 'drivers', editingDriver.id), {
                    ...formData,
                    updatedAt: serverTimestamp()
                });
            } else {
                // Add new driver
                await addDoc(collection(db, 'drivers'), {
                    ...formData,
                    totalTrips: 0,
                    totalEarnings: 0,
                    lastTripDate: null,
                    averageCommission: 0,
                    createdAt: serverTimestamp()
                });
            }
            
            // Reset form and close modal
            setFormData({
                driverName: '',
                driverPhone: '',
                location: '',
                status: 'active',
                notes: ''
            });
            setEditingDriver(null);
            setIsModalOpen(false);
            
            alert(editingDriver ? 'تم تحديث المندوب بنجاح!' : 'تم إضافة المندوب بنجاح!');
        } catch (error) {
            console.error('Error saving driver:', error);
            alert('حدث خطأ أثناء حفظ المندوب. يرجى المحاولة مرة أخرى.');
        }
    };

    const handleDelete = async (driverId) => {
        if (window.confirm('هل أنت متأكد من أنك تريد حذف هذا المندوب؟')) {
            try {
                await deleteDoc(doc(db, 'drivers', driverId));
                alert('تم حذف المندوب بنجاح!');
            } catch (error) {
                console.error('Error deleting driver:', error);
                alert('حدث خطأ أثناء حذف المندوب.');
            }
        }
    };

    const handleEdit = (driver) => {
        setEditingDriver(driver);
        setFormData({
            driverName: driver.driverName || '',
            driverPhone: driver.driverPhone || '',
            location: driver.location || '',
            status: driver.status || 'active',
            notes: driver.notes || ''
        });
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingDriver(null);
        setFormData({
            driverName: '',
            driverPhone: '',
            location: '',
            status: 'active',
            notes: ''
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingDriver(null);
        setFormData({
            driverName: '',
            driverPhone: '',
            location: '',
            status: 'active',
            notes: ''
        });
        setIsModalOpen(false);
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
                            <h1 className="text-3xl font-bold gradient-text">إدارة المناديب</h1>
                        </div>
                        <AnimatedButton
                            onClick={openAddModal}
                            variant="primary"
                            icon={PlusCircleIcon}
                        >
                            إضافة مندوب جديد
                        </AnimatedButton>
                    </div>
                </motion.div>

                {/* Drivers List */}
                <AnimatedCard className="p-6" delay={0.2}>
                    {isLoading ? (
                        <div className="p-20 text-center">
                            <AnimatedLoader 
                                type="ring" 
                                size="xl" 
                                color="indigo" 
                                text="جاري تحميل المناديب..."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="p-3 text-right">اسم المندوب</th>
                                        <th className="p-3 text-right">رقم الهاتف</th>
                                        <th className="p-3 text-right">المنطقة</th>
                                        <th className="p-3 text-right">عدد الرحلات</th>
                                        <th className="p-3 text-right">إجمالي الأجور</th>
                                        <th className="p-3 text-right">آخر رحلة</th>
                                        <th className="p-3 text-right">الحالة</th>
                                        <th className="p-3 text-right">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {drivers.map((driver) => (
                                        <motion.tr 
                                            key={driver.id}
                                            className="border-b hover:bg-gray-50 transition-colors"
                                            variants={itemVariants}
                                        >
                                            <td className="p-3 font-medium">{driver.driverName}</td>
                                            <td className="p-3">{driver.driverPhone}</td>
                                            <td className="p-3">{driver.location}</td>
                                            <td className="p-3 text-center">{driver.totalTrips || 0}</td>
                                            <td className="p-3 text-center">
                                                {driver.totalEarnings ? `${driver.totalEarnings.toLocaleString()} USD` : '0 USD'}
                                            </td>
                                            <td className="p-3 text-center">
                                                {driver.lastTripDate ? new Date(driver.lastTripDate.toDate()).toLocaleDateString('ar-EG') : 'لا يوجد'}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                    driver.status === 'active' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {driver.status === 'active' ? 'نشط' : 'غير نشط'}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(driver)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="تعديل"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(driver.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="حذف"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            {drivers.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <p>لا يوجد مناديب مسجلين حالياً</p>
                                </div>
                            )}
                        </div>
                    )}
                </AnimatedCard>

                {/* Add/Edit Modal */}
                <AnimatePresence>
                    {isModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h2 className="text-xl font-bold mb-4">
                                    {editingDriver ? 'تعديل المندوب' : 'إضافة مندوب جديد'}
                                </h2>
                                
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            اسم المندوب <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="driverName"
                                            value={formData.driverName}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="اسم المندوب"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            رقم الهاتف <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            name="driverPhone"
                                            value={formData.driverPhone}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="رقم الهاتف"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            المنطقة <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="المنطقة أو المحافظة"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            الحالة
                                        </label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="active">نشط</option>
                                            <option value="inactive">غير نشط</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            ملاحظات
                                        </label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="ملاحظات إضافية..."
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <AnimatedButton
                                            type="button"
                                            onClick={closeModal}
                                            variant="outline"
                                        >
                                            إلغاء
                                        </AnimatedButton>
                                        <AnimatedButton
                                            type="submit"
                                            variant="primary"
                                        >
                                            {editingDriver ? 'تحديث' : 'إضافة'}
                                        </AnimatedButton>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
