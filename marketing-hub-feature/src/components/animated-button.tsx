import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { cn } from './ui/utils';
import { hoverScale, fadeIn } from '../utils/animations';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  animation?: 'fade' | 'scale' | 'slide' | 'none';
  delay?: number;
  duration?: number;
  hover?: boolean;
  loading?: boolean;
  className?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  animation = 'scale',
  delay = 0,
  duration = 0.2,
  hover = true,
  loading = false,
  className,
  disabled,
  ...props
}) => {
  const getAnimationVariants = () => {
    switch (animation) {
      case 'fade':
        return fadeIn;
      case 'scale':
      default:
        return hoverScale;
    }
  };

  const variants = getAnimationVariants();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover={hover && !disabled && !loading ? "hover" : undefined}
      whileTap={!disabled && !loading ? "tap" : undefined}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
      }}
    >
      <Button
        disabled={disabled || loading}
        className={cn(
          'relative overflow-hidden',
          loading && 'cursor-not-allowed',
          className
        )}
        {...props}
      >
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-inherit"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
            />
          </motion.div>
        )}
        <motion.span
          animate={{ opacity: loading ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.span>
      </Button>
    </motion.div>
  );
};

// Animated Icon Button
interface AnimatedIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  animation?: 'fade' | 'scale' | 'rotate' | 'none';
  delay?: number;
  className?: string;
}

export const AnimatedIconButton: React.FC<AnimatedIconButtonProps> = ({
  icon,
  label,
  animation = 'scale',
  delay = 0,
  className,
  ...props
}) => {
  const getIconVariants = () => {
    switch (animation) {
      case 'rotate':
        return {
          rest: { rotate: 0 },
          hover: { rotate: 180 },
          tap: { rotate: 360 },
        };
      case 'scale':
      default:
        return hoverScale;
    }
  };

  const iconVariants = getIconVariants();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        delay,
        type: 'spring',
        stiffness: 200,
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        className={cn('relative', className)}
        aria-label={label}
        {...props}
      >
        <motion.div
          variants={iconVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          transition={{ duration: 0.2 }}
        >
          {icon}
        </motion.div>
      </Button>
    </motion.div>
  );
};

// Animated Toggle Button
interface AnimatedToggleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  label: string;
  delay?: number;
  className?: string;
}

export const AnimatedToggleButton: React.FC<AnimatedToggleButtonProps> = ({
  isActive,
  activeIcon,
  inactiveIcon,
  label,
  delay = 0,
  className,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        delay,
        type: 'spring',
        stiffness: 200,
      }}
    >
      <Button
        variant={isActive ? 'default' : 'ghost'}
        size="icon"
        className={cn('relative', className)}
        aria-label={label}
        aria-pressed={isActive}
        {...props}
      >
        <motion.div
          key={isActive ? 'active' : 'inactive'}
          initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
          transition={{ duration: 0.2, type: 'spring', stiffness: 200 }}
        >
          {isActive ? activeIcon : inactiveIcon}
        </motion.div>
      </Button>
    </motion.div>
  );
};

