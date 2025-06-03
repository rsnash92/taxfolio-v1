import { useState, useEffect, useMemo } from 'react';
import { useAssetPrices } from './usePrices';

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

// Sample data that matches your current UI
const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    date: '2024-05-23T17:31:21.000Z',
    type: 'transfer_out',
    category: 'Outgoing',
    asset: 'USDC',
    amount: 13789.68173,
    value: 10248.97,
    fee: 0.01,
    feeAsset: 'ETH',
    exchange: 'Meta Mask (Base)',
    gain: -0.01
  },
  {
    id: '2',
    date: '2024-05-23T17:31:21.000Z',
    type: 'trade',
    category: 'Trade',
    fromAsset: 'USDC',
    fromAmount: 300331.47612,
    toAsset: 'BRETT',
    toAmount: 13789.68175,
    asset: 'BRETT',
    amount: 13789.68175,
    value: 10248.97,
    fee: 0.03,
    feeAsset: 'ETH',
    exchange: 'Meta Mask (Base)',
    gain: 1549.74
  },
  {
    id: '3',
    date: '2024-05-23T17:31:21.000Z',
    type: 'transfer_in',
    category: 'Incoming',
    asset: 'BRETT',
    amount: 300332.67680,
    value: 11908.16,
    exchange: 'Meta Mask (Base)'
  },
  {
    id: '4',
    date: '2024-05-23T17:31:21.000Z',
    type: 'transfer_out',
    category: 'Outgoing',
    asset: 'BRETT',
    amount: 70454.00000,
    value: 4546.75,
    fee: 0.01,
    feeAsset: 'ETH',
    exchange: 'Meta Mask (Base)',
    gain: -0.01
  },
  {
    id: '5',
    date: '2024-05-23T17:31:21.000Z',
    type: 'transfer_out',
    category: 'Outgoing',
    asset: 'BRETT',
    amount: 30000.00000,
    value: 1785.04,
    fee: 0.01,
    feeAsset: 'ETH',
    exchange: 'Meta Mask (Base)',
    gain: -0.01
  },
  {
    id: '6',
    date: '2024-05-23T17:31:21.000Z',
    type: 'trade',
    category: 'Trade',
    fromAsset: 'USDC',
    fromAmount: 7950.67800,
    toAsset: 'BRETT',
    toAmount: 139377.48677,
    asset: 'BRETT',
    amount: 139377.48677,
    value: 5519.99,
    fee: 0.20,
    feeAsset: 'ETH',
    exchange: 'Meta Mask (Base)',
    gain: -0.13
  }
];

export const useTransactions = () => {
  // Initialize transactions from localStorage or use sample data
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const stored = localStorage.getItem('taxfolio-transactions');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing stored transactions:', error);
        return SAMPLE_TRANSACTIONS;
      }
    }
    return SAMPLE_TRANSACTIONS;
  });

  // Save to localStorage whenever transactions change
  useEffect(() => {
    localStorage.setItem('taxfolio-transactions', JSON.stringify(transactions));
  }, [transactions]);

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

  // Filter and sort transactions
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

  // Add imported transactions
  const addImportedTransactions = (importedTransactions: any[]) => {
    const newTransactions: Transaction[] = importedTransactions.map(imported => ({
      ...imported,
      category: getCategoryFromType(imported.type),
      value: imported.amount * (imported.price || 0),
      gain: imported.gain || 0
    }));

    setTransactions(prev => [...newTransactions, ...prev]);
  };

  // Add single transaction
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      category: getCategoryFromType(transaction.type)
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  // Update transaction
  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(tx => 
      tx.id === id ? { ...tx, ...updates, category: getCategoryFromType(updates.type || tx.type) } : tx
    ));
  };

  // Delete transaction
  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  // Get unique assets for filter
  const uniqueAssets = useMemo(() => {
    const assets = new Set(transactions.map(tx => tx.asset));
    return Array.from(assets).sort();
  }, [transactions]);

  // Get portfolio summary with live prices
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
    getValueForAmount
  };
};

// Hook for managing the import modal
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

// Hook for managing the add transaction modal
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