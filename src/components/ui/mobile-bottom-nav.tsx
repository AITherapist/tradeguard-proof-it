import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/hooks/use-mobile";
import { useEffect } from "react";
import { NAVIGATION_ITEMS, isActiveNavigation } from "@/constants/navigation";

export function MobileBottomNav() {
  const location = useLocation();
  const { isMobile, isTablet, breakpoint } = useResponsive();

  // Ensure the navigation stays fixed and doesn't move
  useEffect(() => {
    const navElement = document.querySelector('[data-mobile-nav]') as HTMLElement;
    if (navElement) {
      navElement.style.position = 'fixed';
      navElement.style.bottom = '0';
      navElement.style.left = '0';
      navElement.style.right = '0';
      navElement.style.zIndex = '50';
    }
  }, [location.pathname]);

  // Show on mobile and small tablets, hide on larger screens
  if (!isMobile && !isTablet) return null;

  const isActive = (path: string) => isActiveNavigation(location.pathname, path);

  return (
    <div 
      data-mobile-nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border transform-gpu will-change-transform" 
      style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 50,
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        // Fluid padding that scales with viewport
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <nav className="flex items-center justify-around py-2 sm:py-3">
        {NAVIGATION_ITEMS.map((item) => {
          const active = isActive(item.url);
          return (
            <NavLink
              key={item.title}
              to={item.url}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1",
                // Fluid padding and spacing
                "py-2 px-1 sm:py-3 sm:px-2",
                // Responsive text size
                "text-xs sm:text-sm font-medium transition-colors",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon 
                className={cn(
                  "mb-1 transition-colors",
                  // Fluid icon sizing
                  "h-4 w-4 sm:h-5 sm:w-5",
                  active && "text-primary"
                )} 
              />
              <span 
                className="truncate"
                style={{
                  // Fluid font size using clamp
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
                }}
              >
                {item.title}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}