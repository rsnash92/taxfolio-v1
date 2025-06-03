import { useState } from 'react'
import { Sidebar } from '../layout/Sidebar'
import { Header } from '../layout/Header'
import { PortfolioOverview } from '../dashboard/PortfolioOverview'
import { AccountsPage } from './AccountsPage'
import TransactionsTable from "../pages/TransactionsTable";
import { ReportsPage } from './ReportsPage';
import PricingPage from './PricingPage';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('portfolio')

  const renderContent = () => {
    switch (activeTab) {
      case 'portfolio':
        return <PortfolioOverview />
      case 'accounts':
        return <AccountsPage />
      case 'transactions':
        return <TransactionsTable />
      case 'reports':
        return <ReportsPage />
      case 'pricing':
        return <PricingPage />
      case 'review':
        return (
          <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Review</h1>
            <div className="bg-[#1A1A1A] rounded-lg border border-gray-800 p-4 sm:p-6">
              <p className="text-gray-400 text-sm sm:text-base">Transaction review and reconciliation coming soon...</p>
            </div>
          </div>
        )
      case 'settings':
        return (
          <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Settings</h1>
            <div className="bg-[#1A1A1A] rounded-lg border border-gray-800 p-4 sm:p-6">
              <p className="text-gray-400 text-sm sm:text-base">Account settings and preferences coming soon...</p>
            </div>
          </div>
        )
      default:
        return <PortfolioOverview />
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-black">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main content area with header */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Only show on desktop as mobile has header in Sidebar */}
        <div className="hidden lg:block">
          <Header />
        </div>
        
        {/* Main content with scrolling */}
        <main className="flex-1 overflow-auto bg-black">
          <div className="min-h-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

export const DashboardFooter = () => {
  return (
    <footer className="mt-auto py-6 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            © 2024 TaxFolio. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-gray-900">Privacy Policy</a>
            <a href="#" className="hover:text-gray-900">Terms of Service</a>
            <a href="#" className="hover:text-gray-900">Support</a>
            <a 
              href="/admin" 
              className="text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};