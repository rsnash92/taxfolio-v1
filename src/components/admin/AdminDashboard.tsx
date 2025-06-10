import React, { useState, useEffect } from 'react'
import { useAdminAuthStore } from '../../store/adminAuthStore'
import { useAdminAnalyticsStore } from '../../store/adminAnalyticsStore'
import {
  Users, TrendingUp, DollarSign, Activity,
  BarChart3, UserCheck, Clock,
  Search, Download, RefreshCw,
  LogOut, Home, Database,
  AlertTriangle, CheckCircle
} from 'lucide-react'

export const AdminDashboard: React.FC = () => {
  const { admin, logout } = useAdminAuthStore()
  const {
    totalUsers, activeUsers, newUsersToday, userGrowthRate,
    totalRevenue, monthlyRecurringRevenue, averageRevenuePerUser, conversionRate,
    userActivity, recentUsers, systemMetrics,
    loadAnalytics, refreshData, searchUsers, updateUserStatus
  } = useAdminAnalyticsStore()

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics' | 'system'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all')

  useEffect(() => {
    loadAnalytics()
    const interval = setInterval(refreshData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [loadAnalytics, refreshData])

  const filteredUsers = searchQuery 
    ? searchUsers(searchQuery)
    : recentUsers.filter(user => filterStatus === 'all' || user.status === filterStatus)

  const MetricCard = ({ title, value, change, icon: Icon, color }: any) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <span className={`text-sm font-medium ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">TaxFolio Admin</h1>
            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
              {admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">Welcome, {admin?.name}</span>
            <button
              onClick={refreshData}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                activeTab === 'overview' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Home className="w-5 h-5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                activeTab === 'users' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Users className="w-5 h-5" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                activeTab === 'analytics' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                activeTab === 'system' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Database className="w-5 h-5" />
              System
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h2>
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Users"
                  value={totalUsers.toLocaleString()}
                  change={userGrowthRate}
                  icon={Users}
                  color="bg-blue-600"
                />
                <MetricCard
                  title="Active Users"
                  value={activeUsers.toLocaleString()}
                  icon={UserCheck}
                  color="bg-green-600"
                />
                <MetricCard
                  title="Total Revenue"
                  value={`$${totalRevenue.toLocaleString()}`}
                  change={8.3}
                  icon={DollarSign}
                  color="bg-purple-600"
                />
                <MetricCard
                  title="MRR"
                  value={`$${monthlyRecurringRevenue.toLocaleString()}`}
                  change={12.5}
                  icon={TrendingUp}
                  color="bg-orange-600"
                />
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Recent User Activity</h3>
                <div className="space-y-3">
                  {userActivity.slice(-7).reverse().map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <span className="text-gray-400">{new Date(activity.date).toLocaleDateString()}</span>
                      <div className="flex gap-6 text-sm">
                        <span className="text-green-400">+{activity.newUsers} new users</span>
                        <span className="text-blue-400">{activity.activeUsers} active</span>
                        <span className="text-purple-400">{activity.totalTransactions} transactions</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>
              
              {/* Search and Filter */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>

              {/* Users Table */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Active</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Transactions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">{user.name}</div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {user.transactionCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.subscriptionTier === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
                            user.subscriptionTier === 'pro' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {user.subscriptionTier}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            user.status === 'inactive' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <select
                            value={user.status}
                            onChange={(e) => updateUserStatus(user.id, e.target.value as any)}
                            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Analytics & Reports</h2>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Conversion Rate</h3>
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">{conversionRate}%</p>
                  <p className="text-sm text-gray-400 mt-2">Free to Paid</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">ARPU</h3>
                    <DollarSign className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">${averageRevenuePerUser.toFixed(2)}</p>
                  <p className="text-sm text-gray-400 mt-2">Average Revenue Per User</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">New Users Today</h3>
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">{newUsersToday}</p>
                  <p className="text-sm text-gray-400 mt-2">+{userGrowthRate}% from yesterday</p>
                </div>
              </div>

              {/* User Growth Chart */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">User Growth (Last 30 Days)</h3>
                <div className="h-64 flex items-end justify-between gap-1">
                  {userActivity.map((day, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 transition-colors rounded-t"
                      style={{ height: `${(day.newUsers / 50) * 100}%` }}
                      title={`${new Date(day.date).toLocaleDateString()}: ${day.newUsers} new users`}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-xs text-gray-400">
                  <span>30 days ago</span>
                  <span>Today</span>
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Revenue by Tier</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400">Enterprise</span>
                        <span className="text-white font-medium">$25,430</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '55%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400">Pro</span>
                        <span className="text-white font-medium">$15,220</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '33%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400">Free</span>
                        <span className="text-white font-medium">$5,028</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-gray-600 h-2 rounded-full" style={{ width: '12%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Transaction Volume</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Transactions</span>
                      <span className="text-white font-medium">2.3M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg. per User</span>
                      <span className="text-white font-medium">1,840</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Processing Rate</span>
                      <span className="text-white font-medium">99.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Failed Transactions</span>
                      <span className="text-red-400 font-medium">4,600</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">System Monitoring</h2>
              
              {/* System Status */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-400">API Calls</h3>
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{(systemMetrics.totalApiCalls / 1000000).toFixed(2)}M</p>
                  <p className="text-xs text-gray-400 mt-2">Last 24 hours</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-400">Avg Response Time</h3>
                    <Clock className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{systemMetrics.averageResponseTime}ms</p>
                  <p className="text-xs text-gray-400 mt-2">P50 latency</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-400">Error Rate</h3>
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{(systemMetrics.errorRate * 100).toFixed(2)}%</p>
                  <p className="text-xs text-gray-400 mt-2">Last hour</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-400">Uptime</h3>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{systemMetrics.uptime}%</p>
                  <p className="text-xs text-gray-400 mt-2">Last 30 days</p>
                </div>
              </div>

              {/* Service Status */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Service Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">API Gateway</span>
                    </div>
                    <span className="text-green-400 text-sm">Operational</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Authentication Service</span>
                    </div>
                    <span className="text-green-400 text-sm">Operational</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      <span className="text-white">Transaction Processing</span>
                    </div>
                    <span className="text-yellow-400 text-sm">Degraded Performance</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Database</span>
                    </div>
                    <span className="text-green-400 text-sm">Operational</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Storage Service</span>
                    </div>
                    <span className="text-green-400 text-sm">Operational</span>
                  </div>
                </div>
              </div>

              {/* Recent Errors */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Errors</h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-red-500 pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Transaction Processing Timeout</span>
                      <span className="text-gray-400 text-sm">2 minutes ago</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">Timeout occurred while processing transaction ID: TX-2024-8934</p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Rate Limit Exceeded</span>
                      <span className="text-gray-400 text-sm">15 minutes ago</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">User ID: usr_9283 exceeded API rate limit</p>
                  </div>
                  <div className="border-l-4 border-red-500 pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Database Connection Failed</span>
                      <span className="text-gray-400 text-sm">1 hour ago</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">Failed to connect to replica database</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}