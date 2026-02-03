'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, QrCode, Download, Copy, RefreshCw, Check, Clock } from 'lucide-react';
import { useAccount } from 'wagmi';
import {
  QRPaymentPayload,
  PaymentCurrency,
  PaymentChain,
  QRGeneratorConfig,
} from '@/lib/qr/types';
import {
  createPaymentPayload,
  generateQRCodeDataURL,
  formatPaymentAmount,
  getChainDisplayName,
  getTimeRemaining,
} from '@/lib/qr/utils';

interface QRGeneratorProps {
  merchantName?: string;
  defaultCurrency?: PaymentCurrency;
  defaultChain?: PaymentChain;
  onPaymentCreated?: (payload: QRPaymentPayload) => void;
  className?: string;
}

export function QRGenerator({
  merchantName = 'SwiftPay Merchant',
  defaultCurrency = 'USDC',
  defaultChain = 'sepolia',
  onPaymentCreated,
  className,
}: QRGeneratorProps) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<PaymentCurrency>(defaultCurrency);
  const [chain, setChain] = useState<PaymentChain>(defaultChain);
  const [reference, setReference] = useState('');
  const [memo, setMemo] = useState('');
  const [expiryMinutes, setExpiryMinutes] = useState('15');
  
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [currentPayload, setCurrentPayload] = useState<QRPaymentPayload | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Update time remaining
  useEffect(() => {
    if (!currentPayload?.expiresAt) return;

    const interval = setInterval(() => {
      const remaining = getTimeRemaining(currentPayload.expiresAt!);
      setTimeRemaining(remaining.display);
      setIsExpired(remaining.expired);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPayload?.expiresAt]);

  const generateQR = useCallback(async () => {
    if (!address || !amount) return;

    setIsGenerating(true);
    try {
      const expiresIn = parseInt(expiryMinutes) * 60 * 1000;
      
      const payload = createPaymentPayload(
        address,
        merchantName,
        amount,
        currency,
        {
          preferredChain: chain,
          reference: reference || undefined,
          memo: memo || undefined,
          expiresIn,
        }
      );

      const config: Partial<QRGeneratorConfig> = {
        size: 300,
        errorCorrectionLevel: 'H',
      };

      const dataUrl = await generateQRCodeDataURL(payload, config);
      
      setQrDataUrl(dataUrl);
      setCurrentPayload(payload);
      setIsExpired(false);
      
      if (onPaymentCreated) {
        onPaymentCreated(payload);
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [address, amount, currency, chain, reference, memo, expiryMinutes, merchantName, onPaymentCreated]);

  const handleDownload = () => {
    if (!qrDataUrl || !currentPayload) return;

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `swiftpay-${currentPayload.paymentId}.png`;
    link.click();
  };

  const handleCopy = async () => {
    if (!currentPayload) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(currentPayload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleReset = () => {
    setQrDataUrl(null);
    setCurrentPayload(null);
    setAmount('');
    setReference('');
    setMemo('');
    setIsExpired(false);
    setTimeRemaining('');
  };

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Connect your wallet to generate payment QR codes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <QrCode className="h-4 w-4" />
          Generate Payment QR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Payment QR Code
          </DialogTitle>
          <DialogDescription>
            Generate a QR code for customers to scan and pay
          </DialogDescription>
        </DialogHeader>

        {!qrDataUrl ? (
          <div className="space-y-4">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="flex-1"
                />
                <Select value={currency} onValueChange={(v) => setCurrency(v as PaymentCurrency)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="DAI">DAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Chain Selection */}
            <div className="space-y-2">
              <Label htmlFor="chain">Preferred Network</Label>
              <Select value={chain} onValueChange={(v) => setChain(v as PaymentChain)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sepolia">Sepolia (Testnet)</SelectItem>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="optimism">Optimism</SelectItem>
                  <SelectItem value="arc">Arc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <Label htmlFor="reference">Order Reference (Optional)</Label>
              <Input
                id="reference"
                placeholder="INV-001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            {/* Memo */}
            <div className="space-y-2">
              <Label htmlFor="memo">Memo (Optional)</Label>
              <Input
                id="memo"
                placeholder="Coffee and pastry"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>

            {/* Expiry */}
            <div className="space-y-2">
              <Label htmlFor="expiry">Expires In</Label>
              <Select value={expiryMinutes} onValueChange={setExpiryMinutes}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <Button
              className="w-full"
              onClick={generateQR}
              disabled={!amount || parseFloat(amount) <= 0 || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Generate QR Code
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* QR Code Display */}
            <div className="flex flex-col items-center space-y-4">
              <div className={`relative rounded-lg p-4 bg-white ${isExpired ? 'opacity-50' : ''}`}>
                <img
                  src={qrDataUrl}
                  alt="Payment QR Code"
                  className="w-64 h-64"
                />
                {isExpired && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <Badge variant="destructive" className="text-lg py-2 px-4">
                      EXPIRED
                    </Badge>
                  </div>
                )}
              </div>

              {/* Payment Details */}
              <div className="text-center space-y-2">
                <p className="text-2xl font-bold">
                  {formatPaymentAmount(currentPayload!.amount, currentPayload!.currency)}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">
                    {getChainDisplayName(chain)}
                  </Badge>
                  {currentPayload?.reference && (
                    <Badge variant="outline">{currentPayload.reference}</Badge>
                  )}
                </div>
                {!isExpired && timeRemaining && (
                  <div className="flex items-center justify-center gap-1 text-sm text-amber-500">
                    <Clock className="h-3 w-3" />
                    <span>Expires in {timeRemaining}</span>
                  </div>
                )}
              </div>

              {/* Payment ID */}
              <p className="text-xs text-muted-foreground font-mono">
                {currentPayload?.paymentId}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Data
                  </>
                )}
              </Button>
            </div>

            {/* Reset Button */}
            <Button variant="ghost" className="w-full" onClick={handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate New QR
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Simple QR display component for already generated QR codes
 */
interface QRDisplayProps {
  dataUrl: string;
  payload: QRPaymentPayload;
  size?: number;
  showDetails?: boolean;
  className?: string;
}

export function QRDisplay({
  dataUrl,
  payload,
  size = 200,
  showDetails = true,
  className,
}: QRDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!payload.expiresAt) return;

    const interval = setInterval(() => {
      const remaining = getTimeRemaining(payload.expiresAt!);
      setTimeRemaining(remaining.display);
      setIsExpired(remaining.expired);
    }, 1000);

    return () => clearInterval(interval);
  }, [payload.expiresAt]);

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      <div className={`relative rounded-lg p-3 bg-white ${isExpired ? 'opacity-50' : ''}`}>
        <img
          src={dataUrl}
          alt="Payment QR Code"
          style={{ width: size, height: size }}
        />
        {isExpired && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <Badge variant="destructive">EXPIRED</Badge>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="text-center space-y-1">
          <p className="text-xl font-bold">
            {formatPaymentAmount(payload.amount, payload.currency)}
          </p>
          {!isExpired && timeRemaining && (
            <div className="flex items-center justify-center gap-1 text-xs text-amber-500">
              <Clock className="h-3 w-3" />
              <span>{timeRemaining}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QRGenerator;
