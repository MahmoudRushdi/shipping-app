// src/components/Navbar.jsx

import logo from '../assets/AL-MOSTAKEM-1.png';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

// --- KEY CHANGE: Accept 'role' as a prop ---
export default function Navbar({ user, role }) {
  const navigate = (path) => {
    window.location.href = path;
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <img
              className="h-16 w-auto cursor-pointer"
              src={logo}
              alt="شعار الشركة"
              onClick={() => navigate('/')}
            />
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4 space-x-reverse">
              <a href="/" className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-lg font-medium">الرئيسية</a>
              <a href="/track" className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-lg font-medium">تتبع شحنتك</a>
              <a href="/about" className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-lg font-medium">من نحن</a>
              
              {/* --- KEY CHANGE: Conditionally render the Dashboard link --- */}
              {(role === 'admin' || role === 'employee') && (
                <a href="/dashboard" className="text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-2 rounded-md text-lg">
                  لوحة التحكم
                </a>
              )}
            </div>
          </div>
          <div>
            {user ?
              (
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                >
                  تسجيل الخروج
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  تسجيل الدخول
                </button>
              )}
          </div>
        </div>
      </div>
    </nav>
  );
}