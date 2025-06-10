import { useAuthStore, getAuthHeaders } from '../store/authStore';

// Base API URL - adjust if your API is on a different domain
const API_BASE_URL = '/api';

// Generic API request handler
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const authHeaders = getAuthHeaders();
    console.log('Auth headers from getAuthHeaders():', authHeaders);
    
    const headers = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    };
    
    console.log('Final API Request headers:', { 
      url: `${API_BASE_URL}${endpoint}`, 
      method: options.method || 'GET',
      headers,
      hasAuthorization: !!(headers as any).Authorization,
      authHeaderValue: (headers as any).Authorization ? `${(headers as any).Authorization.substring(0, 20)}...` : 'missing'
    });
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        const authStore = useAuthStore.getState();
        authStore.logout();
        window.location.href = '/login';
        return { error: 'Session expired. Please login again.' };
      }

      // Enhanced error handling for 400 validation errors
      if (response.status === 400) {
        console.error('400 Validation Error:', {
          status: response.status,
          statusText: response.statusText,
          data,
          url: `${API_BASE_URL}${endpoint}`,
          method: options.method || 'GET'
        });
        
        // Try to extract specific validation errors
        let errorMessage = 'Validation failed';
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.join(', ');
        } else if (data.details) {
          errorMessage = data.details;
        }
        
        return { error: errorMessage };
      }

      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        data,
        url: `${API_BASE_URL}${endpoint}`,
        method: options.method || 'GET'
      });

      return { error: data.message || data.error || 'Request failed' };
    }

    return { data };
  } catch (error) {
    console.error('API request error:', error);
    return { error: 'Network error. Please check your connection.' };
  }
}

// Specific API endpoints
export const api = {
  // Auth endpoints
  auth: {
    login: (email: string, password: string) =>
      apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    
    register: (email: string, password: string, name?: string) =>
      apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }),
    
    logout: () =>
      apiRequest('/auth/logout', {
        method: 'POST',
      }),
    
    me: () => apiRequest('/auth/me'),
    
    verifyEmail: (token: string) =>
      apiRequest(`/auth/verify/${token}`, {
        method: 'POST',
      }),
    
    forgotPassword: (email: string) =>
      apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    
    resetPassword: (token: string, password: string) =>
      apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),
  },

  // User endpoints
  user: {
    updateProfile: (updates: { name?: string; email?: string }) =>
      apiRequest('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    
    changePassword: (currentPassword: string, newPassword: string) =>
      apiRequest('/user/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    
    deleteAccount: () =>
      apiRequest('/user/delete', {
        method: 'DELETE',
      }),
  },

  // Transaction endpoints
  transactions: {
    list: (params?: { page?: number; limit?: number; search?: string }) => {
      const queryString = new URLSearchParams(params as any).toString();
      return apiRequest(`/transactions${queryString ? `?${queryString}` : ''}`);
    },
    
    create: (transaction: any) =>
      apiRequest('/transactions', {
        method: 'POST',
        body: JSON.stringify(transaction),
      }),
    
    update: (id: string, updates: any) =>
      apiRequest(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    
    delete: (id: string) =>
      apiRequest(`/transactions/${id}`, {
        method: 'DELETE',
      }),
    
    import: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      return fetch(`${API_BASE_URL}/transactions/import`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      }).then(res => res.json());
    },
  },

  // Tax calculation endpoints
  tax: {
    calculate: (year: number) =>
      apiRequest(`/tax/calculate/${year}`),
    
    summary: (year: number) =>
      apiRequest(`/tax/summary/${year}`),
    
    export: (year: number, format: 'pdf' | 'csv' = 'pdf') =>
      apiRequest(`/tax/export/${year}?format=${format}`),
  },

  // Exchange endpoints (deprecated - use connections.exchanges)
  exchanges: {
    list: () => apiRequest('/exchanges'),
    
    connect: (exchange: string, apiKey: string, apiSecret: string) =>
      apiRequest('/exchanges/connect', {
        method: 'POST',
        body: JSON.stringify({ exchange, apiKey, apiSecret }),
      }),
    
    disconnect: (exchangeId: string) =>
      apiRequest(`/exchanges/${exchangeId}/disconnect`, {
        method: 'POST',
      }),
    
    sync: (exchangeId: string) =>
      apiRequest(`/exchanges/${exchangeId}/sync`, {
        method: 'POST',
      }),
  },

  // Connection endpoints (new API structure)
  connections: {
    // Exchange connections
    exchanges: {
      list: () => apiRequest('/connections/exchanges').then(response => {
        // Ensure the response data has proper field mapping for all exchange connections
        // Handle both array format and {exchanges: [], total: number} format
        let exchangesArray = [];
        if (response.data && !response.error) {
          if (Array.isArray(response.data)) {
            exchangesArray = response.data;
          } else if (response.data.exchanges && Array.isArray(response.data.exchanges)) {
            exchangesArray = response.data.exchanges;
          }
        }
        
        if (exchangesArray.length > 0) {
          const mappedData = exchangesArray.map((exchangeData: any) => ({
            ...exchangeData,
            exchange_name: exchangeData.exchangeName || exchangeData.exchange_name,
            connection_name: exchangeData.connectionName || exchangeData.connection_name,
            connection_type: exchangeData.connectionType || exchangeData.connection_type,
            last_sync_at: exchangeData.lastSyncAt || exchangeData.last_sync_at || null,
            last_successful_sync_at: exchangeData.lastSuccessfulSyncAt || exchangeData.last_successful_sync_at || null,
            next_scheduled_sync_at: exchangeData.nextScheduledSyncAt || exchangeData.next_scheduled_sync_at || null,
            created_at: exchangeData.createdAt || exchangeData.created_at || null,
            updated_at: exchangeData.updatedAt || exchangeData.updated_at || null,
            total_transactions_synced: exchangeData.totalTransactionsSynced ?? exchangeData.total_transactions_synced ?? 0,
            is_read_only: exchangeData.isReadOnly ?? exchangeData.is_read_only ?? false,
            auto_sync_enabled: exchangeData.autoSyncEnabled ?? exchangeData.auto_sync_enabled ?? false,
            sync_frequency_hours: exchangeData.syncFrequencyHours ?? exchangeData.sync_frequency_hours ?? 24,
            consecutive_sync_failures: exchangeData.consecutiveSyncFailures ?? exchangeData.consecutive_sync_failures ?? 0,
            last_sync_error: exchangeData.lastSyncError || exchangeData.last_sync_error || null,
            last_sync_duration_ms: exchangeData.lastSyncDurationMs ?? exchangeData.last_sync_duration_ms ?? null
          }));
          
          return { data: mappedData };
        } else if (response.data && !response.error) {
          // Return empty array if no exchanges found but request was successful
          return { data: [] };
        }
        return response;
      }),
      
      connect: (data: {
        exchange_name: string;
        connection_name: string;
        api_key: string;
        api_secret: string;
        api_passphrase?: string;
      }) =>
        apiRequest('/connections/exchanges', {
          method: 'POST',
          body: JSON.stringify(data),
        }).then(response => {
          // Ensure the response data has proper field mapping
          if (response.data && !response.error) {
            const exchangeData = response.data as any;
            
            // Map camelCase fields from API to snake_case for consistency
            const mappedData = {
              ...exchangeData,
              exchange_name: exchangeData.exchangeName || exchangeData.exchange_name,
              connection_name: exchangeData.connectionName || exchangeData.connection_name,
              connection_type: exchangeData.connectionType || exchangeData.connection_type,
              last_sync_at: exchangeData.lastSyncAt || exchangeData.last_sync_at || null,
              last_successful_sync_at: exchangeData.lastSuccessfulSyncAt || exchangeData.last_successful_sync_at || null,
              next_scheduled_sync_at: exchangeData.nextScheduledSyncAt || exchangeData.next_scheduled_sync_at || null,
              created_at: exchangeData.createdAt || exchangeData.created_at || null,
              updated_at: exchangeData.updatedAt || exchangeData.updated_at || null,
              total_transactions_synced: exchangeData.totalTransactionsSynced ?? exchangeData.total_transactions_synced ?? 0,
              is_read_only: exchangeData.isReadOnly ?? exchangeData.is_read_only ?? false,
              auto_sync_enabled: exchangeData.autoSyncEnabled ?? exchangeData.auto_sync_enabled ?? false,
              sync_frequency_hours: exchangeData.syncFrequencyHours ?? exchangeData.sync_frequency_hours ?? 24,
              consecutive_sync_failures: exchangeData.consecutiveSyncFailures ?? exchangeData.consecutive_sync_failures ?? 0,
              last_sync_error: exchangeData.lastSyncError || exchangeData.last_sync_error || null,
              last_sync_duration_ms: exchangeData.lastSyncDurationMs ?? exchangeData.last_sync_duration_ms ?? null
            };
            
            return { data: mappedData };
          }
          return response;
        }),
      
      disconnect: (connectionId: string) =>
        apiRequest(`/connections/exchanges/${connectionId}`, {
          method: 'DELETE',
        }),
      
      update: (connectionId: string, updates: any) =>
        apiRequest(`/connections/exchanges/${connectionId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        }),
      
      sync: (connectionId: string) =>
        apiRequest(`/connections/exchanges/${connectionId}/sync`, {
          method: 'POST',
        }),
      
      getStatus: (connectionId: string) =>
        apiRequest(`/connections/exchanges/${connectionId}/status`),
    },

    // Wallet connections
    wallets: {
      list: () => apiRequest('/connections/wallets').then(response => {
        // Ensure the response data has proper field mapping for all wallet connections
        // Handle both array format and {wallets: [], total: number} format
        let walletsArray = [];
        if (response.data && !response.error) {
          if (Array.isArray(response.data)) {
            walletsArray = response.data;
          } else if (response.data.wallets && Array.isArray(response.data.wallets)) {
            walletsArray = response.data.wallets;
          }
        }
        
        if (walletsArray.length > 0) {
          const mappedData = walletsArray.map((walletData: any) => ({
            ...walletData,
            wallet_name: walletData.walletName || walletData.wallet_name,
            connection_type: walletData.connectionType || walletData.connection_type,
            blockchain: walletData.blockchain || 'ethereum', // Default to ethereum if missing
            network: walletData.network || 'mainnet', // Default to mainnet if missing
            address: walletData.address || walletData.address,
            last_sync_at: walletData.lastSyncAt || walletData.last_sync_at || null,
            last_successful_sync_at: walletData.lastSuccessfulSyncAt || walletData.last_successful_sync_at || null,
            created_at: walletData.createdAt || walletData.created_at || null,
            updated_at: walletData.updatedAt || walletData.updated_at || null,
            verified_at: walletData.verifiedAt || walletData.verified_at || null,
            last_balance_update_at: walletData.lastBalanceUpdateAt || walletData.last_balance_update_at || null,
            total_transactions_synced: walletData.totalTransactionsSynced ?? walletData.total_transactions_synced ?? 0,
            token_count: walletData.tokenCount ?? walletData.token_count ?? 0,
            nft_count: walletData.nftCount ?? walletData.nft_count ?? 0,
            native_balance: walletData.nativeBalance || walletData.native_balance || null,
            native_balance_usd: walletData.nativeBalanceUsd || walletData.native_balance_usd || null,
            is_verified: walletData.isVerified ?? walletData.is_verified ?? false,
            auto_sync_enabled: walletData.autoSyncEnabled ?? walletData.auto_sync_enabled ?? false,
            sync_frequency_hours: walletData.syncFrequencyHours ?? walletData.sync_frequency_hours ?? 24,
            consecutive_sync_failures: walletData.consecutiveSyncFailures ?? walletData.consecutive_sync_failures ?? 0,
            last_sync_error: walletData.lastSyncError || walletData.last_sync_error || null
          }));
          
          return { data: mappedData };
        } else if (response.data && !response.error) {
          // Return empty array if no wallets found but request was successful
          return { data: [] };
        }
        return response;
      }),
      
      connect: (data: {
        wallet_name: string;
        connection_type: string;
        blockchain: string;
        address: string;
        network?: string;
      }) => {
        // Convert snake_case to camelCase for backend compatibility
        const requestData = {
          walletName: data.wallet_name,
          connectionType: data.connection_type,
          blockchain: data.blockchain,
          address: data.address,
          network: data.network
        };
        console.log('Wallet connection API call with data:', requestData);
        return apiRequest('/connections/wallets', {
          method: 'POST',
          body: JSON.stringify(requestData),
        }).then(response => {
          // Ensure the response data has proper field mapping
          if (response.data && !response.error) {
            const walletData = response.data as any;
            
            // Map camelCase fields from API to snake_case for consistency
            const mappedData = {
              ...walletData,
              wallet_name: walletData.walletName || walletData.wallet_name,
              connection_type: walletData.connectionType || walletData.connection_type,
              blockchain: walletData.blockchain || 'ethereum', // Default to ethereum if missing
              network: walletData.network || 'mainnet', // Default to mainnet if missing
              address: walletData.address || walletData.address,
              last_sync_at: walletData.lastSyncAt || walletData.last_sync_at || null,
              last_successful_sync_at: walletData.lastSuccessfulSyncAt || walletData.last_successful_sync_at || null,
              created_at: walletData.createdAt || walletData.created_at || null,
              updated_at: walletData.updatedAt || walletData.updated_at || null,
              verified_at: walletData.verifiedAt || walletData.verified_at || null,
              last_balance_update_at: walletData.lastBalanceUpdateAt || walletData.last_balance_update_at || null,
              total_transactions_synced: walletData.totalTransactionsSynced ?? walletData.total_transactions_synced ?? 0,
              token_count: walletData.tokenCount ?? walletData.token_count ?? 0,
              nft_count: walletData.nftCount ?? walletData.nft_count ?? 0,
              native_balance: walletData.nativeBalance || walletData.native_balance || null,
              native_balance_usd: walletData.nativeBalanceUsd || walletData.native_balance_usd || null,
              is_verified: walletData.isVerified ?? walletData.is_verified ?? false,
              auto_sync_enabled: walletData.autoSyncEnabled ?? walletData.auto_sync_enabled ?? false,
              sync_frequency_hours: walletData.syncFrequencyHours ?? walletData.sync_frequency_hours ?? 24,
              consecutive_sync_failures: walletData.consecutiveSyncFailures ?? walletData.consecutive_sync_failures ?? 0,
              last_sync_error: walletData.lastSyncError || walletData.last_sync_error || null
            };
            
            return { data: mappedData };
          }
          return response;
        });
      },
      
      disconnect: (connectionId: string) =>
        apiRequest(`/connections/wallets/${connectionId}`, {
          method: 'DELETE',
        }),
      
      update: (connectionId: string, updates: any) =>
        apiRequest(`/connections/wallets/${connectionId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        }),
      
      sync: (connectionId: string) =>
        apiRequest(`/connections/wallets/${connectionId}/sync`, {
          method: 'POST',
        }),
      
      verify: (connectionId: string, signature?: string) =>
        apiRequest(`/connections/wallets/${connectionId}/verify`, {
          method: 'POST',
          body: JSON.stringify({ signature }),
        }),
      
      getStatus: (connectionId: string) =>
        apiRequest(`/connections/wallets/${connectionId}/status`),
    },

    // Sync history and management
    syncHistory: (connectionId?: string) => {
      const endpoint = connectionId 
        ? `/connections/sync-history?connection_id=${connectionId}`
        : '/connections/sync-history';
      return apiRequest(endpoint);
    },
    
    cancelSync: (connectionId: string) =>
      apiRequest(`/connections/${connectionId}/sync/cancel`, {
        method: 'POST',
      }),
    
    // Get all connections (both exchanges and wallets)
    all: () => apiRequest('/connections'),
  },
};