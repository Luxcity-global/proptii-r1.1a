import React from 'react';
import { cn } from './ui/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  center?: boolean;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className,
  size = 'xl',
  padding = 'md',
  center = true,
  ...props
}) => {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    '2xl': 'max-w-8xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 sm:px-6',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12',
  };

  return (
    <div
      className={cn(
        'w-full',
        center && 'mx-auto',
        sizeClasses[size],
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Responsive grid component
interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  ...props
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const gridCols = [
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cn(
        'grid',
        gridCols,
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Responsive flex component
interface ResponsiveFlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: {
    default?: 'row' | 'col';
    sm?: 'row' | 'col';
    md?: 'row' | 'col';
    lg?: 'row' | 'col';
  };
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveFlex: React.FC<ResponsiveFlexProps> = ({
  children,
  className,
  direction = { default: 'col', sm: 'row' },
  align = 'start',
  justify = 'start',
  wrap = false,
  gap = 'md',
  ...props
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const directionClasses = [
    direction.default && `flex-${direction.default}`,
    direction.sm && `sm:flex-${direction.sm}`,
    direction.md && `md:flex-${direction.md}`,
    direction.lg && `lg:flex-${direction.lg}`,
  ].filter(Boolean).join(' ');

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  return (
    <div
      className={cn(
        'flex',
        directionClasses,
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

