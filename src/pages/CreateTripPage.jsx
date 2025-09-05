import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { ArrowLeftIcon, PlusCircleIcon } from '../components/Icons';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedLoader from '../components/AnimatedLoader';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Truck, Route, User, Car, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DriverSelector from '../components/DriverSelector';

export default function CreateTripPage() {
    const navigate = useNavigate();
    const { language, tr } = useLanguage();
    const [vehicles, setVehicles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form data
    const [formData, setFormData] = useState({
        tripName: '',
        selectedVehicle: '',
        destination: '',
        ownerName: '', // صاحب السيارة
        departureDate: '',
        departureTime: '',
        notes: '',
        status: 'قيد الانتظار'
        // تم إزالة: totalShippingAmount و totalShippingCurrency
        // سيتم حسابها تلقائياً من الشحنات المعينة للرحلة
    });

    // Stations data
    const [stations, setStations] = useState([]);

    useEffect(() => {
        setIsLoading(true);
        const vehiclesCollection = collection(db, 'vehicles');
        const unsubscribe = onSnapshot(vehiclesCollection, (snapshot) => {
            const vehiclesList = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            setVehicles(vehiclesList);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleVehicleChange = (e) => {
        const vehicleId = e.target.value;
        setFormData(prev => ({
            ...prev,
            selectedVehicle: vehicleId
        }));

        if (vehicleId) {
            const selectedVehicle = vehicles.find(v => v.id === vehicleId);
            if (selectedVehicle) {
                setFormData(prev => ({
                    ...prev,
                    ownerName: selectedVehicle.ownerName || selectedVehicle.driverName || ''
                }));
            }
        }
    };

    // Station management functions
    const addStation = () => {
        const newStation = {
            id: Date.now(),
            stationName: '',
            driverId: '',
            driverName: '',
            commissionPercentage: 0,
            assignedShipments: [],
            notes: ''
        };
        setStations([...stations, newStation]);
    };

    const removeStation = (stationId) => {
        setStations(stations.filter(station => station.id !== stationId));
    };

    const updateStation = (stationId, updatedData) => {
        setStations(stations.map(station => 
            station.id === stationId ? { ...station, ...updatedData } : station
        ));
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.tripName) {
            alert(tr('pleaseEnterTripName'));
            return;
        }

        if (!formData.selectedVehicle) {
            alert(tr('pleaseSelectVehicle'));
            return;
        }

        if (!formData.destination) {
            alert(tr('pleaseEnterDestination'));
            return;
        }

        if (!formData.ownerName) {
            alert(tr('pleaseEnterOwnerName'));
            return;
        }

        if (stations.length === 0) {
            alert(tr('pleaseAddStation'));
            return;
        }

        // Validate stations
        for (let i = 0; i < stations.length; i++) {
            const station = stations[i];
            if (!station.stationName || !station.driverId || station.commissionPercentage <= 0) {
                alert(`${tr('pleaseCompleteStationData')} ${i + 1}.`);
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const selectedVehicle = vehicles.find(v => v.id === formData.selectedVehicle);
            
            await addDoc(collection(db, 'trips'), {
                tripName: formData.tripName || `${tr('trip')} ${selectedVehicle?.vehicleNumber || tr('new')}`,
                vehicleId: formData.selectedVehicle,
                vehicleNumber: selectedVehicle?.vehicleNumber || '',
                destination: formData.destination,
                ownerName: formData.ownerName,
                departureDate: formData.departureDate,
                departureTime: formData.departureTime,
                notes: formData.notes,
                status: formData.status,
                stations: stations,
                shipmentIds: [],
                createdAt: serverTimestamp(),
                expenses: {
                    vehicleRental: 0,
                    driverCommission: 0,
                    other: 0,
                }
            });

            alert(tr('tripCreatedSuccess'));
            navigate('/trips');

        } catch (error) {
            console.error('Error creating trip:', error);
            alert(tr('errorCreatingTrip'));
        }

        setIsSubmitting(false);
    };

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
                className="max-w-4xl mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div className="mb-8" variants={itemVariants}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <AnimatedButton
                                onClick={() => navigate('/trips')}
                                variant="outline"
                                icon={ArrowLeftIcon}
                                size="sm"
                            >
                                {tr('backToTripsManagement')}
                            </AnimatedButton>
                            <h1 className="text-3xl font-bold gradient-text">{tr('Create New Trip')}</h1>
                        </div>
                    </div>
                </motion.div>

                <AnimatedCard className="p-6" delay={0.2}>
                    {isLoading ? (
                        <div className="p-20 text-center">
                            <AnimatedLoader 
                                type="ring" 
                                size="xl" 
                                color="indigo" 
                                text={tr('Loading vehicles...')}
                            />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                                                         {/* معلومات مهمة */}
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h4 className="font-medium text-green-800 mb-2">✅ {tr('importantInformation')}</h4>
                                <ul className="text-sm text-green-700 space-y-1">
                                    <li>• <strong>{tr('totalShippingAmount')}</strong> {tr('willBeCalculatedAutomatically')}</li>
                                    <li>• <strong>{tr('commission')}</strong> {tr('willBeCalculatedBasedOnActual')}</li>
                                    <li>• <strong>{tr('commissionRates')}</strong> {tr('canBeAdjustedLater')}</li>
                                </ul>
                            </div>
                            
                            {/* Trip Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {tr('Trip Name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="tripName"
                                    value={formData.tripName}
                                    onChange={handleInputChange}
                                    placeholder={tr('tripNamePlaceholder')}
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            {/* Vehicle Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {tr('Select Vehicle')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="selectedVehicle"
                                    value={formData.selectedVehicle}
                                    onChange={handleVehicleChange}
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">{tr('Choose a vehicle...')}</option>
                                    {vehicles.filter(v => v.status === 'active').map(vehicle => (
                                        <option key={vehicle.id} value={vehicle.id}>
                                            {vehicle.vehicleNumber} - {vehicle.vehicleType || tr('Not specified')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Destination */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {tr('Trip Destination')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="destination"
                                    value={formData.destination}
                                    onChange={handleInputChange}
                                    placeholder={tr('destinationPlaceholder')}
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            {/* Owner Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {tr('Owner Name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="ownerName"
                                    value={formData.ownerName}
                                    onChange={handleInputChange}
                                    placeholder={tr('Owner Name')}
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            {/* Departure Date and Time */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {tr('Departure Date')}
                                    </label>
                                    <input
                                        type="date"
                                        name="departureDate"
                                        value={formData.departureDate}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {tr('Departure Time')}
                                    </label>
                                    <input
                                        type="time"
                                        name="departureTime"
                                        value={formData.departureTime}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                                                         {/* تم إزالة قسم مبلغ النقل الإجمالي */}
                             {/* سيتم حساب المبلغ تلقائياً من الشحنات المعينة للرحلة */}
                             <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                 <h4 className="font-medium text-blue-800 mb-2">💡 {tr('importantNote')}</h4>
                                 <p className="text-sm text-blue-700">
                                     <strong>{tr('totalShippingAmount')}</strong> {tr('totalAmountNote')}
                                 </p>
                             </div>

                            {/* Stations Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">{tr('Stations and Drivers')}</h3>
                                    <AnimatedButton
                                        type="button"
                                        onClick={addStation}
                                        variant="outline"
                                        icon={Plus}
                                        size="sm"
                                    >
                                        {tr('Add Station')}
                                    </AnimatedButton>
                                </div>
                                
                                {/* Helpful explanation */}
                                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h4 className="font-medium text-blue-800 mb-2">💡 {tr('howStationsWork')}</h4>
                                    <ul className="text-sm text-blue-700 space-y-1">
                                        <li>• <strong>{tr('stationName')}:</strong> {tr('theCityWhereShipments')}</li>
                                        <li>• <strong>{tr('stationOrder')}:</strong> {tr('writeStationsInOrder')}</li>
                                        <li>• <strong>{tr('example')}:</strong> {tr('aleppoHomsLattakiaDamascus')}</li>
                                        <li>• {tr('youMustEnterDriver')}</li>
                                    </ul>
                                </div>
                                
                                {stations.length === 0 && (
                                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                        <Route className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>{tr('noStationsAdded')}</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {stations.map((station, index) => (
                                        <div key={station.id} className="relative">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium text-gray-700">{tr('Station')} {index + 1}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => removeStation(station.id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title={tr('Delete Station')}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            
                                            <DriverSelector
                                                selectedDriverId={station.driverId}
                                                onDriverChange={(updatedData) => updateStation(station.id, updatedData)}
                                                commissionPercentage={station.commissionPercentage}
                                                onCommissionChange={(value) => updateStation(station.id, { commissionPercentage: value })}
                                                stationName={station.stationName}
                                                notes={station.notes}
                                                onNotesChange={(value) => updateStation(station.id, { notes: value })}
                                                assignedShipments={station.assignedShipments}
                                                onAssignedShipmentsChange={(value) => updateStation(station.id, { assignedShipments: value })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {tr('Additional Notes')}
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows="3"
                                    placeholder={tr('Any additional notes about the trip...')}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {tr('Trip Status')}
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="قيد الانتظار">{tr('waiting')}</option>
                                    <option value="قيد النقل">{tr('inTransit')}</option>
                                    <option value="تم التسليم">{tr('delivered')}</option>
                                </select>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-4 pt-6 border-t">
                                <AnimatedButton
                                    type="button"
                                    onClick={() => navigate('/trips')}
                                    variant="outline"
                                >
                                    {tr('Cancel')}
                                </AnimatedButton>
                                <AnimatedButton
                                    type="submit"
                                    variant="primary"
                                    disabled={isSubmitting}
                                    icon={PlusCircleIcon}
                                >
                                    {isSubmitting ? tr('Creating...') : tr('Create Trip')}
                                </AnimatedButton>
                            </div>
                        </form>
                    )}
                </AnimatedCard>
            </motion.div>
        </div>
    );
} 