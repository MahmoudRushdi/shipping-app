import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, query, onSnapshot, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig'; // Ensure correct path
import { format } from 'date-fns';

export default function BulkDispatchModal({ closeModal, onDispatchComplete, selectedEntries }) {
    // selectedEntries is an array of full entry objects that were selected on PendingDispatchEntriesPage
    const [dispatchData, setDispatchData] = useState({
        carId: '',
        carName: '',
        destinationCities: '', // Comma-separated cities
        officeExpenses: 0,
        officeExpensesCurrency: 'USD',
        carExpenses: 0,
        carExpensesCurrency: 'USD',
        expense1_name: '',
        expense1_value: 0,
        expense1_currency: 'USD',
        expense2_name: '',
        expense2_value: 0,
        expense2_currency: 'USD',
        mainNotes: '', // General notes for the trip
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [routes, setRoutes] = useState([]); // To fetch available cars/routes for selection

    // Fetch available cars/vehicles
    useEffect(() => {
        const vehiclesCollection = collection(db, 'vehicles');
        const unsubscribe = onSnapshot(vehiclesCollection, (snapshot) => {
            const vehiclesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRoutes(vehiclesList);
        }, (err) => {
            console.error("Error fetching vehicles (BulkDispatchModal):", err);
            setError("فشل تحميل قائمة السيارات.");
        });
        return () => unsubscribe();
    }, []);

    // Prevent body scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const val = (type === 'number') ? parseFloat(value) : value;

        setDispatchData(prev => {
            const newState = { ...prev, [name]: val };
            if (name === 'carId') {
                const selectedRoute = routes.find(route => route.id === value);
                newState.carName = selectedRoute ? selectedRoute.name : '';
            }
            return newState;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!dispatchData.carId) {
            setError('يرجى اختيار المركبة.');
            setIsSubmitting(false);
            return;
        }
        if (!dispatchData.destinationCities.trim()) {
            setError('يرجى إدخال المدن المستهدفة.');
            setIsSubmitting(false);
            return;
        }

        try {
            const itemsForTrip = [];
            const updatesToOriginalEntries = [];

            const newTripRef = doc(collection(db, 'trips'));
            const newTripId = newTripRef.id;

            for (const entry of selectedEntries) {
                const entryDocRef = doc(db, 'branch_entries', entry.id);
                const currentEntrySnap = await getDoc(entryDocRef);
                if (!currentEntrySnap.exists()) {
                    console.warn(`Original entry ${entry.id} not found during bulk dispatch.`);
                    continue;
                }
                const currentEntryData = currentEntrySnap.data();
                let updatedItemsForCurrentEntry = currentEntryData.items ? currentEntryData.items.map(item => ({ ...item })) : [];

                for (let i = 0; i < updatedItemsForCurrentEntry.length; i++) {
                    const item = updatedItemsForCurrentEntry[i];
                    const remainingQuantity = item.itemQuantity - (item.dispatchedQuantity || 0);

                    if (remainingQuantity > 0) {
                        const dispatchedAmount = remainingQuantity;

                        const newItemState = { ...item };
                        newItemState.dispatchedQuantity = (newItemState.dispatchedQuantity || 0) + dispatchedAmount;
                        newItemState.assignedTripId = newTripId;

                        // NEW: Update itemStatus based on dispatched quantity
                        if (newItemState.dispatchedQuantity === newItemState.itemQuantity) {
                            newItemState.itemStatus = 'Fully Dispatched';
                        } else if (newItemState.dispatchedQuantity > 0) {
                            newItemState.itemStatus = 'Partially Dispatched';
                        } else {
                            newItemState.itemStatus = 'Received'; // Should ideally not happen here
                        }

                        if (!newItemState.dispatchHistory) {
                            newItemState.dispatchHistory = [];
                        }
                        newItemState.dispatchHistory.push({
                            dispatchedAmount: dispatchedAmount,
                            dispatchedDate: new Date(),
                            destinationType: 'bulk_dispatch_trip',
                            destinationCities: dispatchData.destinationCities,
                            assignedCar: dispatchData.carName,
                            notes: `إخراج مجمع للرحلة إلى ${dispatchData.destinationCities}. ${dispatchData.mainNotes}`,
                            recordedBy: auth.currentUser?.email || 'Unknown',
                        });

                        updatedItemsForCurrentEntry[i] = newItemState;

                        itemsForTrip.push({
                            originalEntryId: entry.id,
                            originalItemOrderIndex: item.orderIndex,
                            itemDescription: item.itemDescription,
                            dispatchedAmount: dispatchedAmount,
                            itemValue: item.itemValue,
                            itemCurrency: item.itemCurrency,
                            recipientName: item.recipientName,
                            recipientPhone: item.recipientPhone,
                            destinationGovernorate: item.destinationGovernorate,
                        });
                    }
                }
                updatesToOriginalEntries.push({ id: entry.id, items: updatedItemsForCurrentEntry });
            }

            if (itemsForTrip.length === 0) {
                setError('لا توجد بنود قابلة للإخراج في الإدخالات المختارة.');
                setIsSubmitting(false);
                return;
            }

            await setDoc(newTripRef, {
                carId: dispatchData.carId,
                carName: dispatchData.carName,
                destination: dispatchData.destinationCities,
                officeExpenses: dispatchData.officeExpenses,
                officeExpensesCurrency: dispatchData.officeExpensesCurrency,
                carExpenses: dispatchData.carExpenses,
                carExpensesCurrency: dispatchData.carExpensesCurrency,
                expense1_name: dispatchData.expense1_name,
                expense1_value: dispatchData.expense1_value,
                expense1_currency: dispatchData.expense1_currency,
                expense2_name: dispatchData.expense2_name,
                expense2_value: dispatchData.expense2_value,
                expense2_currency: dispatchData.expense2_currency,
                notes: dispatchData.mainNotes,
                status: 'In Transit',
                createdAt: serverTimestamp(),
                createdBy: auth.currentUser?.email || 'Unknown',
                dispatchedBranchItems: itemsForTrip,
            });

            const batch = [];
            for (const update of updatesToOriginalEntries) {
                const entryRef = doc(db, 'branch_entries', update.id);
                batch.push(updateDoc(entryRef, { items: update.items }));
            }
            await Promise.all(batch);


            onDispatchComplete(`تم إنشاء الرحلة الجديدة بنجاح برقم ${newTripId} وإخراج البنود المختارة.`);
            closeModal();

        } catch (err) {
            console.error("Error during bulk dispatch:", err);
            setError('حدث خطأ أثناء عملية الإخراج المجمع. يرجى المحاولة مرة أخرى.');
        }
        setIsSubmitting(false);
    };

    const totalSelectedItems = selectedEntries.reduce((count, entry) => {
        return count + (entry.items ? entry.items.filter(item => item.itemQuantity - (item.dispatchedQuantity || 0) > 0).length : 0);
    }, 0);
    const totalSelectedQuantity = selectedEntries.reduce((sum, entry) => {
        return sum + (entry.items ? entry.items.filter(item => item.itemQuantity - (item.dispatchedQuantity || 0) > 0).reduce((itemSum, item) => itemSum + (item.itemQuantity - (item.dispatchedQuantity || 0)), 0) : 0);
    }, 0);


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center z-50 overflow-y-auto p-4" dir="rtl">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl m-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">إخراج مجمع للواردات</h2>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg text-center mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-md text-blue-800 font-semibold mb-4">
                        <p>عدد الإدخالات المختارة: {selectedEntries.length}</p>
                        <p>إجمالي البنود القابلة للإخراج: {totalSelectedItems}</p>
                        <p>إجمالي الكمية القابلة للإخراج: {totalSelectedQuantity}</p>
                    </div>

                    <fieldset className="border p-4 rounded-md">
                        <legend className="px-2 font-semibold">معلومات الرحلة الجديدة</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div>
                                <label htmlFor="carId" className="block text-sm font-medium text-gray-700 mb-1">المركبة</label>
                                <select
                                    id="carId"
                                    name="carId"
                                    value={dispatchData.carId}
                                    onChange={handleChange}
                                    className="p-2 border rounded-md w-full bg-white"
                                    required
                                >
                                    <option value="">اختر مركبة...</option>
                                    {routes.map(route => (
                                        <option key={route.id} value={route.id}>{route.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="destinationCities" className="block text-sm font-medium text-gray-700 mb-1">المدن المستهدفة (فاصلة بين المدن)</label>
                                <input
                                    id="destinationCities"
                                    type="text"
                                    name="destinationCities"
                                    value={dispatchData.destinationCities}
                                    onChange={handleChange}
                                    className="p-2 border rounded-md w-full"
                                    placeholder="مثال: حلب، دمشق"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="officeExpenses" className="block text-sm font-medium text-gray-700 mb-1">مصاريف المكتب</label>
                                <div className="flex gap-2">
                                    <input
                                        id="officeExpenses"
                                        type="number"
                                        name="officeExpenses"
                                        value={dispatchData.officeExpenses}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-md"
                                        min="0"
                                    />
                                    <select
                                        name="officeExpensesCurrency"
                                        value={dispatchData.officeExpensesCurrency}
                                        onChange={handleChange}
                                        className="p-2 border rounded-md bg-white"
                                    >
                                        <option value="USD">دولار أمريكي</option>
                                        <option value="SYP">ليرة سورية</option>
                                        <option value="TRY">ليرة تركية</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="carExpenses" className="block text-sm font-medium text-gray-700 mb-1">مصاريف السيارة</label>
                                <div className="flex gap-2">
                                    <input
                                        id="carExpenses"
                                        type="number"
                                        name="carExpenses"
                                        value={dispatchData.carExpenses}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-md"
                                        min="0"
                                    />
                                    <select
                                        name="carExpensesCurrency"
                                        value={dispatchData.carExpensesCurrency}
                                        onChange={handleChange}
                                        className="p-2 border rounded-md bg-white"
                                    >
                                        <option value="USD">دولار أمريكي</option>
                                        <option value="SYP">ليرة سورية</option>
                                        <option value="TRY">ليرة تركية</option>
                                    </select>
                                </div>
                            </div>
                            {/* NEW: Additional Expense 1 */}
                            <div>
                                <label htmlFor="expense1_name" className="block text-sm font-medium text-gray-700 mb-1">مصروف إضافي 1 (اسم)</label>
                                <input
                                    id="expense1_name"
                                    type="text"
                                    name="expense1_name"
                                    value={dispatchData.expense1_name}
                                    onChange={handleChange}
                                    className="p-2 border rounded-md w-full"
                                    placeholder="مثال: رسوم طريق"
                                />
                            </div>
                            <div>
                                <label htmlFor="expense1_value" className="block text-sm font-medium text-gray-700 mb-1">مصروف إضافي 1 (قيمة)</label>
                                <div className="flex gap-2">
                                    <input
                                        id="expense1_value"
                                        type="number"
                                        name="expense1_value"
                                        value={dispatchData.expense1_value}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-md"
                                        min="0"
                                    />
                                    <select
                                        name="expense1_currency"
                                        value={dispatchData.expense1_currency}
                                        onChange={handleChange}
                                        className="p-2 border rounded-md bg-white"
                                    >
                                        <option value="USD">دولار أمريكي</option>
                                        <option value="SYP">ليرة سورية</option>
                                        <option value="TRY">ليرة تركية</option>
                                    </select>
                                </div>
                            </div>
                            {/* NEW: Additional Expense 2 */}
                            <div>
                                <label htmlFor="expense2_name" className="block text-sm font-medium text-gray-700 mb-1">مصروف إضافي 2 (اسم)</label>
                                <input
                                    id="expense2_name"
                                    type="text"
                                    name="expense2_name"
                                    value={dispatchData.expense2_name}
                                    onChange={handleChange}
                                    className="p-2 border rounded-md w-full"
                                    placeholder="مثال: صيانة"
                                />
                            </div>
                            <div>
                                <label htmlFor="expense2_value" className="block text-sm font-medium text-gray-700 mb-1">مصروف إضافي 2 (قيمة)</label>
                                <div className="flex gap-2">
                                    <input
                                        id="expense2_value"
                                        type="number"
                                        name="expense2_value"
                                        value={dispatchData.expense2_value}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-md"
                                        min="0"
                                    />
                                    <select
                                        name="expense2_currency"
                                        value={dispatchData.expense2_currency}
                                        onChange={handleChange}
                                        className="p-2 border rounded-md bg-white"
                                    >
                                        <option value="USD">دولار أمريكي</option>
                                        <option value="SYP">ليرة سورية</option>
                                        <option value="TRY">ليرة تركية</option>
                                    </select>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="mainNotes" className="block text-sm font-medium text-gray-700 mb-1">ملاحظات عامة للرحلة</label>
                                <textarea
                                    id="mainNotes"
                                    name="mainNotes"
                                    value={dispatchData.mainNotes}
                                    onChange={handleChange}
                                    rows="2"
                                    className="p-2 border rounded-md w-full"
                                    placeholder="مصاريف فرعية، ملاحظات إضافية عن الرحلة..."
                                ></textarea>
                            </div>
                        </div>
                    </fieldset>

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={closeModal} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">إلغاء</button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 font-semibold">
                            {isSubmitting ? 'جاري إنشاء الرحلة...' : 'إنشاء رحلة وإخراج البنود'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
