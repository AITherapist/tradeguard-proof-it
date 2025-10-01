import { useAuth } from '@/components/ui/auth-provider';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CustomersList } from '@/components/customers/CustomersList';

export default function Customers() {
  const { user, loading } = useAuth();

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
