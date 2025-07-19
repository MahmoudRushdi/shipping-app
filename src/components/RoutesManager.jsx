import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function RoutesManager() {
  const [routes, setRoutes] = useState([]);
  const [newRouteName, setNewRouteName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // جلب الوجهات الحالية من قاعدة البيانات
  useEffect(() => {
    const routesCollection = collection(db, 'routes');
    const unsubscribe = onSnapshot(routesCollection, (snapshot) => {
      const routesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRoutes(routesList);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // إضافة وجهة جديدة
  const handleAddRoute = async (e) => {
    e.preventDefault();
    if (!newRouteName.trim()) return;
    try {
      await addDoc(collection(db, 'routes'), { name: newRouteName.trim() });
      setNewRouteName('');
    } catch (error) {
      console.error("Error adding route: ", error);
      alert("حدث خطأ أثناء إضافة الوجهة.");
    }
  };

  // حذف وجهة
  const handleDeleteRoute = async (routeId) => {
    if (window.confirm("هل أنت متأكد من أنك تريد حذف هذه الوجهة؟")) {
      try {
        await deleteDoc(doc(db, 'routes', routeId));
      } catch (error) {
        console.error("Error deleting route: ", error);
        alert("حدث خطأ أثناء حذف الوجهة.");
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-8">
      <h2 className="text-xl font-semibold mb-4">إدارة السيارات / الوجهات</h2>
      <form onSubmit={handleAddRoute} className="flex gap-4 mb-4">
        <input
          type="text"
          value={newRouteName}
          onChange={(e) => setNewRouteName(e.target.value)}
          placeholder="أدخل اسم السيارة أو الوجهة الجديدة (مثال: سيارة حلب)"
          className="flex-grow p-2 border rounded-md"
        />
        <button type="submit" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">
          إضافة
        </button>
      </form>
      {isLoading ? <p>جاري تحميل الوجهات...</p> : (
        <ul className="space-y-2">
          {routes.map(route => (
            <li key={route.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
              <span>{route.name}</span>
              <button onClick={() => handleDeleteRoute(route.id)} className="text-red-500 hover:text-red-700 text-xs">حذف</button>
            </li>
          ))}
           {routes.length === 0 && <p className="text-center text-gray-400 py-4">لا توجد وجهات معرفة حالياً.</p>}
        </ul>
      )}
    </div>
  );
}
