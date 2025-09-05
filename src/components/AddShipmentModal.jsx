import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '/src/firebaseConfig';

export default function AddShipmentModal({ closeModal }) {
    const [formData, setFormData] = useState({
        shipmentId: `SHP-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
        customerName: '',
        recipientPhone: '',
        senderName: '',
        senderPhone: '',
        governorate: '',
        parcelCount: 1,
        courierName: '',
        parcelType: '',
        weight: 0, 
        notes: '', 
        goodsValue: 0,
        goodsCurrency: 'USD',
        shippingFee: 0,
        shippingFeeCurrency: 'USD',
        shippingFeePaymentMethod: 'collect',
        hwalaFee: 0,
        hwalaFeeCurrency: 'USD',
        hwalaFeePaymentMethod: 'collect',
        internalTransferFee: 0,
        internalTransferFeeCurrency: 'USD',
        customFee1Name: '',
        customFee1Amount: 0,
        customFee1Currency: 'USD',
        customFee2Name: '',
        customFee2Amount: 0,
        customFee2Currency: 'USD',
        assignedCar: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [customerType, setCustomerType] = useState('new'); // 'new' or 'existing'
    const [selectedCustomer, setSelectedCustomer] = useState('');

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // جلب العملاء المسجلين
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const customersRef = collection(db, 'customers');
                const customersSnapshot = await getDocs(customersRef);
                const customersList = customersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCustomers(customersList);
            } catch (error) {
                console.error('Error fetching customers:', error);
            }
        };
        fetchCustomers();
    }, []);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    // اختيار عميل مسجل
    const handleCustomerSelect = (customerId) => {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            setFormData(prev => ({
                ...prev,
                customerName: customer.name,
                recipientPhone: customer.phone
            }));
        }
    };

    // تغيير نوع العميل
    const handleCustomerTypeChange = (type) => {
        setCustomerType(type);
        if (type === 'new') {
            setSelectedCustomer('');
            setFormData(prev => ({
                ...prev,
                customerName: '',
                recipientPhone: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'shipments'), {
                ...formData,
                status: 'تم الاستلام من المرسل',
                createdAt: serverTimestamp(),
            });
            closeModal();
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("حدث خطأ أثناء إضافة الشحنة.");
        }
        setIsSubmitting(false);
    };
    
    const calculateTotalToCollect = () => {
        const totals = {};
        const goodsVal = parseFloat(formData.goodsValue) || 0;
        if (goodsVal > 0) {
            totals[formData.goodsCurrency] = (totals[formData.goodsCurrency] || 0) + goodsVal;
        }
        if (formData.shippingFeePaymentMethod === 'collect') {
            const shippingVal = parseFloat(formData.shippingFee) || 0;
            if (shippingVal > 0) {
                totals[formData.shippingFeeCurrency] = (totals[formData.shippingFeeCurrency] || 0) + shippingVal;
            }
        }
        if (formData.hwalaFeePaymentMethod === 'collect') {
            const hwalaVal = parseFloat(formData.hwalaFee) || 0;
            if (hwalaVal > 0) {
                totals[formData.hwalaFeeCurrency] = (totals[formData.hwalaFeeCurrency] || 0) + hwalaVal;
            }
        }
        
        // إضافة الرسوم المخصصة
        const customFee1Val = parseFloat(formData.customFee1Amount) || 0;
        if (customFee1Val > 0 && formData.customFee1Name.trim()) {
            totals[formData.customFee1Currency] = (totals[formData.customFee1Currency] || 0) + customFee1Val;
        }
        
        const customFee2Val = parseFloat(formData.customFee2Amount) || 0;
        if (customFee2Val > 0 && formData.customFee2Name.trim()) {
            totals[formData.customFee2Currency] = (totals[formData.customFee2Currency] || 0) + customFee2Val;
        }
        
        const totalStrings = Object.entries(totals).map(([currency, amount]) => {
            return `${amount.toLocaleString()} ${currency}`;
        });
        return totalStrings;
    };
    
    const totalsToCollect = calculateTotalToCollect();


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center z-50 overflow-y-auto p-4" dir="rtl">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-4xl m-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">إضافة شحنة جديدة</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <fieldset className="border p-4 rounded-md">
                        <legend className="px-2 font-semibold">معلومات الشحنة</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                            <div>
                                <label htmlFor="shipmentId" className="block text-sm font-medium text-gray-700 mb-1">رقم الشحنة</label>
                                <input id="shipmentId" type="text" name="shipmentId" value={formData.shipmentId} className="p-2 border rounded-md w-full bg-gray-100" readOnly />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="border p-4 rounded-md">
                        <legend className="px-2 font-semibold">معلومات المستلم</legend>
                        
                        {/* خيارات نوع العميل */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">نوع العميل</label>
                            <div className="flex gap-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="customerType"
                                        value="new"
                                        checked={customerType === 'new'}
                                        onChange={(e) => handleCustomerTypeChange(e.target.value)}
                                        className="mr-2"
                                    />
                                    عميل جديد
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="customerType"
                                        value="existing"
                                        checked={customerType === 'existing'}
                                        onChange={(e) => handleCustomerTypeChange(e.target.value)}
                                        className="mr-2"
                                    />
                                    عميل مسجل
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            {customerType === 'existing' ? (
                                <div className="md:col-span-2">
                                    <label htmlFor="selectedCustomer" className="block text-sm font-medium text-gray-700 mb-1">اختر العميل</label>
                                    <select
                                        id="selectedCustomer"
                                        value={selectedCustomer}
                                        onChange={(e) => {
                                            setSelectedCustomer(e.target.value);
                                            handleCustomerSelect(e.target.value);
                                        }}
                                        className="p-2 border rounded-md w-full"
                                        required
                                    >
                                        <option value="">اختر عميل...</option>
                                        {customers.map(customer => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.name} - {customer.phone} ({customer.type === 'sender' ? 'مرسل' : customer.type === 'receiver' ? 'مستلم' : 'كلاهما'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">اسم المستلم</label>
                                        <input id="customerName" type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="p-2 border rounded-md w-full" required />
                                    </div>
                                    <div>
                                        <label htmlFor="recipientPhone" className="block text-sm font-medium text-gray-700 mb-1">رقم هاتف المستلم</label>
                                        <input id="recipientPhone" type="text" name="recipientPhone" value={formData.recipientPhone} onChange={handleChange} className="p-2 border rounded-md w-full" required />
                                    </div>
                                </>
                            )}
                        </div>
                    </fieldset>

                    <fieldset className="border p-4 rounded-md">
                        <legend className="px-2 font-semibold">معلومات المرسل</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div>
                                <label htmlFor="senderName" className="block text-sm font-medium text-gray-700 mb-1">اسم المرسل</label>
                                <input id="senderName" type="text" name="senderName" value={formData.senderName} onChange={handleChange} className="p-2 border rounded-md w-full" required />
                            </div>
                            <div>
                                <label htmlFor="senderPhone" className="block text-sm font-medium text-gray-700 mb-1">رقم هاتف المرسل</label>
                                <input id="senderPhone" type="text" name="senderPhone" value={formData.senderPhone} onChange={handleChange} className="p-2 border rounded-md w-full" required />
                            </div>
                            <div>
                                <label htmlFor="governorate" className="block text-sm font-medium text-gray-700 mb-1">المحافظة</label>
                                <input id="governorate" type="text" name="governorate" value={formData.governorate} onChange={handleChange} className="p-2 border rounded-md w-full" required />
                            </div>
                             <div>
                                <label htmlFor="parcelType" className="block text-sm font-medium text-gray-700 mb-1">نوع الطرد</label>
                                <input id="parcelType" type="text" name="parcelType" value={formData.parcelType} onChange={handleChange} className="p-2 border rounded-md w-full" />
                            </div>
                            <div>
                                <label htmlFor="parcelCount" className="block text-sm font-medium text-gray-700 mb-1">عدد الطرود</label>
                                <input id="parcelCount" type="number" name="parcelCount" value={formData.parcelCount} onChange={handleChange} className="p-2 border rounded-md w-full" min="1" />
                            </div>
                             <div>
                                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">الوزن (كغ)</label>
                                <input id="weight" type="number" name="weight" value={formData.weight} onChange={handleChange} className="p-2 border rounded-md w-full" min="0" />
                            </div>
                             <div className="md:col-span-2">
                                <label htmlFor="courierName" className="block text-sm font-medium text-gray-700 mb-1">اسم المندوب (اختياري)</label>
                                <input id="courierName" type="text" name="courierName" value={formData.courierName} onChange={handleChange} className="p-2 border rounded-md w-full" />
                            </div>
                            <div className="md:col-span-3">
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                                <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows="2" className="p-2 border rounded-md w-full"></textarea>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="border p-4 rounded-md">
                        <legend className="px-2 font-semibold">التفاصيل المالية</legend>
                        <div className="space-y-4">
                            <div className="grid grid-cols-5 gap-x-4">
                                <label className="col-span-1 pt-2 text-sm font-medium text-gray-700">قيمة البضاعة:</label>
                                <input type="number" name="goodsValue" value={formData.goodsValue} onChange={handleChange} className="col-span-2 p-2 border rounded-md" min="0" />
                                <select name="goodsCurrency" value={formData.goodsCurrency} onChange={handleChange} className="col-span-2 p-2 border rounded-md bg-white">
                                    <option value="USD">دولار أمريكي</option>
                                    <option value="SYP">ليرة سورية</option>
                                    <option value="TRY">ليرة تركية</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-5 gap-x-4 items-center">
                                <label className="col-span-1 text-sm font-medium text-gray-700">أجور الشحن:</label>
                                <input type="number" name="shippingFee" value={formData.shippingFee} onChange={handleChange} className="col-span-2 p-2 border rounded-md" min="0" />
                                <select name="shippingFeeCurrency" value={formData.shippingFeeCurrency} onChange={handleChange} className="col-span-1 p-2 border rounded-md bg-white">
                                    <option value="USD">دولار أمريكي</option>
                                    <option value="SYP">ليرة سورية</option>
                                    <option value="TRY">ليرة تركية</option>
                                </select>
                                <div className="col-span-1 flex gap-4">
                                    <label className="flex items-center"><input type="radio" name="shippingFeePaymentMethod" value="collect" checked={formData.shippingFeePaymentMethod === 'collect'} onChange={handleChange} className="h-4 w-4" /> <span className="mr-2">تحصيل</span></label>
                                    <label className="flex items-center"><input type="radio" name="shippingFeePaymentMethod" value="prepaid" checked={formData.shippingFeePaymentMethod === 'prepaid'} onChange={handleChange} className="h-4 w-4" /> <span className="mr-2">مسبق</span></label>
                                </div>
                            </div>
                            <div className="grid grid-cols-5 gap-x-4 items-center">
                                <label className="col-span-1 text-sm font-medium text-gray-700">أجور الحوالة:</label>
                                <input type="number" name="hwalaFee" value={formData.hwalaFee} onChange={handleChange} className="col-span-2 p-2 border rounded-md" min="0" />
                                <select name="hwalaFeeCurrency" value={formData.hwalaFeeCurrency} onChange={handleChange} className="col-span-1 p-2 border rounded-md bg-white">
                                    <option value="USD">دولار أمريكي</option>
                                    <option value="SYP">ليرة سورية</option>
                                    <option value="TRY">ليرة تركية</option>
                                </select>
                                <div className="col-span-1 flex gap-4">
                                    <label className="flex items-center"><input type="radio" name="hwalaFeePaymentMethod" value="collect" checked={formData.hwalaFeePaymentMethod === 'collect'} onChange={handleChange} className="h-4 w-4" /> <span className="mr-2">تحصيل</span></label>
                                    <label className="flex items-center"><input type="radio" name="hwalaFeePaymentMethod" value="prepaid" checked={formData.hwalaFeePaymentMethod === 'prepaid'} onChange={handleChange} className="h-4 w-4" /> <span className="mr-2">مسبق</span></label>
                                </div>
                            </div>
                            <div className="grid grid-cols-5 gap-x-4">
                                <label className="col-span-1 pt-2 text-sm font-medium text-gray-700">أجور المحول:</label>
                                <input type="number" name="internalTransferFee" value={formData.internalTransferFee} onChange={handleChange} className="col-span-2 p-2 border rounded-md" min="0" />
                                <select name="internalTransferFeeCurrency" value={formData.internalTransferFeeCurrency} onChange={handleChange} className="col-span-2 p-2 border rounded-md bg-white">
                                    <option value="USD">دولار أمريكي</option>
                                    <option value="SYP">ليرة سورية</option>
                                    <option value="TRY">ليرة تركية</option>
                                </select>
                            </div>
                            
                            {/* Custom Fee 1 */}
                            <div className="grid grid-cols-5 gap-x-4">
                                <label className="col-span-1 pt-2 text-sm font-medium text-gray-700">رسوم مخصصة 1:</label>
                                <input type="text" name="customFee1Name" value={formData.customFee1Name} onChange={handleChange} placeholder="اسم الرسوم" className="col-span-1 p-2 border rounded-md" />
                                <input type="number" name="customFee1Amount" value={formData.customFee1Amount} onChange={handleChange} placeholder="المبلغ" className="col-span-1 p-2 border rounded-md" min="0" />
                                <select name="customFee1Currency" value={formData.customFee1Currency} onChange={handleChange} className="col-span-1 p-2 border rounded-md bg-white">
                                    <option value="USD">دولار أمريكي</option>
                                    <option value="SYP">ليرة سورية</option>
                                    <option value="TRY">ليرة تركية</option>
                                </select>
                            </div>
                            
                            {/* Custom Fee 2 */}
                            <div className="grid grid-cols-5 gap-x-4">
                                <label className="col-span-1 pt-2 text-sm font-medium text-gray-700">رسوم مخصصة 2:</label>
                                <input type="text" name="customFee2Name" value={formData.customFee2Name} onChange={handleChange} placeholder="اسم الرسوم" className="col-span-1 p-2 border rounded-md" />
                                <input type="number" name="customFee2Amount" value={formData.customFee2Amount} onChange={handleChange} placeholder="المبلغ" className="col-span-1 p-2 border rounded-md" min="0" />
                                <select name="customFee2Currency" value={formData.customFee2Currency} onChange={handleChange} className="col-span-1 p-2 border rounded-md bg-white">
                                    <option value="USD">دولار أمريكي</option>
                                    <option value="SYP">ليرة سورية</option>
                                    <option value="TRY">ليرة تركية</option>
                                </select>
                            </div>
                        </div>
                    </fieldset>
                    
                    <div className="bg-indigo-50 p-4 rounded-md text-center">
                        <p className="text-lg font-medium text-gray-600">المبلغ الإجمالي المطلوب تحصيله من المستلم:</p>
                        <div className="text-3xl font-bold text-indigo-700 mt-1 flex justify-center items-center gap-x-4 flex-wrap">
                           {totalsToCollect.length > 0 ? (
                                totalsToCollect.map((item, index) => (
                                    <div key={index} className="flex items-center gap-x-3">
                                        <span className="whitespace-nowrap">{item}</span>
                                        {index < totalsToCollect.length - 1 && <span className="text-2xl">+</span>}
                                    </div>
                                ))
                            ) : (
                                <span>0 USD</span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={closeModal} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">إلغاء</button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 font-semibold">
                            {isSubmitting ? 'جاري الحفظ...' : 'حفظ الشحنة'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
