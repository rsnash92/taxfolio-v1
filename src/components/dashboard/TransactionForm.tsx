import { useState } from 'react'
import { useTransactionStore } from '../../store/transactionStore'

interface TransactionFormProps {
  onClose: () => void
}

export function TransactionForm({ onClose }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    type: 'buy' as 'buy' | 'sell',
    asset: '',
    amount: '',
    priceGBP: '',
    fee: '',
    date: new Date().toISOString().split('T')[0], // Today's date
  })

  const { addTransaction, isLoading, error, clearError } = useTransactionStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    // Validation
    if (!formData.asset || !formData.amount || !formData.priceGBP) {
      return
    }

    addTransaction({
      type: formData.type,
      asset: formData.asset.toUpperCase(),
      amount: parseFloat(formData.amount),
      priceGBP: parseFloat(formData.priceGBP),
      fee: parseFloat(formData.fee) || 0,
      date: new Date(formData.date),
    })

    onClose()
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card-dark p-6 w-full max-w-md relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add Transaction</h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleChange('type', 'buy')}
                className={`p-3 rounded-lg border transition-all ${
                  formData.type === 'buy'
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-dark-700/50 border-dark-600 text-dark-300 hover:border-dark-500'
                }`}
              >
                📈 Buy
              </button>
              <button
                type="button"
                onClick={() => handleChange('type', 'sell')}
                className={`p-3 rounded-lg border transition-all ${
                  formData.type === 'sell'
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-dark-700/50 border-dark-600 text-dark-300 hover:border-dark-500'
                }`}
              >
                📉 Sell
              </button>
            </div>
          </div>

          {/* Asset & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Cryptocurrency
              </label>
              <input
                type="text"
                required
                value={formData.asset}
                onChange={(e) => handleChange('asset', e.target.value)}
                className="input-dark w-full px-3 py-2 rounded-lg"
                placeholder="BTC, ETH, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Amount
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="input-dark w-full px-3 py-2 rounded-lg"
                placeholder="0.5"
              />
            </div>
          </div>

          {/* Price & Fee */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Price per unit (£)
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.priceGBP}
                onChange={(e) => handleChange('priceGBP', e.target.value)}
                className="input-dark w-full px-3 py-2 rounded-lg"
                placeholder="30000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Fee (£)
              </label>
              <input
                type="number"
                step="any"
                value={formData.fee}
                onChange={(e) => handleChange('fee', e.target.value)}
                className="input-dark w-full px-3 py-2 rounded-lg"
                placeholder="25"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Date
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="input-dark w-full px-3 py-2 rounded-lg"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary-dark flex-1 py-3 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary-dark flex-1 py-3 rounded-lg disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}