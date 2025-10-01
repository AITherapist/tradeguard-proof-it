import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { JobForm } from '@/components/job/JobForm';
import { JobDetailView } from '@/components/job/JobDetailView';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  CalendarDays,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Job {
  id: string;
  client_name: string;
  client_address: string;
  job_type: string;
  job_description?: string;
  contract_value?: number;
  start_date?: string;
  completion_date?: string;
  protection_status: number;
  created_at: string;
}

interface RecentJobsCardProps {
  jobs: Job[];
  isLoading: boolean;
  onJobsChange: () => void;
}

export function RecentJobsCard({ jobs, isLoading, onJobsChange }: RecentJobsCardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showJobDetail, setShowJobDetail] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const filteredAndSortedJobs = useMemo(() => {
    let filtered = jobs.filter(job => {
      const matchesSearch = 
        job.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.client_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.job_type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'protected' && job.protection_status >= 75) ||
        (statusFilter === 'partial' && job.protection_status >= 25 && job.protection_status < 75) ||
        (statusFilter === 'unprotected' && job.protection_status < 25);

      const matchesType = 
        typeFilter === 'all' || job.job_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort jobs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'client_name':
          return a.client_name.localeCompare(b.client_name);
        case 'protection_status':
          return b.protection_status - a.protection_status;
        case 'job_type':
          return a.job_type.localeCompare(b.job_type);
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [jobs, searchTerm, statusFilter, typeFilter, sortBy]);

  const getProtectionIcon = (status: number) => {
    if (status >= 75) return <CheckCircle className="h-4 w-4 text-accent" />;
    if (status >= 25) return <Clock className="h-4 w-4 text-warning" />;
    return <AlertTriangle className="h-4 w-4 text-destructive" />;
  };

  const getProtectionBadge = (status: number) => {
    if (status >= 75) return <Badge variant="default" className="bg-accent text-accent-foreground">Protected</Badge>;
    if (status >= 25) return <Badge variant="secondary">Partial</Badge>;
    return <Badge variant="destructive">At Risk</Badge>;
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "Job deleted",
        description: "The job has been successfully deleted.",
      });
      
      onJobsChange();
    } catch (error: any) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    }
    setDeleteJobId(null);
  };

  const handleViewJob = (job: Job) => {
    setSelectedJobId(job.id);
    setShowJobDetail(true);
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setShowEditModal(true);
  };

  const handleJobUpdated = () => {
    setShowEditModal(false);
    setEditingJob(null);
    onJobsChange();
    toast({
      title: 'Job Updated',
      description: 'Job has been updated successfully',
    });
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setEditingJob(null);
  };

  const handleJobDetailClose = () => {
    setShowJobDetail(false);
    setSelectedJobId(null);
  };

  const uniqueJobTypes = [...new Set(jobs.map(job => job.job_type))];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Recent Jobs
              </CardTitle>
              <CardDescription>
                Your latest jobs and their protection status
              </CardDescription>
            </div>
          
          </div>
          
          {/* Search and Filters - Responsive */}
          <div 
            className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem'
            }}
          >
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger 
                className="w-full"
                style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
              >
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="protected">Protected</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unprotected">At Risk</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger 
                className="w-full"
                style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
              >
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueJobTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger 
                className="w-full"
                style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
              >
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="client_name">Client Name</SelectItem>
                <SelectItem value="protection_status">Protection Status</SelectItem>
                <SelectItem value="job_type">Job Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading jobs...</p>
            </div>
          ) : filteredAndSortedJobs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {jobs.length === 0 ? 'No jobs yet' : 'No jobs match your filters'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {jobs.length === 0 
                  ? 'Start protecting your work by creating your first job'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {jobs.length === 0 && (
                <Button onClick={() => navigate('/jobs')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Job
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedJobs.slice(0, 10).map((job) => (
                <div 
                  key={job.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start space-x-3">
                      {getProtectionIcon(job.protection_status)}
                      <div className="flex-1 min-w-0">
                        <h4 
                          className="font-semibold text-foreground truncate"
                          style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}
                        >
                          {job.client_name}
                        </h4>
                        <p 
                          className="text-muted-foreground truncate"
                          style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
                        >
                          {job.job_type.replace('_', ' ')} • {job.client_address}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 space-y-1 sm:space-y-0">
                          <span 
                            className="text-muted-foreground flex items-center gap-1"
                            style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
                          >
                            <CalendarDays className="h-3 w-3" />
                            {new Date(job.created_at).toLocaleDateString()}
                          </span>
                          {job.contract_value && (
                            <span 
                              className="text-muted-foreground"
                              style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
                            >
                              £{job.contract_value.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end space-x-3">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center space-x-2 mb-1">
                        {getProtectionBadge(job.protection_status)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span 
                          className="font-medium"
                          style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
                        >
                          {job.protection_status}%
                        </span>
                        <Progress 
                          value={job.protection_status} 
                          className="w-16 sm:w-20"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewJob(job)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditJob(job)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setDeleteJobId(job.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredAndSortedJobs.length > 10 && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={() => navigate('/jobs')}>
                    View All Jobs ({filteredAndSortedJobs.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteJobId} onOpenChange={() => setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job? This action cannot be undone and will also delete all associated evidence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteJobId && handleDeleteJob(deleteJobId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Job Detail Modal */}
      {selectedJobId && (
        <Dialog open={showJobDetail} onOpenChange={setShowJobDetail}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Job Details</DialogTitle>
            </DialogHeader>
            <JobDetailView 
              jobId={selectedJobId}
              onBack={handleJobDetailClose}
            />
          </DialogContent>
        </Dialog>
      )}

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
    </>
  );
}