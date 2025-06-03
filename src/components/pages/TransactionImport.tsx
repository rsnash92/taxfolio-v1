import React, { useState, useCallback } from 'react';
import { Upload, X, Trash2, Download } from 'lucide-react';

// Define transaction types for your system
interface ImportedTransaction {
  id: string;
  date: string;
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out' | 'trade' | 'fee' | 'mining' | 'staking';
  asset: string;
  amount: number;
  price?: number;
  fee?: number;
  feeAsset?: string;
  fromAsset?: string;
  fromAmount?: number;
  toAsset?: string;
  toAmount?: number;
  exchange: string;
  txHash?: string;
  notes?: string;
}

interface TransactionImportProps {
  onImport: (transactions: ImportedTransaction[]) => void;
  onClose: () => void;
}

export const TransactionImport: React.FC<TransactionImportProps> = ({ onImport, onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<ImportedTransaction[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsProcessing(true);

    try {
      // Simple CSV parsing for demo
      const text = await uploadedFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const transactions: ImportedTransaction[] = lines.slice(1)
        .filter(line => line.trim())
        .map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header, i) => {
            row[header] = values[i] || '';
          });

          return {
            id: `import_${Date.now()}_${index}`,
            date: new Date(row.Date || row.date || Date.now()).toISOString(),
            type: (row.Type || row.type || 'transfer_in').toLowerCase() as any,
            asset: row.Asset || row.asset || 'UNKNOWN',
            amount: parseFloat(row.Amount || row.amount || '0'),
            price: parseFloat(row.Price || row.price || '0') || undefined,
            fee: parseFloat(row.Fee || row.fee || '0') || undefined,
            exchange: row.Exchange || row.exchange || 'Imported'
          };
        });

      setParsedTransactions(transactions);
    } catch (error) {
      console.error('Error parsing file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setParsedTransactions([]);
  };

  const handleImport = () => {
    if (parsedTransactions.length > 0) {
      onImport(parsedTransactions);
      onClose();
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedTransactions([]);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Import File</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!file ? (
            // Upload Area
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {/* Upload Icon */}
              <div className="mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto relative">
                  <Upload className="text-gray-400" size={24} />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
                    <Upload className="text-white" size={12} />
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Drop or select file
              </h3>
              
              <p className="text-gray-600 mb-4">
                Drop files here or click{' '}
                <button 
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="text-gray-900 underline font-medium hover:text-blue-600"
                >
                  browse
                </button>{' '}
                thorough your machine
              </p>

              <input
                id="file-input"
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
            </div>
          ) : (
            // File Selected
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-medium text-xs">CSV</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)}KB
                      {parsedTransactions.length > 0 && ` • ${parsedTransactions.length} transactions`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600">Processing file...</span>
                </div>
              )}

              {parsedTransactions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    ✅ Successfully parsed {parsedTransactions.length} transactions
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100">
          <button
            onClick={handleReset}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Reset
          </button>
          
          <button
            onClick={handleImport}
            disabled={!file || isProcessing || parsedTransactions.length === 0}
            className={`px-6 py-2.5 rounded-lg font-medium flex items-center space-x-2 transition-colors ${
              file && !isProcessing && parsedTransactions.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Download size={16} />
            <span>Import File</span>
          </button>
        </div>
      </div>
    </div>
  );
};