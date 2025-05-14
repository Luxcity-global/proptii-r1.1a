import React from 'react';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  cols = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 4,
    '2xl': 4
  },
  gap = '4'
}) => {
  const getGridCols = () => {
    return `
      grid-cols-${cols.xs || 1}
      sm:grid-cols-${cols.sm || cols.xs || 1}
      md:grid-cols-${cols.md || cols.sm || cols.xs || 1}
      lg:grid-cols-${cols.lg || cols.md || cols.sm || cols.xs || 1}
      xl:grid-cols-${cols.xl || cols.lg || cols.md || cols.sm || cols.xs || 1}
      2xl:grid-cols-${cols['2xl'] || cols.xl || cols.lg || cols.md || cols.sm || cols.xs || 1}
    `.replace(/\s+/g, ' ').trim();
  };

  return (
    <div className={`grid ${getGridCols()} gap-${gap} ${className}`}>
      {children}
    </div>
  );
};

export default ResponsiveGrid; 