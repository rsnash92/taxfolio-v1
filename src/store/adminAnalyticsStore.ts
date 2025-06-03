import { create } from 'zustand'

interface UserActivity {
  date: string
  newUsers: number
  activeUsers: number
  totalTransactions: number
}

interface UserData {
  id: string
  name: string
  email: string
  createdAt: string
  lastLogin: string
  transactionCount: number
  subscriptionTier: 'free' | 'pro' | 'enterprise'
  status: 'active' | 'inactive' | 'suspended'
}

interface SystemMetrics {
  totalApiCalls: number
  averageResponseTime: number
  errorRate: number
  uptime: number
}

interface AdminAnalyticsState {
  // User metrics
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  userGrowthRate: number
  
  // Business metrics
  totalRevenue: number
  monthlyRecurringRevenue: number
  averageRevenuePerUser: number
  conversionRate: number
  
  // Activity data
  userActivity: UserActivity[]
  recentUsers: UserData[]
  
  // System metrics
  systemMetrics: SystemMetrics
  
  // Actions
  loadAnalytics: () => void
  refreshData: () => void
  searchUsers: (query: string) => UserData[]
  updateUserStatus: (userId: string, status: 'active' | 'inactive' | 'suspended') => void
}

// Generate mock data
const generateMockUserActivity = (): UserActivity[] => {
  const activities: UserActivity[] = []
  const today = new Date()
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    activities.push({
      date: date.toISOString().split('T')[0],
      newUsers: Math.floor(Math.random() * 50) + 10,
      activeUsers: Math.floor(Math.random() * 200) + 100,
      totalTransactions: Math.floor(Math.random() * 1000) + 500,
    })
  }
  
  return activities
}

const generateMockUsers = (): UserData[] => {
  const users: UserData[] = []
  const tiers: Array<'free' | 'pro' | 'enterprise'> = ['free', 'pro', 'enterprise']
  const statuses: Array<'active' | 'inactive' | 'suspended'> = ['active', 'inactive', 'suspended']
  
  // Get existing users from localStorage if any
  const existingUsers = JSON.parse(localStorage.getItem('taxfolio_users') || '[]')
  
  // Convert existing users to admin format
  existingUsers.forEach((user: any) => {
    users.push({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      transactionCount: user.transactionCount || Math.floor(Math.random() * 1000),
      subscriptionTier: tiers[Math.floor(Math.random() * tiers.length)],
      status: 'active',
    })
  })
  
  // Add some mock users
  for (let i = 1; i <= 20; i++) {
    users.push({
      id: `user-${i}`,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      transactionCount: Math.floor(Math.random() * 1000),
      subscriptionTier: tiers[Math.floor(Math.random() * tiers.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
    })
  }
  
  return users
}

export const useAdminAnalyticsStore = create<AdminAnalyticsState>((set, get) => ({
  // Initialize with mock data
  totalUsers: 1250,
  activeUsers: 892,
  newUsersToday: 23,
  userGrowthRate: 12.5,
  
  totalRevenue: 45678,
  monthlyRecurringRevenue: 12345,
  averageRevenuePerUser: 36.54,
  conversionRate: 3.2,
  
  userActivity: generateMockUserActivity(),
  recentUsers: generateMockUsers(),
  
  systemMetrics: {
    totalApiCalls: 1234567,
    averageResponseTime: 145,
    errorRate: 0.02,
    uptime: 99.9,
  },
  
  loadAnalytics: () => {
    // In real app, this would fetch from API
    set({
      userActivity: generateMockUserActivity(),
      recentUsers: generateMockUsers(),
      totalUsers: get().totalUsers + Math.floor(Math.random() * 10),
      activeUsers: get().activeUsers + Math.floor(Math.random() * 5),
    })
  },
  
  refreshData: () => {
    // Simulate data refresh
    set({
      systemMetrics: {
        ...get().systemMetrics,
        totalApiCalls: get().systemMetrics.totalApiCalls + Math.floor(Math.random() * 1000),
      }
    })
  },
  
  searchUsers: (query: string) => {
    const users = get().recentUsers
    return users.filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    )
  },
  
  updateUserStatus: (userId: string, status: 'active' | 'inactive' | 'suspended') => {
    set({
      recentUsers: get().recentUsers.map(user =>
        user.id === userId ? { ...user, status } : user
      )
    })
  },
}))