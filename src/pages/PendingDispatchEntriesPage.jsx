import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { SearchIcon } from '../components/Icons';
import BulkDispatchModal from '../components/BulkDispatchModal';
import { ArrowRightIcon } from '../components/Icons';

export default function PendingDispatchEntriesPage() {
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEntryIds, setSelectedEntryIds] = useState([]);
    const [isBulkDispatchModalOpen, setIsBulkDispatchModalOpen] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        const entriesCollection = collection(db, 'branch_entries');
        const q = query(entriesCollection, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let entriesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().createdAt?.toDate().toLocaleDateString('ar-EG') || 'N/A'
            }));

            entriesList = entriesList.filter(entry =>
                entry.entryType === 'incoming' &&
                entry.items && entry.items.some(item => item.itemQuantity - (item.dispatchedQuantity || 0) > 0)
            );

            if (searchTerm) {
                entriesList = entriesList.filter(entry =>
                    entry.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (entry.vehicleName && entry.vehicleName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (entry.items && entry.items.some(item => item.itemDescription.toLowerCase().includes(searchTerm.toLowerCase())))
                );
            }

            setEntries(entriesList);
            setIsLoading(false);
            setSelectedEntryIds(prevSelected => prevSelected.filter(id => entriesList.some(entry => entry.id === id)));
        }, (err) => {
            console.error("Error fetching pending dispatch entries:", err);
            setError("فشل تحميل الإدخالات المعلقة.");
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [searchTerm]);

    const handleCheckboxChange = (entryId) => {
        setSelectedEntryIds(prevSelected =>
            prevSelected.includes(entryId)
                ? prevSelected.filter(id => id !== entryId)
                : [...prevSelected, entryId]
        );
    };

    const getSelectedEntries = () => {
        return entries.filter(entry => selectedEntryIds.includes(entry.id));
    };

    const handleBulkDispatchComplete = (message) => {
        alert(message);
        setIsBulkDispatchModalOpen(false);
        setSelectedEntryIds([]);
    };

    return (
        <div className="bg-gray-50 min-h-screen p-8 font-sans" dir="rtl">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">إدخالات واردة بانتظار الإخراج</h1>
                        <p className="text-gray-500">عرض وإدارة البضائع الواردة التي لم يتم إخراجها بالكامل بعد.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/branch-entries" className="text-sm text-indigo-600 hover:underline">
                            → العودة إلى قائمة الإدخالات الرئيسية
                        </Link>
                    </div>
                </div>

                {error && <div className="bg-red-100 text-red-800 p-3 rounded-lg text-center mb-4">{error}</div>}

                {/* Search Bar */}
                <div className="relative w-full max-w-md mx-auto mb-6">
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3"><SearchIcon /></span>
                    <input
                        type="text"
                        placeholder="ابحث باسم الفرع، المركبة، أو وصف البند..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-right"
                    />
                </div>

                {/* Bulk Dispatch Button */}
                {selectedEntryIds.length > 0 && (
                    <div className="text-center mb-6">
                        <button
                            onClick={() => setIsBulkDispatchModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-teal-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-teal-700 transition-colors duration-200 text-lg mx-auto"
                        >
                            <ArrowRightIcon className="w-6 h-6" />
                            <span>إخراج البنود المحددة ({selectedEntryIds.length})</span>
                        </button>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-4 border-b">
                        <h2 className="text-xl font-semibold">قائمة الإدخالات المعلقة</h2>
                    </div>
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <p className="text-center text-gray-500 p-10">جاري تحميل الإدخالات...</p>
                        ) : entries.length === 0 ? (
                            <p className="text-center text-gray-500 p-10">لا توجد إدخالات واردة بانتظار الإخراج حالياً.</p>
                        ) : (
                            <table className="w-full text-sm text-right">
                                <thead className="bg-gray-100 text-gray-700 uppercase">
                                    <tr>
                                        <th className="p-3">تحديد</th>{/* Removed whitespace */}
                                        <th className="p-3">اسم الفرع</th>{/* Removed whitespace */}
                                        <th className="p-3">المركبة</th>{/* Removed whitespace */}
                                        <th className="p-3">عدد البنود المعلقة</th>{/* Removed whitespace */}
                                        <th className="p-3">تاريخ الإنشاء</th>{/* Removed whitespace */}
                                        <th className="p-3">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map(entry => {
                                        const pendingItemsCount = entry.items ? entry.items.filter(item => item.itemQuantity - (item.dispatchedQuantity || 0) > 0).length : 0;
                                        return (
                                            <tr key={entry.id} className="border-b hover:bg-gray-50">
                                                <td className="p-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedEntryIds.includes(entry.id)}
                                                        onChange={() => handleCheckboxChange(entry.id)}
                                                        className="h-4 w-4 text-indigo-600 rounded"
                                                    />
                                                </td>
                                                <td className="p-3 font-medium">{entry.branchName}</td>
                                                <td className="p-3">{entry.vehicleName || 'غير محدد'}</td>
                                                <td className="p-3 text-red-600 font-semibold">{pendingItemsCount}</td>
                                                <td className="p-3">{entry.date}</td>
                                                <td className="p-3">
                                                    <Link
                                                        to={`/branch-entries/${entry.id}`}
                                                        className="text-indigo-600 hover:text-indigo-900 font-semibold"
                                                    >
                                                        عرض التفاصيل وإخراج البنود
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
            {isBulkDispatchModalOpen && (
                <BulkDispatchModal
                    closeModal={() => setIsBulkDispatchModalOpen(false)}
                    onDispatchComplete={handleBulkDispatchComplete}
                    selectedEntries={getSelectedEntries()}
                />
            )}
        </div>
    );
}
