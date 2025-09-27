import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Shield, 
  Briefcase, 
  BarChart3, 
  Settings, 
  Camera, 
  FileText,
  User,
  CreditCard,
  Home,
  Menu,
  X
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/ui/auth-provider";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Jobs", url: "/jobs", icon: Briefcase },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const currentPath = location.pathname;
  const isMobile = useIsMobile();

  // Only show on desktop devices
  if (isMobile) return null;

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) =>
    isActive(path) ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50";

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-64"}
    >
      <SidebarContent className="bg-card border-r">
        {/* Logo Section */}
        <div className="p-4 border-b">
          <NavLink to="/dashboard" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            {!collapsed && <span className="text-xl font-bold text-primary">BLUHATCH</span>}
          </NavLink>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sign Out Button */}
        <div className="mt-auto p-4 border-t">
          <Button 
            variant="ghost" 
            onClick={signOut}
            className="w-full justify-start"
          >
            <span className="text-sm">Sign Out</span>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}