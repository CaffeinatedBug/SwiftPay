'use client';

import { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface MerchantQRProps {
  merchantENS: string;
  amount: number;
}

export function MerchantQR({ merchantENS, amount }: MerchantQRProps) {
  const qrData = useMemo(
    () => JSON.stringify({ merchantENS, amount, currency: 'USD' }),
    [merchantENS, amount]
  );

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
      <div className="bg-white rounded-lg p-4 inline-block mx-auto">
        <QRCodeSVG
          value={qrData}
          size={192}
          bgColor="#ffffff"
          fgColor="#111827"
          level="M"
          includeMargin={false}
        />
      </div>
      <p className="text-gray-400 text-sm mt-3">
        Scan to pay <span className="text-yellow-400">${amount.toFixed(2)}</span>
      </p>
      <p className="text-gray-500 text-xs mt-1">{merchantENS}</p>
    </div>
  );
}
