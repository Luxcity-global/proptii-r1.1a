/**
 * Object Snapping and Smart Guides System
 * Intelligent alignment assistance and precise positioning
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Grid3x3,
  Target,
  Crosshair,
  Ruler,
  AlignCenter,
  Magnet,
  Settings,
  Eye,
  EyeOff,
  Hash,
  Plus,
  Minus
} from 'lucide-react';

interface SnapGuidesProps {
  onSnapSettingsChange?: (settings: SnapSettings) => void;
  className?: string;
}

export interface SnapSettings {
  snapToGrid: boolean;
  snapToObjects: boolean;
  snapToGuides: boolean;
  snapToPixels: boolean;
  snapToCenter: boolean;
  snapTolerance: number;
  showGrid: boolean;
  showGuides: boolean;
  showRulers: boolean;
  gridSize: number;
  gridColor: string;
  guideColor: string;
}

export const SnapGuides: React.FC<SnapGuidesProps> = ({
  onSnapSettingsChange,
  className = ''
}) => {
  const [settings, setSettings] = useState<SnapSettings>({
    snapToGrid: true,
    snapToObjects: true,
    snapToGuides: true,
    snapToPixels: false,
    snapToCenter: true,
    snapTolerance: 10,
    showGrid: true,
    showGuides: true,
    showRulers: true,
    gridSize: 20,
    gridColor: '#e5e7eb',
    guideColor: '#3b82f6'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateSettings = useCallback((updates: Partial<SnapSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    onSnapSettingsChange?.(newSettings);
  }, [settings, onSnapSettingsChange]);

  // Snap options with descriptions
  const snapOptions = [
    {
      key: 'snapToGrid' as keyof SnapSettings,
      label: 'Grid',
      icon: Grid3x3,
      description: 'Snap objects to grid intersections',
      shortcut: '⌘;'
    },
    {
      key: 'snapToObjects' as keyof SnapSettings,
      label: 'Objects',
      icon: Target,
      description: 'Snap to edges and centers of other objects',
      shortcut: '⌘⇧;'
    },
    {
      key: 'snapToGuides' as keyof SnapSettings,
      label: 'Guides',
      icon: Ruler,
      description: 'Snap to custom guide lines',
      shortcut: '⌘⌥;'
    },
    {
      key: 'snapToCenter' as keyof SnapSettings,
      label: 'Center',
      icon: AlignCenter,
      description: 'Snap to canvas center and object centers',
      shortcut: '⌘⌥C'
    },
    {
      key: 'snapToPixels' as keyof SnapSettings,
      label: 'Pixels',
      icon: Hash,
      description: 'Snap to pixel boundaries for crisp edges',
      shortcut: '⌘⌥P'
    }
  ];

  // Display options
  const displayOptions = [
    {
      key: 'showGrid' as keyof SnapSettings,
      label: 'Show Grid',
      icon: Grid3x3,
      description: 'Display background grid'
    },
    {
      key: 'showGuides' as keyof SnapSettings,
      label: 'Show Guides',
      icon: Ruler,
      description: 'Display guide lines'
    },
    {
      key: 'showRulers' as keyof SnapSettings,
      label: 'Show Rulers',
      icon: Crosshair,
      description: 'Display canvas rulers'
    }
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Toggle grid with Cmd+;
      if (e.metaKey && e.key === ';' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        updateSettings({ snapToGrid: !settings.snapToGrid });
      }
      
      // Toggle object snapping with Cmd+Shift+;
      if (e.metaKey && e.shiftKey && e.key === ';' && !e.altKey) {
        e.preventDefault();
        updateSettings({ snapToObjects: !settings.snapToObjects });
      }
      
      // Toggle guide snapping with Cmd+Alt+;
      if (e.metaKey && e.altKey && e.key === ';' && !e.shiftKey) {
        e.preventDefault();
        updateSettings({ snapToGuides: !settings.snapToGuides });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings, updateSettings]);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Magnet className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Snap & Guides</span>
            <Badge 
              variant={Object.values(settings).some(v => v === true) ? 'default' : 'secondary'} 
              className="text-xs"
            >
              {Object.entries(settings).filter(([, value]) => value === true).length} active
            </Badge>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs"
            >
              <Settings className="w-3 h-3 mr-1" />
              {showAdvanced ? 'Simple' : 'Advanced'}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Snap Options */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Snap To
          </h4>
          
          <div className="space-y-2">
            {snapOptions.map((option) => {
              const Icon = option.icon;
              const isActive = settings[option.key] as boolean;
              
              return (
                <div
                  key={option.key}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Button
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSettings({ [option.key]: !isActive })}
                      className="w-8 h-8 p-0"
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 font-mono">
                    {option.shortcut}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Display Options */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Display
          </h4>
          
          <div className="space-y-2">
            {displayOptions.map((option) => {
              const Icon = option.icon;
              const isActive = settings[option.key] as boolean;
              
              return (
                <div
                  key={option.key}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateSettings({ [option.key]: !isActive })}
                      className="w-8 h-8 p-0"
                    >
                      {isActive ? (
                        <Eye className="w-4 h-4 text-blue-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                    
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <>
            {/* Snap Tolerance */}
            <div className="space-y-3 pt-3 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Precision
              </h4>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">
                    Snap Tolerance: {settings.snapTolerance}px
                  </label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSettings({ 
                        snapTolerance: Math.max(1, settings.snapTolerance - 1) 
                      })}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={settings.snapTolerance}
                      onChange={(e) => updateSettings({ 
                        snapTolerance: parseInt(e.target.value) 
                      })}
                      className="flex-1"
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSettings({ 
                        snapTolerance: Math.min(50, settings.snapTolerance + 1) 
                      })}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">
                    Grid Size: {settings.gridSize}px
                  </label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSettings({ 
                        gridSize: Math.max(5, settings.gridSize - 5) 
                      })}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={settings.gridSize}
                      onChange={(e) => updateSettings({ 
                        gridSize: parseInt(e.target.value) 
                      })}
                      className="flex-1"
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSettings({ 
                        gridSize: Math.min(100, settings.gridSize + 5) 
                      })}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Color Settings */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Colors
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">Grid Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={settings.gridColor}
                      onChange={(e) => updateSettings({ gridColor: e.target.value })}
                      className="w-8 h-8 rounded border border-gray-300"
                    />
                    <span className="text-xs text-gray-600 font-mono">
                      {settings.gridColor}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">Guide Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={settings.guideColor}
                      onChange={(e) => updateSettings({ guideColor: e.target.value })}
                      className="w-8 h-8 rounded border border-gray-300"
                    />
                    <span className="text-xs text-gray-600 font-mono">
                      {settings.guideColor}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                updateSettings({
                  snapToGrid: true,
                  snapToObjects: true,
                  snapToGuides: true,
                  snapToCenter: true,
                  showGrid: true,
                  showGuides: true,
                  showRulers: true
                });
              }}
              className="text-xs"
            >
              Enable All
            </Button>
            
            <Button
              variant="outline" 
              size="sm"
              onClick={() => {
                updateSettings({
                  snapToGrid: false,
                  snapToObjects: false,
                  snapToGuides: false,
                  snapToPixels: false,
                  snapToCenter: false,
                  showGrid: false,
                  showGuides: false,
                  showRulers: false
                });
              }}
              className="text-xs"
            >
              Disable All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnapGuides;

