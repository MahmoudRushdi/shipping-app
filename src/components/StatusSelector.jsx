import { useLanguage } from '../hooks/useLanguage.jsx';

const STATUS_OPTIONS = ['received', 'in-transit', 'arrived', 'delivered', 'returned'];
const STATUS_COLORS = {
  'received': 'bg-blue-100 text-blue-800',
  'in-transit': 'bg-yellow-100 text-yellow-800',
  'arrived': 'bg-purple-100 text-purple-800',
  'delivered': 'bg-green-100 text-green-800',
  'returned': 'bg-red-100 text-red-800',
};

export default function StatusSelector({ currentStatus, onStatusChange }) {
    const { tr } = useLanguage();
    
    const getStatusText = (status) => {
        switch(status) {
            case 'received': return tr('statusReceived');
            case 'in-transit': return tr('statusInTransit');
            case 'arrived': return tr('statusArrived');
            case 'delivered': return tr('statusDelivered');
            case 'returned': return tr('statusReturned');
            default: return status;
        }
    };

    return (
        <select
            value={currentStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className={`border-none rounded-md px-2 py-1 text-xs font-semibold ${STATUS_COLORS[currentStatus] || 'bg-gray-100 text-gray-800'}`}
        >
            {STATUS_OPTIONS.map(option => (
                <option key={option} value={option}>{getStatusText(option)}</option>
            ))}
        </select>
    );
}
