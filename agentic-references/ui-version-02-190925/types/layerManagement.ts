/**
 * Advanced Layer Management Types
 * Sprint 5C: Advanced Canvas Features
 */

export interface Layer {
  id: string;
  name: string;
  type: 'image' | 'text' | 'shape' | 'group';
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  zIndex: number;
  parentId?: string; // For grouping
  children?: string[]; // For groups
  effects?: LayerEffect[];
  metadata?: LayerMetadata;
}

export interface LayerGroup {
  id: string;
  name: string;
  layers: string[];
  collapsed: boolean;
  visible: boolean;
  locked: boolean;
}

export interface LayerEffect {
  id: string;
  type: 'shadow' | 'glow' | 'blur' | 'color-overlay';
  enabled: boolean;
  properties: Record<string, any>;
}

export interface LayerMetadata {
  createdAt: Date;
  modifiedAt: Date;
  createdBy?: string;
  tags?: string[];
  description?: string;
}

export type BlendMode = 
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'color-dodge'
  | 'color-burn'
  | 'darken'
  | 'lighten'
  | 'difference'
  | 'exclusion';

export interface LayerReorderEvent {
  sourceId: string;
  targetId: string;
  position: 'above' | 'below' | 'inside';
  newZIndex: number;
}

export interface LayerGroupEvent {
  layerIds: string[];
  groupName: string;
  parentId?: string;
}

export interface LayerVisibilityEvent {
  layerIds: string[];
  visible: boolean;
}

export interface LayerLockEvent {
  layerIds: string[];
  locked: boolean;
}

export interface LayerEffectEvent {
  layerId: string;
  effect: LayerEffect;
}

export interface LayerManagementState {
  layers: Layer[];
  groups: LayerGroup[];
  selectedLayers: string[];
  draggedLayer: string | null;
  dropTarget: string | null;
  isReordering: boolean;
}

export interface LayerManagementActions {
  reorderLayer: (event: LayerReorderEvent) => void;
  groupLayers: (event: LayerGroupEvent) => void;
  ungroupLayers: (groupIds: string[]) => void;
  toggleLayerVisibility: (event: LayerVisibilityEvent) => void;
  toggleLayerLock: (event: LayerLockEvent) => void;
  addLayerEffect: (event: LayerEffectEvent) => void;
  removeLayerEffect: (layerId: string, effectId: string) => void;
  updateLayerOpacity: (layerId: string, opacity: number) => void;
  updateLayerBlendMode: (layerId: string, blendMode: BlendMode) => void;
  selectLayer: (layerId: string, multiSelect?: boolean) => void;
  selectLayers: (layerIds: string[]) => void;
  clearSelection: () => void;
  startDrag: (layerId: string) => void;
  endDrag: () => void;
  setDropTarget: (layerId: string | null) => void;
}
