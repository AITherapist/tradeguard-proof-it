import { useState, useEffect } from 'react';
import { useAuth } from '@/components/ui/auth-provider';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { User, CreditCard, Shield, Bell, Download, Settings as SettingsIcon, RefreshCw, ExternalLink, Check, X, FileText, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { GDPRCompliance } from '@/components/gdpr/GDPRCompliance';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
export default function Settings() {
  const {
    user,
    loading,
    session,
    subscription,
    checkSubscription
  } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    phone: '',
    address: ''
  });
  const {
    toast
  } = useToast();

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Loading state
  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  const loadProfile = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      if (error) throw error;
      setProfile(data);
      setFormData({
        company_name: data.company_name || '',
        phone: data.phone || '',
        address: data.address || ''
      });
    } catch (error: any) {
      console.error('Error loading profile:', error);
    }
  };
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.from('profiles').update(formData).eq('user_id', user.id);
      if (error) throw error;
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.'
      });
      loadProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleRefreshSubscription = async () => {
    setIsRefreshing(true);
    try {
      await checkSubscription();
      toast({
        title: 'Subscription refreshed',
        description: 'Your subscription status has been updated'
      });
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh subscription status',
        variant: 'destructive'
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  const handleManageBilling = async () => {
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
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast({
        title: 'Error',
        description: 'Failed to open billing management',
        variant: 'destructive'
      });
    }
  };
  const handleCreateCheckout = async (isAnnual = false) => {
    if (!session) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { annual: isAnnual },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        setTimeout(() => {
          handleRefreshSubscription();
        }, 5000);
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: 'Error',
        description: 'Failed to create checkout session',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!session) return;
    setIsCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (error) throw error;
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription will be cancelled at the end of the current billing period.'
      });
      setTimeout(() => {
        handleRefreshSubscription();
      }, 1000);
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive'
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleExportData = async () => {
    if (!session) return;
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-data', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (error) throw error;
      
      // Create and download the file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tradeguard-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Data Exported',
        description: 'Your data has been successfully exported and downloaded.'
      });
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };
  return <DashboardLayout>
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account profile and company information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user.email || ''} disabled className="bg-muted" />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input id="company_name" value={formData.company_name} onChange={e => setFormData({
                      ...formData,
                      company_name: e.target.value
                    })} placeholder="Your Company Ltd" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" value={formData.phone} onChange={e => setFormData({
                      ...formData,
                      phone: e.target.value
                    })} placeholder="+44 7700 123456" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Business Address</Label>
                      <Input id="address" value={formData.address} onChange={e => setFormData({
                      ...formData,
                      address: e.target.value
                    })} placeholder="123 Business Street, City" />
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                    Update Profile
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Subscription Overview
                  <Button variant="outline" size="sm" onClick={handleRefreshSubscription} disabled={isRefreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </CardTitle>
                <CardDescription>
                  View your current subscription status and manage your plan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Plan */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Current Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      {subscription?.subscribed ? 'Premium Plan' : subscription?.in_trial ? 'Free Trial' : 'No Subscription'}
                    </p>
                  </div>
                  <Badge variant={subscription?.subscribed ? 'default' : 'secondary'}>
                    {subscription?.subscribed ? 'ACTIVE' : subscription?.in_trial ? 'TRIAL' : 'INACTIVE'}
                  </Badge>
                </div>

                {/* Plan Details */}
                {subscription && <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <p className="text-sm text-muted-foreground capitalize">
                          {subscription.subscribed ? 'Active' : subscription.in_trial ? 'Trial' : 'Inactive'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          {subscription.in_trial ? 'Trial Ends' : 'Next Billing'}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {subscription.subscription_end ? new Date(subscription.subscription_end).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>}

                <Separator />

                {/* Upgrade Actions */}
                {!subscription?.subscribed && (
                  <div className="space-y-4">
                    <div className="text-center space-y-3">
                      <Button onClick={() => handleCreateCheckout(false)} disabled={isLoading} size="lg" className="w-full">
                        <CreditCard className="h-4 w-4 mr-2" />
                        {subscription?.in_trial ? 'Upgrade to Premium (£99/month)' : 'Start Free Trial'}
                      </Button>
                      <div className="text-sm text-muted-foreground">or</div>
                      <Button onClick={() => handleCreateCheckout(true)} disabled={isLoading} variant="outline" size="lg" className="w-full">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Annual Plan - £100.98/year (15% off!)
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Annual plan saves you £87.02 per year
                      </p>
                    </div>
                  </div>
                )}

                {/* Cancel Subscription */}
                {subscription?.subscribed && (
                  <div className="text-center pt-4 border-t">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isCancelling}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancel Subscription
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period, and your subscription will not auto-renew.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCancelSubscription} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Yes, Cancel
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}

                {/* Premium Plan Features */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">TradeGuard Pro</h3>
                      <p className="text-sm text-muted-foreground">Professional evidence capture and documentation protection</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">£99</div>
                      <div className="text-sm text-muted-foreground">per month</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    {['Unlimited evidence capture', 'Professional PDF reports', 'Blockchain timestamping', 'GPS location tracking', 'Client signature collection', 'Mobile app access', 'Cloud storage', 'Priority support'].map((feature, index) => <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-accent" />
                        <span className="text-sm">{feature}</span>
                      </div>)}
                  </div>
                  
                  <div className="text-center">
                    <Badge variant="secondary" className="bg-accent/10 text-accent">
                      7-day free trial included
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing Management</CardTitle>
                <CardDescription>
                  Manage your billing information and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {subscription?.subscribed ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Active Subscription</h3>
                        <p className="text-sm text-muted-foreground">
                          TradeGuard Pro - £99.00/month
                        </p>
                      </div>
                      <Badge variant="default">ACTIVE</Badge>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button onClick={handleManageBilling} variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Manage Subscription
                      </Button>
                      <Button onClick={handleManageBilling} variant="outline">
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        Update Payment Method
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium">Billing Information</h4>
                      <p className="text-sm text-muted-foreground">
                        Access your billing portal to view invoices, update payment methods, and manage your subscription.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <h3 className="font-semibold mb-2">No Active Subscription</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Subscribe to Premium to access billing management features.
                    </p>
                    <div className="space-y-3">
                      <Button onClick={() => handleCreateCheckout(false)} disabled={isLoading} className="w-full">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Subscribe to Premium - £99/month
                      </Button>
                      <Button onClick={() => handleCreateCheckout(true)} disabled={isLoading} variant="outline" className="w-full">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Annual Plan - £100.98/year (15% off!)
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Change Password</h4>
                      <p className="text-sm text-muted-foreground">
                        Update your account password
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Change Password
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Data Export</h4>
                      <p className="text-sm text-muted-foreground">
                        Download all your account data in JSON format
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleExportData}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {isExporting ? 'Exporting...' : 'Export Data'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how you receive notifications and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about your account and jobs
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Job Completion Alerts</h4>
                      <p className="text-sm text-muted-foreground">
                        Get notified when evidence capture is complete
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Billing Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Updates about payments and subscription changes
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Marketing Communications</h4>
                      <p className="text-sm text-muted-foreground">
                        Tips, best practices, and product updates
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </DashboardLayout>;
}