/**
 * Advanced Layer Management Hook
 * Sprint 5C: Advanced Canvas Features
 */

import { useState, useCallback, useMemo } from 'react';
import { Layer, LayerGroup, LayerReorderEvent, LayerGroupEvent, LayerVisibilityEvent, LayerLockEvent, LayerEffectEvent, BlendMode } from '../types/layerManagement';
import {
  LayerReorderManager,
  LayerGroupManager,
  LayerVisibilityManager,
  LayerEffectsManager,
  LayerSelectionManager,
  LayerValidator
} from '../utils/layerManagement';

export interface UseLayerManagementOptions {
  initialLayers?: Layer[];
  initialGroups?: LayerGroup[];
  onLayerChange?: (layers: Layer[]) => void;
  onGroupChange?: (groups: LayerGroup[]) => void;
  onSelectionChange?: (selectedLayers: string[]) => void;
}

export interface UseLayerManagementReturn {
  // State
  layers: Layer[];
  groups: LayerGroup[];
  selectedLayers: string[];
  draggedLayer: string | null;
  dropTarget: string | null;
  isReordering: boolean;

  // Layer Operations
  reorderLayer: (event: LayerReorderEvent) => void;
  groupLayers: (event: LayerGroupEvent) => void;
  ungroupLayers: (groupIds: string[]) => void;
  toggleLayerVisibility: (event: LayerVisibilityEvent) => void;
  toggleLayerLock: (event: LayerLockEvent) => void;
  addLayerEffect: (event: LayerEffectEvent) => void;
  removeLayerEffect: (layerId: string, effectId: string) => void;
  updateLayerOpacity: (layerId: string, opacity: number) => void;
  updateLayerBlendMode: (layerId: string, blendMode: BlendMode) => void;

  // Selection Operations
  selectLayer: (layerId: string, multiSelect?: boolean) => void;
  selectLayers: (layerIds: string[]) => void;
  clearSelection: () => void;
  isSelected: (layerId: string) => boolean;

  // Drag and Drop Operations
  startDrag: (layerId: string) => void;
  endDrag: () => void;
  setDropTarget: (layerId: string | null) => void;

  // Utility Functions
  getLayerById: (layerId: string) => Layer | undefined;
  getLayersByType: (type: Layer['type']) => Layer[];
  getVisibleLayers: () => Layer[];
  getUnlockedLayers: () => Layer[];
  getSelectedLayers: () => Layer[];
  getLayerHierarchy: () => Layer[];
  validateLayer: (layer: Layer) => boolean;
  validateGroup: (group: LayerGroup) => boolean;
}

export function useLayerManagement(options: UseLayerManagementOptions = {}): UseLayerManagementReturn {
  const {
    initialLayers = [],
    initialGroups = [],
    onLayerChange,
    onGroupChange,
    onSelectionChange
  } = options;

  // State
  const [layers, setLayers] = useState<Layer[]>(initialLayers);
  const [groups, setGroups] = useState<LayerGroup[]>(initialGroups);
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Layer Operations
  const reorderLayer = useCallback((event: LayerReorderEvent) => {
    if (!LayerValidator.validateReorderEvent(event)) {
      console.warn('Invalid reorder event:', event);
      return;
    }

    setIsReordering(true);
    
    setLayers(prevLayers => {
      const newLayers = LayerReorderManager.reorderLayers(prevLayers, event);
      onLayerChange?.(newLayers);
      return newLayers;
    });

    // Reset reordering state after a short delay
    setTimeout(() => setIsReordering(false), 100);
  }, [onLayerChange]);

  const groupLayers = useCallback((event: LayerGroupEvent) => {
    setLayers(prevLayers => {
      setGroups(prevGroups => {
        const result = LayerGroupManager.groupLayers(prevLayers, prevGroups, event);
        onLayerChange?.(result.layers);
        onGroupChange?.(result.groups);
        return result.groups;
      });
      return prevLayers;
    });
  }, [onLayerChange, onGroupChange]);

  const ungroupLayers = useCallback((groupIds: string[]) => {
    setLayers(prevLayers => {
      setGroups(prevGroups => {
        const result = LayerGroupManager.ungroupLayers(prevLayers, prevGroups, groupIds);
        onLayerChange?.(result.layers);
        onGroupChange?.(result.groups);
        return result.groups;
      });
      return prevLayers;
    });
  }, [onLayerChange, onGroupChange]);

  const toggleLayerVisibility = useCallback((event: LayerVisibilityEvent) => {
    setLayers(prevLayers => {
      const newLayers = LayerVisibilityManager.toggleVisibility(prevLayers, event);
      onLayerChange?.(newLayers);
      return newLayers;
    });
  }, [onLayerChange]);

  const toggleLayerLock = useCallback((event: LayerLockEvent) => {
    setLayers(prevLayers => {
      const newLayers = LayerVisibilityManager.toggleLock(prevLayers, event);
      onLayerChange?.(newLayers);
      return newLayers;
    });
  }, [onLayerChange]);

  const addLayerEffect = useCallback((event: LayerEffectEvent) => {
    setLayers(prevLayers => {
      const newLayers = LayerEffectsManager.addEffect(prevLayers, event);
      onLayerChange?.(newLayers);
      return newLayers;
    });
  }, [onLayerChange]);

  const removeLayerEffect = useCallback((layerId: string, effectId: string) => {
    setLayers(prevLayers => {
      const newLayers = LayerEffectsManager.removeEffect(prevLayers, layerId, effectId);
      onLayerChange?.(newLayers);
      return newLayers;
    });
  }, [onLayerChange]);

  const updateLayerOpacity = useCallback((layerId: string, opacity: number) => {
    setLayers(prevLayers => {
      const newLayers = LayerEffectsManager.updateOpacity(prevLayers, layerId, opacity);
      onLayerChange?.(newLayers);
      return newLayers;
    });
  }, [onLayerChange]);

  const updateLayerBlendMode = useCallback((layerId: string, blendMode: BlendMode) => {
    setLayers(prevLayers => {
      const newLayers = LayerEffectsManager.updateBlendMode(prevLayers, layerId, blendMode);
      onLayerChange?.(newLayers);
      return newLayers;
    });
  }, [onLayerChange]);

  // Selection Operations
  const selectLayer = useCallback((layerId: string, multiSelect: boolean = false) => {
    setSelectedLayers(prevSelected => {
      const newSelected = LayerSelectionManager.selectLayer(prevSelected, layerId, multiSelect);
      onSelectionChange?.(newSelected);
      return newSelected;
    });
  }, [onSelectionChange]);

  const selectLayers = useCallback((layerIds: string[]) => {
    setSelectedLayers(prevSelected => {
      const newSelected = LayerSelectionManager.selectLayers(layerIds);
      onSelectionChange?.(newSelected);
      return newSelected;
    });
  }, [onSelectionChange]);

  const clearSelection = useCallback(() => {
    setSelectedLayers(prevSelected => {
      const newSelected = LayerSelectionManager.clearSelection();
      onSelectionChange?.(newSelected);
      return newSelected;
    });
  }, [onSelectionChange]);

  const isSelected = useCallback((layerId: string) => {
    return LayerSelectionManager.isSelected(selectedLayers, layerId);
  }, [selectedLayers]);

  // Drag and Drop Operations
  const startDrag = useCallback((layerId: string) => {
    setDraggedLayer(layerId);
  }, []);

  const endDrag = useCallback(() => {
    setDraggedLayer(null);
    setDropTarget(null);
  }, []);

  const setDropTarget = useCallback((layerId: string | null) => {
    setDropTarget(layerId);
  }, []);

  // Utility Functions
  const getLayerById = useCallback((layerId: string) => {
    return layers.find(layer => layer.id === layerId);
  }, [layers]);

  const getLayersByType = useCallback((type: Layer['type']) => {
    return layers.filter(layer => layer.type === type);
  }, [layers]);

  const getVisibleLayers = useCallback(() => {
    return LayerVisibilityManager.getVisibleLayers(layers);
  }, [layers]);

  const getUnlockedLayers = useCallback(() => {
    return LayerVisibilityManager.getUnlockedLayers(layers);
  }, [layers]);

  const getSelectedLayers = useCallback(() => {
    return layers.filter(layer => selectedLayers.includes(layer.id));
  }, [layers, selectedLayers]);

  const getLayerHierarchy = useCallback(() => {
    // Sort layers by z-index and group them by parent
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
    const hierarchy: Layer[] = [];

    // Add ungrouped layers first
    const ungroupedLayers = sortedLayers.filter(layer => !layer.parentId);
    hierarchy.push(...ungroupedLayers);

    // Add grouped layers
    groups.forEach(group => {
      const groupLayers = sortedLayers.filter(layer => layer.parentId === group.id);
      hierarchy.push(...groupLayers);
    });

    return hierarchy;
  }, [layers, groups]);

  const validateLayer = useCallback((layer: Layer) => {
    return LayerValidator.validateLayer(layer);
  }, []);

  const validateGroup = useCallback((group: LayerGroup) => {
    return LayerValidator.validateGroup(group);
  }, []);

  // Memoized values
  const memoizedReturn = useMemo(() => ({
    // State
    layers,
    groups,
    selectedLayers,
    draggedLayer,
    dropTarget,
    isReordering,

    // Layer Operations
    reorderLayer,
    groupLayers,
    ungroupLayers,
    toggleLayerVisibility,
    toggleLayerLock,
    addLayerEffect,
    removeLayerEffect,
    updateLayerOpacity,
    updateLayerBlendMode,

    // Selection Operations
    selectLayer,
    selectLayers,
    clearSelection,
    isSelected,

    // Drag and Drop Operations
    startDrag,
    endDrag,
    setDropTarget,

    // Utility Functions
    getLayerById,
    getLayersByType,
    getVisibleLayers,
    getUnlockedLayers,
    getSelectedLayers,
    getLayerHierarchy,
    validateLayer,
    validateGroup
  }), [
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
    addLayerEffect,
    removeLayerEffect,
    updateLayerOpacity,
    updateLayerBlendMode,
    selectLayer,
    selectLayers,
    clearSelection,
    isSelected,
    startDrag,
    endDrag,
    setDropTarget,
    getLayerById,
    getLayersByType,
    getVisibleLayers,
    getUnlockedLayers,
    getSelectedLayers,
    getLayerHierarchy,
    validateLayer,
    validateGroup
  ]);

  return memoizedReturn;
}
