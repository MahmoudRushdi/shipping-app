import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { format } from 'date-fns';
import AddBranchEntryModal from '../components/AddBranchEntryModal';
import DispatchIncomingItemModal from '../components/DispatchIncomingItemModal';
import { PlusCircleIcon, TrashIcon, ArrowRightIcon, DownloadIcon, PrinterIcon } from '../components/Icons';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function BranchEntryDetailsPage() {
    const { entryId } = useParams();
    const [entry, setEntry] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
    const [itemToDispatch, setItemToDispatch] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchEntryDetails = async () => {
        setIsLoading(true);
        setError('');
        try {
            if (!entryId) {
                setError("لم يتم العثور على مُعَرِّف الإدخال.");
                return;
            }
            const entryRef = doc(db, 'branch_entries', entryId);
            const entrySnap = await getDoc(entryRef);

            if (!entrySnap.exists()) {
                setError("لم يتم العثور على الإدخال.");
                return;
            }

            setEntry({ id: entrySnap.id, ...entrySnap.data() });
        } catch (err) {
            console.error("Error fetching entry details:", err);
            setError("فشل تحميل تفاصيل الإدخال.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEntryDetails();
    }, [entryId]);

    const handleEntryUpdated = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchEntryDetails();
    };

    const handleItemDispatched = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
        setIsDispatchModalOpen(false);
        setItemToDispatch(null);
        fetchEntryDetails();
    };

    const openDispatchModal = (item) => {
        setItemToDispatch(item);
        setIsDispatchModalOpen(true);
    };

    // Handle Export to Excel
    const handleExportEntry = async () => {
        if (!entry) return;

        const workbook = new ExcelJS.Workbook();
        workbook.rtl = true;
        const moneyFormat = '#,##0.00';
        const headerStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } }, alignment: { horizontal: 'center', vertical: 'middle' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } };
        const subHeaderStyle = { font: { bold: true, color: { argb: 'FF000000' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }, alignment: { horizontal: 'right' } };
        const cellStyle = { alignment: { horizontal: 'right', vertical: 'middle' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }};

        // Sheet 1: Main Entry Details
        const mainSheet = workbook.addWorksheet('تفاصيل الإدخال الرئيسية');
        mainSheet.columns = [{ width: 25 }, { width: 40 }];
        mainSheet.mergeCells('A1:B1');
        mainSheet.getCell('A1').value = `تفاصيل الإدخال ${entry.entryType === 'incoming' ? 'الوارد' : 'الصادر'}`;
        mainSheet.getCell('A1').style = { font: { bold: true, size: 16, color: { argb: 'FF000000' } }, alignment: { horizontal: 'center' } };
        mainSheet.addRow([]);

        mainSheet.addRow(['نوع الإدخال:', entry.entryType === 'incoming' ? 'وارد' : 'صادر']).font = { bold: true };
        mainSheet.addRow(['اسم الفرع:', entry.branchName]).font = { bold: true };
        mainSheet.addRow(['المركبة المستخدمة:', entry.vehicleName || 'غير محدد']).font = { bold: true };
        mainSheet.addRow(['النسبة المئوية للمشاركة:', `${entry.percentageShare}%`]).font = { bold: true };
        mainSheet.addRow(['رسوم إيجار المركبة (USD):', entry.vehicleRentalFee?.toLocaleString() || 0]).font = { bold: true };
        mainSheet.getCell('B6').numFmt = moneyFormat;
        mainSheet.addRow(['أجور إضافية:', `${entry.additionalFee?.toLocaleString() || 0} ${entry.additionalFeeCurrency || 'USD'} (${entry.additionalFeePaymentMethod === 'collect' ? 'تحصيل' : 'مسبق'})`]).font = { bold: true };
        mainSheet.getCell('B7').numFmt = moneyFormat;
        mainSheet.addRow(['تاريخ الإنشاء:', entry.createdAt ? format(entry.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A']).font = { bold: true };
        mainSheet.addRow(['ملاحظات عامة:', entry.notes || 'لا يوجد']).font = { bold: true };

        mainSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber > 2) {
                row.eachCell((cell, colNumber) => {
                    if (colNumber === 1) {
                        cell.style = { ...cell.style, ...subHeaderStyle, alignment: { horizontal: 'right' } };
                    } else {
                        cell.style = { ...cell.style, alignment: { horizontal: 'right' } };
                    }
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                });
            }
        });


        // Sheet 2: Items Details
        const itemsSheet = workbook.addWorksheet('تفاصيل البنود');
        itemsSheet.columns = [
            { header: 'الترتيب', key: 'orderIndex', width: 10 },
            ...(entry.entryType === 'incoming' ? [{ header: 'رقم مشعار الفرع المرسل', key: 'sendingBranchMeshaarId', width: 25 }] : []),
            { header: 'الوصف', key: 'itemDescription', width: 30 },
            { header: 'الكمية الكلية', key: 'itemQuantity', width: 15 },
            { header: 'الكمية المخرجة', key: 'dispatchedQuantity', width: 15 },
            { header: 'الكمية المتبقية', key: 'remainingQuantity', width: 15 },
            { header: 'الوزن (كغ)', key: 'itemWeight', width: 15 },
            { header: 'القيمة', key: 'itemValue', width: 15, style: { numFmt: moneyFormat } },
            { header: 'العملة', key: 'itemCurrency', width: 10 },
            { header: 'المستلم', key: 'recipientName', width: 25 },
            { header: 'هاتف المستلم', key: 'recipientPhone', width: 20 },
            { header: 'محافظة الوجهة', key: 'destinationGovernorate', width: 20 },
            { header: 'ملاحظات البند', key: 'itemNotes', width: 30 },
        ];
        
        // Add column headers
        const itemHeaders = [
            'الترتيب',
            ...(entry.entryType === 'incoming' ? ['رقم مشعار الفرع المرسل'] : []),
            'الوصف', 'الكمية الكلية', 'الكمية المخرجة', 'الكمية المتبقية', 'الوزن (كغ)', 'القيمة', 'العملة',
            'المستلم', 'هاتف المستلم', 'محافظة الوجهة', 'ملاحظات البند'
        ];
        const itemHeaderRow = itemsSheet.addRow(itemHeaders);
        itemHeaderRow.eachCell((cell) => {
            cell.style = headerStyle;
        });
        itemHeaderRow.height = 25;

        entry.items.sort((a, b) => a.orderIndex - b.orderIndex).forEach(item => {
            itemsSheet.addRow({
                ...item,
                orderIndex: item.orderIndex + 1,
                dispatchedQuantity: item.dispatchedQuantity || 0,
                remainingQuantity: item.itemQuantity - (item.dispatchedQuantity || 0),
            });
        });
        itemsSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            if (rowNumber > 1) { row.eachCell((cell) => { cell.style = cellStyle; }); }
        });

        // Sheet 3: Detailed Dispatch History
        const dispatchHistorySheet = workbook.addWorksheet('سجل الإخراج المفصل');
        dispatchHistorySheet.columns = [
            { header: 'رقم البند', key: 'itemOrderIndex', width: 15 },
            { header: 'وصف البند الأصلي', key: 'originalItemDescription', width: 30 },
            { header: 'الكمية المخرجة', key: 'dispatchedAmount', width: 15 },
            { header: 'تاريخ الإخراج', key: 'dispatchedDate', width: 20 },
            { header: 'نوع الوجهة', key: 'destinationType', width: 15 },
            { header: 'اسم المستلم/الفرع', key: 'targetName', width: 30 },
            { header: 'هاتف المستلم', key: 'customerPhone', width: 20 },
            { header: 'محافظة الوجهة', key: 'destinationGovernorate', width: 20 },
            { header: 'ملاحظات الإخراج', key: 'notes', width: 30 },
            { header: 'تم الإخراج بواسطة', key: 'recordedBy', width: 25 },
        ];
        
        // Add column headers
        const dispatchHeaders = [
            'رقم البند', 'وصف البند الأصلي', 'الكمية المخرجة', 'تاريخ الإخراج', 'نوع الوجهة',
            'اسم المستلم/الفرع', 'هاتف المستلم', 'محافظة الوجهة', 'ملاحظات الإخراج', 'تم الإخراج بواسطة'
        ];
        const dispatchHeaderRow = dispatchHistorySheet.addRow(dispatchHeaders);
        dispatchHeaderRow.eachCell((cell) => {
            cell.style = headerStyle;
        });
        dispatchHeaderRow.height = 25;

        let dispatchRecords = [];
        entry.items.forEach((item, itemIdx) => {
            if (item.dispatchHistory && item.dispatchHistory.length > 0) {
                item.dispatchHistory.forEach(dispatch => {
                    dispatchRecords.push({
                        itemOrderIndex: item.orderIndex + 1,
                        originalItemDescription: item.itemDescription,
                        dispatchedAmount: dispatch.dispatchedAmount,
                        dispatchedDate: dispatch.dispatchedDate ? format(dispatch.dispatchedDate.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A',
                        destinationType: dispatch.destinationType === 'customer' ? 'عميل' : 'فرع',
                        targetName: dispatch.destinationType === 'customer' ? dispatch.customerName : dispatch.targetBranchName,
                        customerPhone: dispatch.customerPhone,
                        destinationGovernorate: dispatch.destinationGovernorate,
                        notes: dispatch.notes,
                        recordedBy: dispatch.recordedBy,
                    });
                });
            }
        });
        dispatchHistorySheet.addRows(dispatchRecords);
        dispatchHistorySheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            if (rowNumber > 1) { row.eachCell((cell) => { cell.style = cellStyle; }); }
        });


        // Write to file
        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const today = new Date().toISOString().split('T')[0];
            saveAs(blob, `تقرير_إدخال_الفرع_${entry.branchName}_${today}.xlsx`);
        });
    };

    // Calculate totalItemColumns using React.useMemo
    const totalItemColumns = React.useMemo(() => {
        let count = 12; // Base fixed columns
        if (entry && entry.entryType === 'incoming') {
            count += 1; // Add 1 for 'رقم مشعار الفرع المرسل'
            count += 1; // Add 1 for 'إجراءات' column
        }
        return count;
    }, [entry]);


    // Handle Print Policy/Receipt
    const handlePrintEntry = () => {
        if (!entry) return;

        const dispatchHistoryColspan = totalItemColumns;

        // Build table rows dynamically for better readability and to avoid whitespace issues
        // Ensure no extra whitespace/newlines between HTML tags in template literals
        const itemRowsHtml = entry.items.sort((a, b) => a.orderIndex - b.orderIndex).map((item, index) => {
            // Base row for the item details
            let rowHtml = `
                <tr style="border-bottom: 1px solid #e0e0e0; page-break-inside: avoid;">
                    <td style="padding: 10px; text-align: right; vertical-align: top;">${item.orderIndex + 1}</td>
                    ${entry.entryType === 'incoming' ? `<td style="padding: 10px; text-align: right; vertical-align: top;">${item.sendingBranchMeshaarId}</td>` : ''}
                    <td style="padding: 10px; text-align: right; vertical-align: top;">${item.itemDescription}</td>
                    <td style="padding: 10px; text-align: right; vertical-align: top;">${item.itemQuantity}</td>
                    <td style="padding: 10px; text-align: right; vertical-align: top; color: #ef4444; font-weight: bold;">${item.dispatchedQuantity || 0}</td>
                    <td style="padding: 10px; text-align: right; vertical-align: top; color: #22c55e; font-weight: bold;">${item.itemQuantity - (item.dispatchedQuantity || 0)}</td>
                    <td style="padding: 10px; text-align: right; vertical-align: top;">${item.itemWeight}</td>
                    <td style="padding: 10px; text-align: right; vertical-align: top;">${item.itemValue?.toLocaleString()}</td>
                    <td style="padding: 10px; text-align: right; vertical-align: top;">${item.itemCurrency || 'N/A'}</td>
                    <td style="padding: 10px; text-align: right; vertical-align: top;">${item.recipientName || 'N/A'}</td>
                    <td style="padding: 10px; text-align: right; vertical-align: top;">${item.recipientPhone || 'N/A'}</td>
                    <td style="padding: 10px; text-align: right; vertical-align: top;">${item.destinationGovernorate || 'N/A'}</td>
                    <td style="padding: 10px; text-align: right; vertical-align: top;">${item.itemNotes || 'لا يوجد'}</td>
                    ${entry.entryType === 'incoming' ? `<td style="padding: 10px; text-align: right; vertical-align: top;"></td>` : ''}
                </tr>
            `;

            // Dispatch history row, if any
            const dispatchHistoryHtml = item.dispatchHistory && item.dispatchHistory.length > 0 ? `
                <tr style="background-color: #f8f8f8; page-break-inside: avoid;">
                    <td colspan="${dispatchHistoryColspan}" style="padding: 8px 10px; text-align: right; border-top: 1px solid #f0f0f0; font-size: 8.5pt; color: #555;">
                        <div style="padding-right: 10px; border-right: 2px solid #ddd;">
                            <strong style="display: block; margin-bottom: 4px; color: #333;">سجل الإخراج:</strong>
                            ${item.dispatchHistory.map((dispatch, dIdx) => `
                                <p style="margin: 2px 0;">
                                    - تم إخراج ${dispatch.dispatchedAmount} بتاريخ ${dispatch.dispatchedDate ? format(dispatch.dispatchedDate.toDate(), 'yyyy-MM-dd') : 'N/A'}
                                    إلى ${dispatch.destinationType === 'customer' ? `العميل ${dispatch.customerName} (${dispatch.destinationGovernorate})` : `الفرع ${dispatch.targetBranchName}`}
                                    ${dispatch.notes ? ` (ملاحظات: ${dispatch.notes})` : ''}
                                </p>
                            `).join('')}
                        </div>
                    </td>
                </tr>
            ` : '';
            return rowHtml + dispatchHistoryHtml; // Concatenate base row and history row
        }).join(''); // Join all item groups into a single string

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>إيصال إدخال - ${entry.branchName}</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Cairo', sans-serif; direction: rtl; font-size: 10pt; color: #333; margin: 0; padding: 0; background-color: #f8f8f8; }
                        @page { size: A5 portrait; margin: 15mm; } /* Changed to A5 portrait with more margin */
                        .controls { display: none; } /* Hide controls in print */
                        .receipt-container { width: 148mm; min-height: 210mm; padding: 15mm; box-sizing: border-box; margin: 0 auto; background: white; border: 1px solid #ddd; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                        .header { text-align: center; padding-bottom: 10px; margin-bottom: 15px; border-bottom: 2px solid #333; }
                        .header h1 { margin: 0; font-size: 18pt; color: #1a202c; }
                        .header p { margin: 4px 0 0; font-size: 9pt; color: #666; }
                        .info-section { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 9.5pt; line-height: 1.6; }
                        .info-section div { flex: 1; text-align: right; padding-left: 10px; }
                        .info-section div:first-child { text-align: right; padding-right: 10px; }
                        .info-section strong { display: inline-block; min-width: 60px; color: #444; }
                        .info-section span { color: #555; }
                        .details-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 8.5pt; }
                        .details-table th, .details-table td { border: 1px solid #e0e0e0; padding: 8px; text-align: right; vertical-align: top; }
                        .details-table th { background-color: #f2f2f2; font-weight: bold; color: #444; }
                        .details-table tbody tr:nth-child(odd) { background-color: #ffffff; }
                        .details-table tbody tr:nth-child(even) { background-color: #fcfcfc; }
                        .item-dispatch-history { font-size: 8pt; margin-top: 5px; padding-right: 10px; border-right: 2px solid #ddd; }
                        .item-dispatch-history p { margin: 2px 0; }
                        .totals-section { margin-top: 20px; font-size: 9.5pt; text-align: left; width: 40%; margin-right: auto; border: 1px solid #eee; padding: 10px; background-color: #f9f9f9; border-radius: 4px; }
                        .totals-section p { margin: 5px 0; }
                        .footer-notes { margin-top: 25px; font-size: 8.5pt; color: #666; border-top: 1px solid #eee; padding-top: 10px; text-align: center; }
                        .signature-line { margin-top: 40px; text-align: center; font-weight: bold; font-size: 9.5pt; }
                        @media print {
                            body { background-color: white; }
                            .receipt-container { margin: 0; box-shadow: none; border: none; width: 100%; min-height: auto; padding: 0; }
                            @page { size: A5 portrait; margin: 10mm; }
                        }
                    </style>
                </head>
                <body>
                    <div class="receipt-container">
                        <div class="header">
                            <h1>شركة المستقيم</h1>
                            <p>إيصال إدخال ${entry.entryType === 'incoming' ? 'وارد' : 'صادر'}</p>
                            <p>تاريخ الإدخال: ${entry.createdAt ? format(entry.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A'}</p>
                        </div>

                        <div class="info-section">
                            <div>
                                <strong>رقم الإدخال:</strong> <span>${entry.id}</span><br>
                                <strong>اسم الفرع:</strong> <span>${entry.branchName}</span><br>
                                <strong>المركبة:</strong> <span>${entry.vehicleName || 'غير محدد'}</span>
                            </div>
                            <div>
                                <strong>نسبة المشاركة:</strong> <span>${entry.percentageShare}%</span><br>
                                <strong>رسوم الإيجار:</strong> <span>${entry.vehicleRentalFee?.toLocaleString() || 0} USD</span><br>
                                <strong>أجور إضافية:</strong> <span>${entry.additionalFee?.toLocaleString() || 0} ${entry.additionalFeeCurrency || 'USD'} (${entry.additionalFeePaymentMethod === 'collect' ? 'تحصيل' : 'مسبق'})</span>
                            </div>
                        </div>

                        <table class="details-table">
                            <thead>
                                <tr>
                                    <th style="width: 5%;">الترتيب</th>
                                    ${entry.entryType === 'incoming' ? '<th style="width: 15%;">رقم مشعار الفرع</th>' : ''}
                                    <th style="width: 20%;">الوصف</th>
                                    <th style="width: 8%;">الكمية الكلية</th>
                                    <th style="width: 8%;">المخرجة</th>
                                    <th style="width: 8%;">المتبقية</th>
                                    <th style="width: 8%;">الوزن (كغ)</th>
                                    <th style="width: 8%;">القيمة</th>
                                    <th style="width: 8%;">العملة</th>
                                    <th style="width: 10%;">المستلم</th>
                                    <th style="width: 10%;">هاتف المستلم</th>
                                    <th style="width: 10%;">محافظة الوجهة</th>
                                    <th style="width: 15%;">ملاحظات البند</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemRowsHtml}
                            </tbody>
                        </table>

                        <div class="totals-section">
                            <p><strong>إجمالي عدد البنود:</strong> ${entry.items?.length || 0}</p>
                            ${entry.notes ? `<p><strong>ملاحظات عامة:</strong> ${entry.notes}</p>` : ''}
                        </div>

                        <div class="footer-notes">
                            <p>هذا الإيصال يمثل سجل الإدخال/الإخراج من/إلى الفرع. يرجى الاحتفاظ به للرجوع إليه.</p>
                        </div>
                        <div class="signature-line">
                            التوقيع: ............................................
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };


    if (isLoading) {
        return <div className="text-center p-10 text-gray-600" dir="rtl">جاري تحميل تفاصيل الإدخال...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500 bg-red-100 rounded-md m-4" dir="rtl">{error}</div>;
    }

    if (!entry) {
        return <div className="text-center p-10 text-gray-500" dir="rtl">لا توجد بيانات لعرضها.</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-8 font-sans" dir="rtl">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">تفاصيل الإدخال: <span className="text-indigo-600">
                            {entry.entryType === 'incoming' ? 'وارد' : 'صادر'} - {entry.branchName}
                        </span></h1>
                        <p>تاريخ الإنشاء: {entry.createdAt ? format(entry.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
                        >
                            تعديل الإدخال
                        </button>
                        {/* Export and Print Buttons */}
                        <button
                            onClick={handleExportEntry}
                            className="flex items-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200"
                        >
                            <DownloadIcon className="w-5 h-5" /><span>تصدير Excel</span>
                        </button>
                        <button
                            onClick={handlePrintEntry}
                            className="flex items-center gap-2 bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-gray-700 transition-colors duration-200"
                        >
                            <PrinterIcon className="w-5 h-5" /><span>طباعة إيصال</span>
                        </button>
                        <Link to="/branch-entries" className="text-sm text-indigo-600 hover:underline">
                            → العودة إلى قائمة الإدخالات
                        </Link>
                    </div>
                </div>

                {successMessage && <div className="bg-green-100 text-green-800 p-3 rounded-lg text-center mb-4">{successMessage}</div>}

                {/* General Entry Information */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">معلومات الإدخال الرئيسية</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-700">
                        <p><strong>النوع:</strong> <span className={`px-2 py-1 text-xs rounded-full font-semibold ${entry.entryType === 'incoming' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                            {entry.entryType === 'incoming' ? 'وارد' : 'صادر'}
                        </span></p>
                        <p><strong>اسم الفرع:</strong> {entry.branchName}</p>
                        <p><strong>المركبة المستخدمة:</strong> {entry.vehicleName || 'غير محدد'}</p>
                        <p><strong>النسبة المئوية للمشاركة:</strong> {entry.percentageShare}%</p>
                        <p><strong>رسوم إيجار المركبة:</strong> {entry.vehicleRentalFee?.toLocaleString() || 0} USD</p>
                        {/* Display Additional Fee with its payment method */}
                        <p><strong>أجور إضافية:</strong> {entry.additionalFee?.toLocaleString() || 0} {entry.additionalFeeCurrency || 'USD'} ({entry.additionalFeePaymentMethod === 'collect' ? 'تحصيل' : 'مسبق'})</p>
                        <p className="col-span-full"><strong>ملاحظات عامة:</strong> {entry.notes || 'لا يوجد ملاحظات'}</p>
                    </div>
                </div>

                {/* Items List */}
                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-4 border-b">
                        <h2 className="text-xl font-semibold text-gray-800">البنود ({entry.items?.length || 0})</h2>
                    </div>
                    <div className="overflow-x-auto">
                        {entry.items && entry.items.length > 0 ? (
                            <table className="w-full text-sm text-right text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">الترتيب</th>
                                        {entry.type === 'incoming' && (
                                            <th scope="col" className="px-4 py-3">رقم مشعار الفرع المرسل</th>
                                        )}
                                        <th scope="col" className="px-4 py-3">الوصف</th>
                                        <th scope="col" className="px-4 py-3">الكمية الكلية</th>
                                        <th scope="col" className="px-4 py-3">الكمية المخرجة</th>
                                        <th scope="col" className="px-4 py-3">الكمية المتبقية</th>
                                        <th scope="col" className="px-4 py-3">الوزن (كغ)</th>
                                        <th scope="col" className="px-4 py-3">القيمة</th>
                                        <th scope="col" className="px-4 py-3">العملة</th>
                                        <th scope="col" className="px-4 py-3">المستلم</th>
                                        <th scope="col" className="px-4 py-3">هاتف المستلم</th>
                                        <th scope="col" className="px-4 py-3">محافظة الوجهة</th>
                                        <th scope="col" className="px-4 py-3">ملاحظات البند</th>
                                        {entry.type === 'incoming' && (
                                            <th scope="col" className="px-4 py-3">إجراءات</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {entry.items.sort((a, b) => a.orderIndex - b.orderIndex).map((item, index) => {
                                        const hasDispatchHistory = item.dispatchHistory && item.dispatchHistory.length > 0;
                                        const canDispatch = entry.type === 'incoming' && (item.itemQuantity - (item.dispatchedQuantity || 0) > 0);
                                        
                                        return (
                                            <React.Fragment key={item.id || index}>
                                                <tr className="border-b hover:bg-gray-50 odd:bg-white even:bg-gray-50">
                                                    <td className="px-4 py-3 font-medium text-gray-900">{item.orderIndex + 1}</td>
                                                    {entry.type === 'incoming' && (
                                                        <td className="px-4 py-3">{item.sendingBranchMeshaarId}</td>
                                                    )}
                                                    <td className="px-4 py-3">{item.itemDescription}</td>
                                                    <td className="px-4 py-3">{item.itemQuantity}</td>
                                                    <td className="px-4 py-3 text-red-600 font-semibold">{item.dispatchedQuantity || 0}</td>
                                                    <td className="px-4 py-3 text-green-600 font-semibold">{item.itemQuantity - (item.dispatchedQuantity || 0)}</td>
                                                    <td className="px-4 py-3">{item.itemWeight}</td>
                                                    <td className="px-4 py-3">{item.itemValue?.toLocaleString()}</td>
                                                    <td className="px-4 py-3">{item.itemCurrency || 'N/A'}</td>
                                                    <td className="px-4 py-3">{item.recipientName || 'N/A'}</td>
                                                    <td className="px-4 py-3">{item.recipientPhone || 'N/A'}</td>
                                                    <td className="px-4 py-3">{item.destinationGovernorate || 'N/A'}</td>
                                                    <td className="px-4 py-3">{item.itemNotes || 'لا يوجد'}</td>
                                                    {entry.type === 'incoming' && (
                                                        <td className="px-4 py-3">
                                                            {canDispatch && (
                                                                <button
                                                                    onClick={() => openDispatchModal(item)}
                                                                    className="text-teal-600 hover:text-teal-900 font-semibold flex items-center gap-1"
                                                                >
                                                                    <ArrowRightIcon className="w-4 h-4" /> إخراج البند
                                                                </button>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                                {hasDispatchHistory && (
                                                    <tr key={`dispatch-history-${item.id || index}-row`}>
                                                        <td colSpan={totalItemColumns} className="px-4 py-2 border-t border-gray-200 text-right text-xs text-gray-600">
                                                            <div className="item-dispatch-history">
                                                                <strong>سجل الإخراج:</strong>
                                                                {item.dispatchHistory.map((dispatch, dIdx) => (
                                                                    <p key={dIdx}>
                                                                        - تم إخراج {dispatch.dispatchedAmount} بتاريخ {dispatch.dispatchedDate ? format(dispatch.dispatchedDate.toDate(), 'yyyy-MM-dd') : 'N/A'}
                                                                        إلى {dispatch.destinationType === 'customer' ? `العميل ${dispatch.customerName} (${dispatch.destinationGovernorate})` : `الفرع ${dispatch.targetBranchName}`}
                                                                        {dispatch.notes ? ` (ملاحظات: ${dispatch.notes})` : ''}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center text-gray-500 p-10">لا توجد بنود في هذا الإدخال.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal (Existing) */}
            {isEditModalOpen && (
                <AddBranchEntryModal
                    closeModal={() => setIsEditModalOpen(false)}
                    onEntryAdded={handleEntryUpdated}
                    existingEntryId={entryId}
                />
            )}

            {/* Dispatch Incoming Item Modal */}
            {isDispatchModalOpen && itemToDispatch && (
                <DispatchIncomingItemModal
                    closeModal={() => setIsDispatchModalOpen(false)}
                    onDispatchComplete={handleItemDispatched}
                    entryId={entryId}
                    item={itemToDispatch}
                />
            )}
        </div>
    );
}
