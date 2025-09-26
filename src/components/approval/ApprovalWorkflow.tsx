import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SignatureCanvas } from '@/components/signature/SignatureCanvas';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  MessageSquare, 
  Shield, 
  Send,
  Download,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface Job {
  id: string;
  client_name: string;
  client_phone: string | null;
  job_type: string;
  protection_status: number;
}

interface EvidenceItem {
  id: string;
  evidence_type: string;
  description: string;
  file_path: string | null;
  blockchain_timestamp: string | null;
  client_approval: boolean | null;
  client_signature: string | null;
  created_at: string;
}

interface ApprovalWorkflowProps {
  jobId: string;
}

export function ApprovalWorkflow({ jobId }: ApprovalWorkflowProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [approvalComments, setApprovalComments] = useState('');
  const [clientSignature, setClientSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workflowStep, setWorkflowStep] = useState<'review' | 'approve' | 'complete'>('review');
  const { toast } = useToast();

  useEffect(() => {
    fetchJobAndEvidence();
  }, [jobId]);

  const fetchJobAndEvidence = async () => {
    try {
      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('id, client_name, client_phone, job_type, protection_status')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Fetch evidence items
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence_items')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (evidenceError) throw evidenceError;
      setEvidence(evidenceData || []);

      // Determine workflow step based on evidence state
      const hasApprovals = evidenceData?.some(e => e.client_approval === true);
      const hasSignatures = evidenceData?.some(e => e.client_signature);
      
      if (hasSignatures) {
        setWorkflowStep('complete');
      } else if (hasApprovals) {
        setWorkflowStep('approve');
      } else {
        setWorkflowStep('review');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch job data',
        variant: 'destructive',
      });
    }
  };

  const submitApproval = async () => {
    if (!clientSignature) {
      toast({
        title: 'Signature Required',
        description: 'Please provide a client signature to complete the approval',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create approval evidence item
      const approvalData = {
        job_id: jobId,
        evidence_type: 'approval' as const,
        description: approvalComments || 'Client approval and final sign-off',
        client_approval: true,
        client_signature: clientSignature,
        device_timestamp: new Date().toISOString(),
      };

      const { error: evidenceError } = await supabase
        .from('evidence_items')
        .insert(approvalData);

      if (evidenceError) throw evidenceError;

      // Create audit log entry
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          job_id: jobId,
          action: 'client_approval_completed',
          details: {
            approval_type: 'final_signoff',
            has_signature: true,
            comments: approvalComments,
            timestamp: new Date().toISOString()
          }
        });

      if (auditError) console.error('Audit log error:', auditError);

      toast({
        title: 'Approval Complete',
        description: 'Client approval has been recorded successfully',
      });

      // Refresh data and update workflow step
      await fetchJobAndEvidence();

    } catch (error) {
      console.error('Error submitting approval:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit approval',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateComplianceReport = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { job_id: jobId, report_type: 'compliance' }
      });

      if (error) throw error;

      // Download the report
      const blob = new Blob([data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${job?.client_name.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Report Generated',
        description: 'Compliance report has been downloaded',
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate compliance report',
        variant: 'destructive',
      });
    }
  };

  const getStepStatus = (step: string) => {
    switch (step) {
      case 'review':
        return workflowStep === 'review' ? 'current' : workflowStep === 'approve' || workflowStep === 'complete' ? 'completed' : 'pending';
      case 'approve':
        return workflowStep === 'approve' ? 'current' : workflowStep === 'complete' ? 'completed' : 'pending';
      case 'complete':
        return workflowStep === 'complete' ? 'completed' : 'pending';
      default:
        return 'pending';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'current':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const evidenceStats = {
    total: evidence.length,
    approved: evidence.filter(e => e.client_approval === true).length,
    verified: evidence.filter(e => e.blockchain_timestamp).length,
    signed: evidence.filter(e => e.client_signature).length,
  };

  const completionPercentage = job ? Math.min(100, (evidenceStats.approved / Math.max(1, evidenceStats.total)) * 100) : 0;

  if (!job) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p>Loading approval workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workflow Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Client Approval Workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Client</Label>
              <p className="text-sm">{job.client_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Job Type</Label>
              <Badge variant="outline">{job.job_type}</Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">Protection Status</Label>
              <div className="flex items-center gap-2">
                <Progress value={job.protection_status} className="flex-1" />
                <span className="text-sm font-medium">{job.protection_status}%</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Workflow Steps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Approval Process</h3>
            
            <div className="space-y-3">
              {/* Step 1: Review Evidence */}
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                {getStepIcon(getStepStatus('review'))}
                <div className="flex-1">
                  <h4 className="font-medium">1. Evidence Review</h4>
                  <p className="text-sm text-muted-foreground">
                    Review all captured evidence and documentation
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={getStepStatus('review') === 'completed' ? 'default' : 'outline'}>
                    {evidenceStats.total} items
                  </Badge>
                </div>
              </div>

              {/* Step 2: Client Approval */}
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                {getStepIcon(getStepStatus('approve'))}
                <div className="flex-1">
                  <h4 className="font-medium">2. Client Approval</h4>
                  <p className="text-sm text-muted-foreground">
                    Obtain client approval for work completed
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={getStepStatus('approve') === 'completed' ? 'default' : 'outline'}>
                    {evidenceStats.approved} approved
                  </Badge>
                </div>
              </div>

              {/* Step 3: Final Sign-off */}
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                {getStepIcon(getStepStatus('complete'))}
                <div className="flex-1">
                  <h4 className="font-medium">3. Final Sign-off</h4>
                  <p className="text-sm text-muted-foreground">
                    Complete with client signature and documentation
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={getStepStatus('complete') === 'completed' ? 'default' : 'outline'}>
                    {evidenceStats.signed} signed
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Completion</span>
              <span className="text-sm font-medium">{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} />
            <p className="text-xs text-muted-foreground mt-2">
              {evidenceStats.approved} of {evidenceStats.total} evidence items approved
              {evidenceStats.verified > 0 && ` • ${evidenceStats.verified} blockchain verified`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Actions */}
      {workflowStep === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Evidence Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Review all evidence items before proceeding to client approval. Ensure all work is documented properly.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{evidence.filter(e => e.evidence_type === 'before').length}</div>
                  <div className="text-xs text-muted-foreground">Before</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{evidence.filter(e => e.evidence_type === 'progress').length}</div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{evidence.filter(e => e.evidence_type === 'after').length}</div>
                  <div className="text-xs text-muted-foreground">After</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{evidenceStats.verified}</div>
                  <div className="text-xs text-muted-foreground">Verified</div>
                </div>
              </div>

              <Button 
                onClick={() => setWorkflowStep('approve')} 
                className="w-full"
                disabled={evidenceStats.total === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Proceed to Client Approval
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {workflowStep === 'approve' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Client Approval & Sign-off
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="approvalComments">Approval Comments</Label>
                <Textarea
                  id="approvalComments"
                  placeholder="Add any final comments or notes about the completed work..."
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows={4}
                />
              </div>

              <SignatureCanvas
                onSignatureChange={setClientSignature}
                value={clientSignature}
              />

              <div className="flex gap-3">
                <Button 
                  onClick={submitApproval}
                  disabled={isSubmitting || !clientSignature}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Final Approval
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setWorkflowStep('review')}
                >
                  Back to Review
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {workflowStep === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Approval Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Job Approved & Signed</span>
              </div>
              <p className="text-sm text-green-700">
                This job has been completed and approved by the client. All evidence has been captured and the legal documentation is ready.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={generateComplianceReport} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Compliance Report
              </Button>
              <Button onClick={() => setWorkflowStep('review')} variant="outline" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Review Evidence
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}