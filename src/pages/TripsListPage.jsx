import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const STATUS_STYLES = {
    "قيد الانتظار": "bg-yellow-100 text-yellow-800",
    "In Transit": "bg-blue-100 text-blue-800",
    "Delivered": "bg-green-100 text-green-800",
    "Cancelled": "bg-red-100 text-red-800",
    "Pending": "bg-yellow-100 text-yellow-800",
};

export default function TripsListPage() {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const tripsCollection = collection(db, 'trips');
    const q = query(tripsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tripsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate().toLocaleDateString('en-CA') || 'N/A'
      }));
      setTrips(tripsList);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleTripClick = (tripId) => {
    window.location.href = `/trip/${tripId}`;
  };

  // --- NEW: Function to delete a trip and release its shipments ---
  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm("هل أنت متأكد من أنك تريد حذف هذه الرحلة؟ سيتم إلغاء تعيين جميع الشحنات المرتبطة بها.")) {
        return;
    }

    try {
        const tripRef = doc(db, 'trips', tripId);
        const tripSnap = await getDoc(tripRef);

        if (tripSnap.exists()) {
            const shipmentIds = tripSnap.data().shipmentIds || [];
            // Create a batch of updates to un-assign shipments
            const updatePromises = shipmentIds.map(id => {
                const shipmentRef = doc(db, 'shipments', id);
                return updateDoc(shipmentRef, {
                    assignedCar: "",
                    status: "تم الاستلام من المرسل"
                });
            });
            await Promise.all(updatePromises);
        }

        // After updating shipments, delete the trip itself
        await deleteDoc(tripRef);
        alert("تم حذف الرحلة بنجاح.");

    } catch (error) {
        console.error("Error deleting trip: ", error);
        alert("حدث خطأ أثناء حذف الرحلة.");
    }
  };


  return (
    <div className="bg-gray-50 min-h-screen p-8 font-sans" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">إدارة الرحلات</h1>
          <a href="/dashboard" className="text-sm text-indigo-600 hover:underline">
            → العودة إلى لوحة التحكم الرئيسية
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">قائمة الرحلات المنشأة</h2>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <p className="text-center text-gray-500 p-10">جاري تحميل الرحلات...</p>
            ) : (
              <table className="w-full text-sm text-right">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3">تاريخ الإنشاء</th>
                    <th className="p-3">اسم السيارة</th>
                    <th className="p-3">عدد الشحنات</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map(trip => (
                    <tr key={trip.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{trip.date}</td>
                      <td className="p-3 font-semibold">{trip.carName}</td>
                      <td className="p-3">{trip.shipmentIds.length}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${STATUS_STYLES[trip.status] || 'bg-gray-100 text-gray-800'}`}>
                          {trip.status}
                        </span>
                      </td>
                      <td className="p-3 text-left">
                        {/* --- NEW: Actions buttons --- */}
                        <div className="flex gap-4 justify-end">
                            <button 
                                onClick={() => handleTripClick(trip.id)}
                                className="text-indigo-600 hover:text-indigo-900 font-semibold"
                            >
                                عرض التفاصيل
                            </button>
                             <button 
                                onClick={() => handleDeleteTrip(trip.id)}
                                className="text-red-600 hover:text-red-900 font-semibold"
                            >
                                حذف
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!isLoading && trips.length === 0 && (
              <p className="text-center text-gray-500 p-10">لم يتم إنشاء أي رحلات بعد.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}