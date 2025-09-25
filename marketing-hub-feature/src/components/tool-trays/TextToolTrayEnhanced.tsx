/**
 * Enhanced Text Tool Tray with Professional Typography Controls
 * Advanced text formatting, font management, and styling options
 */

import React, { useState, useRef, useCallback } from 'react';
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
  Strikethrough,
  Subscript,
  Superscript,
  Palette,
  Plus,
  Minus,
  RotateCcw,
  MoreHorizontal,
  ChevronDown,
  Hash,
  Quote,
  List,
  ListOrdered,
  Indent,
  Outdent,
  LineHeight,
  LetterSpacing,
  Shadow,
  Paintbrush,
  Zap
} from 'lucide-react';
import { useCanvasStoreEnhanced } from '../../stores/canvasStoreEnhanced';

interface TextStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  color: string;
  backgroundColor?: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
  textShadow?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  opacity: number;
}

interface TextToolTrayEnhancedProps {
  onTextSelect?: (text: TextStyle) => void;
  onTextAdd?: (text: string, style: TextStyle) => void;
  className?: string;
}

export const TextToolTrayEnhanced: React.FC<TextToolTrayEnhancedProps> = ({
  onTextSelect,
  onTextAdd,
  className = ''
}) => {
  const [activeText, setActiveText] = useState('Your text here');
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [selectedSize, setSelectedSize] = useState(24);
  const [selectedColor, setSelectedColor] = useState('#374151');
  const [selectedAlignment, setSelectedAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [fontWeight, setFontWeight] = useState('400');
  const [fontStyle, setFontStyle] = useState('normal');
  const [textDecoration, setTextDecoration] = useState('none');
  const [lineHeight, setLineHeight] = useState(1.5);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [textTransform, setTextTransform] = useState<'none' | 'uppercase' | 'lowercase' | 'capitalize'>('none');
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const [textShadow, setTextShadow] = useState('none');
  const [opacity, setOpacity] = useState(1);

  const { addText } = useCanvasStoreEnhanced();

  // Font families organized by category
  const fontCategories = {
    'Sans Serif': [
      'Inter', 'Helvetica', 'Arial', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 
      'Source Sans Pro', 'Nunito', 'Ubuntu', 'Work Sans', 'Poppins'
    ],
    'Serif': [
      'Times New Roman', 'Georgia', 'Playfair Display', 'Merriweather', 'Lora', 
      'Crimson Text', 'Libre Baskerville', 'Source Serif Pro'
    ],
    'Monospace': [
      'Monaco', 'Consolas', 'Courier New', 'Source Code Pro', 'JetBrains Mono', 'Fira Code'
    ],
    'Display': [
      'Bebas Neue', 'Oswald', 'Raleway', 'Quicksand', 'Dancing Script', 'Pacifico',
      'Righteous', 'Bangers', 'Fredoka One'
    ]
  };

  // Predefined text styles
  const textPresets: TextStyle[] = [
    {
      id: 'heading-1',
      name: 'Heading 1',
      fontFamily: 'Inter',
      fontSize: 48,
      fontWeight: '700',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#111827',
      alignment: 'left',
      lineHeight: 1.2,
      letterSpacing: -0.5,
      opacity: 1
    },
    {
      id: 'heading-2', 
      name: 'Heading 2',
      fontFamily: 'Inter',
      fontSize: 36,
      fontWeight: '600',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#374151',
      alignment: 'left',
      lineHeight: 1.3,
      letterSpacing: -0.25,
      opacity: 1
    },
    {
      id: 'body-text',
      name: 'Body Text',
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: '400',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#6B7280',
      alignment: 'left',
      lineHeight: 1.6,
      letterSpacing: 0,
      opacity: 1
    },
    {
      id: 'caption',
      name: 'Caption',
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '500',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#9CA3AF',
      alignment: 'left',
      lineHeight: 1.4,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      opacity: 1
    },
    {
      id: 'quote',
      name: 'Quote',
      fontFamily: 'Playfair Display',
      fontSize: 24,
      fontWeight: '400',
      fontStyle: 'italic',
      textDecoration: 'none',
      color: '#4B5563',
      alignment: 'center',
      lineHeight: 1.5,
      letterSpacing: 0,
      opacity: 1
    },
    {
      id: 'button-text',
      name: 'Button',
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '600',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#FFFFFF',
      backgroundColor: '#3B82F6',
      alignment: 'center',
      lineHeight: 1,
      letterSpacing: 0.25,
      textTransform: 'uppercase',
      opacity: 1
    }
  ];

  // Color palette
  const colorPalette = [
    '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6', '#FFFFFF',
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E'
  ];

  const getCurrentStyle = useCallback((): TextStyle => ({
    id: `text-${Date.now()}`,
    name: 'Custom Text',
    fontFamily: selectedFont,
    fontSize: selectedSize,
    fontWeight,
    fontStyle,
    textDecoration,
    color: selectedColor,
    backgroundColor,
    alignment: selectedAlignment,
    lineHeight,
    letterSpacing,
    textShadow,
    textTransform,
    opacity
  }), [
    selectedFont, selectedSize, fontWeight, fontStyle, textDecoration,
    selectedColor, backgroundColor, selectedAlignment, lineHeight,
    letterSpacing, textShadow, textTransform, opacity
  ]);

  const handleAddText = useCallback(() => {
    const style = getCurrentStyle();
    
    // Add to canvas
    addText({
      text: activeText,
      left: 100,
      top: 100,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      textDecoration: style.textDecoration,
      fill: style.color,
      textAlign: style.alignment,
      lineHeight: style.lineHeight,
      charSpacing: style.letterSpacing * 1000, // Fabric.js uses 1000x multiplier
      textBackgroundColor: style.backgroundColor !== 'transparent' ? style.backgroundColor : undefined,
      shadow: style.textShadow !== 'none' ? { color: 'rgba(0,0,0,0.3)', blur: 4, offsetX: 2, offsetY: 2 } : undefined,
      opacity: style.opacity
    });

    onTextAdd?.(activeText, style);
  }, [activeText, getCurrentStyle, addText, onTextAdd]);

  const applyPreset = useCallback((preset: TextStyle) => {
    setSelectedFont(preset.fontFamily);
    setSelectedSize(preset.fontSize);
    setFontWeight(preset.fontWeight);
    setFontStyle(preset.fontStyle);
    setTextDecoration(preset.textDecoration);
    setSelectedColor(preset.color);
    setBackgroundColor(preset.backgroundColor || 'transparent');
    setSelectedAlignment(preset.alignment);
    setLineHeight(preset.lineHeight);
    setLetterSpacing(preset.letterSpacing);
    setTextTransform(preset.textTransform || 'none');
    setOpacity(preset.opacity);
    
    onTextSelect?.(preset);
  }, [onTextSelect]);

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-3">
          <Type className="w-5 h-5 mr-2" />
          Text
        </h2>
        
        {/* Text Input */}
        <div className="space-y-3">
          <textarea
            value={activeText}
            onChange={(e) => setActiveText(e.target.value)}
            placeholder="Enter your text..."
            className="w-full h-20 px-3 py-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <Button 
            onClick={handleAddText}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Text to Canvas
          </Button>
        </div>
      </div>

      {/* Text Presets */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Text Styles</h3>
        <div className="grid grid-cols-2 gap-2">
          {textPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div 
                className="text-sm font-medium truncate"
                style={{
                  fontFamily: preset.fontFamily,
                  fontSize: '14px',
                  fontWeight: preset.fontWeight,
                  color: preset.color
                }}
              >
                {preset.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {preset.fontFamily} {preset.fontSize}px
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Font Controls */}
      <div className="p-4 border-b border-gray-200 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Font</h3>
        
        {/* Font Family */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Font Family</label>
          <select
            value={selectedFont}
            onChange={(e) => setSelectedFont(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(fontCategories).map(([category, fonts]) => (
              <optgroup key={category} label={category}>
                {fonts.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Font Size & Weight */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Size</label>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSize(Math.max(8, selectedSize - 2))}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                value={selectedSize}
                onChange={(e) => setSelectedSize(parseInt(e.target.value) || 16)}
                className="text-center text-sm"
                min="8"
                max="200"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSize(Math.min(200, selectedSize + 2))}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Weight</label>
            <select
              value={fontWeight}
              onChange={(e) => setFontWeight(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="100">Thin</option>
              <option value="200">Extra Light</option>
              <option value="300">Light</option>
              <option value="400">Normal</option>
              <option value="500">Medium</option>
              <option value="600">Semi Bold</option>
              <option value="700">Bold</option>
              <option value="800">Extra Bold</option>
              <option value="900">Black</option>
            </select>
          </div>
        </div>

        {/* Style Controls */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Style</label>
          <div className="flex items-center space-x-1">
            <Button
              variant={fontStyle === 'italic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant={textDecoration.includes('underline') ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTextDecoration(
                textDecoration.includes('underline') ? 'none' : 'underline'
              )}
            >
              <Underline className="w-4 h-4" />
            </Button>
            <Button
              variant={textDecoration.includes('line-through') ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTextDecoration(
                textDecoration.includes('line-through') ? 'none' : 'line-through'
              )}
            >
              <Strikethrough className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Alignment */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Alignment</h3>
        <div className="flex items-center space-x-1">
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
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Colors</h3>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Text Color</label>
            <div className="grid grid-cols-7 gap-1">
              {colorPalette.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded border-2 ${
                    selectedColor === color ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Background</label>
            <div className="grid grid-cols-7 gap-1">
              <button
                onClick={() => setBackgroundColor('transparent')}
                className={`w-8 h-8 rounded border-2 bg-white relative ${
                  backgroundColor === 'transparent' ? 'border-blue-500' : 'border-gray-200'
                }`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-0.5 bg-red-500 rotate-45"></div>
                </div>
              </button>
              {colorPalette.slice(6).map(color => (
                <button
                  key={color}
                  onClick={() => setBackgroundColor(color)}
                  className={`w-8 h-8 rounded border-2 ${
                    backgroundColor === color ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Typography */}
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Advanced</h3>
        
        {/* Line Height */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Line Height</label>
          <div className="flex items-center space-x-2">
            <LineHeight className="w-4 h-4 text-gray-500" />
            <input
              type="range"
              min="0.8"
              max="3"
              step="0.1"
              value={lineHeight}
              onChange={(e) => setLineHeight(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-gray-600 w-8">{lineHeight}</span>
          </div>
        </div>

        {/* Letter Spacing */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Letter Spacing</label>
          <div className="flex items-center space-x-2">
            <LetterSpacing className="w-4 h-4 text-gray-500" />
            <input
              type="range"
              min="-2"
              max="5"
              step="0.1"
              value={letterSpacing}
              onChange={(e) => setLetterSpacing(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-gray-600 w-8">{letterSpacing}</span>
          </div>
        </div>

        {/* Text Transform */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Transform</label>
          <select
            value={textTransform}
            onChange={(e) => setTextTransform(e.target.value as any)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">None</option>
            <option value="uppercase">UPPERCASE</option>
            <option value="lowercase">lowercase</option>
            <option value="capitalize">Capitalize</option>
          </select>
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Opacity</label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-gray-600 w-8">{Math.round(opacity * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToolTrayEnhanced;

