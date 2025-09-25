import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as fabric from 'fabric';
import { useCanvasStoreEnhanced } from '../../stores/canvasStoreEnhanced';
import { useToolTrayStore } from '../../stores/toolTrayStore';
import { CanvasLoadingIndicator } from './CanvasLoadingIndicator';
// import { PerformanceDashboard } from '../performance/PerformanceDashboard';
// import { usePerformanceMonitor } from '../../utils/performance';
import { DragDropService } from '../../services/dragDropService';
import { CanvasErrorBoundary } from '../error/CanvasErrorBoundary';
import { handleCanvasError } from '../../utils/errorHandler';
import { RecoveryService } from '../../services/recoveryService';

interface CanvasEnhancedProps {
  width?: number;
  height?: number;
  onCanvasReady?: (canvas: fabric.Canvas) => void;
}

export const CanvasEnhanced: React.FC<CanvasEnhancedProps> = ({
  width = 1200,
  height = 800,
  onCanvasReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragDropHandlerRef = useRef<any>(null);
  const [dragDropError, setDragDropError] = useState<string | null>(null);

  const {
    canvas,
    objects,
    selectedObjects,
    setCanvas,
    addObject,
    updateObject,
    removeObject,
    setSelection,
    undo,
    redo,
    saveCanvas,
    loadCanvas,
    canvasSettings,
    setZoom,
    setPan,
    toggleGrid,
    toggleSnapToGrid,
    isLoading,
    setIsLoading,
    error,
    setError,
    currentTool,
    setCurrentTool,
    drawingBrush,
    setDrawingBrush,
    addRectangle,
    addCircle,
    addText,
    duplicateSelected,
    deleteSelected,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    groupSelected,
    ungroupSelected,
    alignObjects,
    distributeObjects,
    loadTemplate,
    loadTemplateData,
    addImageFromUrl,
    exportCanvas,
  } = useCanvasStoreEnhanced();

  // Extract zoom and pan from canvasSettings with fallbacks
  const zoom = canvasSettings?.zoom || 1;
  const pan = canvasSettings?.pan || { x: 0, y: 0 };
  const grid = canvasSettings?.grid || false;
  const snapToGrid = canvasSettings?.snapToGrid || false;

  const { activeToolTray } = useToolTrayStore();
  // const { fps, memoryUsage, renderTime } = usePerformanceMonitor(fabricCanvasRef.current);

  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    setIsLoading(true);
    setError(null);

    const newCanvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#f8f8f8',
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      stateful: true,
      defaultCursor: 'default',
      moveCursor: 'move',
      hoverCursor: 'pointer',
      rotationCursor: 'crosshair',
      selectionColor: 'rgba(59, 130, 246, 0.3)',
      selectionBorderColor: '#3b82f6',
      selectionLineWidth: 2,
      stopContextMenu: true, // Prevent right-click context menu
    });

    fabricCanvasRef.current = newCanvas;
    setCanvas(newCanvas);
    onCanvasReady?.(newCanvas);

    // Apply initial zoom and pan
    newCanvas.setZoom(zoom);
    newCanvas.absolutePan(new fabric.Point(pan.x, pan.y));

    // Load existing objects from store
    if (objects && objects.length > 0) {
      newCanvas.loadFromJSON({ objects: objects.map(obj => obj.data) }, () => {
        newCanvas.renderAll();
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }

    // Event Listeners
    newCanvas.on('object:added', (e: any) => {
      if (e.target) {
        addObject(e.target);
        saveCanvas();
      }
    });

    newCanvas.on('object:modified', (e: any) => {
      if (e.target) {
        updateObject(e.target);
        saveCanvas();
      }
    });

    newCanvas.on('selection:created', (e: any) => {
      setSelection(e.selected || []);
    });

    newCanvas.on('selection:updated', (e: any) => {
      setSelection(e.selected || []);
    });

    newCanvas.on('selection:cleared', () => {
      setSelection([]);
    });

    newCanvas.on('mouse:wheel', (opt: any) => {
      const delta = opt.e.deltaY;
      let newZoom = newCanvas.getZoom() * (0.999 ** delta);
      newZoom = Math.max(0.1, Math.min(newZoom, 5)); // Clamp zoom between 0.1 and 5
      setZoom(newZoom);
      newCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, newZoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    newCanvas.on('mouse:down', (opt: any) => {
      if (opt.e.altKey === true) { // Alt + click for panning
        newCanvas.isDragging = true;
        newCanvas.selection = false;
        newCanvas.lastPosX = opt.e.clientX;
        newCanvas.lastPosY = opt.e.clientY;
        newCanvas.defaultCursor = 'grabbing';
        newCanvas.hoverCursor = 'grabbing';
      }
    });

    newCanvas.on('mouse:move', (opt: any) => {
      if (newCanvas.isDragging) {
        const e = opt.e;
        const vpt = newCanvas.viewportTransform;
        if (vpt) {
          vpt[4] += e.clientX - newCanvas.lastPosX;
          vpt[5] += e.clientY - newCanvas.lastPosY;
          newCanvas.requestRenderAll();
          setPan({ x: vpt[4], y: vpt[5] });
          newCanvas.lastPosX = e.clientX;
          newCanvas.lastPosY = e.clientY;
        }
      }
    });

    newCanvas.on('mouse:up', () => {
      newCanvas.isDragging = false;
      newCanvas.selection = true;
      newCanvas.defaultCursor = 'default';
      newCanvas.hoverCursor = 'pointer';
    });

    return () => {
      newCanvas.dispose();
      setCanvas(null);
    };
  }, [width, height, onCanvasReady, setCanvas, addObject, updateObject, setSelection, saveCanvas, objects, zoom, pan, setZoom, setPan, setIsLoading, setError]);

  // Setup drag and drop
  const setupDragDrop = useCallback(() => {
    if (!canvasRef.current || !fabricCanvasRef.current) return;

    try {
      dragDropHandlerRef.current = DragDropService.setupCanvasDragDrop(canvasRef.current, {
        onDragEnter: () => {
          setDragDropError(null);
        },
        onDragLeave: () => {
          setDragDropError(null);
        },
        onDrop: (type: 'image' | 'template', data: any) => {
          console.log(`Dropped ${type}:`, data);
          setDragDropError(null);
        },
        onError: (error: string) => {
          setDragDropError(error);
          console.error('Drag drop error:', error);
        }
      });
    } catch (error: any) {
      console.error('Failed to setup drag and drop:', error);
      setDragDropError(error.message);
    }
  }, []);

  useEffect(() => {
    const cleanup = initializeCanvas();
    return cleanup;
  }, [initializeCanvas]);

  // Setup drag and drop after canvas is ready
  useEffect(() => {
    if (fabricCanvasRef.current && canvasRef.current) {
      setupDragDrop();
    }

    return () => {
      if (dragDropHandlerRef.current) {
        DragDropService.cleanup();
      }
    };
  }, [setupDragDrop]);

  // Update canvas properties when store state changes
  useEffect(() => {
    if (canvas) {
      canvas.setZoom(zoom);
      canvas.absolutePan(new fabric.Point(pan.x, pan.y));
      canvas.renderAll();
    }
  }, [canvas, zoom, pan]);

  // Handle tool changes
  useEffect(() => {
    if (canvas) {
      canvas.isDrawingMode = currentTool === 'draw';
      canvas.selection = currentTool === 'select';
      canvas.defaultCursor = currentTool === 'select' ? 'default' : 'crosshair';
      canvas.hoverCursor = currentTool === 'select' ? 'pointer' : 'crosshair';

      if (currentTool === 'draw' && drawingBrush) {
        canvas.freeDrawingBrush = drawingBrush;
      }
    }
  }, [canvas, currentTool, drawingBrush]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvas) return;

      if (e.ctrlKey || e.metaKey) { // Ctrl/Cmd
        if (e.key === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        } else if (e.key === 'a') {
          e.preventDefault();
          canvas.discardActiveObject();
          const allObjects = canvas.getObjects();
          if (allObjects.length > 0) {
            const selection = new fabric.ActiveSelection(allObjects, { canvas });
            canvas.setActiveObject(selection);
            canvas.requestRenderAll();
          }
        } else if (e.key === 'd') {
          e.preventDefault();
          duplicateSelected();
        } else if (e.key === 'g') {
          e.preventDefault();
          groupSelected();
        } else if (e.key === 'u') {
          e.preventDefault();
          ungroupSelected();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        bringForward();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        sendBackward();
      } else if (e.key === 'Home') {
        e.preventDefault();
        bringToFront();
      } else if (e.key === 'End') {
        e.preventDefault();
        sendToBack();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvas, undo, redo, duplicateSelected, deleteSelected, bringForward, sendBackward, bringToFront, sendToBack, groupSelected, ungroupSelected]);

  const renderGrid = () => {
    if (!canvas || !grid) return null;

    const gridWidth = canvas.width || width;
    const gridHeight = canvas.height || height;
    const gridSize = 20; // pixels
    const gridColor = '#ccc';

    const lines = [];
    for (let i = 0; i < gridWidth / gridSize; i++) {
      lines.push(
        <line
          key={`v-${i}`}
          x1={i * gridSize}
          y1={0}
          x2={i * gridSize}
          y2={gridHeight}
          stroke={gridColor}
          strokeWidth="0.5"
        />
      );
    }
    for (let i = 0; i < gridHeight / gridSize; i++) {
      lines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={i * gridSize}
          x2={gridWidth}
          y2={i * gridSize}
          stroke={gridColor}
          strokeWidth="0.5"
        />
      );
    }
    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        width={gridWidth}
        height={gridHeight}
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: '0 0',
        }}
      >
        {lines}
      </svg>
    );
  };

  const onCanvasError = useCallback((error: Error, errorInfo: any) => {
    handleCanvasError(error, {
      component: 'CanvasEnhanced',
      action: 'canvas_operation',
      canvasState: {
        objectCount: objects.length,
        zoom,
        pan
      }
    });

    // Save recovery state
    try {
      RecoveryService.saveRecoveryState({
        objects,
        canvasSettings: { zoom, pan, grid, snapToGrid }
      });
    } catch (recoveryError) {
      console.error('Failed to save recovery state:', recoveryError);
    }
  }, [objects, zoom, pan, grid, snapToGrid]);

  return (
    <CanvasErrorBoundary onError={onCanvasError}>
      <div ref={containerRef} className="canvas-editor-container relative w-full h-full bg-lux-cream-100 rounded-lg overflow-hidden shadow-inner">
        {isLoading && <CanvasLoadingIndicator />}
        {error && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-100 text-red-700 p-4 rounded-lg z-50">{error}</div>}
        {dragDropError && <div className="absolute top-4 right-4 bg-red-100 text-red-700 p-3 rounded-lg z-50 shadow-lg">{dragDropError}</div>}

        {renderGrid()}

        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: '0 0',
            width: width,
            height: height,
          }}
        />
        {/* Performance indicator removed */}
      </div>
    </CanvasErrorBoundary>
  );
};
