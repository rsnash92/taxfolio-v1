// src/services/priceService.ts

export interface PriceData {
  [symbol: string]: {
    usd: number;
    gbp: number;
    usd_24h_change: number;
    gbp_24h_change: number;
    last_updated_at: number;
  };
}

export interface CoinGeckoResponse {
  [coinId: string]: {
    usd: number;
    gbp: number;
    usd_24h_change: number;
    gbp_24h_change: number;
    last_updated_at: number;
  };
}

// Map common crypto symbols to CoinGecko IDs
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
  'AERO': 'aerodrome-finance'
};

// Reverse mapping for lookup
const COINGECKO_ID_TO_SYMBOL: { [id: string]: string } = {};
Object.entries(SYMBOL_TO_COINGECKO_ID).forEach(([symbol, id]) => {
  COINGECKO_ID_TO_SYMBOL[id] = symbol;
});

class PriceService {
  private baseUrl = 'https://api.coingecko.com/api/v3';
  private cache = new Map<string, { data: PriceData; timestamp: number }>();
  private cacheTimeout = 60000; // 1 minute in milliseconds
  private requestQueue = new Map<string, Promise<PriceData>>();

  // Get prices for multiple assets
  async getPrices(symbols: string[]): Promise<PriceData> {
    const uniqueSymbols = [...new Set(symbols.map(s => s.toUpperCase()))];
    const cacheKey = uniqueSymbols.sort().join(',');
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // Check if request is already in progress
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey)!;
    }

    // Create new request
    const request = this.fetchPricesFromAPI(uniqueSymbols);
    this.requestQueue.set(cacheKey, request);

    try {
      const result = await request;
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } finally {
      // Remove from queue
      this.requestQueue.delete(cacheKey);
    }
  }

  private async fetchPricesFromAPI(symbols: string[]): Promise<PriceData> {
    try {
      // Convert symbols to CoinGecko IDs
      const coinIds = symbols
        .map(symbol => SYMBOL_TO_COINGECKO_ID[symbol])
        .filter(Boolean);

      if (coinIds.length === 0) {
        console.warn('No valid coin IDs found for symbols:', symbols);
        return {};
      }

      const idsParam = coinIds.join(',');
      const url = `${this.baseUrl}/simple/price?ids=${idsParam}&vs_currencies=usd,gbp&include_24hr_change=true&include_last_updated_at=true`;
      
      console.log('Fetching prices from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Rate limited by CoinGecko API');
          return this.getFallbackPrices(symbols);
        }
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const data: CoinGeckoResponse = await response.json();
      
      // Convert back to symbol-based format
      const result: PriceData = {};
      Object.entries(data).forEach(([coinId, priceInfo]) => {
        const symbol = COINGECKO_ID_TO_SYMBOL[coinId];
        if (symbol) {
          result[symbol] = priceInfo;
        }
      });

      console.log('Successfully fetched prices for:', Object.keys(result));
      return result;

    } catch (error) {
      console.error('Error fetching prices:', error);
      return this.getFallbackPrices(symbols);
    }
  }

  // Fallback prices for when API is unavailable
  private getFallbackPrices(symbols: string[]): PriceData {
    const fallbackPrices: { [symbol: string]: number } = {
      'BTC': 65000,
      'ETH': 3200,
      'USDC': 1,
      'USDT': 1,
      'BNB': 600,
      'ADA': 0.45,
      'SOL': 140,
      'MATIC': 0.85,
      'DOT': 7.5,
      'LINK': 15,
      'UNI': 8,
      'AAVE': 95,
      'AVAX': 35,
      'ATOM': 12,
      'XRP': 0.55,
      'LTC': 85,
      'DOGE': 0.08,
      'SHIB': 0.000025,
      'PEPE': 0.00001,
      'BRETT': 0.12,
      'WETH': 3200,
      'AERO': 1.2
    };

    const result: PriceData = {};
    symbols.forEach(symbol => {
      const usdPrice = fallbackPrices[symbol] || 0;
      const gbpPrice = usdPrice * 0.8; // Rough USD to GBP conversion
      
      result[symbol] = {
        usd: usdPrice,
        gbp: gbpPrice,
        usd_24h_change: 0,
        gbp_24h_change: 0,
        last_updated_at: Date.now() / 1000
      };
    });

    console.log('Using fallback prices for:', symbols);
    return result;
  }

  // Get single asset price
  async getPrice(symbol: string): Promise<number> {
    const prices = await this.getPrices([symbol]);
    return prices[symbol.toUpperCase()]?.gbp || 0;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    console.log('Price cache cleared');
  }

  // Get cache info for debugging
  getCacheInfo(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Add new symbol mapping
  addSymbolMapping(symbol: string, coinGeckoId: string): void {
    SYMBOL_TO_COINGECKO_ID[symbol.toUpperCase()] = coinGeckoId;
    COINGECKO_ID_TO_SYMBOL[coinGeckoId] = symbol.toUpperCase();
    console.log(`Added mapping: ${symbol} -> ${coinGeckoId}`);
  }

  // Get supported symbols
  getSupportedSymbols(): string[] {
    return Object.keys(SYMBOL_TO_COINGECKO_ID);
  }
}

// Export singleton instance
export const priceService = new PriceService();

// Export types and service
export default priceService;