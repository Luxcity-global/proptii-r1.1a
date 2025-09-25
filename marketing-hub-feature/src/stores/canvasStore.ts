import { create } from 'zustand';
import * as fabric from 'fabric';

interface CanvasObject {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

interface CanvasState {
  canvas: fabric.Canvas | null;
  objects: CanvasObject[];
  selectedObjects: fabric.Object[];
  history: CanvasObject[][];
  historyIndex: number;
  isModified: boolean;
  zoom: number;
  pan: { x: number; y: number };
  grid: boolean;
  snapToGrid: boolean;
  isLoading: boolean;
  error: string | null;
}

interface CanvasActions {
  setCanvas: (canvas: fabric.Canvas | null) => void;
  addObject: (object: fabric.Object) => void;
  updateObject: (object: fabric.Object) => void;
  removeObject: (objectId: string) => void;
  setSelection: (objects: fabric.Object[]) => void;
  clearSelection: () => void;
  undo: () => void;
  redo: () => void;
  saveCanvas: () => void;
  loadCanvas: (data: any) => void;
  clearCanvas: () => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetCanvas: () => void;
}

type CanvasStore = CanvasState & CanvasActions;

const initialState: CanvasState = {
  canvas: null,
  objects: [],
  selectedObjects: [],
  history: [],
  historyIndex: -1,
  isModified: false,
  zoom: 1,
  pan: { x: 0, y: 0 },
  grid: false,
  snapToGrid: false,
  isLoading: false,
  error: null
};

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  ...initialState,

  setCanvas: (canvas) => {
    set({ canvas });
    if (canvas) {
      // Initialize canvas settings
      canvas.setZoom(get().zoom);
      canvas.absolutePan(new fabric.Point(get().pan.x, get().pan.y));
    }
  },

  addObject: (object) => {
    const state = get();
    if (!state.canvas) return;

    const canvasObject: CanvasObject = {
      id: (object as any).id || `obj_${Date.now()}`,
      type: object.type || 'unknown',
      data: object.toJSON(),
      timestamp: Date.now()
    };

    const newObjects = [...state.objects, canvasObject];
    const newHistory = [...state.history.slice(0, state.historyIndex + 1), newObjects];

    set({
      objects: newObjects,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      isModified: true
    });
  },

  updateObject: (object) => {
    const state = get();
    if (!state.canvas) return;

    const updatedObjects = state.objects.map(obj => 
      obj.id === (object as any).id 
        ? { ...obj, data: object.toJSON(), timestamp: Date.now() }
        : obj
    );

    const newHistory = [...state.history.slice(0, state.historyIndex + 1), updatedObjects];

    set({
      objects: updatedObjects,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      isModified: true
    });
  },

  removeObject: (objectId) => {
    const state = get();
    if (!state.canvas) return;

    const updatedObjects = state.objects.filter(obj => obj.id !== objectId);
    const newHistory = [...state.history.slice(0, state.historyIndex + 1), updatedObjects];

    set({
      objects: updatedObjects,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      isModified: true
    });
  },

  setSelection: (objects) => {
    set({ selectedObjects: objects });
  },

  clearSelection: () => {
    const state = get();
    if (state.canvas) {
      state.canvas.discardActiveObject();
      state.canvas.renderAll();
    }
    set({ selectedObjects: [] });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      const previousState = state.history[newIndex];
      
      if (state.canvas && previousState) {
        state.canvas.loadFromJSON(previousState, () => {
          state.canvas?.renderAll();
        });
      }

      set({
        objects: previousState || [],
        historyIndex: newIndex,
        isModified: true
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      const nextState = state.history[newIndex];
      
      if (state.canvas && nextState) {
        state.canvas.loadFromJSON(nextState, () => {
          state.canvas?.renderAll();
        });
      }

      set({
        objects: nextState || [],
        historyIndex: newIndex,
        isModified: true
      });
    }
  },

  saveCanvas: () => {
    const state = get();
    if (!state.canvas) return;

    try {
      const canvasData = state.canvas.toJSON();
      localStorage.setItem('canvas_autosave', JSON.stringify(canvasData));
      set({ isModified: false });
    } catch (error) {
      console.error('Failed to save canvas:', error);
      set({ error: 'Failed to save canvas' });
    }
  },

  loadCanvas: (data) => {
    const state = get();
    if (!state.canvas) return;

    try {
      state.canvas.loadFromJSON(data, () => {
        state.canvas?.renderAll();
        const objects = state.canvas?.getObjects().map((obj: any) => ({
          id: obj.id || `obj_${Date.now()}`,
          type: obj.type || 'unknown',
          data: obj.toJSON(),
          timestamp: Date.now()
        })) || [];

        set({
          objects,
          isModified: false,
          error: null
        });
      });
    } catch (error) {
      console.error('Failed to load canvas:', error);
      set({ error: 'Failed to load canvas' });
    }
  },

  clearCanvas: () => {
    const state = get();
    if (!state.canvas) return;

    state.canvas.clear();
    set({
      objects: [],
      selectedObjects: [],
      isModified: true
    });
  },

  setZoom: (zoom) => {
    const state = get();
    if (state.canvas) {
      state.canvas.setZoom(zoom);
      state.canvas.renderAll();
    }
    set({ zoom });
  },

  setPan: (pan) => {
    const state = get();
    if (state.canvas) {
      state.canvas.absolutePan(new fabric.Point(pan.x, pan.y));
    }
    set({ pan });
  },

  toggleGrid: () => {
    const state = get();
    set({ grid: !state.grid });
  },

  toggleSnapToGrid: () => {
    const state = get();
    set({ snapToGrid: !state.snapToGrid });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  resetCanvas: () => {
    const state = get();
    if (state.canvas) {
      state.canvas.dispose();
    }
    set(initialState);
  }
}));
