// marketing-hub-feature/src/stores/canvasStoreEnhanced.ts
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import * as fabric from 'fabric';
import { TemplateService } from '../services/templateService';
import type { Template } from '../types/database';

interface CanvasObject {
  id: string;
  type: string;
  data: any; // Fabric.js object JSON data
  timestamp: number;
}

interface CanvasSettings {
  zoom: number;
  pan: { x: number; y: number };
  grid: boolean;
  snapToGrid: boolean;
  backgroundColor: string;
  width: number;
  height: number;
}

interface DrawingBrushSettings {
  color: string;
  width: number;
  shadowColor: string;
  shadowBlur: number;
}

interface CanvasState {
  canvas: fabric.Canvas | null;
  objects: CanvasObject[];
  selectedObjects: fabric.Object[];
  history: CanvasObject[][];
  historyIndex: number;
  isModified: boolean;
  isLoading: boolean;
  error: string | null;
  canvasSettings: CanvasSettings;
  currentTool: 'select' | 'draw' | 'rectangle' | 'circle' | 'text' | 'image' | 'delete';
  drawingBrush: fabric.BaseBrush | null;
  drawingBrushSettings: DrawingBrushSettings;
  autoSaveInterval: number; // in milliseconds
  lastSaveTimestamp: number;
}

interface CanvasActions {
  setCanvas: (canvas: fabric.Canvas | null) => void;
  addObject: (object: fabric.Object) => void;
  updateObject: (object: fabric.Object) => void;
  removeObject: (objectId: string) => void;
  setSelection: (objects: fabric.Object[]) => void;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
  saveCanvas: () => void;
  loadCanvas: (data: any) => void;
  setError: (error: string | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  setIsLoading: (isLoading: boolean) => void;
  setCanvasSettings: (settings: Partial<CanvasSettings>) => void;
  setCurrentTool: (tool: CanvasState['currentTool']) => void;
  setDrawingBrush: (brush: fabric.BaseBrush) => void;
  setDrawingBrushSettings: (settings: Partial<DrawingBrushSettings>) => void;
  addRectangle: (options?: fabric.IRectOptions) => void;
  addCircle: (options?: fabric.ICircleOptions) => void;
  addText: (text: string, options?: fabric.ITextOptions) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  alignObjects: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeObjects: (axis: 'horizontal' | 'vertical') => void;
  loadTemplate: (templateId: string) => Promise<boolean>;
  loadTemplateData: (template: Template) => Promise<boolean>;
  addImageFromUrl: (url: string, options?: fabric.IImageOptions) => Promise<fabric.Image | null>;
  exportCanvas: (format: 'png' | 'jpg' | 'svg' | 'json') => Promise<string | null>;
}

const HISTORY_LIMIT = 50; // Limit history states for performance

export const useCanvasStoreEnhanced = create<CanvasState & CanvasActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
          canvas: null,
          objects: [],
          selectedObjects: [],
          history: [[]],
          historyIndex: 0,
          isModified: false,
          isLoading: false,
          error: null,
          canvasSettings: {
            zoom: 1,
            pan: { x: 0, y: 0 },
            grid: false,
            snapToGrid: false,
            backgroundColor: '#f8f8f8',
            width: 1200,
            height: 800,
          },
          currentTool: 'select',
          drawingBrush: null,
          drawingBrushSettings: {
            color: '#000000',
            width: 5,
            shadowColor: 'rgba(0,0,0,0.5)',
            shadowBlur: 0,
          },
          autoSaveInterval: 5000, // 5 seconds
          lastSaveTimestamp: Date.now(),

          setCanvas: (canvas) => {
            set({ canvas });
            if (canvas) {
              const { drawingBrushSettings } = get();
              const brush = new fabric.PencilBrush(canvas);
              Object.assign(brush, drawingBrushSettings);
              set({ drawingBrush: brush });
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
              history: newHistory.slice(-HISTORY_LIMIT), // Keep history limited
              historyIndex: Math.min(newHistory.length - 1, HISTORY_LIMIT - 1),
              isModified: true,
              lastSaveTimestamp: Date.now(),
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
              history: newHistory.slice(-HISTORY_LIMIT),
              historyIndex: Math.min(newHistory.length - 1, HISTORY_LIMIT - 1),
              isModified: true,
              lastSaveTimestamp: Date.now(),
            });
          },

          removeObject: (objectId) => {
            const state = get();
            if (!state.canvas) return;

            const filteredObjects = state.objects.filter(obj => obj.id !== objectId);
            const newHistory = [...state.history.slice(0, state.historyIndex + 1), filteredObjects];

            set({
              objects: filteredObjects,
              history: newHistory.slice(-HISTORY_LIMIT),
              historyIndex: Math.min(newHistory.length - 1, HISTORY_LIMIT - 1),
              isModified: true,
              selectedObjects: state.selectedObjects.filter(o => (o as any).id !== objectId),
              lastSaveTimestamp: Date.now(),
            });
          },

          setSelection: (objects) => set({ selectedObjects: objects }),

          clearCanvas: () => {
            const state = get();
            if (!state.canvas) return;
            
            state.canvas.clear();
            const newHistory = [...state.history.slice(0, state.historyIndex + 1), []];
            set({
              objects: [],
              selectedObjects: [],
              history: newHistory.slice(-HISTORY_LIMIT),
              historyIndex: Math.min(newHistory.length - 1, HISTORY_LIMIT - 1),
              isModified: true,
              lastSaveTimestamp: Date.now(),
            });
          },

          undo: () => {
            const state = get();
            if (state.historyIndex > 0) {
              const newIndex = state.historyIndex - 1;
              set({
                objects: state.history[newIndex],
                historyIndex: newIndex,
                isModified: true,
              });
              state.canvas?.loadFromJSON({ objects: state.history[newIndex].map(obj => obj.data) }, () => {
                state.canvas?.renderAll();
              });
            }
          },

          redo: () => {
            const state = get();
            if (state.historyIndex < state.history.length - 1) {
              const newIndex = state.historyIndex + 1;
              set({
                objects: state.history[newIndex],
                historyIndex: newIndex,
                isModified: true,
              });
              state.canvas?.loadFromJSON({ objects: state.history[newIndex].map(obj => obj.data) }, () => {
                state.canvas?.renderAll();
              });
            }
          },

          saveCanvas: () => {
            set({ isModified: false });
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

                const newHistory = [...state.history.slice(0, state.historyIndex + 1), objects];

                set({
                  objects,
                  isModified: false,
                  error: null,
                  history: newHistory.slice(-HISTORY_LIMIT),
                  historyIndex: Math.min(newHistory.length - 1, HISTORY_LIMIT - 1),
                });
              });
            } catch (e: any) {
              set({ error: `Failed to load canvas: ${e.message}` });
            }
          },

          setError: (error) => set({ error }),

          setZoom: (zoom) => {
            set((state) => ({ canvasSettings: { ...state.canvasSettings, zoom } }));
          },

          setPan: (pan) => {
            set((state) => ({ canvasSettings: { ...state.canvasSettings, pan } }));
          },

          toggleGrid: () => {
            set((state) => ({
              canvasSettings: { ...state.canvasSettings, grid: !state.canvasSettings.grid }
            }));
          },

          toggleSnapToGrid: () => {
            set((state) => ({
              canvasSettings: { ...state.canvasSettings, snapToGrid: !state.canvasSettings.snapToGrid }
            }));
          },

          setIsLoading: (isLoading) => set({ isLoading }),

          setCanvasSettings: (settings) => {
            set((state) => ({
              canvasSettings: { ...state.canvasSettings, ...settings }
            }));
          },

          setCurrentTool: (tool) => set({ currentTool: tool }),

          setDrawingBrush: (brush) => set({ drawingBrush: brush }),

          setDrawingBrushSettings: (settings) => {
            set((state) => ({
              drawingBrushSettings: { ...state.drawingBrushSettings, ...settings }
            }));
          },

          addRectangle: (options = {}) => {
            const state = get();
            if (!state.canvas) return;

            const rect = new fabric.Rect({
              left: 100,
              top: 100,
              width: 100,
              height: 100,
              fill: '#ff6b6b',
              stroke: '#333',
              strokeWidth: 2,
              ...options
            });

            state.canvas.add(rect);
            state.canvas.setActiveObject(rect);
            state.canvas.renderAll();
          },

          addCircle: (options = {}) => {
            const state = get();
            if (!state.canvas) return;

            const circle = new fabric.Circle({
              left: 100,
              top: 100,
              radius: 50,
              fill: '#4ecdc4',
              stroke: '#333',
              strokeWidth: 2,
              ...options
            });

            state.canvas.add(circle);
            state.canvas.setActiveObject(circle);
            state.canvas.renderAll();
          },

          addText: (text, options = {}) => {
            const state = get();
            if (!state.canvas) return;

            const textObject = new fabric.Textbox(text, {
              left: 100,
              top: 100,
              fontSize: 20,
              fill: '#333',
              fontFamily: 'Arial',
              ...options
            });

            state.canvas.add(textObject);
            state.canvas.setActiveObject(textObject);
            state.canvas.renderAll();
          },

          duplicateSelected: () => {
            const state = get();
            if (!state.canvas || state.selectedObjects.length === 0) return;

            state.selectedObjects.forEach(obj => {
              obj.clone((cloned: fabric.Object) => {
                cloned.set({
                  left: (cloned.left || 0) + 20,
                  top: (cloned.top || 0) + 20,
                });
                state.canvas!.add(cloned);
              });
            });
            state.canvas.renderAll();
          },

          deleteSelected: () => {
            const state = get();
            if (!state.canvas || state.selectedObjects.length === 0) return;

            state.selectedObjects.forEach(obj => {
              state.canvas!.remove(obj);
            });
            state.canvas.discardActiveObject();
            state.canvas.renderAll();
          },

          bringForward: () => {
            const state = get();
            if (!state.canvas || state.selectedObjects.length === 0) return;

            state.selectedObjects.forEach(obj => {
              state.canvas!.bringForward(obj);
            });
            state.canvas.renderAll();
          },

          sendBackward: () => {
            const state = get();
            if (!state.canvas || state.selectedObjects.length === 0) return;

            state.selectedObjects.forEach(obj => {
              state.canvas!.sendBackwards(obj);
            });
            state.canvas.renderAll();
          },

          bringToFront: () => {
            const state = get();
            if (!state.canvas || state.selectedObjects.length === 0) return;

            state.selectedObjects.forEach(obj => {
              state.canvas!.bringToFront(obj);
            });
            state.canvas.renderAll();
          },

          sendToBack: () => {
            const state = get();
            if (!state.canvas || state.selectedObjects.length === 0) return;

            state.selectedObjects.forEach(obj => {
              state.canvas!.sendToBack(obj);
            });
            state.canvas.renderAll();
          },

          groupSelected: () => {
            const state = get();
            if (!state.canvas || state.selectedObjects.length < 2) return;

            const group = new fabric.Group(state.selectedObjects, {
              left: state.canvas.getCenter().left,
              top: state.canvas.getCenter().top,
            });

            state.canvas.remove(...state.selectedObjects);
            state.canvas.add(group);
            state.canvas.setActiveObject(group);
            state.canvas.renderAll();
          },

          ungroupSelected: () => {
            const state = get();
            if (!state.canvas || state.selectedObjects.length === 0) return;

            const group = state.selectedObjects[0];
            if (group instanceof fabric.Group) {
              const objects = group.getObjects();
              group.toActiveSelection();
              state.canvas.remove(group);
              objects.forEach(obj => {
                state.canvas!.add(obj);
              });
              state.canvas.renderAll();
            }
          },

          alignObjects: (alignment) => {
            const state = get();
            if (!state.canvas || state.selectedObjects.length < 2) return;

            const selection = state.selectedObjects;
            const bounds = new fabric.Group(selection).getBoundingRect();

            selection.forEach(obj => {
              switch (alignment) {
                case 'left':
                  obj.set('left', bounds.left);
                  break;
                case 'center':
                  obj.set('left', bounds.left + bounds.width / 2 - (obj.width || 0) / 2);
                  break;
                case 'right':
                  obj.set('left', bounds.left + bounds.width - (obj.width || 0));
                  break;
                case 'top':
                  obj.set('top', bounds.top);
                  break;
                case 'middle':
                  obj.set('top', bounds.top + bounds.height / 2 - (obj.height || 0) / 2);
                  break;
                case 'bottom':
                  obj.set('top', bounds.top + bounds.height - (obj.height || 0));
                  break;
              }
              obj.setCoords();
            });

            state.canvas.renderAll();
          },

          distributeObjects: (axis) => {
            const state = get();
            if (!state.canvas || state.selectedObjects.length < 3) return;

            const selection = state.selectedObjects.sort((a, b) => {
              if (axis === 'horizontal') {
                return (a.left || 0) - (b.left || 0);
              } else {
                return (a.top || 0) - (b.top || 0);
              }
            });

            const bounds = new fabric.Group(selection).getBoundingRect();
            const spacing = axis === 'horizontal' 
              ? bounds.width / (selection.length - 1)
              : bounds.height / (selection.length - 1);

            selection.forEach((obj, index) => {
              if (axis === 'horizontal') {
                obj.set('left', bounds.left + index * spacing - (obj.width || 0) / 2);
              } else {
                obj.set('top', bounds.top + index * spacing - (obj.height || 0) / 2);
              }
              obj.setCoords();
            });

            state.canvas.renderAll();
          },

          loadTemplate: async (templateId: string) => {
            const state = get();
            set({ isLoading: true, error: null });

            try {
              const result = await TemplateService.loadTemplate(templateId);
              
              if (result.success && result.template) {
                await state.loadTemplateData(result.template);
                await TemplateService.recordTemplateUsage(templateId);
                return true;
              } else {
                set({ error: result.error || 'Failed to load template' });
                return false;
              }
            } catch (error: any) {
              set({ error: error.message || 'Failed to load template' });
              return false;
            } finally {
              set({ isLoading: false });
            }
          },

          loadTemplateData: async (template: Template) => {
            const state = get();
            if (!state.canvas || !template.canvas_data) return false;

            try {
              // Clear current canvas
              state.canvas.clear();

              // Load template data
              await new Promise<void>((resolve, reject) => {
                state.canvas!.loadFromJSON(template.canvas_data, () => {
                  state.canvas!.renderAll();
                  resolve();
                });
              });

              // Update canvas settings if template has specific dimensions
              if (template.metadata?.dimensions) {
                const { width, height } = template.metadata.dimensions;
                state.canvas!.setDimensions({ width, height });
                state.setCanvasSettings({ width, height });
              }

              // Update objects in store
              const objects = state.canvas.getObjects().map((obj: any) => ({
                id: obj.id || `obj_${Date.now()}`,
                type: obj.type || 'unknown',
                data: obj.toJSON(),
                timestamp: Date.now()
              }));

              const newHistory = [...state.history.slice(0, state.historyIndex + 1), objects];

              set({
                objects,
                history: newHistory.slice(-HISTORY_LIMIT),
                historyIndex: Math.min(newHistory.length - 1, HISTORY_LIMIT - 1),
                isModified: true,
                error: null,
              });

              return true;
            } catch (error: any) {
              set({ error: `Failed to load template data: ${error.message}` });
              return false;
            }
          },

          addImageFromUrl: async (url: string, options = {}) => {
            const state = get();
            if (!state.canvas) return null;

            try {
              return new Promise((resolve, reject) => {
                fabric.Image.fromURL(url, (img) => {
                  if (img) {
                    // Scale image to fit canvas if too large
                    const maxWidth = state.canvas!.width! * 0.5;
                    const maxHeight = state.canvas!.height! * 0.5;
                    
                    if (img.width! > maxWidth || img.height! > maxHeight) {
                      const scale = Math.min(maxWidth / img.width!, maxHeight / img.height!);
                      img.scale(scale);
                    }

                    img.set({
                      left: 100,
                      top: 100,
                      ...options
                    });

                    state.canvas!.add(img);
                    state.canvas!.setActiveObject(img);
                    state.canvas!.renderAll();
                    resolve(img);
                  } else {
                    reject(new Error('Failed to load image'));
                  }
                }, {
                  crossOrigin: 'anonymous'
                });
              });
            } catch (error: any) {
              set({ error: `Failed to add image: ${error.message}` });
              return null;
            }
          },

          exportCanvas: async (format: 'png' | 'jpg' | 'svg' | 'json') => {
            const state = get();
            if (!state.canvas) return null;

            try {
              switch (format) {
                case 'png':
                case 'jpg':
                  return state.canvas.toDataURL({
                    format,
                    quality: 0.9,
                    multiplier: 2 // Higher resolution
                  });
                case 'svg':
                  return state.canvas.toSVG();
                case 'json':
                  return JSON.stringify(state.canvas.toJSON());
                default:
                  throw new Error(`Unsupported export format: ${format}`);
              }
            } catch (error: any) {
              set({ error: `Export failed: ${error.message}` });
              return null;
            }
          },
        }),
        {
          name: 'canvas-store-enhanced',
          partialize: (state) => ({
            objects: state.objects,
            canvasSettings: state.canvasSettings,
            drawingBrushSettings: state.drawingBrushSettings,
          }),
        }
      ),
      {
        name: 'canvas-store-enhanced',
      }
    )
  );