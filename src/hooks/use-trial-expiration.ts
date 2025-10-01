import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/ui/auth-provider';

interface TrialExpirationState {
  isExpired: boolean;
  daysLeft: number;
  hoursLeft: number;
  shouldShowWarning: boolean;
  warningLevel: 'info' | 'warning' | 'critical' | 'expired';
  trialEndDate: string | null;
}

export function useTrialExpiration() {
  const { subscription } = useAuth();
  const [trialState, setTrialState] = useState<TrialExpirationState>({
    isExpired: false,
    daysLeft: 0,
    hoursLeft: 0,
    shouldShowWarning: false,
    warningLevel: 'info',
    trialEndDate: null
  });

  // Check if warning was already shown today
  const hasShownWarningToday = () => {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('trial-warning-shown');
    return lastShown === today;
  };

  // Mark warning as shown for today
  const markWarningShown = () => {
    const today = new Date().toDateString();
    localStorage.setItem('trial-warning-shown', today);
  };

  const calculateTrialState = useCallback(() => {
    if (!subscription?.subscription_end) {
      return {
        isExpired: false,
        daysLeft: 0,
        hoursLeft: 0,
        shouldShowWarning: false,
        warningLevel: 'info' as const,
        trialEndDate: null
      };
    }

    const now = new Date();
    const trialEnd = new Date(subscription.subscription_end);
    const timeDiff = trialEnd.getTime() - now.getTime();
    
    const isExpired = timeDiff <= 0;
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.ceil(timeDiff / (1000 * 60 * 60));

    // Determine warning level
    let warningLevel: 'info' | 'warning' | 'critical' | 'expired' = 'info';
    let shouldShowWarning = false;

    if (isExpired) {
      warningLevel = 'expired';
      shouldShowWarning = true;
    } else if (daysLeft <= 1) {
      warningLevel = 'critical';
      shouldShowWarning = true;
    } else if (daysLeft <= 3) {
      warningLevel = 'warning';
      shouldShowWarning = true;
    } else if (daysLeft <= 7) {
      warningLevel = 'info';
      shouldShowWarning = true;
    }

    // Only show warning if not already shown today
    if (shouldShowWarning && hasShownWarningToday()) {
      shouldShowWarning = false;
    }

    return {
      isExpired,
      daysLeft: Math.max(0, daysLeft),
      hoursLeft: Math.max(0, hoursLeft),
      shouldShowWarning,
      warningLevel,
      trialEndDate: subscription.subscription_end
    };
  }, [subscription?.subscription_end]);

  useEffect(() => {
    const newState = calculateTrialState();
    setTrialState(newState);
  }, [calculateTrialState]);

  // Check if user has active access (not expired)
  const hasActiveAccess = subscription?.subscribed || (subscription?.in_trial && !trialState.isExpired);

  // Check if user can access specific features
  const canAccessFeature = (feature: string) => {
    // If user has active subscription, allow all features
    if (subscription?.subscribed) return true;
    
    // If user is in trial and not expired, allow all features
    if (subscription?.in_trial && !trialState.isExpired) return true;
    
    // If trial is expired, only allow read-only features
    const readOnlyFeatures = ['view_jobs', 'view_evidence', 'view_reports', 'settings'];
    return readOnlyFeatures.includes(feature);
  };

  // Get trial status message
  const getTrialStatusMessage = () => {
    if (trialState.isExpired) {
      return 'Trial Expired';
    }
    if (trialState.daysLeft <= 1) {
      return `Trial ends in ${trialState.hoursLeft} hours`;
    }
    if (trialState.daysLeft <= 7) {
      return `${trialState.daysLeft} days left in trial`;
    }
    return 'Active Trial';
  };

  return {
    ...trialState,
    hasActiveAccess,
    canAccessFeature,
    getTrialStatusMessage,
    markWarningShown
  };
}
