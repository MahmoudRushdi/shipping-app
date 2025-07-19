import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import ShipmentsDashboard from './pages/ShipmentsDashboard';
import TrackingPage from './pages/TrackingPage';
import AdminPage from './pages/AdminPage';
import ManifestPage from './pages/ManifestPage';
import SignUpPage from './pages/SignUpPage';
import TripsListPage from './pages/TripsListPage';
import TripDetailsPage from './pages/TripDetailsPage'; // <-- Import the new page

function PublicLayout({ children, user, role }) {
  // ... (component is unchanged)
  return (
    <>
      <Navbar user={user} role={role} />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export default function App() {
  const { user, role, isLoading } = useAuth();
  const path = window.location.pathname;

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>;
  }

  // --- Updated protected routes check ---
  if (!user && (path === '/dashboard' || path === '/admin' || path === '/manifests' || path.startsWith('/trip'))) {
    window.location.href = '/login';
    return null;
  }
  // Other redirect logic is unchanged...
   if (user && (path === '/login' || path === '/signup')) {
    if (role === 'admin' || role === 'employee') {
      window.location.href = '/dashboard';
      return null;
    }
    if (role === 'customer') {
      window.location.href = '/';
      return null;
    }
  }

  switch (true) {
    case path === '/':
      return <PublicLayout user={user} role={role}><HomePage /></PublicLayout>;
    case path === '/about':
      return <PublicLayout user={user} role={role}><AboutPage /></PublicLayout>;
    case path === '/login':
      return <LoginPage />;
    case path === '/signup':
      return <SignUpPage />;
    case path === '/dashboard':
      if (role === 'admin' || role === 'employee') {
        return <ShipmentsDashboard user={user} role={role} />;
      }
      window.location.href = '/';
      return null;
    case path === '/admin':
      if (role === 'admin') {
        return <AdminPage />;
      }
      window.location.href = '/';
      return null;
    case path === '/manifests':
      if (role === 'admin' || role === 'employee') {
        return <ManifestPage />;
      }
      window.location.href = '/';
      return null;
    case path === '/trips':
       if (role === 'admin' || role === 'employee') {
        return <TripsListPage />;
      }
      window.location.href = '/';
      return null;
    // --- Add the new dynamic route for trip details ---
    case path.startsWith('/trip/'):
       if (role === 'admin' || role === 'employee') {
        return <TripDetailsPage />;
      }
      window.location.href = '/';
      return null;
    // ---------------------------------------------
    default:
      if (path.startsWith('/track')) {
        return <PublicLayout user={user} role={role}><TrackingPage /></PublicLayout>;
      }
      return <PublicLayout user={user} role={role}><h1>404 - الصفحة غير موجودة</h1></PublicLayout>;
  }
}