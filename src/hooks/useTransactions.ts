import { useState, useEffect, useMemo } from 'react';
import { useAssetPrices } from './usePrices';
import { useAuthStore } from '../store/authStore';

const API_URL = 'https://app.taxfolio.io/api';

export interface Transaction {
  id: string;
  date: string;
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out' | 'trade' | 'fee' | 'mining' | 'staking';
  category: 'Outgoing' | 'Incoming' | 'Trade' | 'Fee';
  asset: string;
  amount: number;
  price?: number;
  value?: number;
  fee?: number;
  feeAsset?: string;
  fromAsset?: string;
  fromAmount?: number;
  toAsset?: string;
  toAmount?: number;
  exchange: string;
  txHash?: string;
  notes?: string;
  gain?: number;
}

// Convert import types to display categories
const getCategoryFromType = (type: Transaction['type']): Transaction['category'] => {
  switch (type) {
    case 'buy':
    case 'transfer_in':
    case 'mining':
    case 'staking':
      return 'Incoming';
    case 'sell':
    case 'transfer_out':
      return 'Outgoing';
    case 'trade':
      return 'Trade';
    case 'fee':
      return 'Fee';
    default:
      return 'Trade';
  }
};

// Helper to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('accessToken');
  return token ? { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  };
};

export const useTransactions = () => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions from backend when component mounts or user changes
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
      if (!token) {
        setTransactions([]);
        setLoading(false);
        return;
      }

    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/transactions`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          throw new Error('Please log in again');
        }
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      
      // Transform backend data to match your frontend format if needed
      const transformedTransactions = data.map((tx: any) => ({
        ...tx,
        category: getCategoryFromType(tx.type),
      }));

      setTransactions(transformedTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get live prices for all assets in transactions
  const { prices, loading: pricesLoading, getPriceForAsset, getValueForAmount } = useAssetPrices(transactions);

  const [filters, setFilters] = useState({
    search: '',
    dateRange: '',
    category: '',
    asset: ''
  });

  const [sortBy, setSortBy] = useState<keyof Transaction>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Filter and sort transactions (same as before)
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.asset.toLowerCase().includes(searchLower) ||
        tx.exchange.toLowerCase().includes(searchLower) ||
        tx.category.toLowerCase().includes(searchLower) ||
        tx.txHash?.toLowerCase().includes(searchLower) ||
        tx.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(tx => tx.category === filters.category);
    }

    // Apply asset filter
    if (filters.asset) {
      filtered = filtered.filter(tx => tx.asset === filters.asset);
    }

    // Apply date range filter
    if (filters.dateRange) {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.dateRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      filtered = filtered.filter(tx => new Date(tx.date) >= startDate);
    }

    // Sort transactions
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [transactions, filters, sortBy, sortOrder]);

  // Pagination
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Add imported transactions - save to backend
  const addImportedTransactions = async (importedTransactions: any[]) => {
    try {
      const newTransactions: Transaction[] = importedTransactions.map(imported => ({
        ...imported,
        category: getCategoryFromType(imported.type),
        value: imported.amount * (imported.price || 0),
        gain: imported.gain || 0
      }));

      // Send to backend
      const response = await fetch(`${API_URL}/transactions/bulk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ transactions: newTransactions }),
      });

      if (!response.ok) {
        throw new Error('Failed to import transactions');
      }

      // Refresh transactions from backend
      await fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import transactions');
      console.error('Error importing transactions:', err);
    }
  };

  // Add single transaction - save to backend
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const newTransaction = {
        ...transaction,
        category: getCategoryFromType(transaction.type)
      };

      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newTransaction),
      });

      if (!response.ok) {
        throw new Error('Failed to add transaction');
      }

      // Refresh transactions from backend
      await fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add transaction');
      console.error('Error adding transaction:', err);
    }
  };

  // Update transaction - save to backend
  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update transaction');
      }

      // Refresh transactions from backend
      await fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transaction');
      console.error('Error updating transaction:', err);
    }
  };

  // Delete transaction - delete from backend
  const deleteTransaction = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      // Remove from local state immediately for better UX
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
      console.error('Error deleting transaction:', err);
      // Refresh to ensure consistency
      await fetchTransactions();
    }
  };

  // Get unique assets for filter
  const uniqueAssets = useMemo(() => {
    const assets = new Set(transactions.map(tx => tx.asset));
    return Array.from(assets).sort();
  }, [transactions]);

  // Get portfolio summary with live prices (same as before)
  const portfolioSummary = useMemo(() => {
    const holdings = new Map<string, { amount: number; value: number; currentPrice: number }>();
    
    transactions.forEach(tx => {
      if (!holdings.has(tx.asset)) {
        holdings.set(tx.asset, { amount: 0, value: 0, currentPrice: 0 });
      }
      
      const holding = holdings.get(tx.asset)!;
      
      switch (tx.type) {
        case 'buy':
        case 'transfer_in':
        case 'mining':
        case 'staking':
          holding.amount += tx.amount;
          break;
        case 'sell':
        case 'transfer_out':
          holding.amount -= tx.amount;
          break;
        case 'trade':
          if (tx.fromAsset && tx.toAsset) {
            // Handle from asset
            if (!holdings.has(tx.fromAsset)) {
              holdings.set(tx.fromAsset, { amount: 0, value: 0, currentPrice: 0 });
            }
            const fromHolding = holdings.get(tx.fromAsset)!;
            fromHolding.amount -= tx.fromAmount || 0;
            
            // Handle to asset
            if (!holdings.has(tx.toAsset)) {
              holdings.set(tx.toAsset, { amount: 0, value: 0, currentPrice: 0 });
            }
            const toHolding = holdings.get(tx.toAsset)!;
            toHolding.amount += tx.toAmount || 0;
          }
          break;
      }
    });

    // Calculate current values using live prices
    let totalValue = 0;
    const holdingsArray = Array.from(holdings.entries())
      .filter(([_, holding]) => holding.amount > 0.00001) // Filter out dust
      .map(([asset, holding]) => {
        const currentPrice = getPriceForAsset(asset);
        const currentValue = getValueForAmount(asset, holding.amount);
        
        totalValue += currentValue;
        
        return {
          asset,
          amount: holding.amount,
          value: currentValue,
          currentPrice
        };
      })
      .sort((a, b) => b.value - a.value);

    // Calculate total gains (simplified - would need historical cost basis for accuracy)
    const totalCostBasis = transactions
      .filter(tx => tx.type === 'buy' || tx.type === 'transfer_in')
      .reduce((sum, tx) => sum + (tx.value || 0), 0);
    
    const totalGain = totalValue - totalCostBasis;
    
    return {
      holdings: holdingsArray,
      totalValue,
      totalGain,
      totalTransactions: transactions.length,
      pricesLoading
    };
  }, [transactions, getPriceForAsset, getValueForAmount, pricesLoading]);

  return {
    transactions: paginatedTransactions,
    allTransactions: transactions,
    filteredTransactions,
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
    totalTransactions: filteredTransactions.length,
    uniqueAssets,
    portfolioSummary,
    addImportedTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    // Price-related data
    prices,
    pricesLoading,
    getPriceForAsset,
    getValueForAmount,
    // Loading and error states
    loading,
    error,
    refetch: fetchTransactions
  };
};

// Hook for managing the import modal (same as before)
export const useTransactionImport = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const openImportModal = () => setIsImportModalOpen(true);
  const closeImportModal = () => setIsImportModalOpen(false);
  
  return {
    isImportModalOpen,
    openImportModal,
    closeImportModal
  };
};

// Hook for managing the add transaction modal (same as before)
export const useAddTransaction = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);
  
  return {
    isAddModalOpen,
    openAddModal,
    closeAddModal
  };
};