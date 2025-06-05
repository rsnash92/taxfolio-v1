import React, { useState } from 'react';
import { X, Plus, Calendar, DollarSign, Hash, FileText, TrendingUp, ArrowRightLeft, ArrowUpRight, ArrowDownLeft, Zap, Award } from 'lucide-react';
import { CoinIcon } from '../common/CoinIcon';
import { Transaction } from '../../hooks/useTransactions';

const getCategoryFromType = (type: Transaction['type']): Transaction['category'] => {
  switch (type) {
    case 'buy':
    case 'transfer_in':
    case 'mining':
    case 'staking':
      return 'Incoming';
    case 'sell':
    case 'transfer_out':
      return 'Outgoing';
    case 'trade':
      return 'Trade';
    case 'fee':
      return 'Fee';
    default:
      return 'Trade';
  }
};

interface AddTransactionModalProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ onAdd, onClose }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16), // Format for datetime-local input
    type: 'buy' as Transaction['type'],
    asset: '',
    amount: '',
    price: '',
    fee: '',
    feeAsset: '',
    fromAsset: '',
    fromAmount: '',
    toAsset: '',
    toAmount: '',
    exchange: '',
    txHash: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const transactionTypes = [
    { 
      value: 'buy', 
      label: 'Buy', 
      description: 'Purchase cryptocurrency',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    { 
      value: 'sell', 
      label: 'Sell', 
      description: 'Sell cryptocurrency',
      icon: ArrowDownLeft,
      color: 'text-red-600'
    },
    { 
      value: 'transfer_in', 
      label: 'Transfer In', 
      description: 'Receive cryptocurrency',
      icon: ArrowUpRight,
      color: 'text-blue-600'
    },
    { 
      value: 'transfer_out', 
      label: 'Transfer Out', 
      description: 'Send cryptocurrency',
      icon: ArrowDownLeft,
      color: 'text-orange-600'
    },
    { 
      value: 'trade', 
      label: 'Trade', 
      description: 'Exchange one crypto for another',
      icon: ArrowRightLeft,
      color: 'text-purple-600'
    },
    { 
      value: 'mining', 
      label: 'Mining', 
      description: 'Mining reward',
      icon: Zap,
      color: 'text-yellow-600'
    },
    { 
      value: 'staking', 
      label: 'Staking', 
      description: 'Staking reward',
      icon: Award,
      color: 'text-indigo-600'
    }
  ];

  const popularAssets = [
    'BTC', 'ETH', 'USDC', 'USDT', 'BNB', 'ADA', 'SOL', 'MATIC', 'DOT', 'LINK',
    'UNI', 'AAVE', 'BRETT', 'PEPE', 'DOGE', 'SHIB', 'AVAX', 'ATOM', 'XRP', 'LTC'
  ];

  const popularExchanges = [
    'Binance', 'Coinbase Pro', 'Kraken', 'Uniswap', 'Meta Mask', 'Phantom',
    'Kucoin', 'Bybit', 'OKX', 'Huobi', 'Gate.io', 'Pancakeswap', 'Sushiswap'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.asset.trim()) newErrors.asset = 'Asset is required';
    if (!formData.amount.trim()) newErrors.amount = 'Amount is required';
    if (!formData.exchange.trim()) newErrors.exchange = 'Exchange is required';

    // Validate numbers
    if (formData.amount && isNaN(Number(formData.amount))) {
      newErrors.amount = 'Amount must be a valid number';
    }
    if (formData.price && isNaN(Number(formData.price))) {
      newErrors.price = 'Price must be a valid number';
    }
    if (formData.fee && isNaN(Number(formData.fee))) {
      newErrors.fee = 'Fee must be a valid number';
    }

    // Trade-specific validation
    if (formData.type === 'trade') {
      if (!formData.fromAsset.trim()) newErrors.fromAsset = 'From asset is required for trades';
      if (!formData.toAsset.trim()) newErrors.toAsset = 'To asset is required for trades';
      if (!formData.fromAmount.trim()) newErrors.fromAmount = 'From amount is required for trades';
      if (!formData.toAmount.trim()) newErrors.toAmount = 'To amount is required for trades';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const transaction: Omit<Transaction, 'id'> = {
      date: new Date(formData.date).toISOString(),
      type: formData.type,
      category: getCategoryFromType(formData.type), // Add this line
      asset: formData.asset.toUpperCase(),
      amount: Number(formData.amount),
      price: formData.price ? Number(formData.price) : undefined,
      value: formData.price ? Number(formData.amount) * Number(formData.price) : undefined,
      fee: formData.fee ? Number(formData.fee) : undefined,
      feeAsset: formData.feeAsset || undefined,
      fromAsset: formData.fromAsset ? formData.fromAsset.toUpperCase() : undefined,
      fromAmount: formData.fromAmount ? Number(formData.fromAmount) : undefined,
      toAsset: formData.toAsset ? formData.toAsset.toUpperCase() : undefined,
      toAmount: formData.toAmount ? Number(formData.toAmount) : undefined,
      exchange: formData.exchange,
      txHash: formData.txHash || undefined,
      notes: formData.notes || undefined
    };

    onAdd(transaction);
    onClose();
  };

  const isTradeType = formData.type === 'trade';
  const selectedType = transactionTypes.find(t => t.value === formData.type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Plus size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add Transaction</h2>
              <p className="text-sm text-gray-500">Add a new crypto transaction to your portfolio</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Transaction Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {transactionTypes.map(type => {
                const Icon = type.icon;
                const isSelected = formData.type === type.value;
                
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('type', type.value)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Icon size={16} className={isSelected ? 'text-blue-600' : 'text-gray-500'} />
                      </div>
                      <div>
                        <div className={`font-medium text-sm ${
                          isSelected ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {type.label}
                        </div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Date & Time
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-10 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
              />
            </div>
          </div>

          {/* Main Asset and Amount */}
          {!isTradeType && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Asset
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="assets"
                    value={formData.asset}
                    onChange={(e) => handleInputChange('asset', e.target.value)}
                    placeholder="e.g., BTC, ETH, USDC"
                    className={`w-full bg-white border rounded-xl px-4 py-3 pr-12 text-gray-900 focus:outline-none transition-colors ${
                      errors.asset ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                    } focus:ring-2`}
                  />
                  {formData.asset && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CoinIcon symbol={formData.asset} size={20} />
                    </div>
                  )}
                </div>
                <datalist id="assets">
                  {popularAssets.map(asset => (
                    <option key={asset} value={asset} />
                  ))}
                </datalist>
                {errors.asset && <p className="text-red-500 text-sm">{errors.asset}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Amount
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.00"
                  className={`w-full bg-white border rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition-colors ${
                    errors.amount ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  } focus:ring-2`}
                />
                {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}
              </div>
            </div>
          )}

          {/* Trade-specific fields */}
          {isTradeType && (
            <div className="space-y-6">
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                  <ArrowDownLeft size={20} className="mr-2" />
                  From (Selling)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-red-800">From Asset</label>
                    <div className="relative">
                      <input
                        type="text"
                        list="assets"
                        value={formData.fromAsset}
                        onChange={(e) => handleInputChange('fromAsset', e.target.value)}
                        placeholder="e.g., USDC"
                        className={`w-full bg-white border rounded-lg px-4 py-3 pr-12 text-gray-900 focus:outline-none transition-colors ${
                          errors.fromAsset ? 'border-red-300' : 'border-red-200 focus:border-red-400'
                        }`}
                      />
                      {formData.fromAsset && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <CoinIcon symbol={formData.fromAsset} size={20} />
                        </div>
                      )}
                    </div>
                    {errors.fromAsset && <p className="text-red-500 text-sm">{errors.fromAsset}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-red-800">From Amount</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.fromAmount}
                      onChange={(e) => handleInputChange('fromAmount', e.target.value)}
                      placeholder="0.00"
                      className={`w-full bg-white border rounded-lg px-4 py-3 text-gray-900 focus:outline-none transition-colors ${
                        errors.fromAmount ? 'border-red-300' : 'border-red-200 focus:border-red-400'
                      }`}
                    />
                    {errors.fromAmount && <p className="text-red-500 text-sm">{errors.fromAmount}</p>}
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                  <ArrowUpRight size={20} className="mr-2" />
                  To (Buying)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-green-800">To Asset</label>
                    <div className="relative">
                      <input
                        type="text"
                        list="assets"
                        value={formData.toAsset}
                        onChange={(e) => handleInputChange('toAsset', e.target.value)}
                        placeholder="e.g., ETH"
                        className={`w-full bg-white border rounded-lg px-4 py-3 pr-12 text-gray-900 focus:outline-none transition-colors ${
                          errors.toAsset ? 'border-red-300' : 'border-green-200 focus:border-green-400'
                        }`}
                      />
                      {formData.toAsset && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <CoinIcon symbol={formData.toAsset} size={20} />
                        </div>
                      )}
                    </div>
                    {errors.toAsset && <p className="text-red-500 text-sm">{errors.toAsset}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-green-800">To Amount</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.toAmount}
                      onChange={(e) => handleInputChange('toAmount', e.target.value)}
                      placeholder="0.00"
                      className={`w-full bg-white border rounded-lg px-4 py-3 text-gray-900 focus:outline-none transition-colors ${
                        errors.toAmount ? 'border-red-300' : 'border-green-200 focus:border-green-400'
                      }`}
                    />
                    {errors.toAmount && <p className="text-red-500 text-sm">{errors.toAmount}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Price */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Price per Unit (GBP)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="number"
                step="any"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0.00"
                className={`w-full bg-white border rounded-xl pl-10 pr-4 py-3 text-gray-900 focus:outline-none transition-colors ${
                  errors.price ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                } focus:ring-2`}
              />
            </div>
            {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
          </div>

          {/* Fee and Exchange */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">Fee Amount</label>
              <input
                type="number"
                step="any"
                value={formData.fee}
                onChange={(e) => handleInputChange('fee', e.target.value)}
                placeholder="0.00"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">Exchange</label>
              <input
                type="text"
                list="exchanges"
                value={formData.exchange}
                onChange={(e) => handleInputChange('exchange', e.target.value)}
                placeholder="e.g., Binance, Coinbase Pro"
                className={`w-full bg-white border rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition-colors ${
                  errors.exchange ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                } focus:ring-2`}
              />
              <datalist id="exchanges">
                {popularExchanges.map(exchange => (
                  <option key={exchange} value={exchange} />
                ))}
              </datalist>
              {errors.exchange && <p className="text-red-500 text-sm">{errors.exchange}</p>}
            </div>
          </div>

          {/* Transaction Hash */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Transaction Hash (Optional)
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={formData.txHash}
                onChange={(e) => handleInputChange('txHash', e.target.value)}
                placeholder="0x..."
                className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors font-mono text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional details about this transaction..."
                rows={3}
                className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-colors font-medium"
          >
            <Plus size={16} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>
    </div>
  );
};