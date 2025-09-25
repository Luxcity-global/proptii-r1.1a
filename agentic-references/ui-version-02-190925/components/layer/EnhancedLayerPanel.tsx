/**
 * Enhanced Layer Panel Component
 * Sprint 5C: Advanced Canvas Features
 */

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  GripVertical,
  MoreHorizontal,
  Plus,
  Trash2,
  Copy,
  Group,
  Ungroup,
  Settings,
  Image as ImageIcon,
  Type,
  Square,
  Layers,
  ChevronDown,
  ChevronRight,
  Filter,
  Opacity
} from 'lucide-react';
import { Layer, LayerGroup, BlendMode } from '../../types/layerManagement';
import { useLayerManagement } from '../../hooks/useLayerManagement';

interface EnhancedLayerPanelProps {
  className?: string;
  onLayerSelect?: (layerId: string) => void;
  onLayerUpdate?: (layer: Layer) => void;
}

const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' }
];

export function EnhancedLayerPanel({ 
  className = '', 
  onLayerSelect,
  onLayerUpdate 
}: EnhancedLayerPanelProps) {
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const {
    layers,
    groups,
    selectedLayers,
    draggedLayer,
    dropTarget,
    isReordering,
    reorderLayer,
    groupLayers,
    ungroupLayers,
    toggleLayerVisibility,
    toggleLayerLock,
    updateLayerOpacity,
    updateLayerBlendMode,
    selectLayer,
    selectLayers,
    clearSelection,
    isSelected,
    startDrag,
    endDrag,
    setDropTarget,
    getLayerHierarchy
  } = useLayerManagement({
    onLayerChange: (newLayers) => {
      // Handle layer changes
      console.log('Layers updated:', newLayers);
    },
    onGroupChange: (newGroups) => {
      // Handle group changes
      console.log('Groups updated:', newGroups);
    },
    onSelectionChange: (newSelection) => {
      // Handle selection changes
      console.log('Selection updated:', newSelection);
    }
  });

  const layerHierarchy = getLayerHierarchy();

  const getLayerIcon = (type: Layer['type']) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'text':
        return <Type className="w-4 h-4" />;
      case 'shape':
        return <Square className="w-4 h-4" />;
      case 'group':
        return <Layers className="w-4 h-4" />;
      default:
        return <Square className="w-4 h-4" />;
    }
  };

  const handleDragStart = useCallback((e: React.DragEvent, layerId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', layerId);
    startDrag(layerId);
  }, [startDrag]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    const targetLayer = layerHierarchy[targetIndex];
    
    if (!sourceId || !targetLayer || sourceId === targetLayer.id) {
      setDragOverIndex(null);
      endDrag();
      return;
    }

    const position = e.clientY < e.currentTarget.getBoundingClientRect().top + e.currentTarget.getBoundingClientRect().height / 2 ? 'above' : 'below';
    
    reorderLayer({
      sourceId,
      targetId: targetLayer.id,
      position,
      newZIndex: targetIndex + 1
    });

    setDragOverIndex(null);
    endDrag();
  }, [layerHierarchy, reorderLayer, endDrag]);

  const handleLayerClick = useCallback((layerId: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      selectLayer(layerId, true);
    } else {
      selectLayer(layerId, false);
    }
    onLayerSelect?.(layerId);
  }, [selectLayer, onLayerSelect]);

  const handleGroupLayers = useCallback(() => {
    if (selectedLayers.length < 2) return;
    
    groupLayers({
      layerIds: selectedLayers,
      groupName: groupName || 'New Group'
    });
    
    setGroupName('');
    setIsGroupDialogOpen(false);
  }, [selectedLayers, groupName, groupLayers]);

  const handleUngroupLayers = useCallback(() => {
    const selectedGroups = groups.filter(group => 
      selectedLayers.includes(group.id)
    );
    
    if (selectedGroups.length > 0) {
      ungroupLayers(selectedGroups.map(group => group.id));
    }
  }, [selectedLayers, groups, ungroupLayers]);

  const handleOpacityChange = useCallback((layerId: string, value: number[]) => {
    updateLayerOpacity(layerId, value[0] / 100);
  }, [updateLayerOpacity]);

  const handleBlendModeChange = useCallback((layerId: string, blendMode: BlendMode) => {
    updateLayerBlendMode(layerId, blendMode);
  }, [updateLayerBlendMode]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Layer Panel Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lux-blue-900">Layers</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsGroupDialogOpen(true)}
            disabled={selectedLayers.length < 2}
            title="Group Layers"
          >
            <Group className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUngroupLayers}
            disabled={selectedLayers.length === 0}
            title="Ungroup Layers"
          >
            <Ungroup className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            title="Clear Selection"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Layer List */}
      <ScrollArea className="h-96">
        <div className="space-y-1">
          {layerHierarchy.map((layer, index) => {
            const isLayerSelected = isSelected(layer.id);
            const isDragOver = dragOverIndex === index;
            const isDragging = draggedLayer === layer.id;

            return (
              <div
                key={layer.id}
                ref={dragRef}
                draggable
                onDragStart={(e) => handleDragStart(e, layer.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`
                  group relative flex items-center p-2 rounded-lg border transition-all cursor-pointer
                  ${isLayerSelected 
                    ? 'border-lux-blue-400 bg-lux-blue-50' 
                    : 'border-lux-cream-300 hover:border-lux-blue-300 hover:bg-lux-blue-25'
                  }
                  ${isDragOver ? 'border-lux-orange-400 bg-lux-orange-50' : ''}
                  ${isDragging ? 'opacity-50' : ''}
                  ${isReordering ? 'pointer-events-none' : ''}
                `}
                onClick={(e) => handleLayerClick(layer.id, e)}
              >
                {/* Drag Handle */}
                <div className="mr-2 cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4 text-lux-cream-600" />
                </div>

                {/* Layer Icon */}
                <div className="mr-2 text-lux-blue-600">
                  {getLayerIcon(layer.type)}
                </div>

                {/* Layer Name */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-lux-blue-900 truncate">
                    {layer.name}
                  </span>
                </div>

                {/* Layer Controls */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Visibility Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility({
                        layerIds: [layer.id],
                        visible: !layer.visible
                      });
                    }}
                  >
                    {layer.visible ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                  </Button>

                  {/* Lock Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerLock({
                        layerIds: [layer.id],
                        locked: !layer.locked
                      });
                    }}
                  >
                    {layer.locked ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <Unlock className="w-3 h-3" />
                    )}
                  </Button>

                  {/* More Options */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle more options
                    }}
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Layer Properties Panel */}
      {selectedLayers.length === 1 && (
        <div className="space-y-4 pt-4 border-t border-lux-cream-300">
          <h4 className="font-medium text-lux-blue-900">Layer Properties</h4>
          
          {(() => {
            const selectedLayer = layers.find(l => l.id === selectedLayers[0]);
            if (!selectedLayer) return null;

            return (
              <div className="space-y-3">
                {/* Opacity */}
                <div>
                  <Label className="text-sm text-lux-blue-700">Opacity</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Opacity className="w-4 h-4 text-lux-cream-600" />
                    <Slider
                      value={[selectedLayer.opacity * 100]}
                      onValueChange={(value) => handleOpacityChange(selectedLayer.id, value)}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-lux-cream-600 w-8">
                      {Math.round(selectedLayer.opacity * 100)}%
                    </span>
                  </div>
                </div>

                {/* Blend Mode */}
                <div>
                  <Label className="text-sm text-lux-blue-700">Blend Mode</Label>
                  <Select
                    value={selectedLayer.blendMode}
                    onValueChange={(value) => handleBlendModeChange(selectedLayer.id, value as BlendMode)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BLEND_MODES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Group Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Group Layers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsGroupDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGroupLayers}
                disabled={!groupName.trim()}
              >
                Group Layers
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
