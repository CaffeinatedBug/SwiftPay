'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Copy, Check, QrCode, Clock, DollarSign } from 'lucide-react';

interface InlineQRDisplayProps {
  onClose: () => void;
  onPaymentReceived?: () => void;
}

export function InlineQRDisplay({ onClose, onPaymentReceived }: InlineQRDisplayProps) {
  const [amount, setAmount] = useState('25.00');
  const [currency, setCurrency] = useState('USDC');
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText('0x742d35Cc6e7185B4C5432aB4B8D8f3E');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateQRPattern = () => {
    const size = 21;
    const pattern: boolean[][] = [];
    const seed = Math.random();
    
    const random = (x: number, y: number) => {
      const n = Math.sin(seed * 9999 + x * 127 + y * 311) * 43758.5453;
      return n - Math.floor(n);
    };

    for (let y = 0; y < size; y++) {
      pattern[y] = [];
      for (let x = 0; x < size; x++) {
        const isTopLeft = x < 7 && y < 7;
        const isTopRight = x >= size - 7 && y < 7;
        const isBottomLeft = x < 7 && y >= size - 7;
        
        if (isTopLeft || isTopRight || isBottomLeft) {
          const localX = isTopRight ? x - (size - 7) : x;
          const localY = isBottomLeft ? y - (size - 7) : y;
          const isOuter = localX === 0 || localX === 6 || localY === 0 || localY === 6;
          const isInner = localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4;
          pattern[y][x] = isOuter || isInner;
        } else {
          pattern[y][x] = random(x, y) > 0.5;
        }
      }
    }
    return pattern;
  };

  const qrPattern = generateQRPattern();
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <Card className="relative border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-white shadow-xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="absolute right-3 top-3 z-10 h-8 w-8 rounded-full p-0 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      >
        <X className="h-4 w-4" />
      </Button>

      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <QrCode className="h-5 w-5 text-blue-600" />
          Payment QR Code
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left: QR Code */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="absolute -inset-3 rounded-2xl bg-blue-500/10 blur-xl" />
              <div className="relative rounded-2xl border-2 border-blue-300 bg-white p-5 shadow-lg">
                <div 
                  className="grid gap-0"
                  style={{ 
                    gridTemplateColumns: `repeat(21, 1fr)`,
                    width: "210px",
                    height: "210px"
                  }}
                >
                  {qrPattern.flat().map((filled, i) => (
                    <div
                      key={i}
                      className={`aspect-square ${filled ? "bg-black" : "bg-white"}`}
                    />
                  ))}
                </div>
                
                <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border-2 border-yellow-300 bg-yellow-50 px-4 py-2">
              <Clock className="h-4 w-4 text-yellow-700" />
              <span className="text-sm font-medium text-yellow-700">
                {minutes}:{seconds.toString().padStart(2, '0')} remaining
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-full border-2 border-blue-300 bg-blue-50 px-4 py-2">
              <div className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Awaiting Payment
              </span>
            </div>
          </div>

          {/* Right: Details */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50 p-4">
              <div className="text-xs text-gray-500 mb-2">Amount Due</div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">${amount}</span>
                <span className="text-lg font-semibold text-gray-600">{currency}</span>
              </div>
              <Badge variant="outline" className="mt-3 border-blue-200 bg-blue-100 text-blue-700">
                Arbitrum
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs font-medium text-gray-600">
                Adjust Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-xl border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="text-xs font-medium text-gray-600">
                Currency
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency" className="rounded-xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="DAI">DAI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600">Merchant Address</Label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <span className="flex-1 text-xs font-mono text-gray-700 truncate">
                  0x742d35Cc6e7185B4C5432aB4B8D8f3E
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 w-7 rounded-lg p-0"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
              <p className="text-xs text-gray-600">
                Customer can scan this QR code with their wallet to pay. Payment will be instantly cleared via Yellow Network.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
