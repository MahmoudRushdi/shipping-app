import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, documentId, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { format } from 'date-fns';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PrinterIcon, DownloadIcon } from '../components/Icons';
import { useParams, Link, useNavigate } from 'react-router-dom';
import StatusSelector from '../components/StatusSelector'; // NEW: Import StatusSelector
import TripPrintReceipt from '../components/TripPrintReceipt';
import { useLanguage } from '../hooks/useLanguage.jsx';

const getCollectibleAmount = (shipment) => {
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
    return totals;
};


export default function TripDetailsPage() {
    const { tripId } = useParams();
    const { language, tr } = useLanguage();
    const [trip, setTrip] = useState(null);
    const [shipments, setShipments] = useState([]); // Regular shipments assigned to this trip
    const [dispatchedBranchItems, setDispatchedBranchItems] = useState([]); // Items dispatched from branch entries
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [expenses, setExpenses] = useState({
        vehicleRental: 0,
        driverCommissionValue: 0,
        driverCommissionType: 'fixed', // 'fixed' or 'percentage'
        expense1_name: '',
        expense1_value: 0,
        expense2_name: '',
        expense2_value: 0,
    });
    
    // Calculate total shipping fees from all shipments in this trip
    const calculateTotalShippingFees = () => {
        const totals = {};
        shipments.forEach(shipment => {
            if (shipment.shippingFeePaymentMethod === 'collect') {
                const shippingVal = parseFloat(shipment.shippingFee) || 0;
                if (shippingVal > 0) {
                    const currency = shipment.shippingFeeCurrency || 'USD';
                    totals[currency] = (totals[currency] || 0) + shippingVal;
                }
            }
        });
        return totals;
    };
    
    // Calculate driver commission based on percentage of total shipping fees
    const calculateDriverCommission = () => {
        if (expenses.driverCommissionType !== 'percentage') {
            return expenses.driverCommissionValue; // Return fixed amount as is
        }
        
        const totalShippingFees = calculateTotalShippingFees();
        const percentage = parseFloat(expenses.driverCommissionValue) || 0;
        
        // For simplicity, calculate based on USD total (you can enhance this for multi-currency)
        const usdTotal = totalShippingFees.USD || 0;
        return (usdTotal * percentage) / 100;
    };

    // Calculate commission for each station driver
    const calculateStationDriverCommission = (station) => {
        const totalShippingFees = calculateTotalShippingFees();
        const percentage = parseFloat(station.commissionPercentage) || 0;
        
        // For simplicity, calculate based on USD total
        const usdTotal = totalShippingFees.USD || 0;
        return (usdTotal * percentage) / 100;
    };
    const [isUpdatingExpenses, setIsUpdatingExpenses] = useState(false);
    const [originalEntriesData, setOriginalEntriesData] = useState({}); // To store original branch entry details
    const [showPrintReceipt, setShowPrintReceipt] = useState(false);
    const [isEditingStations, setIsEditingStations] = useState(false);
    const [editingStations, setEditingStations] = useState([]);
    const navigate = useNavigate(); // NEW: Import useNavigate

    const fetchTripDetails = async () => {
        setIsLoading(true);
        setError('');
        try {
            const tripRef = doc(db, 'trips', tripId);
            const tripSnap = await getDoc(tripRef);

            if (!tripSnap.exists()) {
                setError("لم يتم العثور على الرحلة.");
                setIsLoading(false);
                return;
            }

            const tripData = tripSnap.data();
            setTrip({ id: tripSnap.id, ...tripData });

            // Load expenses if they exist
            setExpenses({
                vehicleRental: tripData.vehicleRental || 0,
                driverCommissionValue: tripData.driverCommissionValue || 0,
                driverCommissionType: tripData.driverCommissionType || 'fixed',
                expense1_name: tripData.expense1_name || '',
                expense1_value: tripData.expense1_value || 0,
                expense2_name: tripData.expense2_name || '',
                expense2_value: tripData.expense2_value || 0,
            });

            // Initialize editing stations data
            setEditingStations(tripData.stations ? [...tripData.stations] : []);

            // Fetch regular shipments assigned to this trip (if any)
            if (tripData.shipmentIds && tripData.shipmentIds.length > 0) {
                const shipmentsQuery = query(collection(db, 'shipments'), where(documentId(), 'in', tripData.shipmentIds));
                const shipmentsSnapshot = await getDocs(shipmentsQuery);
                const fetchedShipments = shipmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setShipments(fetchedShipments);
            } else {
                setShipments([]);
            }

            // Set dispatched branch items
            setDispatchedBranchItems(tripData.dispatchedBranchItems || []);

            // NEW: Fetch details for original branch entries if dispatchedBranchItems exist
            if (tripData.dispatchedBranchItems && tripData.dispatchedBranchItems.length > 0) {
                const uniqueEntryIds = [...new Set(tripData.dispatchedBranchItems.map(item => item.originalEntryId))];
                if (uniqueEntryIds.length > 0) {
                    const originalEntriesQuery = query(collection(db, 'branch_entries'), where(documentId(), 'in', uniqueEntryIds));
                    const originalEntriesSnap = await getDocs(originalEntriesQuery);
                    const fetchedOriginalEntries = {};
                    originalEntriesSnap.forEach(doc => {
                        fetchedOriginalEntries[doc.id] = doc.data();
                    });
                    setOriginalEntriesData(fetchedOriginalEntries);
                }
            }


        } catch (err) {
            console.error("Error fetching trip details:", err);
            setError("فشل تحميل تفاصيل الرحلة.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTripDetails();
    }, [tripId]);


    const handleExpenseChange = (e) => {
        const { name, value, type } = e.target;
        setExpenses(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleUpdateExpenses = async () => {
        setIsUpdatingExpenses(true);
        try {
            const tripRef = doc(db, 'trips', tripId);
            
            await updateDoc(tripRef, {
                vehicleRental: expenses.vehicleRental,
                expense1_name: expenses.expense1_name,
                expense1_value: expenses.expense1_value,
                expense2_name: expenses.expense2_name,
                expense2_value: expenses.expense2_value,
                totalShippingFeesCalculated: calculateTotalShippingFees(), // Save calculated totals for reference
            });
            alert('تم تحديث المصاريف بنجاح!');
        } catch (error) {
            console.error("Error updating expenses:", error);
            alert('حدث خطأ أثناء تحديث المصاريف.');
        } finally {
            setIsUpdatingExpenses(false);
        }
    };

    // Handle station commission editing
    const handleStationCommissionChange = (stationIndex, newPercentage) => {
        setEditingStations(prev => prev.map((station, index) => 
            index === stationIndex 
                ? { ...station, commissionPercentage: parseInt(newPercentage) || 0 }
                : station
        ));
    };

    const handleSaveStations = async () => {
        try {
            const tripRef = doc(db, 'trips', tripId);
            await updateDoc(tripRef, {
                stations: editingStations,
                updatedAt: new Date()
            });
            
            // Update local trip state
            setTrip(prev => ({ ...prev, stations: editingStations }));
            setIsEditingStations(false);
            alert('تم تحديث نسب العمولات بنجاح!');
        } catch (error) {
            console.error("Error updating stations:", error);
            alert('حدث خطأ أثناء تحديث نسب العمولات.');
        }
    };

    const handleCancelStationsEdit = () => {
        setEditingStations(trip.stations ? [...trip.stations] : []);
        setIsEditingStations(false);
    };

    // NEW: Handle Trip Status Change
    const handleStatusChange = async (newStatus) => {
        if (!trip || newStatus === trip.status) return; // No change needed

        try {
            const tripRef = doc(db, 'trips', tripId);
            await updateDoc(tripRef, { status: newStatus });
            setTrip(prev => ({ ...prev, status: newStatus })); // Update local state immediately
            
            // Convert English status to Arabic if needed
            let statusToUpdate = newStatus;
            if (newStatus === 'pending') statusToUpdate = 'معلق';
            if (newStatus === 'in-transit') statusToUpdate = 'قيد النقل';
            if (newStatus === 'delivered') statusToUpdate = 'تم التسليم';
            
            // Update all shipments associated with this trip
            if (shipments.length > 0) {
                const shipmentUpdates = shipments.map(shipment => {
                    const shipmentRef = doc(db, 'shipments', shipment.id);
                    return updateDoc(shipmentRef, { status: statusToUpdate });
                });
                
                await Promise.all(shipmentUpdates);
            }
            
            alert(`تم تحديث حالة الرحلة وجميع الشحنات المرتبطة إلى: ${statusToUpdate}`);
        } catch (error) {
            console.error("Error updating trip status:", error);
            alert("حدث خطأ أثناء تحديث حالة الرحلة.");
        }
    };

    // NEW: Handle Trip Deletion
    const handleDeleteTrip = async () => {
        if (!window.confirm('هل أنت متأكد من حذف هذه الرحلة؟\n\nملاحظة: سيتم إعادة الشحنات المرتبطة إلى حالة معلق.')) {
            return;
        }

        try {
            console.log('Deleting trip:', tripId);
            console.log('Associated shipments:', trip.shipmentIds);
            
            // Update all shipments associated with this trip
            if (trip.shipmentIds && trip.shipmentIds.length > 0) {
                console.log(`Updating ${trip.shipmentIds.length} shipments...`);
                
                const updatePromises = trip.shipmentIds.map(shipmentId => {
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
            const tripRef = doc(db, 'trips', tripId);
            await deleteDoc(tripRef);
            console.log('Trip deleted successfully');
            
            const shipmentCount = trip.shipmentIds?.length || 0;
            if (shipmentCount > 0) {
                alert(`تم حذف الرحلة بنجاح!\n\nتم إعادة ${shipmentCount} شحنة إلى حالة معلق.\n\nيمكنك التحقق من الشحنات في صفحة إدارة الشحنات.`);
            } else {
                alert('تم حذف الرحلة بنجاح!');
            }
            
            // Redirect to trips list after deletion
            navigate('/trips');
            
            // Optional: Redirect to shipments page to verify the changes
            setTimeout(() => {
                if (window.confirm('هل تريد الانتقال إلى صفحة إدارة الشحنات للتحقق من حالة الشحنات؟')) {
                    navigate('/shipments');
                }
            }, 1000);
        } catch (error) {
            console.error("Error deleting trip:", error);
            alert('حدث خطأ أثناء حذف الرحلة: ' + error.message);
        }
    };


    // Calculate totals
    const calculateTotals = () => {
        let collectionsByCurrency = {};
        let expensesByCurrency = {
            [trip?.officeExpensesCurrency || 'USD']: parseFloat(trip?.officeExpenses || 0),
            [trip?.carExpensesCurrency || 'USD']: parseFloat(trip?.carExpenses || 0),
        };


        // Calculate collections from regular shipments
        shipments.forEach(shipment => {
            const collectible = getCollectibleAmount(shipment);
            for (const currency in collectible) {
                collectionsByCurrency[currency] = (collectionsByCurrency[currency] || 0) + collectible[currency];
            }
        });

        // Calculate collections from dispatched branch items (their value is part of collection)
        dispatchedBranchItems.forEach(item => {
            const itemValue = parseFloat(item.itemValue) || 0;
            if (itemValue > 0) {
                collectionsByCurrency[item.itemCurrency] = (collectionsByCurrency[item.itemCurrency] || 0) + itemValue;
            }
        });

        // Add fixed expenses
        expensesByCurrency['USD'] = (expensesByCurrency['USD'] || 0) + parseFloat(expenses.vehicleRental) + parseFloat(expenses.expense1_value) + parseFloat(expenses.expense2_value);

        // Note: Driver commissions are now calculated from station drivers above
        // No need to add them here as they're already included in the expenses

        let profitByCurrency = {};
        // Initialize profit with collections
        for (const currency in collectionsByCurrency) {
            profitByCurrency[currency] = collectionsByCurrency[currency];
        }
        // Subtract expenses from profit
        for (const currency in expensesByCurrency) {
            profitByCurrency[currency] = (profitByCurrency[currency] || 0) - expensesByCurrency[currency];
        }


        return { collections: collectionsByCurrency, expenses: expensesByCurrency, profit: profitByCurrency };
    };

    const totals = calculateTotals();

    const renderTotals = (totalsObject) => {
        const parts = Object.entries(totalsObject)
            .filter(([, amount]) => amount !== 0) // Only show non-zero amounts
            .map(([currency, amount]) => `${amount.toLocaleString()} ${currency}`);
        return parts.join(' + ') || '0 USD';
    };

    const handleExportTrip = async () => {
        if (!trip) return;

        const workbook = new ExcelJS.Workbook();
        // Set RTL based on language
        workbook.rtl = language === 'ar';
        
        // Enhanced styles for professional look
        const headerStyle = { 
            font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }, 
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } }, 
            alignment: { horizontal: 'center', vertical: 'middle' }, 
            border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } 
        };
        
        const subHeaderStyle = { 
            font: { bold: true, size: 11, color: { argb: 'FF000000' } }, 
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }, 
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        };
        
        const dataStyle = { 
            alignment: { horizontal: 'center', vertical: 'middle' }, 
            border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
            font: { size: 10, color: { argb: 'FF000000' } }
        };
        
        const summaryStyle = {
            font: { bold: true, size: 11 },
            alignment: { horizontal: 'center', vertical: 'middle' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } },
            border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        };

        // Sheet 1: Trip Overview
        const overviewSheet = workbook.addWorksheet(tr('tripOverview'));
        overviewSheet.columns = [
            { header: tr('information'), key: 'info', width: 25 },
            { header: tr('details'), key: 'details', width: 40 }
        ];

        // Add main header
        overviewSheet.mergeCells('A1:B1');
        overviewSheet.getCell('A1').value = `${tr('tripDetailsReport')} - ${trip.tripName || trip.id}`;
        overviewSheet.getCell('A1').style = { 
            font: { bold: true, size: 16, color: { argb: 'FF000000' } }, 
            alignment: { horizontal: 'center', vertical: 'middle' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }
        };
        overviewSheet.getRow(1).height = 30;
        overviewSheet.addRow([]);

        // Add trip basic information
        const tripInfo = [
            [tr('tripNumber'), trip.id],
            [tr('tripName'), trip.tripName || tr('notSpecified')],
            [tr('vehicle'), trip.carName || tr('notSpecified')],
            [tr('vehicleNumber'), trip.vehicleNumber || tr('notSpecified')],
            [tr('destination'), trip.destination || tr('notSpecified')],
            [tr('tripStatus'), trip.status || tr('notSpecified')],
            [tr('creationDate'), trip.createdAt ? format(trip.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : tr('notSpecified')],
            [tr('createdBy'), trip.createdBy || tr('notSpecified')],
            [tr('updateDate'), trip.updatedAt ? format(trip.updatedAt.toDate(), 'yyyy-MM-dd HH:mm') : tr('notSpecified')],
            [tr('generalNotes'), trip.notes || tr('none')]
        ];

        tripInfo.forEach(([info, details]) => {
            const row = overviewSheet.addRow([info, details]);
                row.eachCell((cell, colNumber) => {
                cell.style = dataStyle;
            });
        });

        // Add summary section
        overviewSheet.addRow([]);
        const overviewSummaryHeader = overviewSheet.addRow([tr('financialSummary'), '']);
        overviewSummaryHeader.getCell(1).style = subHeaderStyle;
        overviewSheet.mergeCells(`A${overviewSummaryHeader.number}:B${overviewSummaryHeader.number}`);

        const totals = calculateTotals();
        const overviewSummaryData = [
            [tr('totalCollections'), renderTotals(totals.collections)],
            [tr('totalExpenses'), renderTotals(totals.expenses)],
            [tr('netProfit'), renderTotals(totals.profit)],
            [tr('numberOfShipments'), shipments.length.toString()],
            [tr('numberOfDispatchedItems'), dispatchedBranchItems.length.toString()],
            [tr('numberOfDrivers'), trip.stations ? trip.stations.length.toString() : '0']
        ];

        overviewSummaryData.forEach(([info, details]) => {
            const row = overviewSheet.addRow([info, details]);
            row.eachCell((cell, colNumber) => {
                cell.style = summaryStyle;
            });
        });

        // Style the header row
        overviewSheet.getRow(3).eachCell((cell) => {
            cell.style = headerStyle;
        });
        overviewSheet.getRow(3).height = 25;

        // Sheet 2: Shipments
        const shipmentsSheet = workbook.addWorksheet(tr('shipmentDetails'));
        shipmentsSheet.columns = [
            { header: tr('shipmentNumber'), key: 'id', width: 15 },
            { header: tr('senderName'), key: 'senderName', width: 20 },
            { header: tr('receiverName'), key: 'receiverName', width: 20 },
            { header: tr('receiverPhone'), key: 'receiverPhone', width: 15 },
            { header: tr('receiverAddress'), key: 'receiverAddress', width: 30 },
            { header: tr('goodsValue'), key: 'goodsValue', width: 15 },
            { header: tr('goodsCurrency'), key: 'goodsCurrency', width: 10 },
            { header: tr('shippingFee'), key: 'shippingFee', width: 15 },
            { header: tr('shippingCurrency'), key: 'shippingCurrency', width: 10 },
            { header: tr('transferFee'), key: 'hwalaFee', width: 15 },
            { header: tr('transferCurrency'), key: 'hwalaCurrency', width: 10 },
            { header: tr('shippingPaymentMethod'), key: 'shippingPaymentMethod', width: 15 },
            { header: tr('totalCollectible'), key: 'totalCollectible', width: 20 },
            { header: tr('status'), key: 'status', width: 15 },
            { header: tr('creationDate'), key: 'createdAt', width: 15 },
            { header: tr('notes'), key: 'notes', width: 30 }
        ];

        // Add header
        shipmentsSheet.mergeCells('A1:P1');
        shipmentsSheet.getCell('A1').value = tr('shipmentsAssociatedWithTrip');
        shipmentsSheet.getCell('A1').style = { 
            font: { bold: true, size: 14, color: { argb: 'FF000000' } }, 
            alignment: { horizontal: 'center', vertical: 'middle' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }
        };
        shipmentsSheet.getRow(1).height = 25;
        shipmentsSheet.addRow([]);

        // Add column headers
        const shipmentHeaders = [
            tr('shipmentNumber'), tr('senderName'), tr('receiverName'), tr('receiverPhone'), tr('receiverAddress'),
            tr('goodsValue'), tr('goodsCurrency'), tr('shippingFee'), tr('shippingCurrency'), tr('transferFee'),
            tr('transferCurrency'), tr('shippingPaymentMethod'), tr('totalCollectible'), tr('status'), tr('creationDate'), tr('notes')
        ];
        const headerRow = shipmentsSheet.addRow(shipmentHeaders);
        headerRow.eachCell((cell) => {
            cell.style = headerStyle;
        });
        headerRow.height = 25;
        shipmentsSheet.addRow([]);

        // Add shipments data
        if (shipments.length > 0) {
            shipments.forEach(shipment => {
                const collectible = getCollectibleAmount(shipment);
                const totalCollectible = Object.entries(collectible)
                    .map(([currency, amount]) => `${amount.toLocaleString()} ${currency}`)
                    .join(' + ') || '0 USD';

                // Helper function to clean data
                const cleanData = (value) => {
                    if (!value || value === 'undefined' || value === 'null') return tr('notSpecified');
                    if (typeof value === 'string' && (value.includes('الشحنة') || value.includes('المندوب'))) {
                        return tr('notSpecified');
                    }
                    return value;
                };

                const shipmentRow = shipmentsSheet.addRow([
                    cleanData(shipment.shipmentId || shipment.id),
                    cleanData(shipment.senderName || shipment.customerName),
                    cleanData(shipment.receiverName || shipment.recipientName),
                    cleanData(shipment.receiverPhone || shipment.recipientPhone),
                    cleanData(shipment.receiverAddress || shipment.recipientAddress),
                    shipment.goodsValue || 0,
                    shipment.goodsCurrency || 'USD',
                    shipment.shippingFee || 0,
                    shipment.shippingFeeCurrency || 'USD',
                    shipment.hwalaFee || 0,
                    shipment.hwalaFeeCurrency || 'USD',
                    shipment.shippingFeePaymentMethod === 'collect' ? tr('collect') : tr('prepaid'),
                    totalCollectible,
                    cleanData(shipment.status),
                    shipment.createdAt ? format(shipment.createdAt.toDate(), 'yyyy-MM-dd') : tr('notSpecified'),
                    cleanData(shipment.notes || shipment.description) || tr('none')
                ]);

                shipmentRow.eachCell((cell, colNumber) => {
                    cell.style = dataStyle;
                });
            });
        } else {
            const noDataRow = shipmentsSheet.addRow([tr('noShipmentsAssociatedWithTrip')]);
            shipmentsSheet.mergeCells(`A${noDataRow.number}:P${noDataRow.number}`);
            noDataRow.getCell(1).style = { 
                font: { italic: true, color: { argb: 'FF808080' } }, 
                alignment: { horizontal: 'center' } 
            };
        }

        // Style header row - FIX: Apply header style to column headers
        shipmentsSheet.getRow(3).eachCell((cell) => {
            cell.style = headerStyle;
        });
        shipmentsSheet.getRow(3).height = 25;

        // Sheet 3: Stations & Drivers
        const stationsSheet = workbook.addWorksheet(tr('stationsAndDrivers'));
        stationsSheet.columns = [
            { header: tr('station'), key: 'stationName', width: 25 },
            { header: tr('driverName'), key: 'driverName', width: 25 },
            { header: tr('driverPhone'), key: 'driverPhone', width: 15 },
            { header: tr('commissionPercentage'), key: 'commissionPercentage', width: 15 },
            { header: tr('commissionAmount'), key: 'commissionAmount', width: 20 },
            { header: tr('notes'), key: 'notes', width: 30 }
        ];

        // Add header
        stationsSheet.mergeCells('A1:F1');
        stationsSheet.getCell('A1').value = tr('stationsAndDriversDetails');
        stationsSheet.getCell('A1').style = { 
            font: { bold: true, size: 14, color: { argb: 'FF000000' } }, 
            alignment: { horizontal: 'center', vertical: 'middle' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }
        };
        stationsSheet.getRow(1).height = 25;
        stationsSheet.addRow([]);

        // Add column headers
        const stationHeaders = [
            tr('station'), tr('driverName'), tr('driverPhone'), tr('commissionPercentage'), tr('commissionAmount'), tr('notes')
        ];
        const stationHeaderRow = stationsSheet.addRow(stationHeaders);
        stationHeaderRow.eachCell((cell) => {
            cell.style = headerStyle;
        });
        stationHeaderRow.height = 25;
        stationsSheet.addRow([]);

        // Add stations data
        if (trip.stations && trip.stations.length > 0) {
            trip.stations.forEach(station => {
                const commissionAmount = calculateStationDriverCommission(station);
                
                // Helper function to clean station data
                const cleanStationData = (value) => {
                    if (!value || value === 'undefined' || value === 'null') return tr('notSpecified');
                    if (typeof value === 'string' && (value.includes('الشحنة') || value.includes('المندوب'))) {
                        return tr('notSpecified');
                    }
                    return value;
                };

                const stationRow = stationsSheet.addRow([
                    cleanStationData(station.stationName),
                    cleanStationData(station.driverName),
                    cleanStationData(station.driverPhone),
                    station.commissionPercentage ? `${station.commissionPercentage}%` : tr('notSpecified'),
                    `${commissionAmount.toLocaleString()} USD`,
                    cleanStationData(station.notes) || tr('none')
                ]);

                stationRow.eachCell((cell, colNumber) => {
                    cell.style = dataStyle;
                });
            });
        } else {
            const noDataRow = stationsSheet.addRow([tr('noStationsSpecifiedForTrip')]);
            stationsSheet.mergeCells(`A${noDataRow.number}:F${noDataRow.number}`);
            noDataRow.getCell(1).style = { 
                font: { italic: true, color: { argb: 'FF808080' } }, 
                alignment: { horizontal: 'center' } 
            };
        }

        // Style header row - FIX: Apply header style to column headers
        stationsSheet.getRow(3).eachCell((cell) => {
            cell.style = headerStyle;
        });
        stationsSheet.getRow(3).height = 25;

        // Sheet 4: Expenses
        const expensesSheet = workbook.addWorksheet(tr('expenseDetails'));
        expensesSheet.columns = [
            { header: tr('expenseType'), key: 'expenseType', width: 25 },
            { header: tr('details'), key: 'details', width: 30 },
            { header: tr('amount'), key: 'amount', width: 20 },
            { header: tr('currency'), key: 'currency', width: 10 },
            { header: tr('notes'), key: 'notes', width: 30 }
        ];

        // Add header
        expensesSheet.mergeCells('A1:E1');
        expensesSheet.getCell('A1').value = tr('tripExpenseDetails');
        expensesSheet.getCell('A1').style = { 
            font: { bold: true, size: 14, color: { argb: 'FF000000' } }, 
            alignment: { horizontal: 'center', vertical: 'middle' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }
        };
        expensesSheet.getRow(1).height = 25;
        expensesSheet.addRow([]);

        // Add column headers
        const expenseHeaders = [
            tr('expenseType'), tr('details'), tr('amount'), tr('currency'), tr('notes')
        ];
        const expenseHeaderRow = expensesSheet.addRow(expenseHeaders);
        expenseHeaderRow.eachCell((cell) => {
            cell.style = headerStyle;
        });
        expenseHeaderRow.height = 25;
        expensesSheet.addRow([]);

        // Add expenses data
        const expensesData = [
            [tr('vehicleRental'), tr('vehicleRentalForTrip'), expenses.vehicleRental, 'USD', tr('fixedExpense')],
            [tr('additionalExpense1'), expenses.expense1_name || tr('notSpecified'), expenses.expense1_value, 'USD', tr('additionalExpense')],
            [tr('additionalExpense2'), expenses.expense2_name || tr('notSpecified'), expenses.expense2_value, 'USD', tr('additionalExpense')],
            [tr('officeExpenses'), tr('officeExpenses'), trip.officeExpenses || 0, trip.officeExpensesCurrency || 'USD', tr('administrativeExpenses')],
            [tr('vehicleExpenses'), tr('vehicleExpenses'), trip.carExpenses || 0, trip.carExpensesCurrency || 'USD', tr('operationalExpenses')]
        ];

        expensesData.forEach(([type, details, amount, currency, notes]) => {
            if (amount > 0) {
                // Helper function to clean expense data
                const cleanExpenseData = (value) => {
                    if (!value || value === 'undefined' || value === 'null') return tr('notSpecified');
                    if (typeof value === 'string' && (value.includes('الشحنة') || value.includes('المندوب'))) {
                        return tr('notSpecified');
                    }
                    return value;
                };

                const expenseRow = expensesSheet.addRow([
                    cleanExpenseData(type),
                    cleanExpenseData(details),
                    amount,
                    currency,
                    cleanExpenseData(notes)
                ]);

                expenseRow.eachCell((cell, colNumber) => {
                    cell.style = dataStyle;
                });
            }
        });

        // Style header row - FIX: Apply header style to column headers
        expensesSheet.getRow(3).eachCell((cell) => {
            cell.style = headerStyle;
        });
        expensesSheet.getRow(3).height = 25;

        // Sheet 5: Dispatched Items
        if (dispatchedBranchItems.length > 0) {
            const itemsSheet = workbook.addWorksheet(tr('dispatchedItems'));
            itemsSheet.columns = [
                { header: tr('itemNumber'), key: 'itemId', width: 15 },
                { header: tr('itemName'), key: 'itemName', width: 25 },
                { header: tr('quantity'), key: 'quantity', width: 15 },
                { header: tr('itemValue'), key: 'itemValue', width: 20 },
                { header: tr('currency'), key: 'itemCurrency', width: 10 },
                { header: tr('originalEntryNumber'), key: 'originalEntryId', width: 20 },
                { header: tr('notes'), key: 'notes', width: 30 }
            ];

            // Add header
            itemsSheet.mergeCells('A1:G1');
            itemsSheet.getCell('A1').value = tr('dispatchedItemsFromBranchEntries');
            itemsSheet.getCell('A1').style = { 
                font: { bold: true, size: 14, color: { argb: 'FF000000' } }, 
                alignment: { horizontal: 'center', vertical: 'middle' },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }
            };
            itemsSheet.getRow(1).height = 25;
            itemsSheet.addRow([]);

            // Add column headers
            const itemHeaders = [
                tr('itemNumber'), tr('itemName'), tr('quantity'), tr('itemValue'), tr('currency'), tr('originalEntryNumber'), tr('notes')
            ];
            const itemHeaderRow = itemsSheet.addRow(itemHeaders);
            itemHeaderRow.eachCell((cell) => {
                cell.style = headerStyle;
            });
            itemHeaderRow.height = 25;
            itemsSheet.addRow([]);

            // Add items data
            dispatchedBranchItems.forEach(item => {
                const itemRow = itemsSheet.addRow([
                    item.itemId || tr('notSpecified'),
                    item.itemName || tr('notSpecified'),
                    item.quantity || 1,
                    item.itemValue || 0,
                    item.itemCurrency || 'USD',
                    item.originalEntryId || tr('notSpecified'),
                    item.notes || tr('none')
                ]);

                itemRow.eachCell((cell, colNumber) => {
                    cell.style = dataStyle;
                });
            });

            // Style header row - FIX: Apply header style to column headers
            itemsSheet.getRow(3).eachCell((cell) => {
                cell.style = headerStyle;
            });
            itemsSheet.getRow(3).height = 25;
        }

        // Write to file
        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const today = new Date().toISOString().split('T')[0];
            const fileName = language === 'ar' ? `تقرير_الرحلة_${trip.id}_${today}.xlsx` : `Trip_Report_${trip.id}_${today}.xlsx`;
            saveAs(blob, fileName);
        });
    };


    if (isLoading) {
        return <div className="text-center p-10 text-gray-600" dir={language === 'ar' ? 'rtl' : 'ltr'}>{tr('loadingTripDetails')}</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500 bg-red-100 rounded-md m-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>{error}</div>;
    }

    if (!trip) {
        return <div className="text-center p-10 text-gray-500" dir={language === 'ar' ? 'rtl' : 'ltr'}>{tr('noDataToDisplay')}</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-8 font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{tr('tripDetails')}: <span className="text-indigo-600">{trip.carName} - {trip.destination}</span></h1>
                        <p className="text-gray-500">{tr('creationDate')}: {trip.createdAt ? format(trip.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleExportTrip}
                            className="flex items-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200"
                        >
                            <DownloadIcon className="w-5 h-5" /><span>{tr('exportExcel')}</span>
                        </button>
                        <button
                            onClick={() => setShowPrintReceipt(true)}
                            className="flex items-center gap-2 bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-gray-700 transition-colors duration-200"
                        >
                            <PrinterIcon className="w-5 h-5" /><span>{tr('printReceipt')}</span>
                        </button>
                        <Link to="/trips" className="text-sm text-indigo-600 hover:underline">
                            → {tr('backToTripsList')}
                        </Link>
                        <button
                            onClick={handleDeleteTrip}
                            className="flex items-center gap-2 bg-red-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition-colors duration-200"
                        >
                            {tr('deleteTrip')}
                        </button>
                    </div>
                </div>

                {/* Trip General Info */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">{tr('tripInformation')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-700">
                        <p><strong>{tr('vehicle')}:</strong> {trip.carName}</p>
                        <p><strong>{tr('destination')}:</strong> {trip.destination}</p>
                        {/* Status Display and Selector */}
                        <p className="flex items-center gap-2">
                            <strong>{tr('status')}:</strong>
                            <StatusSelector currentStatus={trip.status} onStatusChange={handleStatusChange} />
                            {/* NEW: Clarification for status */}
                            <span className="text-xs text-gray-500 mr-2">({tr('changeStatusOfAggregatedTrip')})</span>
                        </p>
                        <p><strong>{tr('createdBy')}:</strong> {trip.createdBy || 'N/A'}</p>
                        {/* Display Office and Car Expenses */}
                        <p><strong>{tr('officeExpenses')}:</strong> {trip.officeExpenses?.toLocaleString() || 0} {trip.officeExpensesCurrency || 'USD'}</p>
                        <p><strong>{tr('vehicleExpenses')}:</strong> {trip.carExpenses?.toLocaleString() || 0} {trip.carExpensesCurrency || 'USD'}</p>
                        {/* Display additional expenses */}
                        {trip.expense1_name && trip.expense1_value > 0 && (
                            <p><strong>{trip.expense1_name}:</strong> {trip.expense1_value?.toLocaleString() || 0} {trip.expense1_currency || 'USD'}</p>
                        )}
                        {trip.expense2_name && trip.expense2_value > 0 && (
                            <p><strong>{trip.expense2_name}:</strong> {trip.expense2_value?.toLocaleString() || 0} {trip.expense2_currency || 'USD'}</p>
                        )}
                        <p className="col-span-full"><strong>{tr('generalNotes')}:</strong> {trip.notes || tr('none')}</p>
                    </div>
                </div>

                {/* Stations and Mandoubs Section */}
                {trip.stations && trip.stations.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-xl font-semibold">{tr('tripStationsAndDelegates')}</h2>
                            {!isEditingStations ? (
                                <button
                                    onClick={() => setIsEditingStations(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {tr('editCommissionRates')}
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveStations}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        {tr('saveChanges')}
                                    </button>
                                    <button
                                        onClick={handleCancelStationsEdit}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        {tr('cancel')}
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            {(isEditingStations ? editingStations : trip.stations).map((station, index) => {
                                const commissionAmount = calculateStationDriverCommission(station);
                                return (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-600">{tr('station')}</p>
                                                <p className="text-lg font-bold text-gray-900">{station.stationName}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-600">{tr('responsibleDelegate')}</p>
                                                <p className="text-lg font-bold text-blue-600">{station.driverName}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-600">{tr('commissionPercentage')}</p>
                                                {isEditingStations ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={station.commissionPercentage}
                                                            onChange={(e) => handleStationCommissionChange(index, e.target.value)}
                                                            className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            onWheel={(e) => e.target.blur()}
                                                        />
                                                        <span className="text-lg font-bold text-green-600">%</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-lg font-bold text-green-600">{station.commissionPercentage}%</p>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-600">{tr('commissionAmount')}</p>
                                                <p className="text-lg font-bold text-green-600">
                                                    {commissionAmount.toLocaleString()} USD
                                                </p>
                                            </div>
                                        </div>
                                        {station.notes && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <p className="text-sm font-semibold text-gray-600">{tr('notes')}</p>
                                                <p className="text-gray-700">{station.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm font-semibold text-blue-800">
                                {tr('totalShippingAmount')}: {
                                    Object.entries(calculateTotalShippingFees())
                                        .filter(([, amount]) => amount > 0)
                                        .map(([currency, amount]) => `${amount.toLocaleString()} ${currency}`)
                                        .join(' + ') || '0 USD'
                                }
                            </p>
                            {isEditingStations && (
                                <p className="text-sm text-blue-600 mt-2">
                                    {tr('editCommissionRatesTip')}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Financial Summary */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">{tr('financialSummary')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700 text-center">
                        <div>
                            <p className="text-lg font-semibold">{tr('totalCollections')}</p>
                            <p className="text-2xl font-bold text-green-600">{renderTotals(totals.collections)}</p>
                        </div>
                        <div>
                            <p className="text-lg font-semibold">{tr('totalExpenses')}</p>
                            <p className="text-2xl font-bold text-red-600">{renderTotals(totals.expenses)}</p>
                        </div>
                        <div>
                            <p className="text-lg font-semibold">{tr('netProfitLoss')}</p>
                            <p className="text-2xl font-bold text-blue-600">{renderTotals(totals.profit)}</p>
                        </div>
                    </div>
                </div>

                {/* Expense Management Section (for manual updates on existing trip) */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">{tr('expenseManagement')}</h2>
                    
                    {/* Display total shipping fees for reference */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">{tr('shippingFeesSummary')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-gray-600">{tr('totalShippingFeesForCollection')}: </span>
                                <span className="font-semibold text-blue-700">
                                    {Object.entries(calculateTotalShippingFees())
                                        .filter(([, amount]) => amount > 0)
                                        .map(([currency, amount]) => `${amount.toLocaleString()} ${currency}`)
                                        .join(' + ') || '0 USD'}
                                </span>
                            </div>

                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div>
                            <label htmlFor="vehicleRental" className="block text-sm font-medium text-gray-700 mb-1">{tr('vehicleRentalUSD')}</label>
                            <input type="number" id="vehicleRental" name="vehicleRental" value={expenses.vehicleRental} onChange={handleExpenseChange} className="p-2 border rounded-md w-full" />
                        </div>

                        <div className="md:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="expense1_name" className="block text-sm font-medium text-gray-700 mb-1">{tr('additionalExpense1Name')}</label>
                                    <input type="text" id="expense1_name" name="expense1_name" value={expenses.expense1_name} onChange={handleExpenseChange} className="p-2 border rounded-md w-full" />
                                </div>
                                <div>
                                    <label htmlFor="expense1_value" className="block text-sm font-medium text-gray-700 mb-1">{tr('additionalExpense1Value')}</label>
                                    <input type="number" id="expense1_value" name="expense1_value" value={expenses.expense1_value} onChange={handleExpenseChange} className="p-2 border rounded-md w-full" />
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="expense2_name" className="block text-sm font-medium text-gray-700 mb-1">{tr('additionalExpense2Name')}</label>
                                    <input type="text" id="expense2_name" name="expense2_name" value={expenses.expense2_name} onChange={handleExpenseChange} className="p-2 border rounded-md w-full" />
                                </div>
                                <div>
                                    <label htmlFor="expense2_value" className="block text-sm font-medium text-gray-700 mb-1">{tr('additionalExpense2Value')}</label>
                                    <input type="number" id="expense2_value" name="expense2_value" value={expenses.expense2_value} onChange={handleExpenseChange} className="p-2 border rounded-md w-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end mt-6">
                        <button onClick={handleUpdateExpenses} disabled={isUpdatingExpenses} className="bg-indigo-600 text-white font-semibold px-5 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
                            {isUpdatingExpenses ? tr('saving') : tr('saveExpenses')}
                        </button>
                    </div>
                </div>

                {/* Shipments in this Trip */}
                {shipments.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2">{tr('shipmentsInThisTrip')} ({shipments.length})</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right text-gray-600">
                                <thead className="bg-gray-100 text-gray-700 uppercase">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">{tr('shipmentNumber')}</th>
                                        <th scope="col" className="px-4 py-3">{tr('customer')}</th>
                                        <th scope="col" className="px-4 py-3">{tr('phone')}</th>
                                        <th scope="col" className="px-4 py-3">{tr('governorate')}</th>
                                        <th scope="col" className="px-4 py-3">{tr('collectibleAmount')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shipments.map(shipment => (
                                        <tr key={shipment.id} className="border-b hover:bg-gray-50 odd:bg-white even:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{shipment.shipmentId}</td>
                                            <td className="px-4 py-3">{shipment.customerName}</td>
                                            <td className="px-4 py-3">{shipment.recipientPhone}</td>
                                            <td className="px-4 py-3">{shipment.governorate}</td>
                                            <td className="px-4 py-3 font-semibold">{Object.entries(getCollectibleAmount(shipment)).map(([c,v])=>`${v.toLocaleString()} ${c}`).join(' + ')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* NEW: Dispatched Items from Branch Entries in this Trip */}
                {dispatchedBranchItems.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2">{tr('dispatchedItemsFromBranchEntries')} ({dispatchedBranchItems.length})</h2>
                        <div className="overflow-x-auto">
                            {/* Group items by original entry */}
                            {Object.keys(originalEntriesData).map(originalEntryId => {
                                const originalEntry = originalEntriesData[originalEntryId];
                                const itemsFromThisEntry = dispatchedBranchItems.filter(item => item.originalEntryId === originalEntryId);
                                if (itemsFromThisEntry.length === 0) return null; // Don't render if no items for this entry

                                return (
                                    <div key={originalEntryId} className="mb-6 border rounded-md p-4 bg-gray-50">
                                        <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">
                                            {tr('fromEntry')}: {originalEntry?.branchName || 'N/A'} (ID: {originalEntryId.substring(0, 8)}...)
                                            <Link to={`/branch-entries/${originalEntryId}`} className="text-sm text-indigo-600 hover:underline mr-2">
                                                ({tr('viewOriginalEntry')})
                                            </Link>
                                        </h3>
                                        <table className="w-full text-sm text-right text-gray-600">
                                            <thead className="bg-gray-100 text-gray-700 uppercase">
                                                <tr>
                                                    <th scope="col" className="px-4 py-3">{tr('itemNumber')}</th>
                                                    <th scope="col" className="px-4 py-3">{tr('itemDescription')}</th>
                                                    <th scope="col" className="px-4 py-3">{tr('dispatchedAmount')}</th>
                                                    <th scope="col" className="px-4 py-3">{tr('itemValue')}</th>
                                                    <th scope="col" className="px-4 py-3">{tr('currency')}</th>
                                                    <th scope="col" className="px-4 py-3">{tr('recipientName')}</th>
                                                    <th scope="col" className="px-4 py-3">{tr('destinationGovernorate')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {itemsFromThisEntry.map((item, itemIndex) => (
                                                    <tr key={item.originalEntryId + '-' + item.originalItemOrderIndex} className="border-b hover:bg-gray-50 odd:bg-white even:bg-gray-50">
                                                        <td className="px-4 py-3">{item.originalItemOrderIndex + 1}</td>
                                                        <td className="px-4 py-3">{item.itemDescription}</td>
                                                        <td className="px-4 py-3">{item.dispatchedAmount}</td>
                                                        <td className="px-4 py-3">{item.itemValue?.toLocaleString()}</td>
                                                        <td className="px-4 py-3">{item.itemCurrency}</td>
                                                        <td className="px-4 py-3">{item.recipientName || 'N/A'}</td>
                                                        <td className="px-4 py-3">{item.destinationGovernorate || 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Print Receipt Modal */}
            {showPrintReceipt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold">{tr('printTripReceipt')}</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        const printWindow = window.open('', '_blank');
                                        const receiptContent = document.getElementById('print-receipt-content');
                                        printWindow.document.write(`
                                            <html>
                                                <head>
                                                    <title>${tr('printTripReceipt')} - ${trip.tripName || trip.carName}</title>
                                                    <style>
                                                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                                                        @media print {
                                                            body { margin: 0; }
                                                            .no-print { display: none; }
                                                        }
                                                    </style>
                                                </head>
                                                <body>
                                                    ${receiptContent.innerHTML}
                                                </body>
                                            </html>
                                        `);
                                        printWindow.document.close();
                                        printWindow.focus();
                                        printWindow.print();
                                        printWindow.close();
                                    }}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                >
                                    {tr('print')}
                                </button>
                                <button
                                    onClick={() => setShowPrintReceipt(false)}
                                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                                >
                                    {tr('close')}
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <div id="print-receipt-content">
                                <TripPrintReceipt 
                                    trip={trip}
                                    shipments={shipments}
                                    dispatchedBranchItems={dispatchedBranchItems}
                                    totals={totals}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
