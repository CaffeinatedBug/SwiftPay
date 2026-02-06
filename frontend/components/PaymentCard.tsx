'use client';

interface PaymentCardProps {
  merchantENS: string;
  amount: number;
  currency: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PaymentCard({ merchantENS, amount, currency, onConfirm, onCancel }: PaymentCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-yellow-400/30">
      <div className="text-center space-y-4">
        <div className="bg-gray-700 rounded-lg p-4 inline-block">
          <p className="text-gray-400 text-sm">Amount</p>
          <p className="text-white text-3xl font-bold">
            ${amount.toFixed(2)} <span className="text-sm text-gray-400">{currency}</span>
          </p>
        </div>

        <p className="text-gray-400 text-sm">
          Paying <span className="text-yellow-400">{merchantENS}</span>
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-600 text-gray-300 py-3 rounded-lg hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-yellow-400 text-gray-900 font-bold py-3 rounded-lg hover:bg-yellow-300 transition"
          >
            ✅ Confirm Pay
          </button>
        </div>

        <p className="text-gray-500 text-xs">
          ⚡ Instant confirmation • No gas fees
        </p>
      </div>
    </div>
  );
}
