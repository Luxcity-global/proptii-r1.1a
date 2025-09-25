import React, { useState } from 'react';
import { ToolTray } from './ToolTray';
import type { ToolTrayItem, ToolTraySection } from './ToolTray';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Palette,
  Plus,
  Minus
} from 'lucide-react';

interface TextStyle extends ToolTrayItem {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  color: string;
  backgroundColor?: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
}

interface TextToolTrayProps {
  onTextSelect?: (text: TextStyle) => void;
  onTextDoubleClick?: (text: TextStyle) => void;
  onTextDragStart?: (text: TextStyle) => void;
  className?: string;
}

export const TextToolTray: React.FC<TextToolTrayProps> = ({
  onTextSelect,
  onTextDoubleClick,
  onTextDragStart,
  className = ''
}) => {
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [selectedSize, setSelectedSize] = useState(16);
  const [selectedColor, setSelectedColor] = useState('#374151');
  const [selectedAlignment, setSelectedAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  // Font families
  const fontFamilies = [
    { id: 'inter', name: 'Inter', family: 'Inter, sans-serif' },
    { id: 'roboto', name: 'Roboto', family: 'Roboto, sans-serif' },
    { id: 'opensans', name: 'Open Sans', family: 'Open Sans, sans-serif' },
    { id: 'lato', name: 'Lato', family: 'Lato, sans-serif' },
    { id: 'montserrat', name: 'Montserrat', family: 'Montserrat, sans-serif' },
    { id: 'poppins', name: 'Poppins', family: 'Poppins, sans-serif' },
    { id: 'nunito', name: 'Nunito', family: 'Nunito, sans-serif' },
    { id: 'source', name: 'Source Sans Pro', family: 'Source Sans Pro, sans-serif' }
  ];

  // Font sizes
  const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72, 96];

  // Text styles
  const textStyles: TextStyle[] = [
    {
      id: 'heading-1',
      name: 'Heading 1',
      description: 'Large heading text',
      fontFamily: 'Inter',
      fontSize: 32,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#1f2937',
      alignment: 'left',
      tags: ['heading', 'large', 'title']
    },
    {
      id: 'heading-2',
      name: 'Heading 2',
      description: 'Medium heading text',
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#1f2937',
      alignment: 'left',
      tags: ['heading', 'medium', 'subtitle']
    },
    {
      id: 'heading-3',
      name: 'Heading 3',
      description: 'Small heading text',
      fontFamily: 'Inter',
      fontSize: 20,
      fontWeight: 'semibold',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#374151',
      alignment: 'left',
      tags: ['heading', 'small', 'section']
    },
    {
      id: 'body-large',
      name: 'Body Large',
      description: 'Large body text',
      fontFamily: 'Inter',
      fontSize: 18,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#374151',
      alignment: 'left',
      tags: ['body', 'large', 'paragraph']
    },
    {
      id: 'body-regular',
      name: 'Body Regular',
      description: 'Regular body text',
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#374151',
      alignment: 'left',
      tags: ['body', 'regular', 'paragraph']
    },
    {
      id: 'body-small',
      name: 'Body Small',
      description: 'Small body text',
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#6b7280',
      alignment: 'left',
      tags: ['body', 'small', 'caption']
    },
    {
      id: 'caption',
      name: 'Caption',
      description: 'Caption text',
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#9ca3af',
      alignment: 'left',
      tags: ['caption', 'small', 'metadata']
    },
    {
      id: 'quote',
      name: 'Quote',
      description: 'Quote text style',
      fontFamily: 'Inter',
      fontSize: 18,
      fontWeight: 'normal',
      fontStyle: 'italic',
      textDecoration: 'none',
      color: '#4b5563',
      alignment: 'left',
      tags: ['quote', 'italic', 'emphasis']
    }
  ];

  // Generate text thumbnail
  const generateTextThumbnail = (style: TextStyle): string => {
    return `/api/placeholder/80/40?text=${encodeURIComponent(style.name)}&font=${encodeURIComponent(style.fontFamily)}&size=${style.fontSize}&color=${encodeURIComponent(style.color)}`;
  };

  // Create sections
  const sections: ToolTraySection[] = [
    {
      id: 'styles',
      name: 'Text Styles',
      items: textStyles.map(style => ({
        ...style,
        thumbnail: generateTextThumbnail(style),
        metadata: {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          fontStyle: style.fontStyle,
          textDecoration: style.textDecoration,
          color: style.color,
          alignment: style.alignment
        }
      })),
      defaultExpanded: true
    }
  ];

  const renderTextItem = (item: ToolTrayItem) => {
    const textStyle = item as TextStyle;
    
    return (
      <div className="group relative p-3 rounded-lg border cursor-pointer transition-all duration-200 border-lux-cream-300 hover:border-lux-blue-300 hover:bg-lux-blue-50">
        {/* Text preview */}
        <div className="aspect-[2/1] rounded-lg overflow-hidden bg-white mb-3 flex items-center justify-center border border-lux-cream-200">
          <div 
            className="text-center truncate px-2"
            style={{
              fontFamily: textStyle.fontFamily,
              fontSize: `${Math.min(textStyle.fontSize / 2, 16)}px`,
              fontWeight: textStyle.fontWeight,
              fontStyle: textStyle.fontStyle,
              textDecoration: textStyle.textDecoration,
              color: textStyle.color,
              textAlign: textStyle.alignment
            }}
          >
            {textStyle.name}
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-lux-blue-900 truncate">
            {textStyle.name}
          </h4>
          
          {textStyle.description && (
            <p className="text-xs text-lux-blue-700 line-clamp-2">
              {textStyle.description}
            </p>
          )}
          
          {/* Text properties */}
          <div className="flex items-center justify-between text-xs text-lux-blue-600">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs px-1 py-0">
                {textStyle.fontSize}px
              </Badge>
              <Badge variant="outline" className="text-xs px-1 py-0">
                {textStyle.fontWeight}
              </Badge>
            </div>
            
            <div 
              className="w-4 h-4 rounded border border-lux-cream-300"
              style={{ backgroundColor: textStyle.color }}
              title={textStyle.color}
            />
          </div>
          
          {/* Tags */}
          {textStyle.tags && textStyle.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {textStyle.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {textStyle.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  +{textStyle.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-lux-cream-300 bg-white">
        <div className="flex items-center space-x-3 mb-4">
          <Type className="w-5 h-5 text-lux-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-lux-blue-900">Text</h2>
            <p className="text-sm text-lux-blue-700">Add and style text elements</p>
          </div>
        </div>

        {/* Text Controls */}
        <div className="space-y-3">
          {/* Font Family */}
          <div>
            <label className="text-xs font-medium text-lux-blue-700 mb-1 block">Font Family</label>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-lux-cream-300 rounded-lg focus:ring-2 focus:ring-lux-blue-500 focus:border-lux-blue-500"
            >
              {fontFamilies.map(font => (
                <option key={font.id} value={font.family}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="text-xs font-medium text-lux-blue-700 mb-1 block">Font Size</label>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSize(Math.max(8, selectedSize - 2))}
                className="p-1"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                value={selectedSize}
                onChange={(e) => setSelectedSize(parseInt(e.target.value) || 16)}
                className="w-16 text-center"
                min="8"
                max="96"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSize(Math.min(96, selectedSize + 2))}
                className="p-1"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Text Alignment */}
          <div>
            <label className="text-xs font-medium text-lux-blue-700 mb-1 block">Alignment</label>
            <div className="flex space-x-1">
              {[
                { value: 'left', icon: AlignLeft },
                { value: 'center', icon: AlignCenter },
                { value: 'right', icon: AlignRight },
                { value: 'justify', icon: AlignJustify }
              ].map(({ value, icon: Icon }) => (
                <Button
                  key={value}
                  variant={selectedAlignment === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedAlignment(value as any)}
                  className="flex-1"
                >
                  <Icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </div>

          {/* Text Color */}
          <div>
            <label className="text-xs font-medium text-lux-blue-700 mb-1 block">Text Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-8 h-8 rounded border border-lux-cream-300 cursor-pointer"
              />
              <Input
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="flex-1 text-sm"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <ToolTray
          id="text"
          title="Text"
          icon={<Type className="w-5 h-5" />}
          sections={sections}
          searchPlaceholder="Search text styles..."
          viewMode="grid"
          onItemSelect={onTextSelect}
          onItemDoubleClick={onTextDoubleClick}
          onItemDragStart={onTextDragStart}
          className="border-0"
        />
      </div>
    </div>
  );
};

export default TextToolTray;

