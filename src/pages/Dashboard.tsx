import { useEffect, useState } from 'react';
import { useAuth } from '@/components/ui/auth-provider';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { MobileNav } from '@/components/navigation/MobileNav';
import { 
  Shield, 
  Plus, 
  FileText, 
  Camera, 
  CreditCard, 
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Briefcase
} from 'lucide-react';

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

export default function Dashboard() {
  const { user, session, loading, subscription, subscriptionLoading, signOut, checkSubscription } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadJobs = async () => {
    if (!user) return;
    
    setJobsLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      toast({
        title: "Error loading jobs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setJobsLoading(false);
    }
  };

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error loading profile:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadJobs();
      loadProfile();
    }
  }, [user]);

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Loading state
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleCreateCheckout = async () => {
    if (!session) return;
    
    setIsCreatingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
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
        variant: "destructive",
      });
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
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
        variant: "destructive",
      });
    }
  };

  const getSubscriptionStatus = () => {
    if (subscriptionLoading) return { text: 'Checking...', variant: 'secondary' as const };
    
    if (!subscription) return { text: 'No subscription', variant: 'destructive' as const };
    
    if (subscription.in_trial) {
      return { text: '7-Day Free Trial', variant: 'secondary' as const };
    }
    
    if (subscription.subscribed) {
      return { text: 'Pro Subscription', variant: 'default' as const };
    }
    
    return { text: 'Subscription Expired', variant: 'destructive' as const };
  };

  const statusInfo = getSubscriptionStatus();
  const hasActiveAccess = subscription?.subscribed || subscription?.in_trial;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-primary">BLUHATCH</h1>
                <p className="text-sm text-muted-foreground">Trade Protection Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <MobileNav />
              <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
              
              <div className="hidden md:flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/jobs')}
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Jobs
                </Button>
                
                {!hasActiveAccess && (
                  <Button 
                    onClick={handleCreateCheckout}
                    disabled={isCreatingCheckout}
                    className="bg-gradient-to-r from-primary to-primary-glow"
                  >
                    {isCreatingCheckout ? 'Loading...' : 'Subscribe £99/month'}
                  </Button>
                )}
                
                {subscription?.customer_id && (
                  <Button variant="outline" onClick={handleManageSubscription}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Billing
                  </Button>
                )}
                
                <Button variant="outline" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back{profile?.company_name ? `, ${profile.company_name}` : ''}!
          </h2>
          <p className="text-muted-foreground">
            {hasActiveAccess 
              ? 'Your trade protection is active. Start documenting your work.'
              : 'Subscribe to start protecting your trade work with professional evidence capture.'
            }
          </p>
        </div>

        {/* Subscription Status Card */}
        {subscription && subscription.subscription_end && (
          <Card className="mb-8 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Protection Status</h3>
                    <p className="text-muted-foreground">
                      {subscription.in_trial 
                        ? `Trial active until ${new Date(subscription.subscription_end).toLocaleDateString()}`
                        : `Subscription active until ${new Date(subscription.subscription_end).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                </div>
                <Badge variant={statusInfo.variant} className="px-4 py-2">
                  {subscription.in_trial ? 'TRIAL ACTIVE' : 'PROTECTED'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{jobs.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Protected Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {jobs.filter(job => job.protection_status >= 75).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Protection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {jobs.length > 0 
                  ? Math.round(jobs.reduce((sum, job) => sum + job.protection_status, 0) / jobs.length)
                  : 0
                }%
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {jobs.filter(job => {
                  const jobDate = new Date(job.created_at);
                  const thisMonth = new Date();
                  return jobDate.getMonth() === thisMonth.getMonth() && 
                         jobDate.getFullYear() === thisMonth.getFullYear();
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/jobs')}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-primary" />
                <span>New Job</span>
              </CardTitle>
              <CardDescription>Start documenting a new trade job</CardDescription>
            </CardHeader>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/jobs')}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5 text-accent" />
                <span>Capture Evidence</span>
              </CardTitle>
              <CardDescription>Add photos and documentation to existing jobs</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-warning" />
                <span>Generate Report</span>
              </CardTitle>
              <CardDescription>Create legal protection reports for completed jobs</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>
              Your latest trade jobs and their protection status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No jobs yet</h3>
                <p className="text-muted-foreground mb-6">Start protecting your work by creating your first job</p>
                <Button onClick={() => navigate('/jobs')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Job
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h4 className="font-semibold text-foreground">{job.client_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {job.job_type.replace('_', ' ')} • {job.client_address}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            {job.protection_status}% Protected
                          </span>
                          {job.protection_status >= 75 ? (
                            <CheckCircle className="h-4 w-4 text-accent" />
                          ) : job.protection_status >= 50 ? (
                            <Clock className="h-4 w-4 text-warning" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <Progress 
                          value={job.protection_status} 
                          className="w-24 mt-1"
                        />
                      </div>
                      
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}