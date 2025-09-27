import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { JobDetailView } from '@/components/job/JobDetailView';
import { ApprovalWorkflow } from '@/components/approval/ApprovalWorkflow';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { GDPRCompliance } from '@/components/gdpr/GDPRCompliance';
import { JobList } from '@/components/job/JobList';
import { JobForm } from '@/components/job/JobForm';
import { EvidenceCapture } from '@/components/evidence/EvidenceCapture';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Plus, ArrowLeft, BarChart3, Shield, FileCheck, Settings } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'evidence' | 'detail' | 'approval' | 'analytics' | 'gdpr';

export default function Jobs() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const handleJobCreated = () => {
    setViewMode('list');
  };

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    setViewMode('detail');
  };

  const handleEvidenceCapture = (jobId: string) => {
    setSelectedJobId(jobId);
    setViewMode('evidence');
  };

  const handleApprovalWorkflow = (jobId: string) => {
    setSelectedJobId(jobId);
    setViewMode('approval');
  };

  const handleEvidenceCaptured = () => {
    setViewMode('list');
    setSelectedJobId(null);
  };

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
      case 'evidence':
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
      case 'analytics':
        return (
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        );
      case 'gdpr':
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">Jobs</h1>
              <p className="text-muted-foreground">
                Manage your jobs and capture evidence
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setViewMode('analytics')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button variant="outline" onClick={() => setViewMode('gdpr')}>
                <Shield className="h-4 w-4 mr-2" />
                Data Protection
              </Button>
              <Button onClick={() => setViewMode('create')}>
                <Plus className="h-4 w-4 mr-2" />
                New Job
              </Button>
            </div>
          </div>
        );
    }
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'create':
        return (
          <JobForm 
            onSuccess={handleJobCreated}
            onCancel={() => setViewMode('list')}
          />
        );
      case 'evidence':
        return selectedJobId ? (
          <EvidenceCapture
            jobId={selectedJobId}
            onSuccess={handleEvidenceCaptured}
            onCancel={() => setViewMode('list')}
          />
        ) : null;
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
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'gdpr':
        return <GDPRCompliance />;
      default:
        return (
          <JobList
            onJobSelect={handleJobSelect}
            onEvidenceCapture={handleEvidenceCapture}
          />
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {renderHeader()}
        {renderContent()}
      </div>
    </DashboardLayout>
  );
}