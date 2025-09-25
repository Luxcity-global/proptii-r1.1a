import React, { useState, useRef, useEffect } from 'react';
import type { ToolTrayType } from '../../stores/toolTrayStore';
import { Badge } from '../ui/badge';
import { 
  Layout,
  Image as ImageIcon,
  Square,
  Type,
  Sparkles,
  Layers,
  Save
} from 'lucide-react';

interface ToolTrayIconProps {
  trayId?: ToolTrayType;
  id?: ToolTrayType; // Support for legacy prop name
  isActive?: boolean;
  onClick: () => void;
  className?: string;
  name?: string; // Support for legacy props
  icon?: React.ReactNode;
  isCollapsed?: boolean;
}

interface IconConfig {
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
  activeColor: string;
  description: string;
  shortcut?: string;
}

const iconConfigs: Record<ToolTrayType, IconConfig> = {
  templates: {
    icon: <Layout className="w-6 h-6" />,
    color: '#3b82f6',
    hoverColor: '#2563eb',
    activeColor: '#1d4ed8',
    description: 'Choose from our collection of design templates',
    shortcut: 'T'
  },
  images: {
    icon: <ImageIcon className="w-6 h-6" />,
    color: '#10b981',
    hoverColor: '#059669',
    activeColor: '#047857',
    description: 'Upload and manage your image assets',
    shortcut: 'I'
  },
  elements: {
    icon: <Square className="w-6 h-6" />,
    color: '#f59e0b',
    hoverColor: '#d97706',
    activeColor: '#b45309',
    description: 'Add shapes, text, icons, and lines to your design',
    shortcut: 'E'
  },
  text: {
    icon: <Type className="w-6 h-6" />,
    color: '#8b5cf6',
    hoverColor: '#7c3aed',
    activeColor: '#6d28d9',
    description: 'Add and style text elements',
    shortcut: 'X'
  },
  'ai-tools': {
    icon: <Sparkles className="w-6 h-6" />,
    color: '#ec4899',
    hoverColor: '#db2777',
    activeColor: '#be185d',
    description: 'Powered by artificial intelligence',
    shortcut: 'A'
  },
  layers: {
    icon: <Layers className="w-6 h-6" />,
    color: '#6b7280',
    hoverColor: '#4b5563',
    activeColor: '#374151',
    description: 'Manage canvas layers and object hierarchy',
    shortcut: 'L'
  },
  assets: {
    icon: <Save className="w-6 h-6" />,
    color: '#ef4444',
    hoverColor: '#dc2626',
    activeColor: '#b91c1c',
    description: 'Manage your design assets',
    shortcut: 'S'
  }
};

export const ToolTrayIcon: React.FC<ToolTrayIconProps> = ({
  trayId,
  id,
  isActive = false,
  onClick,
  className = '',
  name,
  icon
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const iconRef = useRef<HTMLButtonElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Support both prop patterns
  const actualTrayId = trayId || id;
  
  // Fallback config if trayId is not found
  const config = actualTrayId ? iconConfigs[actualTrayId] : {
    icon: <Square className="w-6 h-6" />,
    color: '#6b7280',
    hoverColor: '#4b5563',
    activeColor: '#374151',
    description: 'Unknown tool tray',
    shortcut: '?'
  };

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowTooltip(false);
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
  };

  const handleClick = () => {
    onClick();
    // Add click animation
    if (iconRef.current) {
      iconRef.current.style.transform = 'scale(0.95)';
      setTimeout(() => {
        if (iconRef.current) {
          iconRef.current.style.transform = '';
        }
      }, 150);
    }
  };


  return (
    <div className="relative flex flex-col items-center">
      <button
        ref={iconRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          group relative transition-all duration-200 ease-out
          flex items-center justify-center
          w-16 h-16 mx-auto rounded-lg
          ${isActive
            ? 'bg-gray-100 border-r-2'
            : 'hover:bg-gray-50'
          }
          ${className}
        `}
        style={{
          borderRightColor: isActive ? config.activeColor : 'transparent'
        }}
      >
        {/* Icon */}
        <div 
          className="relative z-10 transition-all duration-200"
          style={{ 
            color: isActive 
              ? config.activeColor 
              : isHovered 
                ? config.hoverColor 
                : config.color
          }}
        >
          {icon || config.icon}
        </div>
      </button>

      {/* Tool Name - Outside button to prevent background interference */}
      <div className="mt-1 z-20 relative">
        <span 
          className="text-xs font-medium whitespace-nowrap transition-all duration-200 block text-center"
          style={{ 
            color: isActive 
              ? config.activeColor 
              : isHovered 
                ? config.hoverColor 
                : config.color
          }}
        >
          {name || (actualTrayId ? actualTrayId.charAt(0).toUpperCase() + actualTrayId.slice(1) : 'Unknown')}
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 z-50">
          <div className="bg-lux-blue-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{name || (actualTrayId ? actualTrayId.charAt(0).toUpperCase() + actualTrayId.slice(1) : 'Unknown')}</span>
              {config.shortcut && (
                <Badge variant="outline" className="text-xs border-lux-blue-600 text-lux-blue-200">
                  {config.shortcut}
                </Badge>
              )}
            </div>
            <div className="text-xs text-lux-blue-200 mt-1 max-w-xs">
              {config.description}
            </div>
            
            {/* Tooltip arrow */}
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-lux-blue-900" />
          </div>
        </div>
      )}

      {/* Keyboard shortcut indicator */}
      {config.shortcut && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-lux-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {config.shortcut}
        </div>
      )}
    </div>
  );
};

// Animated tool tray icon with loading state
export const AnimatedToolTrayIcon: React.FC<ToolTrayIconProps & {
  isLoading?: boolean;
  badge?: string | number;
}> = ({ trayId, isActive, onClick, isLoading = false, badge, className = '' }) => {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % 4);
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  return (
    <div className="relative">
      <ToolTrayIcon
        trayId={trayId}
        isActive={isActive}
        onClick={onClick}
        className={`
          ${isLoading ? 'animate-pulse' : ''}
          ${className}
        `}
      />
      
      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-6 h-6 border-2 border-lux-blue-200 border-t-lux-blue-600 rounded-full animate-spin"
            style={{ animationDelay: `${animationPhase * 75}ms` }}
          />
        </div>
      )}

      {/* Badge */}
      {badge && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse">
          {badge}
        </div>
      )}
    </div>
  );
};

// Tool tray icon grid component
export const ToolTrayIconGrid: React.FC<{
  activeTray: ToolTrayType;
  onTraySelect: (trayId: ToolTrayType) => void;
  className?: string;
}> = ({ activeTray, onTraySelect, className = '' }) => {
  const trayIds: ToolTrayType[] = [
    'templates',
    'images', 
    'elements',
    'text',
    'ai-tools',
    'layers',
    'assets'
  ];

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {trayIds.map(trayId => (
        <ToolTrayIcon
          key={trayId}
          trayId={trayId}
          isActive={activeTray === trayId}
          onClick={() => onTraySelect(trayId)}
        />
      ))}
    </div>
  );
};

export default ToolTrayIcon;
