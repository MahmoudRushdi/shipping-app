import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, documentId, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { format } from 'date-fns';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PrinterIcon, DownloadIcon } from '../components/Icons';

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
  const [trip, setTrip] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // --- 1. REMOVED 'other' from expenses state ---
  const [expenses, setExpenses] = useState({ vehicleRental: 0, driverCommissionValue: 0, driverCommissionType: 'percentage' });
  const [totals, setTotals] = useState({ collections: {}, expenses: {}, profit: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tripId = window.location.pathname.split('/')[2];

  useEffect(() => {
    if (!tripId) {
      setError("Trip ID not found.");
      setIsLoading(false);
      return;
    }

    const fetchTripData = async () => {
      setIsLoading(true);
      try {
        const tripRef = doc(db, 'trips', tripId);
        const tripSnap = await getDoc(tripRef);

        if (!tripSnap.exists()) {
          setError("Trip not found.");
          return;
        }

        const tripData = { id: tripSnap.id, ...tripSnap.data() };
        setTrip(tripData);
        if (tripData.expenses) {
            setExpenses({
                vehicleRental: tripData.expenses.vehicleRental || 0,
                driverCommissionValue: tripData.expenses.driverCommissionValue || 0,
                driverCommissionType: tripData.expenses.driverCommissionType || 'percentage',
                // other: tripData.expenses.other || 0, // <-- REMOVED
            });
        }

        if (tripData.shipmentIds && tripData.shipmentIds.length > 0) {
          const shipmentsQuery = query(collection(db, 'shipments'), where(documentId(), 'in', tripData.shipmentIds));
          const shipmentsSnap = await getDocs(shipmentsQuery);
          const shipmentsList = shipmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setShipments(shipmentsList);
        }
      } catch (err) {
        console.error("Error fetching trip data:", err);
        setError("Failed to fetch trip data.");
      }
      setIsLoading(false);
    };

    fetchTripData();
  }, [tripId]);
  
  useEffect(() => {
    if (shipments.length === 0 && !trip) return;

    const collectionsByCurrency = {};
    shipments.forEach(shipment => {
        const shipmentTotals = getCollectibleAmount(shipment);
        for (const currency in shipmentTotals) {
            collectionsByCurrency[currency] = (collectionsByCurrency[currency] || 0) + shipmentTotals[currency];
        }
    });

    const expensesByCurrency = {};
    // --- 2. REMOVED 'other' from calculation ---
    const fixedExpenses = parseFloat(expenses.vehicleRental) || 0;
    if (fixedExpenses > 0) {
        expensesByCurrency['USD'] = (expensesByCurrency['USD'] || 0) + fixedExpenses;
    }

    if (expenses.driverCommissionType === 'fixed') {
        expensesByCurrency['USD'] = (expensesByCurrency['USD'] || 0) + (parseFloat(expenses.driverCommissionValue) || 0);
    } else {
        const commissionRate = (parseFloat(expenses.driverCommissionValue) || 0) / 100;
        for (const currency in collectionsByCurrency) {
            const commission = collectionsByCurrency[currency] * commissionRate;
            expensesByCurrency[currency] = (expensesByCurrency[currency] || 0) + commission;
        }
    }
    
    const profitByCurrency = {};
    const allCurrencies = new Set([...Object.keys(collectionsByCurrency), ...Object.keys(expensesByCurrency)]);
    allCurrencies.forEach(currency => {
        const collection = collectionsByCurrency[currency] || 0;
        const expense = expensesByCurrency[currency] || 0;
        profitByCurrency[currency] = collection - expense;
    });

    setTotals({
        collections: collectionsByCurrency,
        expenses: expensesByCurrency,
        profit: profitByCurrency
    });

  }, [shipments, expenses, trip]);


  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setExpenses(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateExpenses = async () => {
    setIsSubmitting(true);
    const tripRef = doc(db, 'trips', tripId);
    try {
        await updateDoc(tripRef, {
            expenses: {
                vehicleRental: parseFloat(expenses.vehicleRental) || 0,
                driverCommissionValue: parseFloat(expenses.driverCommissionValue) || 0,
                driverCommissionType: expenses.driverCommissionType,
                // other: parseFloat(expenses.other) || 0, // <-- REMOVED
            }
        });
        alert("تم تحديث المصاريف بنجاح!");
    } catch (error) {
        console.error("Error updating expenses:", error);
        alert("حدث خطأ أثناء تحديث المصاريف.");
    }
    setIsSubmitting(false);
  };

  const renderTotals = (data) => {
    if (Object.keys(data).length > 0) {
        return Object.entries(data).map(([currency, value]) => (
            <p key={currency} className="truncate">{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</p>
        ));
    }
    return <p>0.00</p>;
  };

  const handlePrintTrip = () => {
    const printWindow = window.open('', '_blank');
    const totalsToHTML = (data) => Object.entries(data).map(([key, val]) => `<p style="margin: 0;"><strong>${key}:</strong> ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>`).join('');

    printWindow.document.write(`<html><head><title>بيان رحلة - ${trip.carName}</title><style>@media print { @page { size: A4 landscape; margin: 10mm; } } body { direction: rtl; font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 10pt; } table { width: 100%; border-collapse: collapse; margin-top: 10px; } th, td { border: 1px solid #ddd; padding: 6px; text-align: right; } th { background-color: #f2f2f2; } h1, h2 { border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 0; } .print-container::after { content: ""; clear: both; display: table; } .left-col { float: right; width: 30%; box-sizing: border-box; padding-left: 20px; } .right-col { float: right; width: 70%; box-sizing: border-box; } .summary { padding: 10px; border: 1px solid #ddd; background: #f9f9f9; }</style></head><body><h1>بيان رحلة لـ: ${trip.carName}</h1><p>تاريخ الإنشاء: ${trip?.createdAt ? format(trip.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A'}</p><div class="print-container"><div class="left-col"><div class="summary"><h2>الملخص المالي</h2><div><b>إجمالي التحصيلات:</b>${totalsToHTML(totals.collections)}</div><hr><div><b>إجمالي المصاريف:</b>${totalsToHTML(totals.expenses)}</div><hr><div><b>صافي الربح:</b>${totalsToHTML(totals.profit)}</div></div></div><div class="right-col"><h2>شحنات الرحلة (${shipments.length})</h2><table><thead><tr><th>رقم الشحنة</th><th>العميل</th><th>المحافظة</th><th>المبلغ المحصل</th></tr></thead><tbody>${shipments.map(s => `<tr><td>${s.shipmentId}</td><td>${s.customerName}</td><td>${s.governorate}</td><td>${Object.entries(getCollectibleAmount(s)).map(([c,v])=>`${v.toLocaleString()} ${c}`).join(' + ')}</td></tr>`).join('')}</tbody></table></div></div></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportTrip = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.rtl = true;

    const detailsSheet = workbook.addWorksheet('تفاصيل الشحنات');
    const summarySheet = workbook.addWorksheet('ملخص الرحلة');
    
    const headerStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } }, alignment: { horizontal: 'center' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } };
    const cellStyle = { alignment: { horizontal: 'center', vertical: 'middle' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }};
    
    detailsSheet.columns = [
        { header: 'رقم الشحنة', key: 'id', width: 20 },
        { header: 'الحالة', key: 'status', width: 25 },
        { header: 'اسم العميل', key: 'customer', width: 25 },
        { header: 'هاتف المستلم', key: 'phone', width: 20 },
        { header: 'المحافظة', key: 'gov', width: 20 },
        { header: 'اسم المرسل', key: 'senderName', width: 25 },
        { header: 'هاتف المرسل', key: 'senderPhone', width: 20 },
        { header: 'نوع الطرد', key: 'parcelType', width: 15 },
        { header: 'عدد الطرود', key: 'parcelCount', width: 15 },
        { header: 'المبلغ المحصل', key: 'amount', width: 25 },
    ];
    detailsSheet.getRow(1).eachCell(cell => cell.style = headerStyle);
    
    shipments.forEach(s => {
        const amountString = Object.entries(getCollectibleAmount(s)).map(([c,v])=>`${v.toLocaleString()} ${c}`).join(' + ');
        detailsSheet.addRow({ id: s.shipmentId, status: s.status, customer: s.customerName, phone: s.recipientPhone, gov: s.governorate, senderName: s.senderName, senderPhone: s.senderPhone, parcelType: s.parcelType, parcelCount: s.parcelCount, amount: amountString });
    });
    detailsSheet.eachRow({ includeEmpty: false }, row => row.eachCell(cell => { if (!cell.style.font) cell.style = cellStyle; }));

    const titleStyle = { font: { bold: true, size: 16, color: { argb: 'FF4F81BD' } }, alignment: { horizontal: 'center' } };
    const moneyFormat = '#,##0.00';
    
    summarySheet.mergeCells('A1:C1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = `تقرير الرحلة لـ: ${trip.carName}`;
    titleCell.style = titleStyle;
    
    summarySheet.addRow([]);
    
    summarySheet.mergeCells('A3:C3');
    const financialHeader = summarySheet.getCell('A3');
    financialHeader.value = 'الملخص المالي';
    financialHeader.style = headerStyle;

    Object.entries(totals.collections).forEach(([key, val]) => {
        const row = summarySheet.addRow([`إجمالي التحصيلات (${key})`, val]);
        row.getCell(2).numFmt = moneyFormat;
    });
    Object.entries(totals.expenses).forEach(([key, val]) => {
        const row = summarySheet.addRow([`إجمالي المصاريف (${key})`, val]);
        row.getCell(2).numFmt = moneyFormat;
    });
     Object.entries(totals.profit).forEach(([key, val]) => {
        const row = summarySheet.addRow([`صافي الربح (${key})`, val]);
        row.getCell(2).numFmt = moneyFormat;
    });

    summarySheet.columns = [{ width: 30 }, { width: 20 }];
    summarySheet.eachRow(row => row.eachCell(cell => { if (!cell.style.font) cell.style = cellStyle; }));
    
    workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `Trip_${trip.carName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    });
  };

  if (isLoading) return <div className="text-center p-10">جاري تحميل تفاصيل الرحلة...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen p-8 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">تفاصيل الرحلة: {trip?.carName}</h1>
                <p className="text-gray-500">تاريخ الإنشاء: {trip?.createdAt ? format(trip.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A'}</p>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={handlePrintTrip} className="flex items-center gap-2 bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-gray-700"><PrinterIcon/> طباعة</button>
                <button onClick={handleExportTrip} className="flex items-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-green-700"><DownloadIcon/> تصدير Excel</button>
                <a href="/trips" className="text-sm text-indigo-600 hover:underline self-end">→ العودة إلى قائمة الرحلات</a>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-md text-center">
                <h3 className="text-lg font-semibold text-gray-500">إجمالي التحصيلات</h3>
                <div className="text-2xl font-bold text-gray-800 mt-2 space-y-1">{renderTotals(totals.collections)}</div>
            </div>
             <div className="bg-white p-4 rounded-lg shadow-md text-center">
                <h3 className="text-lg font-semibold text-gray-500">إجمالي المصاريف</h3>
                <div className="text-2xl font-bold text-red-500 mt-2 space-y-1">{renderTotals(totals.expenses)}</div>
            </div>
             <div className="bg-green-100 p-4 rounded-lg shadow-md text-center">
                <h3 className="text-lg font-semibold text-green-800">صافي الربح</h3>
                <div className="text-2xl font-bold text-green-700 mt-2 space-y-1">{renderTotals(totals.profit)}</div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">إدارة مصاريف الرحلة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">تكلفة استئجار المركبة (بالدولار)</label>
                        <input type="number" name="vehicleRental" value={expenses.vehicleRental} onChange={handleExpenseChange} className="mt-1 p-2 w-full border rounded-md" placeholder="e.g., 100" />
                    </div>
                    {/* --- 3. REMOVED the "Other Expenses" input field --- */}
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">عمولة السائق</label>
                        <div className="flex gap-2 mt-1">
                            <select name="driverCommissionType" value={expenses.driverCommissionType} onChange={handleExpenseChange} className="p-2 border rounded-md bg-white">
                                <option value="percentage">نسبة مئوية (%)</option>
                                <option value="fixed">مبلغ ثابت (بالدولار)</option>
                            </select>
                            <input type="number" name="driverCommissionValue" value={expenses.driverCommissionValue} onChange={handleExpenseChange} className="p-2 w-full border rounded-md" placeholder="e.g., 10 or 150" />
                        </div>
                    </div>
                     <div className="pt-5">
                         <button onClick={handleUpdateExpenses} disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                             {isSubmitting ? 'جاري الحفظ...' : 'حفظ المصاريف'}
                         </button>
                     </div>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">الشحنات في هذه الرحلة ({shipments.length})</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3">رقم الشحنة</th>
                            <th className="p-3">العميل</th>
                            <th className="p-3">الهاتف</th>
                            <th className="p-3">المحافظة</th>
                            <th className="p-3">المبلغ المحصل</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shipments.map(shipment => (
                            <tr key={shipment.id} className="border-b">
                                <td className="p-3 font-medium">{shipment.shipmentId}</td>
                                <td className="p-3">{shipment.customerName}</td>
                                <td className="p-3">{shipment.recipientPhone}</td>
                                <td className="p-3">{shipment.governorate}</td>
                                <td className="p-3 font-semibold">{Object.entries(getCollectibleAmount(shipment)).map(([c,v])=>`${v.toLocaleString()} ${c}`).join(' + ')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}