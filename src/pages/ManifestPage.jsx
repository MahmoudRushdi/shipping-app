import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import logo from '../assets/AL-MOSTAKEM-1.png';

const formatMultiCurrency = (shipment) => {
    const totals = {};
    const goodsVal = parseFloat(shipment.goodsValue) || 0;
    if (goodsVal > 0) {
        const currency = shipment.goodsCurrency || 'USD';
        totals[currency] = (totals[currency] || 0) + goodsVal;
    }
    if (shipment.shippingFeePaymentMethod === 'collect') {
        const shippingVal = parseFloat(shipment.shippingFee) || 0;
        if (shippingVal > 0) {
            const currency = shipment.shippingFeeCurrency || 'USD';
            totals[currency] = (totals[currency] || 0) + shippingVal;
        }
    }
    const hwalaVal = parseFloat(shipment.hwalaFee) || 0;
    if (hwalaVal > 0) {
        const currency = shipment.hwalaFeeCurrency || 'USD';
        totals[currency] = (totals[currency] || 0) + hwalaVal;
    }
    const totalStrings = Object.entries(totals).map(([currency, amount]) => {
        return `${amount.toLocaleString()} ${currency}`;
    });
    return totalStrings.join(' + ') || '0 USD';
};

export default function ManifestPage() {
  const [routes, setRoutes] = useState([]);
  const [unassignedShipments, setUnassignedShipments] = useState([]);
  const [selectedShipments, setSelectedShipments] = useState([]);
  const [selectedCar, setSelectedCar] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const routesCollection = collection(db, 'routes');
    const unsubscribe = onSnapshot(routesCollection, (snapshot) => {
      const routesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRoutes(routesList);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'shipments'), where("assignedCar", "==", ""));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shipmentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUnassignedShipments(shipmentsList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching unassigned shipments: ", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCheckboxChange = (shipmentId) => {
    setSelectedShipments(prevSelected =>
      prevSelected.includes(shipmentId)
        ? prevSelected.filter(id => id !== shipmentId)
        : [...prevSelected, shipmentId]
    );
  };

  const handleCreateTrip = async () => {
    if (selectedShipments.length === 0) {
        alert("يرجى تحديد شحنة واحدة على الأقل.");
        return;
    }
    if (!selectedCar) {
        alert("يرجى اختيار سيارة.");
        return;
    }

    setIsSubmitting(true);
    
    try {
        await addDoc(collection(db, 'trips'), {
            carName: selectedCar,
            shipmentIds: selectedShipments,
            createdAt: serverTimestamp(),
            expenses: {
                vehicleRental: 0,
                driverCommission: 0,
                other: 0,
            },
            // --- This is the corrected line ---
            status: "قيد الانتظار"
        });
        
        const updatePromises = selectedShipments.map(shipmentId => {
            const shipmentRef = doc(db, 'shipments', shipmentId);
            return updateDoc(shipmentRef, {
                assignedCar: selectedCar,
                status: "قيد النقل"
            });
        });

        await Promise.all(updatePromises);

        alert(`تم إنشاء الرحلة بنجاح لـ ${selectedCar} بعدد ${selectedShipments.length} شحنة.`);
        
        setSelectedShipments([]);
        setSelectedCar('');

    } catch (error) {
        console.error("Error creating trip: ", error);
        alert("حدث خطأ أثناء إنشاء الرحلة.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-8 font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
                <img src={logo} alt="شعار الشركة" className="h-20 w-auto" />
                <h1 className="text-3xl font-bold text-gray-800">إنشاء رحلة / بيان تحميل</h1>
            </div>
            <a href="/dashboard" className="text-sm text-indigo-600 hover:underline">
                → العودة إلى لوحة التحكم الرئيسية
            </a>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 bg-gray-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold">
                  تحديد الشحنات ({selectedShipments.length} شحنة محددة)
                </h2>
                <div className="flex items-center gap-2">
                    <select
                        value={selectedCar}
                        onChange={(e) => setSelectedCar(e.target.value)}
                        className="p-2 border rounded-md bg-white w-48"
                    >
                        <option value="">اختر سيارة...</option>
                        {routes.map(route => (
                          <option key={route.id} value={route.name}>{route.name}</option>
                        ))}
                    </select>
                  <button
                        onClick={handleCreateTrip}
                        disabled={isSubmitting || selectedShipments.length === 0 || !selectedCar}
                        className="bg-green-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء رحلة'}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                {isLoading ? <p className="text-center py-4">جاري تحميل الشحنات...</p> : (
                    <table className="w-full text-sm text-right">
                      <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 w-12">تحديد</th>
                                <th className="p-3">رقم الشحنة</th>
                                <th className="p-3">العميل</th>
                                <th className="p-3">المحافظة</th>
                                <th className="p-3">المبلغ المحصل</th>
                            </tr>
                        </thead>
                        <tbody>
                           {unassignedShipments.map(shipment => (
                                <tr key={shipment.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 text-center">
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={selectedShipments.includes(shipment.id)}
                                            onChange={() => handleCheckboxChange(shipment.id)}
                                        />
                                    </td>
                                    <td className="p-3 font-medium">{shipment.shipmentId}</td>
                                    <td className="p-3">{shipment.customerName}</td>
                                    <td className="p-3">{shipment.governorate}</td>
                                    <td className="p-3 font-semibold">{formatMultiCurrency(shipment)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!isLoading && unassignedShipments.length === 0 && (
                    <p className="text-center text-gray-400 py-10">لا توجد شحنات جاهزة للتوزيع حالياً.</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}