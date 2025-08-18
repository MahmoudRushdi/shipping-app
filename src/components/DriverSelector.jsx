import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { motion } from 'framer-motion';
import { User, Percent, MapPin, Package } from 'lucide-react';

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
                <h3 className="font-semibold text-gray-800">معلومات المحطة</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        اسم المحطة <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={stationName || ''}
                        onChange={(e) => onDriverChange({ stationName: e.target.value })}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="مثال: دمشق، حلب، حماة"
                    />
                    <p className="text-xs text-gray-500 mt-1">اسم المدينة أو المحطة التي سيتم تسليم الشحنات فيها</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        اختيار المندوب <span className="text-red-500">*</span>
                    </label>
                    {isLoading ? (
                        <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                            جاري تحميل المناديب...
                        </div>
                    ) : (
                        <select
                            value={selectedDriverId || ''}
                            onChange={(e) => {
                                const driver = drivers.find(d => d.id === e.target.value);
                                onDriverChange({
                                    driverId: e.target.value,
                                    driverName: driver ? driver.driverName : ''
                                });
                            }}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">اختر المندوب...</option>
                            {drivers.map(driver => (
                                <option key={driver.id} value={driver.id}>
                                    {driver.driverName} - {driver.location}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        النسبة المئوية <span className="text-red-500">*</span>
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
                            placeholder="النسبة المئوية"
                        />
                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">نسبة العمولة من أجور الشحن</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        الشحنات المسؤول عنها <span className="text-red-500">*</span>
                    </label>
                    {isLoading ? (
                        <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                            جاري تحميل الشحنات...
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
                                    {shipment.senderName || shipment.customerName || 'غير محدد'} - {shipment.destination} - {shipment.shippingFee || 0}$
                                </option>
                            ))}
                        </select>
                    )}
                    <p className="text-xs text-gray-500 mt-1">اختر الشحنات التي سيكون المندوب مسؤول عنها</p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    ملاحظات
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    rows="2"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="ملاحظات خاصة..."
                />
            </div>

            {selectedDriver && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-800">معلومات المندوب المختار:</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">الاسم:</span>
                            <span className="font-medium">{selectedDriver.driverName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">الهاتف:</span>
                            <span className="font-medium">{selectedDriver.driverPhone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">المنطقة:</span>
                            <span className="font-medium">{selectedDriver.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">عدد الرحلات:</span>
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
                        <span className="font-medium text-green-800">الشحنات المسؤول عنها:</span>
                    </div>
                    <div className="space-y-1 text-sm">
                        {assignedShipments.map(shipmentId => {
                            const shipment = shipments.find(s => s.id === shipmentId);
                            return shipment ? (
                                <div key={shipmentId} className="flex items-center gap-2">
                                    <span className="text-gray-600">•</span>
                                    <span className="font-medium">{shipment.senderName || shipment.customerName || 'غير محدد'}</span>
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
