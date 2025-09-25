import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ToolTray } from './ToolTray';
import type { ToolTrayItem, ToolTraySection } from './ToolTray';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Move,
  Copy,
  Trash2,
  MoreHorizontal,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  Palette,
  Type,
  Image,
  Square,
  GripVertical,
  FolderOpen,
  Folder,
  MousePointer,
  RotateCcw,
  Settings
} from 'lucide-react';
import { useCanvasStoreEnhanced } from '../../stores/canvasStoreEnhanced';

interface Layer extends ToolTrayItem {
  layer_type: 'text' | 'image' | 'shape' | 'group' | 'background';
  visible: boolean;
  locked: boolean;
  opacity: number;
  blend_mode: string;
  order: number;
  children?: Layer[];
  parent_id?: string;
  selected: boolean;
  expanded?: boolean; // For group layers
  depth: number; // For hierarchy visualization
  fabricObjectId?: string; // Link to fabric.js object
}

interface LayersToolTrayProps {
  onLayerSelect?: (layer: Layer) => void;
  onLayerDoubleClick?: (layer: Layer) => void;
  onLayerDragStart?: (layer: Layer) => void;
  className?: string;
}

export const LayersToolTray: React.FC<LayersToolTrayProps> = ({
  onLayerSelect,
  onLayerDoubleClick,
  onLayerDragStart,
  className = ''
}) => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [draggedLayer, setDraggedLayer] = useState<Layer | null>(null);
  const [dragOverLayer, setDragOverLayer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const dragCounter = useRef(0);
  
  const { 
    canvasObjects, 
    updateObject, 
    removeObject, 
    addObject,
    selectObjects,
    selectedObjectIds 
  } = useCanvasStoreEnhanced();

  // Mock layers data - in real app this would come from canvas objects
  const mockLayers: Layer[] = [
    {
      id: 'bg-1',
      name: 'Background',
      description: 'Canvas background layer',
      thumbnail: '',
      category: 'background',
      tags: ['background'],
      metadata: {},
      layer_type: 'background',
      visible: true,
      locked: true,
      opacity: 1,
      blend_mode: 'normal',
      order: 0,
      selected: false,
      depth: 0,
      fabricObjectId: 'bg-fabric-1'
    },
    {
      id: 'group-1',
      name: 'Property Info',
      description: 'Property information group',
      thumbnail: '',
      category: 'group',
      tags: ['group'],
      metadata: {},
      layer_type: 'group',
      visible: true,
      locked: false,
      opacity: 1,
      blend_mode: 'normal',
      order: 1,
      selected: false,
      expanded: true,
      depth: 0,
      children: [
        {
          id: 'text-1',
          name: 'Property Title',
          description: 'Main property title text',
          thumbnail: '',
          category: 'text',
          tags: ['title', 'text'],
          metadata: {},
          layer_type: 'text',
          visible: true,
          locked: false,
          opacity: 1,
          blend_mode: 'normal',
          order: 2,
          selected: true,
          depth: 1,
          parent_id: 'group-1',
          fabricObjectId: 'text-fabric-1'
        },
        {
          id: 'text-2',
          name: 'Property Price',
          description: 'Property price text',
          thumbnail: '',
          category: 'text',
          tags: ['price', 'text'],
          metadata: {},
          layer_type: 'text',
          visible: true,
          locked: false,
          opacity: 0.9,
          blend_mode: 'normal',
          order: 3,
          selected: false,
          depth: 1,
          parent_id: 'group-1',
          fabricObjectId: 'text-fabric-2'
        }
      ]
    },
    {
      id: 'image-1',
      name: 'Property Photo',
      description: 'Main property image',
      thumbnail: '/api/placeholder/100/60',
      category: 'image',
      tags: ['photo', 'property'],
      metadata: {},
      layer_type: 'image',
      visible: true,
      locked: false,
      opacity: 1,
      blend_mode: 'normal',
      order: 4,
      selected: false,
      depth: 0,
      fabricObjectId: 'image-fabric-1'
    },
    {
      id: 'shape-1',
      name: 'CTA Button',
      description: 'Call-to-action button',
      thumbnail: '',
      category: 'shape',
      tags: ['button', 'cta'],
      metadata: {},
      layer_type: 'shape',
      visible: true,
      locked: false,
      opacity: 1,
      blend_mode: 'multiply',
      order: 5,
      selected: false,
      depth: 0,
      fabricObjectId: 'shape-fabric-1'
    }
  ];

  useEffect(() => {
    setLayers(mockLayers);
  }, []);

  // Flatten layer hierarchy for display
  const flattenLayers = (layerList: Layer[]): Layer[] => {
    const result: Layer[] = [];
    
    const flatten = (layers: Layer[], currentDepth: number = 0) => {
      layers.forEach(layer => {
        result.push({ ...layer, depth: currentDepth });
        if (layer.children && layer.expanded) {
          flatten(layer.children, currentDepth + 1);
        }
      });
    };
    
    flatten(layerList);
    return result.sort((a, b) => b.order - a.order); // Reverse order for visual stacking
  };

  // Filter layers based on search
  const filteredLayers = flattenLayers(layers).filter(layer =>
    layer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    layer.layer_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Drag and Drop Handlers
  const handleDragStart = useCallback((e: React.DragEvent, layer: Layer) => {
    if (layer.locked) return;
    
    setDraggedLayer(layer);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', layer.id);
    onLayerDragStart?.(layer);
  }, [onLayerDragStart]);

  const handleDragEnter = useCallback((e: React.DragEvent, targetLayer: Layer) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOverLayer(targetLayer.id);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverLayer(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetLayer: Layer) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOverLayer(null);

    if (!draggedLayer || draggedLayer.id === targetLayer.id) return;

    // Reorder layers
    const newLayers = [...layers];
    const draggedIndex = newLayers.findIndex(l => l.id === draggedLayer.id);
    const targetIndex = newLayers.findIndex(l => l.id === targetLayer.id);

    if (draggedIndex > -1 && targetIndex > -1) {
      // Update order values
      const draggedOrder = draggedLayer.order;
      const targetOrder = targetLayer.order;
      
      newLayers[draggedIndex].order = targetOrder;
      newLayers[targetIndex].order = draggedOrder;
      
      setLayers(newLayers);
    }

    setDraggedLayer(null);
  }, [draggedLayer, layers]);

  // Layer Control Handlers
  const toggleVisibility = useCallback((layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer.children 
        ? { ...layer, children: layer.children.map(child => 
            child.id === layerId ? { ...child, visible: !child.visible } : child
          )}
        : layer
    ));
  }, []);

  const toggleLock = useCallback((layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, locked: !layer.locked }
        : layer.children 
        ? { ...layer, children: layer.children.map(child => 
            child.id === layerId ? { ...child, locked: !child.locked } : child
          )}
        : layer
    ));
  }, []);

  const toggleExpanded = useCallback((layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, expanded: !layer.expanded }
        : layer
    ));
  }, []);

  const selectLayer = useCallback((layerId: string, multiSelect: boolean = false) => {
    if (multiSelect) {
      setSelectedLayers(prev => 
        prev.includes(layerId) 
          ? prev.filter(id => id !== layerId)
          : [...prev, layerId]
      );
    } else {
      setSelectedLayers([layerId]);
    }
    
    const layer = flattenLayers(layers).find(l => l.id === layerId);
    if (layer) {
      onLayerSelect?.(layer);
    }
  }, [layers, onLayerSelect]);

  const deleteLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
    setSelectedLayers(prev => prev.filter(id => id !== layerId));
  }, []);

  const duplicateLayer = useCallback((layerId: string) => {
    const layer = flattenLayers(layers).find(l => l.id === layerId);
    if (!layer) return;

    const newLayer: Layer = {
      ...layer,
      id: `${layer.id}-copy-${Date.now()}`,
      name: `${layer.name} Copy`,
      order: layer.order + 0.1,
      selected: false
    };

    setLayers(prev => [...prev, newLayer]);
  }, [layers]);

  const createGroup = useCallback(() => {
    if (selectedLayers.length < 2) return;

    const layersToGroup = flattenLayers(layers).filter(l => selectedLayers.includes(l.id));
    const groupId = `group-${Date.now()}`;
    const maxOrder = Math.max(...layersToGroup.map(l => l.order));

    const newGroup: Layer = {
      id: groupId,
      name: `Group ${Date.now()}`,
      description: 'Layer group',
      thumbnail: '',
      category: 'group',
      tags: ['group'],
      metadata: {},
      layer_type: 'group',
      visible: true,
      locked: false,
      opacity: 1,
      blend_mode: 'normal',
      order: maxOrder + 1,
      selected: false,
      expanded: true,
      depth: 0,
      children: layersToGroup.map(layer => ({ ...layer, parent_id: groupId, depth: 1 }))
    };

    // Remove grouped layers from main list and add group
    setLayers(prev => [
      ...prev.filter(l => !selectedLayers.includes(l.id)),
      newGroup
    ]);

    setSelectedLayers([groupId]);
  }, [selectedLayers, layers]);

  const ungroupLayers = useCallback((groupId: string) => {
    const group = layers.find(l => l.id === groupId);
    if (!group || group.layer_type !== 'group' || !group.children) return;

    const ungroupedLayers = group.children.map(child => ({
      ...child,
      parent_id: undefined,
      depth: 0
    }));

    setLayers(prev => [
      ...prev.filter(l => l.id !== groupId),
      ...ungroupedLayers
    ]);

    setSelectedLayers(ungroupedLayers.map(l => l.id));
  }, [layers]);

  // Get icon for layer type
  const getLayerIcon = (layerType: string) => {
    switch (layerType) {
      case 'text': return <Type className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'shape': return <Square className="w-4 h-4" />;
      case 'group': return <Folder className="w-4 h-4" />;
      case 'background': return <Palette className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Layers className="w-5 h-5 mr-2" />
            Layers
          </h2>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={() => {}}>
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {}}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search layers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {filteredLayers.map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              isSelected={selectedLayers.includes(layer.id)}
              isDraggedOver={dragOverLayer === layer.id}
              onSelect={selectLayer}
              onToggleVisibility={toggleVisibility}
              onToggleLock={toggleLock}
              onToggleExpanded={toggleExpanded}
              onDelete={deleteLayer}
              onDuplicate={duplicateLayer}
              onDragStart={handleDragStart}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              getLayerIcon={getLayerIcon}
            />
          ))}
        </div>
      </div>

      {/* Layer Controls Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{filteredLayers.length} layers</span>
          <div className="flex items-center space-x-2">
            {selectedLayers.length >= 2 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={createGroup}
              >
                <FolderOpen className="w-3 h-3 mr-1" />
                Group
              </Button>
            )}
            {selectedLayers.length === 1 && 
             flattenLayers(layers).find(l => l.id === selectedLayers[0])?.layer_type === 'group' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => ungroupLayers(selectedLayers[0])}
              >
                <Folder className="w-3 h-3 mr-1" />
                Ungroup
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-xs">
              <Copy className="w-3 h-3 mr-1" />
              Duplicate
            </Button>
            <Button variant="ghost" size="sm" className="text-xs text-red-600">
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// LayerItem Component
interface LayerItemProps {
  layer: Layer;
  isSelected: boolean;
  isDraggedOver: boolean;
  onSelect: (layerId: string, multiSelect?: boolean) => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onToggleExpanded: (layerId: string) => void;
  onDelete: (layerId: string) => void;
  onDuplicate: (layerId: string) => void;
  onDragStart: (e: React.DragEvent, layer: Layer) => void;
  onDragEnter: (e: React.DragEvent, layer: Layer) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, layer: Layer) => void;
  getLayerIcon: (layerType: string) => React.ReactNode;
}

const LayerItem: React.FC<LayerItemProps> = ({
  layer,
  isSelected,
  isDraggedOver,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onToggleExpanded,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  getLayerIcon
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(layer.id, e.ctrlKey || e.metaKey);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (layer.layer_type === 'group') {
      onToggleExpanded(layer.id);
    }
  };

  return (
    <>
      <div
        className={`
          group relative flex items-center px-2 py-1.5 rounded cursor-pointer
          transition-all duration-150 ease-in-out
          ${isSelected 
            ? 'bg-blue-100 border border-blue-300' 
            : 'hover:bg-gray-100 border border-transparent'
          }
          ${isDraggedOver ? 'bg-blue-50 border-blue-400 border-dashed' : ''}
          ${layer.locked ? 'opacity-75' : ''}
        `}
        style={{ paddingLeft: `${8 + layer.depth * 16}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        draggable={!layer.locked}
        onDragStart={(e) => onDragStart(e, layer)}
        onDragEnter={(e) => onDragEnter(e, layer)}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, layer)}
      >
        {/* Drag Handle */}
        {!layer.locked && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity mr-1">
            <GripVertical className="w-3 h-3 text-gray-400" />
          </div>
        )}

        {/* Expand/Collapse for Groups */}
        {layer.layer_type === 'group' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpanded(layer.id);
            }}
            className="mr-1 p-0.5 hover:bg-gray-200 rounded"
          >
            {layer.expanded ? (
              <ChevronDown className="w-3 h-3 text-gray-600" />
            ) : (
              <ChevronUp className="w-3 h-3 text-gray-600" />
            )}
          </button>
        )}

        {/* Layer Icon */}
        <div className="mr-2 text-gray-600">
          {getLayerIcon(layer.layer_type)}
        </div>

        {/* Layer Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-900 truncate">
              {layer.name}
            </span>
            {layer.opacity < 1 && (
              <span className="ml-2 text-xs text-gray-500">
                {Math.round(layer.opacity * 100)}%
              </span>
            )}
            {layer.blend_mode !== 'normal' && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {layer.blend_mode}
              </Badge>
            )}
          </div>
        </div>

        {/* Layer Controls */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Visibility Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(layer.id);
            }}
            className="p-1 hover:bg-gray-200 rounded"
            title={layer.visible ? 'Hide layer' : 'Show layer'}
          >
            {layer.visible ? (
              <Eye className="w-3 h-3 text-gray-600" />
            ) : (
              <EyeOff className="w-3 h-3 text-gray-400" />
            )}
          </button>

          {/* Lock Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock(layer.id);
            }}
            className="p-1 hover:bg-gray-200 rounded"
            title={layer.locked ? 'Unlock layer' : 'Lock layer'}
          >
            {layer.locked ? (
              <Lock className="w-3 h-3 text-gray-600" />
            ) : (
              <Unlock className="w-3 h-3 text-gray-400" />
            )}
          </button>

          {/* More Options */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e);
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <MoreHorizontal className="w-3 h-3 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]"
          style={{ 
            left: contextMenuPosition.x, 
            top: contextMenuPosition.y 
          }}
          onMouseLeave={() => setShowContextMenu(false)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(layer.id);
              setShowContextMenu(false);
            }}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center"
          >
            <Copy className="w-3 h-3 mr-2" />
            Duplicate
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(layer.id);
              setShowContextMenu(false);
            }}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center text-red-600"
          >
            <Trash2 className="w-3 h-3 mr-2" />
            Delete
          </button>
        </div>
      )}
    </>
  );
};

export default LayersToolTray;
