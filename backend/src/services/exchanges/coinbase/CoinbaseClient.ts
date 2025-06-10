// backend/src/services/exchanges/coinbase/CoinbaseClient.ts
import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';
import { ExchangeClient, ExchangeTransaction, SyncResult } from '../types';
import { decrypt } from '../../../utils/encryption';

const logger = {
  error: (message: string, ...args: any[]) => console.error(`[CoinbaseClient] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[CoinbaseClient] ${message}`, ...args),
  info: (message: string, ...args: any[]) => console.log(`[CoinbaseClient] ${message}`, ...args)
};

interface CoinbaseCredentials {
  apiKey: string;
  apiSecret: string;
}

interface CoinbaseAccount {
  id: string;
  name: string;
  primary: boolean;
  type: string;
  currency: {
    code: string;
    name: string;
  };
  balance: {
    amount: string;
    currency: string;
  };
  created_at: string;
  updated_at: string;
}

interface CoinbaseTransaction {
  id: string;
  type: 'send' | 'request' | 'transfer' | 'buy' | 'sell' | 'fiat_deposit' | 'fiat_withdrawal' | 'exchange_deposit' | 'exchange_withdrawal' | 'vault_withdrawal';
  status: 'pending' | 'completed' | 'failed' | 'expired' | 'canceled' | 'waiting_for_signature' | 'waiting_for_clearing';
  amount: {
    amount: string;
    currency: string;
  };
  native_amount: {
    amount: string;
    currency: string;
  };
  description: string | null;
  created_at: string;
  updated_at: string;
  resource: string;
  resource_path: string;
  instant_exchange: boolean;
  network?: {
    status: string;
    hash: string;
    name: string;
  };
  to?: {
    resource: string;
    address?: string;
    currency?: string;
  };
  from?: {
    resource: string;
    address?: string;
    currency?: string;
  };
  details: {
    title: string;
    subtitle: string;
  };
}

interface CoinbaseBuySell {
  id: string;
  status: string;
  payment_method: {
    id: string;
    resource: string;
    resource_path: string;
  };
  transaction: {
    id: string;
    resource: string;
    resource_path: string;
  };
  amount: {
    amount: string;
    currency: string;
  };
  total: {
    amount: string;
    currency: string;
  };
  subtotal: {
    amount: string;
    currency: string;
  };
  created_at: string;
  updated_at: string;
  resource: string;
  resource_path: string;
  committed: boolean;
  instant: boolean;
  fee: {
    amount: string;
    currency: string;
  };
  payout_at: string;
}

export class CoinbaseClient implements ExchangeClient {
  private client: AxiosInstance;
  private apiKey: string;
  private apiSecret: string;
  private apiVersion = 'v2';
  private baseURL = 'https://api.coinbase.com';

  constructor(encryptedCredentials: string, encryptionKey: string) {
    // Handle both JSON string and object formats
    let credentials: CoinbaseCredentials;
    
    try {
      // First try to parse as JSON (new connections)
      const parsed = JSON.parse(encryptedCredentials);
      credentials = {
        apiKey: decrypt(parsed.apiKey, encryptionKey),
        apiSecret: decrypt(parsed.apiSecret, encryptionKey)
      };
    } catch {
      // Fall back to decrypting the whole string (legacy format)
      const decryptedCreds = decrypt(encryptedCredentials, encryptionKey);
      credentials = JSON.parse(decryptedCreds);
    }
    
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'CB-VERSION': '2023-12-01'
      }
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      const timestamp = Math.floor(Date.now() / 1000);
      const method = config.method?.toUpperCase() || 'GET';
      const path = config.url?.replace(this.baseURL, '') || '';
      const body = config.data ? JSON.stringify(config.data) : '';
      
      const message = timestamp + method + path + body;
      const signature = this.generateSignature(message);
      
      config.headers['CB-ACCESS-KEY'] = this.apiKey;
      config.headers['CB-ACCESS-SIGN'] = signature;
      config.headers['CB-ACCESS-TIMESTAMP'] = timestamp.toString();
      
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Coinbase API error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        throw error;
      }
    );
  }

  private generateSignature(message: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('hex');
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get(`/${this.apiVersion}/user`);
      return response.status === 200;
    } catch (error) {
      logger.error('Coinbase connection test failed:', error);
      return false;
    }
  }

  async getAccounts(): Promise<CoinbaseAccount[]> {
    try {
      const accounts: CoinbaseAccount[] = [];
      let nextUri = `/${this.apiVersion}/accounts`;
      
      while (nextUri) {
        const response = await this.client.get(nextUri);
        accounts.push(...response.data.data);
        nextUri = response.data.pagination?.next_uri || null;
      }
      
      return accounts;
    } catch (error) {
      logger.error('Failed to fetch Coinbase accounts:', error);
      throw new Error('Failed to fetch accounts from Coinbase');
    }
  }

  async syncTransactions(since?: Date): Promise<SyncResult> {
    try {
      const accounts = await this.getAccounts();
      const allTransactions: ExchangeTransaction[] = [];
      let totalSynced = 0;
      
      for (const account of accounts) {
        // Skip zero-balance accounts unless they have history
        if (parseFloat(account.balance.amount) === 0 && !since) {
          continue;
        }
        
        const transactions = await this.getAccountTransactions(account.id, since);
        const buys = await this.getAccountBuys(account.id, since);
        const sells = await this.getAccountSells(account.id, since);
        
        // Convert transactions
        for (const tx of transactions) {
          const converted = this.convertTransaction(tx, account);
          if (converted) {
            allTransactions.push(converted);
            totalSynced++;
          }
        }
        
        // Convert buys
        for (const buy of buys) {
          const converted = await this.convertBuySell(buy, 'buy', account);
          if (converted) {
            allTransactions.push(converted);
            totalSynced++;
          }
        }
        
        // Convert sells
        for (const sell of sells) {
          const converted = await this.convertBuySell(sell, 'sell', account);
          if (converted) {
            allTransactions.push(converted);
            totalSynced++;
          }
        }
      }
      
      return {
        success: true,
        transactions: allTransactions,
        totalSynced,
        lastSyncedAt: new Date()
      };
    } catch (error) {
      logger.error('Coinbase sync failed:', error);
      return {
        success: false,
        transactions: [],
        totalSynced: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async getAccountTransactions(accountId: string, since?: Date): Promise<CoinbaseTransaction[]> {
    const transactions: CoinbaseTransaction[] = [];
    let nextUri = `/${this.apiVersion}/accounts/${accountId}/transactions`;
    
    while (nextUri) {
      const response = await this.client.get(nextUri);
      const data = response.data.data;
      
      // Filter by date if provided
      if (since) {
        const filtered = data.filter((tx: CoinbaseTransaction) => 
          new Date(tx.created_at) > since
        );
        transactions.push(...filtered);
        
        // Stop pagination if we've reached older transactions
        if (filtered.length < data.length) {
          break;
        }
      } else {
        transactions.push(...data);
      }
      
      nextUri = response.data.pagination?.next_uri || null;
    }
    
    return transactions;
  }

  private async getAccountBuys(accountId: string, since?: Date): Promise<CoinbaseBuySell[]> {
    const buys: CoinbaseBuySell[] = [];
    let nextUri = `/${this.apiVersion}/accounts/${accountId}/buys`;
    
    while (nextUri) {
      try {
        const response = await this.client.get(nextUri);
        const data = response.data.data;
        
        if (since) {
          const filtered = data.filter((buy: CoinbaseBuySell) => 
            new Date(buy.created_at) > since
          );
          buys.push(...filtered);
          
          if (filtered.length < data.length) {
            break;
          }
        } else {
          buys.push(...data);
        }
        
        nextUri = response.data.pagination?.next_uri || null;
      } catch (error: any) {
        // Some accounts may not have buy/sell permissions
        if (error.response?.status === 403) {
          break;
        }
        throw error;
      }
    }
    
    return buys;
  }

  private async getAccountSells(accountId: string, since?: Date): Promise<CoinbaseBuySell[]> {
    const sells: CoinbaseBuySell[] = [];
    let nextUri = `/${this.apiVersion}/accounts/${accountId}/sells`;
    
    while (nextUri) {
      try {
        const response = await this.client.get(nextUri);
        const data = response.data.data;
        
        if (since) {
          const filtered = data.filter((sell: CoinbaseBuySell) => 
            new Date(sell.created_at) > since
          );
          sells.push(...filtered);
          
          if (filtered.length < data.length) {
            break;
          }
        } else {
          sells.push(...data);
        }
        
        nextUri = response.data.pagination?.next_uri || null;
      } catch (error: any) {
        if (error.response?.status === 403) {
          break;
        }
        throw error;
      }
    }
    
    return sells;
  }

  private convertTransaction(tx: CoinbaseTransaction, account: CoinbaseAccount): ExchangeTransaction | null {
    // Skip pending or failed transactions
    if (tx.status !== 'completed') {
      return null;
    }
    
    const baseTransaction = {
      external_id: tx.id,
      date: new Date(tx.created_at),
      exchange: 'coinbase',
      notes: tx.description || tx.details.title,
      tx_hash: tx.network?.hash
    };
    
    // Map Coinbase transaction types to our transaction types
    switch (tx.type) {
      case 'send':
        return {
          ...baseTransaction,
          type: 'withdrawal',
          asset: tx.amount.currency,
          amount: Math.abs(parseFloat(tx.amount.amount)),
          value: Math.abs(parseFloat(tx.native_amount.amount))
        };
        
      case 'buy':
        return {
          ...baseTransaction,
          type: 'buy',
          asset: tx.amount.currency,
          amount: parseFloat(tx.amount.amount),
          value: Math.abs(parseFloat(tx.native_amount.amount))
        };
        
      case 'sell':
        return {
          ...baseTransaction,
          type: 'sell',
          asset: tx.amount.currency,
          amount: Math.abs(parseFloat(tx.amount.amount)),
          value: parseFloat(tx.native_amount.amount)
        };
        
      case 'exchange_deposit':
      case 'fiat_deposit':
        return {
          ...baseTransaction,
          type: 'deposit',
          asset: tx.amount.currency,
          amount: parseFloat(tx.amount.amount),
          value: parseFloat(tx.native_amount.amount)
        };
        
      case 'exchange_withdrawal':
      case 'fiat_withdrawal':
        return {
          ...baseTransaction,
          type: 'withdrawal',
          asset: tx.amount.currency,
          amount: Math.abs(parseFloat(tx.amount.amount)),
          value: Math.abs(parseFloat(tx.native_amount.amount))
        };
        
      default:
        logger.warn(`Unknown Coinbase transaction type: ${tx.type}`);
        return null;
    }
  }

  private async convertBuySell(buySell: CoinbaseBuySell, type: 'buy' | 'sell', account: CoinbaseAccount): Promise<ExchangeTransaction | null> {
    if (buySell.status !== 'completed') {
      return null;
    }
    
    return {
      external_id: buySell.id,
      date: new Date(buySell.created_at),
      type,
      asset: buySell.amount.currency,
      amount: parseFloat(buySell.amount.amount),
      price: parseFloat(buySell.subtotal.amount) / parseFloat(buySell.amount.amount),
      value: parseFloat(buySell.subtotal.amount),
      fee: parseFloat(buySell.fee.amount),
      fee_asset: buySell.fee.currency,
      exchange: 'coinbase',
      notes: `${type === 'buy' ? 'Bought' : 'Sold'} ${buySell.amount.amount} ${buySell.amount.currency}`
    };
  }

  async getBalances(): Promise<Record<string, number>> {
    try {
      const accounts = await this.getAccounts();
      const balances: Record<string, number> = {};
      
      for (const account of accounts) {
        const balance = parseFloat(account.balance.amount);
        if (balance > 0) {
          balances[account.currency.code] = balance;
        }
      }
      
      return balances;
    } catch (error) {
      logger.error('Failed to fetch Coinbase balances:', error);
      throw new Error('Failed to fetch balances from Coinbase');
    }
  }
}