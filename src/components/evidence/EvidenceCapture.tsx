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
import { Loader2, Camera, Upload, MapPin, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const evidenceSchema = z.object({
  evidence_type: z.enum(['before', 'progress', 'after', 'approval']),
  description: z.string().min(1, 'Description is required').max(1000),
  client_approval: z.boolean().default(false),
  client_signature: z.string().optional(),
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
}

export function EvidenceCapture({ jobId, onSuccess, onCancel }: EvidenceCaptureProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<EvidenceFormData>({
    resolver: zodResolver(evidenceSchema),
    defaultValues: {
      evidence_type: 'progress',
      description: '',
      client_approval: false,
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

      form.reset();
      setSelectedFile(null);
      setLocation(null);
      setLocationStatus('idle');
      onSuccess?.();
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Capture Evidence
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                <FormField
                  control={form.control}
                  name="client_signature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Signature/Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Client name or signature" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Camera className="mr-2 h-4 w-4" />
                Capture Evidence
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}