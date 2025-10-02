import { useState, useEffect } from 'react';
import { useAuth } from '@/components/ui/auth-provider';
import { Navigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FileText, Download, Trash2, Eye, Calendar, User, Shield, AlertCircle, Plus, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Report {
  id: string;
  job_id: string;
  filename: string;
  file_path?: string;
  file_size: number;
  report_type: string;
  status: string;
  metadata: {
    evidence_count: number;
    protection_status: number;
    client_name: string;
    job_type: string;
    generated_at: string;
  };
  created_at: string;
  updated_at: string;
}

interface Job {
  id: string;
  client_name: string;
  job_type: string;
  created_at: string;
  protection_status: number;
}

export default function Reports() {
  const { user, loading, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadReports();
      // Check subscription status when Reports page loads
      checkSubscription();
      
      // Check if user was redirected from report generation
      if (searchParams.get('generated') === 'true') {
        setShowSuccessMessage(true);
        // Clear the URL parameter
        navigate('/reports', { replace: true });
      }
    }
  }, [user, searchParams, navigate, checkSubscription]);

  // Handle conditional rendering after all hooks
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const loadReports = async () => {
    try {
      // Get reports from the reports table
      const { data: reportsData, error: reportsError } = await (supabase as any)
        .from('reports')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      setReports((reportsData as Report[]) || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProtectionStatusText = (status: number) => {
    if (status >= 90) return 'Excellent';
    if (status >= 80) return 'Strong';
    if (status >= 70) return 'Good';
    if (status >= 60) return 'Adequate';
    if (status >= 50) return 'Basic';
    return 'Limited';
  };

  const getProtectionStatusColor = (status: number) => {
    if (status >= 80) return 'bg-green-100 text-green-800';
    if (status >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewReport = (report: Report) => {
    // Navigate to job detail with report view
    navigate(`/jobs?view=detail&jobId=${report.job_id}&showReport=true`);
  };

  const handleDownloadReport = async (report: Report) => {
    try {
      // If report has a file_path, download from storage
      if (report.file_path) {
        // Check if file_path already includes user ID (new format) or just filename (old format)
        const filePath = report.file_path.includes('/') ? report.file_path : `${user?.id}/${report.file_path}`;
        console.log('Downloading from path:', filePath);
        console.log('User ID:', user?.id);
        
        const { data, error } = await supabase.storage
          .from('reports')
          .download(filePath);

        if (error) throw error;

        // Create download link
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = report.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: 'Report Downloaded',
          description: 'The PDF report has been downloaded successfully',
        });
      } else {
        // Fallback: Generate a fresh report for download
        const { data, error } = await supabase.functions.invoke('generate-pdf-report', {
          body: { job_id: report.job_id }
        });

        if (error) throw error;

        if (data.success && data.pdf_bytes) {
          // Convert the PDF bytes array back to Uint8Array
          const pdfBytes = new Uint8Array(data.pdf_bytes);
          
          // Create a blob from the PDF bytes
          const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
          
          // Create a download link
          const url = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = data.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast({
            title: 'Report Downloaded',
            description: 'The PDF report has been downloaded successfully',
          });
        } else {
          throw new Error('No PDF data available for download');
        }
      }
    } catch (error: any) {
      console.error('Error downloading report:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to download report',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      // Delete the report from the reports table
      const { error } = await (supabase as any)
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: 'Report deleted',
        description: 'The report has been successfully deleted.',
      });
      
      loadReports(); // Refresh the reports list
    } catch (error: any) {
      console.error('Error deleting report:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete report',
        variant: 'destructive'
      });
    }
    setDeleteReportId(null);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading reports...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 
            className="font-bold tracking-tight"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}
          >
            Generated Reports
          </h1>
          <p 
            className="text-muted-foreground"
            style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}
          >
            View and manage your professional PDF reports
          </p>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Report Generated Successfully!</h3>
                  <p className="text-sm text-green-800">
                    Your PDF report has been generated and saved. You can now view, download, or delete it from this page.
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSuccessMessage(false)}
                  className="ml-auto text-green-600 hover:text-green-700"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports List */}
        {reports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 
                className="font-semibold mb-2"
                style={{ fontSize: 'clamp(1.125rem, 3vw, 1.25rem)' }}
              >
                No reports generated yet
              </h3>
              <p 
                className="text-muted-foreground mb-6"
                style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}
              >
                Generate your first professional PDF report from the Jobs page
              </p>
              <Button onClick={() => navigate('/jobs')}>
                <Plus className="h-4 w-4 mr-2" />
                Go to Jobs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div 
            className="grid gap-4 sm:gap-6"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
            }}
          >
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle 
                        className="truncate"
                        style={{ fontSize: 'clamp(1rem, 3vw, 1.125rem)' }}
                      >
                        {report.metadata.client_name}
                      </CardTitle>
                      <CardDescription 
                        className="capitalize mt-1"
                        style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
                      >
                        {report.metadata.job_type.replace('_', ' ')}
                      </CardDescription>
                    </div>
                    <Badge className={getProtectionStatusColor(report.metadata.protection_status)}>
                      {getProtectionStatusText(report.metadata.protection_status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Report Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Protection:
                      </span>
                      <span className="font-medium">{report.metadata.protection_status}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Evidence:
                      </span>
                      <span className="font-medium">{report.metadata.evidence_count} items</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Generated:
                      </span>
                      <span>{new Date(report.created_at).toLocaleString('en-GB', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}</span>
                    </div>
                    {report.file_size > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Size:</span>
                        <span>{formatFileSize(report.file_size)}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewReport(report)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => handleDownloadReport(report)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setDeleteReportId(report.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteReportId} onOpenChange={() => setDeleteReportId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Report</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this report? This action cannot be undone.
                The report record will be permanently removed from your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteReportId && handleDeleteReport(deleteReportId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Report
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}