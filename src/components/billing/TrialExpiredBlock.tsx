import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Lock, AlertTriangle } from 'lucide-react';

interface TrialExpiredBlockProps {
  onUpgrade: () => void;
}

export function TrialExpiredBlock({ onUpgrade }: TrialExpiredBlockProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Lock className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Trial Expired</CardTitle>
          <CardDescription>
            Your free trial has ended. Upgrade to continue using Bluhatch.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge variant="destructive" className="text-sm px-3 py-1">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Trial Expired
            </Badge>
          </div>

          {/* What's Locked */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">What's currently locked:</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-destructive rounded-full" />
                Creating new jobs
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-destructive rounded-full" />
                Uploading evidence
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-destructive rounded-full" />
                Generating reports
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-destructive rounded-full" />
                Client signatures
              </li>
            </ul>
          </div>

          {/* What You Keep */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">What you can still do:</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                View existing jobs and data
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                Access your account settings
              </li>
            </ul>
          </div>

          {/* Upgrade Benefits */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Unlock with Premium:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Unlimited evidence capture</li>
              <li>• Professional PDF reports</li>
              <li>• Blockchain timestamping</li>
              <li>• GPS location tracking</li>
              <li>• Client signature collection</li>
              <li>• Priority support</li>
            </ul>
          </div>

          {/* Action Button */}
          <Button 
            onClick={onUpgrade} 
            className="w-full" 
            size="lg"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Upgrade to Premium - £99/month
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            Secure payment processing with Stripe
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
