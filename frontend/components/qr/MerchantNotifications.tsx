'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Zap,
  Clock
} from 'lucide-react';
import { useAccount } from 'wagmi';
import {
  QRPaymentPayload,
  MerchantNotification,
  PaymentStatus,
  WSMessage,
  WSMessageType,
} from '@/lib/qr/types';
import {
  formatPaymentAmount,
  truncateAddress,
} from '@/lib/qr/utils';

// Simulated WebSocket connection for demo
// In production, this would connect to a real backend WebSocket server
class PaymentNotificationService {
  private listeners: Set<(notification: MerchantNotification) => void> = new Set();
  private connectionListeners: Set<(connected: boolean) => void> = new Set();
  private connected = false;

  connect(merchantAddress: string): void {
    // Simulate connection delay
    setTimeout(() => {
      this.connected = true;
      this.connectionListeners.forEach(listener => listener(true));
    }, 500);
  }

  disconnect(): void {
    this.connected = false;
    this.connectionListeners.forEach(listener => listener(false));
  }

  isConnected(): boolean {
    return this.connected;
  }

  onNotification(callback: (notification: MerchantNotification) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.add(callback);
    return () => this.connectionListeners.delete(callback);
  }

  // Simulate receiving a payment (for demo purposes)
  simulatePayment(notification: MerchantNotification): void {
    this.listeners.forEach(listener => listener(notification));
  }
}

// Singleton instance
const notificationService = new PaymentNotificationService();

// Hook for using the notification service
export function usePaymentNotifications(merchantAddress?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<MerchantNotification | null>(null);
  const [notifications, setNotifications] = useState<MerchantNotification[]>([]);

  useEffect(() => {
    if (!merchantAddress) return;

    notificationService.connect(merchantAddress);

    const unsubConnection = notificationService.onConnectionChange(setIsConnected);
    const unsubNotification = notificationService.onNotification((notification) => {
      setLastNotification(notification);
      setNotifications(prev => [notification, ...prev].slice(0, 50));
    });

    return () => {
      unsubConnection();
      unsubNotification();
      notificationService.disconnect();
    };
  }, [merchantAddress]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setLastNotification(null);
  }, []);

  return {
    isConnected,
    lastNotification,
    notifications,
    clearNotifications,
    simulatePayment: notificationService.simulatePayment.bind(notificationService),
  };
}

// POS Terminal States
type POSState = 'waiting' | 'receiving' | 'success' | 'failed';

interface POSTerminalProps {
  currentPayload?: QRPaymentPayload | null;
  onReset?: () => void;
  className?: string;
}

export function POSTerminal({
  currentPayload,
  onReset,
  className,
}: POSTerminalProps) {
  const { address } = useAccount();
  const [posState, setPosState] = useState<POSState>('waiting');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastPayment, setLastPayment] = useState<MerchantNotification | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    isConnected,
    lastNotification,
    simulatePayment,
  } = usePaymentNotifications(address);

  // Handle incoming payments
  useEffect(() => {
    if (!lastNotification) return;

    if (lastNotification.type === 'payment_received') {
      setPosState('receiving');
      
      // Show success after brief animation
      setTimeout(() => {
        setPosState('success');
        setLastPayment(lastNotification);
        
        // Play success sound
        if (soundEnabled && audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
      }, 800);
    } else if (lastNotification.type === 'payment_failed') {
      setPosState('failed');
    }
  }, [lastNotification, soundEnabled]);

  // Reset POS after showing result
  const handleReset = useCallback(() => {
    setPosState('waiting');
    setLastPayment(null);
    if (onReset) onReset();
  }, [onReset]);

  // Simulate a payment for demo
  const handleSimulatePayment = useCallback(() => {
    if (!address || !currentPayload) return;

    const notification: MerchantNotification = {
      type: 'payment_received',
      paymentId: currentPayload.paymentId,
      merchantAddress: address,
      amount: currentPayload.amount,
      currency: currentPayload.currency,
      payerAddress: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
      timestamp: Date.now(),
      status: 'completed',
      reference: currentPayload.reference,
    };

    simulatePayment(notification);
  }, [address, currentPayload, simulatePayment]);

  // Get background color based on state
  const getBackgroundClass = () => {
    switch (posState) {
      case 'success':
        return 'bg-gradient-to-br from-green-500 to-green-600';
      case 'failed':
        return 'bg-gradient-to-br from-red-500 to-red-600';
      case 'receiving':
        return 'bg-gradient-to-br from-blue-500 to-blue-600';
      default:
        return 'bg-gradient-to-br from-zinc-800 to-zinc-900';
    }
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Hidden audio element for success sound */}
      <audio ref={audioRef} src="/success.mp3" preload="auto" />

      {/* POS Display */}
      <div className={`relative transition-all duration-500 ${getBackgroundClass()}`}>
        {/* Status Bar */}
        <div className="flex items-center justify-between p-3 text-white/80 text-sm">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400" />
            )}
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Main Display Area */}
        <div className="flex flex-col items-center justify-center min-h-[280px] p-6 text-white">
          {posState === 'waiting' && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-white/60" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-medium">Waiting for payment...</p>
                {currentPayload && (
                  <div className="space-y-1">
                    <p className="text-3xl font-bold">
                      {formatPaymentAmount(currentPayload.amount, currentPayload.currency)}
                    </p>
                    {currentPayload.reference && (
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {currentPayload.reference}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {posState === 'receiving' && (
            <div className="text-center space-y-4 animate-pulse">
              <div className="w-20 h-20 mx-auto rounded-full bg-white/20 flex items-center justify-center">
                <Zap className="h-10 w-10" />
              </div>
              <p className="text-xl font-medium">Receiving payment...</p>
            </div>
          )}

          {posState === 'success' && lastPayment && (
            <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="w-24 h-24 mx-auto rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="h-14 w-14" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold">Payment Received!</p>
                <p className="text-4xl font-bold">
                  {formatPaymentAmount(lastPayment.amount, lastPayment.currency)}
                </p>
                <div className="flex items-center justify-center gap-2 text-white/80">
                  <span>From:</span>
                  <Badge variant="secondary" className="bg-white/20 text-white font-mono">
                    {truncateAddress(lastPayment.payerAddress)}
                  </Badge>
                </div>
                {lastPayment.reference && (
                  <Badge variant="outline" className="border-white/40 text-white">
                    {lastPayment.reference}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {posState === 'failed' && (
            <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="w-24 h-24 mx-auto rounded-full bg-white/20 flex items-center justify-center">
                <XCircle className="h-14 w-14" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold">Payment Failed</p>
                <p className="text-white/80">Please try again</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        {(posState === 'success' || posState === 'failed') && (
          <div className="p-4">
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={handleReset}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Ready for Next Payment
            </Button>
          </div>
        )}
      </div>

      {/* Demo Controls (for testing) */}
      {process.env.NODE_ENV === 'development' && posState === 'waiting' && currentPayload && (
        <CardContent className="p-4 border-t">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleSimulatePayment}
          >
            <Zap className="mr-2 h-4 w-4" />
            Simulate Payment (Demo)
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Payment notification toast component
 */
interface PaymentToastProps {
  notification: MerchantNotification;
  onDismiss: () => void;
}

export function PaymentToast({ notification, onDismiss }: PaymentToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <Card className={`w-80 ${
        notification.type === 'payment_received' 
          ? 'border-green-500 bg-green-50 dark:bg-green-950/50' 
          : 'border-red-500 bg-red-50 dark:bg-red-950/50'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {notification.type === 'payment_received' ? (
              <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium">
                {notification.type === 'payment_received' 
                  ? 'Payment Received!' 
                  : 'Payment Failed'}
              </p>
              <p className="text-lg font-bold">
                {formatPaymentAmount(notification.amount, notification.currency)}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                From: {truncateAddress(notification.payerAddress)}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 h-6 w-6"
              onClick={onDismiss}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Recent payments list for merchant dashboard
 */
interface RecentPaymentsProps {
  payments: MerchantNotification[];
  maxItems?: number;
  className?: string;
}

export function RecentPayments({ 
  payments, 
  maxItems = 10,
  className 
}: RecentPaymentsProps) {
  const displayPayments = payments.slice(0, maxItems);

  if (displayPayments.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No payments yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Payments</CardTitle>
        <CardDescription>
          Last {displayPayments.length} payments received
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {displayPayments.map((payment, index) => (
            <div 
              key={`${payment.paymentId}-${index}`}
              className="flex items-center justify-between p-4 hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  payment.status === 'completed' 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {payment.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {formatPaymentAmount(payment.amount, payment.currency)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {truncateAddress(payment.payerAddress)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {new Date(payment.timestamp).toLocaleTimeString()}
                </p>
                {payment.reference && (
                  <Badge variant="outline" className="text-xs">
                    {payment.reference}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { notificationService };
export default POSTerminal;
