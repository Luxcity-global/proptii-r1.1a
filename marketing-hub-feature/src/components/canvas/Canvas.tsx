import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as fabric from 'fabric';
import { useCanvasStore } from '../../stores/canvasStore';

interface CanvasProps {
  width?: number;
  height?: number;
  onCanvasReady?: (canvas: fabric.Canvas) => void;
  onObjectAdded?: (object: fabric.Object) => void;
  onObjectModified?: (object: fabric.Object) => void;
  onSelectionChanged?: (objects: fabric.Object[]) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  width = 800,
  height = 600,
  onCanvasReady,
  onObjectAdded,
  onObjectModified,
  onSelectionChanged
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentTool, setCurrentTool] = useState<'select' | 'draw' | 'rectangle' | 'circle' | 'text'>('select');
  const { 
    objects, 
    setCanvas, 
    addObject, 
    updateObject, 
    setSelection,
    undo,
    redo,
    saveCanvas,
    canvasSettings
  } = useCanvasStore();

  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      stateful: true,
      defaultCursor: 'default',
      moveCursor: 'move',
      hoverCursor: 'move',
      rotationCursor: 'crosshair',
      selectionColor: '#3b82f6',
      selectionBorderColor: '#3b82f6',
      selectionLineWidth: 2
    });

    // Set up event listeners
    canvas.on('object:added', (e: any) => {
      if (e.target) {
        addObject(e.target);
        onObjectAdded?.(e.target);
        saveCanvas();
      }
    });

    canvas.on('object:modified', (e: any) => {
      if (e.target) {
        updateObject(e.target);
        onObjectModified?.(e.target);
        saveCanvas();
      }
    });

    canvas.on('selection:created', (e: any) => {
      const selectedObjects = e.selected || [];
      setSelection(selectedObjects);
      onSelectionChanged?.(selectedObjects);
    });

    canvas.on('selection:updated', (e: any) => {
      const selectedObjects = e.selected || [];
      setSelection(selectedObjects);
      onSelectionChanged?.(selectedObjects);
    });

    canvas.on('selection:cleared', () => {
      setSelection([]);
      onSelectionChanged?.([]);
    });

    // Set up keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 's':
            e.preventDefault();
            saveCanvas();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    fabricCanvasRef.current = canvas;
    setCanvas(canvas);
    onCanvasReady?.(canvas);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      canvas.dispose();
    };
  }, [width, height, onCanvasReady, onObjectAdded, onObjectModified, onSelectionChanged, addObject, updateObject, setSelection, undo, redo, saveCanvas, setCanvas]);

  useEffect(() => {
    const cleanup = initializeCanvas();
    return cleanup;
  }, [initializeCanvas]);

  // Handle canvas state changes
  useEffect(() => {
    if (fabricCanvasRef.current && objects) {
      fabricCanvasRef.current.loadFromJSON(objects, () => {
        fabricCanvasRef.current?.renderAll();
      });
    }
  }, [objects]);

  return (
    <div className="canvas-container relative bg-white border border-gray-200 rounded-lg overflow-hidden">
      <canvas 
        ref={canvasRef}
        className="block"
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          cursor: 'default'
        }}
      />
      
      {/* Canvas Loading Overlay */}
      {!fabricCanvasRef.current && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-lux-blue-600"></div>
            <span className="text-gray-600">Loading Canvas...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;
