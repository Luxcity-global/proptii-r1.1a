import { useState, useEffect } from 'react';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

const breakpoints: Record<Breakpoint, number> = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
};

export const useResponsive = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('md');
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      
      // Determine current breakpoint
      if (width >= breakpoints['3xl']) {
        setCurrentBreakpoint('3xl');
      } else if (width >= breakpoints['2xl']) {
        setCurrentBreakpoint('2xl');
      } else if (width >= breakpoints.xl) {
        setCurrentBreakpoint('xl');
      } else if (width >= breakpoints.lg) {
        setCurrentBreakpoint('lg');
      } else if (width >= breakpoints.md) {
        setCurrentBreakpoint('md');
      } else if (width >= breakpoints.sm) {
        setCurrentBreakpoint('sm');
      } else {
        setCurrentBreakpoint('xs');
      }
    };

    // Set initial values
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = currentBreakpoint === 'xs' || currentBreakpoint === 'sm';
  const isTablet = currentBreakpoint === 'md';
  const isDesktop = currentBreakpoint === 'lg' || currentBreakpoint === 'xl';
  const isLargeDesktop = currentBreakpoint === '2xl' || currentBreakpoint === '3xl';

  const isAbove = (breakpoint: Breakpoint): boolean => {
    return windowSize.width >= breakpoints[breakpoint];
  };

  const isBelow = (breakpoint: Breakpoint): boolean => {
    return windowSize.width < breakpoints[breakpoint];
  };

  const isBetween = (min: Breakpoint, max: Breakpoint): boolean => {
    return windowSize.width >= breakpoints[min] && windowSize.width < breakpoints[max];
  };

  return {
    currentBreakpoint,
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isAbove,
    isBelow,
    isBetween,
    breakpoints,
  };
};

// Hook for responsive values
export const useResponsiveValue = <T>(values: Partial<Record<Breakpoint, T>>, defaultValue: T): T => {
  const { currentBreakpoint } = useResponsive();
  
  // Find the appropriate value based on current breakpoint
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  // Look for the closest breakpoint value (current or smaller)
  for (let i = currentIndex; i >= 0; i--) {
    const breakpoint = breakpointOrder[i];
    if (values[breakpoint] !== undefined) {
      return values[breakpoint] as T;
    }
  }
  
  return defaultValue;
};

// Hook for responsive classes
export const useResponsiveClasses = (classMap: Partial<Record<Breakpoint, string>>): string => {
  const { currentBreakpoint } = useResponsive();
  
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  // Collect all applicable classes
  const classes: string[] = [];
  
  for (let i = 0; i <= currentIndex; i++) {
    const breakpoint = breakpointOrder[i];
    if (classMap[breakpoint]) {
      classes.push(classMap[breakpoint] as string);
    }
  }
  
  return classes.join(' ');
};

