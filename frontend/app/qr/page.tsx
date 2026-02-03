'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  QrCode, 
  Camera, 
  Store, 
  User,
  Zap,
  CheckCircle2,
  ArrowRight,
  Wallet,
  Info
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  QRGenerator,
  QRScanner,
  PaymentConfirmation,
  POSTerminal,
  RecentPayments,
  usePaymentNotifications,
  notificationService,
} from '@/components/qr';
import { 
  QRPaymentPayload, 
  QRPaymentTransaction, 
  ParsedQRPayment,
  MerchantNotification,
} from '@/lib/qr/types';
import { truncateAddress, formatPaymentAmount } from '@/lib/qr/utils';

export default function QRPaymentPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'merchant' | 'customer'>('merchant');
  
  // Merchant state
  const [currentPayload, setCurrentPayload] = useState<QRPaymentPayload | null>(null);
  const { notifications } = usePaymentNotifications(address);
  
  // Customer state
  const [scannedPayment, setScannedPayment] = useState<QRPaymentPayload | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [completedTransactions, setCompletedTransactions] = useState<QRPaymentTransaction[]>([]);

  // Handle QR code generation
  const handlePaymentCreated = useCallback((payload: QRPaymentPayload) => {
    setCurrentPayload(payload);
  }, []);

  // Handle QR scan result
  const handleScanResult = useCallback((result: ParsedQRPayment) => {
    if (result.valid && result.payload) {
      setScannedPayment(result.payload);
      setShowConfirmation(true);
    }
  }, []);

  // Handle payment completion
  const handlePaymentComplete = useCallback((transaction: QRPaymentTransaction) => {
    setCompletedTransactions(prev => [transaction, ...prev]);
    setShowConfirmation(false);
    setScannedPayment(null);

    // Notify the merchant (simulate WebSocket message)
    if (transaction.payload.merchantAddress) {
      const notification: MerchantNotification = {
        type: 'payment_received',
        paymentId: transaction.payload.paymentId,
        merchantAddress: transaction.payload.merchantAddress,
        amount: transaction.amountPaid,
        currency: transaction.selectedToken,
        payerAddress: transaction.payerAddress,
        timestamp: Date.now(),
        status: 'completed',
        reference: transaction.payload.reference,
      };
      notificationService.simulatePayment(notification);
    }
  }, []);

  // Handle payment failure
  const handlePaymentFailed = useCallback((error: string) => {
    console.error('Payment failed:', error);
  }, []);

  // Reset POS terminal
  const handlePOSReset = useCallback(() => {
    setCurrentPayload(null);
  }, []);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <QrCode className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">QR Payments</h1>
              <p className="text-zinc-400 max-w-md">
                Experience instant payments with SwiftPay QR codes. 
                Connect your wallet to get started.
              </p>
            </div>
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <QrCode className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">QR Payments</h1>
              <p className="text-zinc-400">Phase 4 - Instant Payment Flow</p>
            </div>
          </div>
          <ConnectButton />
        </div>

        {/* Info Banner */}
        <Alert className="mb-6 bg-zinc-800/50 border-zinc-700">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-zinc-300">
            <strong>Phase 4 Demo:</strong> Test the complete QR payment flow. 
            Switch between Merchant and Customer tabs to experience both sides of the payment.
          </AlertDescription>
        </Alert>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'merchant' | 'customer')}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="merchant" className="gap-2">
              <Store className="h-4 w-4" />
              Merchant
            </TabsTrigger>
            <TabsTrigger value="customer" className="gap-2">
              <User className="h-4 w-4" />
              Customer
            </TabsTrigger>
          </TabsList>

          {/* Merchant Tab */}
          <TabsContent value="merchant">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column - QR Generator & POS */}
              <div className="space-y-6">
                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <QrCode className="h-5 w-5" />
                      Generate Payment QR
                    </CardTitle>
                    <CardDescription>
                      Create a QR code for customers to scan and pay
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center gap-4">
                      <QRGenerator 
                        merchantName="SwiftPay Demo Store"
                        onPaymentCreated={handlePaymentCreated}
                      />
                      {currentPayload && (
                        <div className="text-center space-y-2">
                          <Badge variant="secondary" className="gap-1">
                            <Zap className="h-3 w-3" />
                            QR Generated
                          </Badge>
                          <p className="text-sm text-zinc-400">
                            Payment ID: {currentPayload.paymentId}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* POS Terminal */}
                <POSTerminal 
                  currentPayload={currentPayload}
                  onReset={handlePOSReset}
                  className="bg-zinc-800/50 border-zinc-700"
                />
              </div>

              {/* Right Column - Recent Payments */}
              <RecentPayments 
                payments={notifications}
                className="bg-zinc-800/50 border-zinc-700 text-white"
              />
            </div>
          </TabsContent>

          {/* Customer Tab */}
          <TabsContent value="customer">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column - Scanner */}
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Scan to Pay
                  </CardTitle>
                  <CardDescription>
                    Scan a merchant&apos;s QR code to make an instant payment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <QRScanner onScan={handleScanResult} />
                    
                    <Separator className="my-4" />
                    
                    <div className="text-center space-y-2">
                      <p className="text-sm text-zinc-400">
                        Point your camera at a SwiftPay QR code
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                        <Wallet className="h-3 w-3" />
                        <span>Connected: {truncateAddress(address || '')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Demo: Manual payment trigger */}
                  {currentPayload && (
                    <div className="p-4 bg-zinc-900/50 rounded-lg space-y-3">
                      <p className="text-sm text-zinc-400 font-medium">
                        Demo: Pay for generated QR
                      </p>
                      <Button 
                        className="w-full gap-2"
                        onClick={() => {
                          setScannedPayment(currentPayload);
                          setShowConfirmation(true);
                        }}
                      >
                        <ArrowRight className="h-4 w-4" />
                        Pay {formatPaymentAmount(currentPayload.amount, currentPayload.currency)}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right Column - Payment History */}
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Your Payments
                  </CardTitle>
                  <CardDescription>
                    Payments you&apos;ve made in this session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {completedTransactions.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                      <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No payments yet</p>
                      <p className="text-sm mt-1">Scan a QR code to make your first payment</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {completedTransactions.map((tx) => (
                        <div 
                          key={tx.id}
                          className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {formatPaymentAmount(tx.amountPaid, tx.selectedToken)}
                              </p>
                              <p className="text-sm text-zinc-400">
                                To: {tx.payload.merchantName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                              Completed
                            </Badge>
                            <p className="text-xs text-zinc-500 mt-1">
                              {new Date(tx.completedAt || tx.initiatedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Payment Confirmation Dialog */}
        {scannedPayment && (
          <PaymentConfirmation
            payload={scannedPayment}
            isOpen={showConfirmation}
            onClose={() => {
              setShowConfirmation(false);
              setScannedPayment(null);
            }}
            onPaymentComplete={handlePaymentComplete}
            onPaymentFailed={handlePaymentFailed}
          />
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-zinc-500 text-sm">
          <p>SwiftPay Phase 4 • QR Code Payment Flow</p>
          <p className="mt-1">Powered by Yellow Network State Channels</p>
        </div>
      </div>
    </div>
  );
}
