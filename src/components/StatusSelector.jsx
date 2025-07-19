import React from 'react';

const STATUS_OPTIONS = ['تم الاستلام من المرسل', 'قيد النقل', 'وصلت الوجهة', 'تم التسليم', 'مرتجع'];
const STATUS_COLORS = {
  'تم الاستلام من المرسل': 'bg-blue-100 text-blue-800',
  'قيد النقل': 'bg-yellow-100 text-yellow-800',
  'وصلت الوجهة': 'bg-purple-100 text-purple-800',
  'تم التسليم': 'bg-green-100 text-green-800',
  'مرتجع': 'bg-red-100 text-red-800',
};

export default function StatusSelector({ currentStatus, onStatusChange }) {
    return (
        <select
            value={currentStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className={`border-none rounded-md px-2 py-1 text-xs font-semibold ${STATUS_COLORS[currentStatus] || 'bg-gray-100 text-gray-800'}`}
        >
            {STATUS_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
    );
}
