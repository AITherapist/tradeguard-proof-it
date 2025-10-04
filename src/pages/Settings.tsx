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
import { User, CreditCard, Shield, Bell, Settings as SettingsIcon, RefreshCw, ExternalLink, Check, FileText, Lock, Mail, LogOut, HardDrive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { GDPRCompliance } from '@/components/gdpr/GDPRCompliance';
import { StorageManagement } from '@/components/storage/StorageManagement';
export default function Settings() {
  const {
    user,
    loading,
    session,
    subscription,
    checkSubscription,
    signOut
  } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    phone: '',
    address: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const {
    toast
  } = useToast();

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
      // Automatically refresh subscription status when component mounts
      checkSubscription();
    }
  }, [user, checkSubscription]);

  // Check for successful payment redirect and refresh subscription
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      // Payment was successful, refresh subscription status
      setTimeout(() => {
        checkSubscription();
        toast({
          title: 'Payment successful!',
          description: 'Your subscription has been activated.',
        });
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 2000);
    }
  }, [checkSubscription, toast]);

  // Handle conditional rendering after all hooks
  if (!loading && !user) {
    return <Navigate to="/signin" replace />;
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
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
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive'
      });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive'
      });
      return;
    }
    
    setIsPasswordLoading(true);
    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: passwordData.currentPassword
      });
      
      if (signInError) {
        toast({
          title: 'Error',
          description: 'Current password is incorrect',
          variant: 'destructive'
        });
        return;
      }
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      
      if (error) throw error;
      
      toast({
        title: 'Password updated',
        description: 'Your password has been successfully updated.'
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password',
        variant: 'destructive'
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };
  
  const handleForgotPassword = async () => {
    if (!user?.email) return;
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/signin`
      });
      
      if (error) throw error;
      
      toast({
        title: 'Reset email sent',
        description: 'Please check your email for password reset instructions.'
      });
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email',
        variant: 'destructive'
      });
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
      
      if (data?.needsConfiguration) {
        toast({
          title: 'Billing Portal Not Configured',
          description: 'Please contact support to manage your subscription. The billing portal needs to be set up.',
          variant: 'destructive'
        });
        return;
      }
      
      if (data?.url) {
        window.open(data.url, '_blank');
        setTimeout(() => {
          checkSubscription();
        }, 5000);
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to open billing portal. Please contact support.',
        variant: 'destructive'
      });
    }
  };
  const handleCreateCheckout = async () => {
    if (!session) return;
    setIsLoading(true);
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
      if (data?.url) {
        window.open(data.url, '_blank');
        setTimeout(() => {
          checkSubscription();
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
            <TabsTrigger value="storage" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Storage
            </TabsTrigger>
            <TabsTrigger value="gdpr" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              GDPR
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
                  Update your account details and company information
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

            <Card>
              <CardHeader>
                <CardTitle>Password Settings</CardTitle>
                <CardDescription>
                  Update your account password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input 
                      id="currentPassword" 
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value
                      })}
                      placeholder="Enter your current password"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input 
                        id="newPassword" 
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value
                        })}
                        placeholder="Enter new password"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input 
                        id="confirmPassword" 
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value
                        })}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="submit" disabled={isPasswordLoading}>
                      {isPasswordLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                    
                    <Button type="button" variant="outline" onClick={handleForgotPassword}>
                      <Mail className="mr-2 h-4 w-4" />
                      Forgot Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>
                  Manage your account session and security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="destructive" 
                    onClick={signOut}
                    className="w-full sm:w-auto"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Overview</CardTitle>
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
                      {subscription?.subscription_status === 'active' ? 'Premium Plan' : 
                       subscription?.subscription_status === 'trialing' ? 'Free Trial' : 
                       subscription?.subscription_status === 'cancelled' ? 'Cancelled Plan' : 'No Subscription'}
                    </p>
                  </div>
                  <Badge variant={
                    subscription?.subscription_status === 'active' ? 'default' : 
                    subscription?.subscription_status === 'trialing' ? 'secondary' : 
                    subscription?.subscription_status === 'cancelled' ? 'destructive' : 'destructive'
                  }>
                    {subscription?.subscription_status?.toUpperCase() || 'INACTIVE'}
                  </Badge>
                </div>

                {/* Plan Details */}
                {subscription && <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <p className="text-sm text-muted-foreground capitalize">
                          {subscription.subscription_status === 'active' ? 'Active' : 
                           subscription.subscription_status === 'trialing' ? 'Trial' : 
                           subscription.subscription_status === 'cancelled' ? 'Cancelled' : 'Inactive'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          {subscription.subscription_status === 'trialing' ? 'Trial Ends' : 
                           subscription.subscription_status === 'active' ? 'Next Billing' : 
                           subscription.subscription_status === 'cancelled' ? 'Plan Ends' : 'Status'}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {subscription.subscription_end ? new Date(subscription.subscription_end).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                  </div>}

                <Separator />

                {/* Upgrade Action */}
                {!subscription?.subscribed && !subscription?.in_trial && subscription?.subscription_status !== 'cancelled' && (
                  <div className="text-center">
                    <Button onClick={handleCreateCheckout} disabled={isLoading} size="lg">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  </div>
                )}

                {/* Dynamic Status Section */}
                {subscription?.subscription_status === 'inactive' && (
                  <div className="text-center">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">Trial Active</h3>
                      <p className="text-sm text-blue-700 mb-3">
                        Your free trial is currently active. No billing details added yet - please add them to continue after your trial period.
                      </p>
                      <div className="text-xs text-blue-600 mb-3">
                        Trial ends: {subscription.subscription_end ? new Date(subscription.subscription_end).toLocaleDateString() : 'N/A'}
                      </div>
                      <Button onClick={handleCreateCheckout} disabled={isLoading} size="sm">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Add Billing Details
                      </Button>
                    </div>
                  </div>
                )}

                {subscription?.subscription_status === 'trialing' && (
                  <div className="text-center">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">Trial Active</h3>
                      <p className="text-sm text-blue-700 mb-3">
                        Your free trial is currently active. You'll be automatically charged when the trial ends.
                      </p>
                      <div className="text-xs text-blue-600">
                        Trial ends: {subscription.subscription_end ? new Date(subscription.subscription_end).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                )}

                {subscription?.subscription_status === 'cancelled' && (
                  <div className="text-center">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h3 className="font-semibold text-orange-900 mb-2">Plan Cancelled</h3>
                      <p className="text-sm text-orange-700 mb-3">
                        Your plan will end on {subscription.subscription_end ? new Date(subscription.subscription_end).toLocaleDateString() : 'the end of your current period'}.
                      </p>
                      <Button onClick={handleManageBilling} disabled={isLoading} size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Resume Plan
                      </Button>
                    </div>
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

            {/* Billing Management Section */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Management</CardTitle>
                <CardDescription>
                  Manage your billing information and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User has billing details set up (customer_id exists) */}
                {subscription?.customer_id ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">
                          {subscription?.subscription_status === 'active' ? 'Active Subscription' : 
                           subscription?.subscription_status === 'trialing' ? 'Trial with Billing' : 
                           subscription?.subscription_status === 'cancelled' ? 'Cancelled Subscription' : 'Subscription'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Bluhatch Pro - £99.00/month
                          {subscription?.subscription_status === 'trialing' && ' (Trial)'}
                        </p>
                        {subscription?.subscription_end && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {subscription.subscription_status === 'active' ? 'Next billing' : 
                             subscription.subscription_status === 'trialing' ? 'Trial ends' : 
                             subscription.subscription_status === 'cancelled' ? 'Plan ends' : 'Status'}: {new Date(subscription.subscription_end).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge variant={
                        subscription?.subscription_status === 'active' ? 'default' : 
                        subscription?.subscription_status === 'trialing' ? 'secondary' : 
                        subscription?.subscription_status === 'cancelled' ? 'destructive' : 'secondary'
                      }>
                        {subscription?.subscription_status?.toUpperCase() || 'TRIAL'}
                      </Badge>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button onClick={handleManageBilling} variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Manage Subscription
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <h3 className="font-semibold mb-2">No Billing Information</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add your billing details to continue after your trial period.
                    </p>
                    {subscription?.in_trial && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-left">
                        <p className="text-sm text-blue-700">
                          <strong>What happens next:</strong>
                        </p>
                        <ul className="text-xs text-blue-600 mt-1 space-y-1">
                          <li>• You'll be charged £99/month when your trial ends</li>
                          <li>• No charges until {subscription.subscription_end ? new Date(subscription.subscription_end).toLocaleDateString() : 'trial ends'}</li>
                          <li>• You can cancel anytime during the trial</li>
                        </ul>
                      </div>
                    )}
                    <Button onClick={handleCreateCheckout} disabled={isLoading}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Add Billing Details
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="storage" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Storage Management</h2>
              <p className="text-muted-foreground">
                Monitor and manage your storage usage
              </p>
            </div>
            <StorageManagement />
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

          <TabsContent value="gdpr" className="space-y-6">
            <GDPRCompliance />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>;
}