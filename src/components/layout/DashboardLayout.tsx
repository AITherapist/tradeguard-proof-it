import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { useAuth } from "@/components/ui/auth-provider";
import { useResponsive } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { subscription } = useAuth();
  const { isMobile, isTablet } = useResponsive();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        <AppSidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b bg-card flex items-center px-4 lg:px-6">
            {!isMobile && !isTablet && <SidebarTrigger />}
            
            <div className="flex-1" />
            
            {/* Subscription Status */}
            <div className="flex items-center gap-2">
              {subscription?.subscription_end && (
                <div 
                  className="text-muted-foreground hidden sm:block"
                  style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
                >
                  {subscription.subscribed ? 'Premium Plan' : 'Trial Active'}
                </div>
              )}
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <div className={isMobile || isTablet ? "pb-16" : "pb-0"}>
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </SidebarProvider>
  );
}