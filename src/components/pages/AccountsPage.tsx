import React, { useState, useEffect } from 'react';
import { useConnectionsStore } from '../../store/connectionsStore';
// import { CoinIcon } from '../common/CoinIcon';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Settings, 
  // MoreVertical, 
  Link2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  Shield
  // Eye,
  // EyeOff
} from 'lucide-react';

interface UnifiedConnection {
  id: string;
  name: string;
  type: 'Exchange' | 'Wallet' | 'Blockchain';
  status: 'active' | 'inactive' | 'error' | 'syncing';
  lastSync?: string;
  lastSuccessfulSync?: string;
  totalTransactions: number;
  isVerified?: boolean;
  blockchain?: string;
  address?: string;
  exchangeName?: string;
  nativeBalance?: string;
  tokenCount: number;
  nftCount: number;
  icon: string;
  autoSyncEnabled: boolean;
  syncFrequencyHours: number;
  lastSyncError?: string;
  consecutiveFailures: number;
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
    fields: ['address'] as string[]
  },
  walletconnect: {
    name: 'WalletConnect',
    type: 'Wallet' as const,
    icon: '🔗',
    apiRequired: false,
    description: 'Connect any WalletConnect compatible wallet',
    fields: ['address'] as string[]
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

// Wallet address validation function
const validateWalletAddress = (address: string, blockchain: string): { isValid: boolean; error?: string } => {
  if (!address || !address.trim()) {
    return { isValid: false, error: 'Address cannot be empty' };
  }
  
  const trimmedAddress = address.trim();
  
  switch (blockchain?.toLowerCase() || '') {
    case 'ethereum':
    case 'base':
    case 'arbitrum':
    case 'polygon':
    case 'optimism':
    case 'avalanche':
    case 'bsc':
      // Ethereum-based addresses should start with 0x and be 42 characters long
      if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
        return { isValid: false, error: 'Invalid Ethereum address format. Should start with 0x and be 42 characters long.' };
      }
      break;
    case 'bitcoin':
      // Bitcoin addresses - simplified validation (legacy, segwit, bech32)
      if (!/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmedAddress) && 
          !/^bc1[a-z0-9]{39,59}$/.test(trimmedAddress) &&
          !/^[2][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmedAddress)) {
        return { isValid: false, error: 'Invalid Bitcoin address format.' };
      }
      break;
    default:
      // For other blockchains, just check it's not empty and has reasonable length
      if (trimmedAddress.length < 10 || trimmedAddress.length > 100) {
        return { isValid: false, error: 'Address length should be between 10 and 100 characters.' };
      }
  }
  
  return { isValid: true };
};

export function AccountsPage() {
  const {
    exchangeConnections,
    walletConnections,
    isLoading,
    isConnecting,
    isSyncing,
    hasInitialLoad,
    error,
    connectionErrors,
    fetchConnections,
    connectExchange,
    connectWallet,
    syncExchange,
    syncWallet,
    disconnectExchange,
    disconnectWallet,
    clearError,
    // clearConnectionError
  } = useConnectionsStore();


  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'totalTransactions' | 'name' | 'lastSync'>('totalTransactions');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState<SupportedConnectionType | null>(null);
  const [connectionForm, setConnectionForm] = useState({
    apiKey: '',
    apiSecret: '',
    apiPassphrase: '',
    address: '',
    name: '',
    blockchain: 'ethereum',
    network: 'mainnet'
  });
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load connections on mount
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Combine and transform connections into unified format
  const accounts: UnifiedConnection[] = [
    ...(Array.isArray(exchangeConnections) ? exchangeConnections : []).map(conn => ({
      id: conn.id || '',
      name: conn.connection_name || conn.exchange_name || 'Unknown Exchange',
      type: 'Exchange' as const,
      status: conn.status || 'inactive',
      lastSync: conn.last_sync_at,
      lastSuccessfulSync: conn.last_successful_sync_at,
      totalTransactions: conn.total_transactions_synced || 0,
      exchangeName: conn.exchange_name,
      icon: getExchangeIcon(conn.exchange_name),
      autoSyncEnabled: conn.auto_sync_enabled || false,
      syncFrequencyHours: conn.sync_frequency_hours || 24,
      lastSyncError: conn.last_sync_error,
      consecutiveFailures: conn.consecutive_sync_failures || 0,
      tokenCount: 0,
      nftCount: 0
    })),
    ...(Array.isArray(walletConnections) ? walletConnections : []).map(conn => ({
        id: conn.id || '',
        name: conn.wallet_name || `${conn.blockchain || 'Unknown'} Wallet`,
        type: conn.connection_type === 'address' ? 'Blockchain' as const : 'Wallet' as const,
        status: conn.status || 'inactive',
        lastSync: conn.last_sync_at,
        lastSuccessfulSync: conn.last_successful_sync_at,
        totalTransactions: conn.total_transactions_synced || 0,
        isVerified: conn.is_verified || false,
        blockchain: conn.blockchain,
        address: conn.address,
        nativeBalance: conn.native_balance,
        tokenCount: conn.token_count ?? 0,
        nftCount: conn.nft_count ?? 0,
        icon: getBlockchainIcon(conn.blockchain),
        autoSyncEnabled: conn.auto_sync_enabled || false,
        syncFrequencyHours: conn.sync_frequency_hours || 24,
        lastSyncError: conn.last_sync_error,
        consecutiveFailures: conn.consecutive_sync_failures || 0
    }))
  ];


  function getExchangeIcon(exchangeName: string): string {
    const name = exchangeName?.toLowerCase() || '';
    if (name.includes('coinbase')) return '🟦';
    if (name.includes('binance')) return '🟨';
    if (name.includes('kraken')) return '🟣';
    if (name.includes('gemini')) return '🟢';
    if (name.includes('ftx')) return '🔺';
    if (name.includes('kucoin')) return '🟡';
    return '🏛️';
  }

  function getBlockchainIcon(blockchain: string): string {
    const name = blockchain?.toLowerCase() || '';
    if (name === 'ethereum') return '⟡';
    if (name === 'bitcoin') return '₿';
    if (name === 'base') return '🔵';
    if (name === 'arbitrum') return '🔷';
    if (name === 'polygon') return '🟣';
    if (name === 'optimism') return '🔴';
    if (name === 'avalanche') return '🔺';
    if (name === 'bsc') return '🟨';
    return '🔗';
  }

  // Get recommended accounts
  const safeExchangeConnections = Array.isArray(exchangeConnections) ? exchangeConnections : [];
  const safeWalletConnections = Array.isArray(walletConnections) ? walletConnections : [];
  
  const recommendedAccounts: RecommendedAccount[] = [
    ...(!safeExchangeConnections.some(conn => conn.exchange_name === 'coinbase') ? [{
      id: 'coinbase',
      name: 'Coinbase',
      icon: '🟦',
      type: 'Exchange' as const,
      description: 'Popular US exchange with easy fiat onramp'
    }] : []),
    ...(!safeExchangeConnections.some(conn => conn.exchange_name === 'binance') ? [{
      id: 'binance',
      name: 'Binance',
      icon: '🟨',
      type: 'Exchange' as const,
      description: 'World\'s largest crypto exchange'
    }] : []),
    ...(!safeWalletConnections.some(conn => conn.blockchain === 'ethereum') ? [{
      id: 'ethereum',
      name: 'Ethereum',
      icon: '⟡',
      type: 'Blockchain' as const,
      description: 'Add Ethereum wallet address'
    }] : []),
    ...(!safeWalletConnections.some(conn => conn.blockchain === 'bitcoin') ? [{
      id: 'bitcoin',
      name: 'Bitcoin',
      icon: '₿',
      type: 'Blockchain' as const,
      description: 'Add Bitcoin wallet address'
    }] : [])
  ];

  const filteredAccounts = accounts
    .filter(account => 
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.blockchain && account.blockchain.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (account.exchangeName && account.exchangeName.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'totalTransactions':
          comparison = a.totalTransactions - b.totalTransactions;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'lastSync':
          const aTime = a.lastSync ? new Date(a.lastSync).getTime() : 0;
          const bTime = b.lastSync ? new Date(b.lastSync).getTime() : 0;
          comparison = aTime - bTime;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const formatCurrency = (amount: string | number | undefined) => {
    if (!amount) return '—';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '—';
    
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  };

  const getTimeSinceSync = (lastSync?: string) => {
    if (!lastSync) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - new Date(lastSync).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    if (diffMinutes > 0) return `${diffMinutes}m`;
    return 'Just now';
  };

  const handleSort = (column: 'totalTransactions' | 'name' | 'lastSync') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleAddAccount = (accountType: SupportedConnectionType) => {
    setSelectedAccountType(accountType);
    setConnectionForm({ 
      apiKey: '', 
      apiSecret: '', 
      apiPassphrase: '',
      address: '', 
      name: '',
      blockchain: 'ethereum',
      network: 'mainnet' 
    });
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccountType) return;
    
    const config = SUPPORTED_CONNECTIONS[selectedAccountType];
    let success = false;
    
    try {
      if (config.type === 'Exchange') {
        console.log('Connecting exchange with data:', {
          exchangeName: selectedAccountType,
          connectionName: connectionForm.name || `My ${config.name} Account`,
          apiKey: connectionForm.apiKey ? '***' : 'empty',
          apiSecret: connectionForm.apiSecret ? '***' : 'empty',
          apiPassphrase: connectionForm.apiPassphrase ? '***' : 'empty'
        });
        
        success = await connectExchange(
          selectedAccountType,
          connectionForm.name || `My ${config.name} Account`,
          connectionForm.apiKey,
          connectionForm.apiSecret,
          connectionForm.apiPassphrase || undefined
        );
      } else {
        // Validate wallet address format
        if (!connectionForm.address.trim()) {
          throw new Error('Wallet address is required');
        }
        
        // Basic address validation
        const addressValidation = validateWalletAddress(connectionForm.address, connectionForm.blockchain);
        if (!addressValidation.isValid) {
          throw new Error(addressValidation.error);
        }
        
        console.log('Connecting wallet with data:', {
          walletName: connectionForm.name || `My ${config.name} Wallet`,
          connectionType: config.type === 'Blockchain' ? 'address' : selectedAccountType,
          blockchain: connectionForm.blockchain,
          address: connectionForm.address,
          network: connectionForm.network
        });
        
        success = await connectWallet(
          connectionForm.name || `My ${config.name} Wallet`,
          config.type === 'Blockchain' ? 'address' : selectedAccountType,
          connectionForm.blockchain,
          connectionForm.address,
          connectionForm.network
        );
      }
      
      if (success) {
        setShowSuccess(`${config.name} connected successfully!`);
        setShowAddAccountModal(false);
        setSelectedAccountType(null);
        setConnectionForm({
          apiKey: '',
          apiSecret: '',
          apiPassphrase: '',
          address: '',
          name: '',
          blockchain: 'ethereum',
          network: 'mainnet'
        });
      }
    } catch (error) {
      console.error('Connection error:', error);
      // The error handling is done by the store, but we can add UI feedback here if needed
    }
  };
  
  const handleSync = async (account: UnifiedConnection) => {
    try {
      if (account.type === 'Exchange') {
        await syncExchange(account.id);
      } else {
        await syncWallet(account.id);
      }
      setShowSuccess(`${account.name} sync started successfully!`);
    } catch (error) {
      console.error('Sync error:', error);
    }
  };
  
  const handleDisconnect = async (account: UnifiedConnection) => {
    if (!confirm(`Are you sure you want to disconnect ${account.name}?`)) return;
    
    try {
      let success = false;
      if (account.type === 'Exchange') {
        success = await disconnectExchange(account.id);
      } else {
        success = await disconnectWallet(account.id);
      }
      
      if (success) {
        setShowSuccess(`${account.name} disconnected successfully!`);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const getStatusIcon = (status: UnifiedConnection['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-[#15e49e]" />;
      case 'syncing':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };
  
  const getStatusText = (status: UnifiedConnection['status']) => {
    switch (status) {
      case 'active': return 'Connected';
      case 'syncing': return 'Syncing';
      case 'error': return 'Error';
      case 'inactive': return 'Inactive';
    }
  };
  
  const getStatusColor = (status: UnifiedConnection['status']) => {
    switch (status) {
      case 'active': return 'text-[#15e49e]';
      case 'syncing': return 'text-blue-400';
      case 'error': return 'text-red-400';
      case 'inactive': return 'text-gray-400';
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
          disabled={isConnecting}
          className="bg-[#15e49e] hover:bg-[#13c589] disabled:bg-gray-600 disabled:cursor-not-allowed text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          {isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {isConnecting ? 'Connecting...' : 'Add account'}
        </button>
      </div>

      {/* Success/Error Messages */}
      {showSuccess && (
        <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400">{showSuccess}</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
            <button 
              onClick={clearError}
              className="text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading || !hasInitialLoad ? (
        <div className="bg-[#111111] rounded-lg border border-gray-800 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#15e49e]" />
          <p className="text-gray-400">Loading connections...</p>
        </div>
      ) : (
        <>
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
                onClick={() => handleSort('totalTransactions')}
                className="text-sm font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
              >
                Tx <SortIcon field="totalTransactions" />
              </button>
            </div>
            <div className="col-span-2 text-center text-sm font-medium text-gray-400 uppercase tracking-wider">
              Details
            </div>
            <div className="col-span-2 text-right text-sm font-medium text-gray-400 uppercase tracking-wider">
              Actions
            </div>
          </div>
        </div>

        {/* Account Rows */}
        <div className="divide-y divide-gray-800">
          {filteredAccounts.map((account) => {
            const accountError = connectionErrors[account.id];
            const isAccountSyncing = isSyncing[account.id];
            
            return (
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
                        {getStatusIcon(isAccountSyncing ? 'syncing' : account.status)}
                        <span className={getStatusColor(isAccountSyncing ? 'syncing' : account.status)}>
                          {isAccountSyncing ? 'Syncing' : getStatusText(account.status)}
                        </span>
                        {account.type !== 'Exchange' && account.isVerified && (
                          <Shield className="w-3 h-3 text-[#15e49e] ml-1" />
                        )}
                      </div>
                      {accountError && (
                        <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {accountError}
                        </div>
                      )}
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
                    {account.autoSyncEnabled && (
                      <div className="text-xs text-gray-500 mt-1">
                        Auto: {account.syncFrequencyHours}h
                      </div>
                    )}
                  </div>

                  {/* Type */}
                  <div className="col-span-1 text-center">
                    <span className="text-sm text-gray-400">{account.type}</span>
                    {account.blockchain && (
                      <div className="text-xs text-gray-500 mt-1">
                        {account.blockchain}
                      </div>
                    )}
                  </div>

                  {/* Transaction Count */}
                  <div className="col-span-1 text-center">
                    <span className="text-sm font-medium">{account.totalTransactions}</span>
                    {account.consecutiveFailures > 0 && (
                      <div className="text-xs text-red-400 mt-1">
                        {account.consecutiveFailures} fails
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="col-span-2">
                    {account.type === 'Exchange' && account.exchangeName && (
                      <div className="text-sm text-gray-400">
                        {account.exchangeName}
                      </div>
                    )}
                    {(account.type === 'Wallet' || account.type === 'Blockchain') && (
                      <div className="space-y-1">
                        {account.address && (
                          <div className="text-xs font-mono text-gray-400">
                            {account.address.slice(0, 6)}...{account.address.slice(-4)}
                          </div>
                        )}
                        {account.nativeBalance && (
                          <div className="text-sm">
                            {formatCurrency(account.nativeBalance)}
                          </div>
                        )}
                        {(account.tokenCount > 0 || account.nftCount > 0) && (
                          <div className="text-xs text-gray-500">
                            {account.tokenCount > 0 && `${account.tokenCount} tokens`}
                            {account.tokenCount > 0 && account.nftCount > 0 && ', '}
                            {account.nftCount > 0 && `${account.nftCount} NFTs`}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleSync(account)}
                      disabled={isAccountSyncing || account.status === 'syncing'}
                      className="text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed p-1"
                      title="Sync now"
                    >
                      {isAccountSyncing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </button>
                    <button 
                      className="text-gray-400 hover:text-white p-1"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDisconnect(account)}
                      className="text-gray-400 hover:text-red-400 p-1"
                      title="Disconnect"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredAccounts.length === 0 && !isLoading && (
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
        </>
      )}

      {/* Recommended Accounts Section */}
      {hasInitialLoad && !isLoading && recommendedAccounts.length > 0 && (
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
                      {/* API Passphrase for exchanges that need it */}
                      {selectedAccountType === 'coinbase' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            API Passphrase
                          </label>
                          <input
                            type="password"
                            value={connectionForm.apiPassphrase}
                            onChange={(e) => setConnectionForm({ ...connectionForm, apiPassphrase: e.target.value })}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#15e49e] transition-colors"
                            placeholder="Enter your API passphrase..."
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Address Field */}
                  {selectedAccountType && SUPPORTED_CONNECTIONS[selectedAccountType].fields.includes('address') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Blockchain
                        </label>
                        <select
                          value={connectionForm.blockchain}
                          onChange={(e) => setConnectionForm({ ...connectionForm, blockchain: e.target.value })}
                          className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#15e49e] transition-colors"
                        >
                          <option value="ethereum">Ethereum</option>
                          <option value="bitcoin">Bitcoin</option>
                          <option value="base">Base</option>
                          <option value="arbitrum">Arbitrum</option>
                          <option value="polygon">Polygon</option>
                          <option value="optimism">Optimism</option>
                          <option value="avalanche">Avalanche</option>
                          <option value="bsc">Binance Smart Chain</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Network
                        </label>
                        <select
                          value={connectionForm.network}
                          onChange={(e) => setConnectionForm({ ...connectionForm, network: e.target.value })}
                          className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#15e49e] transition-colors"
                        >
                          <option value="mainnet">Mainnet</option>
                          <option value="testnet">Testnet</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Wallet Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={connectionForm.address}
                          onChange={(e) => {
                            const newAddress = e.target.value;
                            setConnectionForm({ ...connectionForm, address: newAddress });
                            
                            // Clear previous error when user starts typing
                            if (formErrors.address) {
                              setFormErrors({ ...formErrors, address: '' });
                            }
                            
                            // Real-time validation for immediate feedback
                            if (newAddress.trim()) {
                              const validation = validateWalletAddress(newAddress, connectionForm.blockchain);
                              if (!validation.isValid) {
                                setFormErrors({ ...formErrors, address: validation.error || 'Invalid address' });
                              }
                            }
                          }}
                          className={`w-full bg-black border rounded-lg px-4 py-2.5 font-mono text-sm focus:outline-none transition-colors ${
                            formErrors.address ? 'border-red-500 focus:border-red-400' : 'border-gray-700 focus:border-[#15e49e]'
                          }`}
                          placeholder={connectionForm.blockchain === 'bitcoin' ? '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' : '0x1234567890123456789012345678901234567890'}
                        />
                        {formErrors.address && (
                          <p className="mt-1 text-sm text-red-400">{formErrors.address}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Enter your {connectionForm.blockchain} wallet address
                        </p>
                      </div>
                    </>
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
                      disabled={isConnecting}
                      className="flex-1 bg-[#15e49e] hover:bg-[#13c589] disabled:bg-gray-600 disabled:cursor-not-allowed text-black px-4 py-3 rounded-lg font-medium transition-colors"
                    >
                      {isConnecting ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Connecting...
                        </div>
                      ) : (
                        'Connect'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Footer */}
      {hasInitialLoad && !isLoading && (
        <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
          <div>
            Showing {filteredAccounts.length} of {accounts.length} connections
          </div>
          <div className="flex items-center gap-6">
            <span>Exchanges: <span className="text-white font-medium">{safeExchangeConnections.length}</span></span>
            <span>•</span>
            <span>Wallets: <span className="text-white font-medium">{safeWalletConnections.length}</span></span>
            <span>•</span>
            <span>Total Transactions: <span className="text-[#15e49e] font-medium">{accounts.reduce((sum, acc) => sum + acc.totalTransactions, 0)}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}