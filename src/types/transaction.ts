// src/types/transaction.ts

// This matches your existing useTransactions.ts
export type TransactionType = 
  | 'buy' 
  | 'sell' 
  | 'transfer_in' 
  | 'transfer_out' 
  | 'trade' 
  | 'fee'
  | 'mining' 
  | 'staking';

export type TransactionCategory = 'Outgoing' | 'Incoming' | 'Trade' | 'Fee';

// This matches your useTransactions hook
export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: TransactionCategory;
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

// For the form (before it has an ID)
export interface TransactionFormData {
  type: TransactionType;
  asset: string;
  amount: number;
  price?: number;
  fee?: number;
  date: string;
  exchange?: string;
  notes?: string;
}

// This matches your transactionStore.ts for tax calculations
export interface SimplifiedTransaction {
  id: string;
  userId: string;
  type: 'buy' | 'sell';
  asset: string;
  amount: number;
  priceGBP: number;
  fee: number;
  date: Date;
  createdAt: Date;
}

// Re-export from your hooks
export { useTransactions } from '../hooks/useTransactions';
export { useTransactionStore } from '../store/transactionStore';