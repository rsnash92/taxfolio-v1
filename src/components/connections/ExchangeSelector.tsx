import React, { useState } from 'react';
import { Plus, ArrowRight, Search, Shield, Zap, Clock, TrendingUp } from 'lucide-react';
import { CoinbaseConnectionDialog } from './CoinbaseConnectionDialog';

interface Exchange {
  id: string;
  name: string;
  displayName: string;
  description: string;
  logo: string;
  supported: boolean;
  comingSoon: boolean;
  features: string[];
  securityLevel: 'high' | 'medium';
  syncSpeed: 'fast' | 'medium' | 'slow';
  popularityRank: number;
}

const exchanges: Exchange[] = [
  {
    id: 'coinbase',
    name: 'coinbase',
    displayName: 'Coinbase',
    description: 'The most trusted cryptocurrency exchange',
    logo: '💰',
    supported: true,
    comingSoon: false,
    features: ['Spot Trading', 'Staking', 'Earn', 'Card Transactions'],
    securityLevel: 'high',
    syncSpeed: 'fast',
    popularityRank: 1
  },
  {
    id: 'binance',
    name: 'binance',
    displayName: 'Binance',
    description: 'The world\'s largest crypto exchange by volume',
    logo: '🟡',
    supported: false,
    comingSoon: true,
    features: ['Spot Trading', 'Futures', 'Staking', 'Savings'],
    securityLevel: 'high',
    syncSpeed: 'fast',
    popularityRank: 2
  },
  {
    id: 'kraken',
    name: 'kraken',
    displayName: 'Kraken',
    description: 'Professional-grade crypto trading platform',
    logo: '🐙',
    supported: false,
    comingSoon: true,
    features: ['Spot Trading', 'Futures', 'Margin', 'Staking'],
    securityLevel: 'high',
    syncSpeed: 'medium',
    popularityRank: 3
  },
  {
    id: 'gemini',
    name: 'gemini',
    displayName: 'Gemini',
    description: 'Regulated crypto exchange built for institutions',
    logo: '♊',
    supported: false,
    comingSoon: true,
    features: ['Spot Trading', 'Earn', 'Credit Card', 'ActiveTrader'],
    securityLevel: 'high',
    syncSpeed: 'medium',
    popularityRank: 4
  },
  {
    id: 'kucoin',
    name: 'kucoin',
    displayName: 'KuCoin',
    description: 'The people\'s exchange with 700+ cryptocurrencies',
    logo: '🟢',
    supported: false,
    comingSoon: true,
    features: ['Spot Trading', 'Futures', 'Margin', 'Bots'],
    securityLevel: 'medium',
    syncSpeed: 'medium',
    popularityRank: 5
  },
  {
    id: 'bitfinex',
    name: 'bitfinex',
    displayName: 'Bitfinex',
    description: 'Advanced digital asset trading platform',
    logo: '🔷',
    supported: false,
    comingSoon: true,
    features: ['Spot Trading', 'Margin', 'Derivatives', 'Lending'],
    securityLevel: 'high',
    syncSpeed: 'slow',
    popularityRank: 6
  }
];

interface ExchangeSelectorProps {
  onExchangeConnect?: () => void;
}

export const ExchangeSelector: React.FC<ExchangeSelectorProps> = ({ onExchangeConnect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null);
  const [showCoinbaseDialog, setShowCoinbaseDialog] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'coming-soon'>('all');

  const filteredExchanges = exchanges.filter(exchange => {
    const matchesSearch = exchange.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exchange.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'available' && exchange.supported) ||
                         (filter === 'coming-soon' && exchange.comingSoon && !exchange.supported);
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    // Sort by availability first, then by popularity
    if (a.supported && !b.supported) return -1;
    if (!a.supported && b.supported) return 1;
    return a.popularityRank - b.popularityRank;
  });

  const handleExchangeClick = (exchange: Exchange) => {
    if (exchange.supported) {
      setSelectedExchange(exchange.id);
      if (exchange.id === 'coinbase') {
        setShowCoinbaseDialog(true);
      }
    }
  };

  const handleConnectionSuccess = () => {
    setShowCoinbaseDialog(false);
    setSelectedExchange(null);
    onExchangeConnect?.();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Exchange</h2>
        <p className="text-gray-600">
          Import your trading history automatically from supported exchanges
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search exchanges..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Exchanges
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'available'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Available Now
          </button>
          <button
            onClick={() => setFilter('coming-soon')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'coming-soon'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Coming Soon
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExchanges.map((exchange) => (
          <div
            key={exchange.id}
            onClick={() => handleExchangeClick(exchange)}
            className={`
              relative border rounded-lg p-6 transition-all
              ${exchange.supported 
                ? 'cursor-pointer hover:shadow-lg hover:border-blue-500 bg-white' 
                : 'cursor-not-allowed bg-gray-50 border-gray-200'
              }
              ${selectedExchange === exchange.id ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}
            `}
          >
            {exchange.comingSoon && !exchange.supported && (
              <div className="absolute top-4 right-4">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  Coming Soon
                </span>
              </div>
            )}

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                {exchange.logo}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{exchange.displayName}</h3>
                <p className="text-sm text-gray-600 mt-1">{exchange.description}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {exchange.features.slice(0, 3).map((feature, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {feature}
                  </span>
                ))}
                {exchange.features.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    +{exchange.features.length - 3} more
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Shield className={`w-3 h-3 ${
                      exchange.securityLevel === 'high' ? 'text-green-600' : 'text-yellow-600'
                    }`} />
                    <span className="text-gray-600">
                      {exchange.securityLevel === 'high' ? 'High' : 'Medium'} Security
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className={`w-3 h-3 ${
                      exchange.syncSpeed === 'fast' ? 'text-green-600' : 
                      exchange.syncSpeed === 'medium' ? 'text-yellow-600' : 'text-orange-600'
                    }`} />
                    <span className="text-gray-600">
                      {exchange.syncSpeed === 'fast' ? 'Fast' : 
                       exchange.syncSpeed === 'medium' ? 'Normal' : 'Slow'} Sync
                    </span>
                  </div>
                </div>
              </div>

              {exchange.supported && (
                <button
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExchangeClick(exchange);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Connect {exchange.displayName}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredExchanges.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No exchanges found matching your search.</p>
        </div>
      )}

      <CoinbaseConnectionDialog
        isOpen={showCoinbaseDialog}
        onClose={() => {
          setShowCoinbaseDialog(false);
          setSelectedExchange(null);
        }}
        onSuccess={handleConnectionSuccess}
      />
    </div>
  );
};