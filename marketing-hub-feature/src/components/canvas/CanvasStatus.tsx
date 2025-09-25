import React from 'react';
import { useCanvasStore } from '../../stores/canvasStore';

export const CanvasStatus: React.FC = () => {
  const { 
    objects, 
    selectedObjects, 
    zoom, 
    isLoading, 
    error,
    isModified,
    canvas
  } = useCanvasStore();

  const getCanvasSize = () => {
    if (!canvas) return { width: 0, height: 0 };
    return {
      width: Math.round(canvas.getWidth()),
      height: Math.round(canvas.getHeight())
    };
  };

  const canvasSize = getCanvasSize();

  return (
    <div className="bg-white border-t border-lux-cream-300 px-4 py-2">
      <div className="flex items-center justify-between text-sm text-gray-600">
        {/* Left Section - Canvas Info */}
        <div className="flex items-center space-x-4">
          <span>
            Canvas: {canvasSize.width} × {canvasSize.height}px
          </span>
          <span>
            Objects: {objects.length}
          </span>
          {selectedObjects.length > 0 && (
            <span className="text-lux-blue-600 font-medium">
              Selected: {selectedObjects.length}
            </span>
          )}
        </div>

        {/* Center Section - Status */}
        <div className="flex items-center space-x-4">
          {isLoading && (
            <div className="flex items-center space-x-2 text-lux-blue-600">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-lux-blue-600"></div>
              <span>Processing...</span>
            </div>
          )}
          
          {error && (
            <div className="flex items-center space-x-2 text-red-600">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          
          {isModified && (
            <div className="flex items-center space-x-2 text-orange-600">
              <span>●</span>
              <span>Modified</span>
            </div>
          )}
        </div>

        {/* Right Section - Zoom & Coordinates */}
        <div className="flex items-center space-x-4">
          <span>
            Zoom: {Math.round(zoom * 100)}%
          </span>
          <span>
            Ready
          </span>
        </div>
      </div>
    </div>
  );
};

export default CanvasStatus;

