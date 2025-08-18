import React from 'react';
import { format } from 'date-fns';
import logo from '../assets/AL-MOSTAKEM-1.png';

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
    const currentDate = new Date();
    const receiptNumber = `TRIP-${trip.id.substring(0, 8).toUpperCase()}`;
    
    return (
        <div className="print-receipt" style={{ 
            fontFamily: 'Arial, sans-serif',
            width: '210mm', // A5 landscape width
            height: '148mm', // A5 landscape height
            margin: '0 auto',
            padding: '5mm', // تقليل الهوامش
            backgroundColor: 'white',
            color: 'black',
            fontSize: '8px', // تقليل حجم الخط
            lineHeight: '1.2',
            direction: 'rtl',
            position: 'relative',
            boxSizing: 'border-box',
            textAlign: 'right'
        }}>
            {/* Header Section */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '8px', // تقليل المسافة
                direction: 'rtl'
            }}>
                {/* Right side - Company Info */}
                <div style={{ textAlign: 'right', flex: '1', direction: 'rtl' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', direction: 'rtl' }}>
                        <img 
                            src={logo} 
                            alt="شعار الشركة" 
                            style={{ 
                                height: '20px', // تقليل حجم الشعار
                                width: 'auto',
                                marginLeft: '6px'
                            }} 
                        />
                        <div style={{ direction: 'rtl', textAlign: 'right' }}>
                            <h1 style={{ 
                                margin: '0 0 2px 0', 
                                fontSize: '12px', // تقليل حجم الخط
                                fontWeight: 'bold',
                                color: '#1e40af',
                                textAlign: 'right'
                            }}>
                                AL-MOSTAKEM
                            </h1>
                            <h2 style={{ 
                                margin: '0 0 2px 0', 
                                fontSize: '10px', // تقليل حجم الخط
                                fontWeight: 'bold',
                                color: '#1e40af',
                                textAlign: 'right'
                            }}>
                                شركة المستقيم
                            </h2>
                        </div>
                    </div>
                    <p style={{ 
                        margin: '1px 0', 
                        fontSize: '7px', // تقليل حجم الخط
                        color: '#374151',
                        textAlign: 'right'
                    }}>
                        للنقل والتجارة الدولية
                    </p>
                    <p style={{ 
                        margin: '1px 0', 
                        fontSize: '7px', // تقليل حجم الخط
                        color: '#374151',
                        textAlign: 'right'
                    }}>
                        شحن بري : كلي - جزئي
                    </p>
                </div>

                {/* Center - Title */}
                <div style={{ 
                    textAlign: 'center', 
                    flex: '1',
                    border: '1px solid #d1d5db',
                    padding: '4px', // تقليل التباعد
                    borderRadius: '3px',
                    direction: 'rtl'
                }}>
                    <h3 style={{ 
                        margin: '0 0 2px 0', 
                        fontSize: '10px', // تقليل حجم الخط
                        fontWeight: 'bold',
                        color: '#1e40af',
                        textAlign: 'center'
                    }}>
                        وصل تسليم البضائع
                    </h3>
                    <div style={{ fontSize: '7px', textAlign: 'center' }}>
                        <p style={{ margin: '1px 0', textAlign: 'center' }}>
                            البوليصة : {receiptNumber}
                        </p>
                        <p style={{ margin: '1px 0', textAlign: 'center' }}>
                            التاريخ : {format(currentDate, 'dd/MM/yyyy')}
                        </p>
                    </div>
                </div>

                {/* Left side - Logo */}
                <div style={{ textAlign: 'left', flex: '1', direction: 'ltr' }}>
                    <div style={{
                        border: '1px solid #d1d5db',
                        padding: '3px', // تقليل التباعد
                        borderRadius: '3px',
                        width: '40px', // تقليل الحجم
                        height: '30px', // تقليل الحجم
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <span style={{ fontSize: '6px', fontWeight: 'bold' }}>شركة المستقيم</span>
                        <span style={{ fontSize: '6px' }}>Al-Mostakem</span>
                    </div>
                </div>
            </div>

            {/* Shipment Details Section */}
            <div style={{ marginBottom: '8px', direction: 'rtl' }}>
                <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: '7px', // تقليل حجم الخط
                    direction: 'rtl'
                }}>
                    <tbody>
                        <tr>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                width: '25%',
                                textAlign: 'right'
                            }}>
                                المصدر :
                            </td>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                width: '25%',
                                textAlign: 'right'
                            }}>
                                {trip.destination || 'غير محدد'}
                            </td>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                width: '25%',
                                textAlign: 'right'
                            }}>
                                المرسل :
                            </td>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                width: '25%',
                                textAlign: 'right'
                            }}>
                                {shipments[0]?.customerName || 'غير محدد'}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                textAlign: 'right'
                            }}>
                                الوجهة :
                            </td>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                textAlign: 'right'
                            }}>
                                {trip.destination || 'غير محدد'}
                            </td>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                textAlign: 'right'
                            }}>
                                المرسل إليه :
                            </td>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                textAlign: 'right'
                            }}>
                                {shipments[0]?.customerName || 'غير محدد'}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                textAlign: 'right'
                            }}>
                                نوع البضاعة :
                            </td>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                textAlign: 'right'
                            }}>
                                {shipments[0]?.parcelType || 'غير محدد'}
                            </td>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                textAlign: 'right'
                            }}>
                                الإرسالية :
                            </td>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                textAlign: 'right'
                            }}>
                                {receiptNumber}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                textAlign: 'right'
                            }}>
                                عدد الطرود :
                            </td>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                textAlign: 'right'
                            }}>
                                {shipments.length}
                            </td>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                textAlign: 'right'
                            }}>
                                الوزن :
                            </td>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                textAlign: 'right'
                            }}>
                                {shipments.reduce((total, shipment) => total + (parseFloat(shipment.weight) || 0), 0).toFixed(2)} كغ
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Financial Breakdown Section */}
            <div style={{ marginBottom: '8px', direction: 'rtl' }}>
                <h4 style={{ 
                    margin: '0 0 4px 0',
                    fontSize: '8px', // تقليل حجم الخط
                    fontWeight: 'bold',
                    color: '#1e40af',
                    textAlign: 'center'
                }}>
                    التفاصيل المالية
                </h4>
                <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: '7px', // تقليل حجم الخط
                    direction: 'rtl'
                }}>
                    <tbody>
                        <tr>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                width: '50%',
                                textAlign: 'right'
                            }}>
                                أجور الشحن :
                            </td>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                width: '50%',
                                textAlign: 'right'
                            }}>
                                {renderTotals(totals.collections)} دولار أمريكي
                            </td>
                        </tr>
                        <tr>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                textAlign: 'right'
                            }}>
                                أجور نقل داخلي :
                            </td>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                textAlign: 'right'
                            }}>
                                {renderTotals(totals.expenses)} دولار أمريكي
                            </td>
                        </tr>
                        <tr>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                textAlign: 'right'
                            }}>
                                صافي الأجور :
                            </td>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                color: '#059669',
                                textAlign: 'right'
                            }}>
                                {renderTotals(totals.profit)} دولار أمريكي
                            </td>
                        </tr>
                        <tr>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                                textAlign: 'right'
                            }}>
                                مبلغ مقبوض :
                            </td>
                            <td style={{ 
                                padding: '2px', // تقليل التباعد
                                border: '1px solid #d1d5db',
                                textAlign: 'right'
                            }}>
                                {renderTotals(totals.collections)} دولار أمريكي
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Notes Section */}
            {trip.notes && (
                <div style={{ 
                    marginBottom: '8px',
                    padding: '4px', // تقليل التباعد
                    backgroundColor: '#fef3c7',
                    borderRadius: '3px',
                    border: '1px solid #f59e0b',
                    fontSize: '7px', // تقليل حجم الخط
                    direction: 'rtl'
                }}>
                    <p style={{ 
                        margin: '0',
                        fontWeight: 'bold',
                        color: '#92400e',
                        textAlign: 'right'
                    }}>
                        ملاحظات : {trip.notes}
                    </p>
                </div>
            )}

            {/* Terms and Conditions Section */}
            <div style={{ marginBottom: '8px', direction: 'rtl' }}>
                <h4 style={{ 
                    margin: '0 0 4px 0',
                    fontSize: '8px', // تقليل حجم الخط
                    fontWeight: 'bold',
                    color: '#1e40af',
                    textAlign: 'center'
                }}>
                    شروط الشحن والتسليم :
                </h4>
                <div style={{ 
                    fontSize: '6px', // تقليل حجم الخط
                    lineHeight: '1.1',
                    textAlign: 'right',
                    direction: 'rtl'
                }}>
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
                </div>
            </div>

            {/* Footer with Signature */}
            <div style={{
                marginTop: '8px', // تقليل المسافة
                textAlign: 'center',
                direction: 'rtl'
            }}>
                <div style={{ 
                    border: '1px solid #d1d5db',
                    padding: '4px', // تقليل التباعد
                    borderRadius: '3px',
                    marginBottom: '3px',
                    display: 'inline-block',
                    minWidth: '150px' // تقليل العرض
                }}>
                    <p style={{ 
                        margin: '0',
                        fontSize: '7px', // تقليل حجم الخط
                        fontWeight: 'bold',
                        color: '#374151',
                        textAlign: 'center'
                    }}>
                        اسم المتسلم و التوقيع
                    </p>
                </div>
                <div style={{ 
                    fontSize: '6px', // تقليل حجم الخط
                    color: '#6b7280',
                    textAlign: 'center'
                }}>
                    <p style={{ margin: '1px 0', textAlign: 'center' }}>
                        لقد قرأت وفهمت شروط الشحن والتسليم وعليه أوقع
                    </p>
                </div>
            </div>
        </div>
    );
} 