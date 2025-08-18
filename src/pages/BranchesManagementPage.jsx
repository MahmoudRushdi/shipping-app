import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ArrowLeftIcon, PlusCircleIcon } from '../components/Icons';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedLoader from '../components/AnimatedLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, MapPin, Phone, Edit, Trash2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BranchesManagementPage() {
    const navigate = useNavigate();
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [formData, setFormData] = useState({
        branchName: '',
        location: '',
        phone: '',
        managerName: '',
        managerPhone: '',
        status: 'active',
        notes: ''
    });

    useEffect(() => {
        setIsLoading(true);
        const branchesCollection = collection(db, 'branches');
        const unsubscribe = onSnapshot(branchesCollection, (snapshot) => {
            const branchesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBranches(branchesData);
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
            if (editingBranch) {
                // Update existing branch
                await updateDoc(doc(db, 'branches', editingBranch.id), {
                    ...formData,
                    updatedAt: new Date()
                });
            } else {
                // Add new branch
                await addDoc(collection(db, 'branches'), {
                    ...formData,
                    createdAt: new Date()
                });
            }
            
            // Reset form and close modal
            setFormData({
                branchName: '',
                location: '',
                phone: '',
                managerName: '',
                managerPhone: '',
                status: 'active',
                notes: ''
            });
            setEditingBranch(null);
            setIsModalOpen(false);
            
            alert(editingBranch ? 'تم تحديث الفرع بنجاح!' : 'تم إضافة الفرع بنجاح!');
        } catch (error) {
            console.error('Error saving branch:', error);
            alert('حدث خطأ أثناء حفظ الفرع. يرجى المحاولة مرة أخرى.');
        }
    };

    const handleEdit = (branch) => {
        setEditingBranch(branch);
        setFormData({
            branchName: branch.branchName || '',
            location: branch.location || '',
            phone: branch.phone || '',
            managerName: branch.managerName || '',
            managerPhone: branch.managerPhone || '',
            status: branch.status || 'active',
            notes: branch.notes || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (branchId) => {
        if (window.confirm('هل أنت متأكد من أنك تريد حذف هذا الفرع؟')) {
            try {
                await deleteDoc(doc(db, 'branches', branchId));
                alert('تم حذف الفرع بنجاح!');
            } catch (error) {
                console.error('Error deleting branch:', error);
                alert('حدث خطأ أثناء حذف الفرع.');
            }
        }
    };

    const openAddModal = () => {
        setEditingBranch(null);
        setFormData({
            branchName: '',
            location: '',
            phone: '',
            managerName: '',
            managerPhone: '',
            status: 'active',
            notes: ''
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBranch(null);
        setFormData({
            branchName: '',
            location: '',
            phone: '',
            managerName: '',
            managerPhone: '',
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
                            <h1 className="text-3xl font-bold gradient-text">إدارة الفروع</h1>
                        </div>
                        <AnimatedButton
                            onClick={openAddModal}
                            variant="primary"
                            icon={PlusCircleIcon}
                        >
                            إضافة فرع جديد
                        </AnimatedButton>
                    </div>
                </motion.div>

                {/* Statistics */}
                <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={itemVariants}>
                    <AnimatedCard className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">إجمالي الفروع</p>
                                <p className="text-2xl font-bold text-gray-900">{branches.length}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Building className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </AnimatedCard>
                    
                    <AnimatedCard className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">الفروع النشطة</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {branches.filter(b => b.status === 'active').length}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Building className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </AnimatedCard>
                    
                    <AnimatedCard className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">الفروع المتوقفة</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {branches.filter(b => b.status === 'inactive').length}
                                </p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-lg">
                                <Building className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </AnimatedCard>
                </motion.div>

                {/* Branches List */}
                <AnimatedCard className="overflow-hidden" delay={1}>
                    {isLoading ? (
                        <div className="p-20 text-center">
                            <AnimatedLoader 
                                type="ring" 
                                size="xl" 
                                color="indigo" 
                                text="جاري تحميل الفروع..."
                            />
                        </div>
                    ) : (
                        <>
                            {/* Mobile View */}
                            <div className="md:hidden">
                                <div className="p-4 space-y-4">
                                    <AnimatePresence>
                                        {branches.map((branch, index) => (
                                            <motion.div
                                                key={branch.id}
                                                variants={itemVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="hidden"
                                                transition={{ delay: index * 0.1 }}
                                                className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-200"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-gray-900">{branch.branchName}</h3>
                                                        <p className="text-sm text-gray-600 flex items-center gap-1">
                                                            <MapPin className="w-4 h-4" />
                                                            {branch.location}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                        branch.status === 'active' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {branch.status === 'active' ? 'نشط' : 'متوقف'}
                                                    </span>
                                                </div>
                                                
                                                <div className="space-y-2 mb-4">
                                                    <p className="text-sm flex items-center gap-1">
                                                        <Phone className="w-4 h-4" />
                                                        <strong>الهاتف:</strong> {branch.phone}
                                                    </p>
                                                    <p className="text-sm"><strong>المدير:</strong> {branch.managerName}</p>
                                                    <p className="text-sm"><strong>هاتف المدير:</strong> {branch.managerPhone}</p>
                                                </div>
                                                
                                                <div className="flex items-center justify-end gap-2 border-t pt-3">
                                                    <AnimatedButton
                                                        onClick={() => handleEdit(branch)}
                                                        variant="outline"
                                                        size="sm"
                                                        icon={Edit}
                                                    />
                                                    <AnimatedButton
                                                        onClick={() => handleDelete(branch.id)}
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
                                            <th className="p-4 font-semibold">اسم الفرع</th>
                                            <th className="p-4 font-semibold">الموقع</th>
                                            <th className="p-4 font-semibold">الهاتف</th>
                                            <th className="p-4 font-semibold">المدير</th>
                                            <th className="p-4 font-semibold">هاتف المدير</th>
                                            <th className="p-4 font-semibold">الحالة</th>
                                            <th className="p-4 font-semibold">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        <AnimatePresence>
                                            {branches.map((branch, index) => (
                                                <motion.tr
                                                    key={branch.id}
                                                    variants={itemVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="hidden"
                                                    transition={{ delay: index * 0.05 }}
                                                    className="hover:bg-gray-50/80 backdrop-blur-sm transition-colors duration-200"
                                                >
                                                    <td className="p-4 font-medium text-gray-900">{branch.branchName}</td>
                                                    <td className="p-4">{branch.location}</td>
                                                    <td className="p-4">{branch.phone}</td>
                                                    <td className="p-4">{branch.managerName}</td>
                                                    <td className="p-4">{branch.managerPhone}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                            branch.status === 'active' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {branch.status === 'active' ? 'نشط' : 'متوقف'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <AnimatedButton
                                                                onClick={() => handleEdit(branch)}
                                                                variant="outline"
                                                                size="sm"
                                                                icon={Edit}
                                                            />
                                                            <AnimatedButton
                                                                onClick={() => handleDelete(branch.id)}
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
                    
                    {branches.length === 0 && !isLoading && (
                        <motion.div 
                            className="text-center py-20"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">لا توجد فروع. قم بإضافة فرع جديد.</p>
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
                                {editingBranch ? 'تعديل الفرع' : 'إضافة فرع جديد'}
                            </h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">اسم الفرع</label>
                                        <input
                                            type="text"
                                            name="branchName"
                                            value={formData.branchName}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                            placeholder="اسم الفرع"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">الموقع</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                            placeholder="الموقع"
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">هاتف الفرع</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                            placeholder="هاتف الفرع"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">اسم المدير</label>
                                        <input
                                            type="text"
                                            name="managerName"
                                            value={formData.managerName}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                            placeholder="اسم المدير"
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">هاتف المدير</label>
                                        <input
                                            type="tel"
                                            name="managerPhone"
                                            value={formData.managerPhone}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                            placeholder="هاتف المدير"
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
                                            <option value="active">نشط</option>
                                            <option value="inactive">متوقف</option>
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
                                        {editingBranch ? 'تحديث الفرع' : 'إضافة الفرع'}
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