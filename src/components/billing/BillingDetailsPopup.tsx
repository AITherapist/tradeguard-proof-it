import { Dialog, DialogPortal, DialogOverlay, DialogContent as DialogContentPrimitive, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillingDetailsPopupProps {
  isOpen: boolean;
  onAddBilling: () => void;
  onSkip: () => void;
}

export function BillingDetailsPopup({ isOpen, onAddBilling, onSkip }: BillingDetailsPopupProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}> {/* Prevent closing via backdrop click */}
      <DialogPortal>
        <DialogOverlay />
        <DialogContentPrimitive
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg sm:max-w-md"
          )}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Set Up Billing
            </DialogTitle>
            <DialogDescription>
              Add your billing details to continue after your 7-day free trial
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">What happens next?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Start your 7-day free trial immediately</li>
                <li>• No charges until after your trial period</li>
                <li>• Cancel anytime during the trial</li>
                <li>• Secure payment processing with Stripe</li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={onAddBilling} className="flex-1">
                <CreditCard className="h-4 w-4 mr-2" />
                Add Billing Details
              </Button>
              <Button onClick={onSkip} variant="outline" className="flex-1">
                <Clock className="h-4 w-4 mr-2" />
                I'll Add Later
              </Button>
            </div>
          </div>
        </DialogContentPrimitive>
      </DialogPortal>
    </Dialog>
  );
}
