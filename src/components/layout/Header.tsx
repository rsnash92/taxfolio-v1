import { useState, useRef, useEffect } from 'react'
import { Bell, Search, HelpCircle, ChevronDown, LogOut, User, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function Header() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    // Clear localStorage tokens
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    
    // Call the logout function from auth store
    logout()
    
    // Navigate to login page
    navigate('/login')
  }

  return (
    <header className="bg-[#1A1A1A] border-b border-gray-800 sticky top-0 z-30">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8">
        {/* Left side - Logo/Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#15e49e] rounded-md flex items-center justify-center">
            <span className="text-black font-bold text-sm">T</span>
          </div>
          <span className="text-xl font-semibold text-white">TaxFolio</span>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-4">
          {/* Search button - hidden on mobile */}
          <button className="hidden sm:flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <Search size={20} />
          </button>

          {/* Notifications */}
          <button className="relative flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-[#15e49e] rounded-full"></span>
          </button>

          {/* Help */}
          <button className="hidden sm:flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <HelpCircle size={20} />
          </button>

          {/* Get Cash button */}
          <button className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-[#15e49e] text-black rounded-lg font-medium hover:bg-[#13d391] transition-colors">
            <span>💰</span>
            <span>Get £500 cash</span>
          </button>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 pl-4 border-l border-gray-800 hover:bg-gray-800 rounded-lg p-2 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-[#15e49e] to-[#12c584] rounded-full flex items-center justify-center">
                <span className="text-black text-sm font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-sm font-medium text-white">{user?.name || 'User'}</div>
                <div className="text-xs text-gray-400">{user?.email || 'user@example.com'}</div>
              </div>
              <ChevronDown 
                size={16} 
                className={`text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1A1A1A] border border-gray-800 rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    navigate('/settings')
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <User size={16} />
                  <span>Profile</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    navigate('/settings')
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
                
                <div className="border-t border-gray-800 my-1"></div>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-red-400 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}