import React from 'react';
import { Button } from '../ui/button';
import { 
  Move, 
  Square, 
  Circle, 
  Type, 
  Image, 
  PenTool,
  Eraser,
  Hand,
  MousePointer,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify
} from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';

export const CanvasControls: React.FC = () => {
  const { canvas, setLoading } = useCanvasStore();
  const [activeTool, setActiveTool] = React.useState<string>('select');

  const tools = [
    { id: 'select', name: 'Select', icon: MousePointer, shortcut: 'V' },
    { id: 'move', name: 'Move', icon: Move, shortcut: 'M' },
    { id: 'rectangle', name: 'Rectangle', icon: Square, shortcut: 'R' },
    { id: 'circle', name: 'Circle', icon: Circle, shortcut: 'C' },
    { id: 'text', name: 'Text', icon: Type, shortcut: 'T' },
    { id: 'image', name: 'Image', icon: Image, shortcut: 'I' },
    { id: 'pen', name: 'Pen', icon: PenTool, shortcut: 'P' },
    { id: 'eraser', name: 'Eraser', icon: Eraser, shortcut: 'E' },
    { id: 'hand', name: 'Hand', icon: Hand, shortcut: 'H' }
  ];

  const handleToolSelect = (toolId: string) => {
    setActiveTool(toolId);
    setLoading(true);

    if (!canvas) {
      setLoading(false);
      return;
    }

    // Set canvas cursor and tool mode
    switch (toolId) {
      case 'select':
        canvas.defaultCursor = 'default';
        canvas.selection = true;
        break;
      case 'move':
        canvas.defaultCursor = 'move';
        canvas.selection = false;
        break;
      case 'rectangle':
        canvas.defaultCursor = 'crosshair';
        canvas.selection = false;
        // TODO: Implement rectangle drawing mode
        break;
      case 'circle':
        canvas.defaultCursor = 'crosshair';
        canvas.selection = false;
        // TODO: Implement circle drawing mode
        break;
      case 'text':
        canvas.defaultCursor = 'text';
        canvas.selection = false;
        // TODO: Implement text creation mode
        break;
      case 'image':
        canvas.defaultCursor = 'copy';
        canvas.selection = false;
        // TODO: Implement image upload mode
        break;
      case 'pen':
        canvas.defaultCursor = 'crosshair';
        canvas.selection = false;
        // TODO: Implement freehand drawing mode
        break;
      case 'eraser':
        canvas.defaultCursor = 'grab';
        canvas.selection = false;
        // TODO: Implement eraser mode
        break;
      case 'hand':
        canvas.defaultCursor = 'grab';
        canvas.selection = false;
        // TODO: Implement pan mode
        break;
      default:
        canvas.defaultCursor = 'default';
        canvas.selection = true;
    }

    canvas.renderAll();
    setLoading(false);
  };

  const handleAlignment = (alignment: string) => {
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    // TODO: Implement object alignment
    console.log(`Align objects: ${alignment}`);
  };

  return (
    <div className="bg-white border-b border-lux-cream-300 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Left Section - Drawing Tools */}
        <div className="flex items-center space-x-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            
            return (
              <Button
                key={tool.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => handleToolSelect(tool.id)}
                className={`
                  relative
                  ${isActive 
                    ? 'bg-lux-blue-600 text-white' 
                    : 'hover:bg-lux-blue-50 text-lux-blue-600'
                  }
                `}
                title={`${tool.name} (${tool.shortcut})`}
              >
                <Icon className="w-4 h-4" />
                {isActive && (
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-lux-green-500 rounded-full" />
                )}
              </Button>
            );
          })}
        </div>

        {/* Center Section - Alignment Tools */}
        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-600 mr-2">Align:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAlignment('left')}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAlignment('center')}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAlignment('right')}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAlignment('justify')}
            title="Align Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </Button>
        </div>

        {/* Right Section - Quick Actions */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Quick Actions:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // TODO: Implement duplicate selected objects
              console.log('Duplicate selected objects');
            }}
            title="Duplicate (Ctrl+D)"
          >
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // TODO: Implement delete selected objects
              console.log('Delete selected objects');
            }}
            title="Delete (Del)"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CanvasControls;
