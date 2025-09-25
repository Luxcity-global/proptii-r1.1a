import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { 
  Undo, 
  Redo, 
  Save, 
  Download, 
  Share2, 
  Settings,
  ZoomIn,
  ZoomOut,
  Grid,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  MoreHorizontal,
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStoreEnhanced';

interface CanvasToolbarEnhancedProps {
  onExport?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
  className?: string;
}

export const CanvasToolbarEnhanced: React.FC<CanvasToolbarEnhancedProps> = ({
  onExport,
  onShare,
  onSettings,
  className = ''
}) => {
  const { 
    undo, 
    redo, 
    saveCanvas, 
    canUndo,
    canRedo,
    zoom,
    setZoom,
    isModified,
    isDirty,
    lastSaved,
    autoSaveEnabled,
    setAutoSaveEnabled,
    selectedObjects,
    objects,
    error
  } = useCanvasStore();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showZoomControls, setShowZoomControls] = useState(false);
  const [showAlignmentControls, setShowAlignmentControls] = useState(false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Format last saved time
  const formatLastSaved = (timestamp: number | null) => {
    if (!timestamp) return 'Never saved';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Zoom controls
  const zoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 5);
    setZoom(newZoom);
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.1);
    setZoom(newZoom);
  };

  const resetZoom = () => {
    setZoom(1);
  };

  // Alignment functions
  const alignObjects = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    // Implementation would align selected objects
    console.log(`Align objects: ${alignment}`);
  };

  // Object operations
  const duplicateSelected = () => {
    // Implementation would duplicate selected objects
    console.log('Duplicate selected objects');
  };

  const deleteSelected = () => {
    // Implementation would delete selected objects
    console.log('Delete selected objects');
  };

  const lockSelected = () => {
    // Implementation would lock selected objects
    console.log('Lock selected objects');
  };

  const unlockSelected = () => {
    // Implementation would unlock selected objects
    console.log('Unlock selected objects');
  };

  const toggleVisibility = () => {
    // Implementation would toggle visibility of selected objects
    console.log('Toggle visibility of selected objects');
  };

  return (
    <div className={`bg-white border-b border-lux-cream-300 p-3 flex items-center justify-between ${className}`}>
      {/* Left Section - History & Actions */}
      <div className="flex items-center space-x-2">
        {/* Undo/Redo */}
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={undo} 
            disabled={!canUndo()}
            className="flex items-center space-x-1"
          >
            <Undo className="w-4 h-4" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={redo} 
            disabled={!canRedo()}
            className="flex items-center space-x-1"
          >
            <Redo className="w-4 h-4" />
            <span className="hidden sm:inline">Redo</span>
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Save & Status */}
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={saveCanvas}
            disabled={!isDirty}
            className="flex items-center space-x-1"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          
          {/* Save Status */}
          <div className="flex items-center space-x-1 text-xs text-lux-blue-600">
            {isDirty ? (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                <Clock className="w-3 h-3 mr-1" />
                Unsaved
              </Badge>
            ) : (
              <Badge variant="outline" className="text-green-600 border-green-300">
                Saved
              </Badge>
            )}
          </div>

          {/* Auto-save Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
            className={`p-1 ${autoSaveEnabled ? 'text-green-600' : 'text-gray-400'}`}
            title={autoSaveEnabled ? 'Auto-save enabled' : 'Auto-save disabled'}
          >
            {autoSaveEnabled ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Object Operations */}
        {selectedObjects.length > 0 && (
          <>
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={duplicateSelected}
                className="flex items-center space-x-1"
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Duplicate</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={deleteSelected}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Alignment Controls */}
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAlignmentControls(!showAlignmentControls)}
                className="flex items-center space-x-1"
              >
                <AlignCenter className="w-4 h-4" />
                <span className="hidden sm:inline">Align</span>
              </Button>
              
              {showAlignmentControls && (
                <div className="absolute top-12 left-0 bg-white border border-lux-cream-300 rounded-lg shadow-lg p-2 z-50">
                  <div className="grid grid-cols-3 gap-1">
                    <Button size="sm" variant="ghost" onClick={() => alignObjects('left')}>
                      <AlignLeft className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => alignObjects('center')}>
                      <AlignCenter className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => alignObjects('right')}>
                      <AlignRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Layer Controls */}
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleVisibility}
                className="flex items-center space-x-1"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={lockSelected}
                className="flex items-center space-x-1"
              >
                <Lock className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Center Section - Zoom Controls */}
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={zoomOut}
          className="flex items-center space-x-1"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowZoomControls(!showZoomControls)}
          className="flex items-center space-x-1 min-w-[60px]"
        >
          <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={zoomIn}
          className="flex items-center space-x-1"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        {/* Zoom Controls Dropdown */}
        {showZoomControls && (
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-white border border-lux-cream-300 rounded-lg shadow-lg p-2 z-50">
            <div className="space-y-1">
              <Button size="sm" variant="ghost" onClick={() => setZoom(0.25)} className="w-full justify-start">
                25%
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setZoom(0.5)} className="w-full justify-start">
                50%
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setZoom(0.75)} className="w-full justify-start">
                75%
              </Button>
              <Button size="sm" variant="ghost" onClick={resetZoom} className="w-full justify-start">
                100%
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setZoom(1.5)} className="w-full justify-start">
                150%
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setZoom(2)} className="w-full justify-start">
                200%
              </Button>
            </div>
          </div>
        )}

        <Separator orientation="vertical" className="h-6" />

        {/* Grid Toggle */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {/* Toggle grid */}}
          className="flex items-center space-x-1"
        >
          <Grid className="w-4 h-4" />
          <span className="hidden sm:inline">Grid</span>
        </Button>
      </div>

      {/* Right Section - Export & Settings */}
      <div className="flex items-center space-x-2">
        {/* Selection Info */}
        {selectedObjects.length > 0 && (
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              {selectedObjects.length} selected
            </Badge>
          </div>
        )}

        {/* Object Count */}
        <div className="text-sm text-lux-blue-600">
          {objects.length} objects
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Export & Share */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onExport}
          className="flex items-center space-x-1"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onShare}
          className="flex items-center space-x-1"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>

        {/* Settings */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onSettings}
          className="flex items-center space-x-1"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>

        {/* Connection Status */}
        <div className="flex items-center space-x-1">
          {isOnline ? (
            <div className="w-2 h-2 bg-green-500 rounded-full" title="Online" />
          ) : (
            <div className="w-2 h-2 bg-red-500 rounded-full" title="Offline" />
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="absolute top-full left-0 right-0 bg-red-50 border-b border-red-200 p-2 text-red-700 text-sm">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => {/* Clear error */}}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasToolbarEnhanced;

