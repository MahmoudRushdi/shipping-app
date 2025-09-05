import { useState, useEffect } from 'react';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { ArrowLeftIcon, PlusCircleIcon } from '../components/Icons';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedLoader from '../components/AnimatedLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Truck, Edit, Trash2, Route, Package, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TripsManagementPage() {
    const navigate = useNavigate();
    const { language, tr } = useLanguage();
    const [trips, setTrips] = useState([]);
    const [shipments, setShipments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Advanced Filters
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        status: '',
        vehicle: '',
        destination: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [vehicles, setVehicles] = useState([]);

    useEffect(() => {
        setIsLoading(true);
        
        // Fetch trips ordered by creation date (newest first)
        const tripsCollection = collection(db, 'trips');
        const tripsQuery = query(tripsCollection, orderBy('createdAt', 'desc'));
        const tripsUnsubscribe = onSnapshot(tripsQuery, (snapshot) => {
            const tripsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date()
            }));
            setTrips(tripsData);
        });

        // Fetch shipments
        const shipmentsCollection = collection(db, 'shipments');
        const shipmentsUnsubscribe = onSnapshot(shipmentsCollection, (snapshot) => {
            const shipmentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setShipments(shipmentsData);
            setIsLoading(false);
        });

        return () => {
            tripsUnsubscribe();
            shipmentsUnsubscribe();
        };
    }, []);

    // Fetch vehicles for filter
    useEffect(() => {
        const vehiclesCollection = collection(db, 'vehicles');
        const unsubscribe = onSnapshot(vehiclesCollection, (snapshot) => {
            const vehiclesData = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            setVehicles(vehiclesData);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (tripId) => {
        if (window.confirm(`${tr('confirmDeleteTrip')}\n\n${tr('noteShipmentsReturned')}`)) {
            try {
                console.log('Deleting trip:', tripId);
                
                // Find the trip to get its shipment IDs
                const tripToDelete = trips.find(trip => trip.id === tripId);
                console.log('Trip to delete:', tripToDelete);
                
                if (tripToDelete && tripToDelete.shipmentIds && tripToDelete.shipmentIds.length > 0) {
                    console.log(`Updating ${tripToDelete.shipmentIds.length} shipments...`);
                    
                    // Update all shipments associated with this trip
                    const updatePromises = tripToDelete.shipmentIds.map(shipmentId => {
                        console.log('Updating shipment:', shipmentId);
                        const shipmentRef = doc(db, 'shipments', shipmentId);
                        return updateDoc(shipmentRef, {
                            assignedTrip: null,
                            assignedCar: null,
                            status: 'معلق',
                            updatedAt: new Date()
                        });
                    });
                    
                    // Wait for all shipment updates to complete
                    await Promise.all(updatePromises);
                    console.log('All shipments updated successfully');
                } else {
                    console.log('No shipments associated with this trip');
                }
                
                // Delete the trip
                await deleteDoc(doc(db, 'trips', tripId));
                console.log('Trip deleted successfully');
                
                const shipmentCount = tripToDelete?.shipmentIds?.length || 0;
                if (shipmentCount > 0) {
                    alert(`${tr('tripDeletedSuccess')}\n\n${tr('shipmentsReturnedToPending')} ${shipmentCount} ${tr('shipmentsToPending')}\n\n${tr('checkShipmentsPage')}`);
                } else {
                    alert(tr('tripDeletedSuccess'));
                }
                
                // Optional: Redirect to shipments page to verify the changes
                setTimeout(() => {
                    if (window.confirm(tr('goToShipmentsPage'))) {
                        navigate('/shipments');
                    }
                }, 1000);
            } catch (error) {
                console.error('Error deleting trip:', error);
                alert(`${tr('errorDeletingTrip')} ${error.message}`);
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'planned': return 'bg-blue-100 text-blue-800';
            case 'in-progress': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'قيد الانتظار': return 'bg-yellow-100 text-yellow-800';
            case 'قيد النقل': return 'bg-blue-100 text-blue-800';
            case 'تم التسليم': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'planned': return tr('planned');
            case 'in-progress': return tr('inProgress');
            case 'completed': return tr('completed');
            case 'cancelled': return tr('cancelled');
            case 'قيد الانتظار': return tr('waiting');
            case 'قيد النقل': return tr('inTransit');
            case 'تم التسليم': return tr('delivered');
            default: return tr('notSpecified');
        }
    };

    // Get trip display name
    const getTripDisplayName = (trip) => {
        // Use the trip name as entered by the employee, or fallback to vehicle number
        if (trip.tripName) {
            return trip.tripName;
        }
        
        const vehicleNumber = trip.vehicleNumber || '';
        const destination = trip.destination || '';
        
        if (vehicleNumber && destination) {
            return `${vehicleNumber} → ${destination}`;
        } else if (vehicleNumber) {
            return vehicleNumber;
        } else if (destination) {
            return destination;
        }
        
        return `${tr('trip')} ${trip.id.slice(-6)}`;
    };

    // Get shipments for a specific trip
    const getTripShipments = (trip) => {
        if (trip.shipmentIds) {
            return shipments.filter(shipment => trip.shipmentIds.includes(shipment.id));
        }
        return [];
    };

    // Calculate total collections for a trip
    const calculateTripCollections = (trip) => {
        const tripShipments = getTripShipments(trip);
        const totals = {};
        
        tripShipments.forEach(shipment => {
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
            
            if (shipment.transferFeePaymentMethod === 'collect') {
                const transferVal = parseFloat(shipment.transferFee) || 0;
                if (transferVal > 0) {
                    const currency = shipment.transferFeeCurrency || 'USD';
                    totals[currency] = (totals[currency] || 0) + transferVal;
                }
            }
        });
        
        return Object.entries(totals).map(([currency, amount]) => 
            `${amount.toLocaleString()} ${currency}`
        ).join(' + ') || '0 USD';
    };

    // Filter handling functions
    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            dateFrom: '',
            dateTo: '',
            status: '',
            vehicle: '',
            destination: ''
        });
    };

    const getUniqueDestinations = () => {
        const destinations = trips.map(t => t.destination).filter(Boolean);
        return [...new Set(destinations)].sort();
    };

    // Filter trips based on applied filters
    const filteredTrips = trips.filter(trip => {
        const tripDate = trip.createdAt?.toLocaleDateString('en-CA') || '';
        
        const matchesDateFrom = !filters.dateFrom || (tripDate >= filters.dateFrom);
        const matchesDateTo = !filters.dateTo || (tripDate <= filters.dateTo);
        const matchesStatus = !filters.status || trip.status === filters.status;
        const matchesVehicle = !filters.vehicle || trip.vehicleNumber === filters.vehicle;
        const matchesDestination = !filters.destination || trip.destination === filters.destination;
        
        return matchesDateFrom && matchesDateTo && matchesStatus && matchesVehicle && matchesDestination;
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
                className="max-w-full mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div className="mb-8" variants={itemVariants}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <AnimatedButton
                                onClick={() => navigate('/dashboard')}
                                variant="outline"
                                icon={ArrowLeftIcon}
                                size="sm"
                            >
                                {tr('backToDashboard')}
                            </AnimatedButton>
                            <h1 className="text-3xl font-bold gradient-text">{tr('tripsManagement')}</h1>
                        </div>
                        <AnimatedButton
                            onClick={() => navigate('/create-trip')}
                            variant="primary"
                            icon={PlusCircleIcon}
                        >
                            {tr('Create New Trip')}
                        </AnimatedButton>
                    </div>
                </motion.div>

                {/* Statistics */}
                <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" variants={itemVariants}>
                    <AnimatedCard className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{tr('totalTrips')}</p>
                                <p className="text-2xl font-bold text-gray-900">{filteredTrips.length}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Route className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </AnimatedCard>
                    
                    <AnimatedCard className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{tr('tripsWithShipments')}</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {filteredTrips.filter(t => t.shipmentIds && t.shipmentIds.length > 0).length}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Package className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </AnimatedCard>
                    
                    <AnimatedCard className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{tr('pending')}</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {filteredTrips.filter(t => t.status === 'قيد الانتظار' || t.status === 'planned').length}
                                </p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Calendar className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </AnimatedCard>
                    
                    <AnimatedCard className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{tr('inTransit')}</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {filteredTrips.filter(t => t.status === 'قيد النقل' || t.status === 'in-progress').length}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Truck className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </AnimatedCard>
                </motion.div>

                {/* Advanced Filters */}
                <motion.div className="mb-6" variants={itemVariants}>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4">
                                <AnimatedButton
                                    onClick={() => setShowFilters(!showFilters)}
                                    variant="outline"
                                    size="sm"
                                >
                                    {showFilters ? tr('hideFilters') : tr('advancedFilters')}
                                </AnimatedButton>
                                
                                <span className="text-sm text-gray-600">
                                    {tr('showingTrips')} {filteredTrips.length} {tr('of')} {trips.length} {tr('trip')}
                                </span>
                            </div>
                        </div>
                        
                        {/* Advanced Filters Panel */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 pt-4 border-t border-gray-200"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* Date Range Filters */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('fromDate')}</label>
                                            <input
                                                type="date"
                                                value={filters.dateFrom}
                                                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('toDate')}</label>
                                            <input
                                                type="date"
                                                value={filters.dateTo}
                                                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                        
                                        {/* Status Filter */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('status')}</label>
                                            <select
                                                value={filters.status}
                                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="">{tr('allStatuses')}</option>
                                                <option value="قيد الانتظار">{tr('waiting')}</option>
                                                <option value="قيد النقل">{tr('inTransit')}</option>
                                                <option value="تم التسليم">{tr('delivered')}</option>
                                                <option value="planned">{tr('planned')}</option>
                                                <option value="in-progress">{tr('inProgress')}</option>
                                                <option value="completed">{tr('completed')}</option>
                                                <option value="cancelled">{tr('cancelled')}</option>
                                            </select>
                                        </div>
                                        
                                        {/* Vehicle Filter */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('vehicle')}</label>
                                            <select
                                                value={filters.vehicle}
                                                onChange={(e) => handleFilterChange('vehicle', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="">{tr('allVehicles')}</option>
                                                {vehicles.map(vehicle => (
                                                    <option key={vehicle.id} value={vehicle.vehicleNumber}>
                                                        {vehicle.vehicleNumber} - {vehicle.vehicleType || tr('notSpecified')}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        {/* Destination Filter */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('destination')}</label>
                                            <select
                                                value={filters.destination}
                                                onChange={(e) => handleFilterChange('destination', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="">{tr('allDestinations')}</option>
                                                {getUniqueDestinations().map(dest => (
                                                    <option key={dest} value={dest}>{dest}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 flex justify-end">
                                        <AnimatedButton
                                            onClick={clearFilters}
                                            variant="outline"
                                            size="sm"
                                        >
                                            {tr('clearAllFilters')}
                                        </AnimatedButton>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Trips List */}
                <AnimatedCard className="overflow-hidden" delay={1}>
                    {isLoading ? (
                        <div className="p-20 text-center">
                            <AnimatedLoader 
                                type="ring" 
                                size="xl" 
                                color="indigo" 
                                text={tr('Loading trips...')}
                            />
                        </div>
                    ) : (
                        <>
                            {/* Mobile View */}
                            <div className="md:hidden">
                                <div className="p-4 space-y-4">
                                    <AnimatePresence>
                                        {filteredTrips.map((trip, index) => {
                                            const tripShipments = getTripShipments(trip);
                                            const totalCollections = calculateTripCollections(trip);
                                            const tripDisplayName = getTripDisplayName(trip);
                                            
                                            return (
                                                <motion.div
                                                    key={trip.id}
                                                    variants={itemVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="hidden"
                                                    transition={{ delay: index * 0.1 }}
                                                    className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-200"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex-1">
                                                            <h3 className="font-bold text-lg text-gray-900 mb-1">
                                                                {tripDisplayName}
                                                            </h3>
                                                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                                                <MapPin className="w-4 h-4" />
                                                                {trip.destination || tr('notSpecified')}
                                                            </p>
                                                        </div>
                                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusColor(trip.status)}`}>
                                                            {getStatusText(trip.status)}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="space-y-2 mb-4">
                                                        {trip.ownerName && (
                                                            <p className="text-sm"><strong>{tr('vehicleOwner')}:</strong> {trip.ownerName}</p>
                                                        )}
                                                        {trip.departureDate && (
                                                            <p className="text-sm"><strong>{tr('departureDate')}:</strong> {trip.departureDate}</p>
                                                        )}
                                                        {trip.createdAt && (
                                                            <p className="text-sm"><strong>{tr('creationDate')}:</strong> {trip.createdAt.toLocaleDateString('ar-EG')}</p>
                                                        )}
                                                        <p className="text-sm"><strong>{tr('numberOfShipments')}:</strong> {tripShipments.length}</p>
                                                        <p className="text-sm"><strong>{tr('totalCollections')}:</strong> {totalCollections}</p>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-end gap-2 border-t pt-3">
                                                        <AnimatedButton
                                                            onClick={() => navigate(`/trip/${trip.id}`)}
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            {tr('View Details')}
                                                        </AnimatedButton>
                                                        <AnimatedButton
                                                            onClick={() => handleDelete(trip.id)}
                                                            variant="outline"
                                                            size="sm"
                                                            icon={Trash2}
                                                            className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                                                        />
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Desktop View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                        <tr>
                                            <th className="p-4 font-semibold">{tr('Trip Name')}</th>
                                            <th className="p-4 font-semibold">{tr('Destination')}</th>
                                            <th className="p-4 font-semibold">{tr('Driver')}</th>
                                            <th className="p-4 font-semibold">{tr('Creation Date')}</th>
                                            <th className="p-4 font-semibold">{tr('Number of Shipments')}</th>
                                            <th className="p-4 font-semibold">{tr('Total Collections')}</th>
                                            <th className="p-4 font-semibold">{tr('Status')}</th>
                                            <th className="p-4 font-semibold">{tr('Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        <AnimatePresence>
                                            {filteredTrips.map((trip, index) => {
                                                const tripShipments = getTripShipments(trip);
                                                const totalCollections = calculateTripCollections(trip);
                                                const tripDisplayName = getTripDisplayName(trip);
                                                
                                                return (
                                                    <motion.tr
                                                        key={trip.id}
                                                        variants={itemVariants}
                                                        initial="hidden"
                                                        animate="visible"
                                                        exit="hidden"
                                                        transition={{ delay: index * 0.05 }}
                                                        className="hover:bg-gray-50/80 backdrop-blur-sm transition-colors duration-200"
                                                    >
                                                        <td className="p-4">
                                                            <div className="font-bold text-gray-900 text-base">
                                                                {tripDisplayName}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">{trip.destination || tr('notSpecified')}</td>
                                                        <td className="p-4">{trip.ownerName || '-'}</td>
                                                        <td className="p-4">
                                                            {trip.createdAt ? trip.createdAt.toLocaleDateString('ar-EG') : '-'}
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="flex items-center gap-1">
                                                                <Package className="w-4 h-4" />
                                                                {tripShipments.length}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 font-semibold text-green-600">
                                                            {totalCollections}
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusColor(trip.status)}`}>
                                                                {getStatusText(trip.status)}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                 <AnimatedButton
                                                                     onClick={() => navigate(`/trip/${trip.id}`)}
                                                                     variant="outline"
                                                                     size="sm"
                                                                 >
                                                                     {tr('View Details')}
                                                                 </AnimatedButton>
                                                                <AnimatedButton
                                                                    onClick={() => handleDelete(trip.id)}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    icon={Trash2}
                                                                    className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                                                                />
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                    
                    {filteredTrips.length === 0 && !isLoading && (
                        <motion.div 
                            className="text-center py-20"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Route className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">{tr('noTrips')}</p>
                        </motion.div>
                    )}
                </AnimatedCard>
            </motion.div>
        </div>
    );
} 