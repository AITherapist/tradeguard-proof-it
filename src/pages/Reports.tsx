import { useState, useEffect } from 'react';
import { useAuth } from '@/components/ui/auth-provider';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Filter, Calendar, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: string;
  client_name: string;
  job_type: string;
  created_at: string;
  protection_status: number;
}

interface ReportRecord {
  id: string;
  job_id: string;
  job: Job;
  title: string;
  status: 'completed' | 'processing' | 'failed';
  created_at: string;
  file_url?: string;
}

export default function Reports() {
  const { user, loading, session } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const { toast } = useToast();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    loadJobs();
    loadReports();
  }, [user]);

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, client_name, job_type, created_at, protection_status')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load jobs',
        variant: 'destructive'
      });
    }
  };

  const loadReports = async () => {
    setIsLoadingReports(true);
    try {
      // For now, we'll create mock reports based on audit logs
      // In a real implementation, you'd have a reports table
      const { data: auditLogs, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          jobs (
            id,
            client_name,
            job_type,
            created_at,
            protection_status
          )
        `)
        .eq('action', 'report_generated')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mockReports: ReportRecord[] = (auditLogs || []).map((log: any) => ({
        id: log.id,
        job_id: log.job_id,
        job: log.jobs,
        title: `${log.jobs?.client_name} - Protection Report`,
        status: 'completed' as const,
        created_at: log.created_at,
      }));

      setReports(mockReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingReports(false);
    }
  };

  const generateReport = async (jobId: string, jobName: string) => {
    if (!session) return;
    
    setIsGenerating(jobId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf-report', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: { job_id: jobId }
      });

      if (error) throw error;

      // Create blob and download
      const byteCharacters = atob(data.pdf_data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bluhatch-Report-${jobName.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Report Generated',
        description: 'PDF report has been downloaded successfully'
      });

      // Refresh reports list
      loadReports();
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate report',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const downloadExistingReport = async (reportId: string, jobName: string) => {
    // For existing reports, we'll regenerate them as PDF
    const report = reports.find(r => r.id === reportId);
    if (report) {
      await generateReport(report.job_id, jobName);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.job?.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || report.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and download PDF reports for your jobs and evidence collection
          </p>
        </div>

        {/* Generate Reports for Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate New Report
            </CardTitle>
            <CardDescription>
              Create PDF reports for your jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{job.client_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {job.job_type.replace('_', ' ')} • {job.protection_status}% protected
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    onClick={() => generateReport(job.id, job.client_name)}
                    disabled={isGenerating === job.id}
                    className="flex items-center gap-2"
                  >
                    {isGenerating === job.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Generate PDF
                  </Button>
                </div>
              ))}
              {jobs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No jobs found. Create a job first to generate reports.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Reports
              </div>
              <Button variant="outline" size="sm" onClick={loadReports} disabled={isLoadingReports}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingReports ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Reports</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by client name or job..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Filter by Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reports</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Reports</CardTitle>
            <CardDescription>
              Your previously generated reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingReports ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading reports...
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium">{report.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Job: {report.job?.job_type?.replace('_', ' ')} • {report.job?.protection_status}% protected
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Generated on {new Date(report.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                        {report.status === 'completed' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => downloadExistingReport(report.id, report.job?.client_name || 'Report')}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download PDF
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredReports.length === 0 && !isLoadingReports && (
                  <p className="text-center text-muted-foreground py-8">
                    No reports found. Generate your first report above.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}