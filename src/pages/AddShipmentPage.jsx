import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, getDocs, query, where, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { ArrowLeftIcon } from '../components/Icons';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import ShipmentForm from '../components/ShipmentForm';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';

export default function AddShipmentPage() {
    const navigate = useNavigate();
    const { language, tr } = useLanguage();
    const { shipmentId } = useParams(); // للتحقق من وجود ID للتعديل
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        shipmentId: `SHP-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
        customerName: '',
        recipientPhone: '',
        senderName: '',
        senderPhone: '',
        governorate: '',
        parcelType: '',
        weight: '',
        parcelCount: '',
        goodsValue: '',
        goodsCurrency: 'USD',
        shippingFee: '',
        shippingFeeCurrency: 'USD',
        shippingFeePaymentMethod: 'collect',
        transferFee: '',
        transferFeeCurrency: 'USD',
        transferFeePaymentMethod: 'collect',
        internalTransferFee: '',
        internalTransferFeeCurrency: 'USD',
        notes: ''
    });
    const [customers, setCustomers] = useState([]);
    // Recipient controls
    const [customerType, setCustomerType] = useState('new');
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [recipientExistingRole, setRecipientExistingRole] = useState('receiver');
    const [recipientRole, setRecipientRole] = useState('receiver');
    // Sender controls
    const [senderType, setSenderType] = useState('new');
    const [selectedSender, setSelectedSender] = useState('');
    const [senderExistingRole, setSenderExistingRole] = useState('sender');
    const [senderRole, setSenderRole] = useState('sender');

    // Check if we're editing an existing shipment
    useEffect(() => {
        const checkIfEditing = async () => {
            if (shipmentId) {
                setIsEditing(true);
                try {
                    const shipmentDoc = await getDoc(doc(db, 'shipments', shipmentId));
                    if (shipmentDoc.exists()) {
                        const shipmentData = shipmentDoc.data();
                        setFormData({
                            shipmentId: shipmentData.shipmentId || '',
                            customerName: shipmentData.customerName || '',
                            recipientPhone: shipmentData.recipientPhone || '',
                            senderName: shipmentData.senderName || '',
                            senderPhone: shipmentData.senderPhone || '',
                            governorate: shipmentData.governorate || '',
                            parcelType: shipmentData.parcelType || '',
                            weight: shipmentData.weight || '',
                            parcelCount: shipmentData.parcelCount || '',
                            goodsValue: shipmentData.goodsValue || '',
                            goodsCurrency: shipmentData.goodsCurrency || 'USD',
                            shippingFee: shipmentData.shippingFee || '',
                            shippingFeeCurrency: shipmentData.shippingFeeCurrency || 'USD',
                            shippingFeePaymentMethod: shipmentData.shippingFeePaymentMethod || 'collect',
                            transferFee: shipmentData.transferFee || '',
                            transferFeeCurrency: shipmentData.transferFeeCurrency || 'USD',
                            transferFeePaymentMethod: shipmentData.transferFeePaymentMethod || 'collect',
                            internalTransferFee: shipmentData.internalTransferFee || '',
                            internalTransferFeeCurrency: shipmentData.internalTransferFeeCurrency || 'USD',
                            notes: shipmentData.notes || ''
                        });
                    }
                } catch (error) {
                    console.error('Error fetching shipment:', error);
                }
            } else {
                // Generate new shipment ID for new shipments
                setFormData(prev => ({
                    ...prev,
                    shipmentId: `SHP-${crypto.randomUUID().split('-')[0].toUpperCase()}`
                }));
            }
        };

        checkIfEditing();
    }, [shipmentId]);

    // Fetch registered customers
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'customers'));
                const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setCustomers(list);
            } catch (err) {
                console.error('Error fetching customers:', err);
            }
        };
        fetchCustomers();
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
        setIsLoading(true);

        try {
            const shipmentData = {
                ...formData,
                status: 'pending',
                goodsValue: parseFloat(formData.goodsValue) || 0,
                shippingFee: parseFloat(formData.shippingFee) || 0,
                transferFee: parseFloat(formData.transferFee) || 0,
                internalTransferFee: parseFloat(formData.internalTransferFee) || 0,
                weight: parseFloat(formData.weight) || 0,
                parcelCount: parseInt(formData.parcelCount) || 1
            };

            // Upsert customers for new entries
            const upsertCustomer = async (name, phone, type) => {
                if (!name || !phone) return;
                try {
                    const q = query(collection(db, 'customers'), where('phone', '==', phone));
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        const docRef = snap.docs[0].ref;
                        const existing = snap.docs[0].data();
                        let newType = existing.type || type;
                        if (existing.type && existing.type !== type && existing.type !== 'both') {
                            newType = 'both';
                        }
                        await updateDoc(docRef, { name, phone, type: newType, updatedAt: serverTimestamp() });
                    } else {
                        const newRef = doc(collection(db, 'customers'));
                        await setDoc(newRef, { name, phone, type, createdAt: serverTimestamp() });
                    }
                } catch (err) {
                    console.error('Error upserting customer:', err);
                }
            };

            if (customerType === 'new') {
                await upsertCustomer(formData.customerName, formData.recipientPhone, recipientRole);
            }
            if (senderType === 'new') {
                await upsertCustomer(formData.senderName, formData.senderPhone, senderRole);
            }

            if (isEditing) {
                // Update existing shipment
                await updateDoc(doc(db, 'shipments', shipmentId), {
                    ...shipmentData,
                    updatedAt: serverTimestamp()
                });
                alert('تم تحديث الشحنة بنجاح!');
            } else {
                // Add new shipment
                shipmentData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'shipments'), shipmentData);
                alert('تم إضافة الشحنة بنجاح!');
            }
            
            navigate('/shipments');
        } catch (error) {
            console.error('Error saving shipment:', error);
            alert(`حدث خطأ أثناء ${isEditing ? 'تحديث' : 'إضافة'} الشحنة. يرجى المحاولة مرة أخرى.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCustomerTypeChange = (type) => {
        setCustomerType(type);
        if (type === 'new') {
            setSelectedCustomer('');
            setFormData(prev => ({ ...prev, customerName: '', recipientPhone: '' }));
        }
    };

    const handleCustomerSelect = (customerId) => {
        setSelectedCustomer(customerId);
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            setFormData(prev => ({
                ...prev,
                customerName: customer.name || '',
                recipientPhone: customer.phone || ''
            }));
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <motion.div 
                className="max-w-4xl mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div className="mb-8" variants={itemVariants}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <AnimatedButton
                                onClick={() => navigate('/shipments')}
                                variant="outline"
                                icon={ArrowLeftIcon}
                                size="sm"
                            >
                                {tr('backToShipments')}
                            </AnimatedButton>
                            <h1 className="text-3xl font-bold gradient-text">
                                {isEditing ? tr('editShipment') : tr('addNewShipment')}
                            </h1>
                        </div>
                    </div>
                </motion.div>

                {/* Form */}
                <AnimatedCard className="p-8" delay={1}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <motion.div variants={itemVariants}>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">{tr('basicInformation')}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{tr('shipmentNumber')}</label>
                                    <input
                                        type="text"
                                        name="shipmentId"
                                        value={formData.shipmentId}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                        placeholder={tr('shipmentNumber')}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{tr('parcelType')}</label>
                                    <input
                                        type="text"
                                        name="parcelType"
                                        value={formData.parcelType}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                        placeholder={tr('enterParcelType')}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Customer Information */}
                        <motion.div variants={itemVariants}>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">{tr('customerInformation')}</h2>
                            <div className="mb-3 flex gap-6 items-center">
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="customerType" value="new" checked={customerType === 'new'} onChange={(e) => handleCustomerTypeChange(e.target.value)} />
                                    {tr('newCustomer') || 'عميل جديد'}
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="customerType" value="existing" checked={customerType === 'existing'} onChange={(e) => handleCustomerTypeChange(e.target.value)} />
                                    {tr('existingCustomer') || 'عميل مسجل'}
                                </label>
                            </div>

                            {customerType === 'existing' ? (
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex gap-6 items-center">
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name="recipientExistingRole" value="receiver" checked={recipientExistingRole === 'receiver'} onChange={(e) => setRecipientExistingRole(e.target.value)} />
                                            {tr('receivers') || 'المستلمين'}
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name="recipientExistingRole" value="sender" checked={recipientExistingRole === 'sender'} onChange={(e) => setRecipientExistingRole(e.target.value)} />
                                            {tr('senders') || 'المرسلين'}
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{tr('selectCustomer') || 'اختر العميل'}</label>
                                        <select
                                            value={selectedCustomer}
                                            onChange={(e) => handleCustomerSelect(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                        >
                                            <option value="">{tr('chooseCustomer') || 'اختر عميل...'}</option>
                                            {customers
                                                .filter(c => recipientExistingRole === 'receiver' ? (c.type === 'receiver' || c.type === 'both') : (c.type === 'sender' || c.type === 'both'))
                                                .map(c => (
                                                    <option key={c.id} value={c.id}>{c.name} - {c.phone}{c.type ? ` (${c.type === 'sender' ? 'مرسل' : c.type === 'receiver' ? 'مستلم' : 'كلاهما'})` : ''}</option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md-grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{tr('type') || 'النوع'}</label>
                                        <div className="flex gap-6 items-center">
                                            <label className="flex items-center gap-2">
                                                <input type="radio" name="recipientRole" value="receiver" checked={recipientRole === 'receiver'} onChange={(e) => setRecipientRole(e.target.value)} />
                                                {tr('receiver') || 'مستلم'}
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input type="radio" name="recipientRole" value="sender" checked={recipientRole === 'sender'} onChange={(e) => setRecipientRole(e.target.value)} />
                                                {tr('sender') || 'مرسل'}
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{tr('customerName')}</label>
                                        <input
                                            type="text"
                                            name="customerName"
                                            value={formData.customerName}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                            placeholder={tr('customerName')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{tr('customerPhone')}</label>
                                        <input
                                            type="tel"
                                            name="recipientPhone"
                                            value={formData.recipientPhone}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                            placeholder={tr('phoneNumber')}
                                        />
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Sender Information */}
                        <motion.div variants={itemVariants}>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">{tr('senderInformation')}</h2>
                            <div className="mb-3 flex gap-6 items-center">
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="senderType" value="new" checked={senderType === 'new'} onChange={(e) => setSenderType(e.target.value)} />
                                    {tr('newCustomer') || 'عميل جديد'}
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="senderType" value="existing" checked={senderType === 'existing'} onChange={(e) => setSenderType(e.target.value)} />
                                    {tr('existingCustomer') || 'عميل مسجل'}
                                </label>
                            </div>

                            {senderType === 'existing' ? (
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex gap-6 items-center">
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name="senderExistingRole" value="sender" checked={senderExistingRole === 'sender'} onChange={(e) => setSenderExistingRole(e.target.value)} />
                                            {tr('senders') || 'المرسلين'}
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name="senderExistingRole" value="receiver" checked={senderExistingRole === 'receiver'} onChange={(e) => setSenderExistingRole(e.target.value)} />
                                            {tr('receivers') || 'المستلمين'}
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{tr('selectCustomer') || 'اختر العميل'}</label>
                                        <select
                                            value={selectedSender}
                                            onChange={(e) => {
                                                setSelectedSender(e.target.value);
                                                const c = customers.find(x => x.id === e.target.value);
                                                if (c) setFormData(prev => ({ ...prev, senderName: c.name || '', senderPhone: c.phone || '' }));
                                            }}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                        >
                                            <option value="">{tr('chooseCustomer') || 'اختر عميل...'}</option>
                                            {customers
                                                .filter(c => senderExistingRole === 'sender' ? (c.type === 'sender' || c.type === 'both') : (c.type === 'receiver' || c.type === 'both'))
                                                .map(c => (
                                                    <option key={c.id} value={c.id}>{c.name} - {c.phone}{c.type ? ` (${c.type === 'sender' ? 'مرسل' : c.type === 'receiver' ? 'مستلم' : 'كلاهما'})` : ''}</option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{tr('type') || 'النوع'}</label>
                                        <div className="flex gap-6 items-center">
                                            <label className="flex items-center gap-2">
                                                <input type="radio" name="senderRole" value="sender" checked={senderRole === 'sender'} onChange={(e) => setSenderRole(e.target.value)} />
                                                {tr('sender') || 'مرسل'}
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input type="radio" name="senderRole" value="receiver" checked={senderRole === 'receiver'} onChange={(e) => setSenderRole(e.target.value)} />
                                                {tr('receiver') || 'مستلم'}
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{tr('senderName')}</label>
                                        <input
                                            type="text"
                                            name="senderName"
                                            value={formData.senderName}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                            placeholder={tr('senderName')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{tr('senderPhone')}</label>
                                        <input
                                            type="tel"
                                            name="senderPhone"
                                            value={formData.senderPhone}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                            placeholder={tr('phoneNumber')}
                                        />
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Location and Package Details */}
                        <motion.div variants={itemVariants}>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">{tr('locationAndPackageDetails')}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{tr('governorate')}</label>
                                    <select
                                        name="governorate"
                                        value={formData.governorate}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    >
                                        <option value="">{tr('selectGovernorate')}</option>
                                        <option value={tr('nicosia')}>{tr('nicosia')}</option>
                                        <option value={tr('famagusta')}>{tr('famagusta')}</option>
                                        <option value={tr('kyrenia')}>{tr('kyrenia')}</option>
                                        <option value={tr('morphou')}>{tr('morphou')}</option>
                                        <option value={tr('iskele')}>{tr('iskele')}</option>
                                        <option value={tr('lefke')}>{tr('lefke')}</option>
                                        <option value={tr('güzelyurt')}>{tr('güzelyurt')}</option>
                                        <option value={tr('dipkarpaz')}>{tr('dipkarpaz')}</option>
                                        <option value={tr('bogaz')}>{tr('bogaz')}</option>
                                        <option value={tr('akdogan')}>{tr('akdogan')}</option>
                                        <option value={tr('ercan')}>{tr('ercan')}</option>
                                        <option value={tr('karpaz')}>{tr('karpaz')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{tr('weightKg')}</label>
                                    <input
                                        type="number"
                                        name="weight"
                                        value={formData.weight}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                        placeholder={tr('weightInKg')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{tr('parcelCount')}</label>
                                    <input
                                        type="number"
                                        name="parcelCount"
                                        value={formData.parcelCount}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                        placeholder={tr('parcelCount')}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Financial Information */}
                        <motion.div variants={itemVariants}>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">{tr('financialInformation')}</h2>
                            
                            {/* Goods Value */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{tr('goodsValue')}</label>
                                    <input
                                        type="number"
                                        name="goodsValue"
                                        value={formData.goodsValue}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                        placeholder={tr('goodsValue')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{tr('goodsCurrency')}</label>
                                    <select
                                        name="goodsCurrency"
                                        value={formData.goodsCurrency}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    >
                                        <option value="USD">{tr('usd')}</option>
                                        <option value="TRY">{tr('try')}</option>
                                        <option value="SYP">{tr('syp')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Shipping Fee */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{tr('shippingFee')}</label>
                                    <input
                                        type="number"
                                        name="shippingFee"
                                        value={formData.shippingFee}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                        placeholder={tr('shippingFee')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{tr('shippingFeeCurrency')}</label>
                                    <select
                                        name="shippingFeeCurrency"
                                        value={formData.shippingFeeCurrency}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    >
                                        <option value="USD">{tr('usd')}</option>
                                        <option value="TRY">{tr('try')}</option>
                                        <option value="SYP">{tr('syp')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{tr('shippingFeePaymentMethod')}</label>
                                    <select
                                        name="shippingFeePaymentMethod"
                                        value={formData.shippingFeePaymentMethod}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    >
                                        <option value="collect">{tr('collect')}</option>
                                        <option value="prepaid">{tr('prepaid')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Transfer Fee */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{tr('transferFee')}</label>
                                    <input
                                        type="number"
                                        name="transferFee"
                                        value={formData.transferFee}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                        placeholder={tr('transferFee')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{tr('transferFeeCurrency')}</label>
                                    <select
                                        name="transferFeeCurrency"
                                        value={formData.transferFeeCurrency}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    >
                                        <option value="USD">{tr('usd')}</option>
                                        <option value="TRY">{tr('try')}</option>
                                        <option value="SYP">{tr('syp')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{tr('transferFeePaymentMethod')}</label>
                                    <select
                                        name="transferFeePaymentMethod"
                                        value={formData.transferFeePaymentMethod}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    >
                                        <option value="collect">{tr('collect')}</option>
                                        <option value="prepaid">{tr('prepaid')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Internal Transfer Fee */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{tr('internalTransferFee')}</label>
                                    <input
                                        type="number"
                                        name="internalTransferFee"
                                        value={formData.internalTransferFee}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                        placeholder={tr('internalTransferFee')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{tr('internalTransferFeeCurrency')}</label>
                                    <select
                                        name="internalTransferFeeCurrency"
                                        value={formData.internalTransferFeeCurrency}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    >
                                        <option value="USD">{tr('usd')}</option>
                                        <option value="TRY">{tr('try')}</option>
                                        <option value="SYP">{tr('syp')}</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>

                        {/* Notes */}
                        <motion.div variants={itemVariants}>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">{tr('additionalNotes')}</h2>
                            <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">{tr('notes')}</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    placeholder={tr('anyAdditionalNotes')}
                                />
                            </div>
                        </motion.div>

                        {/* Submit Button */}
                        <motion.div variants={itemVariants} className="flex justify-end gap-4 pt-6 border-t">
                            <AnimatedButton
                                type="button"
                                onClick={() => navigate('/shipments')}
                                variant="outline"
                            >
                                {tr('cancel')}
                            </AnimatedButton>
                            <AnimatedButton
                                type="submit"
                                variant="primary"
                                loading={isLoading}
                            >
                                {isLoading ? `${isEditing ? tr('updating') : tr('adding')}...` : `${isEditing ? tr('updateShipment') : tr('addShipment')}`}
                            </AnimatedButton>
                        </motion.div>
                    </form>
                </AnimatedCard>
            </motion.div>
        </div>
    );
} 