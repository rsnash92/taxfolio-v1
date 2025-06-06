import React, { useState, useMemo } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { CoinIcon } from '../common/CoinIcon';

interface AccountType {
  id: string;
  name: string;
  type: 'Blockchain' | 'Exchange' | 'Wallet';
  synced: string;
  txCount: number;
  assets: Array<{
    asset: string;
    amount: number;
    value: number;
  }>;
  totalBalance: number;
  icon: string;
  color: string;
  status: 'connected' | 'syncing' | 'error' | 'disconnected';
  lastSync?: Date;
  apiKey?: string;
  address?: string;
}

interface RecommendedAccount {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'Exchange' | 'Blockchain';
  description: string;
}

// Account connection configurations
const SUPPORTED_CONNECTIONS = {
  // Exchanges
  coinbase: {
    name: 'Coinbase',
    type: 'Exchange' as const,
    icon: '🟦',
    color: 'bg-blue-500',
    apiRequired: true,
    description: 'Connect your Coinbase Pro/Advanced account'
  },
  binance: {
    name: 'Binance',
    type: 'Exchange' as const,
    icon: '🟨',
    color: 'bg-yellow-500',
    apiRequired: true,
    description: 'Connect your Binance account'
  },
  kraken: {
    name: 'Kraken',
    type: 'Exchange' as const,
    icon: '🟣',
    color: 'bg-purple-600',
    apiRequired: true,
    description: 'Connect your Kraken account'
  },
  
  // Blockchain wallets
  metamask: {
    name: 'MetaMask',
    type: 'Wallet' as const,
    icon: '🦊',
    color: 'bg-orange-500',
    apiRequired: false,
    description: 'Connect your MetaMask wallet'
  },
  walletconnect: {
    name: 'WalletConnect',
    type: 'Wallet' as const,
    icon: '🔗',
    color: 'bg-blue-600',
    apiRequired: false,
    description: 'Connect any WalletConnect compatible wallet'
  },
  
  // Blockchain networks
  ethereum: {
    name: 'Ethereum',
    type: 'Blockchain' as const,
    icon: '⟡',
    color: 'bg-gray-700',
    apiRequired: false,
    description: 'Add Ethereum address'
  },
  bitcoin: {
    name: 'Bitcoin',
    type: 'Blockchain' as const,
    icon: '₿',
    color: 'bg-orange-600',
    apiRequired: false,
    description: 'Add Bitcoin address'
  },
  base: {
    name: 'Base',
    type: 'Blockchain' as const,
    icon: '🔵',
    color: 'bg-blue-500',
    apiRequired: false,
    description: 'Add Base network address'
  },
  arbitrum: {
    name: 'Arbitrum',
    type: 'Blockchain' as const,
    icon: '🔷',
    color: 'bg-blue-600',
    apiRequired: false,
    description: 'Add Arbitrum address'
  }
};

export function AccountsPage() {
  const { allTransactions, portfolioSummary, getPriceForAsset, getValueForAmount } = useTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'totalBalance' | 'name' | 'txCount'>('totalBalance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState<string | null>(null);

  // Process transactions to create account summary
  const accounts = useMemo(() => {
    const accountMap = new Map<string, AccountType>();
    
    // Group transactions by exchange/source
    allTransactions.forEach(tx => {
      const exchangeName = tx.exchange || 'Unknown';
      
      if (!accountMap.has(exchangeName)) {
        // Determine account type and styling based on exchange name
        let type: 'Blockchain' | 'Exchange' | 'Wallet' = 'Exchange';
        let icon = '🏛️';
        let color = 'bg-gray-500';
        
        if (exchangeName.toLowerCase().includes('metamask') || exchangeName.toLowerCase().includes('wallet')) {
          type = 'Wallet';
          icon = '🦊';
          color = 'bg-orange-500';
        } else if (exchangeName.toLowerCase().includes('base')) {
          type = 'Blockchain';
          icon = '🔵';
          color = 'bg-blue-500';
        } else if (exchangeName.toLowerCase().includes('ethereum')) {
          type = 'Blockchain';
          icon = '⟡';
          color = 'bg-gray-700';
        } else if (exchangeName.toLowerCase().includes('arbitrum')) {
          type = 'Blockchain';
          icon = '🔷';
          color = 'bg-blue-600';
        } else if (exchangeName.toLowerCase().includes('coinbase')) {
          type = 'Exchange';
          icon = '🟦';
          color = 'bg-blue-500';
        }
        
        accountMap.set(exchangeName, {
          id: exchangeName.toLowerCase().replace(/\s+/g, '-'),
          name: exchangeName,
          type,
          synced: '10h', // Mock sync time - will be real when connected
          txCount: 0,
          assets: [],
          totalBalance: 0,
          icon,
          color,
          status: 'connected', // Mock status - will be real when connected
          lastSync: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // Mock last sync
        });
      }
      
      const account = accountMap.get(exchangeName)!;
      account.txCount++;
    });
    
    // Calculate balances and assets for each account
    accountMap.forEach(account => {
      const accountTransactions = allTransactions.filter(tx => tx.exchange === account.name);
      const assetBalances = new Map<string, number>();
      
      // Calculate asset balances for this account
      accountTransactions.forEach(tx => {
        const currentBalance = assetBalances.get(tx.asset) || 0;
        
        switch (tx.type) {
          case 'buy':
          case 'transfer_in':
          case 'mining':
          case 'staking':
            assetBalances.set(tx.asset, currentBalance + tx.amount);
            break;
          case 'sell':
          case 'transfer_out':
            assetBalances.set(tx.asset, currentBalance - tx.amount);
            break;
          case 'trade':
            if (tx.fromAsset && tx.fromAmount) {
              const fromBalance = assetBalances.get(tx.fromAsset) || 0;
              assetBalances.set(tx.fromAsset, fromBalance - tx.fromAmount);
            }
            if (tx.toAsset && tx.toAmount) {
              const toBalance = assetBalances.get(tx.toAsset) || 0;
              assetBalances.set(tx.toAsset, toBalance + tx.toAmount);
            }
            break;
        }
      });
      
      // Convert to assets array and calculate total balance
      account.assets = Array.from(assetBalances.entries())
        .filter(([_, amount]) => amount > 0.00001) // Filter out dust
        .map(([asset, amount]) => ({
          asset,
          amount,
          value: getValueForAmount(asset, amount)
        }))
        .sort((a, b) => b.value - a.value);
      
      account.totalBalance = account.assets.reduce((sum, asset) => sum + asset.value, 0);
    });
    
    return Array.from(accountMap.values());
  }, [allTransactions, getValueForAmount]);

  // Get recommended accounts based on transaction patterns
  const recommendedAccounts = useMemo(() => {
    const connectedAccountNames = new Set(accounts.map(acc => acc.name.toLowerCase()));
    const recommendations: RecommendedAccount[] = [];
    
    // Suggest popular exchanges if not connected
    if (!connectedAccountNames.has('coinbase')) {
      recommendations.push({
        id: 'coinbase',
        name: 'Coinbase',
        icon: '🟦',
        color: 'bg-blue-500',
        type: 'Exchange',
        description: 'Popular US exchange with easy fiat onramp'
      });
    }
    
    if (!connectedAccountNames.has('binance')) {
      recommendations.push({
        id: 'binance',
        name: 'Binance',
        icon: '🟨',
        color: 'bg-yellow-500',
        type: 'Exchange',
        description: 'World\'s largest crypto exchange'
      });
    }
    
    return recommendations;
  }, [accounts]);

  const filteredAccounts = accounts
    .filter(account => 
      account.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'totalBalance':
          comparison = a.totalBalance - b.totalBalance;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'txCount':
          comparison = a.txCount - b.txCount;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  };

  const getTimeSinceSync = (lastSync?: Date) => {
    if (!lastSync) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    return 'Just now';
  };

  const handleSort = (column: 'totalBalance' | 'name' | 'txCount') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: 'totalBalance' | 'name' | 'txCount') => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handleAddAccount = (accountType: string) => {
    setSelectedAccountType(accountType);
    setShowAddAccountModal(true);
  };

  const getStatusColor = (status: AccountType['status']) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'syncing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: AccountType['status']) => {
    switch (status) {
      case 'connected': return '✅';
      case 'syncing': return '🔄';
      case 'error': return '❌';
      case 'disconnected': return '⭕';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
        <button 
          onClick={() => setShowAddAccountModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
        >
          <span>+</span>
          <span>Add account</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-3">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Account</span>
            </div>
            <div className="col-span-2 flex items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute left-2.5 top-2.5 text-gray-400">
                  🔍
                </div>
              </div>
            </div>
            <div className="col-span-1 text-center">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Synced</span>
            </div>
            <div className="col-span-1 text-center">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Type</span>
            </div>
            <div className="col-span-1 text-center">
              <button
                onClick={() => handleSort('txCount')}
                className="text-sm font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 flex items-center space-x-1"
              >
                <span>Tx</span>
                <span className="text-xs">{getSortIcon('txCount')}</span>
              </button>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Assets</span>
            </div>
            <div className="col-span-2 text-right">
              <button
                onClick={() => handleSort('totalBalance')}
                className="text-sm font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 flex items-center space-x-1 ml-auto"
              >
                <span>Balance</span>
                <span className="text-xs">{getSortIcon('totalBalance')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Account Rows */}
        <div className="divide-y divide-gray-200">
          {filteredAccounts.map((account) => (
            <div key={account.id} className="p-6 hover:bg-gray-50 transition-colors group">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Account Name & Icon */}
                <div className="col-span-3 flex items-center space-x-3">
                  <div className={`w-8 h-8 ${account.color} rounded-full flex items-center justify-center text-white text-sm font-medium`}>
                    {account.icon}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{account.name}</div>
                    <div className={`text-sm flex items-center space-x-1 ${getStatusColor(account.status)}`}>
                      <span>{getStatusIcon(account.status)}</span>
                      <span>{account.status === 'connected' ? 'Connected' : 'Connection issue'}</span>
                    </div>
                  </div>
                </div>

                {/* Empty search column */}
                <div className="col-span-2"></div>

                {/* Synced Status */}
                <div className="col-span-1 text-center">
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-sm ${getStatusColor(account.status)}`}>
                    <span>{getTimeSinceSync(account.lastSync)}</span>
                    <span>🔄</span>
                  </div>
                </div>

                {/* Type */}
                <div className="col-span-1 text-center">
                  <span className="text-sm text-gray-600">{account.type}</span>
                </div>

                {/* Transaction Count */}
                <div className="col-span-1 text-center">
                  <span className="text-sm font-medium text-gray-900">{account.txCount}</span>
                </div>

                {/* Assets */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-1">
                    {account.assets.slice(0, 4).map((asset, index) => (
                      <div key={asset.asset} className="flex items-center">
                        <CoinIcon
                          symbol={asset.asset}
                          size={20}
                          className="flex-shrink-0"
                        />
                      </div>
                    ))}
                    {account.assets.length > 4 && (
                      <div className="text-sm text-gray-500 ml-1">
                        +{account.assets.length - 4}
                      </div>
                    )}
                  </div>
                </div>

                {/* Balance & Actions */}
                <div className="col-span-2 flex items-center justify-between">
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{formatCurrency(account.totalBalance)}</div>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      className="text-gray-400 hover:text-gray-600 text-sm"
                      title="Refresh account"
                    >
                      🔄
                    </button>
                    <button 
                      className="text-gray-400 hover:text-gray-600 text-sm"
                      title="Account settings"
                    >
                      ⚙️
                    </button>
                    <button className="text-gray-400 hover:text-gray-600 text-sm">
                      ⋮
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAccounts.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">🔗</span>
            </div>
            <p className="text-gray-500 font-medium">No accounts found</p>
            <p className="text-gray-400 text-sm">
              {searchTerm ? 'Try adjusting your search' : 'Connect your first account to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Recommended Accounts Section */}
      {recommendedAccounts.length > 0 && (
        <div className="mt-8">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-sm font-medium">
                    Recommended accounts
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Connect popular exchanges and wallets to improve your portfolio tracking accuracy.
                </p>
                
                {/* Recommended Account Cards */}
                <div className="space-y-3">
                  {recommendedAccounts.map((account) => (
                    <div key={account.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 ${account.color} rounded-full flex items-center justify-center text-white text-sm`}>
                            {account.icon}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">{account.name}</span>
                            <p className="text-sm text-gray-500">{account.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => handleAddAccount(account.id)}
                            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center space-x-1"
                          >
                            <span>+</span>
                            <span>Add account</span>
                          </button>
                          <button className="text-gray-400 hover:text-gray-600 text-sm">
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add Account</h2>
              <button 
                onClick={() => setShowAddAccountModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(SUPPORTED_CONNECTIONS).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => handleAddAccount(key)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className={`w-12 h-12 ${config.color} rounded-full flex items-center justify-center text-white text-lg mx-auto mb-2`}>
                      {config.icon}
                    </div>
                    <div className="text-sm font-medium text-gray-900">{config.name}</div>
                    <div className="text-xs text-gray-500">{config.type}</div>
                  </button>
                ))}
              </div>
              
              <div className="text-center text-sm text-gray-500 pt-4">
                More integrations coming soon!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Footer */}
      <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
        <div>
          Showing {filteredAccounts.length} of {accounts.length} accounts
        </div>
        <div className="flex items-center space-x-4">
          <span>Total Balance: {formatCurrency(accounts.reduce((sum, acc) => sum + acc.totalBalance, 0))}</span>
          <span>•</span>
          <span>Total Transactions: {accounts.reduce((sum, acc) => sum + acc.txCount, 0)}</span>
        </div>
      </div>
    </div>
  );
}