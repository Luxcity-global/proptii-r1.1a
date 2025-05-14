import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export const useResponsive = () => {
  const { breakpoints } = useTheme();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: windowWidth < breakpoints.sm,
    isTablet: windowWidth >= breakpoints.sm && windowWidth < breakpoints.lg,
    isDesktop: windowWidth >= breakpoints.lg,
    isXs: windowWidth < breakpoints.sm,
    isSm: windowWidth >= breakpoints.sm && windowWidth < breakpoints.md,
    isMd: windowWidth >= breakpoints.md && windowWidth < breakpoints.lg,
    isLg: windowWidth >= breakpoints.lg && windowWidth < breakpoints.xl,
    isXl: windowWidth >= breakpoints.xl && windowWidth < breakpoints['2xl'],
    is2Xl: windowWidth >= breakpoints['2xl'],
    windowWidth,
  };
}; 