import React from 'react';

interface BaseLayoutProps {
  children: React.ReactNode;
  className?: string;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({
  children,
  className = '',
  containerSize = 'xl'
}) => {
  const containerClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    'full': 'w-full'
  };

  return (
    <div className={`min-h-screen bg-white ${className}`}>
      <div className={`container mx-auto ${containerClasses[containerSize]} px-container-xs md:px-container-md lg:px-container-lg`}>
        {children}
      </div>
    </div>
  );
};

export default BaseLayout; 