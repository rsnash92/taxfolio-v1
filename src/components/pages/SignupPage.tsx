// src/pages/SignupPage.tsx
import React, { useState } from 'react';
import { Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const API_URL = 'https://app.taxfolio.io/api';

interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: number;
    email: string;
    tier: string;
  };
  message?: string;
  error?: string;
}

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isLogin && password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data: AuthResponse = await response.json();

      if (response.ok) {
        if (isLogin && data.accessToken && data.refreshToken) {
          // Store tokens
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          
          // Navigate to dashboard
          navigate('/dashboard');
        } else if (!isLogin) {
          setSuccess('Registration successful! Please check your email to verify your account.');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          // Switch to login mode after 3 seconds
          setTimeout(() => setIsLogin(true), 3000);
        }
      } else {
        setError(data.error || 'An error occurred. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isLogin || (!isLogin && confirmPassword)) {
        handleSubmit();
      }
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">TaxFolio</h1>
          <p className="text-gray-400">
            {isLogin ? 'Welcome back' : 'Accurate crypto taxes. No guesswork.'}
          </p>
        </div>

        <div className="bg-[#111111] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-6">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>

          {success && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-500/20 rounded-lg flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#15e49e] focus:ring-1 focus:ring-[#15e49e] transition-colors"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#15e49e] focus:ring-1 focus:ring-[#15e49e] transition-colors pr-12"
                  placeholder={isLogin ? 'Enter your password' : 'Create a password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#15e49e] focus:ring-1 focus:ring-[#15e49e] transition-colors"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
              </div>
            )}

            {isLogin && (
              <div className="text-right">
                <a 
                  href="/forgot-password" 
                  className="text-sm text-[#15e49e] hover:text-[#13c589] transition-colors"
                >
                  Forgot your password?
                </a>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 px-4 bg-[#15e49e] hover:bg-[#13c589] text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#15e49e] focus:ring-offset-2 focus:ring-offset-black"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign in' : 'Create account'
              )}
            </button>
          </div>

          {/* OAuth section - ready for future implementation */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#111111] text-gray-400">OR</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button 
                className="w-full py-3 px-4 bg-black border border-gray-800 rounded-lg text-white font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-gray-700"
                onClick={() => setError('OAuth coming soon!')}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign {isLogin ? 'in' : 'up'} with Google
              </button>
              
              <button 
                className="w-full py-3 px-4 bg-black border border-gray-800 rounded-lg text-white font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-gray-700"
                onClick={() => setError('OAuth coming soon!')}
              >
                <svg className="w-5 h-5" viewBox="0 0 1024 1024" fill="#0052FF">
                  <circle cx="512" cy="512" r="512"/>
                  <path fill="white" d="M516.3 361.83c60.28 0 108.1 37.18 126.26 92.47H764C742 336.09 644.47 256 517.27 256 372.82 256 260 365.65 260 512.49S370 768 517.27 768c124.35 0 223.82-80.09 245.84-199.28H642.55c-17.22 55.3-65 93.45-125.32 93.45-83.23 0-141.92-63.67-141.92-151.68s58.69-150.66 140.95-150.66z"/>
                </svg>
                Sign {isLogin ? 'in' : 'up'} with Coinbase
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-400">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccess('');
                }}
                className="text-[#15e49e] hover:text-[#13c589] font-medium transition-colors focus:outline-none"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By creating an account you agree to the{' '}
              <a href="/terms" className="text-[#15e49e] hover:text-[#13c589]">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-[#15e49e] hover:text-[#13c589]">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-gray-400">
            <Check className="w-4 h-4 text-[#15e49e]" />
            <span className="text-sm">HMRC Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Check className="w-4 h-4 text-[#15e49e]" />
            <span className="text-sm">Bank-level Security</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;