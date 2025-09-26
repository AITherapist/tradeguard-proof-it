import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, Camera, MapPin, Calendar, Phone, DollarSign } from 'lucide-react';
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
}

interface JobListProps {
  onJobSelect?: (jobId: string) => void;
  onEvidenceCapture?: (jobId: string) => void;
}

export function JobList({ onJobSelect, onEvidenceCapture }: JobListProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
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
  };

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

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onJobSelect?.(job.id)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => onEvidenceCapture?.(job.id)}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Evidence
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}