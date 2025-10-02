import { useEffect, useState } from 'react';
import { useAuth } from '@/components/ui/auth-provider';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Shield, Plus, FileText, Camera, CreditCard, Settings, TrendingUp, Clock, CheckCircle, AlertTriangle, Briefcase, RefreshCw, Activity, Calendar, Users } from 'lucide-react';
import { RecentJobsCard } from '@/components/dashboard/RecentJobsCard';
import { JobForm } from '@/components/job/JobForm';
import { BillingDetailsPopup } from '@/components/billing/BillingDetailsPopup';
import { TrialExpirationWarning } from '@/components/billing/TrialExpirationWarning';
import { TrialExpiredBlock } from '@/components/billing/TrialExpiredBlock';
import { useTrialExpiration } from '@/hooks/use-trial-expiration';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
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
interface Profile {
  company_name?: string;
  subscription_status: string;
  trial_ends_at?: string;
}

interface AnalyticsData {
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
export default function Dashboard() {
  const {
    user,
    session,
    loading,
    subscription,
    subscriptionLoading,
    signOut,
    checkSubscription
  } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [jobMetrics, setJobMetrics] = useState<JobMetrics[]>([]);
  const [showBillingPopup, setShowBillingPopup] = useState(false);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [showTrialWarning, setShowTrialWarning] = useState(false);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  
  // Trial expiration logic
  const {
    isExpired,
    daysLeft,
    shouldShowWarning,
    warningLevel,
    trialEndDate,
    hasActiveAccess,
    canAccessFeature,
    markWarningShown
  } = useTrialExpiration();
  const handleJobCreated = () => {
    setShowJobForm(false);
    loadJobs(); // Refresh the jobs list
    toast({
      title: 'Job Created',
      description: 'New job has been created successfully',
    });
  };

  const handleJobFormCancel = () => {
    setShowJobForm(false);
  };

  const loadJobs = async () => {
    if (!user) return;
    setJobsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('jobs').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      toast({
        title: "Error loading jobs",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setJobsLoading(false);
    }
  };
  const loadProfile = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error loading profile:', error);
    }
  };

  const loadAnalytics = async () => {
    if (!user) return;
    try {
      // Fetch evidence data
      const {
        data: evidenceData,
        error: evidenceError
      } = await supabase.from('evidence_items').select(`
          *,
          jobs!inner(user_id)
        `).eq('jobs.user_id', user.id);
      if (evidenceError) throw evidenceError;

      // Process analytics data
      const totalEvidence = evidenceData.length;
      const verifiedEvidence = evidenceData.filter(e => e.blockchain_timestamp).length;
      const totalValue = jobs.reduce((sum, job) => sum + (job.contract_value || 0), 0);

      // Monthly jobs
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      const monthlyJobs = jobs.filter(job => isWithinInterval(new Date(job.created_at), {
        start: monthStart,
        end: monthEnd
      })).length;

      // Weekly evidence
      const weekStart = subDays(new Date(), 7);
      const weeklyEvidence = evidenceData.filter(e => new Date(e.created_at) >= weekStart).length;

      // Approval rate
      const approvalEvidence = evidenceData.filter(e => e.evidence_type === 'approval').length;
      const approvalRate = jobs.length > 0 ? approvalEvidence / jobs.length * 100 : 0;

      setAnalytics({
        totalEvidence,
        verifiedEvidence,
        totalValue,
        monthlyJobs,
        weeklyEvidence,
        approvalRate
      });

      // Process job metrics
      const jobMetricsData: JobMetrics[] = jobs.map(job => {
        const jobEvidence = evidenceData.filter(e => e.job_id === job.id);
        const verifiedCount = jobEvidence.filter(e => e.blockchain_timestamp).length;
        return {
          id: job.id,
          client_name: job.client_name,
          job_type: job.job_type,
          protection_status: job.protection_status || 0,
          contract_value: job.contract_value,
          evidence_count: jobEvidence.length,
          verification_rate: jobEvidence.length > 0 ? verifiedCount / jobEvidence.length * 100 : 0,
          created_at: job.created_at,
          completion_date: job.completion_date
        };
      }).sort((a, b) => b.protection_status - a.protection_status);
      setJobMetrics(jobMetricsData);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
    }
  };
  useEffect(() => {
    if (user) {
      loadJobs();
      loadProfile();
      checkBillingPopup();
    }
  }, [user]);

  // Separate useEffect for subscription checking to prevent infinite loops
  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user, checkSubscription]);

  // Show trial warning when appropriate
  useEffect(() => {
    if (shouldShowWarning && !isExpired) {
      setShowTrialWarning(true);
    }
  }, [shouldShowWarning, isExpired]);

  // Check if billing popup should be shown
  const checkBillingPopup = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('billing_popup_dismissed, billing_setup_completed, created_at')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If columns don't exist yet, just check if user is new
        const { data: basicProfile } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('user_id', user.id)
          .single();
        
        if (basicProfile) {
          const isNewUser = new Date(basicProfile.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
          setShowBillingPopup(isNewUser && !subscription?.subscribed);
        }
        return;
      }

      if (profile) {
        const isNewUser = new Date(profile.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
        const shouldShow = isNewUser && 
                          !profile.billing_popup_dismissed && 
                          !profile.billing_setup_completed &&
                          !subscription?.subscribed;

        setShowBillingPopup(shouldShow);
      }
    } catch (error) {
      console.error('Error checking billing popup:', error);
    }
  };

  useEffect(() => {
    if (jobs.length > 0) {
      loadAnalytics();
    }
  }, [jobs]);

  // Handle billing setup success/cancel
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const billingSetup = urlParams.get('billing_setup');
    
    if (billingSetup === 'success') {
      toast({
        title: 'Billing details added!',
        description: 'Your 7-day free trial has started.',
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (billingSetup === 'cancelled') {
      toast({
        title: 'Billing setup cancelled',
        description: 'You can add billing details later in Settings.',
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleAddBilling = async () => {
    if (!session) return;
    setIsLoadingBilling(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'x-billing-setup': 'true'
        }
      });
      
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: 'Error',
        description: 'Failed to create checkout session',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingBilling(false);
    }
  };

  const handleSkipBilling = async () => {
    try {
      await supabase
        .from('profiles')
        .update({ billing_popup_dismissed: true })
        .eq('user_id', user.id);
      
      setShowBillingPopup(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // Trial warning handlers
  const handleTrialWarningClose = () => {
    setShowTrialWarning(false);
    markWarningShown(); // Mark as shown for today
  };

  const handleTrialWarningUpgrade = async () => {
    setShowTrialWarning(false);
    markWarningShown(); // Mark as shown for today
    await handleAddBilling();
  };

  // Check if user can create new jobs
  const canCreateJob = canAccessFeature('create_job');

  // Handle conditional rendering after all hooks
  if (!loading && !user) {
    return <Navigate to="/signin" replace />;
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }

  // Hard cutoff: If trial is expired, show the expired block
  if (isExpired && !hasActiveAccess) {
    return (
      <TrialExpiredBlock 
        onUpgrade={handleAddBilling}
      />
    );
  }
  const handleCreateCheckout = async () => {
    if (!session) return;
    setIsCreatingCheckout(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');

        // Refresh subscription status after a delay
        setTimeout(() => {
          checkSubscription();
        }, 3000);
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Error",
        description: error.message || 'Failed to create checkout session',
        variant: "destructive"
      });
    } finally {
      setIsCreatingCheckout(false);
    }
  };
  const handleManageSubscription = async () => {
    if (!session) return;
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to open customer portal',
        variant: "destructive"
      });
    }
  };
  const getSubscriptionStatus = () => {
    if (subscriptionLoading) return {
      text: 'Checking...',
      variant: 'secondary' as const
    };
    if (!subscription) return {
      text: 'No subscription',
      variant: 'destructive' as const
    };
    if (subscription.in_trial) {
      return {
        text: '7-Day Free Trial',
        variant: 'secondary' as const
      };
    }
    if (subscription.subscribed) {
      return {
        text: 'Pro Subscription',
        variant: 'default' as const
      };
    }
    return {
      text: 'Subscription Expired',
      variant: 'destructive' as const
    };
  };
  const statusInfo = getSubscriptionStatus();

  const getProtectionBadge = (score: number) => {
    if (score >= 80) return {
      text: 'Excellent',
      variant: 'default' as const
    };
    if (score >= 60) return {
      text: 'Good',
      variant: 'secondary' as const
    };
    if (score >= 40) return {
      text: 'Fair',
      variant: 'outline' as const
    };
    return {
      text: 'Needs Work',
      variant: 'destructive' as const
    };
  };
  return <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 
            className="font-bold tracking-tight"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}
          >
            Dashboard
          </h1>
          <p 
            className="text-muted-foreground"
            style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}
          >
            {hasActiveAccess ? 'Your trade protection is active. Start documenting your work.' : 'Subscribe to start protecting your trade work with professional evidence capture.'}
          </p>
        </div>

        {/* Subscription Status Card */}
        {subscription && subscription.subscription_end && <Card className="mb-8 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Protection Status</h3>
                    <p className="text-muted-foreground">
                      {subscription.in_trial ? `Trial active until ${new Date(subscription.subscription_end).toLocaleDateString()}` : `Subscription active until ${new Date(subscription.subscription_end).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <Badge variant={statusInfo.variant} className="px-4 py-2">
                  {subscription.in_trial ? 'TRIAL ACTIVE' : 'PROTECTED'}
                </Badge>
              </div>
            </CardContent>
          </Card>}

        {/* Stats Grid - Responsive with auto-fit */}
        <div 
          className="grid gap-4 sm:gap-6 mb-6 sm:mb-8"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
          }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle 
                className="font-medium text-muted-foreground"
                style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
              >
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="font-bold text-foreground"
                style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}
              >
                {jobs.length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle 
                className="font-medium text-muted-foreground"
                style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
              >
                Protected Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="font-bold text-accent"
                style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}
              >
                {jobs.filter(job => job.protection_status >= 75).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle 
                className="font-medium text-muted-foreground"
                style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
              >
                Avg Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="font-bold text-foreground"
                style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}
              >
                {jobs.length > 0 ? Math.round(jobs.reduce((sum, job) => sum + job.protection_status, 0) / jobs.length) : 0}%
              </div>
            </CardContent>
          </Card>
          
          {/* Total Value Card */}
          {analytics && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle 
                  className="font-medium text-muted-foreground"
                  style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
                >
                  Total Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="font-bold text-foreground"
                  style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}
                >
                  ${analytics.totalValue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg: ${Math.round(analytics.totalValue / Math.max(1, jobs.length)).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions - Responsive grid */}
        <div 
          className="grid gap-4 sm:gap-6 mb-6 sm:mb-8"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
          }}
        >
          <Card 
            className={`cursor-pointer hover:shadow-lg transition-shadow ${!canCreateJob ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={canCreateJob ? () => setShowJobForm(true) : undefined}
          >
            <CardHeader>
              <CardTitle 
                className="flex items-center space-x-2"
                style={{ fontSize: 'clamp(1rem, 3vw, 1.125rem)' }}
              >
                <Plus className="h-5 w-5 text-primary" />
                <span>New Job</span>
                {!canCreateJob && (
                  <Badge variant="destructive" className="text-xs">
                    Trial Expired
                  </Badge>
                )}
              </CardTitle>
              <CardDescription 
                style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
              >
                {canCreateJob ? 'Start documenting a new trade job' : 'Upgrade to create new jobs'}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={() => navigate('/jobs')}
          >
            <CardHeader>
              <CardTitle 
                className="flex items-center space-x-2"
                style={{ fontSize: 'clamp(1rem, 3vw, 1.125rem)' }}
              >
                <Camera className="h-5 w-5 text-accent" />
                <span>Capture Evidence</span>
              </CardTitle>
              <CardDescription 
                style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
              >
                Add photos and documentation to existing jobs
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/jobs')}
          >
            <CardHeader>
              <CardTitle 
                className="flex items-center space-x-2"
                style={{ fontSize: 'clamp(1rem, 3vw, 1.125rem)' }}
              >
                <FileText className="h-5 w-5 text-warning" />
                <span>Generate Report</span>
              </CardTitle>
              <CardDescription 
                style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
              >
                Create legal protection reports for completed jobs
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
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
                  {[{
                  label: 'Excellent (80-100%)',
                  min: 80,
                  max: 100,
                  color: 'bg-green-500'
                }, {
                  label: 'Good (60-79%)',
                  min: 60,
                  max: 79,
                  color: 'bg-yellow-500'
                }, {
                  label: 'Fair (40-59%)',
                  min: 40,
                  max: 59,
                  color: 'bg-orange-500'
                }, {
                  label: 'Poor (0-39%)',
                  min: 0,
                  max: 39,
                  color: 'bg-red-500'
                }].map(range => {
                  const count = jobMetrics.filter(job => job.protection_status >= range.min && job.protection_status <= range.max).length;
                  const percentage = jobs.length > 0 ? count / jobs.length * 100 : 0;
                  return <div key={range.label} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{range.label}</span>
                          <span>{count} jobs ({Math.round(percentage)}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${range.color}`} style={{
                        width: `${percentage}%`
                      }} />
                        </div>
                      </div>;
                })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Recent Jobs */}
        <RecentJobsCard jobs={jobs} isLoading={jobsLoading} onJobsChange={loadJobs} />

        {/* Job Form Modal */}
        <Dialog open={showJobForm} onOpenChange={setShowJobForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
            </DialogHeader>
            <JobForm 
              onSuccess={handleJobCreated}
              onCancel={handleJobFormCancel}
            />
          </DialogContent>
        </Dialog>

        {/* Billing Details Popup */}
        <BillingDetailsPopup
          isOpen={showBillingPopup}
          onAddBilling={handleAddBilling}
          onSkip={handleSkipBilling}
        />

        {/* Trial Expiration Warning */}
        {trialEndDate && (
          <TrialExpirationWarning
            isOpen={showTrialWarning}
            onClose={handleTrialWarningClose}
            onAddBilling={handleTrialWarningUpgrade}
            daysLeft={daysLeft}
            trialEndDate={trialEndDate}
            isExpired={isExpired}
            onWarningShown={markWarningShown}
          />
        )}
      </div>
    </DashboardLayout>;
}