// src/App.tsx
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LandingPage } from './components/pages/LandingPage';
import { Dashboard } from './components/pages/Dashboard';
import { LoginPage } from './components/pages/LoginPage';
import { AuthModal } from './components/auth/AuthModal';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { useAuthStore } from './store/authStore';
import { useAdminAuthStore } from './store/adminAuthStore';
import SignupPage from './components/pages/SignupPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const location = useLocation();

  // Check both user state and localStorage token
  const isAuthenticated = !!user || !!localStorage.getItem('accessToken');

  if (!isAuthenticated) {
    // Redirect to login page and save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  
  // Check both user state and localStorage token
  const isAuthenticated = !!user || !!localStorage.getItem('accessToken');

  if (isAuthenticated) {
    // Redirect to dashboard if already logged in
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const location = useLocation();

  const { user } = useAuthStore();
  const { admin } = useAdminAuthStore();

  const openLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const openSignup = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  // Admin routes
  if (location.pathname.startsWith('/admin')) {
    return admin ? <AdminDashboard /> : <AdminLogin />;
  }

  return (
    <>
      <Routes>
        {/* Root route - redirect based on auth status */}
        <Route path="/" element={
          user || localStorage.getItem('accessToken') ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        {/* Public routes - redirect to dashboard if logged in */}
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        
        <Route path="/signup" element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        } />

        {/* Landing page with modal auth */}
        <Route path="/welcome" element={
          <PublicRoute>
            <LandingPage onLogin={openLogin} onSignup={openSignup} />
          </PublicRoute>
        } />

        {/* Protected routes - redirect to login if not logged in */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Add other protected routes here */}
        <Route path="/transactions" element={
          <ProtectedRoute>
            {/* <TransactionsPage /> */}
            <div>Transactions Page</div>
          </ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute>
            {/* <ReportsPage /> */}
            <div>Reports Page</div>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            {/* <SettingsPage /> */}
            <div>Settings Page</div>
          </ProtectedRoute>
        } />

        {/* 404 fallback */}
        <Route path="*" element={
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white">404</h1>
              <p className="mt-2 text-gray-400">Page not found</p>
              <a href="/" className="mt-4 inline-block text-[#15e49e] hover:text-[#13c589]">
                Go home
              </a>
            </div>
          </div>
        } />
      </Routes>

      {/* Auth Modal for landing page */}
      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={closeAuthModal}
          onSwitchMode={(mode) => setAuthMode(mode)}
        />
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </Router>
  );
}

// Separate admin routes for cleaner organization
function AdminRoutes() {
  const { admin } = useAdminAuthStore();
  
  return (
    <Routes>
      <Route path="/login" element={admin ? <Navigate to="/admin" replace /> : <AdminLogin />} />
      <Route path="/" element={admin ? <AdminDashboard /> : <Navigate to="/admin/login" replace />} />
      <Route path="/*" element={admin ? <AdminDashboard /> : <Navigate to="/admin/login" replace />} />
    </Routes>
  );
}

export default App;