import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { PlusCircleIcon, SearchIcon, LogoutIcon, LinkIcon, ClipboardIcon, DownloadIcon, UserCogIcon, ClipboardListIcon, TrashIcon, PrinterIcon } from '../components/Icons';
import StatusSelector from '../components/StatusSelector';
import AddShipmentModal from '../components/AddShipmentModal';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedStats from '../components/AnimatedStats';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedLoader from '../components/AnimatedLoader';
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
import logo from '../assets/AL-MOSTAKEM-1.png';
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
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [selectedView, setSelectedView] = useState('all');

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
    if (selectedView === 'pending') return matchesSearch && (shipment.status === 'pending' || shipment.status === 'معلق');
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
                    <div class="header"><div class="company-title"><h2>شركة المستقيم</h2><p>للنقل السريع والشحن الدولي</p></div><img src="${logo}" class="logo" alt="شعار الشركة" /><div class="policy-info"><div>البوليصة: ${shipment.shipmentId}</div><div>التاريخ: ${shipment.date}</div></div></div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden" dir="rtl">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-purple-50/30 to-pink-50/30"></div>
      <div className="relative z-10">
      <motion.div 
        className="max-w-full mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section with Logout Button */}
        <motion.div 
          className="text-center mb-8 relative"
          variants={itemVariants}
        >
          {/* Logout Button - Top Right */}
          <div className="absolute top-0 right-0">
            <AnimatedButton
              onClick={handleLogout}
              variant="outline"
              icon={LogoutIcon}
              className="bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600 shadow-md"
            >
              تسجيل الخروج
            </AnimatedButton>
          </div>

          <motion.img 
            src={logo} 
            alt="شعار الشركة" 
            className="mx-auto h-32 w-auto mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.h1 
            className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            لوحة تحكم الشحنات
          </motion.h1>
          <motion.p 
            className="text-lg text-gray-600"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            مرحباً، {user.displayName || user.email}
          </motion.p>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">إحصائيات الشحنات</h2>
            <p className="text-gray-600">نظرة عامة على حالة الشحنات في النظام</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedStats
            title="إجمالي الشحنات"
            value={stats.totalShipments}
            icon={Package}
            color="blue"
            delay={0}
            formatValue={(val) => val.toLocaleString()}
          />
          <AnimatedStats
            title="الشحنات المعلقة"
            value={stats.pendingShipments}
            icon={Clock}
            color="orange"
            delay={1}
            formatValue={(val) => val.toLocaleString()}
          />
          <AnimatedStats
            title="قيد النقل"
            value={stats.inTransitShipments}
            icon={Truck}
            color="purple"
            delay={2}
            formatValue={(val) => val.toLocaleString()}
          />
          <AnimatedStats
            title="تم التسليم"
            value={stats.deliveredShipments}
            icon={TrendingUp}
            color="green"
            delay={3}
            formatValue={(val) => val.toLocaleString()}
          />
          </div>
        </motion.div>

        {/* Quick Actions Section */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">العمليات السريعة</h2>
            <p className="text-gray-600">اختر العملية المطلوبة من القائمة أدناه</p>
          </div>
        </motion.div>

        {/* Controls Section */}
        <AnimatedCard className="mb-8 p-6 bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-xl" delay={4}>
          <div className="space-y-6">
            {/* Section Header */}
            <div className="text-center border-b border-gray-200 pb-4">
              <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">أدوات التحكم والبحث</h3>
              <p className="text-sm text-gray-600">ابحث في الشحنات واختر العمليات المطلوبة</p>
            </div>
            
            {/* Search and Filters Row */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
              {/* Search Bar */}
              <div className="relative flex-grow max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="ابحث برقم الشحنة، اسم العميل، أو المندوب..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm" 
                />
              </div>

              {/* View Filters */}
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'الكل', color: 'blue' },
                  { key: 'pending', label: 'معلق', color: 'orange' },
                  { key: 'in-transit', label: 'قيد النقل', color: 'purple' },
                  { key: 'delivered', label: 'تم التسليم', color: 'green' }
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

            {/* Action Buttons - Organized in Professional Categories */}
            <div className="space-y-8">
              {/* Shipping Operations */}
              <div className="text-center">
                <h4 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">عمليات الشحن</h4>
                <div className="flex flex-wrap gap-4 justify-center">
                  <AnimatedButton
                    onClick={() => navigate('/add-shipment')}
                    variant="primary"
                    icon={PlusCircleIcon}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    شحنة جديدة
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={() => navigate('/shipments')}
                    variant="secondary"
                    icon={ClipboardListIcon}
                    className="bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    إدارة الشحنات
                  </AnimatedButton>
                </div>
              </div>

              {/* Trip Operations */}
              <div className="text-center">
                <h4 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">عمليات الرحلات</h4>
                <div className="flex flex-wrap gap-4 justify-center">
                  <AnimatedButton
                    onClick={() => navigate('/manifests')}
                    variant="secondary"
                    icon={Route}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    إنشاء رحلة
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={() => navigate('/trips')}
                    variant="secondary"
                    icon={Calendar}
                    className="bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    إدارة الرحلات
                  </AnimatedButton>
                </div>
              </div>

              {/* Vehicle Management */}
              <div className="text-center">
                <h4 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">إدارة المركبات</h4>
                <div className="flex flex-wrap gap-4 justify-center">
                  <AnimatedButton
                    onClick={() => navigate('/vehicles')}
                    variant="secondary"
                    icon={Truck}
                    className="bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    إدارة السيارات
                  </AnimatedButton>
                </div>
              </div>

              {/* Drivers Management Operations */}
              {(role === 'admin' || role === 'employee') && (
                <div className="text-center">
                  <h4 className="text-lg font-semibold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">إدارة المناديب والعمولات</h4>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <AnimatedButton
                      onClick={() => navigate('/drivers')}
                      variant="secondary"
                      icon={Users}
                      className="bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      إدارة المناديب
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={() => navigate('/driver-commissions')}
                      variant="secondary"
                      icon={DollarSign}
                      className="bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      أجور المناديب
                    </AnimatedButton>
                  </div>
                </div>
              )}

              {/* النظام المحاسبي */}
              {(role === 'admin' || role === 'employee') && (
                <div className="text-center">
                  <h4 className="text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">النظام المحاسبي</h4>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <AnimatedButton
                      onClick={() => navigate('/daily-journal')}
                      variant="secondary"
                      icon={BookOpen}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      دفتر اليومية
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={() => navigate('/debts-management')}
                      variant="secondary"
                      icon={CreditCard}
                      className="bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      إدارة الديون
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={() => navigate('/branch-transfers')}
                      variant="secondary"
                      icon={ArrowLeftRight}
                      className="bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      عمليات زمم
                    </AnimatedButton>
                  </div>
                </div>
              )}

              {/* Administrative Operations */}
              {(role === 'admin' || role === 'employee') && (
                <div className="text-center">
                  <h4 className="text-lg font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-4">الإدارة والتحكم</h4>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <AnimatedButton
                      onClick={() => navigate('/branches')}
                      variant="secondary"
                      icon={Building}
                      className="bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      إدارة الفروع
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={() => navigate('/branch-entries')}
                      variant="secondary"
                      icon={ClipboardListIcon}
                      className="bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      إدخالات الفروع
                    </AnimatedButton>
                    {role === 'admin' && (
                      <AnimatedButton
                        onClick={() => navigate('/admin')}
                        variant="secondary"
                        icon={UserCogIcon}
                        className="bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        إدارة المستخدمين
                      </AnimatedButton>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </AnimatedCard>

        {/* Shipments Table */}
        <AnimatedCard className="overflow-hidden" delay={5}>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">قائمة الشحنات</h2>
            <p className="text-gray-600">عرض وإدارة جميع الشحنات في النظام</p>
          </div>
          {isLoading ? (
            <div className="p-20 text-center">
              <AnimatedLoader 
                type="ring" 
                size="xl" 
                color="indigo" 
                text="جاري تحميل الشحنات..."
              />
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="md:hidden p-4">
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
                            المبلغ: {formatMultiCurrency(shipment)}
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
                <table className="w-full text-sm text-right">
                  <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
                    <tr>
                      <th className="p-4 font-semibold text-center">رقم الشحنة</th>
                      <th className="p-4 font-semibold text-center">العميل</th>
                      <th className="p-4 font-semibold text-center">المحافظة</th>
                      <th className="p-4 font-semibold text-center">قيمة البضاعة</th>
                      <th className="p-4 font-semibold text-center">المبلغ المحصل</th>
                      <th className="p-4 font-semibold text-center">التاريخ</th>
                      <th className="p-4 font-semibold text-center">الحالة</th>
                      <th className="p-4 font-semibold text-center">إجراءات</th>
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
                          className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 backdrop-blur-sm transition-all duration-300 border-l-4 border-transparent hover:border-indigo-300"
                        >
                          <td className="p-4 font-medium text-gray-900 text-center">{shipment.shipmentId}</td>
                          <td className="p-4 text-center">{shipment.customerName}</td>
                          <td className="p-4 text-center">{shipment.governorate}</td>
                          <td className="p-4 text-center">{`${shipment.goodsValue || 0} ${shipment.goodsCurrency || ''}`}</td>
                          <td className="p-4 font-semibold text-center">{formatMultiCurrency(shipment)}</td>
                          <td className="p-4 text-center">{shipment.date}</td>
                          <td className="p-4 text-center">
                            <StatusSelector 
                              currentStatus={shipment.status} 
                              onStatusChange={(newStatus) => handleStatusChange(shipment.id, newStatus)}
                            />
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center gap-2 justify-center">
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
              className="text-center py-20 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg m-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد شحنات</h3>
              <p className="text-gray-500 text-lg mb-4">قم بإضافة شحنة جديدة لبدء العمل</p>
              <AnimatedButton
                onClick={() => navigate('/add-shipment')}
                variant="primary"
                icon={PlusCircleIcon}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                إضافة شحنة جديدة
              </AnimatedButton>
            </motion.div>
          )}
        </AnimatedCard>

        {/* Routes Manager - Removed - using dedicated pages instead */}
      </motion.div>

      {isModalOpen && <AddShipmentModal closeModal={() => setIsModalOpen(false)} />}
      </div>
    </div>
  );
}
