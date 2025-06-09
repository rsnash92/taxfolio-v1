import React, { useState } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { X } from 'lucide-react';

interface TransactionFormProps {
  onClose: () => void;
}

type TransactionType = 'buy' | 'sell' | 'transfer_in' | 'transfer_out' | 'mining' | 'staking' | 'trade' | 'fee';

export function TransactionForm({ onClose }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    type: 'buy' as TransactionType,
    asset: '',
    amount: '',
    price: '',
    fee: '',
    date: new Date().toISOString().split('T')[0],
    exchange: 'Manual Entry',
    notes: '',
  });

  const { addTransaction, error } = useTransactions();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.asset || !formData.amount) {
      return;
    }

    setLoading(true);
    try {
      const amount = parseFloat(formData.amount);
      const price = parseFloat(formData.price) || 0;
      const fee = parseFloat(formData.fee) || 0;

      await addTransaction({
        type: formData.type,
        asset: formData.asset.toUpperCase(),
        amount,
        price: price || undefined,
        value: amount * price,
        fee: fee || undefined,
        date: formData.date,
        exchange: formData.exchange,
        notes: formData.notes,
        category: getCategory(formData.type)
      });

      onClose();
    } catch (err) {
      // Error will be handled by the hook
      console.error('Error adding transaction:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getCategory = (type: TransactionType) => {
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

  const transactionTypes = [
    { value: 'buy', label: 'Buy', icon: '📈', color: 'green' },
    { value: 'sell', label: 'Sell', icon: '📉', color: 'red' },
    { value: 'transfer_in', label: 'Transfer In', icon: '📥', color: 'blue' },
    { value: 'transfer_out', label: 'Transfer Out', icon: '📤', color: 'orange' },
    { value: 'mining', label: 'Mining', icon: '⛏️', color: 'purple' },
    { value: 'staking', label: 'Staking', icon: '💰', color: 'yellow' },
  ];

  // Calculate total value
  const totalValue = formData.amount && formData.price 
    ? (parseFloat(formData.amount) * parseFloat(formData.price)).toFixed(2)
    : '0.00';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-gray-800 rounded-lg p-6 w-full max-w-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Add Transaction</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {transactionTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleChange('type', type.value)}
                  className={`p-3 rounded-lg border transition-all ${
                    formData.type === type.value
                      ? type.color === 'green' ? 'bg-green-500/20 border-green-500 text-green-400' :
                        type.color === 'red' ? 'bg-red-500/20 border-red-500 text-red-400' :
                        type.color === 'blue' ? 'bg-blue-500/20 border-blue-500 text-blue-400' :
                        type.color === 'orange' ? 'bg-orange-500/20 border-orange-500 text-orange-400' :
                        type.color === 'purple' ? 'bg-purple-500/20 border-purple-500 text-purple-400' :
                        'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                      : 'bg-black border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <span className="text-lg mr-2">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Asset & Amount Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Cryptocurrency
              </label>
              <input
                type="text"
                required
                value={formData.asset}
                onChange={(e) => handleChange('asset', e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#15e49e] transition-colors"
                placeholder="BTC, ETH, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Amount
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#15e49e] transition-colors"
                placeholder="0.5"
              />
            </div>
          </div>

          {/* Price & Fee Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Price per unit (£)
              </label>
              <input
                type="number"
                step="any"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#15e49e] transition-colors"
                placeholder="30000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Fee (£)
              </label>
              <input
                type="number"
                step="any"
                value={formData.fee}
                onChange={(e) => handleChange('fee', e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#15e49e] transition-colors"
                placeholder="0"
              />
            </div>
          </div>

          {/* Date & Total Value Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#15e49e] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Total Value
              </label>
              <div className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2.5 text-[#15e49e] font-medium">
                £{totalValue}
              </div>
            </div>
          </div>

          {/* Exchange */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Exchange
            </label>
            <input
              type="text"
              value={formData.exchange}
              onChange={(e) => handleChange('exchange', e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#15e49e] transition-colors"
              placeholder="Coinbase, Binance, etc."
            />
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#15e49e] transition-colors resize-none"
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-black border border-gray-700 hover:bg-gray-900 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#15e49e] hover:bg-[#13c589] disabled:bg-[#15e49e]/50 text-black px-4 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}