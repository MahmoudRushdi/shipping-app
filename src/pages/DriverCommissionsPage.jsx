import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ArrowLeftIcon, DownloadIcon, FilterIcon } from '../components/Icons';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedLoader from '../components/AnimatedLoader';
import { motion } from 'framer-motion';
import { User, DollarSign, Calendar, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useLanguage } from '../hooks/useLanguage';

export default function DriverCommissionsPage() {
    const navigate = useNavigate();
    const { tr, language } = useLanguage();
    const [drivers, setDrivers] = useState([]);
    const [trips, setTrips] = useState([]);
    const [shipments, setShipments] = useState([]);
    const [commissions, setCommissions] = useState([]);
    const [commissionPayments, setCommissionPayments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDriver, setSelectedDriver] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [showOnlyWithAmount, setShowOnlyWithAmount] = useState(true);
    const [minAmount, setMinAmount] = useState(0);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        setIsLoading(true);
        
        // Fetch drivers
        const driversCollection = collection(db, 'drivers');
        const driversUnsubscribe = onSnapshot(driversCollection, (snapshot) => {
            const driversData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDrivers(driversData);
        });

        // Fetch trips
        const tripsCollection = collection(db, 'trips');
        const tripsQuery = query(tripsCollection, orderBy('createdAt', 'desc'));
        const tripsUnsubscribe = onSnapshot(tripsQuery, (snapshot) => {
            const tripsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
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
        });

        // Fetch commission payments
        const commissionPaymentsCollection = collection(db, 'commission_payments');
        const commissionPaymentsUnsubscribe = onSnapshot(commissionPaymentsCollection, (snapshot) => {
            const paymentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCommissionPayments(paymentsData);
            setIsLoading(false);
        });

        return () => {
            driversUnsubscribe();
            tripsUnsubscribe();
            shipmentsUnsubscribe();
            commissionPaymentsUnsubscribe();
        };
    }, []);

    // Calculate total shipping fees for a trip
    const calculateTripTotalShipping = (trip) => {
        const totals = {};
        
        // Calculate from shipments assigned to this trip
        if (trip.shipmentIds && trip.shipmentIds.length > 0) {
            const tripShipments = shipments.filter(shipment => trip.shipmentIds.includes(shipment.id));
            
            tripShipments.forEach(shipment => {
                if (shipment.shippingFeePaymentMethod === 'collect') {
                    const shippingVal = parseFloat(shipment.shippingFee) || 0;
                    if (shippingVal > 0) {
                        const currency = shipment.shippingFeeCurrency || 'USD';
                        totals[currency] = (totals[currency] || 0) + shippingVal;
                    }
                }
            });
        }
        
        // Calculate from dispatched branch items
        if (trip.dispatchedBranchItems && trip.dispatchedBranchItems.length > 0) {
            trip.dispatchedBranchItems.forEach(item => {
                const itemValue = parseFloat(item.itemValue) || 0;
                if (itemValue > 0) {
                    const currency = item.itemCurrency || 'USD';
                    totals[currency] = (totals[currency] || 0) + itemValue;
                }
            });
        }
        
        return totals;
    };

    // Calculate commissions from trips
    useEffect(() => {
        const calculatedCommissions = [];
        
        trips.forEach(trip => {
            if (trip.stations && trip.stations.length > 0) {
                trip.stations.forEach((station, index) => {
                    if (station.driverId && station.commissionPercentage && station.assignedShipments) {
                        const driver = drivers.find(d => d.id === station.driverId);
                        
                        // Calculate commission from assigned shipments only
                        let totalShippingFees = 0;
                        let assignedShipmentsList = [];
                        
                        if (station.assignedShipments && station.assignedShipments.length > 0) {
                            station.assignedShipments.forEach(shipmentId => {
                                const shipment = shipments.find(s => s.id === shipmentId);
                                if (shipment && shipment.shippingFeePaymentMethod === 'collect') {
                                    const shippingFee = parseFloat(shipment.shippingFee) || 0;
                                    if (shippingFee > 0) {
                                        totalShippingFees += shippingFee;
                                        assignedShipmentsList.push({
                                            id: shipment.id,
                                            name: shipment.senderName || shipment.customerName || 'غير محدد',
                                            destination: shipment.destination,
                                            shippingFee: shippingFee
                                        });
                                    }
                                }
                            });
                        }
                        
                        const commissionAmount = totalShippingFees * (station.commissionPercentage / 100);
                        
                        // Display station name as written in the trip
                        let stationDisplayName = station.stationName || 'محطة غير محددة';
                        
                        // Check if there's a saved payment status for this commission
                        const savedPayment = commissionPayments.find(payment => 
                            payment.commissionId === `${trip.id}-${station.stationName}-${index}`
                        );
                        
                        calculatedCommissions.push({
                            id: `${trip.id}-${station.stationName}-${index}`,
                            tripId: trip.id,
                            tripName: trip.tripName || `رحلة ${trip.vehicleNumber || 'جديدة'}`,
                            driverId: station.driverId,
                            driverName: station.driverName || driver?.driverName || 'مندوب غير محدد',
                            stationName: stationDisplayName,
                            commissionPercentage: station.commissionPercentage,
                            commissionAmount: commissionAmount,
                            currency: 'USD',
                            tripDate: trip.createdAt,
                            status: savedPayment ? savedPayment.status : (trip.status === 'تم التسليم' ? 'paid' : 'pending'),
                            notes: station.notes || '',
                            totalShippingAmount: totalShippingFees,
                            assignedShipments: assignedShipmentsList
                        });
                    }
                });
            }
        });
        
        setCommissions(calculatedCommissions);
    }, [trips, drivers, shipments, commissionPayments]);

    // Filter commissions
    const filteredCommissions = commissions.filter(commission => {
        const matchesDriver = !selectedDriver || commission.driverId === selectedDriver;
        const matchesStatus = !selectedStatus || commission.status === selectedStatus;
        const matchesDate = !dateRange.start || !dateRange.end || 
            (commission.tripDate && 
             commission.tripDate.toDate() >= new Date(dateRange.start) && 
             commission.tripDate.toDate() <= new Date(dateRange.end));
        const matchesAmount = !showOnlyWithAmount || commission.commissionAmount > 0;
        const matchesMinAmount = commission.commissionAmount >= minAmount;
        
        return matchesDriver && matchesStatus && matchesDate && matchesAmount && matchesMinAmount;
    });

    // Calculate totals
    const totalCommissions = filteredCommissions.reduce((sum, commission) => sum + commission.commissionAmount, 0);
    const paidCommissions = filteredCommissions.filter(c => c.status === 'paid').reduce((sum, commission) => sum + commission.commissionAmount, 0);
    const pendingCommissions = filteredCommissions.filter(c => c.status === 'pending').reduce((sum, commission) => sum + commission.commissionAmount, 0);

    // Calculate driver summary
    const driverSummary = {};
    filteredCommissions.forEach(commission => {
        if (!driverSummary[commission.driverName]) {
            driverSummary[commission.driverName] = {
                totalAmount: 0,
                paidAmount: 0,
                pendingAmount: 0,
                tripCount: new Set(),
                shipmentCount: 0
            };
        }
        driverSummary[commission.driverName].totalAmount += commission.commissionAmount;
        driverSummary[commission.driverName].tripCount.add(commission.tripName);
        
        // Add shipment count
        if (commission.assignedShipments && commission.assignedShipments.length > 0) {
            driverSummary[commission.driverName].shipmentCount += commission.assignedShipments.length;
        }
        
        if (commission.status === 'paid') {
            driverSummary[commission.driverName].paidAmount += commission.commissionAmount;
        } else {
            driverSummary[commission.driverName].pendingAmount += commission.commissionAmount;
        }
    });

    const handleUpdateCommissionStatus = async (commissionId, newStatus) => {
        try {
            // Find the commission to get its details
            const commission = commissions.find(c => c.id === commissionId);
            if (!commission) {
                alert('لم يتم العثور على العمولة المحددة.');
                return;
            }

            // Save commission payment status to database
            const commissionPaymentData = {
                commissionId: commissionId,
                tripId: commission.tripId,
                driverId: commission.driverId,
                driverName: commission.driverName,
                tripName: commission.tripName,
                stationName: commission.stationName,
                commissionPercentage: commission.commissionPercentage,
                commissionAmount: commission.commissionAmount,
                status: newStatus,
                paymentDate: newStatus === 'paid' ? new Date() : null,
                updatedAt: new Date()
            };

            // Add to commission_payments collection
            const commissionPaymentsRef = collection(db, 'commission_payments');
            await addDoc(commissionPaymentsRef, commissionPaymentData);

            // Update the commission status in the local state
            setCommissions(prev => prev.map(commission => 
                commission.id === commissionId 
                    ? { ...commission, status: newStatus }
                    : commission
            ));
            
            alert(`تم تحديث حالة العمولة إلى: ${newStatus === 'paid' ? 'تم الدفع' : 'معلق'}`);
        } catch (error) {
            console.error('Error updating commission status:', error);
            alert('حدث خطأ أثناء تحديث حالة العمولة.');
        }
    };

    const handleExport = async () => {
        const workbook = new ExcelJS.Workbook();
        const moneyFormat = '#,##0.00';
        
        // Enhanced styles
        const headerStyle = { 
            font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }, 
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } }, 
            alignment: { horizontal: 'center', vertical: 'middle' }, 
            border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } 
        };
        
        const dataStyle = {
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
            font: { size: 11 }
        };
        
        const summaryStyle = {
            font: { bold: true, size: 12 },
            alignment: { horizontal: 'center', vertical: 'middle' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } },
            border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        };

        const sheet = workbook.addWorksheet('تقرير أجور المناديب');
        sheet.columns = [
            { header: 'اسم المندوب', key: 'driverName', width: 25 },
            { header: 'اسم الرحلة', key: 'tripName', width: 30 },
            { header: 'المحطة', key: 'stationName', width: 25 },
            { header: 'النسبة المئوية', key: 'commissionPercentage', width: 15 },
            { header: 'مبلغ الأجرة', key: 'commissionAmount', width: 20 },
            { header: 'العملة', key: 'currency', width: 10 },
            { header: 'تاريخ الرحلة', key: 'tripDate', width: 15 },
            { header: 'الحالة', key: 'status', width: 15 }
        ];

        // Add columns for driver summary
        const driverSummarySheet = workbook.addWorksheet('ملخص حسب المندوب');
        driverSummarySheet.columns = [
            { header: 'اسم المندوب', key: 'driverName', width: 25 },
            { header: 'عدد الرحلات', key: 'tripCount', width: 15 },
            { header: 'إجمالي العمولات', key: 'totalAmount', width: 20 },
            { header: 'المدفوع', key: 'paidAmount', width: 20 },
            { header: 'المعلق', key: 'pendingAmount', width: 20 }
        ];

        // Add header
        sheet.mergeCells('A1:H1');
        sheet.getCell('A1').value = 'تقرير أجور المناديب';
        sheet.getCell('A1').style = { 
            font: { bold: true, size: 18, color: { argb: 'FF000000' } }, 
            alignment: { horizontal: 'center', vertical: 'middle' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }
        };
        sheet.getRow(1).height = 30;
        sheet.addRow([]);

        // Add column headers
        const headers = [
            'اسم المندوب', 'اسم الرحلة', 'المحطة', 'النسبة المئوية', 'مبلغ الأجرة', 'العملة', 'تاريخ الرحلة', 'الحالة'
        ];
        const headerRow = sheet.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.style = headerStyle;
        });
        headerRow.height = 25;
        sheet.addRow([]);

        // Add summary with better formatting
        const summaryRow1 = sheet.addRow(['إجمالي الأجور:', totalCommissions.toLocaleString(), 'USD']);
        summaryRow1.eachCell((cell, colNumber) => {
            cell.style = summaryStyle;
        });
        
        const summaryRow2 = sheet.addRow(['الأجور المدفوعة:', paidCommissions.toLocaleString(), 'USD']);
        summaryRow2.eachCell((cell, colNumber) => {
            cell.style = summaryStyle;
        });
        
        const summaryRow3 = sheet.addRow(['الأجور المعلقة:', pendingCommissions.toLocaleString(), 'USD']);
        summaryRow3.eachCell((cell, colNumber) => {
            cell.style = summaryStyle;
        });
        sheet.addRow([]);

        // Add data with proper formatting
        filteredCommissions.forEach(commission => {
            const dataRow = sheet.addRow([
                commission.driverName,
                commission.tripName,
                commission.stationName,
                `${commission.commissionPercentage}%`,
                commission.commissionAmount,
                commission.currency,
                commission.tripDate ? commission.tripDate.toDate().toLocaleDateString('ar-EG') : 'N/A',
                commission.status === 'paid' ? 'تم الدفع' : 'معلق'
            ]);
            
            // Apply data style to each cell
            dataRow.eachCell((cell, colNumber) => {
                cell.style = dataStyle;
            });
        });

        // Add detailed breakdown by driver
        sheet.addRow([]);
        const breakdownHeader = sheet.addRow(['تفصيل حسب المندوب']);
        breakdownHeader.getCell(1).style = {
            font: { bold: true, size: 14, color: { argb: 'FF000000' } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }
        };
        sheet.mergeCells('A' + breakdownHeader.number + ':H' + breakdownHeader.number);
        sheet.addRow([]);

        const driverTotals = {};
        filteredCommissions.forEach(commission => {
            if (!driverTotals[commission.driverName]) {
                driverTotals[commission.driverName] = {
                    totalAmount: 0,
                    paidAmount: 0,
                    pendingAmount: 0,
                    trips: new Set()
                };
            }
            driverTotals[commission.driverName].totalAmount += commission.commissionAmount;
            driverTotals[commission.driverName].trips.add(commission.tripName);
            if (commission.status === 'paid') {
                driverTotals[commission.driverName].paidAmount += commission.commissionAmount;
            } else {
                driverTotals[commission.driverName].pendingAmount += commission.commissionAmount;
            }
        });

        Object.entries(driverTotals).forEach(([driverName, totals]) => {
            const driverRow = sheet.addRow([
                driverName,
                `${totals.trips.size} رحلة`,
                totals.totalAmount.toLocaleString(),
                totals.paidAmount.toLocaleString(),
                totals.pendingAmount.toLocaleString()
            ]);
            
            // Apply data style to driver breakdown
            driverRow.eachCell((cell, colNumber) => {
                cell.style = dataStyle;
            });
            
            // Add to driver summary sheet
            const summaryRow = driverSummarySheet.addRow([
                driverName,
                totals.trips.size,
                totals.totalAmount,
                totals.paidAmount,
                totals.pendingAmount
            ]);
            
            // Apply data style to summary sheet
            summaryRow.eachCell((cell, colNumber) => {
                cell.style = dataStyle;
            });
        });

        // Add column headers for driver summary sheet
        const driverSummaryHeaders = [
            'اسم المندوب', 'عدد الرحلات', 'إجمالي العمولات', 'المدفوع', 'المعلق'
        ];
        const driverSummaryHeaderRow = driverSummarySheet.addRow(driverSummaryHeaders);
        driverSummaryHeaderRow.eachCell((cell) => {
            cell.style = headerStyle;
        });
        driverSummaryHeaderRow.height = 25;

        // Style main sheet header row
        const headerRowNumber = 6; // After summary rows
        sheet.getRow(headerRowNumber).eachCell((cell) => {
            cell.style = headerStyle;
        });
        sheet.getRow(headerRowNumber).height = 25;

        // Add summary statistics with better formatting
        const statsSheet = workbook.addWorksheet('ملخص إحصائي');
        statsSheet.columns = [
            { header: 'البند', key: 'item', width: 35 },
            { header: 'القيمة', key: 'value', width: 25 }
        ];

        // Add header
        statsSheet.mergeCells('A1:B1');
        statsSheet.getCell('A1').value = 'ملخص إحصائي - تقرير أجور المناديب';
        statsSheet.getCell('A1').style = { 
            font: { bold: true, size: 16, color: { argb: 'FF000000' } }, 
            alignment: { horizontal: 'center', vertical: 'middle' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }
        };
        statsSheet.getRow(1).height = 30;
        statsSheet.addRow([]);

        // Add column headers
        const statsHeaders = ['البند', 'القيمة'];
        const statsHeaderRow = statsSheet.addRow(statsHeaders);
        statsHeaderRow.eachCell((cell) => {
            cell.style = headerStyle;
        });
        statsHeaderRow.height = 25;
        statsSheet.addRow([]);

        // Add statistics data
        const statsData = [
            ['إجمالي العمولات', totalCommissions.toLocaleString() + ' USD'],
            ['العمولات المدفوعة', paidCommissions.toLocaleString() + ' USD'],
            ['العمولات المعلقة', pendingCommissions.toLocaleString() + ' USD'],
            ['عدد المناديب', Object.keys(driverSummary).length.toString()],
            ['عدد الرحلات', new Set(filteredCommissions.map(c => c.tripId)).size.toString()],
            ['تاريخ التقرير', new Date().toLocaleDateString('ar-EG')],
            ['الفلترة المطبقة', `المندوب: ${selectedDriver || 'الكل'}, الحالة: ${selectedStatus || 'الكل'}, المبلغ الأدنى: ${minAmount} USD`]
        ];

        statsData.forEach(([item, value]) => {
            const statsRow = statsSheet.addRow([item, value]);
            statsRow.eachCell((cell, colNumber) => {
                cell.style = dataStyle;
            });
        });

        // Style stats sheet header - FIX: Apply header style to column headers
        statsSheet.getRow(3).eachCell((cell) => {
            cell.style = headerStyle;
        });
        statsSheet.getRow(3).height = 25;

        // Save file
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `تقرير_أجور_المناديب_${new Date().toISOString().split('T')[0]}.xlsx`);
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
                className="max-w-7xl mx-auto"
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
                        <h1 className="text-3xl font-bold gradient-text">{tr('driverCommissions')}</h1>
                        </div>
                        <AnimatedButton
                            onClick={handleExport}
                            variant="primary"
                            icon={DownloadIcon}
                        >
                            {tr('exportReport')}
                        </AnimatedButton>
                    </div>
                </motion.div>

                {/* Info Card */}
                <motion.div className="mb-6" variants={itemVariants}>
                    <AnimatedCard className="p-4 bg-blue-50 border-blue-200">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-800 mb-2">{tr('howCommissionsWork')}</h3>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• <strong>{tr('commissionCalculation')}:</strong> {tr('commissionCalculationDesc')}</li>
                                    <li>• <strong>{tr('commissionPercentage')}:</strong> {tr('commissionPercentageDesc')}</li>
                                    <li>• <strong>{tr('commissionStatus')}:</strong> {tr('commissionStatusDesc')}</li>
                                    <li>• <strong>{tr('updateStatus')}:</strong> {tr('updateStatusDesc')}</li>
                                </ul>
                            </div>
                        </div>
                    </AnimatedCard>
                </motion.div>

                {/* Statistics Cards */}
                <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={itemVariants}>
                    <AnimatedCard className="p-6" delay={0.1}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{tr('totalCommissions')}</p>
                                <p className="text-2xl font-bold text-gray-900">{totalCommissions.toLocaleString()} USD</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-600" />
                        </div>
                    </AnimatedCard>

                    <AnimatedCard className="p-6" delay={0.2}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{tr('paidCommissions')}</p>
                                <p className="text-2xl font-bold text-green-600">{paidCommissions.toLocaleString()} USD</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                    </AnimatedCard>

                    <AnimatedCard className="p-6" delay={0.3}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{tr('pendingCommissions')}</p>
                                <p className="text-2xl font-bold text-orange-600">{pendingCommissions.toLocaleString()} USD</p>
                            </div>
                            <Calendar className="w-8 h-8 text-orange-600" />
                        </div>
                    </AnimatedCard>
                </motion.div>

                {/* Filters */}
                <motion.div className="mb-6" variants={itemVariants}>
                    <AnimatedCard className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{tr('driver')}</label>
                                <select
                                    value={selectedDriver}
                                    onChange={(e) => setSelectedDriver(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">{tr('allDrivers')}</option>
                                    {drivers.map(driver => (
                                        <option key={driver.id} value={driver.id}>{driver.driverName}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{tr('status')}</label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">{tr('allStatuses')}</option>
                                    <option value="paid">{tr('paid')}</option>
                                    <option value="pending">{tr('pending')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{tr('fromDate')}</label>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{tr('toDate')}</label>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div className="flex items-center">
                                <label className="flex items-center space-x-2 space-x-reverse">
                                    <input
                                        type="checkbox"
                                        checked={showOnlyWithAmount}
                                        onChange={(e) => setShowOnlyWithAmount(e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                                                         <span className="text-sm font-medium text-gray-700">{tr('showOnlyWithAmount')}</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{tr('minimumAmount')}</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={minAmount}
                                    onChange={(e) => setMinAmount(parseFloat(e.target.value) || 0)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </AnimatedCard>
                </motion.div>

                {/* Driver Summary */}
                {Object.keys(driverSummary).length > 0 && (
                    <motion.div className="mb-6" variants={itemVariants}>
                        <AnimatedCard className="p-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">{tr('driverSummary')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(driverSummary).map(([driverName, summary]) => (
                                    <div key={driverName} className="p-3 bg-gray-50 rounded-lg border">
                                        <h4 className="font-semibold text-gray-800 mb-2">{driverName}</h4>
                                        <div className="space-y-1 text-sm">
                                            <p><span className="text-gray-600">{tr('numberOfTrips')}:</span> {summary.tripCount.size}</p>
                                            <p><span className="text-gray-600">{tr('totalCommissions')}:</span> {summary.totalAmount.toLocaleString()} USD</p>
                                            <p><span className="text-green-600">{tr('paid')}:</span> {summary.paidAmount.toLocaleString()} USD</p>
                                            <p><span className="text-orange-600">{tr('pending')}:</span> {summary.pendingAmount.toLocaleString()} USD</p>
                                            <p><span className="text-blue-600">{tr('shipmentCount')}:</span> {summary.shipmentCount || 0}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AnimatedCard>
                    </motion.div>
                )}

                {/* Commissions List */}
                <AnimatedCard className="p-6" delay={0.4}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">{tr('commissionsList')}</h3>
                        <span className="text-sm text-gray-600">
                            {tr('showingCommissions') ? tr('showingCommissions').replace('{count}', filteredCommissions.length).replace('{total}', commissions.length) : `عرض ${filteredCommissions.length} من ${commissions.length} عمولة`}
                        </span>
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
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className={`p-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{tr('driver')}</th>
                                        <th className={`p-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{tr('tripName')}</th>
                                        <th className={`p-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{tr('station')}</th>
                                        <th className={`p-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{tr('percentage')}</th>
                                        <th className={`p-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{tr('commissionAmount')}</th>
                                        <th className={`p-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{tr('totalShippingAmount')}</th>
                                        <th className={`p-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{tr('assignedShipments')}</th>
                                        <th className={`p-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{tr('tripDate')}</th>
                                        <th className={`p-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{tr('status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCommissions.map((commission) => (
                                        <motion.tr 
                                            key={commission.id}
                                            className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                                            variants={itemVariants}
                                            onClick={() => {
                                                const details = `
${tr('commissionDetails')}:
• ${tr('driver')}: ${commission.driverName}
• ${tr('trip')}: ${commission.tripName}
• ${tr('station')}: ${commission.stationName}
• ${tr('percentage')}: ${commission.commissionPercentage}%
• ${tr('commissionAmount')}: ${commission.commissionAmount.toLocaleString()} USD
• ${tr('totalShippingAmount')}: ${commission.totalShippingAmount.toLocaleString()} USD
• ${tr('shipmentsResponsibleFor')}: ${commission.assignedShipments && commission.assignedShipments.length > 0 ? 
    commission.assignedShipments.map(s => `\n  - ${s.name} (${s.destination}) - ${s.shippingFee}$`).join('') : tr('noShipments')}
• ${tr('status')}: ${commission.status === 'paid' ? tr('paid') : tr('pending')}
• ${tr('date')}: ${commission.tripDate ? new Date(commission.tripDate.toDate()).toLocaleDateString('en-US') : 'N/A'}
                                                `;
                                                
                                                // Create a modal-like popup
                                                const popup = document.createElement('div');
                                                popup.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                                                popup.innerHTML = `
                                                    <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                                                        <h3 class="text-lg font-semibold mb-4">${tr('commissionDetails')}</h3>
                                                        <pre class="text-sm text-gray-700 whitespace-pre-line">${details}</pre>
                                                        <button class="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700" onclick="this.parentElement.parentElement.remove()">
                                                            ${tr('close')}
                                                        </button>
                                                    </div>
                                                `;
                                                document.body.appendChild(popup);
                                            }}
                                            title={tr('clickToViewCommissionDetails')}
                                        >
                                            <td className="p-3 font-medium">{commission.driverName}</td>
                                            <td className="p-3">{commission.tripName}</td>
                                            <td className="p-3">{commission.stationName}</td>
                                            <td className="p-3 text-center">{commission.commissionPercentage}%</td>
                                            <td className="p-3 text-center font-medium">
                                                {commission.commissionAmount.toLocaleString()} {commission.currency}
                                            </td>
                                            <td className="p-3 text-center text-sm text-gray-600">
                                                {commission.totalShippingAmount.toLocaleString()} USD
                                            </td>
                                            <td className="p-3 text-center">
                                                {commission.assignedShipments && commission.assignedShipments.length > 0 ? (
                                                    <ul className="text-sm text-gray-700">
                                                        {commission.assignedShipments.map(shipment => (
                                                            <li key={shipment.id}>{shipment.name} ({shipment.destination})</li>
                                                        ))}
                                                    </ul>
                                                ) : tr('noAssignedShipments')}
                                            </td>
                                            <td className="p-3 text-center">
                                                {commission.tripDate ? new Date(commission.tripDate.toDate()).toLocaleDateString('en-US') : 'N/A'}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                        commission.status === 'paid' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-orange-100 text-orange-800'
                                                    }`}>
                                                        {commission.status === 'paid' ? tr('paid') : tr('pending')}
                                                    </span>
                                                    <button
                                                        onClick={() => handleUpdateCommissionStatus(
                                                            commission.id, 
                                                            commission.status === 'paid' ? 'pending' : 'paid'
                                                        )}
                                                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                                                            commission.status === 'paid'
                                                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                                                : 'bg-green-500 text-white hover:bg-green-600'
                                                        }`}
                                                        title={commission.status === 'paid' ? tr('changeToPending') : tr('changeToPaid')}
                                                    >
                                                        {commission.status === 'paid' ? tr('cancelPayment') : tr('paid')}
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            {filteredCommissions.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <p>{tr('noDriverCommissionsToDisplay')}</p>
                                    <p className="text-sm mt-2">
                                        {tr('check')}:
                                        <br />• {tr('tripsWithAssignedDrivers')}
                                        <br />• {tr('shipmentsCollectedInTrips')}
                                        <br />• {tr('applyFilters')}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </AnimatedCard>
            </motion.div>
        </div>
    );
}
