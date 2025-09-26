import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Clock, 
  Users, 
  FileText, 
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface AnalyticsData {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalProtectionScore: number;
  totalEvidence: number;
  verifiedEvidence: number;
  totalValue: number;
  monthlyJobs: number;
  weeklyEvidence: number;
  approvalRate: number;
}

interface JobMetrics {
  id: string;
  client_name: string;
  job_type: string;
  protection_status: number;
  contract_value: number | null;
  evidence_count: number;
  verification_rate: number;
  created_at: string;
  completion_date: string | null;
}

interface EvidenceMetrics {
  date: string;
  count: number;
  verified: number;
  types: {
    before: number;
    progress: number;
    after: number;
    approval: number;
  };
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [jobMetrics, setJobMetrics] = useState<JobMetrics[]>([]);
  const [evidenceMetrics, setEvidenceMetrics] = useState<EvidenceMetrics[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate date range
      const endDate = new Date();
      const startDate = subDays(endDate, timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90);

      // Fetch jobs data
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id);

      if (jobsError) throw jobsError;

      // Fetch evidence data
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence_items')
        .select(`
          *,
          jobs!inner(user_id)
        `)
        .eq('jobs.user_id', user.id);

      if (evidenceError) throw evidenceError;

      // Process analytics data
      const totalJobs = jobsData.length;
      const activeJobs = jobsData.filter(job => !job.completion_date).length;
      const completedJobs = jobsData.filter(job => job.completion_date).length;
      const totalProtectionScore = Math.round(
        jobsData.reduce((sum, job) => sum + (job.protection_status || 0), 0) / Math.max(1, totalJobs)
      );
      const totalEvidence = evidenceData.length;
      const verifiedEvidence = evidenceData.filter(e => e.blockchain_timestamp).length;
      const totalValue = jobsData.reduce((sum, job) => sum + (job.contract_value || 0), 0);
      
      // Monthly jobs
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      const monthlyJobs = jobsData.filter(job => 
        isWithinInterval(new Date(job.created_at), { start: monthStart, end: monthEnd })
      ).length;

      // Weekly evidence
      const weekStart = subDays(new Date(), 7);
      const weeklyEvidence = evidenceData.filter(e => 
        new Date(e.created_at) >= weekStart
      ).length;

      // Approval rate
      const approvalEvidence = evidenceData.filter(e => e.evidence_type === 'approval').length;
      const approvalRate = totalJobs > 0 ? (approvalEvidence / totalJobs) * 100 : 0;

      setAnalytics({
        totalJobs,
        activeJobs,
        completedJobs,
        totalProtectionScore,
        totalEvidence,
        verifiedEvidence,
        totalValue,
        monthlyJobs,
        weeklyEvidence,
        approvalRate
      });

      // Process job metrics
      const jobMetricsData: JobMetrics[] = jobsData.map(job => {
        const jobEvidence = evidenceData.filter(e => e.job_id === job.id);
        const verifiedCount = jobEvidence.filter(e => e.blockchain_timestamp).length;
        
        return {
          id: job.id,
          client_name: job.client_name,
          job_type: job.job_type,
          protection_status: job.protection_status || 0,
          contract_value: job.contract_value,
          evidence_count: jobEvidence.length,
          verification_rate: jobEvidence.length > 0 ? (verifiedCount / jobEvidence.length) * 100 : 0,
          created_at: job.created_at,
          completion_date: job.completion_date
        };
      }).sort((a, b) => b.protection_status - a.protection_status);

      setJobMetrics(jobMetricsData);

      // Process evidence metrics by date
      const evidenceByDate = new Map<string, any>();
      
      for (let i = 0; i < (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90); i++) {
        const date = format(subDays(endDate, i), 'yyyy-MM-dd');
        evidenceByDate.set(date, {
          date,
          count: 0,
          verified: 0,
          types: { before: 0, progress: 0, after: 0, approval: 0 }
        });
      }

      evidenceData.forEach(evidence => {
        const dateKey = format(new Date(evidence.created_at), 'yyyy-MM-dd');
        const entry = evidenceByDate.get(dateKey);
        
        if (entry) {
          entry.count++;
          if (evidence.blockchain_timestamp) entry.verified++;
          if (entry.types[evidence.evidence_type as keyof typeof entry.types] !== undefined) {
            entry.types[evidence.evidence_type as keyof typeof entry.types]++;
          }
        }
      });

      setEvidenceMetrics(Array.from(evidenceByDate.values()).reverse());

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProtectionColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProtectionBadge = (score: number) => {
    if (score >= 80) return { text: 'Excellent', variant: 'default' as const };
    if (score >= 60) return { text: 'Good', variant: 'secondary' as const };
    if (score >= 40) return { text: 'Fair', variant: 'outline' as const };
    return { text: 'Needs Work', variant: 'destructive' as const };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p>Unable to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your jobs, evidence, and protection metrics
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{analytics.totalJobs}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.activeJobs} active, {analytics.completedJobs} completed
                </p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Protection</p>
                <p className={`text-2xl font-bold ${getProtectionColor(analytics.totalProtectionScore)}`}>
                  {analytics.totalProtectionScore}%
                </p>
                <Badge variant={getProtectionBadge(analytics.totalProtectionScore).variant} className="text-xs">
                  {getProtectionBadge(analytics.totalProtectionScore).text}
                </Badge>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Evidence Items</p>
                <p className="text-2xl font-bold">{analytics.totalEvidence}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.verifiedEvidence} verified ({Math.round((analytics.verifiedEvidence / Math.max(1, analytics.totalEvidence)) * 100)}%)
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${analytics.totalValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  Avg: ${Math.round(analytics.totalValue / Math.max(1, analytics.totalJobs)).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Job Performance</TabsTrigger>
          <TabsTrigger value="evidence">Evidence Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">New jobs this month</span>
                    </div>
                    <Badge variant="outline">{analytics.monthlyJobs}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Evidence captured this week</span>
                    </div>
                    <Badge variant="outline">{analytics.weeklyEvidence}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Client approval rate</span>
                    </div>
                    <Badge variant="outline">{Math.round(analytics.approvalRate)}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Protection Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Protection Score Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Excellent (80-100%)', min: 80, max: 100, color: 'bg-green-500' },
                    { label: 'Good (60-79%)', min: 60, max: 79, color: 'bg-yellow-500' },
                    { label: 'Fair (40-59%)', min: 40, max: 59, color: 'bg-orange-500' },
                    { label: 'Poor (0-39%)', min: 0, max: 39, color: 'bg-red-500' },
                  ].map((range) => {
                    const count = jobMetrics.filter(job => 
                      job.protection_status >= range.min && job.protection_status <= range.max
                    ).length;
                    const percentage = analytics.totalJobs > 0 ? (count / analytics.totalJobs) * 100 : 0;
                    
                    return (
                      <div key={range.label} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{range.label}</span>
                          <span>{count} jobs ({Math.round(percentage)}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${range.color}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobMetrics.slice(0, 10).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{job.client_name}</h4>
                      <p className="text-sm text-muted-foreground">{job.job_type}</p>
                      {job.contract_value && (
                        <p className="text-sm font-medium">${job.contract_value.toLocaleString()}</p>
                      )}
                    </div>
                    
                    <div className="text-right space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Protection:</span>
                        <Badge variant={getProtectionBadge(job.protection_status).variant}>
                          {job.protection_status}%
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {job.evidence_count} evidence • {Math.round(job.verification_rate)}% verified
                      </div>
                      {job.completion_date ? (
                        <Badge variant="outline" className="text-green-600">Completed</Badge>
                      ) : (
                        <Badge variant="outline" className="text-blue-600">Active</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evidence Capture Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evidenceMetrics.slice(-7).map((metric) => (
                  <div key={metric.date} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {format(new Date(metric.date), 'MMM dd')}
                      </span>
                      <div className="flex gap-4 text-xs">
                        <span>{metric.count} total</span>
                        <span>{metric.verified} verified</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-1 h-2">
                      <div 
                        className="bg-blue-500 rounded"
                        style={{ 
                          height: metric.types.before > 0 ? `${(metric.types.before / Math.max(1, metric.count)) * 100}%` : '2px',
                          minHeight: metric.types.before > 0 ? '8px' : '2px'
                        }}
                      />
                      <div 
                        className="bg-yellow-500 rounded"
                        style={{ 
                          height: metric.types.progress > 0 ? `${(metric.types.progress / Math.max(1, metric.count)) * 100}%` : '2px',
                          minHeight: metric.types.progress > 0 ? '8px' : '2px'
                        }}
                      />
                      <div 
                        className="bg-green-500 rounded"
                        style={{ 
                          height: metric.types.after > 0 ? `${(metric.types.after / Math.max(1, metric.count)) * 100}%` : '2px',
                          minHeight: metric.types.after > 0 ? '8px' : '2px'
                        }}
                      />
                      <div 
                        className="bg-purple-500 rounded"
                        style={{ 
                          height: metric.types.approval > 0 ? `${(metric.types.approval / Math.max(1, metric.count)) * 100}%` : '2px',
                          minHeight: metric.types.approval > 0 ? '8px' : '2px'
                        }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground">
                      <span>Before: {metric.types.before}</span>
                      <span>Progress: {metric.types.progress}</span>
                      <span>After: {metric.types.after}</span>
                      <span>Approval: {metric.types.approval}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}