// src/components/common/CoinIcon.tsx

import React, { useState, useEffect } from 'react';
import coinIconService from '../../services/coinIconService';

interface CoinIconProps {
  symbol: string;
  size?: 'thumb' | 'small' | 'large' | number;
  className?: string;
  showFallback?: boolean;
  alt?: string;
}

export const CoinIcon: React.FC<CoinIconProps> = ({ 
  symbol, 
  size = 'small', 
  className = '', 
  showFallback = true,
  alt 
}) => {
  const [iconUrl, setIconUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Convert size number to pixel dimensions
  const getPixelSize = (size: 'thumb' | 'small' | 'large' | number): { width: number; height: number; apiSize: 'thumb' | 'small' | 'large' } => {
    if (typeof size === 'number') {
      // For custom pixel sizes, choose appropriate API size
      if (size <= 32) return { width: size, height: size, apiSize: 'thumb' };
      if (size <= 64) return { width: size, height: size, apiSize: 'small' };
      return { width: size, height: size, apiSize: 'large' };
    }
    
    // Predefined sizes matching CoinGecko API
    switch (size) {
      case 'thumb': return { width: 32, height: 32, apiSize: 'thumb' };
      case 'small': return { width: 64, height: 64, apiSize: 'small' };
      case 'large': return { width: 128, height: 128, apiSize: 'large' };
      default: return { width: 64, height: 64, apiSize: 'small' };
    }
  };

  const { width, height, apiSize } = getPixelSize(size);

  useEffect(() => {
    let isMounted = true;

    const fetchIcon = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const url = await coinIconService.getIconUrl(symbol, apiSize);
        
        if (isMounted) {
          setIconUrl(url);
          setLoading(false);
        }
      } catch (err) {
        console.error(`Error loading icon for ${symbol}:`, err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    if (symbol) {
      fetchIcon();
    }

    return () => {
      isMounted = false;
    };
  }, [symbol, apiSize]);

  // Loading state
  if (loading) {
    return (
      <div 
        className={`animate-pulse bg-gray-200 rounded-full ${className}`}
        style={{ width, height }}
      >
        <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-gray-500 text-xs font-medium">
            {symbol.charAt(0)}
          </span>
        </div>
      </div>
    );
  }

  // Error state or fallback
  if (error || !iconUrl) {
    if (!showFallback) {
      return null;
    }

    // Fallback to colored circle with symbol
    const backgroundColor = getColorForSymbol(symbol);
    
    return (
      <div 
        className={`rounded-full flex items-center justify-center text-white font-semibold ${className}`}
        style={{ 
          width, 
          height, 
          backgroundColor,
          fontSize: Math.max(width * 0.4, 12)
        }}
        title={alt || symbol}
      >
        {symbol.substring(0, 2).toUpperCase()}
      </div>
    );
  }

  // Success state - show the actual coin icon
  return (
    <img
      src={iconUrl}
      alt={alt || `${symbol} icon`}
      className={`rounded-full ${className}`}
      style={{ width, height }}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
};

// Helper function to generate consistent colors (same as service)
const getColorForSymbol = (symbol: string): string => {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green  
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#ec4899', // pink
  ];
  
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export default CoinIcon;