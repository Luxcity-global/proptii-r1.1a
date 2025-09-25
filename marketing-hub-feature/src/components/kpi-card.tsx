import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
// import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import { cn } from './ui/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  target?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  progress?: number;
  status?: 'good' | 'fair' | 'poor';
  icon?: React.ReactNode;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  target,
  trend,
  trendValue,
  progress,
  status = 'good',
  icon,
  className,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-lux-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return 'bg-lux-green-50 border-lux-green-200 text-lux-green-800';
      case 'fair':
        return 'bg-lux-orange-50 border-lux-orange-200 text-lux-orange-800';
      case 'poor':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-lux-blue-50 border-lux-blue-200 text-lux-blue-800';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'good':
        return 'bg-lux-green-500';
      case 'fair':
        return 'bg-lux-orange-500';
      case 'poor':
        return 'bg-red-500';
      default:
        return 'bg-lux-blue-500';
    }
  };

  return (
    <Card className={cn("relative overflow-hidden", getStatusColor(), className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{value}</div>
            {trend && trendValue && (
              <div className="flex items-center space-x-1">
                {getTrendIcon()}
                <span className="text-sm font-medium">{trendValue}</span>
              </div>
            )}
          </div>
          
          {target && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>Target: {target}</span>
            </div>
          )}
          
          {progress !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress 
                value={progress} 
                className="h-2"
                style={{
                  '--progress-background': getProgressColor(),
                } as React.CSSProperties}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Skeleton loader for KPI cards
export const KPICardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <Card className={cn("animate-pulse", className)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="h-4 w-24 bg-muted rounded" />
      <div className="h-4 w-4 bg-muted rounded" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-8 w-16 bg-muted rounded" />
          <div className="h-4 w-12 bg-muted rounded" />
        </div>
        <div className="h-2 w-full bg-muted rounded" />
      </div>
    </CardContent>
  </Card>
);
