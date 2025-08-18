import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/AL-MOSTAKEM-1.png';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useState, useEffect } from 'react';

export default function Navbar({ user, role }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    <nav className="bg-white shadow-md sticky top-0 z-40" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link to="/">
              <img
                className="h-16 w-auto cursor-pointer"
                src={logo}
                alt="شعار الشركة"
              />
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4 space-x-reverse">
              <Link to="/" className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-lg font-medium">الرئيسية</Link>
              <Link to="/track" className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-lg font-medium">تتبع شحنتك</Link>
              <Link to="/about" className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-lg font-medium">من نحن</Link>
              
              {/* لوحة التحكم - تبقى في الصفحة الرئيسية */}
              {(role === 'admin' || role === 'employee') && (
                <Link to="/dashboard" className="text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-2 rounded-md text-lg">
                  لوحة التحكم
                </Link>
              )}

              {/* Link for Customers */}
              {role === 'customer' && (
                <Link to="/my-shipments" className="text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-2 rounded-md text-lg">
                  شحناتي
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
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
                  القائمة
                </button>
                
                {/* القائمة المنسدلة */}
                {isMenuOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    {/* رأس القائمة مع زر الإغلاق */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                      <span className="text-sm font-medium text-gray-700">القائمة الرئيسية</span>
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
                        className="block px-4 py-3 text-right text-gray-700 hover:bg-green-50 hover:text-green-700 border-b border-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-green-600">●</span>
                          <span>إنشاء رحلة</span>
                        </div>
                      </Link>
                      
                      <Link
                        to="/branch-entries"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-3 text-right text-gray-700 hover:bg-purple-50 hover:text-purple-700 border-b border-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-purple-600">●</span>
                          <span>إدخالات الفروع</span>
                        </div>
                      </Link>
                      
                      <Link
                        to="/drivers"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-3 text-right text-gray-700 hover:bg-blue-50 hover:text-blue-700 border-b border-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-blue-600">●</span>
                          <span>إدارة المناديب</span>
                        </div>
                      </Link>
                      
                      <Link
                        to="/driver-commissions"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-3 text-right text-gray-700 hover:bg-orange-50 hover:text-orange-700 border-b border-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-orange-600">●</span>
                          <span>أجور المناديب</span>
                        </div>
                      </Link>
                      
                      <Link
                        to="/daily-journal"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-3 text-right text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border-b border-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-600">●</span>
                          <span>دفتر اليومية</span>
                        </div>
                      </Link>
                      
                      <Link
                        to="/debts-management"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-3 text-right text-gray-700 hover:bg-amber-50 hover:text-amber-700 border-b border-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-blue-600">●</span>
                          <span>إدارة الديون</span>
                        </div>
                      </Link>
                      
                      <Link
                        to="/branch-transfers"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-3 text-right text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-teal-600">●</span>
                          <span>عمليات زمم</span>
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
                تسجيل الخروج
              </button>
            ) : (
              <Link to="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
