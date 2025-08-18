// ------------------------------------------------------------------
// FILE: src/App.jsx
// ------------------------------------------------------------------

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import CreateTripPage from './pages/CreateTripPage';
import SignUpPage from './pages/SignUpPage';
// import TripsListPage from './pages/TripsListPage'; // Removed - using TripsManagementPage instead
import TripDetailsPage from './pages/TripDetailsPage';
import CustomerPortalPage from './pages/CustomerPortalPage';
import BranchEntriesPage from './pages/BranchEntriesPage';
import BranchEntryDetailsPage from './pages/BranchEntryDetailsPage';
import PendingDispatchEntriesPage from './pages/PendingDispatchEntriesPage';
import FullyDispatchedEntriesPage from './pages/FullyDispatchedEntriesPage';
import ShipmentsManagementPage from './pages/ShipmentsManagementPage';
import AddShipmentPage from './pages/AddShipmentPage';

import VehiclesManagementPage from './pages/VehiclesManagementPage';
import TripsManagementPage from './pages/TripsManagementPage';
import BranchesManagementPage from './pages/BranchesManagementPage';
import DriversManagementPage from './pages/DriversManagementPage';
import DriverCommissionsPage from './pages/DriverCommissionsPage';
import DailyJournalPage from './pages/DailyJournalPage';
import DebtsManagementPage from './pages/DebtsManagementPage';
import BranchTransfersPage from './pages/BranchTransfersPage';
// import RoutesManagementPage from './pages/RoutesManagementPage'; // Removed - using destination field in vehicles instead


function PublicLayout({ children }) {
  const { user, role } = useAuth();
  return (
    <>
      <Navbar user={user} role={role} />
      <main>{children}</main>
      <Footer />
    </>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}


export default function App() {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
      <Route path="/track/:shipmentId" element={<PublicLayout><TrackingPage /></PublicLayout>} />
      <Route path="/track" element={<PublicLayout><TrackingPage /></PublicLayout>} />

      {/* Auth Routes (Login/Signup) */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUpPage />} />
      
      {/* Protected Employee/Admin Routes */}
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><ShipmentsDashboard user={user} role={role} /></ProtectedRoute>} />
      <Route path="/manifests" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><ManifestPage /></ProtectedRoute>} />
      <Route path="/create-trip" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><CreateTripPage /></ProtectedRoute>} />
      <Route path="/trips" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><TripsManagementPage /></ProtectedRoute>} />
      <Route path="/trip/:tripId" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><TripDetailsPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />
      
      {/* Shipments Management Routes */}
      <Route path="/shipments" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><ShipmentsManagementPage /></ProtectedRoute>} />
      <Route path="/add-shipment" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><AddShipmentPage /></ProtectedRoute>} />
      <Route path="/edit-shipment/:shipmentId" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><AddShipmentPage /></ProtectedRoute>} />
      
      {/* Vehicles Management Routes */}
      <Route path="/vehicles" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><VehiclesManagementPage /></ProtectedRoute>} />
      
      {/* Trips Management Routes - using /trips path */}
      
      {/* Branches Management Routes */}
      <Route path="/branches" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><BranchesManagementPage /></ProtectedRoute>} />
      
      {/* Drivers Management Routes */}
      <Route path="/drivers" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><DriversManagementPage /></ProtectedRoute>} />
      <Route path="/driver-commissions" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><DriverCommissionsPage /></ProtectedRoute>} />
      
      {/* Financial Management Routes */}
      <Route path="/daily-journal" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><DailyJournalPage /></ProtectedRoute>} />
      <Route path="/debts-management" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><DebtsManagementPage /></ProtectedRoute>} />
      <Route path="/branch-transfers" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><BranchTransfersPage /></ProtectedRoute>} />
      
      {/* Routes Management Routes - Removed - using destination field in vehicles instead */}
      
      {/* Branch Entries Management Routes */}
      <Route path="/branch-entries" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><BranchEntriesPage /></ProtectedRoute>} />
      <Route path="/branch-entries/:entryId" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><BranchEntryDetailsPage /></ProtectedRoute>} />
      <Route path="/branch-entries/pending-dispatch" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><PendingDispatchEntriesPage /></ProtectedRoute>} />
      <Route path="/branch-entries/fully-dispatched" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><FullyDispatchedEntriesPage /></ProtectedRoute>} />


      {/* Customer Portal Route */}
      <Route path="/my-shipments" element={<ProtectedRoute allowedRoles={['customer']}><CustomerPortalPage /></ProtectedRoute>} />

      {/* Catch-all 404 Route */}
      <Route path="*" element={<PublicLayout><h1>404 - Page Not Found</h1></PublicLayout>} />
    </Routes>
  );
}
