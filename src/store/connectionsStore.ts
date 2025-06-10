// src/store/connectionsStore.ts
import { create } from 'zustand';
import { api } from '../utils/api';

export interface ExchangeConnection {
  id: string;
  user_id: string;
  exchange_name: string;
  connection_name: string;
  connection_type: string;
  status: 'active' | 'inactive' | 'error' | 'syncing';
  is_read_only: boolean;
  auto_sync_enabled: boolean;
  sync_frequency_hours: number;
  last_sync_at?: string;
  last_successful_sync_at?: string;
  next_scheduled_sync_at?: string;
  total_transactions_synced: number;
  last_sync_duration_ms?: number;
  last_sync_error?: string;
  consecutive_sync_failures: number;
  created_at: string;
  updated_at: string;
  settings: Record<string, any>;
  supported_features: string[];
}

export interface WalletConnection {
  id: string;
  user_id: string;
  wallet_name: string;
  connection_type: string;
  blockchain: string;
  network: string;
  chain_id?: number;
  address: string;
  address_type?: string;
  ens_name?: string;
  connection_method: string;
  connection_metadata: Record<string, any>;
  is_verified: boolean;
  verification_method?: string;
  verified_at?: string;
  status: 'active' | 'inactive' | 'error' | 'syncing';
  auto_sync_enabled: boolean;
  sync_frequency_hours: number;
  last_sync_at?: string;
  last_successful_sync_at?: string;
  next_scheduled_sync_at?: string;
  total_transactions_synced: number;
  last_sync_block_number?: number;
  last_sync_duration_ms?: number;
  last_sync_error?: string;
  consecutive_sync_failures: number;
  native_balance?: string;
  native_balance_usd?: string;
  token_count: number;
  nft_count: number;
  last_balance_update_at?: string;
  privacy_mode: boolean;
  show_nfts: boolean;
  show_tokens: boolean;
  show_defi_positions: boolean;
  created_at: string;
  updated_at: string;
  settings: Record<string, any>;
  tags: string[];
  notes?: string;
  risk_score: number;
  is_contract_wallet: boolean;
  has_suspicious_activity: boolean;
}

export interface SyncHistory {
  id: string;
  user_id: string;
  connection_id: string;
  connection_type: 'exchange' | 'wallet';
  connection_name: string;
  sync_type: 'scheduled' | 'manual' | 'retry' | 'initial' | 'partial';
  sync_trigger?: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  transactions_found: number;
  transactions_new: number;
  transactions_updated: number;
  transactions_skipped: number;
  sync_from_date?: string;
  sync_to_date?: string;
  last_block_number?: number;
  next_cursor?: string;
  error_message?: string;
  error_code?: string;
  error_details?: Record<string, any>;
  retry_count: number;
  max_retries: number;
  api_calls_made: number;
  api_rate_limited_count: number;
  data_transferred_bytes: number;
  sync_strategy: string;
  batch_size: number;
  parallel_workers: number;
  created_at: string;
  updated_at: string;
  sync_version?: string;
  user_agent?: string;
  ip_address?: string;
  sync_metadata: Record<string, any>;
  warnings: string[];
}

interface ConnectionsState {
  // Data
  exchangeConnections: ExchangeConnection[];
  walletConnections: WalletConnection[];
  syncHistory: SyncHistory[];
  
  // Loading states
  isLoading: boolean;
  isConnecting: boolean;
  isSyncing: Record<string, boolean>; // Track syncing state per connection
  hasInitialLoad: boolean; // Track if initial data fetch has completed
  
  // Error states
  error: string | null;
  connectionErrors: Record<string, string>; // Track errors per connection
  
  // Actions
  fetchConnections: () => Promise<void>;
  fetchSyncHistory: (connectionId?: string) => Promise<void>;
  
  // Exchange actions
  connectExchange: (exchangeName: string, connectionName: string, apiKey: string, apiSecret: string, apiPassphrase?: string) => Promise<boolean>;
  addExchangeConnection: (connection: ExchangeConnection) => void;
  disconnectExchange: (connectionId: string) => Promise<boolean>;
  syncExchange: (connectionId: string) => Promise<boolean>;
  updateExchangeSettings: (connectionId: string, settings: Partial<ExchangeConnection>) => Promise<boolean>;
  
  // Wallet actions
  connectWallet: (walletName: string, connectionType: string, blockchain: string, address: string, network?: string) => Promise<boolean>;
  disconnectWallet: (connectionId: string) => Promise<boolean>;
  syncWallet: (connectionId: string) => Promise<boolean>;
  verifyWallet: (connectionId: string, signature?: string) => Promise<boolean>;
  updateWalletSettings: (connectionId: string, settings: Partial<WalletConnection>) => Promise<boolean>;
  
  // General actions
  retrySync: (connectionId: string, connectionType: 'exchange' | 'wallet') => Promise<boolean>;
  cancelSync: (connectionId: string) => Promise<boolean>;
  clearError: () => void;
  clearConnectionError: (connectionId: string) => void;
}

export const useConnectionsStore = create<ConnectionsState>((set, get) => ({
  // Initial state
  exchangeConnections: [],
  walletConnections: [],
  syncHistory: [],
  isLoading: false,
  isConnecting: false,
  isSyncing: {},
  hasInitialLoad: false,
  error: null,
  connectionErrors: {},

  // Fetch all connections
  fetchConnections: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const [exchangeResult, walletResult] = await Promise.all([
        api.connections.exchanges.list(),
        api.connections.wallets.list()
      ]);

      if (exchangeResult.error) {
        throw new Error(exchangeResult.error);
      }
      if (walletResult.error) {
        throw new Error(walletResult.error);
      }

      const processedExchanges = Array.isArray(exchangeResult.data) ? exchangeResult.data : [];
      const processedWallets = Array.isArray(walletResult.data) ? walletResult.data : [];

      set({
        exchangeConnections: processedExchanges,
        walletConnections: processedWallets,
        isLoading: false,
        hasInitialLoad: true
      });
    } catch (error) {
      console.error('Error fetching connections:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch connections',
        isLoading: false,
        hasInitialLoad: true
      });
    }
  },

  // Fetch sync history
  fetchSyncHistory: async (connectionId?: string) => {
    try {
      const result = await api.connections.syncHistory(connectionId);
      
      if (result.error) {
        throw new Error(result.error);
      }

      set({ syncHistory: Array.isArray(result.data) ? result.data : [] });
    } catch (error) {
      console.error('Error fetching sync history:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch sync history' });
    }
  },

  // Connect exchange
  connectExchange: async (exchangeName, connectionName, apiKey, apiSecret, apiPassphrase) => {
    set({ isConnecting: true, error: null });
    
    try {
      const result = await api.connections.exchanges.connect({
        exchange_name: exchangeName,
        connection_name: connectionName,
        api_key: apiKey,
        api_secret: apiSecret,
        api_passphrase: apiPassphrase
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Add the new connection to the list
      if (result.data) {
        set(state => ({
          exchangeConnections: Array.isArray(state.exchangeConnections) 
            ? [...state.exchangeConnections, result.data] 
            : [result.data],
          isConnecting: false
        }));
      }

      return true;
    } catch (error) {
      console.error('Error connecting exchange:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to connect exchange',
        isConnecting: false
      });
      return false;
    }
  },

  // Add exchange connection (for manual integration like Coinbase OAuth)
  addExchangeConnection: (connection) => {
    set(state => ({
      exchangeConnections: Array.isArray(state.exchangeConnections)
        ? [...state.exchangeConnections, connection]
        : [connection]
    }));
  },

  // Disconnect exchange
  disconnectExchange: async (connectionId) => {
    try {
      const result = await api.connections.exchanges.disconnect(connectionId);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Remove from the list
      set(state => ({
        exchangeConnections: state.exchangeConnections.filter(conn => conn.id !== connectionId)
      }));

      return true;
    } catch (error) {
      console.error('Error disconnecting exchange:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to disconnect exchange' });
      return false;
    }
  },

  // Sync exchange
  syncExchange: async (connectionId) => {
    set(state => ({
      isSyncing: { ...state.isSyncing, [connectionId]: true },
      connectionErrors: { ...state.connectionErrors, [connectionId]: '' }
    }));

    try {
      const result = await api.connections.exchanges.sync(connectionId);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Update connection status
      set(state => ({
        exchangeConnections: state.exchangeConnections.map(conn =>
          conn.id === connectionId 
            ? { ...conn, status: 'syncing' as const, last_sync_at: new Date().toISOString() }
            : conn
        ),
        isSyncing: { ...state.isSyncing, [connectionId]: false }
      }));

      return true;
    } catch (error) {
      console.error('Error syncing exchange:', error);
      set(state => ({
        connectionErrors: { 
          ...state.connectionErrors, 
          [connectionId]: error instanceof Error ? error.message : 'Sync failed' 
        },
        isSyncing: { ...state.isSyncing, [connectionId]: false }
      }));
      return false;
    }
  },

  // Update exchange settings
  updateExchangeSettings: async (connectionId, settings) => {
    try {
      const result = await api.connections.exchanges.update(connectionId, settings);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Update in the list
      set(state => ({
        exchangeConnections: state.exchangeConnections.map(conn =>
          conn.id === connectionId ? { ...conn, ...result.data } : conn
        )
      }));

      return true;
    } catch (error) {
      console.error('Error updating exchange settings:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update settings' });
      return false;
    }
  },

  // Connect wallet
  connectWallet: async (walletName, connectionType, blockchain, address, network = 'mainnet') => {
    set({ isConnecting: true, error: null });
    
    try {
      const result = await api.connections.wallets.connect({
        wallet_name: walletName,
        connection_type: connectionType,
        blockchain,
        address,
        network
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Add the new connection to the list
      if (result.data) {
        set(state => ({
          walletConnections: Array.isArray(state.walletConnections) 
            ? [...state.walletConnections, result.data] 
            : [result.data],
          isConnecting: false
        }));
      }

      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
        isConnecting: false
      });
      return false;
    }
  },

  // Disconnect wallet
  disconnectWallet: async (connectionId) => {
    try {
      const result = await api.connections.wallets.disconnect(connectionId);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Remove from the list
      set(state => ({
        walletConnections: state.walletConnections.filter(conn => conn.id !== connectionId)
      }));

      return true;
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to disconnect wallet' });
      return false;
    }
  },

  // Sync wallet
  syncWallet: async (connectionId) => {
    set(state => ({
      isSyncing: { ...state.isSyncing, [connectionId]: true },
      connectionErrors: { ...state.connectionErrors, [connectionId]: '' }
    }));

    try {
      const result = await api.connections.wallets.sync(connectionId);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Update connection status
      set(state => ({
        walletConnections: state.walletConnections.map(conn =>
          conn.id === connectionId 
            ? { ...conn, status: 'syncing' as const, last_sync_at: new Date().toISOString() }
            : conn
        ),
        isSyncing: { ...state.isSyncing, [connectionId]: false }
      }));

      return true;
    } catch (error) {
      console.error('Error syncing wallet:', error);
      set(state => ({
        connectionErrors: { 
          ...state.connectionErrors, 
          [connectionId]: error instanceof Error ? error.message : 'Sync failed' 
        },
        isSyncing: { ...state.isSyncing, [connectionId]: false }
      }));
      return false;
    }
  },

  // Verify wallet
  verifyWallet: async (connectionId, signature) => {
    try {
      const result = await api.connections.wallets.verify(connectionId, signature);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Update verification status
      set(state => ({
        walletConnections: state.walletConnections.map(conn =>
          conn.id === connectionId 
            ? { ...conn, is_verified: true, verified_at: new Date().toISOString() }
            : conn
        )
      }));

      return true;
    } catch (error) {
      console.error('Error verifying wallet:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to verify wallet' });
      return false;
    }
  },

  // Update wallet settings
  updateWalletSettings: async (connectionId, settings) => {
    try {
      const result = await api.connections.wallets.update(connectionId, settings);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Update in the list
      set(state => ({
        walletConnections: state.walletConnections.map(conn =>
          conn.id === connectionId ? { ...conn, ...result.data } : conn
        )
      }));

      return true;
    } catch (error) {
      console.error('Error updating wallet settings:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update settings' });
      return false;
    }
  },

  // Retry sync
  retrySync: async (connectionId, connectionType) => {
    if (connectionType === 'exchange') {
      return get().syncExchange(connectionId);
    } else {
      return get().syncWallet(connectionId);
    }
  },

  // Cancel sync
  cancelSync: async (connectionId) => {
    try {
      const result = await api.connections.cancelSync(connectionId);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Update syncing state
      set(state => ({
        isSyncing: { ...state.isSyncing, [connectionId]: false }
      }));

      return true;
    } catch (error) {
      console.error('Error cancelling sync:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to cancel sync' });
      return false;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Clear connection-specific error
  clearConnectionError: (connectionId) => {
    set(state => ({
      connectionErrors: { ...state.connectionErrors, [connectionId]: '' }
    }));
  },
}));