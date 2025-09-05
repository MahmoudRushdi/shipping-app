import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, updateDoc, doc, deleteDoc, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { SearchIcon, DownloadIcon, PlusCircleIcon, ArrowLeftIcon } from '../components/Icons';
import StatusSelector from '../components/StatusSelector';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedLoader from '../components/AnimatedLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, MapPin, TrashIcon, PrinterIcon, LinkIcon } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Link, useNavigate } from 'react-router-dom';

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
    if (shipment.transferFeePaymentMethod === 'collect') {
        const transferVal = parseFloat(shipment.transferFee) || 0;
        if (transferVal > 0) {
            const currency = shipment.transferFeeCurrency || 'USD';
            totals[currency] = (totals[currency] || 0) + transferVal;
        }
    }
    const totalStrings = Object.entries(totals).map(([currency, amount]) => {
        if (currency === 'undefined') return null;
        return `${amount.toLocaleString()} ${currency}`;
    });
    return totalStrings.filter(Boolean).join(' + ') || '0 USD';
};

export default function ShipmentsManagementPage() {
    const { language, tr } = useLanguage();
    const [shipments, setShipments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedView, setSelectedView] = useState('all');
    const [copySuccess, setCopySuccess] = useState('');
    
    // Advanced Filters
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        status: '',
        governorate: '',
        paymentMethod: '',
        assignedVehicle: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [vehicles, setVehicles] = useState([]);
    
    const navigate = useNavigate();

    useEffect(() => {
        setIsLoading(true);
        const shipmentsCollection = collection(db, 'shipments');
        const q = query(shipmentsCollection, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const shipmentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().createdAt?.toDate().toLocaleDateString('en-CA') || 'Not Specified'
            }));
            setShipments(shipmentsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
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

    // Update old Arabic statuses to new English keys
    const updateOldStatuses = async () => {
        const statusMapping = {
            'تم الاستلام من المرسل': 'received',
            'قيد النقل': 'in-transit',
            'وصلت الوجهة': 'arrived',
            'تم التسليم': 'delivered',
            'مرتجع': 'returned'
        };

        const batch = writeBatch(db);
        let hasUpdates = false;

        shipments.forEach(shipment => {
            if (statusMapping[shipment.status]) {
                const shipmentRef = doc(db, 'shipments', shipment.id);
                batch.update(shipmentRef, { status: statusMapping[shipment.status] });
                hasUpdates = true;
            }
        });

        if (hasUpdates) {
            try {
                await batch.commit();
                console.log('Updated old statuses to new format');
            } catch (error) {
                console.error('Error updating statuses:', error);
            }
        }
    };

    // Call update function when shipments load
    useEffect(() => {
        if (shipments.length > 0) {
            updateOldStatuses();
        }
    }, [shipments]);

    const handleStatusChange = async (shipmentId, newStatus) => {
        const shipmentRef = doc(db, 'shipments', shipmentId);
        try {
            await updateDoc(shipmentRef, { status: newStatus });
        } catch (error) {
            console.error("Error updating status: ", error);
            alert(tr('errorUpdatingStatus'));
        }
    };

    const handleDeleteShipment = async (shipmentId) => {
        if (window.confirm(tr('confirmDeleteShipment'))) {
            try {
                await deleteDoc(doc(db, 'shipments', shipmentId));
            } catch (error) {
                console.error("Error deleting shipment: ", error);
                alert(tr('errorDeletingShipment'));
            }
        }
    };

    const handleCopyLink = (shipmentId) => {
        const link = `${window.location.origin}/track/${shipmentId}`;
        navigator.clipboard.writeText(link);
        setCopySuccess(shipmentId);
        setTimeout(() => setCopySuccess(''), 2000);
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
            governorate: '',
            paymentMethod: '',
            assignedVehicle: ''
        });
    };

    const getUniqueGovernorates = () => {
        const governorates = shipments.map(s => s.governorate).filter(Boolean);
        return [...new Set(governorates)].sort();
    };

    const getUniquePaymentMethods = () => {
        const methods = [];
        shipments.forEach(s => {
            if (s.shippingFeePaymentMethod) methods.push(s.shippingFeePaymentMethod);
            if (s.transferFeePaymentMethod) methods.push(s.transferFeePaymentMethod);
        });
        return [...new Set(methods)].sort();
    };

    const filteredShipments = shipments.filter(shipment => {
        // Basic search filter
        const matchesSearch = (shipment.shipmentId && shipment.shipmentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                             (shipment.customerName && shipment.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                             (shipment.courierName && shipment.courierName.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // View filter
        let matchesView = true;
        if (selectedView === 'received') matchesView = shipment.status === 'received' || shipment.status === 'تم الاستلام من المرسل';
        else if (selectedView === 'in-transit') matchesView = shipment.status === 'in-transit' || shipment.status === 'قيد النقل';
        else if (selectedView === 'delivered') matchesView = shipment.status === 'delivered' || shipment.status === 'تم التسليم';
        
        // Advanced filters
        const matchesDateFrom = !filters.dateFrom || (shipment.date >= filters.dateFrom);
        const matchesDateTo = !filters.dateTo || (shipment.date <= filters.dateTo);
        const matchesStatus = !filters.status || 
            shipment.status === filters.status || 
            (filters.status === 'in-transit' && shipment.status === 'قيد النقل') ||
            (filters.status === 'delivered' && shipment.status === 'تم التسليم') ||
            (filters.status === 'received' && shipment.status === 'تم الاستلام من المرسل') ||
            (filters.status === 'arrived' && shipment.status === 'وصلت الوجهة') ||
            (filters.status === 'returned' && shipment.status === 'مرتجع');
        const matchesGovernorate = !filters.governorate || shipment.governorate === filters.governorate;
        const matchesPaymentMethod = !filters.paymentMethod || 
            shipment.shippingFeePaymentMethod === filters.paymentMethod || 
            shipment.transferFeePaymentMethod === filters.paymentMethod;
        const matchesVehicle = !filters.assignedVehicle || shipment.assignedCar === filters.assignedVehicle;
        
        return matchesSearch && matchesView && matchesDateFrom && matchesDateTo && 
               matchesStatus && matchesGovernorate && matchesPaymentMethod && matchesVehicle;
    });

    const handleExport = async () => {
        const workbook = new ExcelJS.Workbook();
        const moneyFormat = '#,##0.00';
        const headerStyle = { 
            font: { bold: true, color: { argb: 'FFFFFFFF' } }, 
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } }, 
            alignment: { horizontal: 'center', vertical: 'middle' }, 
            border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } 
        };

        const sheet = workbook.addWorksheet('تقرير الشحنات المفصل');
        sheet.columns = [
            { header: 'رقم الشحنة', key: 'shipmentId', width: 20 }, 
            { header: 'الحالة', key: 'status', width: 25 }, 
            { header: 'التاريخ', key: 'date', width: 15 }, 
            { header: 'اسم المستلم', key: 'customerName', width: 25 }, 
            { header: 'هاتف المستلم', key: 'recipientPhone', width: 20 }, 
            { header: 'اسم المرسل', key: 'senderName', width: 25 }, 
            { header: 'هاتف المرسل', key: 'senderPhone', width: 20 }, 
            { header: 'المحافظة', key: 'governorate', width: 15 }, 
            { header: 'السيارة', key: 'assignedCar', width: 15 }, 
            { header: 'قيمة البضاعة', key: 'goodsValue', width: 15, style: { numFmt: moneyFormat } }, 
            { header: 'عملة البضاعة', key: 'goodsCurrency', width: 12 }, 
            { header: 'أجور الشحن', key: 'shippingFee', width: 15, style: { numFmt: moneyFormat } }, 
            { header: 'عملة الشحن', key: 'shippingFeeCurrency', width: 12 }, 
            { header: 'دفع الشحن', key: 'shippingFeePaymentMethod', width: 15 }, 
            { header: 'أجور التحويل', key: 'transferFee', width: 15, style: { numFmt: moneyFormat } }, 
            { header: 'عملة التحويل', key: 'transferFeeCurrency', width: 12 }, 
            { header: 'دفع التحويل', key: 'transferFeePaymentMethod', width: 15 }, 
            { header: 'أجور المحول', key: 'internalTransferFee', width: 15, style: { numFmt: moneyFormat } }, 
            { header: 'عملة المحول', key: 'internalTransferFeeCurrency', width: 12 }, 
            { header: 'المبلغ الإجمالي المحصل', key: 'collectibleAmount', width: 25 }, 
            { header: 'ملاحظات', key: 'notes', width: 30 },
        ];
        
        // Add column headers
        const headers = [
            'رقم الشحنة', 'الحالة', 'التاريخ', 'اسم المستلم', 'هاتف المستلم', 'اسم المرسل', 'هاتف المرسل', 
            'المحافظة', 'السيارة', 'قيمة البضاعة', 'عملة البضاعة', 'أجور الشحن', 'عملة الشحن', 'دفع الشحن',
            'أجور التحويل', 'عملة التحويل', 'دفع التحويل', 'أجور المحول', 'عملة المحول', 'المبلغ الإجمالي المحصل', 'ملاحظات'
        ];
        const headerRow = sheet.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.style = headerStyle;
        });
        headerRow.height = 25;
        filteredShipments.forEach(shipment => {
            sheet.addRow({
                ...shipment,
                goodsValue: parseFloat(shipment.goodsValue) || 0,
                shippingFee: parseFloat(shipment.shippingFee) || 0,
                transferFee: parseFloat(shipment.transferFee) || 0,
                internalTransferFee: parseFloat(shipment.internalTransferFee) || 0,
                shippingFeePaymentMethod: shipment.shippingFeePaymentMethod === 'collect' ? 'تحصيل' : 'مدفوع مسبقاً',
                transferFeePaymentMethod: shipment.transferFeePaymentMethod === 'collect' ? 'تحصيل' : 'مدفوع مسبقاً',
                collectibleAmount: formatMultiCurrency(shipment),
            });
        });
        
        sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            if (rowNumber > 1) { 
                row.eachCell((cell) => { 
                    cell.alignment = { horizontal: 'center', vertical: 'middle' }; 
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; 
                }); 
            }
        });

        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const today = new Date().toISOString().split('T')[0];
            saveAs(blob, `تقرير_الشحنات_المفصل_${today}.xlsx`);
        });
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
                            <h1 className="text-3xl font-bold gradient-text">{tr('shipmentsManagement')}</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <AnimatedButton
                                onClick={handleExport}
                                variant="primary"
                                icon={DownloadIcon}
                            >
                                {tr('export')} Excel
                            </AnimatedButton>
                            <AnimatedButton
                                onClick={() => navigate('/add-shipment')}
                                variant="primary"
                                icon={PlusCircleIcon}
                            >
                                {tr('addNewShipment')}
                            </AnimatedButton>
                        </div>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                            <div className="flex flex-col lg:flex-row items-center gap-4">
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder={tr('searchShipments')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full lg:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                
                                {/* Advanced Filters Toggle */}
                                <AnimatedButton
                                    onClick={() => setShowFilters(!showFilters)}
                                    variant="outline"
                                    size="sm"
                                >
                                    {showFilters ? tr('hideFilters') : tr('advancedFilters')}
                                </AnimatedButton>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedView}
                                    onChange={(e) => setSelectedView(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="all">{tr('allShipments')}</option>
                                    <option value="received">{tr('statusReceived')}</option>
                                    <option value="in-transit">{tr('statusInTransit')}</option>
                                    <option value="delivered">{tr('statusDelivered')}</option>
                                </select>
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
                                                <option value="received">{tr('statusReceived')}</option>
                                                <option value="in-transit">{tr('statusInTransit')}</option>
                                                <option value="arrived">{tr('statusArrived')}</option>
                                                <option value="delivered">{tr('statusDelivered')}</option>
                                                <option value="returned">{tr('statusReturned')}</option>
                                            </select>
                                        </div>
                                        
                                        {/* Governorate Filter */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('governorate')}</label>
                                            <select
                                                value={filters.governorate}
                                                onChange={(e) => handleFilterChange('governorate', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="">{tr('allGovernorates')}</option>
                                                <option value={tr('nicosia')}>{tr('nicosia')}</option>
                                                <option value={tr('famagusta')}>{tr('famagusta')}</option>
                                                <option value={tr('kyrenia')}>{tr('kyrenia')}</option>
                                                <option value={tr('morphou')}>{tr('morphou')}</option>
                                                <option value={tr('iskele')}>{tr('iskele')}</option>
                                                <option value={tr('lefke')}>{tr('lefke')}</option>
                                                <option value={tr('güzelyurt')}>{tr('güzelyurt')}</option>
                                                <option value={tr('dipkarpaz')}>{tr('dipkarpaz')}</option>
                                                <option value={tr('bogaz')}>{tr('bogaz')}</option>
                                                <option value={tr('akdogan')}>{tr('akdogan')}</option>
                                                <option value={tr('ercan')}>{tr('ercan')}</option>
                                                <option value={tr('karpaz')}>{tr('karpaz')}</option>
                                            </select>
                                        </div>
                                        
                                        {/* Payment Method Filter */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('paymentMethod')}</label>
                                            <select
                                                value={filters.paymentMethod}
                                                onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="">{tr('allMethods')}</option>
                                                {getUniquePaymentMethods().map(method => (
                                                    <option key={method} value={method}>
                                                        {method === 'collect' ? tr('collect') : tr('prepaid')}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        {/* Vehicle Filter */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('assignedVehicle')}</label>
                                            <select
                                                value={filters.assignedVehicle}
                                                onChange={(e) => handleFilterChange('assignedVehicle', e.target.value)}
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
                                    </div>
                                    
                                    {/* Clear Filters Button */}
                                    <div className="mt-4 flex justify-end">
                                        <AnimatedButton
                                            onClick={clearFilters}
                                            variant="outline"
                                            size="sm"
                                        >
                                            {tr('resetFilters')}
                                        </AnimatedButton>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Shipments Table */}
                <AnimatedCard className="overflow-hidden" delay={1}>
                    {isLoading ? (
                        <div className="p-20 text-center">
                            <AnimatedLoader 
                                type="ring" 
                                size="xl" 
                                color="indigo" 
                                text={tr('loadingShipments')}
                            />
                        </div>
                    ) : (
                        <>
                            {/* Mobile View */}
                            <div className="md:hidden">
                                <div className="p-4 space-y-4">
                                    <AnimatePresence>
                                        {filteredShipments.map((shipment, index) => (
                                            <motion.div
                                                key={shipment.id}
                                                variants={itemVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="hidden"
                                                transition={{ delay: index * 0.1 }}
                                                className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-200"
                                            >
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="font-bold text-indigo-600 text-lg">{shipment.shipmentId}</span>
                                                    <span className="text-sm text-gray-500">{shipment.date}</span>
                                                </div>
                                                <div className="mb-3">
                                                    <p className="font-semibold text-gray-800">{shipment.customerName}</p>
                                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {shipment.governorate}
                                                    </p>
                                                </div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="font-semibold text-gray-700">
                                                         {tr('amount')}: {formatMultiCurrency(shipment)}
                                                    </span>
                                                    <StatusSelector 
                                                        currentStatus={shipment.status} 
                                                        onStatusChange={(newStatus) => handleStatusChange(shipment.id, newStatus)} 
                                                    />
                                                </div>
                                                <div className="flex items-center justify-end gap-3 border-t pt-3">
                                                    <AnimatedButton
                                                        onClick={() => navigate(`/edit-shipment/${shipment.id}`)}
                                                        variant="outline"
                                                        size="sm"
                                                        icon={Package}
                                                        className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
                                                        title={tr('viewEditShipment')}
                                                    />
                                                    <AnimatedButton
                                                        onClick={() => handleCopyLink(shipment.shipmentId)}
                                                        variant="outline"
                                                        size="sm"
                                                        icon={LinkIcon}
                                                        title={tr('copyTrackingLink')}
                                                    />
                                                    <AnimatedButton
                                                        onClick={() => handleDeleteShipment(shipment.id)}
                                                        variant="outline"
                                                        size="sm"
                                                        icon={TrashIcon}
                                                        className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                                                        title={tr('deleteShipment')}
                                                    />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Desktop View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                        <tr>
                                            <th className="p-4 font-semibold">{tr('shipmentNumber')}</th>
                                            <th className="p-4 font-semibold">{tr('customer')}</th>
                                            <th className="p-4 font-semibold">{tr('governorate')}</th>
                                            <th className="p-4 font-semibold">{tr('goodsValue')}</th>
                                            <th className="p-4 font-semibold">{tr('collectibleAmount')}</th>
                                            <th className="p-4 font-semibold">{tr('date')}</th>
                                            <th className="p-4 font-semibold">{tr('status')}</th>
                                            <th className="p-4 font-semibold">{tr('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        <AnimatePresence>
                                            {filteredShipments.map((shipment, index) => (
                                                <motion.tr
                                                    key={shipment.id}
                                                    variants={itemVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="hidden"
                                                    transition={{ delay: index * 0.05 }}
                                                    className="hover:bg-gray-50/80 backdrop-blur-sm transition-colors duration-200"
                                                >
                                                    <td className="p-4 font-medium text-gray-900">{shipment.shipmentId}</td>
                                                    <td className="p-4">{shipment.customerName}</td>
                                                    <td className="p-4">{shipment.governorate}</td>
                                                    <td className="p-4">{`${shipment.goodsValue || 0} ${shipment.goodsCurrency || ''}`}</td>
                                                    <td className="p-4 font-semibold">{formatMultiCurrency(shipment)}</td>
                                                    <td className="p-4">{shipment.date}</td>
                                                    <td className="p-4">
                                                        <StatusSelector 
                                                            currentStatus={shipment.status} 
                                                            onStatusChange={(newStatus) => handleStatusChange(shipment.id, newStatus)}
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <AnimatedButton
                                                                onClick={() => navigate(`/edit-shipment/${shipment.id}`)}
                                                                variant="outline"
                                                                size="sm"
                                                                icon={Package}
                                                                className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
                                                                title={tr('viewEditShipment')}
                                                            />
                                                            <AnimatedButton
                                                                onClick={() => handleCopyLink(shipment.shipmentId)}
                                                                variant="outline"
                                                                size="sm"
                                                                icon={LinkIcon}
                                                                title={tr('copyTrackingLink')}
                                                            />
                                                            <AnimatedButton
                                                                onClick={() => handleDeleteShipment(shipment.id)}
                                                                variant="outline"
                                                                size="sm"
                                                                icon={TrashIcon}
                                                                className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                                                                title={tr('deleteShipment')}
                                                            />
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                    
                    {filteredShipments.length === 0 && !isLoading && (
                        <motion.div 
                            className="text-center py-20"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">{tr('noShipmentsMessage')}</p>
                        </motion.div>
                    )}
                </AnimatedCard>
            </motion.div>
        </div>
    );
} 