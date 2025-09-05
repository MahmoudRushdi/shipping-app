import React from 'react';
import { format } from 'date-fns';
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

const renderTotals = (totalsObject) => {
    const parts = Object.entries(totalsObject)
        .filter(([, amount]) => amount !== 0)
        .map(([currency, amount]) => `${amount.toLocaleString()} ${currency}`);
    return parts.join(' + ') || '0 USD';
};

export default function TripPrintReceipt({ trip, shipments, dispatchedBranchItems, totals }) {
    const { language } = useLanguage();
    const currentDate = new Date();
    const receiptNumber = `TRIP-${trip.id.substring(0, 8).toUpperCase()}`;
    
    // تصميم A4 للغة الإنجليزية، A5 للعربية
    const isEnglish = language === 'en';
    const pageWidth = isEnglish ? '210mm' : '210mm'; // A4 width
    const pageHeight = isEnglish ? '297mm' : '148mm'; // A4 height vs A5 height
    const pageDirection = isEnglish ? 'ltr' : 'rtl';
    const pageTextAlign = isEnglish ? 'left' : 'right';
    
    // تحسينات إضافية للغة الإنجليزية
    const englishSpacing = isEnglish ? '15px' : '8px';
    const englishFontSize = isEnglish ? '12px' : '8px';
    const englishPadding = isEnglish ? '8px' : '4px';
    
    return (
        <div className="print-receipt" style={{ 
            fontFamily: isEnglish ? 'Arial, sans-serif' : 'Arial, sans-serif',
            width: pageWidth,
            height: pageHeight,
            margin: '0 auto',
            padding: isEnglish ? '15mm' : '5mm',
            backgroundColor: 'white',
            color: 'black',
            fontSize: isEnglish ? '11px' : '8px',
            lineHeight: '1.4',
            direction: pageDirection,
            position: 'relative',
            boxSizing: 'border-box',
            textAlign: pageTextAlign,
            // تحسينات للطباعة
            '@media print': {
                pageBreakAfter: 'always',
                pageBreakInside: 'avoid'
            }
        }}>
            {/* Header Section */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: isEnglish ? '15px' : '8px',
                direction: pageDirection
            }}>
                {/* Company Info - Right side for Arabic, Left side for English */}
                <div style={{ 
                    textAlign: isEnglish ? 'left' : 'right', 
                    flex: '1', 
                    direction: pageDirection 
                }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '4px', 
                        direction: pageDirection 
                    }}>
                        <div style={{ direction: pageDirection, textAlign: isEnglish ? 'left' : 'right' }}>
                            <h1 style={{ 
                                margin: '0 0 2px 0', 
                                fontSize: isEnglish ? '16px' : '12px',
                                fontWeight: 'bold',
                                color: '#1e40af',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {isEnglish ? 'EXPRESS TRANSPORT' : 'EXPRESS TRANSPORT'}
                            </h1>
                            <h2 style={{ 
                                margin: '0 0 2px 0', 
                                fontSize: isEnglish ? '14px' : '10px',
                                fontWeight: 'bold',
                                color: '#1e40af',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {isEnglish ? 'Transport Company' : 'شركة النقل'}
                            </h2>
                        </div>
                    </div>
                    <p style={{ 
                        margin: '1px 0', 
                        fontSize: isEnglish ? '10px' : '7px',
                        color: '#374151',
                        textAlign: isEnglish ? 'left' : 'right'
                    }}>
                        {isEnglish ? 'For International Transport & Trade' : 'للنقل والتجارة الدولية'}
                    </p>
                    <p style={{ 
                        margin: '1px 0', 
                        fontSize: isEnglish ? '10px' : '7px',
                        color: '#374151',
                        textAlign: isEnglish ? 'left' : 'right'
                    }}>
                        {isEnglish ? 'Land Freight: Full - Partial' : 'شحن بري : كلي - جزئي'}
                    </p>
                </div>

                {/* Center - Title */}
                <div style={{ 
                    textAlign: 'center', 
                    flex: '1',
                    border: '1px solid #d1d5db',
                    padding: isEnglish ? '8px' : '4px',
                    borderRadius: '3px',
                    direction: pageDirection
                }}>
                    <h3 style={{ 
                        margin: '0 0 2px 0', 
                        fontSize: isEnglish ? '14px' : '10px',
                        fontWeight: 'bold',
                        color: '#1e40af',
                        textAlign: 'center'
                    }}>
                        {isEnglish ? 'Goods Delivery Receipt' : 'وصل تسليم البضائع'}
                    </h3>
                    <div style={{ fontSize: isEnglish ? '10px' : '7px', textAlign: 'center' }}>
                        <p style={{ margin: '1px 0', textAlign: 'center' }}>
                            {isEnglish ? `Waybill: ${receiptNumber}` : `البوليصة : ${receiptNumber}`}
                        </p>
                        <p style={{ margin: '1px 0', textAlign: 'center' }}>
                            {isEnglish ? `Date: ${format(currentDate, 'dd/MM/yyyy')}` : `التاريخ : ${format(currentDate, 'dd/MM/yyyy')}`}
                        </p>
                    </div>
                </div>

                {/* Logo - Left side for Arabic, Right side for English */}
                <div style={{ 
                    textAlign: isEnglish ? 'right' : 'left', 
                    flex: '1', 
                    direction: isEnglish ? 'rtl' : 'ltr' 
                }}>
                    <div style={{
                        border: '1px solid #d1d5db',
                        padding: isEnglish ? '6px' : '3px',
                        borderRadius: '3px',
                        width: isEnglish ? '60px' : '40px',
                        height: isEnglish ? '45px' : '30px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <span style={{ 
                            fontSize: isEnglish ? '8px' : '6px', 
                            fontWeight: 'bold' 
                        }}>
                            {isEnglish ? 'Express Transport' : 'شركة النقل'}
                        </span>
                        <span style={{ fontSize: isEnglish ? '8px' : '6px' }}>
                            {isEnglish ? 'Transport Company' : 'Express Transport'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Shipment Details Section */}
            <div style={{ marginBottom: isEnglish ? '15px' : '8px', direction: pageDirection }}>
                <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: isEnglish ? '10px' : '7px',
                    direction: pageDirection
                }}>
                    <tbody>
                        <tr>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                width: '25%',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {isEnglish ? 'Origin:' : 'المصدر :'}
                            </td>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                width: '25%',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {trip.destination || (isEnglish ? 'Not Specified' : 'غير محدد')}
                            </td>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                width: '25%',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {isEnglish ? 'Sender:' : 'المرسل :'}
                            </td>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                width: '25%',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {shipments[0]?.customerName || (isEnglish ? 'Not Specified' : 'غير محدد')}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {isEnglish ? 'Destination:' : 'الوجهة :'}
                            </td>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {trip.destination || (isEnglish ? 'Not Specified' : 'غير محدد')}
                            </td>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {isEnglish ? 'Recipient:' : 'المرسل إليه :'}
                            </td>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {shipments[0]?.customerName || (isEnglish ? 'Not Specified' : 'غير محدد')}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {isEnglish ? 'Cargo Type:' : 'نوع البضاعة :'}
                            </td>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {shipments[0]?.parcelType || (isEnglish ? 'Not Specified' : 'غير محدد')}
                            </td>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {isEnglish ? 'Shipment:' : 'الإرسالية :'}
                            </td>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {receiptNumber}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {isEnglish ? 'Parcels Count:' : 'عدد الطرود :'}
                            </td>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {shipments.length}
                            </td>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {isEnglish ? 'Weight:' : 'الوزن :'}
                            </td>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {shipments.reduce((total, shipment) => total + (parseFloat(shipment.weight) || 0), 0).toFixed(2)} {isEnglish ? 'kg' : 'كغ'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Financial Breakdown Section */}
            <div style={{ marginBottom: isEnglish ? '15px' : '8px', direction: pageDirection }}>
                <h4 style={{ 
                    margin: '0 0 4px 0',
                    fontSize: isEnglish ? '12px' : '8px',
                    fontWeight: 'bold',
                    color: '#1e40af',
                    textAlign: 'center'
                }}>
                    {isEnglish ? 'Financial Details' : 'التفاصيل المالية'}
                </h4>
                <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: isEnglish ? '10px' : '7px',
                    direction: pageDirection
                }}>
                    <tbody>
                        <tr>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                width: '50%',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {isEnglish ? 'Shipping Fees:' : 'أجور الشحن :'}
                            </td>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                width: '50%',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {renderTotals(totals.collections)} {isEnglish ? 'USD' : 'دولار أمريكي'}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {isEnglish ? 'Internal Transport Fees:' : 'أجور نقل داخلي :'}
                            </td>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {renderTotals(totals.expenses)} {isEnglish ? 'USD' : 'دولار أمريكي'}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {isEnglish ? 'Net Fees:' : 'صافي الأجور :'}
                            </td>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                color: '#059669',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {renderTotals(totals.profit)} {isEnglish ? 'USD' : 'دولار أمريكي'}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {isEnglish ? 'Amount Collected:' : 'مبلغ مقبوض :'}
                            </td>
                            <td style={{ 
                                padding: isEnglish ? '4px' : '2px',
                                border: '1px solid #d1d5db',
                                textAlign: isEnglish ? 'left' : 'right'
                            }}>
                                {renderTotals(totals.collections)} {isEnglish ? 'USD' : 'دولار أمريكي'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Notes Section */}
            {trip.notes && (
                <div style={{ 
                    marginBottom: isEnglish ? '15px' : '8px',
                    padding: isEnglish ? '8px' : '4px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '3px',
                    border: '1px solid #f59e0b',
                    fontSize: isEnglish ? '10px' : '7px',
                    direction: pageDirection
                }}>
                    <p style={{ 
                        margin: '0',
                        fontWeight: 'bold',
                        color: '#92400e',
                        textAlign: isEnglish ? 'left' : 'right'
                    }}>
                        {isEnglish ? `Notes: ${trip.notes}` : `ملاحظات : ${trip.notes}`}
                    </p>
                </div>
            )}

            {/* Terms and Conditions Section */}
            <div style={{ marginBottom: isEnglish ? '15px' : '8px', direction: pageDirection }}>
                <h4 style={{ 
                    margin: '0 0 4px 0',
                    fontSize: isEnglish ? '12px' : '8px',
                    fontWeight: 'bold',
                    color: '#1e40af',
                    textAlign: 'center'
                }}>
                    {isEnglish ? 'Shipping & Delivery Terms:' : 'شروط الشحن والتسليم :'}
                </h4>
                <div style={{ 
                    fontSize: isEnglish ? '8px' : '6px',
                    lineHeight: '1.1',
                    textAlign: isEnglish ? 'left' : 'right',
                    direction: pageDirection
                }}>
                    {isEnglish ? (
                        <>
                            <p style={{ margin: '1px 0', textAlign: 'left' }}>
                                1. This document serves as proof of shipping operation and its information is valid in financial records.
                            </p>
                            <p style={{ margin: '1px 0', textAlign: 'left' }}>
                                2. Goods must be declared transparently, otherwise they are subject to confiscation or return.
                            </p>
                            <p style={{ margin: '1px 0', textAlign: 'left' }}>
                                3. Goods must be properly packaged, especially fragile items. The company is not responsible for damages resulting from lack of information or poor packaging.
                            </p>
                            <p style={{ margin: '1px 0', textAlign: 'left' }}>
                                4. Expected delivery time is one week under normal circumstances. The company is not responsible after 50 days from the date.
                            </p>
                            <p style={{ margin: '1px 0', textAlign: 'left' }}>
                                5. The company is not responsible for delays caused by abnormal circumstances beyond its control.
                            </p>
                            <p style={{ margin: '1px 0', textAlign: 'left' }}>
                                6. Goods must be inspected upon receipt to ensure they match the waybill. The recipient is responsible for any shortage after signing.
                            </p>
                        </>
                    ) : (
                        <>
                            <p style={{ margin: '1px 0', textAlign: 'right' }}>
                                1. هذا المستند يعتبر دليل على عملية الشحن ومعلوماته حجة في السجلات المالية.
                            </p>
                            <p style={{ margin: '1px 0', textAlign: 'right' }}>
                                2. يجب الإعلان عن البضائع بشفافية وإلا فهي عرضة للمصادرة أو الإرجاع.
                            </p>
                            <p style={{ margin: '1px 0', textAlign: 'right' }}>
                                3. يجب أن تكون البضائع معبأة بشكل جيد خاصة القطع الهشة، الشركة غير مسؤولة عن الأضرار الناتجة عن نقص المعلومات أو سوء التعبئة.
                            </p>
                            <p style={{ margin: '1px 0', textAlign: 'right' }}>
                                4. الوقت المتوقع للتسليم أسبوع واحد في الظروف العادية، الشركة غير مسؤولة بعد 50 يوماً من التاريخ.
                            </p>
                            <p style={{ margin: '1px 0', textAlign: 'right' }}>
                                5. الشركة غير مسؤولة عن التأخير الناتج عن ظروف غير طبيعية خارجة عن إرادتها.
                            </p>
                            <p style={{ margin: '1px 0', textAlign: 'right' }}>
                                6. يجب فحص البضائع عند الاستلام للتأكد من مطابقتها للبوليصة، المستلم مسؤول عن أي نقص بعد التوقيع.
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Footer with Signature */}
            <div style={{
                marginTop: isEnglish ? '15px' : '8px',
                textAlign: 'center',
                direction: pageDirection
            }}>
                <div style={{ 
                    border: '1px solid #d1d5db',
                    padding: isEnglish ? '8px' : '4px',
                    borderRadius: '3px',
                    marginBottom: '3px',
                    display: 'inline-block',
                    minWidth: isEnglish ? '200px' : '150px'
                }}>
                    <p style={{ 
                        margin: '0',
                        fontSize: isEnglish ? '10px' : '7px',
                        fontWeight: 'bold',
                        color: '#374151',
                        textAlign: 'center'
                    }}>
                        {isEnglish ? 'Recipient Name & Signature' : 'اسم المتسلم و التوقيع'}
                    </p>
                </div>
                <div style={{ 
                    fontSize: isEnglish ? '8px' : '6px',
                    color: '#6b7280',
                    textAlign: 'center'
                }}>
                    <p style={{ margin: '1px 0', textAlign: 'center' }}>
                        {isEnglish ? 'I have read and understood the shipping and delivery terms and hereby sign' : 'لقد قرأت وفهمت شروط الشحن والتسليم وعليه أوقع'}
                    </p>
                </div>
            </div>
        </div>
    );
} 