// src/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name?: string
  email: string
  createdAt: string
  tier?: string
  is_verified?: boolean
  transactionCount?: number
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  isInitialized: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
  initializeAuth: () => void
  updateTransactionCount: (count: number) => void
}

// Helper to get auth headers
export const getAuthHeaders = (): HeadersInit => {
  const state = useAuthStore.getState()
  const token = state.token || localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })

          const data = await response.json()
          
          if (response.ok && (data.token || data.accessToken)) {
            // Handle both field names
            const token = data.token || data.accessToken;
            
            // Store user and token
            set({ 
              user: data.user, 
              token: token,
              isLoading: false,
              error: null,
              isInitialized: true
            })
            
            // Also store in localStorage for backward compatibility
            if (data.accessToken) {
              localStorage.setItem('accessToken', data.accessToken);
            }
            if (data.refreshToken) {
              localStorage.setItem('refreshToken', data.refreshToken);
            }
            
            return true
          } else {
            set({ 
              error: data.message || data.error || 'Invalid email or password', 
              isLoading: false 
            })
            return false
          }
        } catch (error) {
          console.error('Login error:', error)
          set({ 
            error: 'Network error. Please check your connection.', 
            isLoading: false 
          })
          return false
        }
      },

      signup: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
          })

          const data = await response.json()
          
          if (response.ok) {
            // If the API returns a token immediately (user is verified)
            if (data.token || data.accessToken) {
              const token = data.token || data.accessToken;
              
              set({ 
                user: data.user, 
                token: token,
                isLoading: false,
                error: null,
                isInitialized: true
              })
              
              // Store tokens in localStorage
              if (data.accessToken) {
                localStorage.setItem('accessToken', data.accessToken);
              }
              if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
              }
              
              return true
            } else {
              // Email verification required
              set({ 
                isLoading: false,
                error: null 
              })
              return true
            }
          } else {
            set({ 
              error: data.message || data.error || 'Signup failed', 
              isLoading: false 
            })
            return false
          }
        } catch (error) {
          console.error('Signup error:', error)
          set({ 
            error: 'Network error. Please check your connection.', 
            isLoading: false 
          })
          return false
        }
      },

      logout: () => {
        // Optional: Call logout endpoint
        const { token } = get()
        if (token) {
          fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              ...getAuthHeaders(),
              'Content-Type': 'application/json',
            },
          }).catch(console.error)
        }
        
        // Clear localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Clear local state
        set({ 
          user: null, 
          token: null, 
          error: null,
          isInitialized: false 
        })
      },

      clearError: () => {
        set({ error: null })
      },

      initializeAuth: async () => {
        // Check both zustand state and localStorage
        const stateToken = get().token;
        const localToken = localStorage.getItem('accessToken');
        const token = stateToken || localToken;
        
        if (!token) {
          set({ isInitialized: true })
          return
        }

        try {
          // Validate token with backend
          const response = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`
            },
          })
          
          if (response.ok) {
            const data = await response.json()
            set({ 
              user: data.user || data,
              token: token,
              isInitialized: true 
            })
          } else {
            // Token is invalid
            get().logout()
            set({ isInitialized: true })
          }
        } catch (error) {
          console.error('Auth initialization error:', error)
          set({ isInitialized: true })
        }
      },

      updateTransactionCount: (count: number) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, transactionCount: count } })
        }
      },
    }),
    {
      name: 'taxfolio-auth',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
    }
  )
)