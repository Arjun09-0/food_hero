import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterSelectPage from './pages/RegisterSelectPage';
import DonorRegisterPage from './pages/DonorRegisterPage';
import VolunteerRegisterPage from './pages/VolunteerRegisterPage';
import DonorPage from './pages/DonorPage';
import VolunteerPage from './pages/VolunteerPage';
import AdminPage from './pages/AdminPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';

// Protected route wrapper
function Protected({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', color: '#6b8f74' }}>
      <div style={{ fontSize: '2.5rem' }}>🍱</div>
      <div style={{ fontSize: '0.9rem' }}>Loading FoodHero…</div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <LoginPage />} />
      {/* Registration — role selection + separate pages */}
      <Route path="/register" element={user ? <Navigate to={`/${user.role}`} replace /> : <RegisterSelectPage />} />
      <Route path="/register/donor" element={user ? <Navigate to={`/${user.role}`} replace /> : <DonorRegisterPage />} />
      <Route path="/register/volunteer" element={<VolunteerRegisterPage />} />
      {/* OAuth callback */}
      <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
      {/* Dashboards */}
      <Route path="/donor" element={<Protected role="donor"><DonorPage /></Protected>} />
      <Route path="/volunteer" element={<Protected role="volunteer"><VolunteerPage /></Protected>} />
      <Route path="/admin" element={<Protected role="admin"><AdminPage /></Protected>} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? `/${user.role}` : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
