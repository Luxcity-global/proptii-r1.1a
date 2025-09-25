import React, { useState, useEffect } from 'react';
import { CanvasEnhanced } from './CanvasEnhanced';
import { CanvasToolbarEnhanced } from './CanvasToolbarEnhanced';
import { CanvasLoadingIndicator } from './CanvasLoadingIndicator';
import { ToolTrayRouter, ToolTrayNavigation, ToolTrayBreadcrumb } from '../tool-trays/ToolTrayRouter';
import { ToolTrayIcon } from '../tool-trays/ToolTrayIcon';
import { PerformanceDashboard } from '../performance/PerformanceDashboard';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  PanelLeft, 
  PanelRight, 
  X, 
  Maximize2,
  Minimize2,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useToolTrayStore, useActiveTray } from '../../stores/toolTrayStore';
import { useCanvasStore } from '../../stores/canvasStoreEnhanced';

interface CanvasLayoutEnhancedProps {
  onCanvasReady?: (canvas: any) => void;
  onCloseCanvas?: () => void;
  className?: string;
}

export const CanvasLayoutEnhanced: React.FC<CanvasLayoutEnhancedProps> = ({
  onCanvasReady,
  onCloseCanvas,
  className = ''
}) => {
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [middlePanelCollapsed, setMiddlePanelCollapsed] = useState(true);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  
  const activeTray = useActiveTray();
  const { setActiveTray } = useToolTrayStore();
  const { objects, selectedObjects, isModified, error } = useCanvasStore();

  // Auto-close tool tray when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const toolTrayElement = document.querySelector('[data-tool-tray="middle-panel"]');
      const leftSidebarElement = document.querySelector('[data-tool-tray="left-sidebar"]');
      
      // Check if click is outside both tool tray areas
      if (!toolTrayElement?.contains(target) && !leftSidebarElement?.contains(target)) {
        if (!middlePanelCollapsed) {
          setMiddlePanelCollapsed(true);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [middlePanelCollapsed, setMiddlePanelCollapsed]);

  // Handle canvas events
  const handleTemplateSelect = (template: any) => {
    console.log('Template selected:', template);
    // Load template to canvas
  };

  const handleImageSelect = (image: any) => {
    console.log('Image selected:', image);
    // Add image to canvas
  };

  const handleElementSelect = (element: any) => {
    console.log('Element selected:', element);
    // Add element to canvas
  };

  const handleTextSelect = (text: any) => {
    console.log('Text selected:', text);
    // Add text to canvas
  };

  const handleAIToolSelect = (tool: any) => {
    console.log('AI tool selected:', tool);
    // Execute AI tool
  };

  const handleLayerSelect = (layer: any) => {
    console.log('Layer selected:', layer);
    // Select layer on canvas
  };

  const handleAssetSelect = (asset: any) => {
    console.log('Asset selected:', asset);
    // Add asset to canvas
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 't':
          setActiveTray('templates');
          break;
        case 'i':
          setActiveTray('images');
          break;
        case 'e':
          setActiveTray('elements');
          break;
        case 'x':
          setActiveTray('text');
          break;
        case 'a':
          setActiveTray('ai-tools');
          break;
        case 'l':
          setActiveTray('layers');
          break;
        case 's':
          setActiveTray('assets');
          break;
        case 'f11':
          e.preventDefault();
          setIsFullscreen(!isFullscreen);
          break;
        case 'escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTray, isFullscreen]);

  // Tool tray configuration
  const toolTrays = [
    { id: 'templates', name: 'Templates' },
    { id: 'images', name: 'Images' },
    { id: 'elements', name: 'Elements' },
    { id: 'text', name: 'Text' },
    { id: 'ai-tools', name: 'AI Tools' },
    { id: 'layers', name: 'Layers' },
    { id: 'assets', name: 'Assets' }
  ];

  return (
    <div className={`flex flex-col h-full bg-lux-cream-200 ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}>
      {/* Enhanced Toolbar */}
      <CanvasToolbarEnhanced
        onExport={() => console.log('Export canvas')}
        onShare={() => console.log('Share canvas')}
        onSettings={() => console.log('Open settings')}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tool Tray Icons */}
        <div 
          className={`
            bg-white border-r border-lux-cream-300 transition-all duration-300 flex flex-col
            ${leftSidebarCollapsed ? 'w-16' : 'w-20'}
          `}
          data-tool-tray="left-sidebar"
        >
          <div className="p-3 space-y-3">
            {/* Collapse Button */}
            <button
              onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
              className="w-full p-2 rounded-lg hover:bg-lux-blue-50 transition-colors"
              title={leftSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <PanelLeft className={`w-4 h-4 mx-auto ${leftSidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>

            {/* Tool Tray Icons */}
            <div className="space-y-3">
              {toolTrays.map((tray) => (
                <ToolTrayIcon
                  key={tray.id}
                  trayId={tray.id as any}
                  isActive={activeTray === tray.id}
                  onClick={() => setActiveTray(tray.id as any)}
                />
              ))}
            </div>

            {/* Status Indicators */}
            <div className="pt-3 border-t border-lux-cream-300 space-y-2">
              {isModified && (
                <div className="flex items-center justify-center">
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200">
                    Unsaved
                  </Badge>
                </div>
              )}
              
              {selectedObjects.length > 0 && (
                <div className="flex items-center justify-center">
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                    {selectedObjects.length} selected
                  </Badge>
                </div>
              )}

              {objects.length > 0 && (
                <div className="flex items-center justify-center">
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                    {objects.length} objects
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Panel - Tool Tray Content */}
        <div 
          className={`
            bg-white border-r border-lux-cream-300 transition-all duration-300
            ${middlePanelCollapsed ? 'w-0 overflow-hidden' : 'w-80'}
          `}
          data-tool-tray="middle-panel"
        >
          {!middlePanelCollapsed && (
            <div className="h-full flex flex-col">
              {/* Panel Header */}
              <div className="p-4 border-b border-lux-cream-300 flex items-center justify-between">
                <ToolTrayBreadcrumb />
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMiddlePanelCollapsed(true)}
                    className="p-2"
                  >
                    <PanelRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Tool Tray Content */}
              <div className="flex-1 overflow-hidden">
                <ToolTrayRouter
                  onTemplateSelect={handleTemplateSelect}
                  onImageSelect={handleImageSelect}
                  onElementSelect={handleElementSelect}
                  onTextSelect={handleTextSelect}
                  onAIToolSelect={handleAIToolSelect}
                  onLayerSelect={handleLayerSelect}
                  onAssetSelect={handleAssetSelect}
                  className="h-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col relative">
          {/* Canvas Controls */}
          <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
            {middlePanelCollapsed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMiddlePanelCollapsed(false)}
                className="bg-white/80 hover:bg-white"
              >
                <PanelRight className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-white/80 hover:bg-white"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPerformance(!showPerformance)}
              className="bg-white/80 hover:bg-white"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Close Button */}
          {onCloseCanvas && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCloseCanvas} 
              className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white"
            >
              <X className="w-4 h-4 mr-2" />
              Close Editor
            </Button>
          )}

          {/* Canvas Container */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-full max-h-full">
              <CanvasEnhanced 
                width={800} 
                height={600}
                onCanvasReady={onCanvasReady}
              />
            </div>
          </div>

          {/* Help Button */}
          <div className="absolute bottom-4 right-4 z-10">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/80 hover:bg-white"
              onClick={() => console.log('Show help')}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Right Sidebar - Layers & Properties (Optional) */}
        <div className={`
          bg-white border-l border-lux-cream-300 transition-all duration-300
          ${rightSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-64'}
        `}>
          {!rightSidebarCollapsed && (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-lux-cream-300 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-lux-blue-900">Properties</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRightSidebarCollapsed(true)}
                  className="p-2"
                >
                  <PanelLeft className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="text-center text-lux-blue-500 py-8">
                  <div className="text-sm">Properties panel</div>
                  <p className="text-xs mt-1">Select an object to view its properties</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Dashboard */}
      {showPerformance && <PerformanceDashboard />}

      {/* Error Banner */}
      {error && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-50 border-t border-red-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-red-700 text-sm">{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {/* Clear error */}}
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      <CanvasLoadingIndicator
        loading={false}
        error={null}
      />
    </div>
  );
};

export default CanvasLayoutEnhanced;
