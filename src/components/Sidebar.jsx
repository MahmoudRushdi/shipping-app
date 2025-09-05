import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { 
  Package, 
  Truck, 
  Users, 
  Building, 
  Route, 
  Calendar,
  ClipboardList,
  DollarSign,
  UserCog,
  ChevronDown,
  ChevronRight,
  Home,
  BarChart3,
  ArrowRightLeft
} from 'lucide-react';

export default function Sidebar({ isOpen, onToggle, role }) {
  const { language, tr, isRTL } = useLanguage();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    shipping: true, // Only one section open by default
    trips: false,
    vehicles: false,
    drivers: false,
    customers: false,
    accounting: false,
    admin: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => {
      // Close all other sections and toggle the clicked one
      const newState = {};
      Object.keys(prev).forEach(key => {
        newState[key] = key === section ? !prev[key] : false;
      });
      return newState;
    });
  };

  const menuItems = [
    {
      id: 'home',
      label: tr('home'),
      icon: Home,
      path: '/',
      color: 'text-blue-600'
    },
    {
      id: 'dashboard',
      label: tr('dashboard'),
      icon: BarChart3,
      path: '/dashboard',
      color: 'text-blue-600'
    },
    {
      id: 'shipping',
      label: tr('shippingOperations'),
      icon: Package,
      color: 'text-indigo-600',
      children: [
        { label: tr('newShipment'), path: '/add-shipment', icon: Package },
        { label: tr('manageShipments'), path: '/shipments', icon: ClipboardList }
      ]
    },
    {
      id: 'trips',
      label: tr('tripOperations'),
      icon: Route,
      color: 'text-green-600',
      children: [
        { label: tr('createTrip'), path: '/manifests', icon: Route },
        { label: tr('manageTrips'), path: '/trips', icon: Calendar }
      ]
    },
    {
      id: 'vehicles',
      label: tr('vehicleManagement'),
      icon: Truck,
      color: 'text-blue-600',
      children: [
        { label: tr('manageVehicles'), path: '/vehicles', icon: Truck }
      ]
    },
    {
      id: 'drivers',
      label: tr('driversManagement'),
      icon: Users,
      color: 'text-orange-600',
      children: [
        { label: tr('manageDrivers'), path: '/drivers', icon: Users },
        { label: tr('driversWages'), path: '/driver-commissions', icon: DollarSign }
      ]
    },
    {
      id: 'customers',
      label: tr('customersManagement'),
      icon: Users,
      color: 'text-purple-600',
      children: [
        { label: tr('customersManagement'), path: '/customers', icon: Users },
        { label: tr('debtsManagement') || 'إدارة الديون', path: '/debts', icon: DollarSign }
      ]
    },
    // النظام المحاسبي
    {
      id: 'accounting',
      label: tr('accountingSystem'),
      icon: DollarSign,
      color: 'text-emerald-600',
      children: [
        { label: tr('dailyJournal'), path: '/daily-journal', icon: DollarSign },
        { label: tr('branchTransfers'), path: '/branch-transfers', icon: ArrowRightLeft }
      ]
    },
    // إدارة المستخدمين تظهر فقط للمدراء
    ...(role === 'admin' ? [{
      id: 'admin',
      label: tr('administrativeOperations'),
      icon: Building,
      color: 'text-teal-600',
      children: [
        { label: tr('manageUsers'), path: '/admin', icon: UserCog },
        { label: tr('manageBranches'), path: '/branches', icon: Building },
        { label: tr('branchEntries'), path: '/branch-entries', icon: ClipboardList }
      ]
    }] : [])
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isSectionActive = (section) => {
    return section.children?.some(child => isActive(child.path)) || false;
  };

  // Dynamic spacing classes based on language direction
  const getSpacingClass = (baseClass) => {
    if (isRTL) {
      if (baseClass.includes('ml-')) {
        return baseClass.replace('ml-', 'mr-');
      }
      if (baseClass.includes('mr-')) {
        return baseClass.replace('mr-', 'ml-');
      }
      if (baseClass.includes('space-x-')) {
        return baseClass.replace('space-x-', 'space-x-reverse');
      }
    }
    return baseClass;
  };

  return (
    <div className={`fixed top-0 h-full bg-white shadow-xl transition-all duration-300 z-50 ${
      isOpen ? 'w-64' : 'w-16'
    } ${isRTL ? 'right-0' : 'left-0'}`}>
      
      {/* Header */}
      <div className="h-16 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between px-4">
        {isOpen && (
          <h1 className="text-white font-bold text-lg">
            {tr('companyName')}
          </h1>
        )}
        <button
          onClick={onToggle}
          className="text-white hover:text-gray-200 transition-colors"
        >
          {isOpen ? (
            <ChevronRight className="w-6 h-6" />
          ) : (
            <ChevronDown className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Navigation Menu - Scrollable */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden mt-4 px-2 pb-20">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              {item.children ? (
                // Section with children
                <div>
                  <button
                    onClick={() => toggleSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 ${
                      isSectionActive(item.id) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className={`w-5 h-5 ${item.color} ${isRTL ? 'ml-3' : 'mr-3'}`} />
                      {isOpen && <span className="font-medium">{item.label}</span>}
                    </div>
                    {isOpen && (
                      expandedSections[item.id] ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )
                    )}
                  </button>
                  
                  {/* Children */}
                  {expandedSections[item.id] && (
                    <ul className={`mt-2 space-y-1 ${isOpen ? (isRTL ? 'mr-6' : 'ml-6') : 'ml-0'}`}>
                      {item.children.map((child, index) => (
                        <li key={index}>
                          <Link
                            to={child.path}
                            className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 ${
                              isActive(child.path) 
                                ? `bg-indigo-100 text-indigo-700 ${isRTL ? 'border-l-2' : 'border-r-2'} border-indigo-500` 
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <child.icon className={`w-4 h-4 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                            {isOpen && <span className="text-sm">{child.label}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                // Single item
                <Link
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 ${
                    isActive(item.path) 
                      ? `bg-indigo-100 text-indigo-700 ${isRTL ? 'border-l-2' : 'border-r-2'} border-indigo-500` 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  {isOpen && <span className={`${isRTL ? 'mr-3' : 'ml-3'} font-medium`}>{item.label}</span>}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
        {/* Footer content can be added here if needed */}
      </div>
    </div>
  );
}

