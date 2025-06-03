// src/hooks/usePrices.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import priceService, { PriceData } from '../services/priceService';

interface UsePricesReturn {
  prices: PriceData;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshPrices: () => Promise<void>;
  getPriceForAsset: (symbol: string) => number;
  getValueForAmount: (symbol: string, amount: number) => number;
  isSupported: (symbol: string) => boolean;
}

export const usePrices = (symbols: string[] = [], autoRefresh = true): UsePricesReturn => {
  const [prices, setPrices] = useState<PriceData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousSymbolsRef = useRef<string>('');

  const fetchPrices = useCallback(async (symbolsToFetch: string[]) => {
    if (symbolsToFetch.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching prices for:', symbolsToFetch);
      const priceData = await priceService.getPrices(symbolsToFetch);
      
      setPrices(priceData);
      setLastUpdated(new Date());
      setError(null);
      
      console.log('Prices updated:', Object.keys(priceData));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prices';
      setError(errorMessage);
      console.error('Price fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPrices = useCallback(async () => {
    if (symbols.length > 0) {
      await fetchPrices(symbols);
    }
  }, [symbols, fetchPrices]);

  // Initial fetch and when symbols change
  useEffect(() => {
    const currentSymbols = symbols.sort().join(',');
    const previousSymbols = previousSymbolsRef.current;

    // Only fetch if symbols have changed or it's the first load
    if (currentSymbols !== previousSymbols && symbols.length > 0) {
      previousSymbolsRef.current = currentSymbols;
      fetchPrices(symbols);
    }
  }, [symbols, fetchPrices]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || symbols.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval (refresh every 2 minutes)
    intervalRef.current = setInterval(() => {
      console.log('Auto-refreshing prices...');
      fetchPrices(symbols);
    }, 120000); // 2 minutes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [symbols, autoRefresh, fetchPrices]);

  // Helper functions
  const getPriceForAsset = useCallback((symbol: string): number => {
    const normalizedSymbol = symbol.toUpperCase();
    return prices[normalizedSymbol]?.gbp || 0;
  }, [prices]);

  const getValueForAmount = useCallback((symbol: string, amount: number): number => {
    const price = getPriceForAsset(symbol);
    return price * amount;
  }, [getPriceForAsset]);

  const isSupported = useCallback((symbol: string): boolean => {
    return priceService.getSupportedSymbols().includes(symbol.toUpperCase());
  }, []);

  return {
    prices,
    loading,
    error,
    lastUpdated,
    refreshPrices,
    getPriceForAsset,
    getValueForAmount,
    isSupported
  };
};

// Hook for getting unique assets from transactions
export const useAssetPrices = (transactions: any[], autoRefresh = true) => {
  const uniqueAssets = useState(() => {
    const assetSet = new Set<string>();
    
    transactions.forEach(tx => {
      if (tx.asset) assetSet.add(tx.asset.toUpperCase());
      if (tx.fromAsset) assetSet.add(tx.fromAsset.toUpperCase());
      if (tx.toAsset) assetSet.add(tx.toAsset.toUpperCase());
      if (tx.feeAsset) assetSet.add(tx.feeAsset.toUpperCase());
    });

    return Array.from(assetSet);
  })[0];

  return usePrices(uniqueAssets, autoRefresh);
};

export default usePrices;