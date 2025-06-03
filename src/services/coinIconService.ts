// src/services/coinIconService.ts

export interface CoinInfo {
  id: string;
  symbol: string;
  name: string;
  image: {
    thumb: string;
    small: string;
    large: string;
  };
}

export interface CoinIconCache {
  [symbol: string]: {
    iconUrl: string;
    name: string;
    timestamp: number;
  };
}

// Map common crypto symbols to CoinGecko IDs (same as price service)
const SYMBOL_TO_COINGECKO_ID: { [symbol: string]: string } = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'ADA': 'cardano',
  'SOL': 'solana',
  'MATIC': 'matic-network',
  'DOT': 'polkadot',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'AAVE': 'aave',
  'AVAX': 'avalanche-2',
  'ATOM': 'cosmos',
  'XRP': 'ripple',
  'LTC': 'litecoin',
  'DOGE': 'dogecoin',
  'SHIB': 'shiba-inu',
  'PEPE': 'pepe',
  'BRETT': 'based-brett',
  'WETH': 'weth',
  'AERO': 'aerodrome-finance',
  'MOG': 'mog-coin',
  'SPX': 'spx6900'
};

class CoinIconService {
  private baseUrl = 'https://api.coingecko.com/api/v3';
  private iconCache = new Map<string, { iconUrl: string; name: string; timestamp: number }>();
  private cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private requestQueue = new Map<string, Promise<string>>();

  // Get icon URL for a single symbol
  async getIconUrl(symbol: string, size: 'thumb' | 'small' | 'large' = 'small'): Promise<string> {
    const upperSymbol = symbol.toUpperCase();
    const cacheKey = `${upperSymbol}_${size}`;
    
    // Check cache first
    const cached = this.iconCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.iconUrl;
    }

    // Check if request is already in progress
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey)!;
    }

    // Create new request
    const request = this.fetchIconFromAPI(upperSymbol, size);
    this.requestQueue.set(cacheKey, request);

    try {
      const iconUrl = await request;
      
      // Cache the result
      this.iconCache.set(cacheKey, {
        iconUrl,
        name: upperSymbol,
        timestamp: Date.now()
      });

      return iconUrl;
    } catch (error) {
      console.warn(`Failed to fetch icon for ${upperSymbol}:`, error);
      return this.getFallbackIcon(upperSymbol);
    } finally {
      // Remove from queue
      this.requestQueue.delete(cacheKey);
    }
  }

  // Get multiple icons at once for better performance
  async getMultipleIcons(symbols: string[], size: 'thumb' | 'small' | 'large' = 'small'): Promise<{ [symbol: string]: string }> {
    const results: { [symbol: string]: string } = {};
    
    // Process in batches to avoid rate limiting
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < symbols.length; i += batchSize) {
      batches.push(symbols.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const promises = batch.map(async (symbol) => {
        const iconUrl = await this.getIconUrl(symbol, size);
        results[symbol.toUpperCase()] = iconUrl;
      });

      await Promise.all(promises);
      
      // Small delay to respect rate limits
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  private async fetchIconFromAPI(symbol: string, size: 'thumb' | 'small' | 'large'): Promise<string> {
    try {
      const coinId = SYMBOL_TO_COINGECKO_ID[symbol];
      
      if (!coinId) {
        console.warn(`No CoinGecko ID found for symbol: ${symbol}`);
        return this.getFallbackIcon(symbol);
      }

      // First try to get from coins endpoint (more reliable)
      const coinsUrl = `${this.baseUrl}/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`;
      
      console.log(`Fetching icon for ${symbol} from:`, coinsUrl);
      
      const response = await fetch(coinsUrl);
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Rate limited by CoinGecko API');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.getFallbackIcon(symbol);
        }
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.image && data.image[size]) {
        console.log(`Successfully fetched ${size} icon for ${symbol}:`, data.image[size]);
        return data.image[size];
      }

      throw new Error(`No ${size} image found for ${symbol}`);

    } catch (error) {
      console.error(`Error fetching icon for ${symbol}:`, error);
      return this.getFallbackIcon(symbol);
    }
  }

  // Generate a fallback icon using a service like DiceBear or a simple colored circle
  private getFallbackIcon(symbol: string): string {
    // Option 1: Use DiceBear API for consistent avatars
    const backgroundColor = this.getColorForSymbol(symbol);
    return `https://api.dicebear.com/7.x/initials/svg?seed=${symbol}&backgroundColor=${backgroundColor}&fontSize=36&fontWeight=600`;
    
    // Option 2: Could also return a data URL for a simple colored circle
    // return this.generateColoredCircleDataUrl(symbol);
  }

  // Generate consistent colors for symbols
  private getColorForSymbol(symbol: string): string {
    const colors = [
      '3b82f6', // blue
      '10b981', // green  
      'f59e0b', // yellow
      'ef4444', // red
      '8b5cf6', // purple
      '06b6d4', // cyan
      'f97316', // orange
      'ec4899', // pink
    ];
    
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  // Get coin info including name and icon
  async getCoinInfo(symbol: string): Promise<{ name: string; iconUrl: string; symbol: string }> {
    const iconUrl = await this.getIconUrl(symbol);
    const coinId = SYMBOL_TO_COINGECKO_ID[symbol.toUpperCase()];
    
    // Try to get the full name from our mapping or API
    let name = symbol.toUpperCase();
    
    if (coinId) {
      try {
        const response = await fetch(`${this.baseUrl}/coins/${coinId}?localization=false&tickers=false&market_data=false`);
        if (response.ok) {
          const data = await response.json();
          name = data.name || symbol.toUpperCase();
        }
      } catch (error) {
        console.warn(`Failed to fetch name for ${symbol}:`, error);
      }
    }

    return {
      name,
      iconUrl,
      symbol: symbol.toUpperCase()
    };
  }

  // Clear cache
  clearCache(): void {
    this.iconCache.clear();
    console.log('Coin icon cache cleared');
  }

  // Get cache info for debugging
  getCacheInfo(): { size: number; symbols: string[] } {
    return {
      size: this.iconCache.size,
      symbols: Array.from(this.iconCache.keys())
    };
  }

  // Add new symbol mapping
  addSymbolMapping(symbol: string, coinGeckoId: string): void {
    SYMBOL_TO_COINGECKO_ID[symbol.toUpperCase()] = coinGeckoId;
    console.log(`Added icon mapping: ${symbol} -> ${coinGeckoId}`);
  }

  // Check if symbol is supported
  isSupported(symbol: string): boolean {
    return symbol.toUpperCase() in SYMBOL_TO_COINGECKO_ID;
  }

  // Get all supported symbols
  getSupportedSymbols(): string[] {
    return Object.keys(SYMBOL_TO_COINGECKO_ID);
  }
}

// Export singleton instance
export const coinIconService = new CoinIconService();

// Export types and service
export default coinIconService;