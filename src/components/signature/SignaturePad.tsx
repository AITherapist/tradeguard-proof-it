import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PenTool, Eraser, Save, X } from 'lucide-react';

interface SignaturePadProps {
  onSignatureComplete?: (signatureData: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  existingSignature?: string;
}

export interface SignaturePadRef {
  clear: () => void;
  getSignature: () => string;
  isEmpty: () => boolean;
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  ({ onSignatureComplete, onCancel, disabled = false, existingSignature }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [clientName, setClientName] = useState('');
    const [clientTitle, setClientTitle] = useState('');
    const [showNameDialog, setShowNameDialog] = useState(false);
    const [currentPath, setCurrentPath] = useState<Array<{x: number, y: number}>>([]);

    useImperativeHandle(ref, () => ({
      clear: clearSignature,
      getSignature: () => {
        const canvas = canvasRef.current;
        if (!canvas) return '';
        return canvas.toDataURL();
      },
      isEmpty: () => {
        const canvas = canvasRef.current;
        if (!canvas) return true;
        const ctx = canvas.getContext('2d');
        if (!ctx) return true;
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return imageData.data.every(pixel => pixel === 0);
      }
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const initializeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Set canvas size only if not already set or if size has changed significantly
        const currentWidth = canvas.width / dpr;
        const currentHeight = canvas.height / dpr;
        
        if (Math.abs(currentWidth - rect.width) > 1 || Math.abs(currentHeight - rect.height) > 1) {
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          ctx.scale(dpr, dpr);
          
          // Set drawing properties
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // Fill with white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, rect.width, rect.height);
        }
      };

      // Initialize canvas
      initializeCanvas();

      // Load existing signature if provided (only once)
      if (existingSignature && !canvas.dataset.loaded) {
        const img = new Image();
        img.onload = () => {
          const rect = canvas.getBoundingClientRect();
          ctx.clearRect(0, 0, rect.width, rect.height);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, rect.width, rect.height);
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          canvas.dataset.loaded = 'true';
        };
        img.src = existingSignature;
      }

      // Handle window resize
      const handleResize = () => {
        initializeCanvas();
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [existingSignature]);

    const getEventPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      
      e.preventDefault();
      setIsDrawing(true);
      const pos = getEventPos(e);
      setCurrentPath([pos]);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || disabled) return;
      
      e.preventDefault();
      const pos = getEventPos(e);
      setCurrentPath(prev => [...prev, pos]);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      if (!isDrawing) return;
      setIsDrawing(false);
      setCurrentPath([]);
    };

    const clearSignature = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      
      // Reset the loaded flag so existing signature can be loaded again if needed
      canvas.dataset.loaded = '';
    };

    const handleSave = () => {
      if (!clientName.trim()) {
        setShowNameDialog(true);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      // Check if canvas is empty
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const isEmpty = imageData.data.every((pixel, index) => {
        // Check if it's an alpha channel (every 4th value) or if it's white
        return index % 4 === 3 ? pixel === 255 : pixel === 255;
      });

      if (isEmpty) {
        alert('Please provide a signature before saving.');
        return;
      }

      const signatureData = JSON.stringify({
        signature: canvas.toDataURL(),
        clientName: clientName.trim(),
        clientTitle: clientTitle.trim(),
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString()
      });

      onSignatureComplete?.(signatureData);
      setShowNameDialog(false);
    };

    const handleDialogSave = () => {
      setShowNameDialog(false);
      handleSave();
    };

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Client Signature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Canvas */}
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 bg-background">
            <canvas
              ref={canvasRef}
              className="w-full h-40 border border-border rounded cursor-crosshair touch-none"
              style={{ touchAction: 'none' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          {/* Instructions */}
          <p className="text-sm text-muted-foreground text-center">
            {disabled 
              ? 'Signature pad is disabled'
              : 'Draw your signature above using mouse or touch'
            }
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={clearSignature}
              disabled={disabled}
              className="flex-1"
            >
              <Eraser className="h-4 w-4 mr-2" />
              Clear
            </Button>
            
            <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setShowNameDialog(true)}
                  disabled={disabled}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Signature
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Client Information</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="clientName">Client Name *</Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Enter client's full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientTitle">Client Title</Label>
                    <Input
                      id="clientTitle"
                      value={clientTitle}
                      onChange={(e) => setClientTitle(e.target.value)}
                      placeholder="e.g., Homeowner, Property Manager"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleDialogSave} className="flex-1">
                      Save Signature
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowNameDialog(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

SignaturePad.displayName = 'SignaturePad';