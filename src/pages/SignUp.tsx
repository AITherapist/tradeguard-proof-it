import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, FileCheck, Smartphone, Eye, EyeOff } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/components/ui/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SignUp() {
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const { toast } = useToast();

  // Handle conditional rendering after all hooks
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !companyName) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Error", 
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            company_name: companyName,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account. You can start your 7-day free trial immediately.",
      });
    } catch (error: any) {
      console.error('Auth error:', error);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'This email is already registered. Try signing in instead.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">BLUHATCH</span>
            </div>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Start Your Protection Journey
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of tradespeople protecting their work with bulletproof evidence documentation
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Features side */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Professional Trade Protection
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Capture legally admissible evidence, generate court-ready reports, and protect yourself from disputes.
              </p>
            </div>

            <div className="grid gap-6">
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Mobile Evidence Capture</h3>
                  <p className="text-muted-foreground">
                    Capture high-resolution photos with GPS coordinates and timestamps on any device
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Lock className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Blockchain Timestamping</h3>
                  <p className="text-muted-foreground">
                    Every piece of evidence is cryptographically secured with Bitcoin blockchain timestamps
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-warning/10 p-3 rounded-lg">
                  <FileCheck className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Legal Report Generation</h3>
                  <p className="text-muted-foreground">
                    Generate comprehensive, court-admissible reports for insurance claims and disputes
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-accent/10 to-primary/10 p-6 rounded-xl">
              <h3 className="font-semibold text-foreground mb-2">7-Day Free Trial</h3>
              <p className="text-muted-foreground">
                Start protecting your work immediately. No credit card required for trial.
              </p>
            </div>
          </div>

          {/* Auth form side */}
          <div className="w-full max-w-md mx-auto">
            <Card className="shadow-elegant">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  Create Account
                </CardTitle>
                <CardDescription>
                  Start your 7-day free trial today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      type="text"
                      placeholder="Your Company Ltd"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                        minLength={8}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      'Start Free Trial'
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center space-y-2">
                  <Link 
                    to="/signin" 
                    className="text-primary hover:underline block"
                  >
                    Already have an account? Sign in
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
