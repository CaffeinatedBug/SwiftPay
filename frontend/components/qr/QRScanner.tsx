'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Camera, 
  CameraOff, 
  AlertCircle, 
  ScanLine,
  Flashlight,
  FlashlightOff,
  RotateCcw,
  X
} from 'lucide-react';
import { ParsedQRPayment, QRPaymentPayload, QRScannerConfig, DEFAULT_SCANNER_CONFIG } from '@/lib/qr/types';
import { decodePayload, formatPaymentAmount, getChainDisplayName, truncateAddress } from '@/lib/qr/utils';

interface QRScannerProps {
  onScan: (result: ParsedQRPayment) => void;
  onError?: (error: string) => void;
  config?: Partial<QRScannerConfig>;
  className?: string;
}

export function QRScanner({
  onScan,
  onError,
  config = {},
  className,
}: QRScannerProps) {
  const fullConfig = { ...DEFAULT_SCANNER_CONFIG, ...config };
  
  const [isOpen, setIsOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(fullConfig.facingMode);
  const [torchOn, setTorchOn] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  // Request camera permission and start stream
  const startCamera = useCallback(async () => {
    setError(null);
    setIsScanning(true);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        startScanning();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setHasPermission(false);
      setIsScanning(false);
      
      const message = err instanceof Error ? err.message : 'Failed to access camera';
      setError(message);
      if (onError) onError(message);
    }
  }, [facingMode, onError]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  }, []);

  // Scan for QR codes in video frames
  const startScanning = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scan = async () => {
      if (!video.videoWidth || !video.videoHeight) {
        animationRef.current = requestAnimationFrame(scan);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      try {
        // Use BarcodeDetector if available (modern browsers)
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({ 
            formats: ['qr_code'] 
          });
          
          const barcodes = await barcodeDetector.detect(canvas);
          
          if (barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            const result = decodePayload(rawValue);
            
            if (result.valid) {
              stopCamera();
              onScan(result);
              return;
            }
          }
        } else {
          // Fallback: Use jsQR library if needed
          // For now, we'll use a simple approach
          console.log('BarcodeDetector not available, scanning anyway...');
        }
      } catch (err) {
        // Silently continue scanning on detection errors
      }

      animationRef.current = requestAnimationFrame(scan);
    };

    animationRef.current = requestAnimationFrame(scan);
  }, [onScan, stopCamera]);

  // Toggle camera facing mode
  const toggleCamera = useCallback(async () => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, [stopCamera]);

  // Toggle torch/flashlight
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;

    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !torchOn }]
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error('Torch not supported:', err);
    }
  }, [torchOn]);

  // Handle dialog open/close
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setError(null);
    }
  }, [startCamera, stopCamera]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (isOpen && hasPermission) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Camera className="h-4 w-4" />
          Scan QR to Pay
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="relative">
          {/* Camera View */}
          <div className="relative aspect-square bg-black">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Corner markers */}
                <div className="absolute inset-8">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg" />
                </div>

                {/* Scanning line animation */}
                <div className="absolute inset-x-8 top-8 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse" />
              </div>
            )}

            {/* Loading State */}
            {!isScanning && !error && hasPermission === null && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-sm">Requesting camera access...</p>
              </div>
            )}

            {/* Permission Denied */}
            {hasPermission === false && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-6">
                <CameraOff className="h-12 w-12 mb-4 text-red-400" />
                <p className="text-center mb-4">
                  Camera access denied. Please enable camera permissions in your browser settings.
                </p>
                <Button variant="outline" onClick={startCamera}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-6">
                <AlertCircle className="h-12 w-12 mb-4 text-amber-400" />
                <p className="text-center text-sm mb-4">{error}</p>
                <Button variant="outline" onClick={startCamera}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCamera}
                className="text-white hover:bg-white/20"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>

              <div className="text-center">
                <p className="text-white text-sm font-medium">
                  {isScanning ? 'Point camera at QR code' : 'Starting camera...'}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTorch}
                className="text-white hover:bg-white/20"
              >
                {torchOn ? (
                  <Flashlight className="h-5 w-5" />
                ) : (
                  <FlashlightOff className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenChange(false)}
            className="absolute top-2 right-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-card">
          <p className="text-sm text-muted-foreground text-center">
            Scan a SwiftPay QR code to make an instant payment
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Manual QR Code Input (fallback for devices without camera)
 */
interface ManualQRInputProps {
  onSubmit: (result: ParsedQRPayment) => void;
  className?: string;
}

export function ManualQRInput({ onSubmit, className }: ManualQRInputProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    const result = decodePayload(input);
    
    if (!result.valid) {
      setError(result.error || 'Invalid QR code data');
      return;
    }

    onSubmit(result);
    setInput('');
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Enter Payment Code</CardTitle>
        <CardDescription>
          Paste the payment code if you can&apos;t scan the QR
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          className="w-full h-24 p-3 text-sm font-mono border rounded-lg resize-none focus:ring-2 focus:ring-primary"
          placeholder="swiftpay://..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button className="w-full" onClick={handleSubmit} disabled={!input}>
          Verify Payment Code
        </Button>
      </CardContent>
    </Card>
  );
}

export default QRScanner;
