import { NavLink, useLocation } from "react-router-dom";
import { Home, Briefcase, BarChart3, Settings, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Jobs", url: "/jobs", icon: Briefcase },
  { title: "Evidence", url: "/evidence", icon: Camera },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function MobileBottomNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border lg:hidden">
      <nav className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const active = isActive(item.url);
          return (
            <NavLink
              key={item.title}
              to={item.url}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1",
                "text-xs font-medium transition-colors",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 mb-1", active && "text-primary")} />
              <span className="truncate">{item.title}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}