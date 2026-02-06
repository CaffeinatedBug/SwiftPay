'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-8 text-center border border-red-500/50 max-w-md">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-red-400 font-bold text-xl mb-2">Something went wrong</h2>
        <p className="text-gray-400 text-sm mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="bg-yellow-400 text-gray-900 font-bold px-6 py-2 rounded-lg hover:bg-yellow-300 transition"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
