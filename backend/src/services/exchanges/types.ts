// backend/src/services/exchanges/types.ts
export interface ExchangeTransaction {
    external_id: string;
    date: Date;
    type: 'buy' | 'sell' | 'trade' | 'deposit' | 'withdrawal' | 'transfer' | 'staking' | 'mining' | 'airdrop' | 'other';
    asset: string;
    amount: number;
    price?: number;
    value?: number;
    fee?: number;
    fee_asset?: string;
    from_asset?: string;
    from_amount?: number;
    to_asset?: string;
    to_amount?: number;
    exchange: string;
    tx_hash?: string;
    notes?: string;
  }
  
  export interface SyncResult {
    success: boolean;
    transactions: ExchangeTransaction[];
    totalSynced: number;
    lastSyncedAt?: Date;
    error?: string;
  }
  
  export interface ExchangeClient {
    testConnection(): Promise<boolean>;
    syncTransactions(since?: Date): Promise<SyncResult>;
    getBalances(): Promise<Record<string, number>>;
  }