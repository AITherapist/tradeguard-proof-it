import { useState } from 'react';
import { useAuth } from '@/components/ui/auth-provider';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, FileText, Video, Image } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { EvidenceCapture } from '@/components/evidence/EvidenceCapture';
import { CameraCapture } from '@/components/camera/CameraCapture';

export default function Evidence() {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  const [showCapture, setShowCapture] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleCameraCapture = (file: File) => {
    console.log('Captured file:', file);
    // Here you would typically upload the file to Supabase
    setShowCamera(false);
  };

  if (showCapture) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <EvidenceCapture 
            jobId="demo-job" 
            onSuccess={() => setShowCapture(false)}
            onCancel={() => setShowCapture(false)}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (showCamera) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <CameraCapture 
            onCapture={handleCameraCapture}
            onCancel={() => setShowCamera(false)}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Evidence Management</h1>
          <p className="text-muted-foreground">
            Capture, upload, and manage evidence files with blockchain verification
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isMobile && (
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowCamera(true)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Camera Capture
                </CardTitle>
                <CardDescription>
                  Take photos or videos directly from your camera
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload Files
              </CardTitle>
              <CardDescription>
                Upload photos, videos, or documents from your device
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Evidence Gallery */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Evidence</CardTitle>
            <CardDescription>
              Your latest evidence uploads and captures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Sample evidence items */}
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    <span className="text-sm font-medium">Photo_001.jpg</span>
                  </div>
                  <Badge variant="secondary">Verified</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Uploaded 2 hours ago</p>
              </div>
              
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    <span className="text-sm font-medium">Video_001.mp4</span>
                  </div>
                  <Badge variant="secondary">Verified</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Uploaded 5 hours ago</p>
              </div>
              
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">Document.pdf</span>
                  </div>
                  <Badge variant="secondary">Verified</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Uploaded 1 day ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}