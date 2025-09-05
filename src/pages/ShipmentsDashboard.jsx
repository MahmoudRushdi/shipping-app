import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { PlusCircleIcon, SearchIcon, LogoutIcon, LinkIcon, ClipboardIcon, DownloadIcon, UserCogIcon, ClipboardListIcon, TrashIcon, PrinterIcon, Menu } from '../components/Icons';
import StatusSelector from '../components/StatusSelector';
import AddShipmentModal from '../components/AddShipmentModal';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedStats from '../components/AnimatedStats';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedLoader from '../components/AnimatedLoader';
import Sidebar from '../components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Truck, 
  DollarSign, 
  TrendingUp, 
  Users, 
  MapPin,
  Calendar,
  Clock,
  Building,
  Route,
  BookOpen,
  CreditCard,
  ArrowLeftRight
} from 'lucide-react';

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

    if (shipment.hwalaFeePaymentMethod === 'collect') {
        const hwalaVal = parseFloat(shipment.hwalaFee) || 0;
        if (hwalaVal > 0) {
            const currency = shipment.hwalaFeeCurrency || 'USD';
            totals[currency] = (totals[currency] || 0) + hwalaVal;
        }
    }

    // إضافة الرسوم المخصصة
    const customFee1Val = parseFloat(shipment.customFee1Amount) || 0;
    if (customFee1Val > 0 && shipment.customFee1Name && shipment.customFee1Name.trim()) {
        const currency = shipment.customFee1Currency || 'USD';
        totals[currency] = (totals[currency] || 0) + customFee1Val;
    }

    const customFee2Val = parseFloat(shipment.customFee2Amount) || 0;
    if (customFee2Val > 0 && shipment.customFee2Name && shipment.customFee2Name.trim()) {
        const currency = shipment.customFee2Currency || 'USD';
        totals[currency] = (totals[currency] || 0) + customFee2Val;
    }

    const totalStrings = Object.entries(totals).map(([currency, amount]) => {
        if (currency === 'undefined') return null;
        return `${amount.toLocaleString()} ${currency}`;
    });

    return totalStrings.filter(Boolean).join(' + ') || '0 USD';
};

export default function ShipmentsDashboard({ user, role }) {
  const navigate = useNavigate();
  const { language, tr, isRTL } = useLanguage();
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [selectedView, setSelectedView] = useState('all');
  // Sidebar local state (reverted to original layout with Sidebar)

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



  const handleStatusChange = async (shipmentId, newStatus) => {
    const shipmentRef = doc(db, 'shipments', shipmentId);
    try {
        // Convert English status to Arabic if needed
        let statusToUpdate = newStatus;
        if (newStatus === 'pending') statusToUpdate = 'معلق';
        if (newStatus === 'in-transit') statusToUpdate = 'قيد النقل';
        if (newStatus === 'delivered') statusToUpdate = 'تم التسليم';
        
        await updateDoc(shipmentRef, { status: statusToUpdate });
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
      const tempInput = document.createElement('input');
      document.body.appendChild(tempInput);
      tempInput.value = link;
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);

      setCopySuccess(shipmentId);
      setTimeout(() => setCopySuccess(''), 2000);
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = (shipment.shipmentId && shipment.shipmentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (shipment.customerName && shipment.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (shipment.courierName && shipment.courierName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (selectedView === 'all') return matchesSearch;
    if (selectedView === 'pending') return matchesSearch && (shipment.status === 'pending' || shipment.status ===
       'معلق');
    if (selectedView === 'in-transit') return matchesSearch && (shipment.status === 'in-transit' || shipment.status === 'قيد النقل');
    if (selectedView === 'delivered') return matchesSearch && (shipment.status === 'delivered' || shipment.status === 'تم التسليم');
    
    return matchesSearch;
  });

  const handleLogout = async () => {
      await signOut(auth);
  };

  // Calculate statistics - always calculate from all shipments regardless of selectedView
  const stats = {
    totalShipments: shipments.length,
    pendingShipments: shipments.filter(s => s.status === 'معلق' || s.status === 'pending').length,
    inTransitShipments: shipments.filter(s => s.status === 'قيد النقل' || s.status === 'in-transit').length,
    deliveredShipments: shipments.filter(s => s.status === 'تم التسليم' || s.status === 'delivered').length,
    totalValue: shipments.reduce((sum, s) => sum + (parseFloat(s.goodsValue) || 0), 0)
  };
  


  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const moneyFormat = '#,##0.00';
    const headerStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } }, alignment: { horizontal: 'center', vertical: 'middle' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } };

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
      { header: 'أجور الحوالة', key: 'hwalaFee', width: 15, style: { numFmt: moneyFormat } }, 
      { header: 'عملة الحوالة', key: 'hwalaFeeCurrency', width: 12 }, 
      { header: 'دفع الحوالة', key: 'hwalaFeePaymentMethod', width: 15 }, 
      { header: 'أجور المحول', key: 'internalTransferFee', width: 15, style: { numFmt: moneyFormat } }, 
      { header: 'عملة المحول', key: 'internalTransferFeeCurrency', width: 12 }, 
      { header: 'المبلغ الإجمالي المحصل', key: 'collectibleAmount', width: 25 }, 
      { header: 'ملاحظات', key: 'notes', width: 30 },
    ];
    // Add column headers
    const headers = [
      'رقم الشحنة', 'الحالة', 'التاريخ', 'اسم المستلم', 'هاتف المستلم', 'اسم المرسل', 'هاتف المرسل', 
      'المحافظة', 'السيارة', 'قيمة البضاعة', 'عملة البضاعة', 'أجور الشحن', 'عملة الشحن', 'دفع الشحن',
      'أجور الحوالة', 'عملة الحوالة', 'دفع الحوالة', 'أجور المحول', 'عملة المحول', 'المبلغ الإجمالي المحصل', 'ملاحظات'
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
        hwalaFee: parseFloat(shipment.hwalaFee) || 0,
        internalTransferFee: parseFloat(shipment.internalTransferFee) || 0,
        shippingFeePaymentMethod: shipment.shippingFeePaymentMethod === 'collect' ? 'تحصيل' : 'مدفوع مسبقاً',
        hwalaFeePaymentMethod: shipment.hwalaFeePaymentMethod === 'collect' ? 'تحصيل' : 'مدفوع مسبقاً',
        collectibleAmount: formatMultiCurrency(shipment),
      });
    });
    sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber > 1) { row.eachCell((cell) => { cell.alignment = { horizontal: 'center', vertical: 'middle' }; cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; }); }
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const today = new Date().toISOString().split('T')[0];
      saveAs(blob, `تقرير_الشحنات_المفصل_${today}.xlsx`);
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
                    body { font-family: 'Cairo', sans-serif; direction: rtl; font-size: 10pt; color: #000; margin: 0; padding: 0; background-color: #f0f0f0; }
                    @page { size: A5 landscape; margin: 0; }
                    .controls { position: fixed; top: 20px; left: 20px; z-index: 100; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.5); text-align: center; }
                    .controls button { background-color: #007bff; color: white; border: none; padding: 10px 20px; font-family: 'Cairo', sans-serif; font-size: 14px; border-radius: 5px; cursor: pointer; display: block; width: 100%; }
                    .controls button:hover { background-color: #0056b3; }
                    .a5-reminder { font-size: 11px; color: #555; margin-top: 8px; padding: 5px; background: #fdfde1; border: 1px solid #e7e7a3; border-radius: 4px; }
                    .invoice-box { width: 210mm; height: 148mm; padding: 7mm; box-sizing: border-box; display: flex; flex-direction: column; margin: 20px auto; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.3); }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
                    .header .logo { max-width: 140px; }
                    .header .company-title h2 { margin: 0; font-size: 16pt; }
                    .header .company-title p { margin: 0; font-size: 8pt; }
                    .header .policy-info { font-size: 10pt; font-weight: bold; }
                    .policy-info div { background-color: #f2f2f2; border: 1px solid #ccc; padding: 5px; margin-top: 2px; }
                    .main-content { display: flex; gap: 15px; }
                    .left-column, .right-column { flex: 1; }
                    .details-section { border: 1px solid #ccc; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
                    .details-section .field { display: flex; font-size: 10pt; margin-bottom: 8px; }
                    .details-section .field strong { min-width: 80px; }
                    .details-section .field span { border-bottom: 1px dotted #888; flex-grow: 1; padding-right: 5px; }
                    .notes-section { border: 1px solid #ccc; padding: 5px; border-radius: 5px; }
                    .notes-section strong { font-size: 10pt; }
                    .notes-section p { margin: 0; font-size: 9pt; min-height: 25px; }
                    .financial-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
                    .financial-table th, .financial-table td { border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; }
                    .financial-table th { background-color: #f2f2f2; }
                    .footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 40px; }
                    .footer .qr-code { text-align: center; }
                    .footer .qr-code img { width: 80px; height: 80px; }
                    .footer .signature-box { text-align: right; font-size: 8pt; }
                    .footer .signature-box .terms { font-weight: bold; }
                    .footer .signature-box .signature-line { margin-top: 20px; font-weight: bold; }
                     @media print { body { background-color: white; } .controls { display: none; } .invoice-box { margin: 0; box-shadow: none; width: 100%; height: 100%; } @page { size: A5 landscape; margin: 7mm; } }
                </style>
            </head>
            <body>
                <div class="controls"><button onclick="window.print()">طباعة</button><div class="a5-reminder"><strong>ملاحظة:</strong> تأكد من اختيار حجم الورق A5 والاتجاه الأفقي (Landscape) في إعدادات الطابعة.</div></div>
                <div class="invoice-box">
                    <div class="header"><div class="company-title"><h2>شركة النقل</h2><p>للنقل السريع والشحن الدولي</p></div><!-- Logo temporarily hidden <img src="${logo}" class="logo" alt="شعار الشركة" /> --><div class="policy-info"><div>البوليصة: ${shipment.shipmentId}</div><div>التاريخ: ${shipment.date}</div></div></div>
                    <div class="main-content">
                        <div class="left-column">
                            <div class="details-section">
                                <div class="field"><strong>المرسل:</strong> <span>${shipment.senderName}</span></div>
                                <div class="field"><strong>هاتف المرسل:</strong> <span>${shipment.senderPhone}</span></div>
                                <div class="field"><strong>المرسل إليه:</strong> <span>${shipment.customerName}</span></div>
                                <div class="field"><strong>هاتف المستلم:</strong> <span>${shipment.recipientPhone}</span></div>
                                <div class="field"><strong>العنوان:</strong> <span>${shipment.governorate}</span></div>
                                ${(parseFloat(shipment.internalTransferFee) > 0) ?
                                  `<div class="field"><strong>أجور المحول:</strong> <span>${shipment.internalTransferFee} ${shipment.internalTransferFeeCurrency}</span></div>`
                                  : ''
                                }
                                ${(parseFloat(shipment.shippingFee) > 0) ?
                                  `<div class="field"><strong>أجور الشحن:</strong> <span>${shipment.shippingFee} ${shipment.shippingFeeCurrency} (${shipment.shippingFeePaymentMethod === 'collect' ? 'تحصيل' : 'مسبق'})</span></div>`
                                  : ''
                                }
                                ${(parseFloat(shipment.hwalaFee) > 0) ?
                                  `<div class="field"><strong>أجور الحوالة:</strong> <span>${shipment.hwalaFee} ${shipment.hwalaFeeCurrency} (${shipment.hwalaFeePaymentMethod === 'collect' ? 'تحصيل' : 'مسبق'})</span></div>`
                                  : ''
                                }
                            </div>
                            <div class="notes-section"><strong>ملاحظات:</strong><p>${shipment.notes || 'لا يوجد'}</p></div>
                        </div>
                        <div class="right-column">
                            <table class="financial-table"><thead><tr><th>نوع البضاعة</th><th>الوزن</th><th>عدد الطرود</th><th>قيمة البضاعة</th><th>المبلغ المحصل</th></tr></thead><tbody><tr><td>${shipment.parcelType || '-'}</td><td>${shipment.weight || 0} كغ</td><td>${shipment.parcelCount}</td><td>${shipment.goodsValue || 0} ${shipment.goodsCurrency}</td><td style="font-size: 10pt;">${formatMultiCurrency(shipment)}</td></tr></tbody></table>
                            <div class="footer"><div class="qr-code"><img src="${qrCodeUrl}" alt="QR Code" /></div><div class="signature-box"><p class="terms">أقر بقراءة وفهم شروط الشحن والتسليم والموافقة عليها.</p><p class="signature-line">اسم المستلم والتوقيع: ..........................</p></div></div>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => { setSidebarOpen(!sidebarOpen); };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} role={role} />
      {/* Main */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6">
          {/* Header with Sidebar Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{tr('shipmentsDashboard')}</h1>
                <p className="text-gray-600">{tr('welcome')} {user.displayName || user.email}</p>
              </div>
            </div>
            
            {/* Logout Button */}
            <div className="flex gap-2">
              <AnimatedButton
                onClick={() => navigate('/')}
                variant="outline"
                className="bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
              >
                {tr('goToHome')}
              </AnimatedButton>
              <AnimatedButton
                onClick={handleLogout}
                variant="outline"
                icon={LogoutIcon}
                className="bg-white border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
              >
                {tr('logout')}
              </AnimatedButton>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <AnimatedStats
              title={tr('totalShipments')}
              value={stats.totalShipments}
              icon={Package}
              color="blue"
              delay={0}
              formatValue={(val) => val.toLocaleString()}
            />
            <AnimatedStats
              title={tr('pendingShipments')}
              value={stats.pendingShipments}
              icon={Clock}
              color="orange"
              delay={1}
              formatValue={(val) => val.toLocaleString()}
            />
            <AnimatedStats
              title={tr('inTransitShipments')}
              value={stats.inTransitShipments}
              icon={Truck}
              color="purple"
              delay={2}
              formatValue={(val) => val.toLocaleString()}
            />
            <AnimatedStats
              title={tr('deliveredShipments')}
              value={stats.deliveredShipments}
              icon={TrendingUp}
              color="green"
              delay={3}
              formatValue={(val) => val.toLocaleString()}
            />
          </div>

          {/* Search and Filters */}
          <AnimatedCard className="mb-8 p-6 bg-white shadow-sm">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
              {/* Search Bar */}
              <div className="relative flex-grow max-w-md">
                <SearchIcon className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 ${isRTL ? 'right-3' : 'left-3'}`} />
                <input 
                  type="text" 
                  placeholder={tr('searchPlaceholder')} 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className={`w-full py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`} 
                />
              </div>

              {/* View Filters */}
              <div className="flex gap-2">
                {[
                  { key: 'all', label: tr('all'), color: 'blue' },
                  { key: 'pending', label: tr('pending'), color: 'orange' },
                  { key: 'in-transit', label: tr('inTransit'), color: 'purple' },
                  { key: 'delivered', label: tr('delivered'), color: 'green' }
                ].map((filter) => (
                  <AnimatedButton
                    key={filter.key}
                    onClick={() => setSelectedView(filter.key)}
                    variant={selectedView === filter.key ? 'primary' : 'outline'}
                    size="sm"
                    className="text-sm"
                  >
                    {filter.label}
                  </AnimatedButton>
                ))}
              </div>
            </div>
          </AnimatedCard>

          {/* Shipments Table */}
          <AnimatedCard className="bg-white shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{tr('shipmentsList')}</h2>
                  <p className="text-gray-600">{tr('displayManageShipments')}</p>
                </div>
                <AnimatedButton
                  onClick={() => navigate('/add-shipment')}
                  variant="primary"
                  icon={PlusCircleIcon}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {tr('addNewShipment')}
                </AnimatedButton>
              </div>
            </div>
            
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
                <div className="md:hidden p-4">
                  <div className="space-y-4">
                    <AnimatePresence>
                      {filteredShipments.map((shipment, index) => (
                        <motion.div
                          key={shipment.id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          transition={{ delay: index * 0.1 }}
                          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
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
                              {tr('collectibleAmount')}: {formatMultiCurrency(shipment)}
                            </span>
                            <StatusSelector 
                              currentStatus={shipment.status} 
                              onStatusChange={(newStatus) => handleStatusChange(shipment.id, newStatus)} 
                            />
                          </div>
                          <div className="flex items-center justify-end gap-3 border-t pt-3">
                            <AnimatedButton
                              onClick={() => handlePrintPolicy(shipment)}
                              variant="outline"
                              size="sm"
                              icon={PrinterIcon}
                            />
                            <AnimatedButton
                              onClick={() => handleCopyLink(shipment.shipmentId)}
                              variant="outline"
                              size="sm"
                              icon={LinkIcon}
                            />
                            <AnimatedButton
                              onClick={() => handleDeleteShipment(shipment.id)}
                              variant="outline"
                              size="sm"
                              icon={TrashIcon}
                              className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="p-4 font-semibold text-left">{tr('shipmentNumber')}</th>
                        <th className="p-4 font-semibold text-left">{tr('customer')}</th>
                        <th className="p-4 font-semibold text-left">{tr('governorate')}</th>
                        <th className="p-4 font-semibold text-left">{tr('goodsValue')}</th>
                        <th className="p-4 font-semibold text-left">{tr('collectibleAmount')}</th>
                        <th className="p-4 font-semibold text-left">{tr('date')}</th>
                        <th className="p-4 font-semibold text-left">{tr('status')}</th>
                        <th className="p-4 font-semibold text-left">{tr('actions')}</th>
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
                            className="hover:bg-gray-50 transition-colors"
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
                                  onClick={() => handlePrintPolicy(shipment)}
                                  variant="outline"
                                  size="sm"
                                  icon={PrinterIcon}
                                  className="hover:bg-blue-50 hover:border-blue-300"
                                />
                                <AnimatedButton
                                  onClick={() => handleCopyLink(shipment.shipmentId)}
                                  variant="outline"
                                  size="sm"
                                  icon={LinkIcon}
                                  className="hover:bg-green-50 hover:border-green-300"
                                />
                                <AnimatedButton
                                  onClick={() => handleDeleteShipment(shipment.id)}
                                  variant="outline"
                                  size="sm"
                                  icon={TrashIcon}
                                  className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
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
                className="text-center py-20 bg-gray-50 rounded-lg m-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">{tr('noShipments')}</h3>
                <p className="text-gray-500 text-lg mb-4">{tr('addNewShipment')}</p>
                <AnimatedButton
                  onClick={() => navigate('/add-shipment')}
                  variant="primary"
                  icon={PlusCircleIcon}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {tr('addNewShipmentButton')}
                </AnimatedButton>
              </motion.div>
            )}
          </AnimatedCard>
        </div>
      </div>
      {isModalOpen && <AddShipmentModal closeModal={() => setIsModalOpen(false)} />}
    </div>
  );
}
