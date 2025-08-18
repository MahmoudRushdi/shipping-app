import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { SearchIcon } from '../components/Icons'; // Assuming SearchIcon is available

export default function FullyDispatchedEntriesPage() {
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setIsLoading(true);
        const entriesCollection = collection(db, 'branch_entries');
        // Fetch all branch entries, then filter client-side for fully dispatched
        const q = query(entriesCollection, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let entriesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().createdAt?.toDate().toLocaleDateString('ar-EG') || 'N/A'
            }));

            // Filter for 'incoming' entries where ALL items have remaining quantity <= 0
            entriesList = entriesList.filter(entry =>
                entry.entryType === 'incoming' &&
                entry.items && entry.items.every(item => (item.itemQuantity - (item.dispatchedQuantity || 0)) <= 0)
            );

            // Apply client-side search filter
            if (searchTerm) {
                entriesList = entriesList.filter(entry =>
                    entry.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (entry.vehicleName && entry.vehicleName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (entry.items && entry.items.some(item => item.itemDescription.toLowerCase().includes(searchTerm.toLowerCase())))
                );
            }

            setEntries(entriesList);
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching fully dispatched entries:", err);
            setError("فشل تحميل الإدخالات المخرجة بالكامل.");
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [searchTerm]);

    return (
        <div className="bg-gray-50 min-h-screen p-8 font-sans" dir="rtl">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">إدخالات واردة مخرجة بالكامل</h1>
                        <p className="text-gray-500">عرض البضائع الواردة التي تم إخراجها بالكامل.</p>
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

                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-4 border-b">
                        <h2 className="text-xl font-semibold">قائمة الإدخالات المخرجة بالكامل</h2>
                    </div>
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <p className="text-center text-gray-500 p-10">جاري تحميل الإدخالات...</p>
                        ) : entries.length === 0 ? (
                            <p className="text-center text-gray-500 p-10">لا توجد إدخالات واردة مخرجة بالكامل حالياً.</p>
                        ) : (
                            <table className="w-full text-sm text-right">
                                <thead className="bg-gray-100 text-gray-700 uppercase">
                                    <tr>
                                        <th className="p-3">اسم الفرع</th>
                                        <th className="p-3">المركبة</th>
                                        <th className="p-3">عدد البنود الكلية</th>
                                        <th className="p-3">تاريخ الإنشاء</th>
                                        <th className="p-3">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map(entry => {
                                        const totalItemsCount = entry.items ? entry.items.length : 0;
                                        return (
                                            <tr key={entry.id} className="border-b hover:bg-gray-50">
                                                <td className="p-3 font-medium">{entry.branchName}</td>
                                                <td className="p-3">{entry.vehicleName || 'غير محدد'}</td>
                                                <td className="p-3 text-green-600 font-semibold">{totalItemsCount}</td>
                                                <td className="p-3">{entry.date}</td>
                                                <td className="p-3">
                                                    <Link
                                                        to={`/branch-entries/${entry.id}`}
                                                        className="text-indigo-600 hover:text-indigo-900 font-semibold"
                                                    >
                                                        عرض التفاصيل
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
        </div>
    );
}
