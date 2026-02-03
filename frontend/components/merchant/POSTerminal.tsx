'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  Clock, 
  QrCode, 
  Zap,
  DollarSign,
  RefreshCw,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX 
} from 'lucide-react';

interface Payment {
  amount: string;
  currency: string;
  timestamp: number;
  transactionId: string;
  customerAddress: string;
}

interface POSTerminalProps {
  onGenerateQR?: () => void;
  onPaymentComplete?: (payment: Payment) => void;
  className?: string;
}

type TerminalState = 'idle' | 'waiting' | 'processing' | 'success' | 'error';

export function POSTerminal({ 
  onGenerateQR, 
  onPaymentComplete,
  className = '' 
}: POSTerminalProps) {
  const [state, setState] = useState<TerminalState>('idle');
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-reset timer after successful payment
  useEffect(() => {
    if (state === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (state === 'success' && countdown === 0) {
      resetTerminal();
    }
  }, [state, countdown]);

  // Initialize success sound
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvGMeADWm4/G9diMFl8AXbJWFbM1SfVGHrGZWFjVgoOLs06JVFAo7qtfiZWgfBDhj2+vlbzgOM3a+5t2LQg0YY7Lq56NGEwpJms3r0J9REQxQquPwv2geAjdj2+zoc00MCXPy8caJOQkSXbLt7y8QLmY9oz3h9//78ZlTi9eomI7K3NqlaJ6Enxtv/af/5yeTZLP/7x3MAiO1u8T+k5lDJXej/OMIA6OxsrOjt7m/2Id+ALURLF2Eo6oc5Crt+VH/nxwXGG8YQRrEp9WjctZOQZTJtcSKWumGHCqCKJeSJgpFGCJwrFO2Jn4zZdCqPZS/LcTyZNBQVF76bJ4eSuEI0IwlGJfT8Dxkwus5lJK56XNfrM1h8cOdqhzl8rGt6znEJvYqWwCEOYBAw5NPGFqEWZKzmJJJK3+caodPmt7meDb8+gzuroBt3HjZZa7Gq');
  }, []);

  const playSuccessSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }, [soundEnabled]);

  const handlePaymentReceived = useCallback((payment: Payment) => {
    setState('processing');
    
    // Simulate processing delay
    setTimeout(() => {
      setState('success');
      setCurrentPayment(payment);
      setCountdown(5); // 5 second countdown
      playSuccessSound();
      onPaymentComplete?.(payment);
    }, 1500);
  }, [onPaymentComplete, playSuccessSound]);

  const resetTerminal = useCallback(() => {
    setState('idle');
    setCurrentPayment(null);
    setCountdown(0);
  }, []);

  const handleGenerateQR = useCallback(() => {
    setState('waiting');
    onGenerateQR?.();
  }, [onGenerateQR]);

  // Simulate payment for demo
  const simulatePayment = useCallback(() => {
    const mockPayment: Payment = {
      amount: '25.00',
      currency: 'USDC',
      timestamp: Date.now(),
      transactionId: `tx_${Date.now().toString(36)}`,
      customerAddress: '0x742d35Cc6e7185B4C5432aB4B8D8f3E'
    };
    handlePaymentReceived(mockPayment);
  }, [handlePaymentReceived]);

  const getStateConfig = () => {
    switch (state) {
      case 'idle':
        return {
          icon: Clock,
          iconColor: 'text-muted-foreground',
          title: 'READY',
          subtitle: 'Ready for next payment',
          bgColor: 'bg-secondary/20',
          borderColor: 'border-border/50'
        };
      case 'waiting':
        return {
          icon: QrCode,
          iconColor: 'text-primary animate-pulse',
          title: 'WAITING FOR PAYMENT',
          subtitle: 'Customer scanning QR code...',
          bgColor: 'bg-primary/5',
          borderColor: 'border-primary/30 glow-yellow'
        };
      case 'processing':
        return {
          icon: RefreshCw,
          iconColor: 'text-primary animate-spin',
          title: 'PROCESSING...',
          subtitle: 'Clearing payment via Yellow Network',
          bgColor: 'bg-primary/5',
          borderColor: 'border-primary/30'
        };
      case 'success':
        return {
          icon: CheckCircle2,
          iconColor: 'text-success animate-bounce',
          title: 'PAYMENT RECEIVED',
          subtitle: `${currentPayment?.amount} ${currentPayment?.currency} credited`,
          bgColor: 'bg-success/10',
          borderColor: 'border-success glow-green-intense'
        };
      case 'error':
        return {
          icon: QrCode,
          iconColor: 'text-destructive',
          title: 'PAYMENT FAILED',
          subtitle: 'Please try again',
          bgColor: 'bg-destructive/5',
          borderColor: 'border-destructive/30'
        };
    }
  };

  const config = getStateConfig();
  const Icon = config.icon;

  return (
    <Card className={`relative transition-all duration-500 ${config.bgColor} ${config.borderColor} ${className}`}>
      {/* Connection status indicator */}
      <div className="absolute right-3 top-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
        </Button>
        <div className="flex items-center gap-1">
          {isConnected ? (
            <Wifi className="h-3 w-3 text-success" />
          ) : (
            <WifiOff className="h-3 w-3 text-destructive" />
          )}
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-mono text-sm">
          <Icon className={`h-4 w-4 ${config.iconColor}`} />
          POS_TERMINAL
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Main Status Display */}
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
                state === 'success' ? 'bg-success/20' : 
                state === 'waiting' ? 'bg-primary/20' :
                state === 'processing' ? 'bg-primary/20' : 'bg-secondary/40'
              }`}>
                <Icon className={`h-8 w-8 ${config.iconColor}`} />
              </div>
            </div>
            
            <h3 className="mb-2 font-mono text-lg font-bold text-foreground">
              {config.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {config.subtitle}
            </p>

            {/* Success countdown */}
            {state === 'success' && countdown > 0 && (
              <div className="mt-3">
                <Badge variant="outline" className="border-success/50 text-success">
                  Resetting in {countdown}s
                </Badge>
              </div>
            )}

            {/* Payment amount display */}
            {currentPayment && state === 'success' && (
              <div className="mt-4 rounded-lg border border-success/20 bg-success/5 p-3">
                <div className="flex items-center justify-center gap-2">
                  <DollarSign className="h-5 w-5 text-success" />
                  <span className="font-mono text-2xl font-bold text-success">
                    ${currentPayment.amount}
                  </span>
                  <span className="font-mono text-sm text-success/80">
                    {currentPayment.currency}
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {new Date(currentPayment.timestamp).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {(state === 'idle' || state === 'error') && (
              <Button
                onClick={handleGenerateQR}
                className="w-full gap-2 font-mono"
                size="lg"
              >
                <QrCode className="h-4 w-4" />
                Generate Payment QR
              </Button>
            )}

            {state === 'waiting' && (
              <div className="space-y-2">
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    Show QR code to customer for instant payment
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={simulatePayment}
                  variant="outline"
                  className="w-full gap-2 font-mono text-xs"
                  size="sm"
                >
                  Simulate Payment (Demo)
                </Button>
              </div>
            )}

            {(state === 'success' || state === 'error') && (
              <Button
                onClick={resetTerminal}
                variant="outline"
                className="w-full gap-2 font-mono"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
                New Payment
              </Button>
            )}
          </div>

          {/* Connection Status */}
          {!isConnected && (
            <Alert variant="destructive">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                Disconnected from payment network. Reconnecting...
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}