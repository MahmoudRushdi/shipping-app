import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ArrowLeftIcon, PlusCircleIcon } from '../components/Icons';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedLoader from '../components/AnimatedLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Edit, Trash2, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VehiclesManagementPage() {
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [formData, setFormData] = useState({
        vehicleNumber: '',
        vehicleType: '',
        ownerName: '',
        ownerPhone: '',
        capacity: '',
        status: 'active',
        notes: ''
    });

    useEffect(() => {
        setIsLoading(true);
        const vehiclesCollection = collection(db, 'vehicles');
        const unsubscribe = onSnapshot(vehiclesCollection, (snapshot) => {
            const vehiclesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setVehicles(vehiclesData);
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
            if (editingVehicle) {
                // Update existing vehicle
                await updateDoc(doc(db, 'vehicles', editingVehicle.id), {
                    ...formData,
                    capacity: parseFloat(formData.capacity) || 0,
                    updatedAt: new Date()
                });
            } else {
                // Add new vehicle
                await addDoc(collection(db, 'vehicles'), {
                    ...formData,
                    capacity: parseFloat(formData.capacity) || 0,
                    createdAt: new Date()
                });
            }
            
            // Reset form and close modal
            setFormData({
                vehicleNumber: '',
                vehicleType: '',
                ownerName: '',
                ownerPhone: '',
                capacity: '',
                status: 'active',
                notes: ''
            });
            setEditingVehicle(null);
            setIsModalOpen(false);
            
            alert(editingVehicle ? 'تم تحديث السيارة بنجاح!' : 'تم إضافة السيارة بنجاح!');
        } catch (error) {
            console.error('Error saving vehicle:', error);
            alert('حدث خطأ أثناء حفظ السيارة. يرجى المحاولة مرة أخرى.');
        }
    };

    const handleEdit = (vehicle) => {
        setEditingVehicle(vehicle);
        setFormData({
            vehicleNumber: vehicle.vehicleNumber || '',
            vehicleType: vehicle.vehicleType || '',
            ownerName: vehicle.ownerName || vehicle.driverName || '',
            ownerPhone: vehicle.ownerPhone || vehicle.driverPhone || '',
            capacity: vehicle.capacity || '',
            status: vehicle.status || 'active',
            notes: vehicle.notes || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (vehicleId) => {
        if (window.confirm('هل أنت متأكد من أنك تريد حذف هذه السيارة؟')) {
            try {
                await deleteDoc(doc(db, 'vehicles', vehicleId));
                alert('تم حذف السيارة بنجاح!');
            } catch (error) {
                console.error('Error deleting vehicle:', error);
                alert('حدث خطأ أثناء حذف السيارة.');
            }
        }
    };

    const openAddModal = () => {
        setEditingVehicle(null);
        setFormData({
            vehicleNumber: '',
            vehicleType: '',
            driverName: '',
            driverPhone: '',
            capacity: '',
            status: 'active',
            notes: ''
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingVehicle(null);
        setFormData({
            vehicleNumber: '',
            vehicleType: '',
            driverName: '',
            driverPhone: '',
            capacity: '',
            status: 'active',
            notes: ''
        });
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
                className="max-w-full mx-auto"
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
                            <h1 className="text-3xl font-bold gradient-text">إدارة السيارات</h1>
                        </div>
                        <AnimatedButton
                            onClick={openAddModal}
                            variant="primary"
                            icon={PlusCircleIcon}
                        >
                            إضافة سيارة جديدة
                        </AnimatedButton>
                    </div>
                </motion.div>

                {/* Statistics */}
                <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={itemVariants}>
                    <AnimatedCard className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">إجمالي السيارات</p>
                                <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Truck className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </AnimatedCard>
                    
                    <AnimatedCard className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">السيارات النشطة</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {vehicles.filter(v => v.status === 'active').length}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Car className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </AnimatedCard>
                    
                    <AnimatedCard className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">السيارات المتوقفة</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {vehicles.filter(v => v.status === 'inactive').length}
                                </p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-lg">
                                <Truck className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </AnimatedCard>
                </motion.div>

                {/* Vehicles List */}
                <AnimatedCard className="overflow-hidden" delay={1}>
                    {isLoading ? (
                        <div className="p-20 text-center">
                            <AnimatedLoader 
                                type="ring" 
                                size="xl" 
                                color="indigo" 
                                text="جاري تحميل السيارات..."
                            />
                        </div>
                    ) : (
                        <>
                            {/* Mobile View */}
                            <div className="md:hidden">
                                <div className="p-4 space-y-4">
                                    <AnimatePresence>
                                        {vehicles.map((vehicle, index) => (
                                            <motion.div
                                                key={vehicle.id}
                                                variants={itemVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="hidden"
                                                transition={{ delay: index * 0.1 }}
                                                className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-200"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-gray-900">{vehicle.vehicleNumber}</h3>
                                                        <p className="text-sm text-gray-600">{vehicle.vehicleType}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                        vehicle.status === 'active' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {vehicle.status === 'active' ? 'نشطة' : 'متوقفة'}
                                                    </span>
                                                </div>
                                                
                                                <div className="space-y-2 mb-4">
                                                    <p className="text-sm"><strong>صاحب السيارة:</strong> {vehicle.ownerName || vehicle.driverName}</p>
                                                    <p className="text-sm"><strong>الهاتف:</strong> {vehicle.ownerPhone || vehicle.driverPhone}</p>
                                                    <p className="text-sm"><strong>الوجهة:</strong> {vehicle.destination || 'غير محدد'}</p>
                                                    <p className="text-sm"><strong>السعة:</strong> {vehicle.capacity} طن</p>
                                                </div>
                                                
                                                <div className="flex items-center justify-end gap-2 border-t pt-3">
                                                    <AnimatedButton
                                                        onClick={() => handleEdit(vehicle)}
                                                        variant="outline"
                                                        size="sm"
                                                        icon={Edit}
                                                    />
                                                    <AnimatedButton
                                                        onClick={() => handleDelete(vehicle.id)}
                                                        variant="outline"
                                                        size="sm"
                                                        icon={Trash2}
                                                        className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                                                    />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Desktop View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                        <tr>
                                            <th className="p-4 font-semibold">رقم السيارة</th>
                                            <th className="p-4 font-semibold">نوع السيارة</th>
                                            <th className="p-4 font-semibold">صاحب السيارة</th>
                                            <th className="p-4 font-semibold">هاتف صاحب السيارة</th>
                                            <th className="p-4 font-semibold">الوجهة</th>
                                            <th className="p-4 font-semibold">السعة (طن)</th>
                                            <th className="p-4 font-semibold">الحالة</th>
                                            <th className="p-4 font-semibold">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        <AnimatePresence>
                                            {vehicles.map((vehicle, index) => (
                                                <motion.tr
                                                    key={vehicle.id}
                                                    variants={itemVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="hidden"
                                                    transition={{ delay: index * 0.05 }}
                                                    className="hover:bg-gray-50/80 backdrop-blur-sm transition-colors duration-200"
                                                >
                                                    <td className="p-4 font-medium text-gray-900">{vehicle.vehicleNumber}</td>
                                                    <td className="p-4">{vehicle.vehicleType}</td>
                                                    <td className="p-4">{vehicle.ownerName || vehicle.driverName}</td>
                                                    <td className="p-4">{vehicle.ownerPhone || vehicle.driverPhone}</td>
                                                    <td className="p-4">{vehicle.destination || '-'}</td>
                                                    <td className="p-4">{vehicle.capacity}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                            vehicle.status === 'active' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {vehicle.status === 'active' ? 'نشطة' : 'متوقفة'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <AnimatedButton
                                                                onClick={() => handleEdit(vehicle)}
                                                                variant="outline"
                                                                size="sm"
                                                                icon={Edit}
                                                            />
                                                            <AnimatedButton
                                                                onClick={() => handleDelete(vehicle.id)}
                                                                variant="outline"
                                                                size="sm"
                                                                icon={Trash2}
                                                                className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                                                            />
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                    
                    {vehicles.length === 0 && !isLoading && (
                        <motion.div 
                            className="text-center py-20"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">لا توجد سيارات. قم بإضافة سيارة جديدة.</p>
                        </motion.div>
                    )}
                </AnimatedCard>
            </motion.div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {editingVehicle ? 'تعديل السيارة' : 'إضافة سيارة جديدة'}
                            </h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">رقم السيارة</label>
                                        <input
                                            type="text"
                                            name="vehicleNumber"
                                            value={formData.vehicleNumber}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                            placeholder="رقم السيارة"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">نوع السيارة</label>
                                        <input
                                            type="text"
                                            name="vehicleType"
                                            value={formData.vehicleType}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                            placeholder="اكتب نوع السيارة"
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">اسم صاحب السيارة</label>
                                        <input
                                            type="text"
                                            name="ownerName"
                                            value={formData.ownerName}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                            placeholder="اسم صاحب السيارة"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">هاتف صاحب السيارة</label>
                                        <input
                                            type="tel"
                                            name="ownerPhone"
                                            value={formData.ownerPhone}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                            placeholder="رقم الهاتف"
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">السعة (طن)</label>
                                        <input
                                            type="number"
                                            name="capacity"
                                            value={formData.capacity}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                            placeholder="السعة بالطن"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                        >
                                            <option value="active">نشطة</option>
                                            <option value="inactive">متوقفة</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                        placeholder="أي ملاحظات إضافية..."
                                    />
                                </div>
                                
                                <div className="flex justify-end gap-4 pt-6 border-t">
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
                                        {editingVehicle ? 'تحديث السيارة' : 'إضافة السيارة'}
                                    </AnimatedButton>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 