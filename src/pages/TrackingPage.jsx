import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '/src/firebaseConfig';
import { useLanguage } from '../hooks/useLanguage.jsx';


const STATUS_COLORS = {
  'تم الاستلام من المرسل': 'bg-blue-100 text-blue-800',
  'قيد النقل': 'bg-yellow-100 text-yellow-800',
  'وصلت الوجهة': 'bg-purple-100 text-purple-800',
  'تم التسليم': 'bg-green-100 text-green-800',
  'مرتجع': 'bg-red-100 text-red-800',
  // English statuses
  'Received from sender': 'bg-blue-100 text-blue-800',
  'In transit': 'bg-yellow-100 text-yellow-800',
  'Arrived at destination': 'bg-purple-100 text-purple-800',
  'Delivered': 'bg-green-100 text-green-800',
  'Returned': 'bg-red-100 text-red-800',
};

// Function to translate shipment status based on language
const translateStatus = (status, language) => {
  const statusTranslations = {
    'تم الاستلام من المرسل': {
      ar: 'تم الاستلام من المرسل',
      en: 'Received from sender'
    },
    'قيد النقل': {
      ar: 'قيد النقل',
      en: 'In Transit'
    },
    'وصلت الوجهة': {
      ar: 'وصلت الوجهة',
      en: 'Arrived at destination'
    },
    'تم التسليم': {
      ar: 'تم التسليم',
      en: 'Delivered'
    },
    'مرتجع': {
      ar: 'مرتجع',
      en: 'Returned'
    }
  };
  
  return statusTranslations[status]?.[language] || status;
};

// --- Shipment Details Component ---
function ShipmentDetails({ shipment }) {
    const { language, tr } = useLanguage();
    
    // Translate the status based on current language
    const translatedStatus = translateStatus(shipment.status, language);
    
    return (
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 relative mt-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{tr('shipmentDetails')}</h2>
            <p className="text-indigo-600 font-mono text-lg mb-6">{shipment.shipmentId}</p>
            
            <div className={`mb-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <h3 className="text-lg font-semibold text-gray-700">{tr('hello')}, {shipment.customerName}</h3>
                <p className="text-gray-500">{tr('latestUpdates')}</p>
            </div>

            <div className="w-full">
                <div className={`p-4 rounded-lg text-center ${STATUS_COLORS[shipment.status]}`}>
                    <p className="font-bold text-lg">{translatedStatus}</p>
                    <p className="text-sm">{tr('lastUpdate')}: {shipment.date}</p>
                </div>
            </div>
        </div>
    );
}


// --- Main Tracking Page Component ---
export default function TrackingPage() {
    const { language, tr } = useLanguage();
    const [trackingNumber, setTrackingNumber] = useState('');
    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTrackShipment = async (e) => {
        e.preventDefault();
        if (!trackingNumber.trim()) {
            setError(tr('pleaseEnterShipmentNumber'));
            return;
        }
        setLoading(true);
        setError('');
        setShipment(null);

        try {
            const q = query(collection(db, "shipments"), where("shipmentId", "==", trackingNumber.trim()));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                setError(tr('shipmentNotFound'));
            } else {
                const shipmentData = querySnapshot.docs[0].data();
                setShipment({
                    ...shipmentData,
                    date: shipmentData.createdAt?.toDate().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')
                });
            }
        } catch (err) {
            console.error(err);
            setError(tr('errorFetchingShipmentData'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* --- Shipment Number Input Form --- */}
            <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">{tr('trackYourShipment')}</h1>
                <p className="text-gray-500 text-center mb-6">{tr('enterShipmentNumberBelow')}</p>
                <form onSubmit={handleTrackShipment} className="flex gap-2">
                    <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder={tr('enterShipmentNumberHere')}
                        className="flex-grow p-3 border rounded-md focus:ring-2 focus:ring-indigo-500"
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
                    >
                        {loading ? tr('searching') : tr('track')}
                    </button>
                </form>
            </div>

            {/* --- Display Results --- */}
            {error && <p className="mt-4 text-red-500">{error}</p>}
            {shipment && <ShipmentDetails shipment={shipment} />}
        </div>
    );
}
