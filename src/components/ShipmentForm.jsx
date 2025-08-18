import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AnimatedButton from './AnimatedButton';

export default function ShipmentForm({ onSubmit, initialData = null, isLoading = false }) {
    const [formData, setFormData] = useState(initialData || {
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
        hwalaFee: '',
        hwalaFeeCurrency: 'USD',
        hwalaFeePaymentMethod: 'collect',
        internalTransferFee: '',
        internalTransferFeeCurrency: 'USD',
        notes: ''
    });

    // Generate new shipment ID if not provided in initialData
    useEffect(() => {
        if (!initialData?.shipmentId) {
            setFormData(prev => ({
                ...prev,
                shipmentId: `SHP-${crypto.randomUUID().split('-')[0].toUpperCase()}`
            }));
        }
    }, [initialData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <motion.div variants={itemVariants}>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">المعلومات الأساسية</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">رقم الشحنة</label>
                        <input
                            type="text"
                            name="shipmentId"
                            value={formData.shipmentId}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            placeholder="رقم الشحنة"
                            readOnly
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">نوع الطرد</label>
                        <input
                            type="text"
                            name="parcelType"
                            value={formData.parcelType}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            placeholder="اكتب نوع الطرد"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Customer Information */}
            <motion.div variants={itemVariants}>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">معلومات المستلم</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستلم</label>
                        <input
                            type="text"
                            name="customerName"
                            value={formData.customerName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            placeholder="اسم المستلم"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">هاتف المستلم</label>
                        <input
                            type="tel"
                            name="recipientPhone"
                            value={formData.recipientPhone}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            placeholder="رقم الهاتف"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Sender Information */}
            <motion.div variants={itemVariants}>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">معلومات المرسل</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">اسم المرسل</label>
                        <input
                            type="text"
                            name="senderName"
                            value={formData.senderName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            placeholder="اسم المرسل"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">هاتف المرسل</label>
                        <input
                            type="tel"
                            name="senderPhone"
                            value={formData.senderPhone}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            placeholder="رقم الهاتف"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Location and Package Details */}
            <motion.div variants={itemVariants}>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">تفاصيل الموقع والطرد</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">المحافظة</label>
                        <select
                            name="governorate"
                            value={formData.governorate}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        >
                            <option value="">اختر المحافظة</option>
                            <option value="دمشق">دمشق</option>
                            <option value="ريف دمشق">ريف دمشق</option>
                            <option value="حلب">حلب</option>
                            <option value="حمص">حمص</option>
                            <option value="حماة">حماة</option>
                            <option value="اللاذقية">اللاذقية</option>
                            <option value="طرطوس">طرطوس</option>
                            <option value="إدلب">إدلب</option>
                            <option value="دير الزور">دير الزور</option>
                            <option value="الحسكة">الحسكة</option>
                            <option value="الرقة">الرقة</option>
                            <option value="درعا">درعا</option>
                            <option value="السويداء">السويداء</option>
                            <option value="القنيطرة">القنيطرة</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الوزن (كغ)</label>
                        <input
                            type="number"
                            name="weight"
                            value={formData.weight}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            placeholder="الوزن بالكيلوغرام"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">عدد الطرود</label>
                        <input
                            type="number"
                            name="parcelCount"
                            value={formData.parcelCount}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            placeholder="عدد الطرود"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Financial Information */}
            <motion.div variants={itemVariants}>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">المعلومات المالية</h2>
                
                {/* Goods Value */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">قيمة البضاعة</label>
                        <input
                            type="number"
                            name="goodsValue"
                            value={formData.goodsValue}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            placeholder="قيمة البضاعة"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">عملة البضاعة</label>
                        <select
                            name="goodsCurrency"
                            value={formData.goodsCurrency}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        >
                            <option value="USD">دولار أمريكي</option>
                            <option value="TRY">ليرة تركية</option>
                            <option value="SYP">ليرة سورية</option>
                        </select>
                    </div>
                </div>

                {/* Shipping Fee */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">أجور الشحن</label>
                        <input
                            type="number"
                            name="shippingFee"
                            value={formData.shippingFee}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            placeholder="أجور الشحن"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">عملة الشحن</label>
                        <select
                            name="shippingFeeCurrency"
                            value={formData.shippingFeeCurrency}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        >
                            <option value="USD">دولار أمريكي</option>
                            <option value="TRY">ليرة تركية</option>
                            <option value="SYP">ليرة سورية</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">طريقة دفع الشحن</label>
                        <select
                            name="shippingFeePaymentMethod"
                            value={formData.shippingFeePaymentMethod}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        >
                            <option value="collect">تحصيل</option>
                            <option value="prepaid">مسبق</option>
                        </select>
                    </div>
                </div>

                {/* Hwala Fee */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">أجور الحوالة</label>
                        <input
                            type="number"
                            name="hwalaFee"
                            value={formData.hwalaFee}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            placeholder="أجور الحوالة"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">عملة الحوالة</label>
                        <select
                            name="hwalaFeeCurrency"
                            value={formData.hwalaFeeCurrency}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        >
                            <option value="USD">دولار أمريكي</option>
                            <option value="TRY">ليرة تركية</option>
                            <option value="SYP">ليرة سورية</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">طريقة دفع الحوالة</label>
                        <select
                            name="hwalaFeePaymentMethod"
                            value={formData.hwalaFeePaymentMethod}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        >
                            <option value="collect">تحصيل</option>
                            <option value="prepaid">مسبق</option>
                        </select>
                    </div>
                </div>

                {/* Internal Transfer Fee */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">أجور المحول</label>
                        <input
                            type="number"
                            name="internalTransferFee"
                            value={formData.internalTransferFee}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            placeholder="أجور المحول"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">عملة المحول</label>
                        <select
                            name="internalTransferFeeCurrency"
                            value={formData.internalTransferFeeCurrency}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        >
                            <option value="USD">دولار أمريكي</option>
                            <option value="TRY">ليرة تركية</option>
                            <option value="SYP">ليرة سورية</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Notes */}
            <motion.div variants={itemVariants}>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">ملاحظات إضافية</h2>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        placeholder="أي ملاحظات إضافية..."
                    />
                </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants} className="flex justify-end gap-4 pt-6 border-t">
                <AnimatedButton
                    type="submit"
                    variant="primary"
                    loading={isLoading}
                >
                    {isLoading ? 'جاري الإضافة...' : 'إضافة الشحنة'}
                </AnimatedButton>
            </motion.div>
        </form>
    );
} 