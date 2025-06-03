import { create } from 'zustand'

interface User {
  id: string
  name: string
  email: string
  createdAt: string
  transactionCount?: number
}

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  isInitialized: boolean // Add this flag
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
  initializeAuth: () => void
  updateTransactionCount: (count: number) => void
}

// Mock user database (in real app, this would be your backend)
const USERS_KEY = 'taxfolio_users'
const CURRENT_USER_KEY = 'taxfolio_current_user'

// Initialize user from localStorage immediately
const getInitialUser = (): User | null => {
  try {
    const currentUser = localStorage.getItem(CURRENT_USER_KEY)
    if (currentUser) {
      const user = JSON.parse(currentUser)
      // Add mock transaction count if not exists
      if (!user.transactionCount) {
        user.transactionCount = Math.floor(Math.random() * 2000) + 500
      }
      return user
    }
  } catch (error) {
    console.error('Failed to get initial user:', error)
  }
  return null
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getInitialUser(), // Initialize with user from localStorage
  isLoading: false,
  error: null,
  isInitialized: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    
    try {
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
      const user = users.find((u: any) => u.email === email && u.password === password)
      
      if (user) {
        // Remove password before storing user
        const { password: _, ...userWithoutPassword } = user
        
        // Add mock transaction count if not exists
        if (!userWithoutPassword.transactionCount) {
          userWithoutPassword.transactionCount = Math.floor(Math.random() * 2000) + 500
        }
        
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword))
        set({ user: userWithoutPassword, isLoading: false })
        return true
      } else {
        set({ error: 'Invalid email or password', isLoading: false })
        return false
      }
    } catch (error) {
      set({ error: 'Login failed', isLoading: false })
      return false
    }
  },

  signup: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null })
    
    try {
      // Get existing users
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
      
      // Check if user already exists
      if (users.some((u: any) => u.email === email)) {
        set({ error: 'User with this email already exists', isLoading: false })
        return false
      }
      
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password, // In real app, this would be hashed
        createdAt: new Date().toISOString(),
        transactionCount: Math.floor(Math.random() * 1000) + 100,
      }
      
      // Save to localStorage
      users.push(newUser)
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
      
      // Log the user in
      const { password: _, ...userWithoutPassword } = newUser
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword))
      set({ user: userWithoutPassword, isLoading: false })
      return true
    } catch (error) {
      set({ error: 'Signup failed', isLoading: false })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY)
    set({ user: null, error: null })
  },

  clearError: () => {
    set({ error: null })
  },

  initializeAuth: () => {
    // This is now mainly for re-initialization if needed
    try {
      const currentUser = localStorage.getItem(CURRENT_USER_KEY)
      if (currentUser) {
        const user = JSON.parse(currentUser)
        
        // Add mock transaction count if not exists
        if (!user.transactionCount) {
          user.transactionCount = Math.floor(Math.random() * 2000) + 500
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
        }
        
        set({ user, isInitialized: true })
      } else {
        set({ isInitialized: true })
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      set({ isInitialized: true })
    }
  },

  updateTransactionCount: (count: number) => {
    const { user } = get()
    if (user) {
      const updatedUser = { ...user, transactionCount: count }
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser))
      set({ user: updatedUser })
    }
  },
}))