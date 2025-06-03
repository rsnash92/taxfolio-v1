import React, { useMemo } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { CoinIcon } from '../common/CoinIcon';
import { useTransactionIcons } from '../../hooks/useCoinIcons';

export function PortfolioOverview() {
  const { portfolioSummary, allTransactions, pricesLoading } = useTransactions();

  // Preload coin icons for all portfolio assets
  const { loading: iconsLoading } = useTransactionIcons(allTransactions);

  // Calculate additional portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const totalInvested = allTransactions
      .filter(tx => tx.type === 'buy' || tx.type === 'transfer_in')
      .reduce((sum, tx) => sum + (tx.value || 0), 0);

    const totalProceeds = allTransactions
      .filter(tx => tx.type === 'sell' || tx.type === 'transfer_out')
      .reduce((sum, tx) => sum + (tx.value || 0), 0);

    const totalFees = allTransactions
      .reduce((sum, tx) => sum + (tx.fee || 0), 0);

    const currentBalance = portfolioSummary.totalValue;
    const totalReturn = portfolioSummary.totalGain;
    const unrealizedGains = currentBalance - totalInvested + totalProceeds;
    
    const balanceChange = currentBalance - (currentBalance + 3.97); // Mock previous balance
    const balanceChangePercent = ((balanceChange / Math.max(currentBalance - balanceChange, 1)) * 100);
    const totalReturnPercent = totalInvested > 0 ? ((totalReturn / totalInvested) * 100) : 0;

    return {
      currentBalance,
      balanceChange,
      balanceChangePercent,
      totalReturn,
      totalReturnPercent,
      unrealizedGains,
      totalInvested,
      totalProceeds,
      totalFees
    };
  }, [portfolioSummary, allTransactions]);

  // Get top assets with mock performance data
  const topAssets = useMemo(() => {
    return portfolioSummary.holdings
      .slice(0, 5)
      .map((holding, index) => ({
        ...holding,
        performance: index === 0 ? 15.2 : index === 1 ? -8.7 : index === 2 ? -12.3 : index === 3 ? 5.4 : -2.1,
        gainLoss: holding.value * (index === 0 ? 0.152 : index === 1 ? -0.087 : index === 2 ? -0.123 : index === 3 ? 0.054 : -0.021)
      }));
  }, [portfolioSummary.holdings]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percent: number) => {
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(3) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(3) + 'K';
    }
    return num.toFixed(6);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-6 bg-black">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Portfolio</h1>
      
      {/* Top Metrics Row - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6 sm:mb-8">
        {/* Balance - Always takes full width on mobile */}
        <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1">
          <div className="text-sm text-gray-400 mb-1">Balance</div>
          <div className="text-xl sm:text-2xl font-bold text-white">
            {formatCurrency(portfolioMetrics.currentBalance)}
          </div>
          <div className={`text-sm font-medium ${portfolioMetrics.balanceChange >= 0 ? 'text-[#15e49e]' : 'text-red-500'}`}>
            {formatCurrency(Math.abs(portfolioMetrics.balanceChange))} {formatPercentage(portfolioMetrics.balanceChangePercent)}
          </div>
        </div>

        {/* Total Return */}
        <div>
          <div className="text-sm text-gray-400 mb-1 flex items-center">
            Total return
            <span className="ml-1 text-gray-500">ⓘ</span>
          </div>
          <div className={`text-lg sm:text-2xl font-bold ${portfolioMetrics.totalReturn >= 0 ? 'text-[#15e49e]' : 'text-red-500'}`}>
            {formatCurrency(portfolioMetrics.totalReturn)}
          </div>
          <div className={`text-sm font-medium ${portfolioMetrics.totalReturnPercent >= 0 ? 'text-[#15e49e]' : 'text-red-500'}`}>
            {formatPercentage(portfolioMetrics.totalReturnPercent)}
          </div>
        </div>

        {/* Unrealized Gains */}
        <div>
          <div className="text-sm text-gray-400 mb-1 flex items-center">
            Unrealized gains
            <span className="ml-1 text-gray-500">ⓘ</span>
          </div>
          <div className={`text-lg sm:text-2xl font-bold ${portfolioMetrics.unrealizedGains >= 0 ? 'text-[#15e49e]' : 'text-red-500'}`}>
            {formatCurrency(portfolioMetrics.unrealizedGains)}
          </div>
        </div>

        {/* Fiat Invested */}
        <div>
          <div className="text-sm text-gray-400 mb-1 flex items-center">
            Fiat invested
            <span className="ml-1 text-gray-500">ⓘ</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-white">
            {formatCurrency(portfolioMetrics.totalInvested)}
          </div>
        </div>

        {/* Fiat Proceeds */}
        <div>
          <div className="text-sm text-gray-400 mb-1 flex items-center">
            Fiat proceeds
            <span className="ml-1 text-gray-500">ⓘ</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-white">
            {formatCurrency(portfolioMetrics.totalProceeds)}
          </div>
        </div>

        {/* Fees Paid */}
        <div>
          <div className="text-sm text-gray-400 mb-1 flex items-center">
            Fees paid
            <span className="ml-1 text-gray-500">ⓘ</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-red-500">
            {formatCurrency(portfolioMetrics.totalFees)}
          </div>
        </div>
      </div>

      {/* Chart Section - Responsive */}
      <div className="bg-[#111111] rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-4 sm:space-y-0">
          <div className="text-lg font-semibold text-white">Portfolio Performance</div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#15e49e] rounded-full"></div>
              <span className="text-sm text-gray-400">Total value</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Net fiat invested</span>
            </div>
          </div>
        </div>
        
        {/* Mock Chart with Green Gradient - Responsive Height */}
        <div className="h-48 sm:h-64 bg-gradient-to-br from-[#111111] to-[#0f0f0f] rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
            <defs>
              <linearGradient id="portfolioGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#15e49e" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#15e49e" stopOpacity="0.1"/>
              </linearGradient>
            </defs>
            <path
              d="M 10 180 Q 50 160 100 140 T 200 120 T 300 100 T 390 80 L 390 190 L 10 190 Z"
              fill="url(#portfolioGradient)"
              stroke="#15e49e"
              strokeWidth="2"
            />
            <path
              d="M 10 185 L 100 175 L 200 170 L 300 165 L 390 160"
              fill="none"
              stroke="#F97316"
              strokeWidth="2"
            />
          </svg>
          <div className="absolute bottom-4 right-4 bg-[#111111]/90 backdrop-blur-sm rounded-lg p-2 text-sm text-gray-400">
            £81,954.26
          </div>
        </div>
        
        {/* Chart Controls - Responsive */}
        <div className="flex items-center justify-center">
          <div className="flex flex-wrap items-center justify-center gap-1">
            {['1D', '1W', '1M', '1Y', 'YTD', 'All'].map((period) => (
              <button
                key={period}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-all duration-200 ${
                  period === 'All' 
                    ? 'bg-[#15e49e] text-black font-medium shadow-lg shadow-[#15e49e]/20' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Asset Allocation, Winners/Losers, Assets Table - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Asset Allocation */}
        <div className="bg-[#111111] rounded-xl p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6">Asset allocation</h3>
          
          {portfolioSummary.holdings.length > 0 ? (
            <div className="space-y-4">
              {/* Mock Pie Chart - Responsive Size */}
              <div className="flex items-center justify-center mb-4 sm:mb-6">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#2A2A2A" strokeWidth="12"/>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#15e49e" strokeWidth="12"
                            strokeDasharray={`${70 * 2.51} ${(100-70) * 2.51}`} strokeLinecap="round"/>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#F97316" strokeWidth="12"
                            strokeDasharray={`${26 * 2.51} ${(100-26) * 2.51}`} 
                            strokeDashoffset={`${-70 * 2.51}`} strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-xs text-gray-400">All assets</div>
                    <div className="text-xs sm:text-sm font-semibold text-white">{formatCurrency(portfolioMetrics.currentBalance)}</div>
                  </div>
                </div>
              </div>

              {/* Asset List */}
              <div className="space-y-3">
                {portfolioSummary.holdings.slice(0, 5).map((holding, index) => {
                  const percentage = portfolioSummary.totalValue > 0 
                    ? (holding.value / portfolioSummary.totalValue) * 100 
                    : 0;
                  
                  return (
                    <div key={holding.asset} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <CoinIcon symbol={holding.asset} size={16} className="flex-shrink-0" />
                        <span className="text-white text-sm font-medium truncate">{holding.asset}</span>
                        <span className="text-gray-400 text-sm flex-shrink-0">{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-white text-sm font-semibold">{formatCurrency(holding.value)}</div>
                        <div className="text-gray-500 text-xs">
                          &lt; £{holding.currentPrice?.toFixed(2) || '0.01'}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {portfolioSummary.holdings.length > 5 && (
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Other</span>
                    <span>&lt; 1%</span>
                    <span>&lt; £0.01</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 sm:h-48">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-600 text-xl sm:text-2xl">📊</span>
                </div>
                <p className="text-gray-400 font-medium">No assets yet</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Winners and Losers */}
        <div className="bg-[#111111] rounded-xl p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6">Winners and losers</h3>
          
          {topAssets.length > 0 ? (
            <div className="space-y-4">
              {/* Mock Treemap Visualization - Responsive */}
              <div className="grid grid-cols-6 gap-1 h-16 sm:h-24 mb-4">
                <div className="col-span-3 bg-red-500 rounded flex items-center justify-center text-white text-xs font-medium">
                  <CoinIcon symbol="AERO" size={12} className="mr-1" />
                  <span className="hidden sm:inline">AERO</span>
                </div>
                <div className="col-span-2 bg-red-400 rounded flex items-center justify-center text-white text-xs font-medium">
                  <CoinIcon symbol="WETH" size={12} className="mr-1" />
                  <span className="hidden sm:inline">WETH</span>
                </div>
                <div className="col-span-1 bg-orange-500 rounded flex items-center justify-center text-white text-xs font-medium">
                  <CoinIcon symbol="USDC" size={12} />
                </div>
              </div>

              <div className="text-center text-sm text-gray-400 mb-4">
                💡 Improve accuracy by categorizing transactions
              </div>

              {/* Performance List */}
              <div className="space-y-2">
                {topAssets.slice(0, 3).map((asset) => (
                  <div key={asset.asset} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <CoinIcon symbol={asset.asset} size={20} className="flex-shrink-0" />
                      <span className="text-sm font-medium text-white truncate">{asset.asset}</span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className={`text-sm font-medium ${asset.performance >= 0 ? 'text-[#15e49e]' : 'text-red-500'}`}>
                        {formatPercentage(asset.performance)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatCurrency(Math.abs(asset.gainLoss))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-400">No performance data available</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-[#111111] rounded-xl p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6">Portfolio Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Assets</span>
              <span className="font-semibold text-white">{portfolioSummary.holdings.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Transactions</span>
              <span className="font-semibold text-white">{portfolioSummary.totalTransactions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Portfolio Value</span>
              <span className="font-semibold text-white">{formatCurrency(portfolioMetrics.currentBalance)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Net P&L</span>
              <span className={`font-semibold ${portfolioMetrics.totalReturn >= 0 ? 'text-[#15e49e]' : 'text-red-500'}`}>
                {formatCurrency(portfolioMetrics.totalReturn)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Table - Mobile-Responsive */}
      <div className="bg-[#111111] rounded-xl overflow-hidden mb-6 sm:mb-8">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-white">Assets</h3>
        </div>
        
        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {portfolioSummary.holdings.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {portfolioSummary.holdings.map((holding, index) => {
                const mockCost = holding.value * 0.85;
                const roi = ((holding.value - mockCost) / mockCost) * 100;
                const unrealizedGain = holding.value - mockCost;
                
                return (
                  <div key={holding.asset} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CoinIcon symbol={holding.asset} size={24} />
                        <div>
                          <div className="text-sm font-medium text-white">{holding.asset}</div>
                          <div className="text-xs text-gray-400">{formatLargeNumber(holding.amount)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">{formatCurrency(holding.value)}</div>
                        <div className={`text-xs font-medium ${roi >= 0 ? 'text-[#15e49e]' : 'text-red-500'}`}>
                          {formatPercentage(roi)}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                      <div>
                        <span className="block">Price</span>
                        <span className="font-medium text-white">
                          £{holding.currentPrice?.toLocaleString('en-GB', { minimumFractionDigits: 6, maximumFractionDigits: 6 }) || '0.000000'}
                        </span>
                      </div>
                      <div>
                        <span className="block">Unrealized</span>
                        <span className={`font-medium ${unrealizedGain >= 0 ? 'text-[#15e49e]' : 'text-red-500'}`}>
                          {formatCurrency(unrealizedGain)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-600 text-xl">📊</span>
              </div>
              <p className="text-gray-400 font-medium">No assets to display</p>
              <p className="text-gray-500 text-sm">Add transactions to see your portfolio breakdown</p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Currency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price (£)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    Value (£)
                    <span className="ml-1 cursor-pointer">↑↓</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cost (£)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ROI (%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unrealized Gain (£)</th>
              </tr>
            </thead>
            <tbody className="bg-[#111111] divide-y divide-gray-800">
              {portfolioSummary.holdings.map((holding, index) => {
                const mockCost = holding.value * 0.85; // Mock cost basis
                const roi = ((holding.value - mockCost) / mockCost) * 100;
                const unrealizedGain = holding.value - mockCost;
                
                return (
                  <tr key={holding.asset} className="hover:bg-gray-900/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <CoinIcon symbol={holding.asset} size={24} />
                        <span className="text-sm font-medium text-white">{holding.asset}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatLargeNumber(holding.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {holding.currentPrice?.toLocaleString('en-GB', { minimumFractionDigits: 6, maximumFractionDigits: 6 }) || '0.000000'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {formatCurrency(holding.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatCurrency(mockCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={roi >= 0 ? 'text-[#15e49e]' : 'text-red-500'}>
                        {formatPercentage(roi)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={unrealizedGain >= 0 ? 'text-[#15e49e]' : 'text-red-500'}>
                        {formatCurrency(unrealizedGain)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {portfolioSummary.holdings.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-600 text-2xl">📊</span>
              </div>
              <p className="text-gray-400 font-medium">No assets to display</p>
              <p className="text-gray-500 text-sm">Add transactions to see your portfolio breakdown</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar - Responsive */}
      <div className="bg-[#111111] rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#15e49e] rounded-full"></div>
              <span className="text-gray-400 text-sm">
                You have <span className="font-semibold text-white">{portfolioSummary.totalTransactions}</span> transactions
              </span>
            </div>
            {(pricesLoading || iconsLoading) && (
              <div className="flex items-center space-x-2 text-[#15e49e]">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#15e49e]"></div>
                <span className="text-sm">
                  {pricesLoading && iconsLoading ? 'Updating prices & icons...' : 
                   pricesLoading ? 'Updating prices...' : 'Loading icons...'}
                </span>
              </div>
            )}
          </div>
          <button className="bg-[#15e49e] hover:bg-[#13d391] text-black px-4 sm:px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 w-full sm:w-auto shadow-lg shadow-[#15e49e]/20">
            🔓 Unlock tax savings
          </button>
        </div>
      </div>
    </div>
  );
}