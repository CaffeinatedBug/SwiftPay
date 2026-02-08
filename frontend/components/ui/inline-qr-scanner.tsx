'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle2, AlertCircle, X, ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { decodePayload } from '@/lib/qr/utils';

interface ScannedPaymentData {
  merchantAddress: string;
  merchantName: string;
  amount: number;
  currency: string;
}

interface InlineQRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (data: ScannedPaymentData) => void;
  containerRef?: React.RefObject<HTMLElement | null>;
}

export function InlineQRScanner({ 
  open, 
  onOpenChange, 
  onScanSuccess,
  containerRef 
}: InlineQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleQRDetected = useCallback((data: string) => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setScannedData(data);
    setIsScanning(false);
    setScanError(null);
    
    // Parse the QR data - try swiftpay:// protocol first
    let parsedPayment: ScannedPaymentData | null = null;

    if (data.startsWith('swiftpay://')) {
      const decoded = decodePayload(data);
      if (decoded.valid && decoded.payload) {
        parsedPayment = {
          merchantAddress: decoded.payload.merchantAddress,
          merchantName: decoded.payload.merchantName || 'Merchant',
          amount: parseFloat(decoded.payload.amount),
          currency: decoded.payload.currency || 'USDC',
        };
      } else {
        setScanError(decoded.error || 'Invalid QR code');
        return;
      }
    } else {
      // Fallback: try to parse as JSON
      try {
        const json = JSON.parse(data);
        if (json.merchantAddress && json.amount) {
          parsedPayment = {
            merchantAddress: json.merchantAddress,
            merchantName: json.merchantName || 'Merchant',
            amount: parseFloat(json.amount),
            currency: json.currency || 'USDC',
          };
        }
      } catch {
        // Not JSON - try simple format: merchant:address:amount:value:currency:USDC
        const parts = data.split(':');
        if (parts.length >= 6 && parts[0] === 'merchant') {
          parsedPayment = {
            merchantAddress: parts[1],
            merchantName: 'Merchant',
            amount: parseFloat(parts[3]),
            currency: parts[5] || 'USDC',
          };
        }
      }
    }

    if (!parsedPayment) {
      setScanError('Unrecognized QR code format');
      return;
    }

    // Short delay to show success state, then trigger callback
    setTimeout(() => {
      onScanSuccess(parsedPayment!);
      onOpenChange(false);
    }, 1000);
  }, [onScanSuccess, onOpenChange]);

  const startQRDetection = useCallback(() => {
    if ('BarcodeDetector' in window) {
      const barcodeDetector = new (window as unknown as { BarcodeDetector: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector({
        formats: ['qr_code'],
      });

      scanIntervalRef.current = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const qrData = barcodes[0].rawValue;
              handleQRDetected(qrData);
            }
          } catch (error) {
            console.error('QR detection error:', error);
          }
        }
      }, 100);
    } else {
      // No native BarcodeDetector - show message instead of auto-simulating
      console.warn('BarcodeDetector API not available in this browser. Use Chrome or Edge for QR scanning.');
    }
  }, [handleQRDetected]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        setIsScanning(true);
        
        startQRDetection();
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setHasPermission(false);
    }
  }, [startQRDetection]);

  const resetScanner = useCallback(() => {
    stopCamera();
    setScannedData(null);
    setHasPermission(null);
    setScanError(null);
  }, [stopCamera]);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      resetScanner();
    }
    
    return () => {
      stopCamera();
    };
  }, [open, startCamera, resetScanner, stopCamera]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal container={containerRef?.current}>
        {/* Overlay - scoped to container */}
        <DialogPrimitive.Overlay 
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content 
          className={cn(
            "absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-[90%] max-w-sm rounded-xl border border-border/50 bg-background shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/30 p-4">
            <div className="flex items-center gap-2 font-mono text-sm text-foreground">
              <Camera className="h-4 w-4 text-primary" />
              SCAN_QR_CODE
            </div>
            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <div className="p-4 space-y-4">
            {/* Camera View */}
            <div className="relative aspect-square overflow-hidden rounded-lg border border-border/50 bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />

              {/* Scanning Overlay */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative h-48 w-48">
                    {/* Corner brackets */}
                    <div className="absolute left-0 top-0 h-12 w-12 border-l-4 border-t-4 border-primary rounded-tl-lg" />
                    <div className="absolute right-0 top-0 h-12 w-12 border-r-4 border-t-4 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 h-12 w-12 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 h-12 w-12 border-b-4 border-r-4 border-primary rounded-br-lg" />
                    
                    {/* Scanning line animation */}
                    <div className="absolute left-2 right-2 h-0.5 animate-scan bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_2px_hsl(var(--primary))]" />
                  </div>
                </div>
              )}

              {/* Success State */}
              {scannedData && !scanError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                  <div className="text-center">
                    <CheckCircle2 className="mx-auto mb-3 h-16 w-16 text-success" />
                    <p className="font-mono text-lg font-semibold text-white">QR Detected!</p>
                    <p className="text-sm text-white/70 mt-1">Processing payment...</p>
                  </div>
                </div>
              )}

              {/* Scan Error */}
              {scanError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                  <div className="text-center px-4">
                    <AlertCircle className="mx-auto mb-3 h-16 w-16 text-destructive" />
                    <p className="font-mono text-sm font-semibold text-white mb-2">Invalid QR Code</p>
                    <p className="text-xs text-white/70">{scanError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setScanError(null); setScannedData(null); startCamera(); }}
                      className="mt-3"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              {/* Permission Denied */}
              {hasPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                  <div className="text-center px-4">
                    <AlertCircle className="mx-auto mb-3 h-16 w-16 text-destructive" />
                    <p className="font-mono text-sm font-semibold text-white mb-2">Camera Access Denied</p>
                    <p className="text-xs text-white/70">
                      Please allow camera access in your browser settings
                    </p>
                  </div>
                </div>
              )}

              {/* Loading camera */}
              {hasPermission === null && !scannedData && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <ScanLine className="mx-auto mb-2 h-8 w-8 text-primary animate-pulse" />
                    <p className="font-mono text-xs text-muted-foreground">Starting camera...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-center font-mono text-xs text-muted-foreground">
                {isScanning && 'Point camera at the merchant QR code on the right →'}
                {scannedData && 'QR scanned! Opening payment confirmation...'}
                {hasPermission === false && 'Camera permission required to scan QR codes'}
                {hasPermission === null && !scannedData && 'Initializing scanner...'}
              </p>
            </div>

            {/* Cancel Button */}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full font-mono text-sm"
            >
              Cancel
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
