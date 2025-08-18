// src/pages/CustomerPortalPage.jsx

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

// Re-using the status colors from other components for consistency
const STATUS_COLORS = {
  'تم الاستلام من المرسل': 'bg-blue-100 text-blue-800',
  'قيد النقل': 'bg-yellow-100 text-yellow-800',
  'وصلت الوجهة': 'bg-purple-100 text-purple-800',
  'تم التسليم': 'bg-green-100 text-green-800',
  'مرتجع': 'bg-red-100 text-red-800',
};

export default function CustomerPortalPage() {
    const { user } = useAuth();
    const [myShipments, setMyShipments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchUserAndShipments = async () => {
            setIsLoading(true);
            try {
                // 1. Get the user's phone number from their document in the 'users' collection
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists() || !userDoc.data().phone) {
                    setError('لم يتم العثور على رقم هاتف مرتبط بحسابك.');
                    setIsLoading(false);
                    return;
                }
                const userPhone = userDoc.data().phone;

                // 2. Perform two separate queries: one for sent, one for received
                const shipmentsRef = collection(db, 'shipments');
                const sentQuery = query(shipmentsRef, where("senderPhone", "==", userPhone));
                const receivedQuery = query(shipmentsRef, where("recipientPhone", "==", userPhone));

                const [sentSnapshot, receivedSnapshot] = await Promise.all([
                    getDocs(sentQuery),
                    getDocs(receivedQuery)
                ]);

                // 3. Merge the results and remove duplicates
                const shipmentsMap = new Map();
                sentSnapshot.forEach(doc => shipmentsMap.set(doc.id, { id: doc.id, ...doc.data() }));
                receivedSnapshot.forEach(doc => shipmentsMap.set(doc.id, { id: doc.id, ...doc.data() }));
                
                const combinedShipments = Array.from(shipmentsMap.values());
                
                // Sort by creation date, newest first
                combinedShipments.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

                setMyShipments(combinedShipments);

            } catch (err) {
                console.error("Error fetching customer shipments:", err);
                setError('حدث خطأ أثناء جلب شحناتك.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserAndShipments();

    }, [user]); // This effect runs whenever the user object changes

    return (
        <div className="bg-gray-50 min-h-screen p-8 font-sans" dir="rtl">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">بوابة العميل</h1>
                        <p className="text-gray-500">مرحباً بك، {user?.email}. هنا يمكنك عرض كل شحناتك.</p>
                    </div>
                    <Link to="/" className="text-sm text-indigo-600 hover:underline">
                        → العودة إلى الرئيسية
                    </Link>
                </div>

                {error && <p className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</p>}

                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-4 border-b">
                        <h2 className="text-xl font-semibold">سجل الشحنات</h2>
                    </div>
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <p className="text-center text-gray-500 p-10">جاري تحميل شحناتك...</p>
                        ) : myShipments.length === 0 ? (
                            <p className="text-center text-gray-500 p-10">
                                لا يوجد لديك أي شحنات مسجلة حالياً.
                            </p>
                        ) : (
                            <table className="w-full text-sm text-right">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-3">رقم الشحنة</th>
                                        <th className="p-3">المرسل</th>
                                        <th className="p-3">المستلم</th>
                                        <th className="p-3">المحافظة</th>
                                        <th className="p-3">التاريخ</th>
                                        <th className="p-3">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myShipments.map(shipment => (
                                        <tr key={shipment.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3 font-medium text-indigo-600">
                                                <Link to={`/track/${shipment.shipmentId}`} className="hover:underline">
                                                    {shipment.shipmentId}
                                                </Link>
                                            </td>
                                            <td className="p-3">{shipment.senderName}</td>
                                            <td className="p-3">{shipment.customerName}</td>
                                            <td className="p-3">{shipment.governorate}</td>
                                            <td className="p-3">{shipment.createdAt?.toDate().toLocaleDateString('ar-EG') || 'N/A'}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${STATUS_COLORS[shipment.status] || 'bg-gray-100 text-gray-800'}`}>
                                                    {shipment.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
