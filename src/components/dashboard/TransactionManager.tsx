import { useState } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { TransactionForm } from './TransactionForm';
import { format } from 'date-fns';
import { ChevronUp, ChevronDown, Plus, Download, Upload, Search } from 'lucide-react';

export function TransactionManager() {
  const { 
    allTransactions, 
    loading, 
    deleteTransaction, 
    portfolioSummary,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    uniqueAssets
  } = useTransactions();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());

  const handleSelectAll = () => {
    if (selectedTransactions.size === allTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(allTransactions.map(tx => tx.id)));
    }
  };

  const handleSelectTransaction = (id: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (window.confirm(`Delete ${selectedTransactions.size} transactions?`)) {
      for (const id of selectedTransactions) {
        await deleteTransaction(id);
      }
      setSelectedTransactions(new Set());
    }
  };

  const formatValue = (value?: number) => {
    if (!value) return '£0.00';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'buy':
      case 'transfer_in':
      case 'mining':
      case 'staking':
        return 'bg-green-500/20 text-green-400';
      case 'sell':
      case 'transfer_out':
        return 'bg-red-500/20 text-red-400';
      case 'trade':
        return 'bg-blue-500/20 text-blue-400';
      case 'fee':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Transactions</h1>
        <p className="text-gray-400">Manage your cryptocurrency transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#111111] rounded-lg p-6 border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">Portfolio Value</p>
          <p className="text-2xl font-bold text-[#15e49e]">
            {formatValue(portfolioSummary.totalValue)}
          </p>
        </div>
        <div className="bg-[#111111] rounded-lg p-6 border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">Total Gain/Loss</p>
          <p className={`text-2xl font-bold ${portfolioSummary.totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatValue(portfolioSummary.totalGain)}
          </p>
        </div>
        <div className="bg-[#111111] rounded-lg p-6 border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">Total Transactions</p>
          <p className="text-2xl font-bold">{portfolioSummary.totalTransactions}</p>
        </div>
        <div className="bg-[#111111] rounded-lg p-6 border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">Unique Assets</p>
          <p className="text-2xl font-bold">{uniqueAssets.length}</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-[#111111] rounded-lg p-4 mb-6 border border-gray-800">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex gap-3 w-full lg:w-auto">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-[#15e49e] hover:bg-[#13c589] text-black px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
            <button className="bg-[#111111] hover:bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
            <button className="bg-[#111111] hover:bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full bg-black border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[#15e49e] transition-colors"
              />
            </div>

            {/* Filter by Category */}
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="bg-black border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-[#15e49e] transition-colors"
            >
              <option value="">All Categories</option>
              <option value="Incoming">Incoming</option>
              <option value="Outgoing">Outgoing</option>
              <option value="Trade">Trade</option>
              <option value="Fee">Fee</option>
            </select>

            {/* Filter by Asset */}
            <select
              value={filters.asset}
              onChange={(e) => setFilters({ ...filters, asset: e.target.value })}
              className="bg-black border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-[#15e49e] transition-colors"
            >
              <option value="">All Assets</option>
              {uniqueAssets.map(asset => (
                <option key={asset} value={asset}>{asset}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedTransactions.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {selectedTransactions.size} transaction{selectedTransactions.size > 1 ? 's' : ''} selected
            </p>
            <button
              onClick={handleDeleteSelected}
              className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-[#111111] rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.size === allTransactions.length && allTransactions.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 bg-black border-gray-600 rounded focus:ring-[#15e49e] focus:ring-offset-0"
                  />
                </th>
                <th 
                  className="p-4 text-left font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => {
                    if (sortBy === 'date') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('date');
                    }
                  }}
                >
                  Date {sortBy === 'date' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 inline ml-1" /> : <ChevronDown className="w-4 h-4 inline ml-1" />)}
                </th>
                <th className="p-4 text-left font-medium text-gray-400">Type</th>
                <th className="p-4 text-left font-medium text-gray-400">Category</th>
                <th 
                  className="p-4 text-left font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => {
                    if (sortBy === 'asset') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('asset');
                    }
                  }}
                >
                  Asset {sortBy === 'asset' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 inline ml-1" /> : <ChevronDown className="w-4 h-4 inline ml-1" />)}
                </th>
                <th className="p-4 text-right font-medium text-gray-400">Amount</th>
                <th className="p-4 text-right font-medium text-gray-400">Price</th>
                <th className="p-4 text-right font-medium text-gray-400">Value</th>
                <th className="p-4 text-right font-medium text-gray-400">Fee</th>
                <th className="p-4 text-center font-medium text-gray-400">Exchange</th>
                <th className="p-4 text-center font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-gray-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : allTransactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-gray-400">
                    No transactions found
                  </td>
                </tr>
              ) : (
                allTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-800 hover:bg-black/50 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.has(tx.id)}
                        onChange={() => handleSelectTransaction(tx.id)}
                        className="w-4 h-4 bg-black border-gray-600 rounded focus:ring-[#15e49e] focus:ring-offset-0"
                      />
                    </td>
                    <td className="p-4">
                      {format(new Date(tx.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(tx.type)}`}>
                        {tx.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-400">{tx.category}</span>
                    </td>
                    <td className="p-4 font-medium">
                      {tx.asset}
                    </td>
                    <td className="p-4 text-right">
                      {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    </td>
                    <td className="p-4 text-right">
                      {tx.price ? formatValue(tx.price) : '-'}
                    </td>
                    <td className="p-4 text-right font-medium">
                      {formatValue(tx.value)}
                    </td>
                    <td className="p-4 text-right">
                      {tx.fee ? formatValue(tx.fee) : '-'}
                    </td>
                    <td className="p-4 text-center text-sm text-gray-400">
                      {tx.exchange}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => deleteTransaction(tx.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Form */}
      {showAddForm && (
        <TransactionForm onClose={() => setShowAddForm(false)} />
      )}
    </div>
  );
}