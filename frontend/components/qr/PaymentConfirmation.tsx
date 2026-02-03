'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight,
  Wallet,
  Clock,
  Zap,
  Shield,
  ExternalLink
} from 'lucide-react';
import { useAccount, useBalance, useSignMessage, useChainId, useSwitchChain } from 'wagmi';
import { formatUnits } from 'viem';
import {
  QRPaymentPayload,
  PaymentCurrency,
  PaymentChain,
  PaymentStatus,
  QRPaymentTransaction,
  CHAIN_IDS,
} from '@/lib/qr/types';
import {
  formatPaymentAmount,
  getChainDisplayName,
  getChainColor,
  truncateAddress,
  getTimeRemaining,
  createPaymentMessage,
} from '@/lib/qr/utils';

interface PaymentConfirmationProps {
  payload: QRPaymentPayload;
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (transaction: QRPaymentTransaction) => void;
  onPaymentFailed: (error: string) => void;
}

export function PaymentConfirmation({
  payload,
  isOpen,
  onClose,
  onPaymentComplete,
  onPaymentFailed,
}: PaymentConfirmationProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();

  // Payment state
  const [selectedChain, setSelectedChain] = useState<PaymentChain>(payload.preferredChain || 'sepolia');
  const [selectedToken, setSelectedToken] = useState<PaymentCurrency>(payload.currency);
  const [status, setStatus] = useState<PaymentStatus>('confirming');
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get user's balance for selected token
  const { data: balance } = useBalance({
    address: address,
    // token: selectedToken !== 'ETH' ? getTokenAddress(selectedToken, selectedChain) : undefined,
  });

  // Format balance for display
  const formattedBalance = balance 
    ? formatUnits(balance.value, balance.decimals)
    : '0';

  // Check if user has sufficient balance
  const hasSufficientBalance = balance 
    ? parseFloat(formattedBalance) >= parseFloat(payload.amount)
    : false;

  // Update time remaining
  useEffect(() => {
    if (!payload.expiresAt) return;

    const interval = setInterval(() => {
      const remaining = getTimeRemaining(payload.expiresAt!);
      setTimeRemaining(remaining.display);
      if (remaining.expired) {
        setIsExpired(true);
        setStatus('expired');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [payload.expiresAt]);

  // Handle chain switch if needed
  const handleChainSwitch = useCallback(async (targetChain: PaymentChain) => {
    const targetChainId = CHAIN_IDS[targetChain];
    if (chainId !== targetChainId) {
      try {
        await switchChain({ chainId: targetChainId });
      } catch (error) {
        console.error('Failed to switch chain:', error);
        setErrorMessage('Failed to switch network. Please switch manually.');
      }
    }
    setSelectedChain(targetChain);
  }, [chainId, switchChain]);

  // Handle payment submission
  const handlePay = async () => {
    if (!address || isExpired) return;

    setStatus('signing');
    setProgress(20);
    setErrorMessage(null);

    try {
      // Create payment message for signing
      const message = createPaymentMessage(
        payload.paymentId,
        payload.merchantAddress,
        payload.amount,
        payload.currency,
        Date.now()
      );

      // Request signature from wallet
      setProgress(40);
      const signature = await signMessageAsync({ message });

      // Process payment through Yellow Network
      setStatus('processing');
      setProgress(60);

      // Simulate Yellow Network processing
      // In production, this would send the signed message to the Yellow Network hub
      await new Promise(resolve => setTimeout(resolve, 1500));

      setProgress(80);

      // Create transaction record
      const transaction: QRPaymentTransaction = {
        id: `TX-${Date.now().toString(36)}`,
        payload,
        payerAddress: address,
        selectedChain,
        selectedToken,
        amountPaid: payload.amount,
        status: 'completed',
        signature: signature as `0x${string}`,
        initiatedAt: Date.now(),
        completedAt: Date.now(),
      };

      setProgress(100);
      setStatus('completed');

      // Wait a moment to show success state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onPaymentComplete(transaction);
    } catch (error) {
      console.error('Payment failed:', error);
      setStatus('failed');
      const message = error instanceof Error ? error.message : 'Payment failed';
      setErrorMessage(message);
      onPaymentFailed(message);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setStatus('cancelled');
    onClose();
  };

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStatus('confirming');
      setProgress(0);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isConnected) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>
              Please connect your wallet to make a payment
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <Wallet className="h-16 w-16 text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={status === 'confirming' ? onClose : undefined}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
            {status === 'expired' && <Clock className="h-5 w-5 text-amber-500" />}
            {(status === 'confirming' || status === 'signing' || status === 'processing') && (
              <Zap className="h-5 w-5 text-primary" />
            )}
            {status === 'completed' 
              ? 'Payment Successful!'
              : status === 'failed'
              ? 'Payment Failed'
              : status === 'expired'
              ? 'Payment Expired'
              : 'Confirm Payment'
            }
          </DialogTitle>
          <DialogDescription>
            {status === 'completed' 
              ? 'Your payment has been processed successfully'
              : status === 'failed'
              ? 'There was an error processing your payment'
              : status === 'expired'
              ? 'This payment request has expired'
              : `Pay ${payload.merchantName}`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Payment Details */}
        <Card className="border-0 shadow-none">
          <CardContent className="p-4 space-y-4">
            {/* Amount */}
            <div className="text-center py-4">
              <p className="text-4xl font-bold">
                {formatPaymentAmount(payload.amount, payload.currency)}
              </p>
              {payload.reference && (
                <Badge variant="secondary" className="mt-2">
                  {payload.reference}
                </Badge>
              )}
            </div>

            <Separator />

            {/* Merchant Info */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">To</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{payload.merchantName}</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {truncateAddress(payload.merchantAddress)}
                </Badge>
              </div>
            </div>

            {/* Payment ID */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Payment ID</span>
              <span className="font-mono text-xs">{payload.paymentId}</span>
            </div>

            {/* Expiry */}
            {payload.expiresAt && !isExpired && status === 'confirming' && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Expires in</span>
                <div className="flex items-center gap-1 text-amber-500">
                  <Clock className="h-3 w-3" />
                  <span>{timeRemaining}</span>
                </div>
              </div>
            )}

            {/* Memo */}
            {payload.memo && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Memo</span>
                <span>{payload.memo}</span>
              </div>
            )}

            {status === 'confirming' && (
              <>
                <Separator />

                {/* Network Selection */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Pay from</label>
                  <Select 
                    value={selectedChain} 
                    onValueChange={(v) => handleChainSwitch(v as PaymentChain)}
                  >
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
                    </SelectContent>
                  </Select>
                </div>

                {/* Token Selection */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Pay with</label>
                  <Select 
                    value={selectedToken} 
                    onValueChange={(v) => setSelectedToken(v as PaymentCurrency)}
                  >
                    <SelectTrigger>
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

                {/* Balance Info */}
                <div className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Your Balance</span>
                  <span className={`font-medium ${hasSufficientBalance ? 'text-green-500' : 'text-red-500'}`}>
                    {balance ? `${parseFloat(formattedBalance).toFixed(4)} ${balance.symbol}` : 'Loading...'}
                  </span>
                </div>
              </>
            )}

            {/* Progress Bar */}
            {(status === 'signing' || status === 'processing') && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-center text-sm text-muted-foreground">
                  {status === 'signing' && 'Waiting for wallet signature...'}
                  {status === 'processing' && 'Processing payment via Yellow Network...'}
                </p>
              </div>
            )}

            {/* Success State */}
            {status === 'completed' && (
              <div className="flex flex-col items-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-medium">Payment sent successfully!</p>
                  <p className="text-sm text-muted-foreground">
                    Cleared instantly via Yellow Network
                  </p>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" />
                  Instant Settlement
                </Badge>
              </div>
            )}

            {/* Error State */}
            {status === 'failed' && errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Expired State */}
            {status === 'expired' && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  This payment request has expired. Please request a new QR code from the merchant.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {status === 'confirming' && (
            <>
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                className="flex-1 gap-2" 
                onClick={handlePay}
                disabled={isExpired || !hasSufficientBalance}
              >
                Pay Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {(status === 'signing' || status === 'processing') && (
            <Button className="w-full" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {status === 'signing' ? 'Confirm in Wallet...' : 'Processing...'}
            </Button>
          )}

          {status === 'completed' && (
            <Button className="w-full" onClick={onClose}>
              Done
            </Button>
          )}

          {(status === 'failed' || status === 'expired') && (
            <Button className="w-full" variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Secured by Yellow Network state channels</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PaymentConfirmation;
