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
import { User, CreditCard, Shield, Bell, Settings as SettingsIcon, RefreshCw, ExternalLink, Check, FileText, Lock, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { GDPRCompliance } from '@/components/gdpr/GDPRCompliance';
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
        redirectTo: `${window.location.origin}/auth`
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
  return <DashboardLayout>
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
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

                {/* Upgrade Action */}
                {!subscription?.subscribed && (
                  <div className="text-center">
                    <Button onClick={handleCreateCheckout} disabled={isLoading} size="lg">
                      <CreditCard className="h-4 w-4 mr-2" />
                      {subscription?.in_trial ? 'Upgrade to Premium (£99/month)' : 'Start Free Trial'}
                    </Button>
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
                    <Button onClick={handleCreateCheckout} disabled={isLoading}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Subscribe to Premium
                    </Button>
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
                  Account security information and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Security Features</h3>
                  <p className="text-sm text-muted-foreground">
                    Your account is protected with industry-standard security measures. 
                    Password management features are available in the Profile tab.
                  </p>
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

          <TabsContent value="gdpr" className="space-y-6">
            <GDPRCompliance />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>;
}