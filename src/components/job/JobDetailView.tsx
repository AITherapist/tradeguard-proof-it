import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { EvidenceGallery } from '@/components/evidence/EvidenceGallery';
import { EvidenceBatchUpload } from '@/components/evidence/EvidenceBatchUpload';
import { EvidenceCapture } from '@/components/evidence/EvidenceCapture';
import { 
  Loader2, 
  MapPin, 
  Calendar, 
  Phone, 
  DollarSign, 
  FileText, 
  Shield, 
  Camera, 
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  FileCheck
} from 'lucide-react';
import { format } from 'date-fns';

interface Job {
  id: string;
  client_name: string;
  client_phone: string | null;
  client_address: string;
  job_type: string;
  job_description: string | null;
  contract_value: number | null;
  start_date: string | null;
  completion_date: string | null;
  protection_status: number;
  created_at: string;
  updated_at: string;
}

interface EvidenceStats {
  total: number;
  before: number;
  progress: number;
  after: number;
  approval: number;
  verified: number;
}

interface JobDetailViewProps {
  jobId: string;
  onBack?: () => void;
}

export function JobDetailView({ jobId, onBack }: JobDetailViewProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [evidenceStats, setEvidenceStats] = useState<EvidenceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEvidenceCapture, setShowEvidenceCapture] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobDetails();
    fetchEvidenceStats();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch job details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvidenceStats = async () => {
    try {
      const { data, error } = await supabase
        .from('evidence_items')
        .select('evidence_type, blockchain_timestamp')
        .eq('job_id', jobId);

      if (error) throw error;

      const stats: EvidenceStats = {
        total: data.length,
        before: data.filter(e => e.evidence_type === 'before').length,
        progress: data.filter(e => e.evidence_type === 'progress').length,
        after: data.filter(e => e.evidence_type === 'after').length,
        approval: data.filter(e => e.evidence_type === 'approval').length,
        verified: data.filter(e => e.blockchain_timestamp).length,
      };

      setEvidenceStats(stats);
    } catch (error) {
      console.error('Error fetching evidence stats:', error);
    }
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    try {
      // Call the edge function to generate PDF server-side
      const { data, error } = await supabase.functions.invoke('generate-pdf-report', {
        body: { job_id: jobId }
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
          title: 'Report Generated Successfully',
          description: 'Your PDF report has been generated and downloaded. Redirecting to Reports page...',
        });

        // Small delay to show the success message
        setTimeout(() => {
          navigate('/reports?generated=true');
        }, 1500);
      } else {
        throw new Error('No PDF data received from server');
      }

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getProtectionStatusColor = (status: number) => {
    if (status >= 80) return 'text-green-600';
    if (status >= 60) return 'text-yellow-600';
    if (status >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProtectionStatusIcon = (status: number) => {
    if (status >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status >= 60) return <Clock className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  const getProtectionStatusText = (status: number) => {
    if (status >= 80) return 'Well Protected';
    if (status >= 60) return 'Moderately Protected';
    if (status >= 40) return 'Basic Protection';
    return 'Needs Protection';
  };

  // Handle conditional rendering after all hooks
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading job details...</span>
      </div>
    );
  }

  if (!job) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Job Not Found</h3>
          <p className="text-muted-foreground text-center">
            The requested job could not be found.
          </p>
          {onBack && (
            <Button onClick={onBack} className="mt-4">
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (showEvidenceCapture) {
    return (
      <EvidenceCapture
        jobId={jobId}
        onSuccess={() => {
          setShowEvidenceCapture(false);
          fetchEvidenceStats();
        }}
        onCancel={() => setShowEvidenceCapture(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Job Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{job.client_name}</h1>
          <p className="text-muted-foreground">{job.job_type}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={generateReport} 
            variant="outline" 
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isGeneratingReport ? 'Generating Report...' : 'Generate PDF Report'}
          </Button>
          <Button onClick={() => setShowEvidenceCapture(true)}>
            <Camera className="h-4 w-4 mr-2" />
            Capture Evidence
          </Button>
        </div>
      </div>

      {/* Protection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Protection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getProtectionStatusIcon(job.protection_status)}
                <span className="font-medium">{getProtectionStatusText(job.protection_status)}</span>
              </div>
              <Badge variant="outline" className={getProtectionStatusColor(job.protection_status)}>
                {job.protection_status}% Protected
              </Badge>
            </div>
            <Progress value={job.protection_status} className="h-2" />
            
            {evidenceStats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold">{evidenceStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total Evidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{evidenceStats.before}</div>
                  <div className="text-xs text-muted-foreground">Before</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{evidenceStats.progress}</div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{evidenceStats.after}</div>
                  <div className="text-xs text-muted-foreground">After</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{evidenceStats.approval}</div>
                  <div className="text-xs text-muted-foreground">Approvals</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Job Details and Evidence Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Job Details</TabsTrigger>
          <TabsTrigger value="evidence">Evidence Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client Name</label>
                  <p className="text-sm">{job.client_name}</p>
                </div>

                {job.client_phone && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Phone
                    </label>
                    <p className="text-sm">{job.client_phone}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Address
                  </label>
                  <p className="text-sm">{job.client_address}</p>
                </div>
              </CardContent>
            </Card>

            {/* Job Information */}
            <Card>
              <CardHeader>
                <CardTitle>Job Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Type</label>
                  <Badge variant="outline">{job.job_type}</Badge>
                </div>

                {job.contract_value && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Contract Value
                    </label>
                    <p className="text-sm font-semibold">
                      ${job.contract_value.toLocaleString()}
                    </p>
                  </div>
                )}

                {job.start_date && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Start Date
                    </label>
                    <p className="text-sm">{format(new Date(job.start_date), 'PPP')}</p>
                  </div>
                )}

                {job.completion_date && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Completion Date
                    </label>
                    <p className="text-sm">{format(new Date(job.completion_date), 'PPP')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Job Description */}
          {job.job_description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{job.job_description}</p>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Created:</span>
                <span>{format(new Date(job.created_at), 'PPpp')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Last Updated:</span>
                <span>{format(new Date(job.updated_at), 'PPpp')}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <EvidenceBatchUpload 
              jobId={jobId} 
              onSuccess={fetchEvidenceStats}
            />
            <Button onClick={() => setShowEvidenceCapture(true)} className="flex-1 sm:flex-none">
              <Camera className="h-4 w-4 mr-2" />
              Single Capture
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open(`/jobs/${jobId}/approval`, '_blank')}
              className="flex-1 sm:flex-none"
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Client Approval
            </Button>
          </div>
          <EvidenceGallery jobId={jobId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}