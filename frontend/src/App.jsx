// src/App.jsx — Main Router
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Public pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import SearchPage from './pages/student/SearchPage';
import PropertyDetailPage from './pages/student/PropertyDetailPage';
import MapPage from './pages/student/MapPage';
import FaqPage from './pages/FaqPage';
import ContactPage from './pages/ContactPage';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import MyBookingsPage from './pages/student/MyBookingsPage';
import MyReviewsPage from './pages/student/MyReviewsPage';

// Landlord pages
import LandlordDashboard from './pages/landlord/LandlordDashboard';
import CreateListingPage from './pages/landlord/CreateListingPage';
import EditListingPage from './pages/landlord/EditListingPage';
import ManageListingsPage from './pages/landlord/ManageListingsPage';
import ReservationRequestsPage from './pages/landlord/ReservationRequestsPage';
import LandlordProfilePage from './pages/landlord/LandlordProfilePage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import VerifyLandlordsPage from './pages/admin/VerifyLandlordsPage';
import ModerateListingsPage from './pages/admin/ModerateListingsPage';
import ModerateReviewsPage from './pages/admin/ModerateReviewsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import ManageUsersPage from './pages/admin/ManageUsersPage';

// Route guards
const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner-ring"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    if (user.role === 'Admin') return <Navigate to="/admin" />;
    if (user.role === 'Landlord') return <Navigate to="/landlord" />;
    return <Navigate to="/student" />;
  }
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/property/:id" element={<PropertyDetailPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Student */}
          <Route path="/student" element={<PrivateRoute roles={['Student']}><StudentDashboard /></PrivateRoute>} />
          <Route path="/student/bookings" element={<PrivateRoute roles={['Student']}><MyBookingsPage /></PrivateRoute>} />
          <Route path="/student/reviews" element={<PrivateRoute roles={['Student']}><MyReviewsPage /></PrivateRoute>} />

          {/* Landlord */}
          <Route path="/landlord" element={<PrivateRoute roles={['Landlord']}><LandlordDashboard /></PrivateRoute>} />
          <Route path="/landlord/create" element={<PrivateRoute roles={['Landlord']}><CreateListingPage /></PrivateRoute>} />
          <Route path="/landlord/listings" element={<PrivateRoute roles={['Landlord']}><ManageListingsPage /></PrivateRoute>} />
          <Route path="/landlord/listings/:id/edit" element={<PrivateRoute roles={['Landlord']}><EditListingPage /></PrivateRoute>} />
          <Route path="/landlord/requests" element={<PrivateRoute roles={['Landlord']}><ReservationRequestsPage /></PrivateRoute>} />
          <Route path="/landlord/profile" element={<PrivateRoute roles={['Landlord']}><LandlordProfilePage /></PrivateRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<PrivateRoute roles={['Admin']}><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/verify" element={<PrivateRoute roles={['Admin']}><VerifyLandlordsPage /></PrivateRoute>} />
          <Route path="/admin/listings" element={<PrivateRoute roles={['Admin']}><ModerateListingsPage /></PrivateRoute>} />
          <Route path="/admin/reviews" element={<PrivateRoute roles={['Admin']}><ModerateReviewsPage /></PrivateRoute>} />
          <Route path="/admin/analytics" element={<PrivateRoute roles={['Admin']}><AnalyticsPage /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute roles={['Admin']}><ManageUsersPage /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
