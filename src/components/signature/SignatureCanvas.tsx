import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PenTool, Save, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SignatureCanvasProps {
  onSignatureChange: (signature: string) => void;
  value?: string;
  disabled?: boolean;
}

export function SignatureCanvas({ onSignatureChange, value, disabled }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientTitle, setClientTitle] = useState('');
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      onSignatureChange(dataUrl);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onSignatureChange('');
      }
    }
  };

  const saveSignature = () => {
    if (!clientName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter the client name',
        variant: 'destructive',
      });
      return;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      const signatureData = {
        signature: dataUrl,
        clientName: clientName.trim(),
        clientTitle: clientTitle.trim(),
        date: signatureDate,
        timestamp: new Date().toISOString(),
      };
      
      onSignatureChange(JSON.stringify(signatureData));
      setShowDialog(false);
      
      toast({
        title: 'Signature Saved',
        description: `Client signature for ${clientName} has been saved`,
      });
    }
  };

  const loadSignature = (signatureData: string) => {
    try {
      const data = JSON.parse(signatureData);
      const canvas = canvasRef.current;
      if (canvas && data.signature) {
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          }
        };
        img.src = data.signature;
        setClientName(data.clientName || '');
        setClientTitle(data.clientTitle || '');
        setSignatureDate(data.date || new Date().toISOString().split('T')[0]);
      }
    } catch (error) {
      // If it's not JSON, treat as legacy signature
      const canvas = canvasRef.current;
      if (canvas && signatureData) {
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          }
        };
        img.src = signatureData;
      }
    }
  };

  React.useEffect(() => {
    if (value) {
      loadSignature(value);
    }
  }, [value]);

  const getSignatureInfo = () => {
    if (!value) return null;
    
    try {
      const data = JSON.parse(value);
      return data;
    } catch (error) {
      return null;
    }
  };

  const signatureInfo = getSignatureInfo();

  return (
    <div className="space-y-4">
      {/* Signature Display */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            Digital Signature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Canvas */}
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-2 bg-white">
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              className="w-full h-32 border border-border rounded cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{ touchAction: 'none' }}
            />
          </div>

          {/* Signature Info */}
          {signatureInfo && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Signed by:</span>
                <span className="text-sm">{signatureInfo.clientName}</span>
              </div>
              {signatureInfo.clientTitle && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Title:</span>
                  <span className="text-sm">{signatureInfo.clientTitle}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Date:</span>
                <span className="text-sm">{signatureInfo.date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Digitally Signed
                </Badge>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={disabled}>
                  <Save className="h-4 w-4 mr-2" />
                  {signatureInfo ? 'Update' : 'Capture'} Signature
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Client Signature Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name *</Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Enter client's full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clientTitle">Title/Position</Label>
                    <Input
                      id="clientTitle"
                      value={clientTitle}
                      onChange={(e) => setClientTitle(e.target.value)}
                      placeholder="e.g., Property Manager, Owner"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signatureDate">Signature Date</Label>
                    <Input
                      id="signatureDate"
                      type="date"
                      value={signatureDate}
                      onChange={(e) => setSignatureDate(e.target.value)}
                    />
                  </div>

                  <Separator />

                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-2">Legal Notice:</p>
                    <p>
                      By providing your digital signature, you acknowledge that this signature has the same legal effect as a handwritten signature and that you are authorized to sign this document.
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveSignature}>
                      Save Signature
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={clearSignature} disabled={disabled}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {!disabled && (
            <p className="text-xs text-muted-foreground">
              Draw your signature using mouse or finger. For best results, use a stylus or draw slowly.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}