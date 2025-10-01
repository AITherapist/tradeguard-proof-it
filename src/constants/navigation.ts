import { 
  Home, 
  Briefcase, 
  Users, 
  Settings, 
  FileText 
} from 'lucide-react';

export interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { 
    title: "Dashboard", 
    url: "/dashboard", 
    icon: Home,
    description: "Overview and quick actions"
  },
  { 
    title: "Jobs", 
    url: "/jobs", 
    icon: Briefcase,
    description: "Manage your trade jobs"
  },
  { 
    title: "Customers", 
    url: "/customers", 
    icon: Users,
    description: "Manage your clients"
  },
  { 
    title: "Reports", 
    url: "/reports", 
    icon: FileText,
    description: "Generate PDF reports"
  },
  { 
    title: "Settings", 
    url: "/settings", 
    icon: Settings,
    description: "Account and preferences"
  },
];

export const getActiveNavigationItem = (pathname: string): NavigationItem | undefined => {
  return NAVIGATION_ITEMS.find(item => {
    if (item.url === "/dashboard") {
      return pathname === item.url;
    }
    return pathname.startsWith(item.url);
  });
};

export const isActiveNavigation = (pathname: string, itemUrl: string): boolean => {
  if (itemUrl === "/dashboard") {
    return pathname === itemUrl;
  }
  return pathname.startsWith(itemUrl);
};
