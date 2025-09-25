/**
 * Alignment and Distribution Toolbar
 * Professional object alignment, distribution, and positioning tools
 */

import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  DistributeVertical,
  DistributeHorizontal,
  Move,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Grid3x3,
  Target,
  Ruler,
  MousePointer,
  Square,
  Circle,
  Triangle
} from 'lucide-react';
import { useCanvasStoreEnhanced } from '../../stores/canvasStoreEnhanced';

interface AlignmentToolbarProps {
  className?: string;
}

export const AlignmentToolbar: React.FC<AlignmentToolbarProps> = ({
  className = ''
}) => {
  const { 
    selectedObjectIds,
    canvasObjects,
    updateObject,
    alignObjects,
    distributeObjects,
    duplicateObjects,
    deleteObjects,
    lockObjects,
    unlockObjects,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward
  } = useCanvasStoreEnhanced();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [snapToObjects, setSnapToObjects] = useState(true);

  const selectedObjects = canvasObjects.filter(obj => 
    selectedObjectIds.includes(obj.id)
  );

  const hasSelection = selectedObjects.length > 0;
  const hasMultipleSelection = selectedObjects.length > 1;

  // Alignment functions
  const handleAlign = useCallback((type: string) => {
    if (!hasSelection) return;
    alignObjects(selectedObjectIds, type);
  }, [selectedObjectIds, hasSelection, alignObjects]);

  // Distribution functions  
  const handleDistribute = useCallback((direction: 'horizontal' | 'vertical') => {
    if (selectedObjects.length < 3) return;
    distributeObjects(selectedObjectIds, direction);
  }, [selectedObjectIds, selectedObjects.length, distributeObjects]);

  // Transform functions
  const handleFlip = useCallback((direction: 'horizontal' | 'vertical') => {
    selectedObjectIds.forEach(id => {
      const obj = canvasObjects.find(o => o.id === id);
      if (!obj) return;

      const updates = direction === 'horizontal' 
        ? { flipX: !obj.data.flipX }
        : { flipY: !obj.data.flipY };

      updateObject(id, updates);
    });
  }, [selectedObjectIds, canvasObjects, updateObject]);

  const handleRotate = useCallback((angle: number) => {
    selectedObjectIds.forEach(id => {
      const obj = canvasObjects.find(o => o.id === id);
      if (!obj) return;

      updateObject(id, { 
        angle: (obj.data.angle || 0) + angle 
      });
    });
  }, [selectedObjectIds, canvasObjects, updateObject]);

  // Position and sizing
  const handlePosition = useCallback((position: string) => {
    // Implementation for positioning relative to canvas
    // This would use canvas dimensions for positioning
    handleAlign(position);
  }, [handleAlign]);

  if (!hasSelection) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-3 ${className}`}>
        <div className="text-center text-sm text-gray-500">
          <MousePointer className="w-5 h-5 mx-auto mb-2 text-gray-400" />
          Select objects to see alignment tools
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              Alignment & Position
            </span>
            <Badge variant="secondary" className="text-xs">
              {selectedObjects.length} selected
            </Badge>
          </div>
          
          <div className="flex items-center space-x-1">
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
      </div>

      <div className="p-4 space-y-4">
        {/* Object Alignment */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Align Objects
          </h4>
          
          <div className="grid grid-cols-3 gap-2">
            {/* Horizontal Alignment */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAlign('left')}
              className="flex flex-col items-center py-3 h-auto"
              title="Align Left"
            >
              <AlignStartVertical className="w-4 h-4 mb-1" />
              <span className="text-xs">Left</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAlign('center')}
              className="flex flex-col items-center py-3 h-auto"
              title="Align Center"
            >
              <AlignCenterVertical className="w-4 h-4 mb-1" />
              <span className="text-xs">Center</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAlign('right')}
              className="flex flex-col items-center py-3 h-auto"
              title="Align Right"
            >
              <AlignEndVertical className="w-4 h-4 mb-1" />
              <span className="text-xs">Right</span>
            </Button>

            {/* Vertical Alignment */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAlign('top')}
              className="flex flex-col items-center py-3 h-auto"
              title="Align Top"
            >
              <AlignStartHorizontal className="w-4 h-4 mb-1" />
              <span className="text-xs">Top</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAlign('middle')}
              className="flex flex-col items-center py-3 h-auto"
              title="Align Middle"
            >
              <AlignCenterHorizontal className="w-4 h-4 mb-1" />
              <span className="text-xs">Middle</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAlign('bottom')}
              className="flex flex-col items-center py-3 h-auto"
              title="Align Bottom"
            >
              <AlignEndHorizontal className="w-4 h-4 mb-1" />
              <span className="text-xs">Bottom</span>
            </Button>
          </div>
        </div>

        {/* Distribution (only show if 3+ objects) */}
        {hasMultipleSelection && selectedObjects.length >= 3 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Distribute Objects
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDistribute('horizontal')}
                className="flex items-center justify-center space-x-2"
              >
                <DistributeHorizontal className="w-4 h-4" />
                <span className="text-xs">Horizontal</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDistribute('vertical')}
                className="flex items-center justify-center space-x-2"
              >
                <DistributeVertical className="w-4 h-4" />
                <span className="text-xs">Vertical</span>
              </Button>
            </div>
          </div>
        )}

        {/* Transform Controls */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Transform
          </h4>
          
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFlip('horizontal')}
              className="flex flex-col items-center py-2 h-auto"
              title="Flip Horizontal"
            >
              <FlipHorizontal className="w-4 h-4 mb-1" />
              <span className="text-xs">Flip H</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFlip('vertical')}
              className="flex flex-col items-center py-2 h-auto"
              title="Flip Vertical"
            >
              <FlipVertical className="w-4 h-4 mb-1" />
              <span className="text-xs">Flip V</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRotate(90)}
              className="flex flex-col items-center py-2 h-auto"
              title="Rotate 90°"
            >
              <RotateCcw className="w-4 h-4 mb-1" />
              <span className="text-xs">90°</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRotate(-90)}
              className="flex flex-col items-center py-2 h-auto"
              title="Rotate -90°"
            >
              <RotateCcw className="w-4 h-4 mb-1 scale-x-[-1]" />
              <span className="text-xs">-90°</span>
            </Button>
          </div>
        </div>

        {/* Advanced Controls */}
        {showAdvanced && (
          <>
            {/* Layer Order */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Layer Order
              </h4>
              
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bringToFront(selectedObjectIds)}
                  className="text-xs"
                >
                  To Front
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bringForward(selectedObjectIds)}
                  className="text-xs"
                >
                  Forward
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendBackward(selectedObjectIds)}
                  className="text-xs"
                >
                  Backward
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendToBack(selectedObjectIds)}
                  className="text-xs"
                >
                  To Back
                </Button>
              </div>
            </div>

            {/* Snap Settings */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Snap Settings
              </h4>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                    className="rounded"
                  />
                  <Grid3x3 className="w-3 h-3" />
                  <span className="text-xs">Snap to Grid</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={snapToObjects}
                    onChange={(e) => setSnapToObjects(e.target.checked)}
                    className="rounded"
                  />
                  <Square className="w-3 h-3" />
                  <span className="text-xs">Snap to Objects</span>
                </label>
              </div>
            </div>
          </>
        )}

        {/* Object Actions */}
        <div className="pt-3 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => duplicateObjects(selectedObjectIds)}
              className="flex items-center justify-center space-x-1"
            >
              <Copy className="w-3 h-3" />
              <span className="text-xs">Copy</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const lockedObjects = selectedObjects.filter(obj => obj.data.locked);
                if (lockedObjects.length > 0) {
                  unlockObjects(selectedObjectIds);
                } else {
                  lockObjects(selectedObjectIds);
                }
              }}
              className="flex items-center justify-center space-x-1"
            >
              {selectedObjects.some(obj => obj.data.locked) ? (
                <Unlock className="w-3 h-3" />
              ) : (
                <Lock className="w-3 h-3" />
              )}
              <span className="text-xs">
                {selectedObjects.some(obj => obj.data.locked) ? 'Unlock' : 'Lock'}
              </span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteObjects(selectedObjectIds)}
              className="flex items-center justify-center space-x-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
              <span className="text-xs">Delete</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlignmentToolbar;

