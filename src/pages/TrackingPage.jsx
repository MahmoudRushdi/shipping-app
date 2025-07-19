import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '/src/firebaseConfig';
import logo from '/src/assets/AL-MOSTAKEM-1.png';

const STATUS_COLORS = {
  'تم الاستلام من المرسل': 'bg-blue-100 text-blue-800',
  'قيد النقل': 'bg-yellow-100 text-yellow-800',
  'وصلت الوجهة': 'bg-purple-100 text-purple-800',
  'تم التسليم': 'bg-green-100 text-green-800',
  'مرتجع': 'bg-red-100 text-red-800',
};

// --- مكون عرض تفاصيل الشحنة ---
function ShipmentDetails({ shipment }) {
    return (
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 relative mt-8">
            <img src={logo} alt="شعار الشركة" className="h-16 absolute top-8 left-8" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">تفاصيل الشحنة</h2>
            <p className="text-indigo-600 font-mono text-lg mb-6">{shipment.shipmentId}</p>
            
            <div className="mb-6 text-right">
                <h3 className="text-lg font-semibold text-gray-700">مرحباً, {shipment.customerName}</h3>
                <p className="text-gray-500">هذه هي آخر تحديثات شحنتك.</p>
            </div>

            <div className="w-full">
                <div className={`p-4 rounded-lg text-center ${STATUS_COLORS[shipment.status]}`}>
                    <p className="font-bold text-lg">{shipment.status}</p>
                    <p className="text-sm">آخر تحديث: {shipment.date}</p>
                </div>
            </div>
        </div>
    );
}


// --- المكون الرئيسي لصفحة التتبع ---
export default function TrackingPage() {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTrackShipment = async (e) => {
        e.preventDefault();
        if (!trackingNumber.trim()) {
            setError('يرجى إدخال رقم الشحنة.');
            return;
        }
        setLoading(true);
        setError('');
        setShipment(null);

        try {
            const q = query(collection(db, "shipments"), where("shipmentId", "==", trackingNumber.trim()));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                setError('عذراً، لم يتم العثور على شحنة بهذا الرقم.');
            } else {
                const shipmentData = querySnapshot.docs[0].data();
                setShipment({
                    ...shipmentData,
                    date: shipmentData.createdAt?.toDate().toLocaleDateString('ar-EG')
                });
            }
        } catch (err) {
            console.error(err);
            setError('حدث خطأ أثناء جلب بيانات الشحنة.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4" dir="rtl">
            {/* --- نموذج إدخال رقم الشحنة --- */}
            <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">تتبع شحنتك</h1>
                <p className="text-gray-500 text-center mb-6">أدخل رقم الشحنة أدناه لمعرفة حالتها.</p>
                <form onSubmit={handleTrackShipment} className="flex gap-2">
                    <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="أدخل رقم الشحنة هنا..."
                        className="flex-grow p-3 border rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
                    >
                        {loading ? 'جاري البحث...' : 'تتبع'}
                    </button>
                </form>
            </div>

            {/* --- عرض النتيجة --- */}
            {error && <p className="mt-4 text-red-500">{error}</p>}
            {shipment && <ShipmentDetails shipment={shipment} />}
        </div>
    );
}
