import React from 'react';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';
import { CheckCircle, AlertCircle, XCircle, Clock, Play, Pause, Square } from 'lucide-react';

interface StatusBadgeProps {
  status: 'active' | 'paused' | 'draft' | 'completed' | 'error' | 'pending' | 'good' | 'fair' | 'poor';
  variant?: 'default' | 'outline' | 'secondary';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'default',
  showIcon = true,
  className,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          icon: <Play className="h-3 w-3" />,
          className: 'bg-lux-green-100 text-lux-green-800 border-lux-green-200 hover:bg-lux-green-200',
        };
      case 'paused':
        return {
          label: 'Paused',
          icon: <Pause className="h-3 w-3" />,
          className: 'bg-lux-orange-100 text-lux-orange-800 border-lux-orange-200 hover:bg-lux-orange-200',
        };
      case 'draft':
        return {
          label: 'Draft',
          icon: <Square className="h-3 w-3" />,
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
        };
      case 'completed':
        return {
          label: 'Completed',
          icon: <CheckCircle className="h-3 w-3" />,
          className: 'bg-lux-blue-100 text-lux-blue-800 border-lux-blue-200 hover:bg-lux-blue-200',
        };
      case 'error':
        return {
          label: 'Error',
          icon: <XCircle className="h-3 w-3" />,
          className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
        };
      case 'pending':
        return {
          label: 'Pending',
          icon: <Clock className="h-3 w-3" />,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
        };
      case 'good':
        return {
          label: 'Good',
          icon: <CheckCircle className="h-3 w-3" />,
          className: 'bg-lux-green-100 text-lux-green-800 border-lux-green-200 hover:bg-lux-green-200',
        };
      case 'fair':
        return {
          label: 'Fair',
          icon: <AlertCircle className="h-3 w-3" />,
          className: 'bg-lux-orange-100 text-lux-orange-800 border-lux-orange-200 hover:bg-lux-orange-200',
        };
      case 'poor':
        return {
          label: 'Poor',
          icon: <XCircle className="h-3 w-3" />,
          className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
        };
      default:
        return {
          label: 'Unknown',
          icon: <AlertCircle className="h-3 w-3" />,
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge
      variant={variant}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {showIcon && config.icon}
      {config.label}
    </Badge>
  );
};

