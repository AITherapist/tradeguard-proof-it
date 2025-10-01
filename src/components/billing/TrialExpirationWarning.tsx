import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Clock, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrialExpirationWarningProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBilling: () => void;
  daysLeft: number;
  trialEndDate: string;
  isExpired?: boolean;
  onWarningShown?: () => void;
}

export function TrialExpirationWarning({ 
  isOpen, 
  onClose, 
  onAddBilling, 
  daysLeft, 
  trialEndDate,
  isExpired = false,
  onWarningShown
}: TrialExpirationWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const getWarningLevel = () => {
    if (isExpired) return 'expired';
    if (daysLeft <= 1) return 'critical';
    if (daysLeft <= 3) return 'warning';
    return 'info';
  };

  const getWarningContent = () => {
    const level = getWarningLevel();
    
    switch (level) {
      case 'expired':
        return {
          title: 'Trial Expired',
          description: 'Your free trial has ended. Upgrade to continue using Bluhatch.',
          icon: AlertTriangle,
          variant: 'destructive' as const,
          showDismiss: false
        };
      case 'critical':
        return {
          title: 'Trial Ends Tomorrow',
          description: 'Your free trial ends tomorrow. Add billing details to continue uninterrupted.',
          icon: AlertTriangle,
          variant: 'destructive' as const,
          showDismiss: true
        };
      case 'warning':
        return {
          title: 'Trial Ending Soon',
          description: `Your free trial ends in ${daysLeft} days. Add billing details to continue.`,
          icon: Clock,
          variant: 'default' as const,
          showDismiss: true
        };
      default:
        return {
          title: 'Trial Information',
          description: `Your free trial ends on ${new Date(trialEndDate).toLocaleDateString()}.`,
          icon: Clock,
          variant: 'default' as const,
          showDismiss: true
        };
    }
  };

  const warningContent = getWarningContent();
  const IconComponent = warningContent.icon;

  const handleDismiss = () => {
    setIsDismissed(true);
    onClose();
    onWarningShown?.(); // Mark warning as shown
  };

  // Mark warning as shown when component mounts
  useEffect(() => {
    if (isOpen) {
      onWarningShown?.();
    }
  }, [isOpen, onWarningShown]);

  if (isDismissed && warningContent.showDismiss) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className={cn(
              "h-5 w-5",
              warningContent.variant === 'destructive' ? "text-destructive" : "text-primary"
            )} />
            {warningContent.title}
          </DialogTitle>
          <DialogDescription>
            {warningContent.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trial Status Badge */}
          <div className="flex items-center justify-center">
            <Badge 
              variant={warningContent.variant}
              className={cn(
                "text-sm px-3 py-1",
                warningContent.variant === 'destructive' && "bg-destructive text-destructive-foreground"
              )}
            >
              {isExpired ? 'Trial Expired' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
            </Badge>
          </div>

          {/* Trial End Date */}
          <div className="text-center text-sm text-muted-foreground">
            Trial ends: {new Date(trialEndDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>

          {/* Benefits Reminder */}
          {!isExpired && (
            <Alert>
              <AlertDescription className="text-sm">
                <strong>What you'll keep with Premium:</strong>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Unlimited evidence capture</li>
                  <li>• Professional PDF reports</li>
                  <li>• Blockchain timestamping</li>
                  <li>• GPS location tracking</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={onAddBilling} 
              className="flex-1"
              variant={isExpired ? "default" : "default"}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isExpired ? 'Upgrade Now' : 'Add Billing Details'}
            </Button>
            
            {warningContent.showDismiss && !isExpired && (
              <Button 
                onClick={handleDismiss} 
                variant="outline" 
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Remind Me Later
              </Button>
            )}
          </div>

          {/* Expired State Message */}
          {isExpired && (
            <div className="text-center text-sm text-muted-foreground">
              You can still view your existing data, but new features are locked.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
