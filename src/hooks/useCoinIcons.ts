// src/hooks/useCoinIcons.ts

import { useState, useEffect, useMemo } from 'react';
import coinIconService from '../services/coinIconService';

interface UseCoinIconsReturn {
  icons: { [symbol: string]: string };
  loading: boolean;
  error: string | null;
  getIconUrl: (symbol: string) => string;
  preloadIcons: (symbols: string[]) => Promise<void>;
}

export const useCoinIcons = (symbols: string[] = []): UseCoinIconsReturn => {
  const [icons, setIcons] = useState<{ [symbol: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uniqueSymbols = useMemo(() => {
    return [...new Set(symbols.map(s => s.toUpperCase()))];
  }, [symbols]);

  const preloadIcons = async (symbolsToLoad: string[]) => {
    if (symbolsToLoad.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Preloading icons for:', symbolsToLoad);
      const iconUrls = await coinIconService.getMultipleIcons(symbolsToLoad, 'small');
      
      setIcons(prev => ({
        ...prev,
        ...iconUrls
      }));

      console.log('Icons loaded:', Object.keys(iconUrls));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load coin icons';
      setError(errorMessage);
      console.error('Error preloading icons:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIconUrl = (symbol: string): string => {
    return icons[symbol.toUpperCase()] || '';
  };

  // Auto-preload when symbols change
  useEffect(() => {
    if (uniqueSymbols.length > 0) {
      // Only load symbols we don't already have
      const symbolsToLoad = uniqueSymbols.filter(symbol => !icons[symbol]);
      
      if (symbolsToLoad.length > 0) {
        preloadIcons(symbolsToLoad);
      }
    }
  }, [uniqueSymbols]);

  return {
    icons,
    loading,
    error,
    getIconUrl,
    preloadIcons
  };
};

// Hook specifically for transaction assets
export const useTransactionIcons = (transactions: any[]) => {
  const symbols = useMemo(() => {
    const symbolSet = new Set<string>();
    
    transactions.forEach(tx => {
      if (tx.asset) symbolSet.add(tx.asset.toUpperCase());
      if (tx.fromAsset) symbolSet.add(tx.fromAsset.toUpperCase());
      if (tx.toAsset) symbolSet.add(tx.toAsset.toUpperCase());
      if (tx.feeAsset) symbolSet.add(tx.feeAsset.toUpperCase());
    });

    return Array.from(symbolSet);
  }, [transactions]);

  return useCoinIcons(symbols);
};

export default useCoinIcons;