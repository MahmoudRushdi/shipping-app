import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { PlusCircleIcon, SearchIcon, LogoutIcon, LinkIcon, ClipboardIcon, DownloadIcon, UserCogIcon, ClipboardListIcon, TrashIcon, PrinterIcon } from '../components/Icons';
import StatusSelector from '../components/StatusSelector';
import AddShipmentModal from '../components/AddShipmentModal';
import RoutesManager from '../components/RoutesManager';
import logo from '../assets/AL-MOSTAKEM-1.png';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';


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

    if (shipment.hwalaFeePaymentMethod === 'collect') {
        const hwalaVal = parseFloat(shipment.hwalaFee) || 0;
        if (hwalaVal > 0) {
            const currency = shipment.hwalaFeeCurrency || 'USD';
            totals[currency] = (totals[currency] || 0) + hwalaVal;
        }
    }

    const totalStrings = Object.entries(totals).map(([currency, amount]) => {
        if (currency === 'undefined') return null;
        return `${amount.toLocaleString()} ${currency}`;
    });

    return totalStrings.filter(Boolean).join(' + ') || '0 USD';
};


export default function ShipmentsDashboard({ user, role }) {
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    setIsLoading(true);
    const shipmentsCollection = collection(db, 'shipments');
    const q = query(shipmentsCollection);
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

  const handleStatusChange = async (shipmentId, newStatus) => {
    const shipmentRef = doc(db, 'shipments', shipmentId);
    try {
        await updateDoc(shipmentRef, { status: newStatus });
    } catch (error) {
        console.error("Error updating status: ", error);
        alert("حدث خطأ أثناء تحديث الحالة.");
    }
  };

  const handleDeleteShipment = async (shipmentId) => {
    if (window.confirm("هل أنت متأكد من أنك تريد حذف هذه الشحنة بشكل نهائي؟")) {
      try {
        await deleteDoc(doc(db, 'shipments', shipmentId));
      } catch (error) {
        console.error("Error deleting shipment: ", error);
        alert("حدث خطأ أثناء حذف الشحنة.");
      }
    }
  };

  const handleCopyLink = (shipmentId) => {
      const link = `${window.location.origin}/track/${shipmentId}`;
      navigator.clipboard.writeText(link).then(() => {
          setCopySuccess(shipmentId);
          setTimeout(() => setCopySuccess(''), 2000);
      }, (err) => {
          console.error('Failed to copy: ', err);
          alert('فشل نسخ الرابط');
      });
  };

  const filteredShipments = shipments.filter(shipment =>
     (shipment.shipmentId && shipment.shipmentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
     (shipment.customerName && shipment.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
     (shipment.courierName && shipment.courierName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleLogout = async () => {
      await signOut(auth);
  };

    const handleExport = async () => {
        const workbook = new ExcelJS.Workbook();
        
        const detailsSheet = workbook.addWorksheet('تفاصيل الشحنات (Details)');

        const headers = [
            { header: 'رقم الشحنة', key: 'shipmentId', width: 15 },
            { header: 'الحالة', key: 'status', width: 25 },
            { header: 'التاريخ', key: 'date', width: 15 },
            { header: 'اسم العميل', key: 'customerName', width: 20 },
            { header: 'هاتف المستلم', key: 'recipientPhone', width: 20 },
            { header: 'اسم المرسل', key: 'senderName', width: 20 },
            { header: 'هاتف المرسل', key: 'senderPhone', width: 20 },
            { header: 'المحافظة', key: 'governorate', width: 15 },
            { header: 'السيارة', key: 'assignedCar', width: 15 },
            { header: 'قيمة البضاعة', key: 'goodsValue', width: 15 },
            { header: 'عملة البضاعة', key: 'goodsCurrency', width: 15 },
            { header: 'ملاحظات', key: 'notes', width: 30 },
        ];
        
        detailsSheet.columns = headers;

        const headerRow = detailsSheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
        
        const dataToExport = filteredShipments.map(shipment => ({
            shipmentId: shipment.shipmentId,
            status: shipment.status,
            date: shipment.date,
            customerName: shipment.customerName,
            recipientPhone: shipment.recipientPhone,
            senderName: shipment.senderName,
            senderPhone: shipment.senderPhone,
            governorate: shipment.governorate,
            assignedCar: shipment.assignedCar,
            goodsValue: shipment.goodsValue || 0,
            goodsCurrency: shipment.goodsCurrency,
            notes: shipment.notes
        }));

        dataToExport.forEach(item => {
            const row = detailsSheet.addRow(item);
            row.eachCell((cell) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        const summarySheet = workbook.addWorksheet('ملخص التقرير (Summary)');
        const summary = {
            totalShipments: filteredShipments.length,
            goodsValueByCurrency: {},
        };
        filteredShipments.forEach(shipment => {
            const goodsValue = parseFloat(shipment.goodsValue) || 0;
            if (goodsValue > 0) {
                const currency = shipment.goodsCurrency || 'N/A';
                summary.goodsValueByCurrency[currency] = (summary.goodsValueByCurrency[currency] || 0) + goodsValue;
            }
        });

        summarySheet.addRow(['البيان', 'القيمة']).eachCell(cell => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center' };
        });
        summarySheet.addRow(['إجمالي عدد الشحنات', summary.totalShipments]);
        summarySheet.addRow([]); 
        summarySheet.addRow(['إجمالي قيمة البضائع حسب العملة']);
        Object.entries(summary.goodsValueByCurrency).forEach(([currency, value]) => {
            summarySheet.addRow([`قيمة البضائع (${currency})`, value]);
        });

        summarySheet.columns = [{ width: 40 }, { width: 20 }];
        summarySheet.eachRow(row => {
            row.eachCell(cell => {
                cell.alignment = { horizontal: 'center' };
            });
        });
        
        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const today = new Date().toISOString().split('T')[0];
            saveAs(blob, `تقرير_الشحنات_${today}.xlsx`);
        });
    };

  const handlePrintPolicy = (shipment) => {
    const trackingUrl = `${window.location.origin}/track/${shipment.shipmentId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingUrl)}`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>بوليصة شحن - ${shipment.shipmentId}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    body {
                        font-family: 'Cairo', sans-serif;
                        direction: rtl;
                        font-size: 10pt;
                        color: #000;
                        margin: 0;
                        padding: 0;
                        background-color: #f0f0f0;
                    }
                    @page {
                        size: A5 landscape;
                        margin: 0;
                    }
                    .controls {
                        position: fixed;
                        top: 20px;
                        left: 20px;
                        z-index: 100;
                        background: white;
                        padding: 10px;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.5);
                        text-align: center;
                    }
                    .controls button {
                        background-color: #007bff;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        font-family: 'Cairo', sans-serif;
                        font-size: 14px;
                        border-radius: 5px;
                        cursor: pointer;
                        display: block;
                        width: 100%;
                    }
                    .controls button:hover {
                        background-color: #0056b3;
                    }
                    .a5-reminder {
                        font-size: 11px;
                        color: #555;
                        margin-top: 8px;
                        padding: 5px;
                        background: #fdfde1;
                        border: 1px solid #e7e7a3;
                        border-radius: 4px;
                    }
                    .invoice-box {
                        width: 210mm;
                        height: 148mm;
                        padding: 7mm;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        margin: 20px auto;
                        background: white;
                        box-shadow: 0 0 10px rgba(0,0,0,0.3);
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 2px solid #000;
                        padding-bottom: 5px;
                        margin-bottom: 10px;
                    }
                    .header .logo { max-width: 140px; }
                    .header .company-title h2 { margin: 0; font-size: 16pt; }
                    .header .company-title p { margin: 0; font-size: 8pt; }
                    .header .policy-info { font-size: 10pt; font-weight: bold; }
                    .policy-info div { background-color: #f2f2f2; border: 1px solid #ccc; padding: 5px; margin-top: 2px; }

                    .main-content {
                        display: flex;
                        gap: 15px;
                    }
                    .left-column, .right-column {
                        flex: 1;
                    }
                    .details-section {
                        border: 1px solid #ccc;
                        padding: 10px;
                        border-radius: 5px;
                        margin-bottom: 15px;
                    }
                    .details-section .field { display: flex; font-size: 10pt; margin-bottom: 8px; }
                    .details-section .field strong { min-width: 80px; }
                    .details-section .field span { border-bottom: 1px dotted #888; flex-grow: 1; padding-right: 5px; }
                    
                    .notes-section {
                        border: 1px solid #ccc;
                        padding: 5px;
                        border-radius: 5px;
                    }
                    .notes-section strong { font-size: 10pt; }
                    .notes-section p { margin: 0; font-size: 9pt; min-height: 25px; }

                    .financial-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
                    .financial-table th, .financial-table td { border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; }
                    .financial-table th { background-color: #f2f2f2; }
                    
                    .footer {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        border-top: 1px solid #ccc;
                        padding-top: 10px;
                        margin-top: 40px;
                    }
                    .footer .qr-code { text-align: center; }
                    .footer .qr-code img { width: 80px; height: 80px; }
                    .footer .signature-box { text-align: right; font-size: 8pt; }
                    .footer .signature-box .terms { font-weight: bold; }
                    .footer .signature-box .signature-line { margin-top: 20px; font-weight: bold; }

                     @media print {
                        body { background-color: white; }
                        .controls { display: none; }
                        .invoice-box { margin: 0; box-shadow: none; width: 100%; height: 100%; }
                        @page { size: A5 landscape; margin: 7mm; }
                    }
                </style>
            </head>
            <body>
                <div class="controls">
                    <button onclick="window.print()">طباعة</button>
                    <div class="a5-reminder">
                        <strong>ملاحظة:</strong> تأكد من اختيار حجم الورق A5 والاتجاه الأفقي (Landscape) في إعدادات الطابعة.
                    </div>
                </div>

                <div class="invoice-box">
                    <div class="header">
                        <div class="company-title"><h2>شركة المستقيم</h2><p>للنقل السريع والشحن الدولي</p></div>
                        <img src="${logo}" class="logo" alt="شعار الشركة" />
                        <div class="policy-info">
                            <div>البوليصة: ${shipment.shipmentId}</div>
                            <div>التاريخ: ${shipment.date}</div>
                        </div>
                    </div>
                    
                    <div class="main-content">
                        <div class="left-column">
                            <div class="details-section">
                                <div class="field"><strong>المرسل:</strong> <span>${shipment.senderName}</span></div>
                                <div class="field"><strong>هاتف المرسل:</strong> <span>${shipment.senderPhone}</span></div>
                                <div class="field"><strong>المرسل إليه:</strong> <span>${shipment.customerName}</span></div>
                                <div class="field"><strong>هاتف المستلم:</strong> <span>${shipment.recipientPhone}</span></div>
                                <div class="field"><strong>العنوان:</strong> <span>${shipment.governorate}</span></div>
                            </div>
                            <div class="notes-section">
                                <strong>ملاحظات:</strong>
                                <p>${shipment.notes || 'لا يوجد'}</p>
                            </div>
                        </div>

                        <div class="right-column">
                            <table class="financial-table">
                                <thead>
                                    <tr>
                                        <th>نوع البضاعة</th>
                                        <th>الوزن</th>
                                        <th>عدد الطرود</th>
                                        <th>قيمة البضاعة</th>
                                        <th>المبلغ المحصل</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>${shipment.parcelType || '-'}</td>
                                        <td>${shipment.weight || 0} كغ</td>
                                        <td>${shipment.parcelCount}</td>
                                        <td>${shipment.goodsValue || 0} ${shipment.goodsCurrency}</td>
                                        <td style="font-size: 10pt;">${formatMultiCurrency(shipment)}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div class="footer">
                                <div class="qr-code"><img src="${qrCodeUrl}" alt="QR Code" /></div>
                                <div class="signature-box">
                                   <p class="terms">أقر بقراءة وفهم شروط الشحن والتسليم والموافقة عليها.</p>
                                   <p class="signature-line">اسم المستلم والتوقيع: ..........................</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
  };


  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans" dir="rtl">
      <div className="max-w-full mx-auto">
         <div className="text-center mb-8">
          <img src={logo} alt="شعار الشركة" className="mx-auto h-44 w-auto" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mt-4">لوحة تحكم الشحنات</h1>
          <p className="mt-2 text-gray-500">مرحباً، {user.displayName || user.email}</p>
        </div>

        <div className="text-center mb-6">
            <a href="/" className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm">
                &larr; العودة إلى القائمة الرئيسية
            </a>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                <input
                  type="text"
                  placeholder="ابحث برقم الشحنة، اسم العميل، أو المندوب..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
                <a href="/trips" className="flex items-center gap-2 bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-purple-700 transition-colors duration-200">
                    <ClipboardListIcon />
                    <span>إدارة الرحلات</span>
                </a>
                <a href="/manifests" className="flex items-center gap-2 bg-orange-500 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-orange-600 transition-colors duration-200">
                    <ClipboardListIcon />
                    <span>إنشاء رحلة</span>
                </a>
                {role === 'admin' && (
                  <a href="/admin" className="flex items-center gap-2 bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-gray-800 transition-colors duration-200">
                    <UserCogIcon />
                    <span>إدارة المستخدمين</span>
                  </a>
                )}
                <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200"><DownloadIcon /><span>تصدير Excel</span></button>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200"><PlusCircleIcon /><span>شحنة جديدة</span></button>
                <button onClick={handleLogout} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors" title="تسجيل الخروج"><LogoutIcon /></button>
            </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {isLoading ? (
                <div className="p-10 text-center text-gray-500">جاري تحميل الشحنات...</div>
            ) : (
                <>
                    <div className="md:hidden">
                        <div className="p-4 space-y-4 bg-gray-50">
                            {filteredShipments.map((shipment) => (
                                <div key={shipment.id} className="bg-white p-4 rounded-lg shadow">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-indigo-600">{shipment.shipmentId}</span>
                                        <span className="text-sm text-gray-500">{shipment.date}</span>
                                    </div>
                                    <div className="mb-3">
                                        <p className="font-semibold">{shipment.customerName}</p>
                                        <p className="text-sm text-gray-600">{shipment.governorate}</p>
                                    </div>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-semibold text-gray-700">المبلغ: {formatMultiCurrency(shipment)}</span>
                                        <StatusSelector currentStatus={shipment.status} onStatusChange={(newStatus) => handleStatusChange(shipment.id, newStatus)} />
                                    </div>
                                    <div className="flex items-center justify-end gap-3 border-t pt-3 mt-3">
                                         <button onClick={() => handlePrintPolicy(shipment)} className="text-gray-500 hover:text-blue-600" title="طباعة البوليصة"><PrinterIcon /></button>
                                         <button onClick={() => handleCopyLink(shipment.shipmentId)} className="text-gray-500 hover:text-indigo-600" title="نسخ رابط التتبع"><LinkIcon /></button>
                                         <button onClick={() => handleDeleteShipment(shipment.id)} className="text-red-500 hover:text-red-700" title="حذف الشحنة"><TrashIcon /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm text-right text-gray-600">
                            <thead className="bg-gray-100 text-gray-700 uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">رقم الشحنة</th>
                                    <th className="p-4">العميل</th>
                                    <th className="p-4">المحافظة</th>
                                    <th className="p-4">قيمة البضاعة</th>
                                    <th className="p-4">المبلغ المحصل</th>
                                    <th className="p-4">التاريخ</th>
                                    <th className="p-4">الحالة</th>
                                    <th className="p-4">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredShipments.map((shipment) => (
                                <tr key={shipment.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-900">{shipment.shipmentId}</td>
                                    <td className="p-4">{shipment.customerName}</td>
                                    <td className="p-4">{shipment.governorate}</td>
                                    <td className="p-4">{`${shipment.goodsValue || 0} ${shipment.goodsCurrency || ''}`}</td>
                                    <td className="p-4 font-semibold">{formatMultiCurrency(shipment)}</td>
                                    <td className="p-4">{shipment.date}</td>
                                    <td className="p-4"><StatusSelector currentStatus={shipment.status} onStatusChange={(newStatus) => handleStatusChange(shipment.id, newStatus)}/></td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handlePrintPolicy(shipment)} className="text-gray-500 hover:text-blue-600" title="طباعة البوليصة"><PrinterIcon /></button>
                                            <button onClick={() => handleCopyLink(shipment.shipmentId)} className="text-gray-500 hover:text-indigo-600" title="نسخ رابط التتبع"><LinkIcon /></button>
                                            <button onClick={() => handleDeleteShipment(shipment.id)} className="text-red-500 hover:text-red-700" title="حذف الشحنة"><TrashIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            {filteredShipments.length === 0 && !isLoading && (<div className="text-center py-10"><p className="text-gray-500">لا توجد شحنات. قم بإضافة شحنة جديدة.</p></div>)}
        </div>
      </div>
             <div className="mt-12">
        <RoutesManager />
      </div>
      {isModalOpen && <AddShipmentModal closeModal={() => setIsModalOpen(false)} />}
    </div>
  );
}