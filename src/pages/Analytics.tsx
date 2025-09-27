import { useAuth } from '@/components/ui/auth-provider';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, FileCheck, Shield, Camera, Clock } from 'lucide-react';

export default function Analytics() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your evidence collection, verification stats, and performance metrics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Evidence</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">247</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Items</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">241</div>
              <p className="text-xs text-muted-foreground">
                97.6% verification rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                3 completed this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4h</div>
              <p className="text-xs text-muted-foreground">
                -15min from last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Evidence Collection Trends
              </CardTitle>
              <CardDescription>
                Monthly evidence collection over the past 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">January</span>
                  <div className="flex items-center gap-2">
                    <Progress value={80} className="w-24" />
                    <span className="text-sm">156</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">February</span>
                  <div className="flex items-center gap-2">
                    <Progress value={65} className="w-24" />
                    <span className="text-sm">127</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">March</span>
                  <div className="flex items-center gap-2">
                    <Progress value={90} className="w-24" />
                    <span className="text-sm">176</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">April</span>
                  <div className="flex items-center gap-2">
                    <Progress value={75} className="w-24" />
                    <span className="text-sm">147</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">May</span>
                  <div className="flex items-center gap-2">
                    <Progress value={95} className="w-24" />
                    <span className="text-sm">186</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">June</span>
                  <div className="flex items-center gap-2">
                    <Progress value={100} className="w-24" />
                    <span className="text-sm">195</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Verification Performance
              </CardTitle>
              <CardDescription>
                Blockchain verification success rates by evidence type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Photos</span>
                  <div className="flex items-center gap-2">
                    <Progress value={98} className="w-24" />
                    <Badge variant="secondary">98%</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Videos</span>
                  <div className="flex items-center gap-2">
                    <Progress value={95} className="w-24" />
                    <Badge variant="secondary">95%</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Documents</span>
                  <div className="flex items-center gap-2">
                    <Progress value={99} className="w-24" />
                    <Badge variant="secondary">99%</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Audio</span>
                  <div className="flex items-center gap-2">
                    <Progress value={92} className="w-24" />
                    <Badge variant="secondary">92%</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}