import React, { useState, useMemo } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { useTaxCalculations } from '../../hooks/useTaxCalculations';
import { CoinIcon } from '../common/CoinIcon';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

interface User {
  id: string;
  subscriptionStatus: 'free' | 'premium' | 'pro';
  subscriptionExpiry?: Date;
}

// PDF and CSV generation utilities
const generatePDFReport = (taxData: any, assetSummary: any[], selectedTaxYear: string, formatCurrency: (amount: number) => string) => {
  const currentDate = new Date().toLocaleDateString('en-GB');
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Crypto Tax Report ${selectedTaxYear}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
        .summary-section { margin: 20px 0; padding: 15px; background-color: #F9FAFB; border-radius: 8px; }
        .summary-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #1F2937; }
        .summary-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px 0; }
        .summary-label { font-weight: 500; }
        .summary-value { font-weight: bold; }
        .positive { color: #059669; }
        .negative { color: #DC2626; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid #D1D5DB; padding: 8px; text-align: left; }
        .table th { background-color: #F3F4F6; font-weight: bold; }
        .table td.number { text-align: right; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #D1D5DB; font-size: 12px; color: #6B7280; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Cryptocurrency Tax Report</h1>
        <h2>Tax Year: ${selectedTaxYear}</h2>
        <p>Generated on: ${currentDate}</p>
      </div>

      <div class="summary-section">
        <div class="summary-title">Tax Summary</div>
        <div class="summary-row">
          <span class="summary-label">Net Capital Gains:</span>
          <span class="summary-value ${taxData.netCapitalGains >= 0 ? 'positive' : 'negative'}">
            ${formatCurrency(taxData.netCapitalGains)}
          </span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Capital Gains:</span>
          <span class="summary-value positive">${formatCurrency(taxData.capitalGains)}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Capital Losses:</span>
          <span class="summary-value negative">${formatCurrency(taxData.capitalLosses)}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Net Income:</span>
          <span class="summary-value">${formatCurrency(taxData.netIncome)}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Exemption Used:</span>
          <span class="summary-value">${formatCurrency(taxData.exemptionUsed)}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Total Tax Owed:</span>
          <span class="summary-value ${taxData.totalTaxOwed > 0 ? 'negative' : 'positive'}">
            ${formatCurrency(taxData.totalTaxOwed)}
          </span>
        </div>
      </div>

      <div class="summary-section">
        <div class="summary-title">Asset Summary</div>
        <table class="table">
          <thead>
            <tr>
              <th>Currency</th>
              <th>End FY Balance</th>
              <th>Quantity Disposed</th>
              <th>Cost</th>
              <th>Fees</th>
              <th>Proceeds</th>
              <th>Capital P/L</th>
              <th>Income</th>
              <th>Total P/L</th>
            </tr>
          </thead>
          <tbody>
            ${assetSummary.map(asset => `
              <tr>
                <td>${asset.symbol}</td>
                <td class="number">${asset.endBalance.toLocaleString(undefined, {maximumFractionDigits: 6})}</td>
                <td class="number">${asset.quantityDisposed.toLocaleString(undefined, {maximumFractionDigits: 6})}</td>
                <td class="number">${asset.cost > 0 ? formatCurrency(asset.cost) : '-'}</td>
                <td class="number">${asset.fees > 0 ? formatCurrency(asset.fees) : '-'}</td>
                <td class="number">${asset.proceeds > 0 ? formatCurrency(asset.proceeds) : '-'}</td>
                <td class="number ${asset.capitalPL >= 0 ? 'positive' : 'negative'}">
                  ${asset.capitalPL !== 0 ? formatCurrency(asset.capitalPL) : '-'}
                </td>
                <td class="number">${asset.income > 0 ? formatCurrency(asset.income) : '-'}</td>
                <td class="number ${asset.totalPL >= 0 ? 'positive' : 'negative'}">
                  ${asset.totalPL !== 0 ? formatCurrency(asset.totalPL) : '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p><strong>Disclaimer:</strong> This report is generated based on the transaction data provided. Please consult with a qualified tax professional for specific tax advice. This software is not intended to provide tax, legal, or accounting advice.</p>
        <p>Generated by Crypto Tax Calculator - ${currentDate}</p>
      </div>
    </body>
    </html>
  `;

  // Create and download PDF
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `crypto-tax-report-${selectedTaxYear.replace('/', '-')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const generateCSVReport = (taxData: any, assetSummary: any[], selectedTaxYear: string) => {
  // Tax Summary CSV
  const taxSummaryCSV = [
    ['Crypto Tax Report Summary', selectedTaxYear],
    ['Generated', new Date().toLocaleDateString('en-GB')],
    [''],
    ['Metric', 'Value (GBP)'],
    ['Net Capital Gains', taxData.netCapitalGains],
    ['Capital Gains', taxData.capitalGains],
    ['Capital Losses', taxData.capitalLosses],
    ['Net Income', taxData.netIncome],
    ['Exemption Used', taxData.exemptionUsed],
    ['Total Tax Owed', taxData.totalTaxOwed],
    [''],
    ['Asset Summary'],
    ['Currency', 'End FY Balance', 'Quantity Disposed', 'Cost (GBP)', 'Fees (GBP)', 'Proceeds (GBP)', 'Capital P/L (GBP)', 'Income (GBP)', 'Total P/L (GBP)'],
    ...assetSummary.map(asset => [
      asset.symbol,
      asset.endBalance,
      asset.quantityDisposed,
      asset.cost,
      asset.fees,
      asset.proceeds,
      asset.capitalPL,
      asset.income,
      asset.totalPL
    ])
  ];

  const csvContent = taxSummaryCSV.map(row => 
    row.map(cell => 
      typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
    ).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `crypto-tax-report-${selectedTaxYear.replace('/', '-')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function ReportsPage() {
  const { allTransactions, portfolioSummary } = useTransactions();

  const [selectedTaxYear, setSelectedTaxYear] = useState('2024-25');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingCSV, setDownloadingCSV] = useState(false);

  // Mock user subscription status - replace with your auth system
  const [user] = useState<User>({
    id: '1',
    subscriptionStatus: 'premium', // Change to 'premium' to test unlocked state
    subscriptionExpiry: new Date('2024-12-31')
  });

  const { taxSummary, formatCurrency } = useTaxCalculations(allTransactions, {
    taxYear: selectedTaxYear,
    annualIncome: 35000
  });

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'self_reporting',
      name: 'Self Reporting',
      price: 29,
      features: [
        'Complete tax calculations',
        'HMRC-ready reports',
        'PDF & CSV exports',
        'Capital gains breakdown',
        'Income tax calculations',
        'Tax loss harvesting'
      ]
    },
    {
      id: 'accountant_pack',
      name: 'Accountant Pack',
      price: 79,
      popular: true,
      features: [
        'Everything in Self Reporting',
        'Detailed transaction analysis',
        'Professional report formatting',
        'Accountant-ready documentation',
        'Priority support',
        'Advanced tax optimization'
      ]
    }
  ];

  const isPremium = user.subscriptionStatus === 'premium' || user.subscriptionStatus === 'pro';

  // Real tax calculations from your data
  const taxData = useMemo(() => {
    if (!taxSummary) {
      return {
        totalGains: 0,
        savingsOpportunity: 0,
        netCapitalGains: 0,
        capitalGains: 0,
        capitalLosses: 0,
        netIncome: 0,
        totalTaxOwed: 0,
        exemptionUsed: 0,
        taxLossHarvesting: 0,
        hasData: false
      };
    }

    const totalGains = taxSummary.capitalGains.totalGains;
    const totalLosses = Math.abs(taxSummary.capitalGains.totalLosses);
    const netCapitalGains = taxSummary.capitalGains.netGains;
    const savingsOpportunity = taxSummary.capitalGains.exemptionUsed > 0 
      ? taxSummary.taxYear.cgtExemption - taxSummary.capitalGains.exemptionUsed 
      : taxSummary.taxYear.cgtExemption;

    return {
      totalGains,
      savingsOpportunity,
      netCapitalGains,
      capitalGains: totalGains,
      capitalLosses: totalLosses,
      netIncome: taxSummary.income.totalIncome,
      totalTaxOwed: taxSummary.totalTaxOwed,
      exemptionUsed: taxSummary.capitalGains.exemptionUsed,
      taxLossHarvesting: totalLosses,
      hasData: true
    };
  }, [taxSummary]);

  // Generate asset summary from portfolio holdings
  const assetSummary = useMemo(() => {
    if (!portfolioSummary.holdings.length || !taxSummary) return [];

    return portfolioSummary.holdings.map(holding => {
      const assetCGTEvents = taxSummary.capitalGains.events.filter(event => event.asset === holding.asset);
      const assetIncomeEvents = taxSummary.income.events.filter(event => event.asset === holding.asset);
      
      const totalDisposed = assetCGTEvents.reduce((sum, event) => sum + event.disposalAmount, 0);
      const totalCost = assetCGTEvents.reduce((sum, event) => sum + event.acquisitionCost, 0);
      const totalProceeds = assetCGTEvents.reduce((sum, event) => sum + (event.sellTransaction.value || 0), 0);
      const capitalPL = assetCGTEvents.reduce((sum, event) => sum + (event.gain - event.loss), 0);
      const totalIncome = assetIncomeEvents.reduce((sum, event) => sum + event.valueAtReceipt, 0);
      const fees = assetCGTEvents.reduce((sum, event) => sum + (event.sellTransaction.fee || 0), 0);

      return {
        symbol: holding.asset,
        endBalance: holding.amount,
        quantityDisposed: totalDisposed,
        cost: totalCost,
        fees,
        proceeds: totalProceeds,
        capitalPL,
        income: totalIncome,
        totalPL: capitalPL + totalIncome
      };
    });
  }, [portfolioSummary.holdings, taxSummary]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleDownloadPDF = async () => {
    if (!isPremium) {
      setShowPricingModal(true);
      return;
    }

    setDownloadingPDF(true);
    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      generatePDFReport(taxData, assetSummary, selectedTaxYear, formatCurrency);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (!isPremium) {
      setShowPricingModal(true);
      return;
    }

    setDownloadingCSV(true);
    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      generateCSVReport(taxData, assetSummary, selectedTaxYear);
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Error generating CSV report. Please try again.');
    } finally {
      setDownloadingCSV(false);
    }
  };

  const handleDownloadReports = () => {
    if (!isPremium) {
      setShowPricingModal(true);
      return;
    }
    // Open a selection modal or download both
    handleDownloadPDF();
  };


  const handleDownloadSelfReporting = async () => {
    if (!isPremium) {
      setShowPricingModal(true);
      return;
    }
    await handleDownloadPDF();
  };

  const handleDownloadAccountantPack = async () => {
    if (!isPremium) {
      setShowPricingModal(true);
      return;
    }
    // Generate both PDF and CSV for accountant pack
    await handleDownloadPDF();
    setTimeout(() => handleDownloadCSV(), 1000); // Delay to avoid browser blocking
  };

  const AssetRow = ({ 
    symbol, 
    endBalance, 
    quantityDisposed, 
    cost, 
    fees, 
    proceeds, 
    capitalPL, 
    income, 
    totalPL 
  }: {
    symbol: string;
    endBalance: number;
    quantityDisposed: number;
    cost: number;
    fees: number;
    proceeds: number;
    capitalPL: number;
    income: number;
    totalPL: number;
  }) => (
    <div className="grid grid-cols-9 gap-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3">
        <CoinIcon symbol={symbol} size={24} />
        <div>
          <div className="font-medium text-gray-900">{symbol}</div>
          <div className="text-sm text-gray-500">Sterling (GBP)</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm text-gray-900">{endBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
      </div>
      <div className="text-right">
        <div className="text-sm text-gray-900">{quantityDisposed.toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
      </div>
      <div className="text-right">
        <div className="text-sm text-gray-900">{cost > 0 ? formatCurrency(cost) : '-'}</div>
      </div>
      <div className="text-right">
        <div className="text-sm text-gray-900">{fees > 0 ? formatCurrency(fees) : '-'}</div>
      </div>
      <div className="text-right">
        <div className="text-sm text-gray-900">{proceeds > 0 ? formatCurrency(proceeds) : '-'}</div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-medium ${capitalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {capitalPL !== 0 ? formatCurrency(capitalPL) : '-'}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm text-gray-900">{income > 0 ? formatCurrency(income) : '-'}</div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-medium ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {totalPL !== 0 ? formatCurrency(totalPL) : '-'}
        </div>
      </div>
    </div>
  );

  const BlurredContent = ({ children, isBlurred = true }: { children: React.ReactNode; isBlurred?: boolean }) => (
    <div className={`${isBlurred && !isPremium ? 'filter blur-sm pointer-events-none' : ''} transition-all duration-300`}>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-900">Report:</h1>
          <select 
            value={selectedTaxYear}
            onChange={(e) => setSelectedTaxYear(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2024-25">2024-25</option>
            <option value="2023-24">2023-24</option>
            <option value="2022-23">2022-23</option>
          </select>
        </div>
      </div>

      {/* Paywall Banner */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">📊</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Select a plan to download your report</h3>
                <p className="text-purple-100">Get detailed tax calculations and HMRC-ready exports</p>
              </div>
            </div>
            <button 
              onClick={() => setShowPricingModal(true)}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Select a plan
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Loading State */}
          {!taxData.hasData && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Calculating Tax Report</h3>
              <p className="text-gray-500">
                {allTransactions.length === 0 
                  ? 'Add some transactions to generate your tax report' 
                  : 'Processing your transactions for tax calculations...'}
              </p>
            </div>
          )}

          {/* Total Gains Section */}
          {taxData.hasData && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-gray-900">Total Gains</h2>
                  <span className="text-gray-400 cursor-help" title="Information about total gains">ⓘ</span>
                </div>
                <div className="text-right">
                  {/* Mock chart placeholder */}
                  <div className="w-24 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded opacity-50"></div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-green-600">💡</span>
                  <span className="text-sm font-medium text-gray-900">Don't overpay your tax!</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Your savings opportunity is {formatCurrency(taxData.savingsOpportunity)}
                  </span>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
                    <span>Review transactions to save</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* Net Capital Gains */}
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => toggleSection('capital-gains')}
                      className="text-gray-900 font-medium hover:text-gray-700"
                    >
                      Net Capital Gains
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(taxData.netCapitalGains)}
                    </div>
                  </div>
                </div>

                <BlurredContent isBlurred={true}>
                  <div className="space-y-3 ml-4">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Capital gains</span>
                        <span className="text-gray-400 cursor-help">ⓘ</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(taxData.capitalGains)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Capital losses</span>
                        <span className="text-gray-400 cursor-help">ⓘ</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-red-600">
                          {taxData.capitalLosses > 0 ? `-${formatCurrency(taxData.capitalLosses)}` : '£0.00'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Exemption used</span>
                        <span className="text-gray-400 cursor-help">ⓘ</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(taxData.exemptionUsed)}
                        </div>
                      </div>
                    </div>
                  </div>
                </BlurredContent>

                {/* Net Income */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-900 font-medium hover:text-gray-700">
                      Net Income
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(taxData.netIncome)}
                    </div>
                  </div>
                </div>

                <BlurredContent isBlurred={true}>
                  <div className="space-y-3 ml-4">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Mining & Staking Income</span>
                        <span className="text-gray-400 cursor-help">ⓘ</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(taxData.netIncome)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Other Income</span>
                        <span className="text-gray-400 cursor-help">ⓘ</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-900">£0.00</div>
                      </div>
                    </div>
                  </div>
                </BlurredContent>

                {/* Tax Summary */}
                <div className="bg-blue-50 rounded-lg p-4 mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-blue-900">Total Tax Owed</div>
                      <div className="text-xs text-blue-700">Based on current calculations</div>
                    </div>
                    <div className="text-xl font-bold text-blue-900">
                      {formatCurrency(taxData.totalTaxOwed)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Report Summary Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold text-gray-900">Report Summary</span>
                  <button className="text-gray-400 hover:text-gray-600">▼</button>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={handleDownloadPDF}
                    disabled={!isPremium || downloadingPDF}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                      isPremium 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <span>📄</span>
                    <span>{downloadingPDF ? 'Generating...' : 'PDF'}</span>
                  </button>
                  <button 
                    onClick={handleDownloadCSV}
                    disabled={!isPremium || downloadingCSV}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                      isPremium 
                        ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <span>📊</span>
                    <span>{downloadingCSV ? 'Generating...' : 'CSV'}</span>
                  </button>
                </div>
              </div>
            </div>

            <BlurredContent isBlurred={true}>
              <div className="overflow-x-auto">
                {/* Table Headers */}
                <div className="grid grid-cols-9 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500 uppercase tracking-wider">
                  <div>Currency</div>
                  <div className="text-right">End FY Balance</div>
                  <div className="text-right">Quantity Disposed</div>
                  <div className="text-right">Cost</div>
                  <div className="text-right">Fees</div>
                  <div className="text-right">Proceeds</div>
                  <div className="text-right">Capital P/L</div>
                  <div className="text-right">Income</div>
                  <div className="text-right">Total P/L</div>
                </div>

                {/* Real Asset Rows */}
                <div className="px-6">
                  {taxData.hasData && assetSummary.length > 0 ? (
                    assetSummary.map((asset) => (
                      <AssetRow 
                        key={asset.symbol}
                        symbol={asset.symbol}
                        endBalance={asset.endBalance}
                        quantityDisposed={asset.quantityDisposed}
                        cost={asset.cost}
                        fees={asset.fees}
                        proceeds={asset.proceeds}
                        capitalPL={asset.capitalPL}
                        income={asset.income}
                        totalPL={asset.totalPL}
                      />
                    ))
                  ) : (
                    <>
                      {/* Sample data when no real data */}
                      <AssetRow 
                        symbol="BTC"
                        endBalance={0.8}
                        quantityDisposed={1.2}
                        cost={87600}
                        fees={12}
                        proceeds={127200}
                        capitalPL={39600}
                        income={0}
                        totalPL={39600}
                      />
                      <AssetRow 
                        symbol="BRETT"
                        endBalance={355045.84532}
                        quantityDisposed={253621.16852}
                        cost={19758.26}
                        fees={0.25}
                        proceeds={22100.75}
                        capitalPL={2342.49}
                        income={0}
                        totalPL={2342.49}
                      />
                      <AssetRow 
                        symbol="PEPE"
                        endBalance={1}
                        quantityDisposed={0}
                        cost={0}
                        fees={0}
                        proceeds={0}
                        capitalPL={0}
                        income={0}
                        totalPL={0}
                      />
                    </>
                  )}
                </div>
              </div>
            </BlurredContent>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reports Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports</h3>
            
            <button 
              onClick={handleDownloadReports}
              disabled={!isPremium || downloadingPDF}
              className={`w-full px-4 py-3 rounded-lg text-sm font-medium mb-4 transition-colors flex items-center justify-center space-x-2 ${
                isPremium 
                  ? 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50' 
                  : 'bg-purple-300 text-white cursor-not-allowed'
              }`}
            >
              <span>📥</span>
              <span>{downloadingPDF ? 'Generating...' : 'Download reports'}</span>
            </button>

            <div className="space-y-3">
              <div className="text-center text-sm text-gray-600 mb-2">Quick download:</div>
              
              <div className={`p-3 rounded-lg border ${!isPremium ? 'opacity-50' : ''} transition-opacity`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Self reporting</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {taxData.hasData ? 'Ready' : 'Sample'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2">For filing your own taxes</div>
                <button 
                  onClick={handleDownloadSelfReporting}
                  disabled={!isPremium || downloadingPDF}
                  className={`text-xs font-medium transition-colors flex items-center space-x-1 ${
                    isPremium 
                      ? 'text-blue-600 hover:text-blue-700 disabled:opacity-50' 
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span>📥</span>
                  <span>{downloadingPDF ? 'Generating...' : 'Download'}</span>
                </button>
              </div>

              <div className={`p-3 rounded-lg border ${!isPremium ? 'opacity-50' : ''} transition-opacity`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Accountant pack</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {taxData.hasData ? 'Ready' : 'Sample'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2">Send to your accountant</div>
                <button 
                  onClick={handleDownloadAccountantPack}
                  disabled={!isPremium || downloadingPDF || downloadingCSV}
                  className={`text-xs font-medium transition-colors flex items-center space-x-1 ${
                    isPremium 
                      ? 'text-blue-600 hover:text-blue-700 disabled:opacity-50' 
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span>📥</span>
                  <span>{(downloadingPDF || downloadingCSV) ? 'Generating...' : 'Download'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tax Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tax settings</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm">Edit →</button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cost basis tracking</span>
                <span className="text-gray-900">Universal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Local currency</span>
                <span className="text-gray-900">GBP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Country</span>
                <span className="text-gray-900">United Kingdom</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inventory method</span>
                <span className="text-gray-900">HM Revenue and Customs</span>
              </div>
            </div>
          </div>

          {/* Tax Loss Harvesting */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax loss harvesting</h3>
            <p className="text-sm text-gray-600 mb-3">
              You could harvest £{taxData.taxLossHarvesting.toFixed(2)} in tax losses.
            </p>
            <button 
              className={`text-sm font-medium transition-colors ${
                isPremium 
                  ? 'text-blue-600 hover:text-blue-700' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              disabled={!isPremium}
            >
              View tax losses
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
                <button 
                  onClick={() => setShowPricingModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mt-2">Get detailed tax reports and HMRC-ready documentation</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subscriptionPlans.map((plan) => (
                  <div 
                    key={plan.id}
                    className={`border rounded-xl p-6 relative ${
                      plan.popular 
                        ? 'border-purple-500 ring-2 ring-purple-500 ring-opacity-20' 
                        : 'border-gray-200'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        £{plan.price}
                      </div>
                      <div className="text-gray-500 text-sm">One-time payment</div>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <span className="text-green-500">✓</span>
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <button 
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        plan.popular
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      Choose {plan.name}
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 text-center text-sm text-gray-500">
                <p>💳 Secure payment • 🔒 Cancel anytime • 📧 Email support included</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}