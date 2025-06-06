import React from 'react';
import { Search, Calendar, Filter, Eye, Plus, Upload, ChevronLeft, ChevronRight, Copy, ExternalLink, Trash2, Edit3, MoreHorizontal, ArrowUpDown, ChevronDown } from 'lucide-react';
import { useTransactions, useTransactionImport, useAddTransaction } from '../../hooks/useTransactions';
import { TransactionImport } from './TransactionImport';
import { AddTransactionModal } from './AddTransactionModal';
import { CoinIcon } from '../common/CoinIcon';
import { useTransactionIcons } from '../../hooks/useCoinIcons';

export const TransactionsTable: React.FC = () => {
  const {
    transactions,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    totalTransactions,
    uniqueAssets,
    addImportedTransactions,
    addTransaction,
    deleteTransaction
  } = useTransactions();

  const { isImportModalOpen, openImportModal, closeImportModal } = useTransactionImport();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);

  // Preload coin icons for all transactions
  const { loading: iconsLoading } = useTransactionIcons(transactions);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column as any);
      setSortOrder('desc');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Outgoing':
        return '→';
      case 'Incoming':
        return '←';
      case 'Trade':
        return '⇄';
      default:
        return '•';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: '2-digit' 
      }),
      time: date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })
    };
  };

  const formatNumber = (num: number, decimals: number = 6) => {
    return new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
            <span className="text-gray-500 text-sm">{totalTransactions} txs</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={openImportModal}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50 transition-colors"
            >
              <Upload size={16} />
              <span>Import</span>
            </button>
            <button 
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus size={16} />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Find transactions"
                className="bg-white text-gray-900 border border-gray-300 pl-10 pr-4 py-2 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            {/* Date Filter */}
            <button className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2">
              <Calendar size={16} />
              <span>Date</span>
              <ChevronDown size={14} />
            </button>

            {/* Filter */}
            <button className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2">
              <Filter size={16} />
              <span>Filter</span>
              <ChevronDown size={14} />
            </button>

            {/* View */}
            <button className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2">
              <Eye size={16} />
              <span>View</span>
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <select
              className="bg-white border border-gray-300 text-gray-900 px-3 py-2 rounded-md focus:border-blue-500 focus:outline-none text-sm"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{currentPage} of {totalPages}</span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-6 py-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-left">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <ChevronDown size={12} className="inline ml-1 text-gray-400" />
                </th>
                <th className="px-6 py-4 text-left">
                  <button 
                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    onClick={() => handleSort('category')}
                  >
                    <span>Category</span>
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button 
                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    onClick={() => handleSort('date')}
                  >
                    <span>Date</span>
                    <ChevronDown size={12} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outgoing</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incoming</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee (£)</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value (£)</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gain (£)</th>
                <th className="px-6 py-4 text-right">
                  <MoreHorizontal size={16} className="text-gray-400" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((tx, index) => {
                const { date, time } = formatDate(tx.date);
                const txId = `0x${String(tx.id).slice(-3)}`;
                
                return (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {getCategoryIcon(tx.category)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{tx.category}</div>
                          <div className="text-xs text-gray-500">
                            {txId} • {tx.type === 'transfer_in' || tx.type === 'transfer_out' ? 'Token Transfer' : 'Swap'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">{date}</div>
                      <div className="text-xs text-gray-500">{time}</div>
                    </td>
                    <td className="px-6 py-4">
                      {(tx.category === 'Outgoing' || tx.fromAsset) && (
                        <div>
                          <div className="flex items-center space-x-2">
                            <CoinIcon 
                              symbol={tx.fromAsset || tx.asset} 
                              size={20}
                              className="flex-shrink-0"
                            />
                            <span className="text-sm text-gray-900 font-medium">
                              -{formatNumber(tx.fromAmount || tx.amount, 2)} {tx.fromAsset || tx.asset}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{tx.exchange}</div>
                          <div className="text-xs text-gray-400">{txId}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {(tx.category === 'Incoming' || tx.toAsset) && (
                        <div>
                          <div className="flex items-center space-x-2">
                            <CoinIcon 
                              symbol={tx.toAsset || tx.asset} 
                              size={20}
                              className="flex-shrink-0"
                            />
                            <span className="text-sm text-gray-900 font-medium">
                              +{formatNumber(tx.toAmount || tx.amount, 2)} {tx.toAsset || tx.asset}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{tx.exchange}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {tx.fee ? `< ${formatCurrency(tx.fee)}` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-semibold">
                        {formatCurrency(tx.value || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tx.gain !== undefined && (
                        <div className={`text-sm font-medium ${
                          tx.gain > 0 ? 'text-green-600' : tx.gain < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {tx.gain > 0 ? '+' : ''}{formatCurrency(tx.gain)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors">
                          <Copy size={16} />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-50 transition-colors">
                          <ExternalLink size={16} />
                        </button>
                        <button 
                          className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                          onClick={() => deleteTransaction(tx.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-50 transition-colors">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {transactions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No transactions found</div>
              <div className="text-gray-400 text-sm">Try adjusting your filters or import some transactions</div>
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <AddTransactionModal
          onAdd={addTransaction}
          onClose={closeAddModal}
        />
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <TransactionImport
          onImport={addImportedTransactions}
          onClose={closeImportModal}
        />
      )}
    </div>
  );
};

export default TransactionsTable;