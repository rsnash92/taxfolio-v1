import { useState, useEffect } from 'react';
import { LandingPage } from './components/pages/LandingPage';
import { Dashboard } from './components/pages/Dashboard';
import { AuthModal } from './components/auth/AuthModal';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { useAuthStore } from './store/authStore';
import { useAdminAuthStore } from './store/adminAuthStore';

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const { user } = useAuthStore();
  const { admin } = useAdminAuthStore();

  // Check if we're on admin route
  const isAdminRoute = window.location.pathname.startsWith('/admin');

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

  // Admin routing
  if (isAdminRoute) {
    return admin ? <AdminDashboard /> : <AdminLogin />;
  }

  // Regular user routing
  return (
    <>
      {user ? (
        // User is logged in - show dashboard
        <Dashboard />
      ) : (
        // User not logged in - show landing page
        <LandingPage onLogin={openLogin} onSignup={openSignup} />
      )}

      {/* Auth Modal */}
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

export default App;