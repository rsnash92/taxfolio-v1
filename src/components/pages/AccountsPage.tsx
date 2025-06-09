import React, { useState, useMemo } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { CoinIcon } from '../common/CoinIcon';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Settings, 
  MoreVertical, 
  Link2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

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
  type: 'Exchange' | 'Blockchain' | 'Wallet';
  description: string;
}

// Account connection configurations
const SUPPORTED_CONNECTIONS = {
  // Exchanges
  coinbase: {
    name: 'Coinbase',
    type: 'Exchange' as const,
    icon: '🟦',
    apiRequired: true,
    description: 'Connect your Coinbase Pro/Advanced account',
    fields: ['apiKey', 'apiSecret'] as string[]
  },
  binance: {
    name: 'Binance',
    type: 'Exchange' as const,
    icon: '🟨',
    apiRequired: true,
    description: 'Connect your Binance account',
    fields: ['apiKey', 'apiSecret'] as string[]
  },
  kraken: {
    name: 'Kraken',
    type: 'Exchange' as const,
    icon: '🟣',
    apiRequired: true,
    description: 'Connect your Kraken account',
    fields: ['apiKey', 'apiSecret'] as string[]
  },
  
  // Blockchain wallets
  metamask: {
    name: 'MetaMask',
    type: 'Wallet' as const,
    icon: '🦊',
    apiRequired: false,
    description: 'Connect your MetaMask wallet',
    fields: [] as string[]
  },
  walletconnect: {
    name: 'WalletConnect',
    type: 'Wallet' as const,
    icon: '🔗',
    apiRequired: false,
    description: 'Connect any WalletConnect compatible wallet',
    fields: [] as string[]
  },
  
  // Blockchain networks
  ethereum: {
    name: 'Ethereum',
    type: 'Blockchain' as const,
    icon: '⟡',
    apiRequired: false,
    description: 'Add Ethereum address',
    fields: ['address'] as string[]
  },
  bitcoin: {
    name: 'Bitcoin',
    type: 'Blockchain' as const,
    icon: '₿',
    apiRequired: false,
    description: 'Add Bitcoin address',
    fields: ['address'] as string[]
  },
  base: {
    name: 'Base',
    type: 'Blockchain' as const,
    icon: '🔵',
    apiRequired: false,
    description: 'Add Base network address',
    fields: ['address'] as string[]
  },
  arbitrum: {
    name: 'Arbitrum',
    type: 'Blockchain' as const,
    icon: '🔷',
    apiRequired: false,
    description: 'Add Arbitrum address',
    fields: ['address'] as string[]
  }
} as const;

type SupportedConnectionType = keyof typeof SUPPORTED_CONNECTIONS;

export function AccountsPage() {
  const { allTransactions, portfolioSummary, getPriceForAsset, getValueForAmount } = useTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'totalBalance' | 'name' | 'txCount'>('totalBalance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState<SupportedConnectionType | null>(null);
  const [connectionForm, setConnectionForm] = useState({
    apiKey: '',
    apiSecret: '',
    address: '',
    name: ''
  });

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
        
        const exchangeLower = exchangeName.toLowerCase();
        if (exchangeLower.includes('metamask') || exchangeLower.includes('wallet')) {
          type = 'Wallet';
          icon = '🦊';
        } else if (exchangeLower.includes('base')) {
          type = 'Blockchain';
          icon = '🔵';
        } else if (exchangeLower.includes('ethereum')) {
          type = 'Blockchain';
          icon = '⟡';
        } else if (exchangeLower.includes('arbitrum')) {
          type = 'Blockchain';
          icon = '🔷';
        } else if (exchangeLower.includes('coinbase')) {
          type = 'Exchange';
          icon = '🟦';
        } else if (exchangeLower.includes('binance')) {
          type = 'Exchange';
          icon = '🟨';
        } else if (exchangeLower.includes('kraken')) {
          type = 'Exchange';
          icon = '🟣';
        }
        
        accountMap.set(exchangeName, {
          id: exchangeName.toLowerCase().replace(/\s+/g, '-'),
          name: exchangeName,
          type,
          synced: '10h',
          txCount: 0,
          assets: [],
          totalBalance: 0,
          icon,
          color,
          status: 'connected',
          lastSync: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
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
        .filter(([_, amount]) => amount > 0.00001)
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

  // Get recommended accounts
  const recommendedAccounts = useMemo(() => {
    const connectedAccountNames = new Set(accounts.map(acc => acc.name.toLowerCase()));
    const recommendations: RecommendedAccount[] = [];
    
    if (!connectedAccountNames.has('coinbase')) {
      recommendations.push({
        id: 'coinbase',
        name: 'Coinbase',
        icon: '🟦',
        type: 'Exchange',
        description: 'Popular US exchange with easy fiat onramp'
      });
    }
    
    if (!connectedAccountNames.has('binance')) {
      recommendations.push({
        id: 'binance',
        name: 'Binance',
        icon: '🟨',
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
      maximumFractionDigits: 2
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

  const handleAddAccount = (accountType: SupportedConnectionType) => {
    setSelectedAccountType(accountType);
    setConnectionForm({ apiKey: '', apiSecret: '', address: '', name: '' });
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual connection logic
    console.log('Connecting:', selectedAccountType, connectionForm);
    setShowAddAccountModal(false);
    setSelectedAccountType(null);
  };

  const getStatusIcon = (status: AccountType['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-[#15e49e]" />;
      case 'syncing':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Accounts</h1>
        <button 
          onClick={() => setShowAddAccountModal(true)}
          className="bg-[#15e49e] hover:bg-[#13c589] text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add account
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-[#111111] rounded-lg border border-gray-800 overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-gray-800 p-6">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-3 text-sm font-medium text-gray-400 uppercase tracking-wider">
              Account
            </div>
            <div className="col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#15e49e] transition-colors"
                />
              </div>
            </div>
            <div className="col-span-1 text-center text-sm font-medium text-gray-400 uppercase tracking-wider">
              Synced
            </div>
            <div className="col-span-1 text-center text-sm font-medium text-gray-400 uppercase tracking-wider">
              Type
            </div>
            <div className="col-span-1 text-center">
              <button
                onClick={() => handleSort('txCount')}
                className="text-sm font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
              >
                Tx <SortIcon field="txCount" />
              </button>
            </div>
            <div className="col-span-2 text-center text-sm font-medium text-gray-400 uppercase tracking-wider">
              Assets
            </div>
            <div className="col-span-2 text-right">
              <button
                onClick={() => handleSort('totalBalance')}
                className="text-sm font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
              >
                Balance <SortIcon field="totalBalance" />
              </button>
            </div>
          </div>
        </div>

        {/* Account Rows */}
        <div className="divide-y divide-gray-800">
          {filteredAccounts.map((account) => (
            <div key={account.id} className="p-6 hover:bg-black/50 transition-colors group">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Account Name & Icon */}
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#111111] border border-gray-700 rounded-full flex items-center justify-center text-lg">
                    {account.icon}
                  </div>
                  <div>
                    <div className="font-medium">{account.name}</div>
                    <div className="text-sm flex items-center gap-1.5 mt-0.5">
                      {getStatusIcon(account.status)}
                      <span className={
                        account.status === 'connected' ? 'text-[#15e49e]' :
                        account.status === 'syncing' ? 'text-blue-400' :
                        account.status === 'error' ? 'text-red-400' :
                        'text-gray-400'
                      }>
                        {account.status === 'connected' ? 'Connected' :
                         account.status === 'syncing' ? 'Syncing' :
                         account.status === 'error' ? 'Error' :
                         'Disconnected'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Empty search column */}
                <div className="col-span-2"></div>

                {/* Synced Status */}
                <div className="col-span-1 text-center">
                  <div className="inline-flex items-center gap-1 text-sm text-gray-400">
                    <span>{getTimeSinceSync(account.lastSync)}</span>
                    <RefreshCw className="w-3 h-3" />
                  </div>
                </div>

                {/* Type */}
                <div className="col-span-1 text-center">
                  <span className="text-sm text-gray-400">{account.type}</span>
                </div>

                {/* Transaction Count */}
                <div className="col-span-1 text-center">
                  <span className="text-sm font-medium">{account.txCount}</span>
                </div>

                {/* Assets */}
                <div className="col-span-2">
                  <div className="flex items-center gap-1">
                    {account.assets.slice(0, 4).map((asset) => (
                      <CoinIcon
                        key={asset.asset}
                        symbol={asset.asset}
                        size={20}
                      />
                    ))}
                    {account.assets.length > 4 && (
                      <span className="text-sm text-gray-400 ml-1">
                        +{account.assets.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Balance & Actions */}
                <div className="col-span-2 flex items-center justify-between">
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(account.totalBalance)}</div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-gray-400 hover:text-white p-1">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-white p-1">
                      <Settings className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-white p-1">
                      <MoreVertical className="w-4 h-4" />
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
            <div className="w-16 h-16 bg-[#111111] rounded-full flex items-center justify-center mx-auto mb-4">
              <Link2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 font-medium">No accounts found</p>
            <p className="text-gray-500 text-sm mt-1">
              {searchTerm ? 'Try adjusting your search' : 'Connect your first account to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Recommended Accounts Section */}
      {recommendedAccounts.length > 0 && (
        <div className="mt-8">
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <span className="text-[#15e49e]">💡</span>
                Recommended accounts
              </h3>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Connect popular exchanges and wallets to improve your portfolio tracking accuracy.
            </p>
            
            {/* Recommended Account Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedAccounts.map((account) => (
                <div key={account.id} className="bg-black border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#111111] rounded-full flex items-center justify-center text-lg">
                        {account.icon}
                      </div>
                      <div>
                        <div className="font-medium">{account.name}</div>
                        <p className="text-sm text-gray-400">{account.description}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (account.id in SUPPORTED_CONNECTIONS) {
                          handleAddAccount(account.id as SupportedConnectionType);
                          setShowAddAccountModal(true);
                        }
                      }}
                      className="text-[#15e49e] hover:text-[#13c589] text-sm font-medium flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add account
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {!selectedAccountType ? (
              // Account Selection
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Add Account</h2>
                  <button 
                    onClick={() => setShowAddAccountModal(false)}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(SUPPORTED_CONNECTIONS).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleAddAccount(key as SupportedConnectionType)}
                      className="p-4 bg-black border border-gray-700 rounded-lg hover:border-[#15e49e] transition-all group"
                    >
                      <div className="w-12 h-12 bg-[#111111] rounded-full flex items-center justify-center text-xl mx-auto mb-3 group-hover:scale-110 transition-transform">
                        {config.icon}
                      </div>
                      <div className="font-medium mb-1">{config.name}</div>
                      <div className="text-xs text-gray-400">{config.type}</div>
                    </button>
                  ))}
                </div>
                
                <div className="text-center text-sm text-gray-400 mt-6">
                  More integrations coming soon!
                </div>
              </div>
            ) : (
              // Connection Form
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedAccountType(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      ←
                    </button>
                    <h2 className="text-xl font-bold">
                      Connect {selectedAccountType && SUPPORTED_CONNECTIONS[selectedAccountType].name}
                    </h2>
                  </div>
                  <button 
                    onClick={() => {
                      setShowAddAccountModal(false);
                      setSelectedAccountType(null);
                    }}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleConnect} className="space-y-4">
                  {/* Custom Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Account Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={connectionForm.name}
                      onChange={(e) => setConnectionForm({ ...connectionForm, name: e.target.value })}
                      placeholder={`My ${selectedAccountType && SUPPORTED_CONNECTIONS[selectedAccountType].name} Account`}
                      className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#15e49e] transition-colors"
                    />
                  </div>

                  {/* API Fields */}
                  {selectedAccountType && SUPPORTED_CONNECTIONS[selectedAccountType].fields.includes('apiKey') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          API Key
                        </label>
                        <input
                          type="text"
                          required
                          value={connectionForm.apiKey}
                          onChange={(e) => setConnectionForm({ ...connectionForm, apiKey: e.target.value })}
                          className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#15e49e] transition-colors"
                          placeholder="Enter your API key..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          API Secret
                        </label>
                        <input
                          type="password"
                          required
                          value={connectionForm.apiSecret}
                          onChange={(e) => setConnectionForm({ ...connectionForm, apiSecret: e.target.value })}
                          className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#15e49e] transition-colors"
                          placeholder="Enter your API secret..."
                        />
                      </div>
                    </>
                  )}

                  {/* Address Field */}
                  {selectedAccountType && SUPPORTED_CONNECTIONS[selectedAccountType].fields.includes('address') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Wallet Address
                      </label>
                      <input
                        type="text"
                        required
                        value={connectionForm.address}
                        onChange={(e) => setConnectionForm({ ...connectionForm, address: e.target.value })}
                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#15e49e] transition-colors"
                        placeholder="0x..."
                      />
                    </div>
                  )}

                  {/* Security Notice */}
                  {selectedAccountType && SUPPORTED_CONNECTIONS[selectedAccountType].apiRequired && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-400 mb-1">Security Notice</p>
                          <p className="text-blue-300">
                            Only grant read permissions when creating API keys. Never share your API credentials.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedAccountType(null)}
                      className="flex-1 bg-black border border-gray-700 hover:bg-gray-900 px-4 py-3 rounded-lg font-medium transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-[#15e49e] hover:bg-[#13c589] text-black px-4 py-3 rounded-lg font-medium transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Footer */}
      <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
        <div>
          Showing {filteredAccounts.length} of {accounts.length} accounts
        </div>
        <div className="flex items-center gap-6">
          <span>Total Balance: <span className="text-[#15e49e] font-medium">{formatCurrency(accounts.reduce((sum, acc) => sum + acc.totalBalance, 0))}</span></span>
          <span>•</span>
          <span>Total Transactions: <span className="text-white font-medium">{accounts.reduce((sum, acc) => sum + acc.txCount, 0)}</span></span>
        </div>
      </div>
    </div>
  );
}