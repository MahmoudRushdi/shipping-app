import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig'; // Added auth import
import { format } from 'date-fns';

export default function DispatchIncomingItemModal({ closeModal, onDispatchComplete, entryId, item }) {
    const [dispatchQuantity, setDispatchQuantity] = useState(1);
    const [destinationType, setDestinationType] = useState('customer'); // 'customer' or 'branch'
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [destinationGovernorate, setDestinationGovernorate] = useState('');
    const [targetBranchName, setTargetBranchName] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Pre-fill quantity with remaining quantity
    useEffect(() => {
        if (item) {
            setDispatchQuantity(item.itemQuantity - (item.dispatchedQuantity || 0));
            // Pre-fill recipient info if available from the incoming item
            setCustomerName(item.recipientName || '');
            setCustomerPhone(item.recipientPhone || '');
            setDestinationGovernorate(item.destinationGovernorate || '');
        }
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [item]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const remainingQuantity = item.itemQuantity - (item.dispatchedQuantity || 0);

        if (dispatchQuantity <= 0 || dispatchQuantity > remainingQuantity) {
            setError(`الكمية المراد إخراجها يجب أن تكون بين 1 و ${remainingQuantity}.`);
            setIsSubmitting(false);
            return;
        }

        if (destinationType === 'customer' && (!customerName.trim() || !destinationGovernorate.trim())) {
            setError('يرجى إدخال اسم المستلم ومحافظة الوجهة للشحنة.');
            setIsSubmitting(false);
            return;
        }
        if (destinationType === 'branch' && !targetBranchName.trim()) {
            setError('يرجى إدخال اسم الفرع المستهدف.');
            setIsSubmitting(false);
            return;
        }

        try {
            const entryRef = doc(db, 'branch_entries', entryId);
            const entrySnap = await getDoc(entryRef);

            if (!entrySnap.exists()) {
                setError('الإدخال الأصلي غير موجود.');
                setIsSubmitting(false);
                return;
            }

            const currentEntryData = entrySnap.data();
            let updatedItems = [...currentEntryData.items];

            let itemIndex = updatedItems.findIndex(i => i.id === item.id);
            if (itemIndex === -1) {
                const fallbackIndex = updatedItems.findIndex(i => i.orderIndex === item.orderIndex && i.itemDescription === item.itemDescription);
                if (fallbackIndex !== -1) {
                    itemIndex = fallbackIndex;
                } else {
                    setError('البند الأصلي لم يتم العثور عليه للتحديث.');
                    setIsSubmitting(false);
                    return;
                }
            }

            const itemToUpdate = { ...updatedItems[itemIndex] };
            itemToUpdate.dispatchedQuantity = (itemToUpdate.dispatchedQuantity || 0) + dispatchQuantity;

            // NEW: Update itemStatus based on dispatched quantity
            if (itemToUpdate.dispatchedQuantity === itemToUpdate.itemQuantity) {
                itemToUpdate.itemStatus = 'Fully Dispatched';
            } else if (itemToUpdate.dispatchedQuantity > 0) {
                itemToUpdate.itemStatus = 'Partially Dispatched';
            } else {
                itemToUpdate.itemStatus = 'Received'; // Should ideally not happen here
            }


            if (!itemToUpdate.dispatchHistory) {
                itemToUpdate.dispatchHistory = [];
            }
            itemToUpdate.dispatchHistory.push({
                dispatchedAmount: dispatchQuantity,
                dispatchedDate: new Date(),
                destinationType: destinationType,
                customerName: destinationType === 'customer' ? customerName : null,
                customerPhone: destinationType === 'customer' ? customerPhone : null,
                destinationGovernorate: destinationType === 'customer' ? destinationGovernorate : null,
                targetBranchName: destinationType === 'branch' ? targetBranchName : null,
                notes: notes,
                recordedBy: auth.currentUser?.email || 'Unknown',
            });

            updatedItems[itemIndex] = itemToUpdate;

            await updateDoc(entryRef, {
                items: updatedItems
            });

            let confirmationMessage = `تم إخراج ${dispatchQuantity} من البند بنجاح.`;
            if (destinationType === 'customer') {
                confirmationMessage += ` يرجى الآن إنشاء شحنة جديدة للعميل ${customerName} إلى ${destinationGovernorate} بالكمية المخرجة.`;
            } else { // branch
                confirmationMessage += ` يرجى الآن إنشاء إدخال صادر جديد للفرع ${targetBranchName} بالكمية المخرجة.`;
            }

            onDispatchComplete(confirmationMessage);
        } catch (err) {
            console.error("Error dispatching item:", err);
            setError('حدث خطأ أثناء إخراج البند. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center z-50 overflow-y-auto p-4" dir="rtl">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md m-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">إخراج بند من إدخال وارد</h2>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg text-center mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-gray-100 p-4 rounded-md text-gray-700">
                        <p className="font-semibold mb-2">تفاصيل البند الأصلي:</p>
                        <p><strong>الوصف:</strong> {item.itemDescription}</p>
                        <p><strong>الكمية الكلية:</strong> {item.itemQuantity}</p>
                        <p><strong>الكمية المخرجة سابقاً:</strong> {item.dispatchedQuantity || 0}</p>
                        <p><strong>الكمية المتبقية:</strong> {item.itemQuantity - (item.dispatchedQuantity || 0)}</p>
                        <p><strong>رقم مشعار الفرع:</strong> {item.sendingBranchMeshaarId}</p>
                        <p><strong>الحالة الحالية:</strong> {item.itemStatus || 'N/A'}</p> {/* Display current status */}
                    </div>

                    <div>
                        <label htmlFor="dispatchQuantity" className="block text-sm font-medium text-gray-700 mb-1">الكمية المراد إخراجها</label>
                        <input
                            id="dispatchQuantity"
                            type="number"
                            name="dispatchQuantity"
                            value={dispatchQuantity}
                            onChange={(e) => setDispatchQuantity(parseFloat(e.target.value))}
                            className="p-2 border rounded-md w-full"
                            min="1"
                            max={item.itemQuantity - (item.dispatchedQuantity || 0)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">وجهة الإخراج</label>
                        <div className="flex gap-4 mt-1">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="destinationType"
                                    value="customer"
                                    checked={destinationType === 'customer'}
                                    onChange={(e) => setDestinationType(e.target.value)}
                                    className="h-4 w-4 text-indigo-600"
                                />
                                <span className="mr-2">شحنة عميل</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="destinationType"
                                    value="branch"
                                    checked={destinationType === 'branch'}
                                    onChange={(e) => setDestinationType(e.target.value)}
                                    className="h-4 w-4 text-indigo-600"
                                />
                                <span className="mr-2">فرع آخر</span>
                            </label>
                        </div>
                    </div>

                    {destinationType === 'customer' && (
                        <>
                            <div>
                                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">اسم المستلم (العميل)</label>
                                <input
                                    id="customerName"
                                    type="text"
                                    name="customerName"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="p-2 border rounded-md w-full"
                                    placeholder="اسم العميل النهائي"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">هاتف المستلم (العميل)</label>
                                <input
                                    id="customerPhone"
                                    type="text"
                                    name="customerPhone"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="p-2 border rounded-md w-full"
                                    placeholder="رقم هاتف العميل النهائي"
                                />
                            </div>
                            <div>
                                <label htmlFor="destinationGovernorate" className="block text-sm font-medium text-gray-700 mb-1">محافظة الوجهة</label>
                                <input
                                    id="destinationGovernorate"
                                    type="text"
                                    name="destinationGovernorate"
                                    value={destinationGovernorate}
                                    onChange={(e) => setDestinationGovernorate(e.target.value)}
                                    className="p-2 border rounded-md w-full"
                                    placeholder="مثال: نيقوسيا"
                                    required
                                />
                            </div>
                        </>
                    )}

                    {destinationType === 'branch' && (
                        <div>
                            <label htmlFor="targetBranchName" className="block text-sm font-medium text-gray-700 mb-1">اسم الفرع المستهدف</label>
                            <input
                                id="targetBranchName"
                                type="text"
                                name="targetBranchName"
                                value={targetBranchName}
                                onChange={(e) => setTargetBranchName(e.target.value)}
                                className="p-2 border rounded-md w-full"
                                placeholder="مثال: فرع نيقوسيا"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">ملاحظات حول الإخراج</label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows="2"
                            className="p-2 border rounded-md w-full"
                            placeholder="أي ملاحظات إضافية عن عملية الإخراج..."
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={closeModal} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">إلغاء</button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-teal-400 font-semibold">
                            {isSubmitting ? 'جاري الإخراج...' : 'تأكيد الإخراج'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
