import { create } from 'zustand'

interface Transaction {
  id: string
  userId: string
  type: 'buy' | 'sell'
  asset: string
  amount: number
  priceGBP: number
  fee: number
  date: Date
  createdAt: Date
}

interface TaxEvent {
  id: string
  date: Date
  asset: string
  amountSold: number
  saleProceeds: number
  costBasis: number
  gainLoss: number
  type: 'gain' | 'loss'
}

interface TaxResults {
  totalGains: number
  totalLosses: number
  netGainLoss: number
  taxEvents: TaxEvent[]
  estimatedTax: number
  cgtAllowanceUsed: number
  cgtAllowanceRemaining: number
}

interface TransactionState {
  transactions: Transaction[]
  taxResults: TaxResults | null
  isLoading: boolean
  error: string | null
  
  // Actions
  addTransaction: (data: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => void
  removeTransaction: (id: string) => void
  clearTransactions: () => void
  calculateTaxes: () => void
  loadUserTransactions: (userId: string) => void
  clearError: () => void
}

// Storage keys
const TRANSACTIONS_KEY = 'taxfolio_transactions'

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  taxResults: null,
  isLoading: false,
  error: null,

  addTransaction: (data) => {
    const { transactions } = get()
    const currentUser = JSON.parse(localStorage.getItem('taxfolio_current_user') || '{}')
    
    if (!currentUser.id) {
      set({ error: 'Must be logged in to add transactions' })
      return
    }

    const newTransaction: Transaction = {
      ...data,
      id: Date.now().toString(),
      userId: currentUser.id,
      createdAt: new Date(),
    }

    const updatedTransactions = [...transactions, newTransaction]
    
    // Save to localStorage
    const allTransactions = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]')
    const otherUserTransactions = allTransactions.filter((t: Transaction) => t.userId !== currentUser.id)
    const newAllTransactions = [...otherUserTransactions, ...updatedTransactions]
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(newAllTransactions))

    set({ transactions: updatedTransactions })
    get().calculateTaxes()
  },

  removeTransaction: (id) => {
    const { transactions } = get()
    const currentUser = JSON.parse(localStorage.getItem('taxfolio_current_user') || '{}')
    
    const updatedTransactions = transactions.filter(t => t.id !== id)
    
    // Update localStorage
    const allTransactions = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]')
    const otherUserTransactions = allTransactions.filter((t: Transaction) => t.userId !== currentUser.id)
    const newAllTransactions = [...otherUserTransactions, ...updatedTransactions]
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(newAllTransactions))

    set({ transactions: updatedTransactions })
    get().calculateTaxes()
  },

  clearTransactions: () => {
    const currentUser = JSON.parse(localStorage.getItem('taxfolio_current_user') || '{}')
    
    // Remove only current user's transactions
    const allTransactions = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]')
    const otherUserTransactions = allTransactions.filter((t: Transaction) => t.userId !== currentUser.id)
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(otherUserTransactions))

    set({ transactions: [], taxResults: null })
  },

  loadUserTransactions: (userId) => {
    try {
      const allTransactions = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]')
      const userTransactions = allTransactions
        .filter((t: any) => t.userId === userId)
        .map((t: any) => ({
          ...t,
          date: new Date(t.date),
          createdAt: new Date(t.createdAt),
        }))
      
      set({ transactions: userTransactions })
      get().calculateTaxes()
    } catch (error) {
      set({ error: 'Failed to load transactions' })
    }
  },

  calculateTaxes: () => {
    const { transactions } = get()
    
    if (transactions.length === 0) {
      set({ taxResults: null })
      return
    }

    try {
      // UK CGT calculation using FIFO method
      let totalGains = 0
      let totalLosses = 0
      const taxEvents: TaxEvent[] = []

      // Sort transactions by date
      const sortedTransactions = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime())
      
      // Track holdings for each asset (FIFO pools)
      const assetHoldings: Record<string, Array<{
        amount: number
        costPerUnit: number
        purchaseDate: Date
        totalCost: number
      }>> = {}

      for (const transaction of sortedTransactions) {
        const { type, asset, amount, priceGBP, date, fee } = transaction

        if (type === 'buy') {
          // Add to holdings
          if (!assetHoldings[asset]) {
            assetHoldings[asset] = []
          }
          assetHoldings[asset].push({
            amount,
            costPerUnit: priceGBP,
            purchaseDate: date,
            totalCost: (amount * priceGBP) + fee
          })

        } else if (type === 'sell') {
          // Calculate gain/loss using FIFO
          if (!assetHoldings[asset] || assetHoldings[asset].length === 0) {
            continue // Can't sell what we don't own
          }

          let remainingToSell = amount
          let totalCostBasis = 0
          let saleProceeds = (amount * priceGBP) - fee

          while (remainingToSell > 0 && assetHoldings[asset].length > 0) {
            const holding = assetHoldings[asset][0]
            
            if (holding.amount <= remainingToSell) {
              // Use entire holding
              totalCostBasis += holding.totalCost
              remainingToSell -= holding.amount
              assetHoldings[asset].shift() // Remove this holding
            } else {
              // Use partial holding
              const portionUsed = remainingToSell / holding.amount
              totalCostBasis += holding.totalCost * portionUsed
              holding.amount -= remainingToSell
              holding.totalCost *= (1 - portionUsed)
              remainingToSell = 0
            }
          }

          const gainLoss = saleProceeds - totalCostBasis
          
          if (gainLoss > 0) {
            totalGains += gainLoss
          } else {
            totalLosses += Math.abs(gainLoss)
          }

          taxEvents.push({
            id: Date.now().toString() + Math.random(),
            date,
            asset,
            amountSold: amount,
            saleProceeds,
            costBasis: totalCostBasis,
            gainLoss,
            type: gainLoss >= 0 ? 'gain' : 'loss'
          })
        }
      }

      // Calculate UK CGT
      const netGainLoss = totalGains - totalLosses
      const cgtAllowance = 3000 // 2024/25 UK CGT allowance
      const cgtAllowanceUsed = Math.min(Math.max(netGainLoss, 0), cgtAllowance)
      const cgtAllowanceRemaining = cgtAllowance - cgtAllowanceUsed
      const taxableGain = Math.max(0, netGainLoss - cgtAllowance)
      const estimatedTax = taxableGain * 0.2 // 20% higher rate CGT

      const taxResults: TaxResults = {
        totalGains,
        totalLosses,
        netGainLoss,
        taxEvents,
        estimatedTax,
        cgtAllowanceUsed,
        cgtAllowanceRemaining,
      }

      set({ taxResults })
    } catch (error) {
      set({ error: 'Failed to calculate taxes' })
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))