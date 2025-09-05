import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useLanguage } from '../hooks/useLanguage.jsx';

import { ArrowLeftIcon, PlusCircleIcon } from '../components/Icons';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedLoader from '../components/AnimatedLoader';
import { motion } from 'framer-motion';
import { Package, Truck, Route, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    const transferVal = parseFloat(shipment.transferFee) || 0;
    if (transferVal > 0) {
        const currency = shipment.transferFeeCurrency || 'USD';
        totals[currency] = (totals[currency] || 0) + transferVal;
    }
    const totalStrings = Object.entries(totals).map(([currency, amount]) => {
        return `${amount.toLocaleString()} ${currency}`;
    });
    return totalStrings.join(' + ') || '0 USD';
};

export default function ManifestPage() {
  const navigate = useNavigate();
  const { language, tr } = useLanguage();
  const [trips, setTrips] = useState([]);
  const [allShipments, setAllShipments] = useState([]);
  const [selectedShipments, setSelectedShipments] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setIsLoading(true);
    
    // Fetch trips
    const tripsCollection = collection(db, 'trips');
    const tripsUnsubscribe = onSnapshot(tripsCollection, (snapshot) => {
      const tripsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTrips(tripsList);
    });

    // Fetch shipments
    const q = query(collection(db, 'shipments'), orderBy('createdAt', 'desc'));
    const shipmentsUnsubscribe = onSnapshot(q, (snapshot) => {
      const shipmentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllShipments(shipmentsList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching shipments: ", error);
      setIsLoading(false);
    });

    return () => {
      tripsUnsubscribe();
      shipmentsUnsubscribe();
    };
  }, []);

  const handleCheckboxChange = (shipmentId) => {
    setSelectedShipments(prevSelected =>
      prevSelected.includes(shipmentId)
        ? prevSelected.filter(id => id !== shipmentId)
        : [...prevSelected, shipmentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedShipments.length === filteredShipments.length) {
      setSelectedShipments([]);
    } else {
      setSelectedShipments(filteredShipments.map(s => s.id));
    }
  };

  const handleAssignShipments = async () => {
    if (selectedShipments.length === 0) {
        alert(tr('pleaseSelectShipment'));
        return;
    }
    if (!selectedTrip) {
        alert(tr('pleaseChooseTrip'));
        return;
    }

    setIsSubmitting(true);
    
    try {
        const selectedTripData = trips.find(t => t.id === selectedTrip);
        
        // Update trip with new shipment IDs
        const tripRef = doc(db, 'trips', selectedTrip);
        const currentShipmentIds = selectedTripData.shipmentIds || [];
        const newShipmentIds = [...currentShipmentIds, ...selectedShipments];
        
        await updateDoc(tripRef, {
            shipmentIds: newShipmentIds
        });
        
        // Update shipments with trip assignment
        const updatePromises = selectedShipments.map(shipmentId => {
            const shipmentRef = doc(db, 'shipments', shipmentId);
            return updateDoc(shipmentRef, {
                assignedTrip: selectedTrip,
                assignedCar: selectedTripData.vehicleNumber || '',
                status: "قيد النقل"
            });
        });

        await Promise.all(updatePromises);

        alert(`${tr('shipmentsAssignedSuccess')}\n\n${tr('trip')}: ${selectedTripData.tripName || selectedTripData.vehicleNumber}\n${tr('addedShipments')}: ${selectedShipments.length}\n\n${tr('statusUpdatedToInTransit')}`);
        
        setSelectedShipments([]);
        setSelectedTrip('');

    } catch (error) {
        console.error("Error assigning shipments: ", error);
        alert(tr('errorAssigningShipments'));
    }

    setIsSubmitting(false);
  };

  // Filter shipments based on status and search term
  const filteredShipments = allShipments.filter(shipment => {
    // Only show shipments that are not assigned to any trip
    const isUnassigned = !shipment.assignedTrip || shipment.assignedTrip === '';
    
    const matchesSearch = (shipment.shipmentId && shipment.shipmentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (shipment.customerName && shipment.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (shipment.governorate && shipment.governorate.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterStatus === 'all') return isUnassigned && matchesSearch;
    if (filterStatus === 'pending') return isUnassigned && matchesSearch && shipment.status === 'pending';
    if (filterStatus === 'in-transit') return isUnassigned && matchesSearch && shipment.status === 'in-transit';
    if (filterStatus === 'delivered') return isUnassigned && matchesSearch && shipment.status === 'delivered';
    
    return isUnassigned && matchesSearch;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <motion.div 
        className="max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              {/* Logo temporarily hidden
    
            */}
              <h1 className="text-3xl font-bold text-gray-800">{tr('manifestTitle')}</h1>
            </div>
            <div className="flex items-center gap-4">
              <AnimatedButton
                onClick={() => navigate('/create-trip')}
                variant="primary"
                icon={PlusCircleIcon}
              >
                {tr('createNewTrip')}
              </AnimatedButton>
              <a href="/dashboard" className="text-sm text-indigo-600 hover:underline">
                {tr('backToMainDashboard')}
              </a>
            </div>
          </div>
        </motion.div>
        
        <AnimatedCard className="overflow-hidden" delay={0.2}>
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold">
                {tr('selectShipments')} ({selectedShipments.length} {tr('selectedShipments')})
              </h2>
              <div className="flex items-center gap-2">
                <select
                  value={selectedTrip}
                  onChange={(e) => setSelectedTrip(e.target.value)}
                  className="p-2 border rounded-md bg-white w-64"
                >
                  <option value="">{tr('chooseTrip')}</option>
                  {trips.filter(t => t.status !== 'تم التسليم').map(trip => (
                    <option key={trip.id} value={trip.id}>
                      {trip.tripName || trip.vehicleNumber} - {trip.destination || tr('notSpecified')}
                    </option>
                  ))}
                </select>
                <AnimatedButton
                  onClick={handleAssignShipments}
                  disabled={isSubmitting || selectedShipments.length === 0 || !selectedTrip}
                  variant="primary"
                >
                  {isSubmitting ? tr('assigning') : tr('assignShipments')}
                </AnimatedButton>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={tr('searchShipmentsPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="p-2 border rounded-md"
                >
                  <option value="all">{tr('allShipments')}</option>
                  <option value="pending">{tr('pending')}</option>
                  <option value="in-transit">{tr('inTransit')}</option>
                  <option value="delivered">{tr('delivered')}</option>
                </select>
                <AnimatedButton
                  onClick={handleSelectAll}
                  variant="outline"
                  size="sm"
                >
                  {selectedShipments.length === filteredShipments.length ? tr('deselectAll') : tr('selectAll')}
                </AnimatedButton>
              </div>
            </div>

            {isLoading ? (
              <div className="p-20 text-center">
                <AnimatedLoader 
                  type="ring" 
                  size="xl" 
                  color="indigo" 
                  text={tr('loadingData')}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 w-12">{tr('select')}</th>
                      <th className="p-3">{tr('shipmentNumber')}</th>
                      <th className="p-3">{tr('customer')}</th>
                      <th className="p-3">{tr('governorate')}</th>
                      <th className="p-3">{tr('status')}</th>
                      <th className="p-3">{tr('assignedTrip')}</th>
                      <th className="p-3">{tr('collectibleAmount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShipments.map(shipment => (
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
                        <td className="p-3">
                          <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            shipment.status === 'in-transit' ? 'bg-blue-100 text-blue-800' :
                            shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {shipment.status === 'pending' ? tr('pending') :
                             shipment.status === 'in-transit' ? tr('inTransit') :
                             shipment.status === 'delivered' ? tr('delivered') : shipment.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {shipment.assignedTrip ? (
                            <span className="text-green-600 font-medium">
                              {trips.find(t => t.id === shipment.assignedTrip)?.tripName || shipment.assignedTrip}
                            </span>
                          ) : (
                            <span className="text-gray-400">{tr('notAssigned')}</span>
                          )}
                        </td>
                        <td className="p-3 font-semibold">{formatMultiCurrency(shipment)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {!isLoading && filteredShipments.length === 0 && (
              <motion.div 
                className="text-center py-20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">{tr('noUnassignedShipments')}</p>
              </motion.div>
            )}
          </div>
        </AnimatedCard>
      </motion.div>
    </div>
  );
}