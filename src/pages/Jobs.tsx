import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { JobDetailView } from '@/components/job/JobDetailView';
import { ApprovalWorkflow } from '@/components/approval/ApprovalWorkflow';
import { JobList } from '@/components/job/JobList';
import { JobForm } from '@/components/job/JobForm';
import { EvidenceCapture } from '@/components/evidence/EvidenceCapture';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TrialExpiredBlock } from '@/components/billing/TrialExpiredBlock';
import { useTrialExpiration } from '@/hooks/use-trial-expiration';
import { useAuth } from '@/components/ui/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { Plus, ArrowLeft } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'evidence' | 'detail' | 'approval';

export default function Jobs() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  
  // Trial expiration logic
  const { isExpired, hasActiveAccess, canAccessFeature } = useTrialExpiration();
  const { session, checkSubscription } = useAuth();

  // Check subscription status when Jobs page loads
  useEffect(() => {
    if (session) {
      checkSubscription();
    }
  }, [session, checkSubscription]);

  const handleJobCreated = () => {
    setViewMode('list');
  };

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    setViewMode('detail');
  };

  const handleEvidenceCapture = (jobId: string) => {
    setSelectedJobId(jobId);
    setIsEvidenceModalOpen(true);
  };

  const handleApprovalWorkflow = (jobId: string) => {
    setSelectedJobId(jobId);
    setViewMode('approval');
  };

  const handleEvidenceCaptured = () => {
    setIsEvidenceModalOpen(false);
    setSelectedJobId(null);
  };

  const handleJobChange = () => {
    // This will be called when jobs are updated/deleted
    // The JobList component will handle refreshing its own data
  };

  const handleUpgrade = async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });
      
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
    }
  };

  // Hard cutoff: If trial is expired, show the expired block
  if (isExpired && !hasActiveAccess) {
    return (
      <TrialExpiredBlock 
        onUpgrade={handleUpgrade}
      />
    );
  }

  const renderHeader = () => {
    switch (viewMode) {
      case 'create':
        return (
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        );
      case 'detail':
        return (
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        );
      case 'approval':
        return (
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        );
      default:
        return (
          <div className="flex flex-col space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
                <p className="text-muted-foreground">
                  Manage your jobs and capture evidence
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={() => setViewMode('create')}
                  disabled={!canAccessFeature('create_job')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {canAccessFeature('create_job') ? 'New Job' : 'Trial Expired - Upgrade to Create Jobs'}
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'create':
        return canAccessFeature('create_job') ? (
          <JobForm 
            onSuccess={handleJobCreated}
            onCancel={() => setViewMode('list')}
          />
        ) : (
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Trial Expired</h3>
            <p className="text-muted-foreground mb-4">
              Upgrade to Premium to create new jobs.
            </p>
            <Button onClick={handleUpgrade}>
              Upgrade Now
            </Button>
          </div>
        );
      case 'detail':
        return selectedJobId ? (
          <JobDetailView
            jobId={selectedJobId}
            onBack={() => setViewMode('list')}
          />
        ) : null;
      case 'approval':
        return selectedJobId ? (
          <ApprovalWorkflow
            jobId={selectedJobId}
          />
        ) : null;
      default:
        return (
          <JobList
            onJobSelect={handleJobSelect}
            onEvidenceCapture={handleEvidenceCapture}
            onJobChange={handleJobChange}
          />
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {renderHeader()}
        {renderContent()}
        
        {/* Evidence Capture Modal */}
        {selectedJobId && (
          <EvidenceCapture
            jobId={selectedJobId}
            isOpen={isEvidenceModalOpen}
            onOpenChange={setIsEvidenceModalOpen}
            onSuccess={handleEvidenceCaptured}
            onCancel={() => setIsEvidenceModalOpen(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}