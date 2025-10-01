import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Camera, Upload, MapPin, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { BlockchainVerification } from '@/components/blockchain/BlockchainVerification';
import { SignatureCanvas } from '@/components/signature/SignatureCanvas';
import { PenTool, Trash2 } from 'lucide-react';

const evidenceSchema = z.object({
  evidence_type: z.enum(['before', 'progress', 'after', 'approval']),
  description: z.string().min(1, 'Description is required').max(1000),
  client_approval: z.boolean().default(false),
  client_name: z.string().optional(),
  client_designation: z.string().optional(),
  client_signature: z.string().optional(),
});

const clientInfoSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  client_designation: z.string().min(1, 'Client designation is required'),
  client_signature: z.string().min(1, 'Client signature is required'),
});

type EvidenceFormData = z.infer<typeof evidenceSchema>;

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface EvidenceCaptureProps {
  jobId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EvidenceCapture({ jobId, onSuccess, onCancel, isOpen = true, onOpenChange }: EvidenceCaptureProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [locationPermissionRequested, setLocationPermissionRequested] = useState(false);
  const [clientInfoSaved, setClientInfoSaved] = useState(false);
  const [isSavingClientInfo, setIsSavingClientInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<EvidenceFormData>({
    resolver: zodResolver(evidenceSchema),
    defaultValues: {
      evidence_type: 'progress',
      description: '',
      client_approval: false,
      client_name: '',
      client_designation: '',
      client_signature: '',
    },
  });

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [selectedFile]);

  // Auto-request location when component opens
  useEffect(() => {
    if (isOpen && !locationPermissionRequested) {
      requestLocationAutomatically();
    }
  }, [isOpen]);

  const requestLocationAutomatically = async () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      toast({
        title: 'Location not supported',
        description: 'Your browser does not support location services.',
        variant: 'destructive',
      });
      return;
    }

    setLocationPermissionRequested(true);
    setLocationStatus('loading');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationStatus('success');
        toast({
          title: 'Location captured automatically',
          description: `GPS coordinates recorded with ${Math.round(position.coords.accuracy)}m accuracy.`,
        });
      },
      (error) => {
        console.error('Location error:', error);
        setLocationStatus('error');
        
        // Show permission dialog for location access
        toast({
          title: 'Location permission required',
          description: 'Location access is necessary for evidence protection. Please allow location access.',
          variant: 'destructive',
        });
        
        // Show a more detailed permission request
        setTimeout(() => {
          if (confirm('Location access is required for evidence protection. This helps verify where the work was performed. Would you like to try again?')) {
            requestLocation();
          }
        }, 2000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      toast({
        title: 'Location not supported',
        description: 'Your browser does not support location services.',
        variant: 'destructive',
      });
      return;
    }

    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationStatus('success');
        toast({
          title: 'Location captured',
          description: `GPS coordinates recorded with ${Math.round(position.coords.accuracy)}m accuracy.`,
        });
      },
      (error) => {
        console.error('Location error:', error);
        setLocationStatus('error');
        toast({
          title: 'Location access denied',
          description: 'Please allow location access for better evidence protection.',
          variant: 'destructive',
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 20MB.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (data: EvidenceFormData) => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload as evidence.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create form data for the edge function
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('jobId', jobId);
      formData.append('evidenceType', data.evidence_type);
      formData.append('description', data.description);
      formData.append('clientApproval', data.client_approval.toString());
      
      if (data.client_name) {
        formData.append('clientName', data.client_name);
      }
      
      if (data.client_designation) {
        formData.append('clientDesignation', data.client_designation);
      }
      
      if (data.client_signature) {
        formData.append('clientSignature', data.client_signature);
      }
      
      if (location) {
        formData.append('gpsLatitude', location.latitude.toString());
        formData.append('gpsLongitude', location.longitude.toString());
        formData.append('gpsAccuracy', location.accuracy.toString());
      }

      const { data: result, error } = await supabase.functions.invoke('upload-evidence', {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: 'Evidence captured successfully',
        description: 'Your evidence has been securely stored and blockchain timestamping initiated.',
      });

      handleSuccess();
    } catch (error) {
      console.error('Error uploading evidence:', error);
      toast({
        title: 'Error uploading evidence',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleSuccess = () => {
    form.reset();
    setSelectedFile(null);
    setLocation(null);
    setLocationStatus('idle');
    setLocationPermissionRequested(false);
    setClientInfoSaved(false);
    onSuccess?.();
    handleClose();
  };

  const saveClientInfo = async () => {
    const clientName = form.getValues('client_name');
    const clientDesignation = form.getValues('client_designation');
    const clientSignature = form.getValues('client_signature');
    
    if (!clientName || !clientDesignation || !clientSignature) {
      toast({
        title: 'Missing information',
        description: 'Please fill in client name, designation, and signature.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingClientInfo(true);
    try {
      // Validate client info
      const validatedData = clientInfoSchema.parse({
        client_name: clientName,
        client_designation: clientDesignation,
        client_signature: clientSignature,
      });

      // Here you could save to a separate table or local storage
      // For now, we'll just mark it as saved
      setClientInfoSaved(true);
      
      toast({
        title: 'Client information saved',
        description: 'Client name, designation, and signature have been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving client info:', error);
      toast({
        title: 'Error saving client information',
        description: 'Please check your inputs and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingClientInfo(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Capture Evidence
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* File Upload Section */}
            <div className="space-y-4">
              <div className="text-sm font-medium">Photo/Video Evidence *</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {preview ? (
                <div className="relative">
                  {selectedFile?.type.startsWith('image/') ? (
                    <img 
                      src={preview} 
                      alt="Evidence preview" 
                      className="w-full max-h-64 object-contain rounded-lg border"
                    />
                  ) : (
                    <video 
                      src={preview} 
                      controls 
                      className="w-full max-h-64 rounded-lg border"
                    />
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={triggerFileSelect}
                    className="absolute top-2 right-2"
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={triggerFileSelect}
                  className="w-full h-32 border-dashed"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span>Tap to select photo or video</span>
                    <span className="text-xs text-muted-foreground">Max 20MB</span>
                  </div>
                </Button>
              )}
            </div>

            {/* GPS Location */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">GPS Location</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={requestLocation}
                  disabled={locationStatus === 'loading'}
                >
                  {locationStatus === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <MapPin className="mr-2 h-4 w-4" />
                  Capture Location
                </Button>
              </div>
              
              {locationStatus === 'success' && location && (
                <Badge variant="secondary" className="w-fit">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  GPS captured (±{Math.round(location.accuracy)}m)
                </Badge>
              )}
              
              {locationStatus === 'error' && (
                <Badge variant="destructive" className="w-fit">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Location unavailable
                </Badge>
              )}
            </div>

            {/* Evidence Type */}
            <FormField
              control={form.control}
              name="evidence_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evidence Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select evidence type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="before">Before - Pre-work condition</SelectItem>
                      <SelectItem value="progress">Progress - Work in progress</SelectItem>
                      <SelectItem value="after">After - Completed work</SelectItem>
                      <SelectItem value="approval">Approval - Client sign-off</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what this evidence shows..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Client Approval */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="client_approval"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Client Approval</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Mark if client has approved this work
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('client_approval') && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Client Approval Details</h4>
                    {clientInfoSaved && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Saved
                      </Badge>
                    )}
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="client_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter client's full name" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="client_designation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Designation *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter client's designation/position" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="client_signature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Digital Signature *</FormLabel>
                        <FormControl>
                          <SimpleSignatureCanvas
                            onSignatureChange={field.onChange}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={saveClientInfo}
                      disabled={isSavingClientInfo || !form.getValues('client_name') || !form.getValues('client_designation') || !form.getValues('client_signature')}
                    >
                      {isSavingClientInfo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Save Client Info
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Camera className="mr-2 h-4 w-4" />
                Capture Evidence
              </Button>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Simple Signature Canvas Component (without popup dialog)
interface SimpleSignatureCanvasProps {
  onSignatureChange: (signature: string) => void;
  value?: string;
  disabled?: boolean;
}

function SimpleSignatureCanvas({ onSignatureChange, value, disabled }: SimpleSignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize canvas with proper scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size in CSS pixels
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale the drawing context so everything draws at the correct size
    ctx.scale(dpr, dpr);
    
    // Set drawing properties for better quality
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

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
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange(dataUrl);
    }
  };

  const clearSignature = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
        onSignatureChange('');
      }
    }
  };

  // Load existing signature
  useEffect(() => {
    if (value && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const img = new Image();
      img.onload = () => {
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = value;
    }
  }, [value]);

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-2 bg-white">
        <canvas
          ref={canvasRef}
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

      <div className="flex gap-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={clearSignature} 
          disabled={disabled}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>

      {!disabled && (
        <p className="text-xs text-muted-foreground">
          Draw your signature using mouse or finger. For best results, use a stylus or draw slowly.
        </p>
      )}
    </div>
  );
}