import React, { useState } from 'react';
import { ToolTray } from './ToolTray';
import type { ToolTrayItem, ToolTraySection } from './ToolTray';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Shapes,
  Square,
  Circle,
  Triangle,
  Type,
  PenTool,
  Minus,
  Plus,
  Star,
  Heart,
  Zap,
  Palette
} from 'lucide-react';
import { useCanvasStoreEnhanced } from '../../stores/canvasStoreEnhanced';

interface Element extends ToolTrayItem {
  element_type: 'shape' | 'text' | 'icon' | 'line';
  category: string;
  properties: {
    width?: number;
    height?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    fontSize?: number;
    fontFamily?: string;
  };
}

interface ElementsToolTrayProps {
  onElementSelect?: (element: Element) => void;
  onElementDoubleClick?: (element: Element) => void;
  onElementDragStart?: (element: Element) => void;
  className?: string;
}

export const ElementsToolTray: React.FC<ElementsToolTrayProps> = ({
  onElementSelect,
  onElementDoubleClick,
  onElementDragStart,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('shapes');

  const { addRectangle, addCircle, addText, setCurrentTool } = useCanvasStoreEnhanced();

  // Handle element creation
  const handleAddElement = (elementType: string, properties?: any) => {
    switch (elementType) {
      case 'rectangle':
        addRectangle({
          fill: properties?.fill || '#ff6b6b',
          stroke: properties?.stroke || '#333',
          strokeWidth: properties?.strokeWidth || 2,
          ...properties
        });
        break;
      case 'circle':
        addCircle({
          fill: properties?.fill || '#4ecdc4',
          stroke: properties?.stroke || '#333',
          strokeWidth: properties?.strokeWidth || 2,
          ...properties
        });
        break;
      case 'text':
        addText('Double-click to edit', {
          fontSize: properties?.fontSize || 20,
          fontFamily: properties?.fontFamily || 'Arial',
          fill: properties?.fill || '#333',
          ...properties
        });
        break;
      default:
        console.log('Element type not implemented:', elementType);
    }
  };

  // Categories
  const categories = [
    { id: 'shapes', name: 'Shapes', icon: 'Square' },
    { id: 'text', name: 'Text', icon: 'Type' },
    { id: 'icons', name: 'Icons', icon: 'Star' },
    { id: 'lines', name: 'Lines', icon: 'Minus' }
  ];

  // Shape elements
  const shapeElements: Element[] = [
    {
      id: 'rectangle',
      name: 'Rectangle',
      description: 'Basic rectangle shape',
      element_type: 'shape',
      category: 'shapes',
      tags: ['shape', 'rectangle', 'basic'],
      properties: {
        width: 100,
        height: 60,
        fill: '#3b82f6',
        stroke: '#1d4ed8',
        strokeWidth: 2
      }
    },
    {
      id: 'circle',
      name: 'Circle',
      description: 'Perfect circle shape',
      element_type: 'shape',
      category: 'shapes',
      tags: ['shape', 'circle', 'round'],
      properties: {
        width: 80,
        height: 80,
        fill: '#ef4444',
        stroke: '#dc2626',
        strokeWidth: 2
      }
    },
    {
      id: 'triangle',
      name: 'Triangle',
      description: 'Triangle shape',
      element_type: 'shape',
      category: 'shapes',
      tags: ['shape', 'triangle', 'angular'],
      properties: {
        width: 80,
        height: 80,
        fill: '#10b981',
        stroke: '#059669',
        strokeWidth: 2
      }
    },
    {
      id: 'star',
      name: 'Star',
      description: '5-pointed star',
      element_type: 'shape',
      category: 'shapes',
      tags: ['shape', 'star', 'decorative'],
      properties: {
        width: 80,
        height: 80,
        fill: '#f59e0b',
        stroke: '#d97706',
        strokeWidth: 2
      }
    },
    {
      id: 'heart',
      name: 'Heart',
      description: 'Heart shape',
      element_type: 'shape',
      category: 'shapes',
      tags: ['shape', 'heart', 'love'],
      properties: {
        width: 80,
        height: 80,
        fill: '#ec4899',
        stroke: '#db2777',
        strokeWidth: 2
      }
    },
    {
      id: 'hexagon',
      name: 'Hexagon',
      description: 'Hexagonal shape',
      element_type: 'shape',
      category: 'shapes',
      tags: ['shape', 'hexagon', 'geometric'],
      properties: {
        width: 80,
        height: 80,
        fill: '#8b5cf6',
        stroke: '#7c3aed',
        strokeWidth: 2
      }
    }
  ];

  // Text elements
  const textElements: Element[] = [
    {
      id: 'heading-1',
      name: 'Heading 1',
      description: 'Large heading text',
      element_type: 'text',
      category: 'text',
      tags: ['text', 'heading', 'large'],
      properties: {
        fontSize: 32,
        fontFamily: 'Inter',
        fill: '#1f2937'
      }
    },
    {
      id: 'heading-2',
      name: 'Heading 2',
      description: 'Medium heading text',
      element_type: 'text',
      category: 'text',
      tags: ['text', 'heading', 'medium'],
      properties: {
        fontSize: 24,
        fontFamily: 'Inter',
        fill: '#1f2937'
      }
    },
    {
      id: 'body-text',
      name: 'Body Text',
      description: 'Regular body text',
      element_type: 'text',
      category: 'text',
      tags: ['text', 'body', 'regular'],
      properties: {
        fontSize: 16,
        fontFamily: 'Inter',
        fill: '#374151'
      }
    },
    {
      id: 'caption',
      name: 'Caption',
      description: 'Small caption text',
      element_type: 'text',
      category: 'text',
      tags: ['text', 'caption', 'small'],
      properties: {
        fontSize: 12,
        fontFamily: 'Inter',
        fill: '#6b7280'
      }
    }
  ];

  // Icon elements
  const iconElements: Element[] = [
    {
      id: 'icon-heart',
      name: 'Heart Icon',
      description: 'Heart icon',
      element_type: 'icon',
      category: 'icons',
      tags: ['icon', 'heart', 'love'],
      properties: {
        width: 24,
        height: 24,
        fill: '#ec4899'
      }
    },
    {
      id: 'icon-star',
      name: 'Star Icon',
      description: 'Star icon',
      element_type: 'icon',
      category: 'icons',
      tags: ['icon', 'star', 'rating'],
      properties: {
        width: 24,
        height: 24,
        fill: '#f59e0b'
      }
    },
    {
      id: 'icon-zap',
      name: 'Lightning Icon',
      description: 'Lightning bolt icon',
      element_type: 'icon',
      category: 'icons',
      tags: ['icon', 'lightning', 'energy'],
      properties: {
        width: 24,
        height: 24,
        fill: '#eab308'
      }
    },
    {
      id: 'icon-plus',
      name: 'Plus Icon',
      description: 'Plus sign icon',
      element_type: 'icon',
      category: 'icons',
      tags: ['icon', 'plus', 'add'],
      properties: {
        width: 24,
        height: 24,
        fill: '#10b981'
      }
    },
    {
      id: 'icon-minus',
      name: 'Minus Icon',
      description: 'Minus sign icon',
      element_type: 'icon',
      category: 'icons',
      tags: ['icon', 'minus', 'remove'],
      properties: {
        width: 24,
        height: 24,
        fill: '#ef4444'
      }
    }
  ];

  // Line elements
  const lineElements: Element[] = [
    {
      id: 'line-horizontal',
      name: 'Horizontal Line',
      description: 'Horizontal straight line',
      element_type: 'line',
      category: 'lines',
      tags: ['line', 'horizontal', 'straight'],
      properties: {
        width: 100,
        height: 2,
        stroke: '#6b7280',
        strokeWidth: 2
      }
    },
    {
      id: 'line-vertical',
      name: 'Vertical Line',
      description: 'Vertical straight line',
      element_type: 'line',
      category: 'lines',
      tags: ['line', 'vertical', 'straight'],
      properties: {
        width: 2,
        height: 100,
        stroke: '#6b7280',
        strokeWidth: 2
      }
    },
    {
      id: 'line-diagonal',
      name: 'Diagonal Line',
      description: 'Diagonal line',
      element_type: 'line',
      category: 'lines',
      tags: ['line', 'diagonal', 'angled'],
      properties: {
        width: 100,
        height: 2,
        stroke: '#6b7280',
        strokeWidth: 2
      }
    },
    {
      id: 'arrow-right',
      name: 'Right Arrow',
      description: 'Arrow pointing right',
      element_type: 'line',
      category: 'lines',
      tags: ['arrow', 'right', 'direction'],
      properties: {
        width: 60,
        height: 20,
        stroke: '#3b82f6',
        strokeWidth: 3
      }
    },
    {
      id: 'arrow-down',
      name: 'Down Arrow',
      description: 'Arrow pointing down',
      element_type: 'line',
      category: 'lines',
      tags: ['arrow', 'down', 'direction'],
      properties: {
        width: 20,
        height: 60,
        stroke: '#3b82f6',
        strokeWidth: 3
      }
    }
  ];

  // Generate thumbnail for element
  const generateElementThumbnail = (element: Element): string => {
    // In a real implementation, this would generate actual thumbnails
    // For now, return a placeholder based on element type
    const thumbnails = {
      'shape': '/api/placeholder/80/80?text=Square',
      'text': '/api/placeholder/80/80?text=Type',
      'icon': '/api/placeholder/80/80?text=Star',
      'line': '/api/placeholder/80/80?text=Minus'
    };
    return thumbnails[element.element_type] || '/api/placeholder/80/80';
  };

  // Get elements by category
  const getElementsByCategory = (category: string): Element[] => {
    switch (category) {
      case 'shapes':
        return shapeElements;
      case 'text':
        return textElements;
      case 'icons':
        return iconElements;
      case 'lines':
        return lineElements;
      default:
        return [];
    }
  };

  // Create sections
  const sections: ToolTraySection[] = categories.map(category => ({
    id: category.id,
    name: category.name,
    items: getElementsByCategory(category.id).map(element => ({
      ...element,
      thumbnail: generateElementThumbnail(element),
      metadata: {
        ...element.metadata,
        element_type: element.element_type,
        properties: element.properties
      }
    })),
    collapsible: true,
    defaultExpanded: selectedCategory === category.id
  }));

  const renderElementItem = (item: ToolTrayItem) => {
    const element = item as Element;
    
    return (
      <div className="group relative p-3 rounded-lg border cursor-pointer transition-all duration-200 border-lux-cream-300 hover:border-lux-blue-300 hover:bg-lux-blue-50">
        {/* Element preview */}
        <div className="aspect-square rounded-lg overflow-hidden bg-lux-cream-200 mb-3 flex items-center justify-center">
          {element.element_type === 'shape' && (
            <div 
              className="w-12 h-12 rounded"
              style={{
                backgroundColor: element.properties.fill,
                border: `${element.properties.strokeWidth}px solid ${element.properties.stroke}`,
                borderRadius: element.name === 'Circle' ? '50%' : 
                             element.name === 'Triangle' ? '0' : '8px'
              }}
            />
          )}
          {element.element_type === 'text' && (
            <div 
              className="text-center"
              style={{
                fontSize: `${(element.properties.fontSize || 16) / 2}px`,
                fontFamily: element.properties.fontFamily,
                color: element.properties.fill
              }}
            >
              Aa
            </div>
          )}
          {element.element_type === 'icon' && (
            <div 
              className="text-2xl"
              style={{ color: element.properties.fill }}
            >
              {element.name.includes('Heart') && <Heart className="w-4 h-4" />}
              {element.name.includes('Star') && <Star className="w-4 h-4" />}
              {element.name.includes('Lightning') && <Zap className="w-4 h-4" />}
              {element.name.includes('Plus') && <Plus className="w-4 h-4" />}
              {element.name.includes('Minus') && <Minus className="w-4 h-4" />}
            </div>
          )}
          {element.element_type === 'line' && (
            <div 
              className="w-12 h-1"
              style={{
                backgroundColor: element.properties.stroke,
                height: `${element.properties.strokeWidth}px`,
                transform: element.name.includes('Diagonal') ? 'rotate(45deg)' :
                          element.name.includes('Vertical') ? 'rotate(90deg)' : 'none'
              }}
            />
          )}
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-lux-blue-900 truncate">
            {element.name}
          </h4>
          
          {element.description && (
            <p className="text-xs text-lux-blue-700 line-clamp-2">
              {element.description}
            </p>
          )}
          
          {/* Element properties */}
          <div className="flex items-center justify-between text-xs text-lux-blue-600">
            <Badge variant="outline" className="text-xs px-1 py-0">
              {element.element_type}
            </Badge>
            
            {element.properties.fill && (
              <div 
                className="w-4 h-4 rounded border border-lux-cream-300"
                style={{ backgroundColor: element.properties.fill }}
                title={element.properties.fill}
              />
            )}
          </div>
          
          {/* Tags */}
          {element.tags && element.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {element.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {element.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  +{element.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Action Button */}
          <Button 
            size="sm" 
            className="w-full bg-lux-blue-600 hover:bg-lux-blue-700 text-white text-xs mt-2"
            onClick={(e) => {
              e.stopPropagation();
              handleAddElement(element.name.toLowerCase().replace(/\s+/g, ''), element.properties);
            }}
          >
            Add to Canvas
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-lux-cream-300 bg-white">
        <div className="flex items-center space-x-3 mb-4">
          <Shapes className="w-5 h-5 text-lux-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-lux-blue-900">Elements</h2>
            <p className="text-sm text-lux-blue-700">Add shapes, text, icons, and lines to your design</p>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="text-xs"
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <ToolTray
          id="elements"
          title="Elements"
          icon={<Shapes className="w-5 h-5" />}
          sections={sections}
          searchPlaceholder="Search elements..."
          viewMode="grid"
          onItemSelect={onElementSelect}
          onItemDoubleClick={onElementDoubleClick}
          onItemDragStart={onElementDragStart}
          className="border-0"
        />
      </div>
    </div>
  );
};

export default ElementsToolTray;
