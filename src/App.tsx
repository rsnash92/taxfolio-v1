// src/App.tsx
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LandingPage } from './components/pages/LandingPage';
import { Dashboard } from './components/pages/Dashboard';
import { AuthModal } from './components/auth/AuthModal';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { useAuthStore } from './store/authStore';
import { useAdminAuthStore } from './store/adminAuthStore';
import SignupPage from './components/pages/SignupPage';

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

  // Handle different routes
  if (location.pathname === '/signup') {
    // If user is already logged in, redirect to dashboard
    if (user) {
      return <Navigate to="/dashboard" replace />;
    }
    return <SignupPage />;
  }

  if (location.pathname === '/dashboard') {
    // Protected route - redirect to home if not logged in
    if (!user) {
      return <Navigate to="/" replace />;
    }
    return <Dashboard />;
  }

  if (location.pathname.startsWith('/admin')) {
    return admin ? <AdminDashboard /> : <AdminLogin />;
  }

  // Home page
  return (
    <>
      {user ? (
        <Navigate to="/dashboard" replace />
      ) : (
        <LandingPage onLogin={openLogin} onSignup={openSignup} />
      )}

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
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </Router>
  );
}

export default App;