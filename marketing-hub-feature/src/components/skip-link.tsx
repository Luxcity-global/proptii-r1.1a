import React from 'react';
import { cn } from './ui/utils';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ 
  href, 
  children, 
  className 
}) => {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50',
        'focus:p-3 focus:bg-primary focus:text-primary-foreground focus:rounded-md',
        'focus:shadow-lg focus:font-medium focus:no-underline',
        'transition-all duration-200',
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target && 'focus' in target) {
          (target as HTMLElement).focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }}
    >
      {children}
    </a>
  );
};

// Main skip links for the application
export const MainSkipLinks: React.FC = () => {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <SkipLink href="#main-content">
        Skip to main content
      </SkipLink>
      <SkipLink href="#navigation">
        Skip to navigation
      </SkipLink>
      <SkipLink href="#search">
        Skip to search
      </SkipLink>
    </div>
  );
};
