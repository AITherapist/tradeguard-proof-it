import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { JobForm } from '@/components/job/JobForm';
import { JobList } from '@/components/job/JobList';
import { EvidenceCapture } from '@/components/evidence/EvidenceCapture';
import { Plus, ArrowLeft } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'evidence';

export default function Jobs() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const handleJobCreated = () => {
    setViewMode('list');
  };

  const handleEvidenceCapture = (jobId: string) => {
    setSelectedJobId(jobId);
    setViewMode('evidence');
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
      default:
        return (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Jobs</h1>
              <p className="text-muted-foreground">
                Manage your jobs and capture evidence
              </p>
            </div>
            <Button onClick={() => setViewMode('create')}>
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
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
      default:
        return (
          <JobList
            onEvidenceCapture={handleEvidenceCapture}
          />
        );
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {renderHeader()}
      {renderContent()}
    </div>
  );
}