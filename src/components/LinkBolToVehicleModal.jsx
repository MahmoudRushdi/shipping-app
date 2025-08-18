import { useState, useEffect } from 'react';
import { collection, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function LinkBolToVehicleModal({ closeModal, bolEntry, onLinked }) {
    const [vehicleData, setVehicleData] = useState({
        vehicleId: '',
        vehicleName: '',
        senderName: '',
        convertedValue: 0,
        convertedValueCurrency: 'USD',
        percentageShare: 0,
        vehicleRentalFee: 0,
        additionalFee: 0,
        additionalFeeCurrency: 'USD',
        additionalFeePaymentMethod: 'prepaid', // 'prepaid' or 'collect'
        customFees: [], // Array of {name: '', amount: 0, currency: 'USD', paymentMethod: 'prepaid'}
        notes: ''
    });

    const [vehicles, setVehicles] = useState([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [newCustomFee, setNewCustomFee] = useState({
        name: '',
        amount: 0,
        currency: 'USD',
        paymentMethod: 'prepaid'
    });

    // Fetch vehicles from Firestore
    useEffect(() => {
        const vehiclesCollection = collection(db, 'vehicles');
        const unsubscribe = onSnapshot(vehiclesCollection, (snapshot) => {
            const vehiclesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setVehicles(vehiclesList);
            setIsLoadingVehicles(false);
        }, (err) => {
            console.error("Error fetching vehicles:", err);
            setError("فشل تحميل قائمة المركبات.");
            setIsLoadingVehicles(false);
        });
        return () => unsubscribe();
    }, []);

    // Handle form field changes
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const val = (type === 'number') ? parseFloat(value) : value;
        const finalValue = type === 'radio' ? e.target.value : val;

        setVehicleData(prev => {
            const newState = { ...prev, [name]: finalValue };
            if (name === 'vehicleId') {
                const selectedVehicle = vehicles.find(vehicle => vehicle.id === value);
                if (selectedVehicle) {
                    newState.vehicleName = selectedVehicle.vehicleName || selectedVehicle.name;
                } else {
                    newState.vehicleName = '';
                }
            }
            return newState;
        });
    };

    // Handle adding custom fee
    const handleAddCustomFee = () => {
        if (newCustomFee.name.trim() && newCustomFee.amount > 0) {
            setVehicleData(prev => ({
                ...prev,
                customFees: [...prev.customFees, { ...newCustomFee }]
            }));
            setNewCustomFee({
                name: '',
                amount: 0,
                currency: 'USD',
                paymentMethod: 'prepaid'
            });
        }
    };

    // Handle removing custom fee
    const handleRemoveCustomFee = (index) => {
        setVehicleData(prev => ({
            ...prev,
            customFees: prev.customFees.filter((_, i) => i !== index)
        }));
    };

    // Handle custom fee input changes
    const handleCustomFeeChange = (e) => {
        const { name, value, type } = e.target;
        const val = (type === 'number') ? parseFloat(value) : value;
        const finalValue = type === 'radio' ? e.target.value : val;
        
        setNewCustomFee(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!vehicleData.vehicleId) {
            setError('يرجى اختيار المركبة.');
            setIsSubmitting(false);
            return;
        }

        try {
            const updateData = {
                vehicleId: vehicleData.vehicleId,
                vehicleName: vehicleData.vehicleName,
                senderName: vehicleData.senderName,
                convertedValue: vehicleData.convertedValue,
                convertedValueCurrency: vehicleData.convertedValueCurrency,
                percentageShare: vehicleData.percentageShare,
                vehicleRentalFee: vehicleData.vehicleRentalFee,
                additionalFee: vehicleData.additionalFee,
                additionalFeeCurrency: vehicleData.additionalFeeCurrency,
                additionalFeePaymentMethod: vehicleData.additionalFeePaymentMethod,
                customFees: vehicleData.customFees,
                notes: vehicleData.notes,
                linkedAt: new Date(),
                status: 'linked'
            };

            await updateDoc(doc(db, 'branch_entries', bolEntry.id), updateData);
            onLinked('تم ربط البوليصة بالمركبة بنجاح.');
            closeModal();
        } catch (err) {
            console.error("Error linking BOL to vehicle:", err);
            setError('حدث خطأ أثناء ربط البوليصة بالمركبة. يرجى المحاولة مرة أخرى.');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center z-50 overflow-y-auto p-4" dir="rtl">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl m-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                    ربط البوليصة بالمركبة
                </h2>
                
                {/* BOL Info */}
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-blue-800 mb-2">معلومات البوليصة</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium">رقم البوليصة:</span> {bolEntry.bolNumber}
                        </div>
                        <div>
                            <span className="font-medium">الفرع:</span> {bolEntry.branchName}
                        </div>
                        <div>
                            <span className="font-medium">النوع:</span> {bolEntry.entryType === 'incoming' ? 'وارد' : 'صادر'}
                        </div>
                        <div>
                            <span className="font-medium">عدد البنود:</span> {bolEntry.items?.length || 0}
                        </div>
                    </div>
                </div>

                {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg text-center mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Vehicle Selection */}
                    <div>
                        <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 mb-1">اختر المركبة</label>
                        <select
                            id="vehicleId"
                            name="vehicleId"
                            value={vehicleData.vehicleId}
                            onChange={handleChange}
                            className="p-2 border rounded-md w-full bg-white"
                            required
                        >
                            <option value="">اختر المركبة</option>
                            {isLoadingVehicles ? (
                                <option value="" disabled>جاري تحميل المركبات...</option>
                            ) : vehicles.length === 0 ? (
                                <option value="" disabled>لا توجد مركبات متاحة</option>
                            ) : (
                                vehicles.map(vehicle => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.vehicleName || vehicle.name} - {vehicle.plateNumber}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Sender Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="senderName" className="block text-sm font-medium text-gray-700 mb-1">اسم المرسل</label>
                            <input
                                id="senderName"
                                type="text"
                                name="senderName"
                                value={vehicleData.senderName}
                                onChange={handleChange}
                                className="p-2 border rounded-md w-full"
                                placeholder="اسم المرسل أو المكتب"
                            />
                        </div>
                        <div>
                            <label htmlFor="convertedValue" className="block text-sm font-medium text-gray-700 mb-1">القيمة المحولة</label>
                            <div className="flex gap-2">
                                <input
                                    id="convertedValue"
                                    type="number"
                                    name="convertedValue"
                                    value={vehicleData.convertedValue}
                                    onChange={handleChange}
                                    className="p-2 border rounded-md flex-1"
                                    min="0"
                                    step="0.01"
                                    placeholder="مثال: 700"
                                />
                                <select
                                    name="convertedValueCurrency"
                                    value={vehicleData.convertedValueCurrency}
                                    onChange={handleChange}
                                    className="p-2 border rounded-md bg-white"
                                >
                                    <option value="USD">دولار</option>
                                    <option value="SYP">ليرة سورية</option>
                                    <option value="TRY">ليرة تركية</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Financial Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="percentageShare" className="block text-sm font-medium text-gray-700 mb-1">نسبة المشاركة (%)</label>
                            <input
                                id="percentageShare"
                                type="number"
                                name="percentageShare"
                                value={vehicleData.percentageShare}
                                onChange={handleChange}
                                className="p-2 border rounded-md w-full"
                                min="0"
                                max="100"
                                step="0.1"
                            />
                        </div>
                        <div>
                            <label htmlFor="vehicleRentalFee" className="block text-sm font-medium text-gray-700 mb-1">أجرة المركبة (USD)</label>
                            <input
                                id="vehicleRentalFee"
                                type="number"
                                name="vehicleRentalFee"
                                value={vehicleData.vehicleRentalFee}
                                onChange={handleChange}
                                className="p-2 border rounded-md w-full"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* Additional Fees */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="additionalFee" className="block text-sm font-medium text-gray-700 mb-1">رسوم إضافية</label>
                            <input
                                id="additionalFee"
                                type="number"
                                name="additionalFee"
                                value={vehicleData.additionalFee}
                                onChange={handleChange}
                                className="p-2 border rounded-md w-full"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label htmlFor="additionalFeeCurrency" className="block text-sm font-medium text-gray-700 mb-1">عملة الرسوم</label>
                            <select
                                id="additionalFeeCurrency"
                                name="additionalFeeCurrency"
                                value={vehicleData.additionalFeeCurrency}
                                onChange={handleChange}
                                className="p-2 border rounded-md w-full bg-white"
                            >
                                <option value="USD">دولار أمريكي</option>
                                <option value="SYP">ليرة سورية</option>
                                <option value="TRY">ليرة تركية</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                            <div className="flex gap-4 mt-1">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="additionalFeePaymentMethod"
                                        value="prepaid"
                                        checked={vehicleData.additionalFeePaymentMethod === 'prepaid'}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-indigo-600"
                                    />
                                    <span className="mr-2">مسبق</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="additionalFeePaymentMethod"
                                        value="collect"
                                        checked={vehicleData.additionalFeePaymentMethod === 'collect'}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-indigo-600"
                                    />
                                    <span className="mr-2">تحصيل</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Custom Fees Section */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">رسوم مخصصة</h3>
                        
                        {/* Add New Custom Fee */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <h4 className="font-medium mb-3 text-gray-700">إضافة رسوم جديدة</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم الرسوم</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={newCustomFee.name}
                                        onChange={handleCustomFeeChange}
                                        className="p-2 border rounded-md w-full"
                                        placeholder="مثال: رسوم جمركية"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={newCustomFee.amount}
                                        onChange={handleCustomFeeChange}
                                        className="p-2 border rounded-md w-full"
                                        min="0"
                                        step="0.01"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">العملة</label>
                                    <select
                                        name="currency"
                                        value={newCustomFee.currency}
                                        onChange={handleCustomFeeChange}
                                        className="p-2 border rounded-md w-full bg-white"
                                    >
                                        <option value="USD">دولار</option>
                                        <option value="SYP">ليرة سورية</option>
                                        <option value="TRY">ليرة تركية</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                                    <div className="flex gap-2 mt-1">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="prepaid"
                                                checked={newCustomFee.paymentMethod === 'prepaid'}
                                                onChange={handleCustomFeeChange}
                                                className="h-4 w-4 text-indigo-600"
                                            />
                                            <span className="mr-1 text-sm">مسبق</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="collect"
                                                checked={newCustomFee.paymentMethod === 'collect'}
                                                onChange={handleCustomFeeChange}
                                                className="h-4 w-4 text-indigo-600"
                                            />
                                            <span className="mr-1 text-sm">تحصيل</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddCustomFee}
                                disabled={!newCustomFee.name.trim() || newCustomFee.amount <= 0}
                                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                            >
                                إضافة الرسوم
                            </button>
                        </div>

                        {/* Display Custom Fees */}
                        {vehicleData.customFees.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-medium text-gray-700">الرسوم المضافة:</h4>
                                {vehicleData.customFees.map((fee, index) => (
                                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                                        <div className="flex-1">
                                            <span className="font-medium">{fee.name}</span>
                                            <span className="text-gray-600 mr-2"> - {fee.amount} {fee.currency}</span>
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                fee.paymentMethod === 'prepaid' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-orange-100 text-orange-800'
                                            }`}>
                                                {fee.paymentMethod === 'prepaid' ? 'مسبق' : 'تحصيل'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCustomFee(index)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            حذف
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">ملاحظات إضافية</label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={vehicleData.notes}
                            onChange={handleChange}
                            rows="3"
                            className="p-2 border rounded-md w-full"
                            placeholder="أي ملاحظات إضافية حول الربط..."
                        ></textarea>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-4">
                        <button 
                            type="button" 
                            onClick={closeModal} 
                            className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
                        >
                            إلغاء
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 font-semibold"
                        >
                            {isSubmitting ? 'جاري الربط...' : 'ربط البوليصة'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 