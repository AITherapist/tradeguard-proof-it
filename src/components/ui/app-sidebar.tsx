import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Jobs", url: "/jobs", icon: Briefcase },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Evidence", url: "/evidence", icon: Camera },
  { title: "Reports", url: "/reports", icon: FileText },
];

const settingsNavItems = [
  { title: "Profile", url: "/settings/profile", icon: User },
  { title: "Subscription", url: "/settings/subscription", icon: CreditCard },
  { title: "General", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  const isMainGroupExpanded = mainNavItems.some((i) => isActive(i.url));
  const isSettingsGroupExpanded = settingsNavItems.some((i) => isActive(i.url));

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

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
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

        {/* Settings Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
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