import { useState, useEffect } from 'react';
import { useAuth } from '@/components/ui/auth-provider';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Calendar, Check, Star, AlertTriangle, ExternalLink } from 'lucide-react';

export default function Subscription() {
  const { user, loading, subscription } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const plans = [
    {
      name: 'Free Trial',
      price: '$0',
      period: '/month',
      description: 'Perfect for getting started',
      features: [
        '10 evidence uploads per month',
        'Basic blockchain verification',
        'Standard support',
        '1GB storage'
      ],
      current: !subscription?.subscribed
    },
    {
      name: 'Professional',
      price: '$29',
      period: '/month',
      description: 'For growing businesses',
      features: [
        'Unlimited evidence uploads',
        'Advanced blockchain verification',
        'Priority support',
        '100GB storage',
        'Custom reports',
        'API access'
      ],
      current: subscription?.subscribed,
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      description: 'For large organizations',
      features: [
        'Everything in Professional',
        'White-label solutions',
        'Dedicated support',
        'Unlimited storage',
        'Custom integrations',
        'SLA guarantee'
      ],
      current: false
    }
  ];

  const usageData = {
    uploads: { current: 7, limit: 10 },
    storage: { current: 2.3, limit: 100 },
    reports: { current: 2, limit: 5 }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription plan and billing information
          </p>
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
            <CardDescription>
              Your active subscription details and usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Plan</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={subscription?.subscribed ? "default" : "secondary"}>
                      {subscription?.subscribed ? "Professional" : "Free Trial"}
                    </Badge>
                    {subscription?.subscribed && <Star className="h-4 w-4 text-yellow-500" />}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Next billing</span>
                  <span className="text-sm">July 15, 2024</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Usage This Month</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Evidence Uploads</span>
                      <span>{usageData.uploads.current}/{usageData.uploads.limit}</span>
                    </div>
                    <Progress value={(usageData.uploads.current / usageData.uploads.limit) * 100} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Storage Used</span>
                      <span>{usageData.storage.current}GB/{usageData.storage.limit}GB</span>
                    </div>
                    <Progress value={(usageData.storage.current / usageData.storage.limit) * 100} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trial Warning */}
        {!subscription?.subscribed && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your free trial expires in 15 days. Upgrade to continue using all features.
            </AlertDescription>
          </Alert>
        )}

        {/* Available Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>
              Choose the plan that best fits your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`border rounded-lg p-6 relative ${
                    plan.current ? 'border-primary bg-primary/5' : ''
                  } ${plan.popular ? 'border-2 border-primary' : ''}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>

                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={plan.current ? "secondary" : "default"}
                      disabled={plan.current}
                    >
                      {plan.current ? "Current Plan" : "Upgrade"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Billing History
            </CardTitle>
            <CardDescription>
              Your recent invoices and payment history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Professional Plan</p>
                  <p className="text-sm text-muted-foreground">June 15, 2024</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Paid</Badge>
                  <span className="font-medium">$29.00</span>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Professional Plan</p>
                  <p className="text-sm text-muted-foreground">May 15, 2024</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Paid</Badge>
                  <span className="font-medium">$29.00</span>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Professional Plan</p>
                  <p className="text-sm text-muted-foreground">April 15, 2024</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Paid</Badge>
                  <span className="font-medium">$29.00</span>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}