import { useAuthStore, getAuthHeaders } from '../store/authStore';

// Base API URL - adjust if your API is on a different domain
const API_BASE_URL = '/api';

// Generic API request handler
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
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

  // Exchange endpoints
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
};