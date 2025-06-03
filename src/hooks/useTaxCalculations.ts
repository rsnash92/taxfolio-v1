import { useMemo } from 'react';
import { Transaction } from './useTransactions';

// =============================================================================
// TYPES & INTERFACES - Designed for Multi-Country Support
// =============================================================================

export type TaxYear = {
  start: Date;
  end: Date;
  label: string;
  cgtExemption: number;
  cgtBasicRate: number;
  cgtHigherRate: number;
};

export type AccountingMethod = 'section_104' | 'fifo' | 'lifo' | 'specific_id';

export interface TaxSettings {
  country: 'UK' | 'US' | 'CA' | 'AU'; // Ready for expansion
  taxYear: string;
  accountingMethod: AccountingMethod;
  annualIncome: number; // To determine CGT rate
  personalAllowance: number;
}

export interface CapitalGainsEvent {
  id: string;
  date: Date;
  asset: string;
  disposalAmount: number;
  acquisitionCost: number;
  gain: number;
  loss: number;
  sellTransaction: Transaction;
  acquisitionTransactions: Transaction[];
  exemptionUsed: number;
  taxableGain: number;
  taxRate: number;
  taxOwed: number;
}

export interface IncomeEvent {
  id: string;
  date: Date;
  asset: string;
  amount: number;
  valueAtReceipt: number;
  type: 'mining' | 'staking' | 'airdrop' | 'defi_yield' | 'employment' | 'other';
  transaction: Transaction;
  taxRate: number;
  taxOwed: number;
}

export interface TaxSummary {
  taxYear: TaxYear;
  capitalGains: {
    totalGains: number;
    totalLosses: number;
    netGains: number;
    exemptionUsed: number;
    taxableGains: number;
    taxOwed: number;
    events: CapitalGainsEvent[];
  };
  income: {
    totalIncome: number;
    taxableIncome: number;
    taxOwed: number;
    events: IncomeEvent[];
  };
  totalTaxOwed: number;
}

// =============================================================================
// UK-SPECIFIC TAX CONSTANTS & RULES
// =============================================================================

const UK_TAX_YEARS: { [key: string]: TaxYear } = {
  '2022-23': {
    start: new Date('2022-04-06'),
    end: new Date('2023-04-05'),
    label: '2022-23',
    cgtExemption: 12300, // Higher exemption in 2022-23
    cgtBasicRate: 0.10,
    cgtHigherRate: 0.20
  },
  '2023-24': {
    start: new Date('2023-04-06'),
    end: new Date('2024-04-05'),
    label: '2023-24',
    cgtExemption: 6000,
    cgtBasicRate: 0.10,
    cgtHigherRate: 0.20
  },
  '2024-25': {
    start: new Date('2024-04-06'),
    end: new Date('2025-04-05'),
    label: '2024-25',
    cgtExemption: 3000,
    cgtBasicRate: 0.10,
    cgtHigherRate: 0.20
  }
};

// Higher rate threshold for 2023-24 (England, Wales, NI)
const UK_HIGHER_RATE_THRESHOLD = 50270;

// =============================================================================
// CORE TAX CALCULATION FUNCTIONS
// =============================================================================

class UKTaxCalculator {
  private transactions: Transaction[];
  private settings: TaxSettings;
  private taxYear: TaxYear;

  constructor(transactions: Transaction[], settings: TaxSettings) {
    this.transactions = transactions;
    this.settings = settings;
    this.taxYear = UK_TAX_YEARS[settings.taxYear];
  }

  /**
   * Filter transactions for the current tax year
   */
  private getTransactionsInTaxYear(): Transaction[] {
    const filtered = this.transactions.filter(tx => {
      const txDate = new Date(tx.date);
      // Use date-only comparison to avoid timezone issues
      const txDateOnly = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
      const startDateOnly = new Date(this.taxYear.start.getFullYear(), this.taxYear.start.getMonth(), this.taxYear.start.getDate());
      const endDateOnly = new Date(this.taxYear.end.getFullYear(), this.taxYear.end.getMonth(), this.taxYear.end.getDate());
      
      const isInYear = txDateOnly >= startDateOnly && txDateOnly <= endDateOnly;
      
      // Debug logging
      if (tx.type === 'sell') {
        console.log('🔍 Fixed date comparison:', {
          originalDate: tx.date,
          txDateOnly: txDateOnly,
          startDateOnly: startDateOnly,
          endDateOnly: endDateOnly,
          isInTaxYear: isInYear,
          asset: tx.asset
        });
      }
      
      return isInYear;
    });
    
    console.log('🔍 Transactions in tax year after fix:', filtered.length);
    return filtered;
  }

  /**
   * UK-specific disposal identification rules:
   * 1. Same Day Rule
   * 2. 30-Day Rule (Bed and Breakfast)
   * 3. Section 104 Pool
   */
  private identifyAcquisitionsForDisposal(
    disposal: Transaction,
    availableAcquisitions: Transaction[]
  ): { acquisitions: Transaction[]; remainingCost: number } {
    const disposalDate = new Date(disposal.date);
    const disposalAmount = disposal.amount;
    
    let identifiedAcquisitions: Transaction[] = [];
    let remainingToMatch = disposalAmount;
    let totalCost = 0;

    // Step 1: Same Day Rule - acquisitions on the same day
    const sameDayAcquisitions = availableAcquisitions.filter(acq => {
      const acqDate = new Date(acq.date);
      return acqDate.toDateString() === disposalDate.toDateString() && 
             acq.asset === disposal.asset;
    });

    for (const acq of sameDayAcquisitions) {
      if (remainingToMatch <= 0) break;
      
      const matchAmount = Math.min(remainingToMatch, acq.amount);
      const costBasis = (acq.value || acq.amount * (acq.price || 0));
      const allocatedCost = (costBasis / acq.amount) * matchAmount;
      
      identifiedAcquisitions.push({
        ...acq,
        amount: matchAmount,
        value: allocatedCost
      });
      
      totalCost += allocatedCost;
      remainingToMatch -= matchAmount;
    }

    // Step 2: 30-Day Rule - acquisitions within 30 days after disposal
    if (remainingToMatch > 0) {
      const thirtyDaysAfter = new Date(disposalDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const thirtyDayAcquisitions = availableAcquisitions.filter(acq => {
        const acqDate = new Date(acq.date);
        return acqDate > disposalDate && 
               acqDate <= thirtyDaysAfter && 
               acq.asset === disposal.asset &&
               !sameDayAcquisitions.includes(acq);
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (const acq of thirtyDayAcquisitions) {
        if (remainingToMatch <= 0) break;
        
        const matchAmount = Math.min(remainingToMatch, acq.amount);
        const costBasis = (acq.value || acq.amount * (acq.price || 0));
        const allocatedCost = (costBasis / acq.amount) * matchAmount;
        
        identifiedAcquisitions.push({
          ...acq,
          amount: matchAmount,
          value: allocatedCost
        });
        
        totalCost += allocatedCost;
        remainingToMatch -= matchAmount;
      }
    }

    // Step 3: Section 104 Pool - FIFO from remaining acquisitions before disposal
    if (remainingToMatch > 0) {
      const poolAcquisitions = availableAcquisitions.filter(acq => {
        const acqDate = new Date(acq.date);
        return acqDate < disposalDate && 
               acq.asset === disposal.asset &&
               !sameDayAcquisitions.includes(acq);
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (const acq of poolAcquisitions) {
        if (remainingToMatch <= 0) break;
        
        const matchAmount = Math.min(remainingToMatch, acq.amount);
        const costBasis = (acq.value || acq.amount * (acq.price || 0));
        const allocatedCost = (costBasis / acq.amount) * matchAmount;
        
        identifiedAcquisitions.push({
          ...acq,
          amount: matchAmount,
          value: allocatedCost
        });
        
        totalCost += allocatedCost;
        remainingToMatch -= matchAmount;
      }
    }

    return {
      acquisitions: identifiedAcquisitions,
      remainingCost: totalCost
    };
  }

  /**
   * Calculate capital gains for disposals (sells, trades out)
   */
  calculateCapitalGains(): CapitalGainsEvent[] {
    const taxYearTransactions = this.getTransactionsInTaxYear();
    const allTransactions = this.transactions; // Need all transactions for cost basis
    
    // Get all disposals in tax year
    const disposals = taxYearTransactions.filter(tx => 
      tx.type === 'sell' || tx.type === 'transfer_out' || 
      (tx.type === 'trade' && tx.fromAsset)
    );

    // Get all acquisitions (all time for cost basis)
    const acquisitions = allTransactions.filter(tx => 
      tx.type === 'buy' || tx.type === 'transfer_in' || tx.type === 'mining' || 
      tx.type === 'staking' || (tx.type === 'trade' && tx.toAsset)
    );

    const cgtEvents: CapitalGainsEvent[] = [];
    let availableAcquisitions = [...acquisitions];
    let totalExemptionUsed = 0;

    for (const disposal of disposals) {
      const disposalAmount = disposal.amount;
      const disposalValue = disposal.value || 0;
      
      // Find matching acquisitions using UK rules
      const { acquisitions: matchedAcquisitions, remainingCost } = 
        this.identifyAcquisitionsForDisposal(disposal, availableAcquisitions);

      const gain = disposalValue - remainingCost;
      const isGain = gain > 0;
      
      // Apply annual exemption to gains (not losses)
      const exemptionToUse = isGain ? 
        Math.min(gain, this.taxYear.cgtExemption - totalExemptionUsed) : 0;
      
      totalExemptionUsed += exemptionToUse;
      
      const taxableGain = Math.max(0, gain - exemptionToUse);
      
      // Determine tax rate based on total income
      const isHigherRatetaxpayer = this.settings.annualIncome > UK_HIGHER_RATE_THRESHOLD;
      const taxRate = isHigherRatetaxpayer ? this.taxYear.cgtHigherRate : this.taxYear.cgtBasicRate;
      
      const taxOwed = taxableGain * taxRate;

      const cgtEvent: CapitalGainsEvent = {
        id: `cgt_${disposal.id}`,
        date: new Date(disposal.date),
        asset: disposal.asset,
        disposalAmount,
        acquisitionCost: remainingCost,
        gain: Math.max(0, gain),
        loss: Math.max(0, -gain),
        sellTransaction: disposal,
        acquisitionTransactions: matchedAcquisitions,
        exemptionUsed: exemptionToUse,
        taxableGain,
        taxRate,
        taxOwed
      };

      cgtEvents.push(cgtEvent);

      // Remove used acquisitions from available pool
      for (const used of matchedAcquisitions) {
        const index = availableAcquisitions.findIndex(a => a.id === used.id);
        if (index !== -1) {
          const remaining = availableAcquisitions[index];
          if (remaining.amount > used.amount) {
            // Partial use - update remaining amount
            availableAcquisitions[index] = {
              ...remaining,
              amount: remaining.amount - used.amount,
              value: (remaining.value || 0) - (used.value || 0)
            };
          } else {
            // Fully used - remove
            availableAcquisitions.splice(index, 1);
          }
        }
      }
    }

    return cgtEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Calculate income from mining, staking, airdrops, etc.
   */
  calculateIncome(): IncomeEvent[] {
    const taxYearTransactions = this.getTransactionsInTaxYear();
    
    const incomeTransactions = taxYearTransactions.filter(tx => 
      tx.type === 'mining' || tx.type === 'staking' || 
      (tx.type === 'transfer_in' && tx.notes?.toLowerCase().includes('airdrop'))
    );

    const incomeEvents: IncomeEvent[] = [];

    for (const tx of incomeTransactions) {
      const valueAtReceipt = tx.value || 0;
      
      // Income tax calculation (simplified - would need full tax calculation)
      const taxRate = this.settings.annualIncome > UK_HIGHER_RATE_THRESHOLD ? 0.40 : 0.20;
      const taxOwed = valueAtReceipt * taxRate;

      let incomeType: IncomeEvent['type'] = 'other';
      if (tx.type === 'mining') incomeType = 'mining';
      else if (tx.type === 'staking') incomeType = 'staking';
      else if (tx.notes?.toLowerCase().includes('airdrop')) incomeType = 'airdrop';

      const incomeEvent: IncomeEvent = {
        id: `income_${tx.id}`,
        date: new Date(tx.date),
        asset: tx.asset,
        amount: tx.amount,
        valueAtReceipt,
        type: incomeType,
        transaction: tx,
        taxRate,
        taxOwed
      };

      incomeEvents.push(incomeEvent);
    }

    return incomeEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Generate complete tax summary
   */
  generateTaxSummary(): TaxSummary {
    const cgtEvents = this.calculateCapitalGains();
    const incomeEvents = this.calculateIncome();

    const capitalGains = {
      totalGains: cgtEvents.reduce((sum, event) => sum + event.gain, 0),
      totalLosses: cgtEvents.reduce((sum, event) => sum + event.loss, 0),
      netGains: cgtEvents.reduce((sum, event) => sum + (event.gain - event.loss), 0),
      exemptionUsed: cgtEvents.reduce((sum, event) => sum + event.exemptionUsed, 0),
      taxableGains: cgtEvents.reduce((sum, event) => sum + event.taxableGain, 0),
      taxOwed: cgtEvents.reduce((sum, event) => sum + event.taxOwed, 0),
      events: cgtEvents
    };

    const income = {
      totalIncome: incomeEvents.reduce((sum, event) => sum + event.valueAtReceipt, 0),
      taxableIncome: incomeEvents.reduce((sum, event) => sum + event.valueAtReceipt, 0),
      taxOwed: incomeEvents.reduce((sum, event) => sum + event.taxOwed, 0),
      events: incomeEvents
    };

    return {
      taxYear: this.taxYear,
      capitalGains,
      income,
      totalTaxOwed: capitalGains.taxOwed + income.taxOwed
    };
  }
}

// =============================================================================
// REACT HOOK - MAIN EXPORT
// =============================================================================

export const useTaxCalculations = (
  transactions: Transaction[],
  settings?: Partial<TaxSettings>
) => {
  const defaultSettings: TaxSettings = {
    country: 'UK',
    taxYear: '2023-24',
    accountingMethod: 'section_104',
    annualIncome: 30000, // Basic rate taxpayer
    personalAllowance: 12570 // 2023-24 UK personal allowance
  };

  const taxSettings = { ...defaultSettings, ...settings };

  const taxSummary = useMemo(() => {
    if (!transactions.length) {
      console.log('🔍 No transactions found');
      return null;
    }

    console.log('🔍 Tax Calculator Debug:', {
      totalTransactions: transactions.length,
      taxYear: taxSettings.taxYear,
      sampleTransaction: transactions[0]
    });

    const calculator = new UKTaxCalculator(transactions, taxSettings);
    const summary = calculator.generateTaxSummary();
    
    console.log('🔍 Tax Summary Generated:', {
      capitalGainsEvents: summary.capitalGains.events.length,
      totalGains: summary.capitalGains.totalGains,
      totalTaxOwed: summary.totalTaxOwed
    });
    
    return summary;
  }, [transactions, taxSettings]);

  // Helper functions for components
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(rate);
  };

  return {
    taxSummary,
    taxSettings,
    availableTaxYears: Object.keys(UK_TAX_YEARS),
    formatCurrency,
    formatPercentage,
    
    // Future expansion ready
    supportedCountries: ['UK'] // Will expand to ['UK', 'US', 'CA', 'AU']
  };
};

// =============================================================================
// UTILITY FUNCTIONS FOR COMPONENTS
// =============================================================================

export const getTaxYearFromDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // UK tax year starts April 6th
  if (month >= 3) { // April onwards
    return `${year}-${(year + 1).toString().slice(2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(2)}`;
  }
};

export const isTransactionInTaxYear = (transaction: Transaction, taxYear: string): boolean => {
  const txDate = new Date(transaction.date);
  const yearConfig = UK_TAX_YEARS[taxYear];
  
  if (!yearConfig) return false;
  
  return txDate >= yearConfig.start && txDate <= yearConfig.end;
};