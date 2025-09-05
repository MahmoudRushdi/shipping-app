import { Link, useNavigate } from 'react-router-dom';

import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';

export default function Navbar({ user, role }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, changeLanguage, tr, isRTL } = useLanguage();

  // إغلاق القائمة عند النقر خارجها
  const handleClickOutside = (event) => {
    if (isMenuOpen && !event.target.closest('.menu-container')) {
      setIsMenuOpen(false);
    }
  };

  // إضافة مستمع النقر عند فتح القائمة
  useEffect(() => {
    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo temporarily hidden
          <div className="flex-shrink-0">
            <Link to="/">
              <img
                className="h-16 w-auto cursor-pointer"
                src={logo}
                alt={tr('companyLogo')}
              />
            </Link>
          </div>
          */}
          
          <div className="hidden md:block">
            <div className={`${isRTL ? 'mr-10' : 'ml-10'} flex items-baseline space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
              <Link to="/" className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-lg font-medium">{tr('home')}</Link>
              <Link to="/track" className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-lg font-medium">{tr('trackShipment')}</Link>
              <Link to="/about" className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-lg font-medium">{tr('about')}</Link>
              
              {/* لوحة التحكم - تبقى في الصفحة الرئيسية */}
              {(role === 'admin' || role === 'employee') && (
                <Link to="/dashboard" className="text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-2 rounded-md text-lg">
                  {tr('dashboard')}
                </Link>
              )}

              {/* Link for Customers */}
              {role === 'customer' && (
                <Link to="/my-shipments" className="text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-2 rounded-md text-lg">
                  {tr('myShipments')}
                </Link>
              )}
            </div>
          </div>
          
          <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
            {/* زر تغيير اللغة */}
            <button
              onClick={() => changeLanguage(language === 'ar' ? 'en' : 'ar')}
              className="bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 flex items-center gap-2 transition-all duration-200"
              title={tr('switchLanguage')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              {isRTL ? 'EN' : 'عربي'}
            </button>
            
            {/* القائمة المنسدلة للموظفين والمدراء */}
            {(role === 'admin' || role === 'employee') && (
              <div className="relative menu-container">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  {tr('menu')}
                </button>
                
                {/* القائمة المنسدلة */}
                {isMenuOpen && (
                  <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50`}>
                    {/* رأس القائمة مع زر الإغلاق */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                      <span className="text-sm font-medium text-gray-700">{tr('mainMenu')}</span>
                      <button
                        onClick={() => setIsMenuOpen(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="py-2">
                      <Link
                        to="/create-trip"
                        onClick={() => setIsMenuOpen(false)}
                        className={`block px-4 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-gray-700 hover:bg-green-50 hover:text-green-700 border-b border-gray-100 transition-colors`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-green-600">●</span>
                          <span>{tr('createTrip')}</span>
                        </div>
                      </Link>
                      
                      <Link
                        to="/branch-entries"
                        onClick={() => setIsMenuOpen(false)}
                        className={`block px-4 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-gray-700 hover:bg-purple-50 hover:text-purple-700 border-b border-gray-100 transition-colors`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-purple-600">●</span>
                          <span>{tr('branchEntries')}</span>
                        </div>
                      </Link>
                      
                      <Link
                        to="/drivers"
                        onClick={() => setIsMenuOpen(false)}
                        className={`block px-4 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-gray-700 hover:bg-blue-50 hover:text-blue-700 border-b border-gray-100 transition-colors`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-blue-600">●</span>
                          <span>{tr('manageDrivers')}</span>
                        </div>
                      </Link>
                      
                      <Link
                        to="/driver-commissions"
                        onClick={() => setIsMenuOpen(false)}
                        className={`block px-4 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-gray-700 hover:bg-orange-50 hover:text-orange-700 border-b border-gray-100 transition-colors`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-orange-600">●</span>
                          <span>{tr('driverCommissions')}</span>
                        </div>
                      </Link>
                      

                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* زر تسجيل الخروج/الدخول */}
            {user ? (
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                {tr('logout')}
              </button>
            ) : (
              <Link to="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                {tr('login')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
