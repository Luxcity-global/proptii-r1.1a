import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  fluid?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className = '',
  fluid = false,
  as: Component = 'div'
}) => {
  const { spacing } = useTheme();
  
  const containerClasses = `
    mx-auto
    w-full
    px-[${spacing.containerXs}]
    md:px-[${spacing.containerMd}]
    lg:px-[${spacing.containerLg}]
    ${!fluid ? 'max-w-screen-xl' : ''}
    ${className}
  `.trim();

  return (
    <Component className={containerClasses}>
      {children}
    </Component>
  );
};

export default Container; 