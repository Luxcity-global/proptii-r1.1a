import React from 'react';
import { Badge } from '../ui/badge';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

export type StatusType = 
  | 'available' | 'occupied' | 'maintenance' | 'archived'
  | 'active' | 'inactive' | 'new' | 'premium' | 'suspended'
  | 'pending' | 'approved' | 'rejected' | 'expired' | 'expiring-soon'
  | 'valid' | 'invalid' | 'completed' | 'in-progress'
  | 'success' | 'warning' | 'error' | 'info';

export interface StatusBadgeProps {
  status: StatusType;
  showIcon?: boolean;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  customLabel?: string;
}

export function StatusBadge({ 
  status, 
  showIcon = false, 
  variant = 'default',
  size = 'md',
  className = "",
  customLabel 
}: StatusBadgeProps) {
  
  const getStatusConfig = (status: StatusType) => {
    const configs = {
      // Property Status
      available: {
        label: 'Available',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
      },
      occupied: {
        label: 'Occupied',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: CheckCircle
      },
      maintenance: {
        label: 'Maintenance',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock
      },
      archived: {
        label: 'Archived',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: XCircle
      },
      
      // Client Status
      active: {
        label: 'Active',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
      },
      inactive: {
        label: 'Inactive',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: XCircle
      },
      new: {
        label: 'New',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Clock
      },
      premium: {
        label: 'Premium',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: CheckCircle
      },
      suspended: {
        label: 'Suspended',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle
      },
      
      // Process Status
      pending: {
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock
      },
      approved: {
        label: 'Approved',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
      },
      rejected: {
        label: 'Rejected',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle
      },
      
      // Document Status
      valid: {
        label: 'Valid',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
      },
      invalid: {
        label: 'Invalid',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle
      },
      expired: {
        label: 'Expired',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle
      },
      'expiring-soon': {
        label: 'Expiring Soon',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: AlertTriangle
      },
      
      // General Status
      completed: {
        label: 'Completed',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
      },
      'in-progress': {
        label: 'In Progress',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Clock
      },
      success: {
        label: 'Success',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
      },
      warning: {
        label: 'Warning',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: AlertTriangle
      },
      error: {
        label: 'Error',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle
      },
      info: {
        label: 'Info',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Clock
      }
    };
    
    return configs[status] || {
      label: status,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Clock
    };
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2'
  };

  return (
    <Badge 
      variant={variant}
      className={`${config.color} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <IconComponent className="w-3 h-3 mr-1" />}
      {customLabel || config.label}
    </Badge>
  );
}

export default StatusBadge;
