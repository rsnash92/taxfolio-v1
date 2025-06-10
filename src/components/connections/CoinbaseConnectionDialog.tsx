import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2, Key, Shield, Info } from 'lucide-react';
import { useConnectionsStore } from '../../store/connectionsStore';

interface CoinbaseConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CoinbaseConnectionDialog: React.FC<CoinbaseConnectionDialogProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [connectionName, setConnectionName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [apiPassphrase, setApiPassphrase] = useState('');
  const [isTestMode, setIsTestMode] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
  const { connectExchange, isConnecting, error, clearError } = useConnectionsStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await connectExchange(
      'coinbase',
      connectionName,
      apiKey,
      apiSecret,
      apiPassphrase
    );

    if (success) {
      onSuccess?.();
      onClose();
      // Reset form
      setConnectionName('');
      setApiKey('');
      setApiSecret('');
      setApiPassphrase('');
      setIsTestMode(false);
    }
  };

  const handleClose = () => {
    clearError();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold">Connect Coinbase Account</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Connection Failed</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connection Name
            </label>
            <input
              type="text"
              value={connectionName}
              onChange={(e) => setConnectionName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="My Coinbase Account"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Give this connection a friendly name to identify it later
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center space-x-3">
                <Info className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  How to get your Coinbase API credentials
                </span>
              </div>
              <span className="text-blue-600 text-sm">
                {showInstructions ? 'Hide' : 'Show'}
              </span>
            </button>
            
            {showInstructions && (
              <div className="mt-4 space-y-3 text-sm text-blue-800">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Log in to your Coinbase account</li>
                  <li>Go to Settings → API</li>
                  <li>Click "New API Key"</li>
                  <li>Select permissions: View (Read-only access recommended)</li>
                  <li>Set IP whitelist if desired for extra security</li>
                  <li>Save your API Key, Secret, and Passphrase securely</li>
                </ol>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                  <p className="text-yellow-800 text-xs">
                    <strong>Security Note:</strong> We recommend using read-only permissions
                    to ensure your funds remain secure. Never share your API credentials.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Enter your Coinbase API key"
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Secret
            </label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Enter your Coinbase API secret"
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Passphrase
            </label>
            <input
              type="password"
              value={apiPassphrase}
              onChange={(e) => setApiPassphrase(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Enter your Coinbase API passphrase"
              required
              autoComplete="off"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="testMode"
              checked={isTestMode}
              onChange={(e) => setIsTestMode(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="testMode" className="text-sm text-gray-700">
              Connect to Coinbase Sandbox (Test Mode)
            </label>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start space-x-3">
            <Shield className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Your security is our priority</p>
              <ul className="space-y-1 text-xs">
                <li>• API credentials are encrypted and stored securely</li>
                <li>• We use read-only access to protect your funds</li>
                <li>• You can revoke access anytime from Coinbase</li>
                <li>• We never store your account passwords</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isConnecting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isConnecting || !connectionName || !apiKey || !apiSecret || !apiPassphrase}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Connect Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};