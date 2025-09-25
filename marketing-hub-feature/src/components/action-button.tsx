import React from 'react';
import { Button } from './ui/button';
import { cn } from './ui/utils';
import { 
  Plus, 
  Play, 
  Pause, 
  Copy, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Settings,
  MoreHorizontal,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  action: 'create' | 'start' | 'pause' | 'copy' | 'view' | 'edit' | 'delete' | 'download' | 'upload' | 'settings' | 'more' | 'next' | 'ai';
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
  loading?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  action,
  variant = 'default',
  size = 'default',
  showIcon = true,
  showText = true,
  loading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const getActionConfig = () => {
    switch (action) {
      case 'create':
        return {
          icon: <Plus className="h-4 w-4" />,
          text: 'Create',
          className: 'bg-lux-blue-600 hover:bg-lux-blue-700 text-white',
        };
      case 'start':
        return {
          icon: <Play className="h-4 w-4" />,
          text: 'Start',
          className: 'bg-lux-green-600 hover:bg-lux-green-700 text-white',
        };
      case 'pause':
        return {
          icon: <Pause className="h-4 w-4" />,
          text: 'Pause',
          className: 'bg-lux-orange-600 hover:bg-lux-orange-700 text-white',
        };
      case 'copy':
        return {
          icon: <Copy className="h-4 w-4" />,
          text: 'Copy',
          className: 'bg-gray-600 hover:bg-gray-700 text-white',
        };
      case 'view':
        return {
          icon: <Eye className="h-4 w-4" />,
          text: 'View',
          className: 'bg-lux-blue-600 hover:bg-lux-blue-700 text-white',
        };
      case 'edit':
        return {
          icon: <Edit className="h-4 w-4" />,
          text: 'Edit',
          className: 'bg-lux-orange-600 hover:bg-lux-orange-700 text-white',
        };
      case 'delete':
        return {
          icon: <Trash2 className="h-4 w-4" />,
          text: 'Delete',
          className: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'download':
        return {
          icon: <Download className="h-4 w-4" />,
          text: 'Download',
          className: 'bg-lux-green-600 hover:bg-lux-green-700 text-white',
        };
      case 'upload':
        return {
          icon: <Upload className="h-4 w-4" />,
          text: 'Upload',
          className: 'bg-lux-blue-600 hover:bg-lux-blue-700 text-white',
        };
      case 'settings':
        return {
          icon: <Settings className="h-4 w-4" />,
          text: 'Settings',
          className: 'bg-gray-600 hover:bg-gray-700 text-white',
        };
      case 'more':
        return {
          icon: <MoreHorizontal className="h-4 w-4" />,
          text: 'More',
          className: 'bg-gray-600 hover:bg-gray-700 text-white',
        };
      case 'next':
        return {
          icon: <ArrowRight className="h-4 w-4" />,
          text: 'Next',
          className: 'bg-lux-blue-600 hover:bg-lux-blue-700 text-white',
        };
      case 'ai':
        return {
          icon: <Sparkles className="h-4 w-4" />,
          text: 'AI Assistant',
          className: 'bg-gradient-to-r from-lux-blue-600 to-lux-orange-600 hover:from-lux-blue-700 hover:to-lux-orange-700 text-white',
        };
      default:
        return {
          icon: <Plus className="h-4 w-4" />,
          text: 'Action',
          className: 'bg-lux-blue-600 hover:bg-lux-blue-700 text-white',
        };
    }
  };

  const config = getActionConfig();
  const displayText = children || config.text;

  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center gap-2',
        config.className,
        loading && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        showIcon && config.icon
      )}
      {showText && displayText}
    </Button>
  );
};

