import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { motion } from 'framer-motion';
import { User, Percent, MapPin, Package } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export default function DriverSelector({ 
    selectedDriverId, 
    onDriverChange, 
    commissionPercentage, 
    onCommissionChange,
    stationName,
    notes,
    onNotesChange,
    assignedShipments = [],
    onAssignedShipmentsChange
}) {
    const { tr } = useLanguage();
    const [drivers, setDrivers] = useState([]);
    const [shipments, setShipments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const driversCollection = collection(db, 'drivers');
        const shipmentsCollection = collection(db, 'shipments');
        
        const unsubscribeDrivers = onSnapshot(driversCollection, (snapshot) => {
            const driversData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDrivers(driversData.filter(driver => driver.status === 'active'));
        });

        const unsubscribeShipments = onSnapshot(shipmentsCollection, (snapshot) => {
            const shipmentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setShipments(shipmentsData);
            setIsLoading(false);
        });

        return () => {
            unsubscribeDrivers();
            unsubscribeShipments();
        };
    }, []);

    const selectedDriver = drivers.find(driver => driver.id === selectedDriverId);

    return (
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-800">{tr('stationInfo')}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Station Name Field */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                        {tr('stationName')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={stationName || ''}
                            onChange={(e) => onDriverChange({ 
                                ...(selectedDriverId && { driverId: selectedDriverId }),
                                ...(selectedDriver && { driverName: selectedDriver.driverName }),
                                stationName: e.target.value,
                                commissionPercentage: commissionPercentage || 0,
                                notes: notes || '',
                                assignedShipments: assignedShipments || []
                            })}
                            required
                            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                            placeholder={tr('enterStationName')}
                            aria-label={tr('stationName')}
                        />
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500">
                        {tr('stationNameDesc')}
                    </p>
                </div>

                {/* Driver Selection */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                        {tr('selectDriver')} <span className="text-red-500">*</span>
                    </label>
                    {isLoading ? (
                        <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                            {tr('loadingDrivers')}
                        </div>
                    ) : (
                        <select
                            value={selectedDriverId || ''}
                            onChange={(e) => {
                                const driver = drivers.find(d => d.id === e.target.value);
                                onDriverChange({
                                    ...(stationName && { stationName }),
                                    driverId: e.target.value,
                                    driverName: driver ? driver.driverName : '',
                                    ...(commissionPercentage !== undefined && { commissionPercentage }),
                                    ...(notes && { notes }),
                                    ...(assignedShipments && { assignedShipments })
                                });
                            }}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">{tr('selectDriverPlaceholder')}</option>
                            {drivers.map(driver => (
                                <option key={driver.id} value={driver.id}>
                                    {driver.driverName} - {driver.location}
                                </option>
                            ))}
                        </select>
                    )}
                    <p className="text-xs text-gray-500">
                        {tr('selectDriverDesc') || 'اختر المندوب المسؤول عن هذه المحطة'}
                    </p>
                </div>
            </div>

            {/* Commission and Shipments Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Commission Percentage */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                        {tr('percentageRequired')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={commissionPercentage}
                            onChange={(e) => onCommissionChange(parseInt(e.target.value) || 0)}
                            onWheel={(e) => e.target.blur()}
                            required
                            className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="0"
                        />
                        <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{tr('percentageRequiredDesc')}</p>
                </div>

                {/* Responsible Shipments */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                        {tr('responsibleShipments')} <span className="text-red-500">*</span>
                    </label>
                    {isLoading ? (
                        <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                            {tr('loadingShipments')}
                        </div>
                    ) : (
                        <select
                            multiple
                            value={assignedShipments}
                            onChange={(e) => {
                                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                onAssignedShipmentsChange(selectedOptions);
                            }}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
                        >
                            {shipments.map(shipment => (
                                <option key={shipment.id} value={shipment.id}>
                                     {shipment.senderName || shipment.customerName || tr('notSpecified')} - {shipment.destination} - {shipment.shippingFee || 0}$
                                </option>
                            ))}
                        </select>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{tr('responsibleShipmentsDesc')}</p>
                </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                    {tr('notes')} <span className="text-gray-400 text-xs">({tr('optional')})</span>
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    rows="2"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={tr('specialNotes')}
                />
                <p className="text-xs text-gray-500">
                    {tr('notesDesc') || 'أضف أي ملاحظات خاصة حول هذه المحطة'}
                </p>
            </div>

            {selectedDriver && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-800">{tr('selectedDriverInfo')}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">{tr('name')}</span>
                            <span className="font-medium">{selectedDriver.driverName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">{tr('phone')}</span>
                            <span className="font-medium">{selectedDriver.driverPhone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{tr('area')}</span>
                            <span className="font-medium">{selectedDriver.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">{tr('numberOfTrips')}</span>
                            <span className="font-medium">{selectedDriver.totalTrips || 0}</span>
                        </div>
                    </div>
                </motion.div>
            )}

            {assignedShipments.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">{tr('shipmentsResponsibleFor')}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                        {assignedShipments.map(shipmentId => {
                            const shipment = shipments.find(s => s.id === shipmentId);
                            return shipment ? (
                                <div key={shipmentId} className="flex items-center gap-2">
                                    <span className="text-gray-600">•</span>
                                    <span className="font-medium">{shipment.senderName || shipment.customerName || tr('notSpecified')}</span>
                                    <span className="text-gray-500">→</span>
                                    <span className="font-medium">{shipment.destination}</span>
                                    <span className="text-gray-500">-</span>
                                    <span className="font-medium text-green-600">{shipment.shippingFee || 0}$</span>
                                </div>
                            ) : null;
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
