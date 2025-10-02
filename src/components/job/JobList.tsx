import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Eye, Camera, MapPin, Calendar, Phone, DollarSign, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { JobForm } from './JobForm';

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
}

interface JobListProps {
  onJobSelect?: (jobId: string) => void;
  onEvidenceCapture?: (jobId: string) => void;
  onJobChange?: () => void;
}

export function JobList({ onJobSelect, onEvidenceCapture, onJobChange }: JobListProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const { toast } = useToast();

  // Memoize fetchJobs to prevent unnecessary re-renders
  const fetchJobs = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    // Prevent fetching if called within 5 seconds unless forced
    if (!forceRefresh && now - lastFetchTime < 5000) {
      return;
    }

    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
      setLastFetchTime(now);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error loading jobs',
        description: 'Failed to load your jobs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [lastFetchTime, toast]);

  // Only fetch once on mount
  useEffect(() => {
    fetchJobs(true);
  }, []); // Empty dependency array - only run once

  const getProtectionStatusColor = (status: number) => {
    if (status >= 80) return 'bg-success';
    if (status >= 50) return 'bg-warning';
    return 'bg-destructive';
  };

  const getProtectionStatusText = (status: number) => {
    if (status >= 80) return 'Well Protected';
    if (status >= 50) return 'Partially Protected';
    return 'Needs Evidence';
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setShowEditModal(true);
  };

  const handleJobUpdated = () => {
    setShowEditModal(false);
    setEditingJob(null);
    fetchJobs(true); // Force refresh the jobs list
    onJobChange?.(); // Notify parent component
    toast({
      title: 'Job Updated',
      description: 'Job has been updated successfully',
    });
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setEditingJob(null);
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-job', {
        body: { jobId },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Remove from local state
      setJobs(prev => prev.filter(job => job.id !== jobId));
      onJobChange?.(); // Notify parent component
      
      toast({
        title: 'Job Deleted',
        description: `Job has been deleted successfully. ${data.evidence_files_cleaned} evidence files cleaned up.`,
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete job. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingJobId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first job to start capturing evidence and protecting your work.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{job.client_name}</CardTitle>
              <Badge className={getProtectionStatusColor(job.protection_status)}>
                {job.protection_status}% {getProtectionStatusText(job.protection_status)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="capitalize">{job.job_type}</span>
              <span>•</span>
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(job.created_at), 'MMM dd, yyyy')}</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span>{job.client_address}</span>
              </div>
              
              {job.client_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{job.client_phone}</span>
                </div>
              )}

              {job.contract_value && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>£{job.contract_value.toLocaleString()}</span>
                </div>
              )}

              {job.job_description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {job.job_description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onJobSelect?.(job.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => onEvidenceCapture?.(job.id)}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEditJob(job)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Job</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this job? This action cannot be undone.
                        All evidence and data associated with this job will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteJob(job.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Job
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Edit Job Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
          </DialogHeader>
          {editingJob && (
            <JobForm 
              jobData={editingJob}
              isEditing={true}
              onSuccess={handleJobUpdated}
              onCancel={handleEditCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}