import { useEffect } from 'react';
import { useAuth } from '@/components/ui/auth-provider';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CustomersList } from '@/components/customers/CustomersList';

export default function Customers() {
  const { user, loading, checkSubscription } = useAuth();

  // Check subscription status when Customers page loads
  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user, checkSubscription]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <CustomersList />
      </div>
    </DashboardLayout>
  );
}
