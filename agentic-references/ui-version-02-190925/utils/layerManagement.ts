/**
 * Advanced Layer Management Utilities
 * Sprint 5C: Advanced Canvas Features
 */

import { Layer, LayerGroup, LayerReorderEvent, LayerGroupEvent, LayerVisibilityEvent, LayerLockEvent, LayerEffectEvent, BlendMode } from '../types/layerManagement';

/**
 * Layer Reordering Utilities
 */
export class LayerReorderManager {
  /**
   * Reorder layers based on drag and drop events
   */
  static reorderLayers(
    layers: Layer[],
    event: LayerReorderEvent
  ): Layer[] {
    const { sourceId, targetId, position, newZIndex } = event;
    
    // Find source and target layers
    const sourceLayer = layers.find(l => l.id === sourceId);
    const targetLayer = layers.find(l => l.id === targetId);
    
    if (!sourceLayer || !targetLayer) {
      console.warn('Source or target layer not found for reordering');
      return layers;
    }

    // Remove source layer from current position
    const layersWithoutSource = layers.filter(l => l.id !== sourceId);
    
    // Find target index
    const targetIndex = layersWithoutSource.findIndex(l => l.id === targetId);
    
    if (targetIndex === -1) {
      console.warn('Target layer not found in layers array');
      return layers;
    }

    // Calculate new index based on position
    let newIndex: number;
    switch (position) {
      case 'above':
        newIndex = targetIndex + 1;
        break;
      case 'below':
        newIndex = targetIndex;
        break;
      case 'inside':
        // For grouping - handled separately
        return layers;
      default:
        newIndex = targetIndex;
    }

    // Insert source layer at new position
    const reorderedLayers = [...layersWithoutSource];
    reorderedLayers.splice(newIndex, 0, { ...sourceLayer, zIndex: newZIndex });

    // Update z-index for all layers to maintain order
    return this.updateZIndexes(reorderedLayers);
  }

  /**
   * Update z-index values for all layers based on their position
   */
  static updateZIndexes(layers: Layer[]): Layer[] {
    return layers.map((layer, index) => ({
      ...layer,
      zIndex: index + 1
    }));
  }

  /**
   * Calculate new z-index for a layer at a specific position
   */
  static calculateZIndex(layers: Layer[], targetIndex: number): number {
    if (targetIndex === 0) {
      return layers.length > 0 ? layers[0].zIndex - 1 : 1;
    }
    
    if (targetIndex >= layers.length) {
      return layers.length > 0 ? layers[layers.length - 1].zIndex + 1 : 1;
    }
    
    const prevLayer = layers[targetIndex - 1];
    const nextLayer = layers[targetIndex];
    
    return Math.floor((prevLayer.zIndex + nextLayer.zIndex) / 2);
  }
}

/**
 * Layer Grouping Utilities
 */
export class LayerGroupManager {
  /**
   * Group multiple layers together
   */
  static groupLayers(
    layers: Layer[],
    groups: LayerGroup[],
    event: LayerGroupEvent
  ): { layers: Layer[]; groups: LayerGroup[] } {
    const { layerIds, groupName, parentId } = event;
    
    // Validate layer IDs exist
    const validLayerIds = layerIds.filter(id => 
      layers.some(layer => layer.id === id)
    );
    
    if (validLayerIds.length === 0) {
      console.warn('No valid layers found for grouping');
      return { layers, groups };
    }

    // Create new group
    const newGroup: LayerGroup = {
      id: `group-${Date.now()}`,
      name: groupName,
      layers: validLayerIds,
      collapsed: false,
      visible: true,
      locked: false
    };

    // Update layers to reference the group
    const updatedLayers = layers.map(layer => {
      if (validLayerIds.includes(layer.id)) {
        return {
          ...layer,
          parentId: newGroup.id,
          zIndex: this.calculateGroupZIndex(layers, validLayerIds)
        };
      }
      return layer;
    });

    return {
      layers: updatedLayers,
      groups: [...groups, newGroup]
    };
  }

  /**
   * Ungroup layers from their groups
   */
  static ungroupLayers(
    layers: Layer[],
    groups: LayerGroup[],
    groupIds: string[]
  ): { layers: Layer[]; groups: LayerGroup[] } {
    const updatedLayers = layers.map(layer => {
      if (layer.parentId && groupIds.includes(layer.parentId)) {
        return {
          ...layer,
          parentId: undefined,
          zIndex: this.calculateUngroupedZIndex(layers, layer)
        };
      }
      return layer;
    });

    const updatedGroups = groups.filter(group => 
      !groupIds.includes(group.id)
    );

    return {
      layers: updatedLayers,
      groups: updatedGroups
    };
  }

  /**
   * Calculate z-index for grouped layers
   */
  private static calculateGroupZIndex(layers: Layer[], layerIds: string[]): number {
    const groupLayers = layers.filter(l => layerIds.includes(l.id));
    return Math.max(...groupLayers.map(l => l.zIndex));
  }

  /**
   * Calculate z-index for ungrouped layers
   */
  private static calculateUngroupedZIndex(layers: Layer[], layer: Layer): number {
    const maxZIndex = Math.max(...layers.map(l => l.zIndex));
    return maxZIndex + 1;
  }
}

/**
 * Layer Visibility and Locking Utilities
 */
export class LayerVisibilityManager {
  /**
   * Toggle visibility for multiple layers
   */
  static toggleVisibility(
    layers: Layer[],
    event: LayerVisibilityEvent
  ): Layer[] {
    const { layerIds, visible } = event;
    
    return layers.map(layer => {
      if (layerIds.includes(layer.id)) {
        return { ...layer, visible };
      }
      return layer;
    });
  }

  /**
   * Toggle lock for multiple layers
   */
  static toggleLock(
    layers: Layer[],
    event: LayerLockEvent
  ): Layer[] {
    const { layerIds, locked } = event;
    
    return layers.map(layer => {
      if (layerIds.includes(layer.id)) {
        return { ...layer, locked };
      }
      return layer;
    });
  }

  /**
   * Get visible layers
   */
  static getVisibleLayers(layers: Layer[]): Layer[] {
    return layers.filter(layer => layer.visible);
  }

  /**
   * Get unlocked layers
   */
  static getUnlockedLayers(layers: Layer[]): Layer[] {
    return layers.filter(layer => !layer.locked);
  }
}

/**
 * Layer Effects Utilities
 */
export class LayerEffectsManager {
  /**
   * Add effect to a layer
   */
  static addEffect(
    layers: Layer[],
    event: LayerEffectEvent
  ): Layer[] {
    const { layerId, effect } = event;
    
    return layers.map(layer => {
      if (layer.id === layerId) {
        const effects = layer.effects || [];
        return {
          ...layer,
          effects: [...effects, effect]
        };
      }
      return layer;
    });
  }

  /**
   * Remove effect from a layer
   */
  static removeEffect(
    layers: Layer[],
    layerId: string,
    effectId: string
  ): Layer[] {
    return layers.map(layer => {
      if (layer.id === layerId) {
        const effects = (layer.effects || []).filter(e => e.id !== effectId);
        return {
          ...layer,
          effects
        };
      }
      return layer;
    });
  }

  /**
   * Update layer opacity
   */
  static updateOpacity(
    layers: Layer[],
    layerId: string,
    opacity: number
  ): Layer[] {
    return layers.map(layer => {
      if (layer.id === layerId) {
        return { ...layer, opacity: Math.max(0, Math.min(1, opacity)) };
      }
      return layer;
    });
  }

  /**
   * Update layer blend mode
   */
  static updateBlendMode(
    layers: Layer[],
    layerId: string,
    blendMode: BlendMode
  ): Layer[] {
    return layers.map(layer => {
      if (layer.id === layerId) {
        return { ...layer, blendMode };
      }
      return layer;
    });
  }
}

/**
 * Layer Selection Utilities
 */
export class LayerSelectionManager {
  /**
   * Select a single layer
   */
  static selectLayer(
    selectedLayers: string[],
    layerId: string,
    multiSelect: boolean = false
  ): string[] {
    if (multiSelect) {
      if (selectedLayers.includes(layerId)) {
        return selectedLayers.filter(id => id !== layerId);
      } else {
        return [...selectedLayers, layerId];
      }
    } else {
      return [layerId];
    }
  }

  /**
   * Select multiple layers
   */
  static selectLayers(layerIds: string[]): string[] {
    return [...layerIds];
  }

  /**
   * Clear all selections
   */
  static clearSelection(): string[] {
    return [];
  }

  /**
   * Check if layer is selected
   */
  static isSelected(selectedLayers: string[], layerId: string): boolean {
    return selectedLayers.includes(layerId);
  }
}

/**
 * Layer Validation Utilities
 */
export class LayerValidator {
  /**
   * Validate layer data
   */
  static validateLayer(layer: Layer): boolean {
    return !!(
      layer.id &&
      layer.name &&
      layer.type &&
      typeof layer.visible === 'boolean' &&
      typeof layer.locked === 'boolean' &&
      layer.opacity >= 0 &&
      layer.opacity <= 1 &&
      layer.zIndex >= 0
    );
  }

  /**
   * Validate layer group data
   */
  static validateGroup(group: LayerGroup): boolean {
    return !!(
      group.id &&
      group.name &&
      Array.isArray(group.layers) &&
      typeof group.collapsed === 'boolean' &&
      typeof group.visible === 'boolean' &&
      typeof group.locked === 'boolean'
    );
  }

  /**
   * Validate layer reorder event
   */
  static validateReorderEvent(event: LayerReorderEvent): boolean {
    return !!(
      event.sourceId &&
      event.targetId &&
      event.position &&
      event.newZIndex >= 0
    );
  }
}
