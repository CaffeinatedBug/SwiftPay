'use client';

import { useState } from 'react';

interface QRScannerProps {
  onScan: (data: string) => void;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [manualInput, setManualInput] = useState('');

  // In production, use react-qr-reader. For hackathon demo, provide manual input fallback.
  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
    }
  };

  return (
    <div className="space-y-4">
      {/* Camera placeholder - swap with react-qr-reader in production */}
      <div className="bg-gray-800 rounded-lg p-8 border-2 border-dashed border-yellow-400/30 text-center">
        <div className="text-4xl mb-4">📷</div>
        <p className="text-gray-400">Camera QR scanner</p>
        <p className="text-gray-500 text-xs mt-1">
          (Use manual input below for demo)
        </p>
      </div>

      {/* Manual input for demo */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <label className="text-gray-400 text-sm">Or enter merchant ENS manually:</label>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder='{"merchantENS":"coffeeshop.swiftpay.eth","amount":5.00}'
            className="flex-1 bg-gray-700 text-white p-2 rounded-lg text-sm border border-gray-600 focus:border-yellow-400 outline-none"
          />
          <button
            onClick={handleManualSubmit}
            className="bg-yellow-400 text-gray-900 font-bold px-4 rounded-lg hover:bg-yellow-300 transition"
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}
