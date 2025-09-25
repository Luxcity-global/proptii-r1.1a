import React, { Suspense, lazy, useMemo, useCallback } from 'react';
import { useToolTrayStore, useActiveTray, useAnimationState } from '../../stores/toolTrayStore';
import type { ToolTrayType } from '../../stores/toolTrayStore';
import { CanvasLoadingIndicator } from '../canvas/CanvasLoadingIndicator';
import { ToolTrayErrorBoundary } from '../error/ToolTrayErrorBoundary';
import { 
  Layout, 
  Image as ImageIcon, 
  Square, 
  Type, 
  Sparkles, 
  Layers, 
  Save 
} from 'lucide-react';

// Helper function to render Lucide icons by name
const renderIcon = (iconName: string, className: string = 'w-6 h-6') => {
  const iconMap: Record<string, React.ReactNode> = {
    'Layout': <Layout className={className} />,
    'Image': <ImageIcon className={className} />,
    'Square': <Square className={className} />,
    'Type': <Type className={className} />,
    'Sparkles': <Sparkles className={className} />,
    'Layers': <Layers className={className} />,
    'Save': <Save className={className} />
  };
  
  return iconMap[iconName] || <Square className={className} />;
};

// Lazy load tool tray components for better performance
const TemplatesToolTray = lazy(() => import('./TemplatesToolTray'));
const ImagesToolTray = lazy(() => import('./ImagesToolTray'));
const ElementsToolTray = lazy(() => import('./ElementsToolTray'));
const TextToolTray = lazy(() => import('./TextToolTray'));
const AIToolsToolTray = lazy(() => import('./AIToolsToolTray'));
const LayersToolTray = lazy(() => import('./LayersToolTray'));
const AssetsToolTray = lazy(() => import('./AssetsToolTray'));

interface ToolTrayRouterProps {
  onTemplateSelect?: (template: any) => void;
  onImageSelect?: (image: any) => void;
  onElementSelect?: (element: any) => void;
  onTextSelect?: (text: any) => void;
  onAIToolSelect?: (tool: any) => void;
  onLayerSelect?: (layer: any) => void;
  onAssetSelect?: (asset: any) => void;
  className?: string;
}

// Tool tray component mapping
const toolTrayComponents: Record<ToolTrayType, React.ComponentType<any>> = {
  templates: TemplatesToolTray,
  images: ImagesToolTray,
  elements: ElementsToolTray,
  text: TextToolTray,
  'ai-tools': AIToolsToolTray,
  layers: LayersToolTray,
  assets: AssetsToolTray
};

// Default props for each tool tray
const toolTrayProps: Record<ToolTrayType, any> = {
  templates: {
    onTemplateSelect: undefined,
    onTemplateDoubleClick: undefined,
    onTemplateDragStart: undefined
  },
  images: {
    onImageSelect: undefined,
    onImageDoubleClick: undefined,
    onImageDragStart: undefined
  },
  elements: {
    onElementSelect: undefined,
    onElementDoubleClick: undefined,
    onElementDragStart: undefined
  },
  text: {
    onTextSelect: undefined,
    onTextDoubleClick: undefined,
    onTextDragStart: undefined
  },
  'ai-tools': {
    onAIToolSelect: undefined,
    onAIToolDoubleClick: undefined,
    onAIToolDragStart: undefined
  },
  layers: {
    onLayerSelect: undefined,
    onLayerDoubleClick: undefined,
    onLayerDragStart: undefined
  },
  assets: {
    onAssetSelect: undefined,
    onAssetDoubleClick: undefined,
    onAssetDragStart: undefined
  }
};

export const ToolTrayRouter: React.FC<ToolTrayRouterProps> = ({
  onTemplateSelect,
  onImageSelect,
  onElementSelect,
  onTextSelect,
  onAIToolSelect,
  onLayerSelect,
  onAssetSelect,
  className = ''
}) => {
  const activeTray = useActiveTray();
  const { isAnimating, direction } = useAnimationState();

  // Create props for the active tool tray - memoized to prevent infinite loops
  const createTrayProps = useCallback((trayId: ToolTrayType) => {
    const baseProps = toolTrayProps[trayId] || {};
    
    switch (trayId) {
      case 'templates':
        return {
          ...baseProps,
          onTemplateSelect,
          onTemplateDoubleClick: onTemplateSelect,
          onTemplateDragStart: onTemplateSelect
        };
      case 'images':
        return {
          ...baseProps,
          onImageSelect,
          onImageDoubleClick: onImageSelect,
          onImageDragStart: onImageSelect
        };
      case 'elements':
        return {
          ...baseProps,
          onElementSelect,
          onElementDoubleClick: onElementSelect,
          onElementDragStart: onElementSelect
        };
      case 'text':
        return {
          ...baseProps,
          onTextSelect,
          onTextDoubleClick: onTextSelect,
          onTextDragStart: onTextSelect
        };
      case 'ai-tools':
        return {
          ...baseProps,
          onAIToolSelect,
          onAIToolDoubleClick: onAIToolSelect,
          onAIToolDragStart: onAIToolSelect
        };
      case 'layers':
        return {
          ...baseProps,
          onLayerSelect,
          onLayerDoubleClick: onLayerSelect,
          onLayerDragStart: onLayerSelect
        };
      case 'assets':
        return {
          ...baseProps,
          onAssetSelect,
          onAssetDoubleClick: onAssetSelect,
          onAssetDragStart: onAssetSelect
        };
      default:
        return baseProps;
    }
  }, [
    onTemplateSelect,
    onImageSelect,
    onElementSelect,
    onTextSelect,
    onAIToolSelect,
    onLayerSelect,
    onAssetSelect
  ]);

  // Memoize the props for the active tray to prevent unnecessary re-renders
  const activeTrayProps = useMemo(() => createTrayProps(activeTray), [createTrayProps, activeTray]);

  // Get the component for the active tray
  const ActiveComponent = toolTrayComponents[activeTray];

  // Animation classes
  const getAnimationClasses = () => {
    if (!isAnimating) return '';
    
    switch (direction) {
      case 'left':
        return 'animate-slide-out-left';
      case 'right':
        return 'animate-slide-out-right';
      default:
        return '';
    }
  };

  const getEnterAnimationClasses = () => {
    if (!isAnimating) return '';
    
    switch (direction) {
      case 'left':
        return 'animate-slide-in-from-right';
      case 'right':
        return 'animate-slide-in-from-left';
      default:
        return '';
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Tool Tray Content */}
      <div className={`
        h-full transition-all duration-300 ease-in-out
        ${getAnimationClasses()}
      `}>
        <Suspense fallback={
          <div className="h-full flex items-center justify-center">
            <CanvasLoadingIndicator
              loading={true}
              message="Loading tool tray..."
            />
          </div>
        }>
          {ActiveComponent && (
            <div className={`
              h-full
              ${isAnimating ? getEnterAnimationClasses() : ''}
            `}>
              <ToolTrayErrorBoundary toolTrayName={activeTray}>
                <ActiveComponent {...activeTrayProps} />
              </ToolTrayErrorBoundary>
            </div>
          )}
        </Suspense>
      </div>

      {/* Animation overlay for smooth transitions */}
      {isAnimating && (
        <div className="absolute inset-0 bg-white bg-opacity-50 pointer-events-none z-10" />
      )}
    </div>
  );
};

// Tool tray navigation component
export const ToolTrayNavigation: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { activeTray, setActiveTray, trayConfigs } = useToolTrayStore();

  const enabledTrays = Object.values(trayConfigs)
    .filter(config => config.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      {enabledTrays.map(config => (
        <button
          key={config.id}
          onClick={() => setActiveTray(config.id)}
          className={`
            group relative p-3 rounded-lg transition-all duration-200
            ${activeTray === config.id
              ? 'bg-lux-blue-600 text-white shadow-lg'
              : 'hover:bg-lux-blue-50 text-lux-blue-600 hover:text-lux-blue-800'
            }
          `}
          title={config.name}
        >
          {/* Icon */}
          <div className="mb-1 text-gray-600">{renderIcon(config.icon, 'w-6 h-6')}</div>
          
          {/* Tooltip */}
          <div className={`
            absolute left-full ml-2 top-1/2 transform -translate-y-1/2
            bg-lux-blue-900 text-white text-sm px-2 py-1 rounded
            opacity-0 group-hover:opacity-100 transition-opacity duration-200
            pointer-events-none whitespace-nowrap z-50
          `}>
            {config.name}
          </div>

          {/* Active indicator */}
          {activeTray === config.id && (
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-l" />
          )}
        </button>
      ))}
    </div>
  );
};

// Tool tray breadcrumb component
export const ToolTrayBreadcrumb: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { activeTray, previousTray, setActiveTray, trayConfigs } = useToolTrayStore();

  const activeConfig = trayConfigs[activeTray];
  const previousConfig = previousTray ? trayConfigs[previousTray] : null;

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      {previousConfig && (
        <>
          <button
            onClick={() => setActiveTray(previousTray!)}
            className="text-lux-blue-600 hover:text-lux-blue-800 transition-colors"
          >
            {previousConfig.name}
          </button>
          <span className="text-lux-blue-400">/</span>
        </>
      )}
      <span className="font-medium text-lux-blue-900">
        {activeConfig.name}
      </span>
    </div>
  );
};

export default ToolTrayRouter;
