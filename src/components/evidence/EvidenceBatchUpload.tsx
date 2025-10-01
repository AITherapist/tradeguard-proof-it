import { useState, useRef } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Upload, X, CheckCircle, AlertCircle, FileImage, Plus } from 'lucide-react';

const batchUploadSchema = z.object({
  evidence_type: z.enum(['before', 'progress', 'after', 'approval']),
  description: z.string().min(1, 'Description is required').max(1000),
});

type BatchUploadFormData = z.infer<typeof batchUploadSchema>;

interface FileUploadItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface EvidenceBatchUploadProps {
  jobId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EvidenceBatchUpload({ jobId, onSuccess, onCancel }: EvidenceBatchUploadProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<BatchUploadFormData>({
    resolver: zodResolver(batchUploadSchema),
    defaultValues: {
      evidence_type: 'progress',
      description: '',
    },
  });

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileUploadItem[] = [];
    const maxSize = 20 * 1024 * 1024; // 20MB

    Array.from(selectedFiles).forEach((file) => {
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${file.name} is larger than 20MB and will be skipped.`,
          variant: 'destructive',
        });
        return;
      }

      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a supported image or video file.`,
          variant: 'destructive',
        });
        return;
      }

      newFiles.push({
        id: crypto.randomUUID(),
        file,
        status: 'pending',
        progress: 0,
      });
    });

    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFile = async (fileItem: FileUploadItem, formData: BatchUploadFormData): Promise<void> => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
      ));

      // Get GPS location
      let gpsData = null;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          });
        });
        
        gpsData = {
          gps_latitude: position.coords.latitude,
          gps_longitude: position.coords.longitude,
          gps_accuracy: position.coords.accuracy,
        };
      } catch (error) {
        console.log('GPS location not available:', error);
      }

      // Update progress to 30% after GPS
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, progress: 30 } : f
      ));

      // Use the upload-evidence function for automatic blockchain verification
      const formDataForUpload = new FormData();
      formDataForUpload.append('file', fileItem.file);
      formDataForUpload.append('jobId', jobId);
      formDataForUpload.append('evidenceType', formData.evidence_type);
      formDataForUpload.append('description', formData.description);
      
      if (gpsData?.gps_latitude) {
        formDataForUpload.append('gpsLatitude', gpsData.gps_latitude.toString());
      }
      if (gpsData?.gps_longitude) {
        formDataForUpload.append('gpsLongitude', gpsData.gps_longitude.toString());
      }
      if (gpsData?.gps_accuracy) {
        formDataForUpload.append('gpsAccuracy', gpsData.gps_accuracy.toString());
      }

      const { data, error } = await supabase.functions.invoke('upload-evidence', {
        body: formDataForUpload,
      });

      if (error) throw error;

      // Update progress to 100% after successful upload and blockchain verification
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'success' as const, progress: 100 } : f
      ));

    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { 
          ...f, 
          status: 'error' as const, 
          error: error instanceof Error ? error.message : 'Upload failed' 
        } : f
      ));
    }
  };

  const onSubmit = async (data: BatchUploadFormData) => {
    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload files one by one
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.status === 'pending') {
          await uploadFile(file, data);
        }
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      const successCount = files.filter(f => f.status === 'success').length;
      const errorCount = files.filter(f => f.status === 'error').length;

      if (successCount > 0) {
        toast({
          title: 'Upload complete',
          description: `${successCount} files uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}.`,
        });
      }

      if (errorCount === 0) {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Batch upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'An error occurred during batch upload.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const getStatusIcon = (status: FileUploadItem['status']) => {
    switch (status) {
      case 'pending':
        return <FileImage className="h-4 w-4 text-muted-foreground" />;
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: FileUploadItem['status']) => {
    switch (status) {
      case 'pending':
        return 'border-muted';
      case 'uploading':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          Batch Upload Evidence
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Upload Evidence</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="evidence_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evidence Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select evidence type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="before">Before Work</SelectItem>
                        <SelectItem value="progress">Work in Progress</SelectItem>
                        <SelectItem value="after">After Completion</SelectItem>
                        <SelectItem value="approval">Client Approval</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this evidence shows..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Files to Upload</h3>
                <Button type="button" variant="outline" onClick={triggerFileSelect}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Files
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />

              {files.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No files selected</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Select multiple images or videos to upload as evidence
                    </p>
                    <Button type="button" onClick={triggerFileSelect}>
                      Select Files
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {files.map((fileItem) => (
                    <Card key={fileItem.id} className={`border ${getStatusColor(fileItem.status)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(fileItem.status)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {fileItem.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(fileItem.file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                            {fileItem.status === 'uploading' && (
                              <Progress value={fileItem.progress} className="mt-2" />
                            )}
                            {fileItem.error && (
                              <p className="text-xs text-red-600 mt-1">{fileItem.error}</p>
                            )}
                          </div>
                          {!isUploading && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(fileItem.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isUploading || files.length === 0}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload All Files
                  </>
                )}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}