import { useState, useEffect } from 'react'
import { useTransactionStore } from '../../store/transactionStore'
import { useAuthStore } from '../../store/authStore'
import { TransactionForm } from './TransactionForm'
import TransactionsTable from '../pages/TransactionsTable';

export function TransactionManager() {
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  
  const { user } = useAuthStore()
  const { transactions, taxResults, loadUserTransactions, clearTransactions } = useTransactionStore()

  // Load user transactions when component mounts
  useEffect(() => {
    if (user?.id) {
      loadUserTransactions(user.id)
    }
  }, [user?.id, loadUserTransactions])

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.asset.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || transaction.type === filterType
    return matchesSearch && matchesFilter
  })

  // Sort by date (newest first)
  const sortedTransactions = [...filteredTransactions].sort((a, b) => 
    b.date.getTime() - a.date.getTime()
  )

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all transactions? This cannot be undone.')) {
      clearTransactions()
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
          <p className="text-dark-400">
            Manage your cryptocurrency transactions and track your portfolio
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary-dark px-6 py-3 rounded-lg flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="stat-number text-primary-400">{transactions.length}</p>
          <p className="stat-label">Total Transactions</p>
        </div>
        <div className="stat-card">
          <p className="stat-number text-green-400">
            {transactions.filter(t => t.type === 'buy').length}
          </p>
          <p className="stat-label">Buy Orders</p>
        </div>
        <div className="stat-card">
          <p className="stat-number text-red-400">
            {transactions.filter(t => t.type === 'sell').length}
          </p>
          <p className="stat-label">Sell Orders</p>
        </div>
        <div className="stat-card">
          <p className="stat-number text-accent-400">
            {new Set(transactions.map(t => t.asset)).size}
          </p>
          <p className="stat-label">Unique Assets</p>
        </div>
      </div>

      {/* Tax Summary */}
      {taxResults && (
        <div className="card-dark p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">💰 Tax Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                £{taxResults.totalGains.toFixed(2)}
              </p>
              <p className="text-dark-400 text-sm">Total Gains</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">
                £{taxResults.totalLosses.toFixed(2)}
              </p>
              <p className="text-dark-400 text-sm">Total Losses</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${taxResults.netGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                £{taxResults.netGainLoss.toFixed(2)}
              </p>
              <p className="text-dark-400 text-sm">Net Gain/Loss</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">
                £{taxResults.cgtAllowanceUsed.toFixed(2)}
              </p>
              <p className="text-dark-400 text-sm">CGT Allowance Used</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">
                £{taxResults.estimatedTax.toFixed(2)}
              </p>
              <p className="text-dark-400 text-sm">Estimated Tax</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card-dark p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">🔍</span>
              <input
                type="text"
                placeholder="Search by asset..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-dark pl-10 pr-4 py-2 w-64"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-dark px-4 py-2"
            >
              <option value="all">All Types</option>
              <option value="buy">Buy Only</option>
              <option value="sell">Sell Only</option>
            </select>
          </div>

          {transactions.length > 0 && (
            <button
              onClick={handleClearAll}
              className="btn-secondary-dark px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <span>🗑️</span>
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card-dark">
        <div className="p-6 border-b border-dark-700/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Transaction History</h3>
            <p className="text-dark-400 text-sm">
              Showing {sortedTransactions.length} of {transactions.length} transactions
            </p>
          </div>
        </div>
        
        <TransactionsTable transactions={sortedTransactions} />
      </div>

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}