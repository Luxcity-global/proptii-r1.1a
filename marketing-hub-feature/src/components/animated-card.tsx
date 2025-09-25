import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from './ui/utils';
import { hoverLift, fadeIn, slideInFromBottom } from '../utils/animations';

interface AnimatedCardProps {
  children: React.ReactNode;
  animation?: 'fade' | 'slide' | 'hover' | 'none';
  delay?: number;
  duration?: number;
  hover?: boolean;
  className?: string;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  animation = 'fade',
  delay = 0,
  duration = 0.3,
  hover = true,
  className,
}) => {
  const getAnimationVariants = () => {
    switch (animation) {
      case 'slide':
        return slideInFromBottom;
      case 'hover':
        return hoverLift;
      case 'fade':
      default:
        return fadeIn;
    }
  };

  const variants = getAnimationVariants();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover={hover ? "hover" : undefined}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
      }}
      className={cn('w-full', className)}
    >
      <Card className="h-full transition-all duration-200">
        {children}
      </Card>
    </motion.div>
  );
};

// Animated KPI Card
interface AnimatedKPICardProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  delay?: number;
  className?: string;
}

export const AnimatedKPICard: React.FC<AnimatedKPICardProps> = ({
  title,
  value,
  trend,
  trendValue,
  icon,
  delay = 0,
  className,
}) => {
  return (
    <AnimatedCard
      animation="slide"
      delay={delay}
      hover={true}
      className={className}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
            className="text-muted-foreground"
          >
            {icon}
          </motion.div>
        )}
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.1, duration: 0.3 }}
          className="space-y-2"
        >
          <div className="text-2xl font-bold">{value}</div>
          {trend && trendValue && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.3, duration: 0.2 }}
              className="flex items-center space-x-1 text-sm"
            >
              <span className={cn(
                'font-medium',
                trend === 'up' && 'text-lux-green-600',
                trend === 'down' && 'text-red-500',
                trend === 'neutral' && 'text-muted-foreground'
              )}>
                {trendValue}
              </span>
            </motion.div>
          )}
        </motion.div>
      </CardContent>
    </AnimatedCard>
  );
};

// Animated Action Card
interface AnimatedActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  delay?: number;
  className?: string;
}

export const AnimatedActionCard: React.FC<AnimatedActionCardProps> = ({
  title,
  description,
  icon,
  onClick,
  delay = 0,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -4, 
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{
        duration: 0.3,
        delay,
        ease: 'easeOut',
      }}
      className={cn('cursor-pointer', className)}
      onClick={onClick}
    >
      <Card className="h-full transition-all duration-200 hover:border-lux-blue-300">
        <CardContent className="p-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.1, type: 'spring', stiffness: 200 }}
            className="mb-4 text-lux-blue-600"
          >
            {icon}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.2, duration: 0.3 }}
            className="space-y-2"
          >
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
