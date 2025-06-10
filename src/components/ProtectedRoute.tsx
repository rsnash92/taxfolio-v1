import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore'; // Adjust path based on your structure

export function ProtectedRoute() {
  const { user } = useAuthStore();
  const location = useLocation();

  // Since we're using localStorage for tokens, we can check if user exists
  const isAuthenticated = !!user || !!localStorage.getItem('accessToken');

  if (!isAuthenticated) {
    // Redirect to login and save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
}

// Component for public routes that redirects authenticated users
export function PublicRoute() {
  const { user } = useAuthStore();
  
  // Check both user state and localStorage token
  const isAuthenticated = !!user || !!localStorage.getItem('accessToken');

  if (isAuthenticated) {
    // Redirect to dashboard if already authenticated
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

// Loading component for auth initialization
export function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <svg className="animate-spin h-8 w-8 text-[#15e49e] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-2 text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}