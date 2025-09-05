import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, onSnapshot, doc, getDoc, updateDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Ensure this path is correct

export default function AddBranchEntryModal({ closeModal, onEntryAdded, existingEntryId }) {
    // State for the main entry form data
         const [entryData, setEntryData] = useState({
         entryType: 'incoming', // 'incoming' or 'outgoing'
         branchId: '',
         branchName: '',
         bolNumber: '', // رقم مشعار الفرع
         notes: '',
     });

         const [items, setItems] = useState([]);
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [error, setError] = useState('');
     const [branches, setBranches] = useState([]);
     const [isLoadingBranches, setIsLoadingBranches] = useState(true);
     const [isInitialLoad, setIsInitialLoad] = useState(true); // To manage initial data load for editing

         // Fetch branches from Firestore
     useEffect(() => {
         const branchesCollection = collection(db, 'branches');
         const unsubscribe = onSnapshot(branchesCollection, (snapshot) => {
             const branchesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
             setBranches(branchesList);
             setIsLoadingBranches(false);
         }, (err) => {
             console.error("Error fetching branches (AddBranchEntryModal):", err);
             setError("فشل تحميل قائمة الفروع.");
             setIsLoadingBranches(false);
         });
         return () => unsubscribe();
     }, []);

    // Effect to load existing entry data if existingEntryId is provided
    useEffect(() => {
        if (existingEntryId) {
            const fetchExistingEntry = async () => {
                setIsInitialLoad(true);
                try {
                    const entryRef = doc(db, 'branch_entries', existingEntryId);
                    const entrySnap = await getDoc(entryRef);

                    if (entrySnap.exists()) {
                        const data = entrySnap.data();
                        setEntryData({
                            entryType: data.entryType || 'incoming',
                            branchName: data.branchName || '',
                            vehicleId: data.vehicleId || '',
                            vehicleName: data.vehicleName || '',
                            percentageShare: data.percentageShare || 0,
                            vehicleRentalFee: data.vehicleRentalFee || 0,
                            additionalFee: data.additionalFee || 0,
                            additionalFeeCurrency: data.additionalFeeCurrency || 'USD',
                            additionalFeePaymentMethod: data.additionalFeePaymentMethod || 'prepaid',
                            notes: data.notes || '',
                        });
                        setItems(data.items ? data.items.sort((a,b) => a.orderIndex - b.orderIndex) : []);
                    } else {
                        setError("لم يتم العثور على الإدخال الحالي للتعديل.");
                    }
                } catch (err) {
                    console.error("Error fetching existing entry:", err);
                    setError("فشل تحميل بيانات الإدخال للتعديل.");
                } finally {
                    setIsInitialLoad(false);
                }
            };
            fetchExistingEntry();
        } else {
            setIsInitialLoad(false);
        }
    }, [existingEntryId]);

    // Effect to prevent body scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Handle changes in main entry form fields
    const handleEntryChange = (e) => {
        const { name, value, type } = e.target;
        const val = (type === 'number') ? parseFloat(value) : value;
        const finalValue = type === 'radio' ? e.target.value : val;

                 setEntryData(prev => {
             const newState = { ...prev, [name]: finalValue };
             if (name === 'branchId') {
                 const selectedBranch = branches.find(branch => branch.id === value);
                 if (selectedBranch) {
                     newState.branchName = selectedBranch.name || selectedBranch.branchName;
                 } else {
                     newState.branchName = '';
                 }
             }
             return newState;
         });
    };

    // Handle changes in individual item fields
    const handleItemChange = (index, e) => {
        const { name, value, type } = e.target;
        const val = (type === 'number') ? parseFloat(value) : value;

        const newItems = items.map((item, i) => {
            if (i === index) {
                return { ...item, [name]: val };
            }
            return item;
        });
        setItems(newItems);
    };

    // Add a new empty item row
    const handleAddItem = () => {
        setItems(prev => [
            ...prev,
            {
                orderIndex: prev.length,
                sendingBranchMeshaarId: '',
                itemDescription: '',
                itemQuantity: 1,
                itemWeight: 0,
                itemValue: 0,
                itemCurrency: 'USD',
                recipientName: '',
                recipientPhone: '',
                destinationGovernorate: '',
                itemNotes: '',
                itemStatus: 'Received', // NEW: Default status for new items
            }
        ]);
    };

    // Remove an item row
    const handleRemoveItem = (indexToRemove) => {
        setItems(prev => prev.filter((_, i) => i !== indexToRemove).map((item, i) => ({ ...item, orderIndex: i })));
    };

         // Generate automatic BOL number
     const generateBolNumber = async () => {
         try {
             const currentYear = new Date().getFullYear();
             const bolCollection = collection(db, 'branch_entries');
             
             // Get the latest BOL number for this year
             const q = query(bolCollection, 
                 where('bolNumber', '>=', `BOL-${currentYear}-`),
                 where('bolNumber', '<=', `BOL-${currentYear}-999999`),
                 orderBy('bolNumber', 'desc'),
                 limit(1)
             );
             
             const snapshot = await getDocs(q);
             let nextNumber = 1;
             
             if (!snapshot.empty) {
                 const latestBol = snapshot.docs[0].data().bolNumber;
                 const match = latestBol.match(new RegExp(`BOL-${currentYear}-(\\d+)`));
                 if (match) {
                     nextNumber = parseInt(match[1]) + 1;
                 }
             }
             
             return `BOL-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;
         } catch (error) {
             console.error('Error generating BOL number:', error);
             // Fallback to timestamp-based number
             return `BOL-${new Date().getTime()}`;
         }
     };

     // Generate and display BOL number on component mount
     useEffect(() => {
         if (!existingEntryId) {
             const generateAndSetBolNumber = async () => {
                 const bolNumber = await generateBolNumber();
                 setEntryData(prev => ({ ...prev, bolNumber }));
             };
             generateAndSetBolNumber();
         }
     }, [existingEntryId]);

     // Handle form submission
     const handleSubmit = async (e) => {
         e.preventDefault();
         setError('');
         setIsSubmitting(true);

                 if (!entryData.branchId) {
             setError('يرجى اختيار الفرع المرسل.');
             setIsSubmitting(false);
             return;
         }
        if (items.length === 0) {
            setError('يرجى إضافة بند واحد على الأقل.');
            setIsSubmitting(false);
            return;
        }
        for (const item of items) {
            if (!item.sendingBranchMeshaarId.trim() && entryData.entryType === 'incoming') {
                setError('لكل بند وارد، يرجى إدخال رقم مشعار الفرع المرسل.');
                setIsSubmitting(false);
                return;
            }
            if (!item.itemDescription.trim()) {
                setError('يرجى إدخال وصف لكل بند.');
                setIsSubmitting(false);
                return;
            }
        }

                 try {
             const entryToSave = {
                 ...entryData,
                 items: items.map(item => ({ // Ensure status is set for all items on save
                     ...item,
                     itemStatus: item.itemStatus || 'Received' // Fallback for existing items without status
                 })),
                 ...(existingEntryId ? {} : { createdAt: serverTimestamp() }),
                 status: 'pending', // Overall entry status remains 'pending' initially
             };

            if (existingEntryId) {
                await updateDoc(doc(db, 'branch_entries', existingEntryId), entryToSave);
                onEntryAdded('تم تحديث البوليصة بنجاح.');
            } else {
                await addDoc(collection(db, 'branch_entries'), entryToSave);
                onEntryAdded('تمت إضافة البوليصة بنجاح.');
            }
            closeModal();
        } catch (err) {
            console.error("Error saving branch entry (handleSubmit):", err);
            setError('حدث خطأ أثناء حفظ البوليصة. يرجى المحاولة مرة أخرى.');
        }
        setIsSubmitting(false);
    };

    // Show loading indicator if initial data is being fetched for editing
    if (isInitialLoad && existingEntryId) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center z-50 overflow-y-auto p-4" dir="rtl">
                <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-5xl m-auto text-center">
                    <p className="text-gray-700">جاري تحميل بيانات الإدخال للتعديل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center z-50 overflow-y-auto p-4" dir="rtl">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-5xl m-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                    {existingEntryId ? 'تعديل البوليصة' : 'إضافة بوليصة جديدة (وارد/صادر)'}
                </h2>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg text-center mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* General Entry Information */}
                    <fieldset className="border p-4 rounded-md">
                        <legend className="px-2 font-semibold">معلومات البوليصة الرئيسية</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">نوع الإدخال</label>
                                <div className="flex gap-4 mt-1">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="entryType"
                                            value="incoming"
                                            checked={entryData.entryType === 'incoming'}
                                            onChange={handleEntryChange}
                                            className="h-4 w-4 text-indigo-600"
                                            disabled={!!existingEntryId}
                                        />
                                        <span className="mr-2">وارد (Incoming)</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="entryType"
                                            value="outgoing"
                                            checked={entryData.entryType === 'outgoing'}
                                            onChange={handleEntryChange}
                                            className="h-4 w-4 text-indigo-600"
                                            disabled={!!existingEntryId}
                                        />
                                        <span className="mr-2">صادر (Outgoing)</span>
                                    </label>
                                </div>
                            </div>
                                                         <div>
                                 <label htmlFor="branchId" className="block text-sm font-medium text-gray-700 mb-1">الفرع المرسل</label>
                                 <select
                                     id="branchId"
                                     name="branchId"
                                     value={entryData.branchId}
                                     onChange={handleEntryChange}
                                     className="p-2 border rounded-md w-full bg-white"
                                     required
                                 >
                                     <option value="">اختر الفرع المرسل</option>
                                                                           {isLoadingBranches ? (
                                          <option value="" disabled>جاري تحميل الفروع...</option>
                                      ) : branches.length === 0 ? (
                                          <option value="" disabled>لا توجد فروع متاحة. يرجى إضافة فرع أولاً.</option>
                                      ) : (
                                                                                     branches.map(branch => (
                                               <option key={branch.id} value={branch.id}>
                                                   {branch.name || branch.branchName || 'اسم غير محدد'}
                                               </option>
                                           ))
                                      )}
                                 </select>
                                 {!isLoadingBranches && branches.length === 0 && (
                                     <p className="text-red-500 text-sm mt-1">لا توجد فروع متاحة. يرجى إضافة فرع من صفحة إدارة الفروع أولاً.</p>
                                 )}
                             </div>
                                                         <div>
                                 <label htmlFor="bolNumber" className="block text-sm font-medium text-gray-700 mb-1">رقم البوليصة</label>
                                 <input
                                     id="bolNumber"
                                     type="text"
                                     name="bolNumber"
                                     value={entryData.bolNumber || 'جاري التوليد...'}
                                     onChange={handleEntryChange}
                                     className="p-2 border rounded-md w-full bg-gray-100"
                                     placeholder="جاري التوليد..."
                                     required
                                     readOnly
                                 />
                                 <p className="text-xs text-gray-500 mt-1">
                                     {entryData.bolNumber ? 
                                         `رقم البوليصة: ${entryData.bolNumber}` : 
                                         'جاري توليد رقم البوليصة...'
                                     }
                                 </p>
                             </div>
                            
                            
                            <div className="md:col-span-1">
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">ملاحظات عامة عن الإدخال</label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={entryData.notes}
                                    onChange={handleEntryChange}
                                    rows="2"
                                    className="p-2 border rounded-md w-full"
                                    placeholder="أي ملاحظات إضافية..."
                                ></textarea>
                            </div>
                        </div>
                    </fieldset>

                    {/* Items Section */}
                    <fieldset className="border p-4 rounded-md">
                        <legend className="px-2 font-semibold">تفاصيل البنود</legend>
                        {items.length === 0 && (
                            <p className="text-center text-gray-500 mb-4">لا توجد بنود مضافة بعد. اضغط "إضافة بند" لإضافة أول بند.</p>
                        )}
                        {items.map((item, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-x-4 gap-y-3 p-4 border border-gray-200 rounded-md mb-4 relative">
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="absolute top-2 left-2 text-red-500 hover:text-red-700 font-bold text-xl"
                                    title="حذف البند"
                                >
                                    &times;
                                </button>
                                <div className="col-span-full text-sm font-semibold text-gray-600 mb-2">
                                    بند رقم {index + 1}
                                    {entryData.entryType === 'incoming' && (
                                        <span className="text-red-500 text-xs mr-2">(رقم مشعار الفرع المرسل مطلوب)</span>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor={`sendingBranchMeshaarId-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                        {entryData.entryType === 'incoming' ? 'رقم مشعار الفرع المرسل' : 'رقم مرجعي (اختياري)'}
                                    </label>
                                    <input
                                        id={`sendingBranchMeshaarId-${index}`}
                                        type="text"
                                        name="sendingBranchMeshaarId"
                                        value={item.sendingBranchMeshaarId}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="p-2 border rounded-md w-full"
                                        placeholder={entryData.entryType === 'incoming' ? 'رقم مشعار الفرع الآخر' : 'رقم مرجعي للبند'}
                                        required={entryData.entryType === 'incoming'}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label htmlFor={`itemDescription-${index}`} className="block text-sm font-medium text-gray-700 mb-1">وصف البند</label>
                                    <input
                                        id={`itemDescription-${index}`}
                                        type="text"
                                        name="itemDescription"
                                        value={item.itemDescription}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="p-2 border rounded-md w-full"
                                        placeholder="مثال: طرد إلكترونيات، مستندات"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor={`itemQuantity-${index}`} className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
                                    <input
                                        id={`itemQuantity-${index}`}
                                        type="number"
                                        name="itemQuantity"
                                        value={item.itemQuantity}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="p-2 border rounded-md w-full"
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label htmlFor={`itemWeight-${index}`} className="block text-sm font-medium text-gray-700 mb-1">الوزن (كغ)</label>
                                    <input
                                        id={`itemWeight-${index}`}
                                        type="number"
                                        name="itemWeight"
                                        value={item.itemWeight}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="p-2 border rounded-md w-full"
                                        min="0"
                                    />
                                </div>
                                <div className="md:col-span-3 grid grid-cols-2 gap-x-4">
                                    <div>
                                        <label htmlFor={`itemValue-${index}`} className="block text-sm font-medium text-gray-700 mb-1">قيمة البند</label>
                                        <input
                                            id={`itemValue-${index}`}
                                            type="number"
                                            name="itemValue"
                                            value={item.itemValue}
                                            onChange={(e) => handleItemChange(index, e)}
                                            className="p-2 border rounded-md w-full"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`itemCurrency-${index}`} className="block text-sm font-medium text-gray-700 mb-1">عملة البند</label>
                                        <select
                                            id={`itemCurrency-${index}`}
                                            name="itemCurrency"
                                            value={item.itemCurrency}
                                            onChange={(e) => handleItemChange(index, e)}
                                            className="p-2 border rounded-md w-full bg-white"
                                        >
                                            <option value="USD">دولار أمريكي</option>
                                            <option value="SYP">ليرة سورية</option>
                                            <option value="TRY">ليرة تركية</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor={`recipientName-${index}`} className="block text-sm font-medium text-gray-700 mb-1">اسم المستلم (للبند)</label>
                                    <input
                                        id={`recipientName-${index}`}
                                        type="text"
                                        name="recipientName"
                                        value={item.recipientName}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="p-2 border rounded-md w-full"
                                        placeholder="اسم مستلم هذا البند"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor={`recipientPhone-${index}`} className="block text-sm font-medium text-gray-700 mb-1">هاتف المستلم (للبند)</label>
                                    <input
                                        id={`recipientPhone-${index}`}
                                        type="text"
                                        name="recipientPhone"
                                        value={item.recipientPhone}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="p-2 border rounded-md w-full"
                                        placeholder="رقم هاتف مستلم هذا البند"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label htmlFor={`destinationGovernorate-${index}`} className="block text-sm font-medium text-gray-700 mb-1">محافظة الوجهة (للبند)</label>
                                    <input
                                        id={`destinationGovernorate-${index}`}
                                        type="text"
                                        name="destinationGovernorate"
                                        value={item.destinationGovernorate}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="p-2 border rounded-md w-full"
                                        placeholder="مثال: نيقوسيا"
                                    />
                                </div>
                                <div className="md:col-span-full">
                                    <label htmlFor={`itemNotes-${index}`} className="block text-sm font-medium text-gray-700 mb-1">ملاحظات البند</label>
                                    <textarea
                                        id={`itemNotes-${index}`}
                                        name="itemNotes"
                                        value={item.itemNotes}
                                        onChange={(e) => handleItemChange(index, e)}
                                        rows="1"
                                        className="p-2 border rounded-md w-full"
                                        placeholder="ملاحظات خاصة بهذا البند..."
                                    ></textarea>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="w-full bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 mt-4"
                        >
                            إضافة بند جديد
                        </button>
                    </fieldset>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={closeModal} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">إلغاء</button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 font-semibold">
                            {isSubmitting ? 'جاري الحفظ...' : (existingEntryId ? 'حفظ التعديلات' : 'حفظ البوليصة')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
