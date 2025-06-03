export interface User {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  userId: string
  type: 'buy' | 'sell'
  asset: string
  amount: number
  priceGBP: number
  fee: number
  date: Date
  createdAt: Date
  updatedAt: Date
}

export interface TaxEvent {
  id: string
  date: Date
  asset: string
  amountSold: number
  saleProceeds: number
  costBasis: number
  gainLoss: number
  type: 'gain' | 'loss'
}

export interface UserStats {
  totalTransactions: number
  totalGains: number
  totalLosses: number
  netGainLoss: number
  estimatedTax: number
  cgtAllowanceUsed: number
  cgtAllowanceRemaining: number
}

export type AuthMode = 'login' | 'signup'