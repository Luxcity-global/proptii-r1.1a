import React from 'react';

interface ResponsiveTextProps {
  children: React.ReactNode;
  variant: 'heading' | 'body' | 'small';
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  variant,
  className = '',
  as: Component = 'div'
}) => {
  const getTextClasses = () => {
    switch (variant) {
      case 'heading':
        return 'text-heading-xs md:text-heading-md lg:text-heading-lg font-bold';
      case 'body':
        return 'text-body-xs md:text-body-md lg:text-body-lg';
      case 'small':
        return 'text-small-xs md:text-small-md lg:text-small-lg';
      default:
        return 'text-body-xs md:text-body-md lg:text-body-lg';
    }
  };

  return (
    <Component className={`${getTextClasses()} ${className}`}>
      {children}
    </Component>
  );
};

// Predefined heading components
export const H1: React.FC<Omit<ResponsiveTextProps, 'variant'>> = (props) => (
  <ResponsiveText {...props} variant="heading" as="h1" />
);

export const H2: React.FC<Omit<ResponsiveTextProps, 'variant'>> = (props) => (
  <ResponsiveText {...props} variant="heading" as="h2" />
);

export const Body: React.FC<Omit<ResponsiveTextProps, 'variant'>> = (props) => (
  <ResponsiveText {...props} variant="body" as="p" />
);

export const Small: React.FC<Omit<ResponsiveTextProps, 'variant'>> = (props) => (
  <ResponsiveText {...props} variant="small" as="span" />
);

export default ResponsiveText; 