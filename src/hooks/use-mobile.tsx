import * as React from "react";

// Modern responsive breakpoints based on content, not arbitrary pixels
const BREAKPOINTS = {
  xs: 20, // 20rem = 320px
  sm: 30, // 30rem = 480px  
  md: 48, // 48rem = 768px
  lg: 64, // 64rem = 1024px
  xl: 80, // 80rem = 1280px
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

// Enhanced responsive hook with multiple breakpoints
export function useResponsive() {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>('md');
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined);
  const [isDesktop, setIsDesktop] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      
      // Convert to rem for consistent scaling
      const widthInRem = width / rem;
      
      let currentBreakpoint: Breakpoint = 'xs';
      if (widthInRem >= BREAKPOINTS.xl) currentBreakpoint = 'xl';
      else if (widthInRem >= BREAKPOINTS.lg) currentBreakpoint = 'lg';
      else if (widthInRem >= BREAKPOINTS.md) currentBreakpoint = 'md';
      else if (widthInRem >= BREAKPOINTS.sm) currentBreakpoint = 'sm';
      
      setBreakpoint(currentBreakpoint);
      setIsMobile(widthInRem < BREAKPOINTS.md);
      setIsTablet(widthInRem >= BREAKPOINTS.md && widthInRem < BREAKPOINTS.lg);
      setIsDesktop(widthInRem >= BREAKPOINTS.lg);
    };

    // Create media queries for each breakpoint
    const mediaQueries = Object.entries(BREAKPOINTS).map(([key, value]) => ({
      key: key as Breakpoint,
      mql: window.matchMedia(`(min-width: ${value}rem)`)
    }));

    const handleChange = () => updateBreakpoint();
    
    // Listen to all breakpoint changes
    mediaQueries.forEach(({ mql }) => {
      mql.addEventListener("change", handleChange);
    });
    
    updateBreakpoint();
    
    return () => {
      mediaQueries.forEach(({ mql }) => {
        mql.removeEventListener("change", handleChange);
      });
    };
  }, []);

  return {
    breakpoint,
    isMobile: !!isMobile,
    isTablet: !!isTablet,
    isDesktop: !!isDesktop,
    isXs: breakpoint === 'xs',
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
  };
}

// Backward compatibility
export function useIsMobile() {
  const { isMobile } = useResponsive();
  return isMobile;
}
