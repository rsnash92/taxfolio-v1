import { useAuthStore } from '../../store/authStore'
import { ChevronRight, X, HelpCircle, MoreHorizontal, BarChart3, CreditCard, ArrowRightLeft, CheckCircle, FileText, Settings, LogOut, Lock, Menu } from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const sidebarItems = [
  { id: 'portfolio', label: 'Portfolio', icon: BarChart3 },
  { id: 'accounts', label: 'Accounts', icon: CreditCard },
  { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
  { id: 'review', label: 'Review', icon: CheckCircle, badge: '3' },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const [showSupport, setShowSupport] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleTabChange = (tab: string) => {
    onTabChange(tab)
    setIsMobileMenuOpen(false) // Close mobile menu when tab changes
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-[#111111] border-b border-[#262626] px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#15e49e] rounded-md flex items-center justify-center">
              <span className="text-black font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-semibold text-white">TaxFolio</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
          <div className="fixed inset-y-0 left-0 w-80 max-w-sm bg-[#111111] shadow-xl">
            <MobileMenuContent 
              activeTab={activeTab}
              onTabChange={handleTabChange}
              user={user}
              logout={logout}
              showSupport={showSupport}
              setShowSupport={setShowSupport}
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-80 bg-[#111111] border-e-2 border-[#262626] flex-col h-screen">
        <SidebarContent 
          activeTab={activeTab}
          onTabChange={onTabChange}
          user={user}
          logout={logout}
          showSupport={showSupport}
          setShowSupport={setShowSupport}
        />
      </div>
    </>
  )
}

// Shared sidebar content component
function SidebarContent({ 
  activeTab, 
  onTabChange, 
  user, 
  logout, 
  showSupport, 
  setShowSupport 
}: {
  activeTab: string
  onTabChange: (tab: string) => void
  user: any
  logout: () => void
  showSupport: boolean
  setShowSupport: (show: boolean) => void
}) {
  return (
    <>
      {/* Header */}
      <div className="p-6 border-b border-[#262626]">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-[#15e49e] rounded-md flex items-center justify-center">
            <span className="text-black font-bold text-sm">T</span>
          </div>
          <span className="text-xl font-semibold text-white">TaxFolio</span>
        </div>

        {/* Pricing CTA */}
        <div className="bg-gradient-to-r from-[#15e49e] to-[#12c584] rounded-lg p-4 text-black mb-2">
          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-center">
                You have {user?.transactionCount?.toLocaleString() || 0} transactions
              </span>
            </div>
          </div>
          <button
            onClick={() => onTabChange('pricing')}
            className="w-full bg-black bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-lg px-4 py-3 text-center transition-all duration-200 border border-black border-opacity-20"
          >
            <div className="flex items-center justify-center space-x-2">
              <Lock size={16} />
              <span className="font-semibold text-xs">Unlock tax savings</span>
            </div>
          </button>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4 px-2">
          Menu
        </div>
        
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = activeTab === item.id
            const IconComponent = item.icon
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#15e49e] text-black shadow-sm'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <IconComponent 
                    size={18} 
                    className={`${
                      isActive ? 'text-black' : 'text-gray-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {item.badge && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      isActive 
                        ? 'bg-black bg-opacity-20 text-black' 
                        : 'bg-[#15e49e] bg-opacity-20 text-[#15e49e]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight 
                    size={14} 
                    className={`${
                      isActive ? 'text-black' : 'text-gray-500 group-hover:text-gray-300'
                    }`} 
                  />
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Support Section */}
      {showSupport && (
        <div className="px-4 pb-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-[#262626] relative">
            <button
              onClick={() => setShowSupport(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X size={16} />
            </button>
            
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-[#15e49e] bg-opacity-20 rounded-full flex items-center justify-center">
                <HelpCircle size={16} className="text-[#15e49e]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Need Support?</div>
              </div>
            </div>
            
            <p className="text-sm text-gray-400 mb-4">
              Contact with one of our experts to get support.
            </p>

            {/* Expert Profile */}
            <div className="flex items-center justify-between bg-black rounded-lg p-3 border border-[#262626]">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">EB</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Tax Expert</div>
                  <div className="text-xs text-gray-400">Chief Officer</div>
                </div>
              </div>
              <button className="text-gray-500 hover:text-gray-300 transition-colors">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Section with Sign Out */}
      <div className="px-4 pb-6">
        <div className="bg-black rounded-lg p-3 border border-[#262626]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-[#15e49e] to-[#12c584] rounded-full flex items-center justify-center">
                <span className="text-black text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white truncate">
                  {user?.name || 'User'}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {user?.email || 'user@example.com'}
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors w-full py-2 px-2 rounded-md hover:bg-gray-900"
          >
            <LogOut size={16} className="text-gray-500" />
            <span className="text-sm font-medium">Sign out</span>
          </button>
        </div>
      </div>
    </>
  )
}

// Mobile menu content with close button
function MobileMenuContent({ 
  activeTab, 
  onTabChange, 
  user, 
  logout, 
  showSupport, 
  setShowSupport,
  onClose 
}: {
  activeTab: string
  onTabChange: (tab: string) => void
  user: any
  logout: () => void
  showSupport: boolean
  setShowSupport: (show: boolean) => void
  onClose: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Mobile menu header with close button */}
      <div className="flex items-center justify-between p-4 border-b border-[#262626]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#15e49e] rounded-md flex items-center justify-center">
            <span className="text-black font-bold text-sm">T</span>
          </div>
          <span className="text-xl font-semibold text-white">TaxFolio</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <X size={20} />
        </button>
      </div>
      
      <SidebarContent 
        activeTab={activeTab}
        onTabChange={onTabChange}
        user={user}
        logout={logout}
        showSupport={showSupport}
        setShowSupport={setShowSupport}
      />
    </div>
  )
}