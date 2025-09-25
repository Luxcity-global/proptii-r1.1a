/**
 * Advanced Selection Manager
 * Multi-select, transform handles, and advanced manipulation features
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import {
  MousePointer,
  Move,
  RotateCcw,
  Maximize,
  Square,
  Circle,
  Lasso,
  Hand,
  ZoomIn,
  ZoomOut,
  Target,
  Grid3x3,
  Crosshair
} from 'lucide-react';

interface SelectionManagerProps {
  onToolChange?: (tool: SelectionTool) => void;
  className?: string;
}

export type SelectionTool = 
  | 'select'     // Default selection tool
  | 'move'       // Move tool  
  | 'rotate'     // Rotation tool
  | 'resize'     // Resize tool
  | 'lasso'      // Lasso selection
  | 'marquee'    // Rectangle marquee selection
  | 'circle'     // Circle selection
  | 'pan'        // Pan tool
  | 'zoom';      // Zoom tool

export const SelectionManager: React.FC<SelectionManagerProps> = ({
  onToolChange,
  className = ''
}) => {
  const [activeTool, setActiveTool] = useState<SelectionTool>('select');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToolChange = useCallback((tool: SelectionTool) => {
    setActiveTool(tool);
    onToolChange?.(tool);
  }, [onToolChange]);

  const tools = [
    {
      id: 'select' as SelectionTool,
      name: 'Select',
      icon: MousePointer,
      description: 'Select and manipulate objects',
      shortcut: 'V'
    },
    {
      id: 'move' as SelectionTool, 
      name: 'Move',
      icon: Move,
      description: 'Move objects',
      shortcut: 'M'
    },
    {
      id: 'rotate' as SelectionTool,
      name: 'Rotate', 
      icon: RotateCcw,
      description: 'Rotate objects',
      shortcut: 'R'
    },
    {
      id: 'resize' as SelectionTool,
      name: 'Resize',
      icon: Maximize,
      description: 'Resize objects',
      shortcut: 'S'
    },
    {
      id: 'lasso' as SelectionTool,
      name: 'Lasso',
      icon: Lasso,
      description: 'Freeform selection',
      shortcut: 'L'
    },
    {
      id: 'marquee' as SelectionTool,
      name: 'Marquee',
      icon: Square,
      description: 'Rectangle selection',
      shortcut: 'U'
    },
    {
      id: 'pan' as SelectionTool,
      name: 'Pan',
      icon: Hand,
      description: 'Pan canvas',
      shortcut: 'H'
    },
    {
      id: 'zoom' as SelectionTool,
      name: 'Zoom',
      icon: ZoomIn,
      description: 'Zoom canvas',
      shortcut: 'Z'
    }
  ];

  const primaryTools = tools.slice(0, 4);
  const advancedTools = tools.slice(4);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const tool = tools.find(t => t.shortcut.toLowerCase() === e.key.toLowerCase());
      if (tool) {
        e.preventDefault();
        handleToolChange(tool.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToolChange, tools]);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Selection Tools</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs"
          >
            {showAdvanced ? 'Simple' : 'Advanced'}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Primary Tools */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Primary Tools
          </h4>
          
          <div className="grid grid-cols-2 gap-2">
            {primaryTools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              
              return (
                <Button
                  key={tool.id}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleToolChange(tool.id)}
                  className="flex flex-col items-center py-3 h-auto relative"
                  title={`${tool.description} (${tool.shortcut})`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span className="text-xs">{tool.name}</span>
                  
                  {/* Keyboard shortcut */}
                  <div className="absolute top-1 right-1 text-xs text-gray-400 font-mono">
                    {tool.shortcut}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Advanced Tools */}
        {showAdvanced && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Advanced Selection
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
              {advancedTools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                
                return (
                  <Button
                    key={tool.id}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleToolChange(tool.id)}
                    className="flex flex-col items-center py-3 h-auto relative"
                    title={`${tool.description} (${tool.shortcut})`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="text-xs">{tool.name}</span>
                    
                    {/* Keyboard shortcut */}
                    <div className="absolute top-1 right-1 text-xs text-gray-400 font-mono">
                      {tool.shortcut}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selection Options */}
        <div className="space-y-3 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Selection Options
          </h4>
          
          <div className="space-y-2 text-sm">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-xs">Show transform handles</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-xs">Show bounding box</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-xs">Lock aspect ratio</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-xs">Multi-select mode</span>
            </label>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Quick Actions
          </h4>
          
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              Select All
              <span className="ml-1 text-gray-400">⌘A</span>
            </Button>
            
            <Button variant="outline" size="sm" className="text-xs">
              Deselect
              <span className="ml-1 text-gray-400">⌘D</span>
            </Button>
            
            <Button variant="outline" size="sm" className="text-xs">
              Invert
              <span className="ml-1 text-gray-400">⌘⇧I</span>
            </Button>
            
            <Button variant="outline" size="sm" className="text-xs">
              Similar
              <span className="ml-1 text-gray-400">⌘⇧S</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectionManager;

