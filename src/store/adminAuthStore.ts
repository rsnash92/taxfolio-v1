import { create } from 'zustand'

interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'super_admin'
  createdAt: string
}

interface AdminAuthState {
  admin: AdminUser | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
}

const ADMIN_KEY = 'taxfolio_admin_user'

// Hardcoded admin credentials for development
// In production, this would be validated against a secure backend
const ADMIN_CREDENTIALS = [
  {
    id: 'admin-1',
    email: 'admin@taxfolio.com',
    password: 'admin123!', // Never do this in production!
    name: 'Admin User',
    role: 'super_admin' as const,
  }
]

// Initialize admin from localStorage
const getInitialAdmin = (): AdminUser | null => {
  try {
    const adminData = localStorage.getItem(ADMIN_KEY)
    if (adminData) {
      return JSON.parse(adminData)
    }
  } catch (error) {
    console.error('Failed to get initial admin:', error)
  }
  return null
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  admin: getInitialAdmin(),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Check credentials
      const adminUser = ADMIN_CREDENTIALS.find(
        admin => admin.email === email && admin.password === password
      )
      
      if (adminUser) {
        const { password: _, ...adminWithoutPassword } = adminUser
        const adminData = {
          ...adminWithoutPassword,
          createdAt: new Date().toISOString()
        }
        
        localStorage.setItem(ADMIN_KEY, JSON.stringify(adminData))
        set({ admin: adminData, isLoading: false })
        return true
      } else {
        set({ error: 'Invalid admin credentials', isLoading: false })
        return false
      }
    } catch (error) {
      set({ error: 'Login failed', isLoading: false })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem(ADMIN_KEY)
    set({ admin: null, error: null })
  },

  clearError: () => {
    set({ error: null })
  },
}))