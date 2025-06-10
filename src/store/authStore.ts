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
  const stateToken = state.token
  const localToken = localStorage.getItem('accessToken')
  const token = stateToken || localToken
  
  console.log('getAuthHeaders() called:', { 
    hasToken: !!token, 
    tokenLength: token?.length,
    stateToken: !!stateToken,
    localStorageToken: !!localToken,
    usingToken: stateToken ? 'state' : localToken ? 'localStorage' : 'none',
    tokenValue: token ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : 'null'
  });
  
  // If we have a localStorage token but no state token, sync them
  if (localToken && !stateToken && !state.isLoading) {
    console.log('Syncing localStorage token to state')
    useAuthStore.setState({ token: localToken })
  }
  
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
  
  console.log('getAuthHeaders() returning:', {
    hasAuthHeader: !!(headers as any).Authorization,
    headerKeys: Object.keys(headers),
    authHeaderLength: (headers as any).Authorization?.length,
    fullHeaders: headers
  });
  
  return headers
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
        console.log('Initializing auth...')
        
        // First check if we already have state from persistence
        const currentState = get()
        console.log('Current auth state:', { 
          hasUser: !!currentState.user, 
          hasToken: !!currentState.token,
          isInitialized: currentState.isInitialized 
        })
        
        // Also check localStorage directly
        const localToken = localStorage.getItem('accessToken')
        console.log('localStorage token check:', { hasLocalToken: !!localToken })
        
        // Use token from state first, then localStorage
        const token = currentState.token || localToken
        
        if (!token) {
          console.log('No token found, setting initialized to true')
          set({ isInitialized: true })
          return
        }
        
        // If we have a localStorage token but no state token, restore it
        if (localToken && !currentState.token) {
          console.log('Restoring token from localStorage to state')
          set({ token: localToken })
        }

        try {
          console.log('Validating token with backend...')
          // Validate token with backend
          const response = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`
            },
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log('Token valid, setting user data')
            set({ 
              user: data.user || data,
              token: token,
              isInitialized: true 
            })
            
            // Ensure localStorage is in sync
            if (!localStorage.getItem('accessToken')) {
              localStorage.setItem('accessToken', token)
            }
          } else {
            console.log('Token invalid, logging out')
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
      version: 1,
      onRehydrateStorage: () => {
        console.log('Starting auth store rehydration...')
        return (state, error) => {
          if (error) {
            console.error('Error during auth store rehydration:', error)
          } else {
            console.log('Auth store rehydrated:', {
              hasUser: !!state?.user,
              hasToken: !!state?.token
            })
            // After rehydration, check if we need to initialize
            if (state && !state.isInitialized) {
              console.log('Triggering auth initialization after rehydration')
              setTimeout(() => state.initializeAuth(), 100)
            }
          }
        }
      }
    }
  )
)