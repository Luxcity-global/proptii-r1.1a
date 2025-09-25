/**
 * Advanced Layer Management Tests
 * Sprint 5C: Advanced Canvas Features
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Layer, LayerGroup, LayerReorderEvent, LayerGroupEvent, LayerVisibilityEvent, LayerLockEvent, LayerEffectEvent } from '../types/layerManagement';
import {
  LayerReorderManager,
  LayerGroupManager,
  LayerVisibilityManager,
  LayerEffectsManager,
  LayerSelectionManager,
  LayerValidator
} from '../utils/layerManagement';

describe('LayerReorderManager', () => {
  let mockLayers: Layer[];

  beforeEach(() => {
    mockLayers = [
      {
        id: 'layer1',
        name: 'Background',
        type: 'image',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        zIndex: 1
      },
      {
        id: 'layer2',
        name: 'Text',
        type: 'text',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        zIndex: 2
      },
      {
        id: 'layer3',
        name: 'Shape',
        type: 'shape',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        zIndex: 3
      }
    ];
  });

  describe('reorderLayers', () => {
    it('should reorder layers correctly when moving above target', () => {
      const event: LayerReorderEvent = {
        sourceId: 'layer1',
        targetId: 'layer3',
        position: 'above',
        newZIndex: 4
      };

      const result = LayerReorderManager.reorderLayers(mockLayers, event);
      
      expect(result[0].id).toBe('layer2');
      expect(result[1].id).toBe('layer3');
      expect(result[2].id).toBe('layer1');
      expect(result[2].zIndex).toBe(4);
    });

    it('should reorder layers correctly when moving below target', () => {
      const event: LayerReorderEvent = {
        sourceId: 'layer3',
        targetId: 'layer1',
        position: 'below',
        newZIndex: 1
      };

      const result = LayerReorderManager.reorderLayers(mockLayers, event);
      
      expect(result[0].id).toBe('layer3');
      expect(result[1].id).toBe('layer1');
      expect(result[2].id).toBe('layer2');
    });

    it('should handle invalid source layer gracefully', () => {
      const event: LayerReorderEvent = {
        sourceId: 'nonexistent',
        targetId: 'layer2',
        position: 'above',
        newZIndex: 3
      };

      const result = LayerReorderManager.reorderLayers(mockLayers, event);
      expect(result).toEqual(mockLayers);
    });

    it('should handle invalid target layer gracefully', () => {
      const event: LayerReorderEvent = {
        sourceId: 'layer1',
        targetId: 'nonexistent',
        position: 'above',
        newZIndex: 3
      };

      const result = LayerReorderManager.reorderLayers(mockLayers, event);
      expect(result).toEqual(mockLayers);
    });
  });

  describe('updateZIndexes', () => {
    it('should update z-indexes based on layer order', () => {
      const layersWithWrongZIndex = [
        { ...mockLayers[0], zIndex: 10 },
        { ...mockLayers[1], zIndex: 5 },
        { ...mockLayers[2], zIndex: 1 }
      ];

      const result = LayerReorderManager.updateZIndexes(layersWithWrongZIndex);
      
      expect(result[0].zIndex).toBe(1);
      expect(result[1].zIndex).toBe(2);
      expect(result[2].zIndex).toBe(3);
    });
  });

  describe('calculateZIndex', () => {
    it('should calculate correct z-index for first position', () => {
      const zIndex = LayerReorderManager.calculateZIndex(mockLayers, 0);
      expect(zIndex).toBe(0);
    });

    it('should calculate correct z-index for last position', () => {
      const zIndex = LayerReorderManager.calculateZIndex(mockLayers, mockLayers.length);
      expect(zIndex).toBe(4);
    });

    it('should calculate correct z-index for middle position', () => {
      const zIndex = LayerReorderManager.calculateZIndex(mockLayers, 1);
      expect(zIndex).toBe(1);
    });
  });
});

describe('LayerGroupManager', () => {
  let mockLayers: Layer[];
  let mockGroups: LayerGroup[];

  beforeEach(() => {
    mockLayers = [
      {
        id: 'layer1',
        name: 'Background',
        type: 'image',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        zIndex: 1
      },
      {
        id: 'layer2',
        name: 'Text',
        type: 'text',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        zIndex: 2
      }
    ];

    mockGroups = [];
  });

  describe('groupLayers', () => {
    it('should group layers correctly', () => {
      const event: LayerGroupEvent = {
        layerIds: ['layer1', 'layer2'],
        groupName: 'My Group'
      };

      const result = LayerGroupManager.groupLayers(mockLayers, mockGroups, event);
      
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].name).toBe('My Group');
      expect(result.groups[0].layers).toEqual(['layer1', 'layer2']);
      
      expect(result.layers[0].parentId).toBe(result.groups[0].id);
      expect(result.layers[1].parentId).toBe(result.groups[0].id);
    });

    it('should handle invalid layer IDs gracefully', () => {
      const event: LayerGroupEvent = {
        layerIds: ['nonexistent1', 'layer1', 'nonexistent2'],
        groupName: 'My Group'
      };

      const result = LayerGroupManager.groupLayers(mockLayers, mockGroups, event);
      
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].layers).toEqual(['layer1']);
    });

    it('should handle empty layer IDs array', () => {
      const event: LayerGroupEvent = {
        layerIds: [],
        groupName: 'Empty Group'
      };

      const result = LayerGroupManager.groupLayers(mockLayers, mockGroups, event);
      expect(result).toEqual({ layers: mockLayers, groups: mockGroups });
    });
  });

  describe('ungroupLayers', () => {
    it('should ungroup layers correctly', () => {
      const group: LayerGroup = {
        id: 'group1',
        name: 'My Group',
        layers: ['layer1', 'layer2'],
        collapsed: false,
        visible: true,
        locked: false
      };

      const layersWithGroup = mockLayers.map(layer => ({
        ...layer,
        parentId: 'group1'
      }));

      const result = LayerGroupManager.ungroupLayers(
        layersWithGroup,
        [group],
        ['group1']
      );
      
      expect(result.groups).toHaveLength(0);
      expect(result.layers[0].parentId).toBeUndefined();
      expect(result.layers[1].parentId).toBeUndefined();
    });
  });
});

describe('LayerVisibilityManager', () => {
  let mockLayers: Layer[];

  beforeEach(() => {
    mockLayers = [
      {
        id: 'layer1',
        name: 'Background',
        type: 'image',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        zIndex: 1
      },
      {
        id: 'layer2',
        name: 'Text',
        type: 'text',
        visible: false,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        zIndex: 2
      }
    ];
  });

  describe('toggleVisibility', () => {
    it('should toggle visibility for multiple layers', () => {
      const event: LayerVisibilityEvent = {
        layerIds: ['layer1', 'layer2'],
        visible: false
      };

      const result = LayerVisibilityManager.toggleVisibility(mockLayers, event);
      
      expect(result[0].visible).toBe(false);
      expect(result[1].visible).toBe(false);
    });

    it('should handle single layer visibility toggle', () => {
      const event: LayerVisibilityEvent = {
        layerIds: ['layer1'],
        visible: false
      };

      const result = LayerVisibilityManager.toggleVisibility(mockLayers, event);
      
      expect(result[0].visible).toBe(false);
      expect(result[1].visible).toBe(false); // unchanged
    });
  });

  describe('toggleLock', () => {
    it('should toggle lock for multiple layers', () => {
      const event: LayerLockEvent = {
        layerIds: ['layer1', 'layer2'],
        locked: true
      };

      const result = LayerVisibilityManager.toggleLock(mockLayers, event);
      
      expect(result[0].locked).toBe(true);
      expect(result[1].locked).toBe(true);
    });
  });

  describe('getVisibleLayers', () => {
    it('should return only visible layers', () => {
      const visibleLayers = LayerVisibilityManager.getVisibleLayers(mockLayers);
      expect(visibleLayers).toHaveLength(1);
      expect(visibleLayers[0].id).toBe('layer1');
    });
  });

  describe('getUnlockedLayers', () => {
    it('should return only unlocked layers', () => {
      const unlockedLayers = LayerVisibilityManager.getUnlockedLayers(mockLayers);
      expect(unlockedLayers).toHaveLength(2);
    });
  });
});

describe('LayerEffectsManager', () => {
  let mockLayers: Layer[];

  beforeEach(() => {
    mockLayers = [
      {
        id: 'layer1',
        name: 'Background',
        type: 'image',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        zIndex: 1
      }
    ];
  });

  describe('addEffect', () => {
    it('should add effect to layer', () => {
      const event: LayerEffectEvent = {
        layerId: 'layer1',
        effect: {
          id: 'effect1',
          type: 'shadow',
          enabled: true,
          properties: { blur: 10, offsetX: 2, offsetY: 2 }
        }
      };

      const result = LayerEffectsManager.addEffect(mockLayers, event);
      
      expect(result[0].effects).toHaveLength(1);
      expect(result[0].effects![0].type).toBe('shadow');
    });
  });

  describe('removeEffect', () => {
    it('should remove effect from layer', () => {
      const layerWithEffect = [{
        ...mockLayers[0],
        effects: [{
          id: 'effect1',
          type: 'shadow',
          enabled: true,
          properties: {}
        }]
      }];

      const result = LayerEffectsManager.removeEffect(layerWithEffect, 'layer1', 'effect1');
      
      expect(result[0].effects).toHaveLength(0);
    });
  });

  describe('updateOpacity', () => {
    it('should update layer opacity', () => {
      const result = LayerEffectsManager.updateOpacity(mockLayers, 'layer1', 0.5);
      expect(result[0].opacity).toBe(0.5);
    });

    it('should clamp opacity to valid range', () => {
      const result1 = LayerEffectsManager.updateOpacity(mockLayers, 'layer1', -0.5);
      expect(result1[0].opacity).toBe(0);

      const result2 = LayerEffectsManager.updateOpacity(mockLayers, 'layer1', 1.5);
      expect(result2[0].opacity).toBe(1);
    });
  });

  describe('updateBlendMode', () => {
    it('should update layer blend mode', () => {
      const result = LayerEffectsManager.updateBlendMode(mockLayers, 'layer1', 'multiply');
      expect(result[0].blendMode).toBe('multiply');
    });
  });
});

describe('LayerSelectionManager', () => {
  describe('selectLayer', () => {
    it('should select single layer without multi-select', () => {
      const result = LayerSelectionManager.selectLayer(['layer1'], 'layer2', false);
      expect(result).toEqual(['layer2']);
    });

    it('should add layer to selection with multi-select', () => {
      const result = LayerSelectionManager.selectLayer(['layer1'], 'layer2', true);
      expect(result).toEqual(['layer1', 'layer2']);
    });

    it('should remove layer from selection with multi-select if already selected', () => {
      const result = LayerSelectionManager.selectLayer(['layer1', 'layer2'], 'layer1', true);
      expect(result).toEqual(['layer2']);
    });
  });

  describe('selectLayers', () => {
    it('should select multiple layers', () => {
      const result = LayerSelectionManager.selectLayers(['layer1', 'layer2', 'layer3']);
      expect(result).toEqual(['layer1', 'layer2', 'layer3']);
    });
  });

  describe('clearSelection', () => {
    it('should clear all selections', () => {
      const result = LayerSelectionManager.clearSelection();
      expect(result).toEqual([]);
    });
  });

  describe('isSelected', () => {
    it('should return true if layer is selected', () => {
      const result = LayerSelectionManager.isSelected(['layer1', 'layer2'], 'layer1');
      expect(result).toBe(true);
    });

    it('should return false if layer is not selected', () => {
      const result = LayerSelectionManager.isSelected(['layer1', 'layer2'], 'layer3');
      expect(result).toBe(false);
    });
  });
});

describe('LayerValidator', () => {
  describe('validateLayer', () => {
    it('should validate correct layer data', () => {
      const validLayer: Layer = {
        id: 'layer1',
        name: 'Background',
        type: 'image',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        zIndex: 1
      };

      expect(LayerValidator.validateLayer(validLayer)).toBe(true);
    });

    it('should reject layer with missing id', () => {
      const invalidLayer = {
        name: 'Background',
        type: 'image',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        zIndex: 1
      } as Layer;

      expect(LayerValidator.validateLayer(invalidLayer)).toBe(false);
    });

    it('should reject layer with invalid opacity', () => {
      const invalidLayer: Layer = {
        id: 'layer1',
        name: 'Background',
        type: 'image',
        visible: true,
        locked: false,
        opacity: 1.5, // Invalid: > 1
        blendMode: 'normal',
        zIndex: 1
      };

      expect(LayerValidator.validateLayer(invalidLayer)).toBe(false);
    });
  });

  describe('validateGroup', () => {
    it('should validate correct group data', () => {
      const validGroup: LayerGroup = {
        id: 'group1',
        name: 'My Group',
        layers: ['layer1', 'layer2'],
        collapsed: false,
        visible: true,
        locked: false
      };

      expect(LayerValidator.validateGroup(validGroup)).toBe(true);
    });

    it('should reject group with missing id', () => {
      const invalidGroup = {
        name: 'My Group',
        layers: ['layer1', 'layer2'],
        collapsed: false,
        visible: true,
        locked: false
      } as LayerGroup;

      expect(LayerValidator.validateGroup(invalidGroup)).toBe(false);
    });
  });

  describe('validateReorderEvent', () => {
    it('should validate correct reorder event', () => {
      const validEvent: LayerReorderEvent = {
        sourceId: 'layer1',
        targetId: 'layer2',
        position: 'above',
        newZIndex: 3
      };

      expect(LayerValidator.validateReorderEvent(validEvent)).toBe(true);
    });

    it('should reject reorder event with missing sourceId', () => {
      const invalidEvent = {
        targetId: 'layer2',
        position: 'above',
        newZIndex: 3
      } as LayerReorderEvent;

      expect(LayerValidator.validateReorderEvent(invalidEvent)).toBe(false);
    });
  });
});
