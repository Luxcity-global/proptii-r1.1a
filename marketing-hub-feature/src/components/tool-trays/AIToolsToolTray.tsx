import React, { useState } from 'react';
import { ToolTray } from './ToolTray';
import type { ToolTrayItem, ToolTraySection } from './ToolTray';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { GenerateAIButton } from '../ai/GenerateAIButton';
import { PlatformSelector } from '../ui/PlatformSelector';
import { 
  Sparkles,
  Wand2,
  Palette,
  Type,
  Image,
  Brain,
  Zap,
  Star,
  Clock,
  TrendingUp,
  Lightbulb,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useCanvasStoreEnhanced } from '../../stores/canvasStoreEnhanced';

interface AITool extends ToolTrayItem {
  tool_type: 'content' | 'design' | 'optimization' | 'generation';
  category: string;
  status: 'available' | 'processing' | 'premium' | 'beta';
  usage_count: number;
  rating: number;
  estimated_time: number; // seconds
  premium_required: boolean;
}

interface AIToolsToolTrayProps {
  onAIToolSelect?: (tool: AITool) => void;
  onAIToolDoubleClick?: (tool: AITool) => void;
  onAIToolDragStart?: (tool: AITool) => void;
  className?: string;
}

export const AIToolsToolTray: React.FC<AIToolsToolTrayProps> = ({
  onAIToolSelect,
  onAIToolDoubleClick,
  onAIToolDragStart,
  className = ''
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'instagram']);

  const { addText, addImageFromUrl } = useCanvasStoreEnhanced();

  // AI generation functions
  const generateText = async (prompt: string) => {
    setIsGenerating(true);
    try {
      // Simulate AI text generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      const generatedText = `AI Generated: ${prompt}`;
      setGeneratedContent(generatedText);
      addText(generatedText, {
        fontSize: 24,
        fontFamily: 'Inter',
        fill: '#333'
      });
    } catch (error) {
      console.error('Error generating text:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateColorPalette = async () => {
    setIsGenerating(true);
    try {
      // Simulate AI color palette generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
      console.log('Generated color palette:', colors);
      // Could add color swatches to canvas or show in UI
    } catch (error) {
      console.error('Error generating color palette:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDesignSuggestion = async () => {
    setIsGenerating(true);
    try {
      // Simulate AI design suggestion
      await new Promise(resolve => setTimeout(resolve, 3000));
      const suggestion = "Consider adding a gradient background and increasing the contrast between text and background for better readability.";
      setGeneratedContent(suggestion);
    } catch (error) {
      console.error('Error generating design suggestion:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAIToolUse = async (tool: AITool) => {
    switch (tool.id) {
      case 'smart-text':
        await generateText(prompt || 'Generate creative text');
        break;
      case 'color-palette':
        await generateColorPalette();
        break;
      case 'design-suggestions':
        await generateDesignSuggestion();
        break;
      default:
        console.log('AI tool not implemented:', tool.id);
    }
  };

  // AI Tools
  const aiTools: AITool[] = [
    {
      id: 'smart-text',
      name: 'Smart Text Generator',
      description: 'Generate engaging text content based on your prompt',
      tool_type: 'content',
      category: 'text',
      status: 'available',
      usage_count: 1247,
      rating: 4.8,
      estimated_time: 5,
      premium_required: false,
      tags: ['text', 'content', 'generation']
    },
    {
      id: 'color-palette',
      name: 'Color Palette Generator',
      description: 'Generate harmonious color palettes for your design',
      tool_type: 'design',
      category: 'colors',
      status: 'available',
      usage_count: 892,
      rating: 4.6,
      estimated_time: 3,
      premium_required: false,
      tags: ['colors', 'palette', 'design']
    },
    {
      id: 'background-remover',
      name: 'Background Remover',
      description: 'Automatically remove backgrounds from images',
      tool_type: 'optimization',
      category: 'images',
      status: 'available',
      usage_count: 2156,
      rating: 4.9,
      estimated_time: 8,
      premium_required: true,
      tags: ['images', 'background', 'removal']
    },
    {
      id: 'image-upscaler',
      name: 'Image Upscaler',
      description: 'Enhance image quality and resolution using AI',
      tool_type: 'optimization',
      category: 'images',
      status: 'available',
      usage_count: 1567,
      rating: 4.7,
      estimated_time: 15,
      premium_required: true,
      tags: ['images', 'upscale', 'enhancement']
    },
    {
      id: 'logo-generator',
      name: 'Logo Generator',
      description: 'Create professional logos from text descriptions',
      tool_type: 'generation',
      category: 'design',
      status: 'beta',
      usage_count: 423,
      rating: 4.4,
      estimated_time: 12,
      premium_required: true,
      tags: ['logo', 'branding', 'design']
    },
    {
      id: 'content-optimizer',
      name: 'Content Optimizer',
      description: 'Optimize your text for better engagement',
      tool_type: 'content',
      category: 'text',
      status: 'available',
      usage_count: 734,
      rating: 4.5,
      estimated_time: 7,
      premium_required: false,
      tags: ['content', 'optimization', 'text']
    },
    {
      id: 'style-transfer',
      name: 'Style Transfer',
      description: 'Apply artistic styles to your images',
      tool_type: 'generation',
      category: 'images',
      status: 'beta',
      usage_count: 289,
      rating: 4.3,
      estimated_time: 20,
      premium_required: true,
      tags: ['style', 'artistic', 'transformation']
    },
    {
      id: 'smart-crop',
      name: 'Smart Crop',
      description: 'Intelligently crop images to focus on important elements',
      tool_type: 'optimization',
      category: 'images',
      status: 'available',
      usage_count: 945,
      rating: 4.6,
      estimated_time: 6,
      premium_required: false,
      tags: ['crop', 'smart', 'optimization']
    }
  ];

  // Group tools by category
  const toolsByCategory = aiTools.reduce((acc, tool) => {
    const category = tool.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tool);
    return acc;
  }, {} as Record<string, AITool[]>);

  // Generate tool thumbnail
  const generateToolThumbnail = (tool: AITool): string => {
    const icons = {
      'content': 'Type',
      'design': 'Layout',
      'analysis': 'Chart',
      'optimization': 'Zap',
      'automation': 'Bot'
    };
    const icon = icons[tool.tool_type] || 'Tool';
    return `/api/placeholder/80/80?text=${encodeURIComponent(icon)}&bg=${tool.status === 'available' ? '22c55e' : 'f59e0b'}`;
  };

  // Create sections
  const sections: ToolTraySection[] = Object.entries(toolsByCategory).map(([category, tools]) => ({
    id: category,
    name: category.charAt(0).toUpperCase() + category.slice(1),
    items: tools.map(tool => ({
      ...tool,
      thumbnail: generateToolThumbnail(tool),
      metadata: {
        tool_type: tool.tool_type,
        status: tool.status,
        usage_count: tool.usage_count,
        rating: tool.rating,
        estimated_time: tool.estimated_time,
        premium_required: tool.premium_required
      }
    })),
    collapsible: true,
    defaultExpanded: true
  }));

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
      // Handle generation result
    }, 2000);
  };

  const renderAIToolItem = (item: ToolTrayItem) => {
    const tool = item as AITool;
    
    return (
      <div className="group relative p-3 rounded-lg border cursor-pointer transition-all duration-200 border-lux-cream-300 hover:border-lux-blue-300 hover:bg-lux-blue-50">
        {/* Status indicator */}
        <div className="absolute top-2 right-2 z-10">
          {tool.status === 'premium' && (
            <Badge className="bg-purple-500 text-white text-xs">
              <Star className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
          {tool.status === 'beta' && (
            <Badge className="bg-orange-500 text-white text-xs">
              Beta
            </Badge>
          )}
          {tool.status === 'processing' && (
            <Badge className="bg-blue-500 text-white text-xs">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              Processing
            </Badge>
          )}
        </div>
        
        <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-lux-blue-50 to-lux-blue-100 mb-3 flex items-center justify-center">
          <div className="text-3xl">
            {tool.tool_type === 'content' && <Type className="w-8 h-8 text-lux-blue-600" />}
            {tool.tool_type === 'design' && <Palette className="w-8 h-8 text-lux-blue-600" />}
            {tool.tool_type === 'optimization' && <Zap className="w-8 h-8 text-lux-blue-600" />}
            {tool.tool_type === 'generation' && <Sparkles className="w-8 h-8 text-lux-blue-600" />}
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-lux-blue-900 truncate">
            {tool.name}
          </h4>
          
          {tool.description && (
            <p className="text-xs text-lux-blue-700 line-clamp-2">
              {tool.description}
            </p>
          )}
          
          {/* Tool metadata */}
          <div className="flex items-center justify-between text-xs text-lux-blue-600">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {tool.estimated_time}s
              </div>
              
              {tool.rating > 0 && (
                <div className="flex items-center">
                  <Star className="w-3 h-3 mr-1 fill-current text-yellow-500" />
                  {tool.rating}
                </div>
              )}
            </div>
            
            <div className="flex items-center text-xs text-lux-blue-500">
              <TrendingUp className="w-3 h-3 mr-1" />
              {tool.usage_count}
            </div>
          </div>
          
          {/* Tags */}
          {tool.tags && tool.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tool.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {tool.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  +{tool.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Action Button */}
          <Button 
            size="sm" 
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs mt-2"
            onClick={(e) => {
              e.stopPropagation();
              handleAIToolUse(tool);
            }}
            disabled={isGenerating || tool.status === 'processing'}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-2" />
                Use AI Tool
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-lux-cream-300 bg-white flex-shrink-0">
        <div className="flex items-center space-x-3 mb-3">
          <Sparkles className="w-5 h-5 text-lux-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-lux-blue-900">AI Tools</h2>
            <p className="text-sm text-lux-blue-700">Powered by artificial intelligence</p>
          </div>
        </div>

        {/* Property Marketing AI */}
        <div className="space-y-3">
          {/* Platform Selector */}
          <PlatformSelector
            selectedPlatforms={selectedPlatforms}
            onPlatformsChange={setSelectedPlatforms}
            maxSelections={4}
            showDimensions={false}
            showTextLimits={false}
          />

          {/* Generate AI Button */}
          <GenerateAIButton
            platforms={selectedPlatforms}
            onContentGenerated={(content) => {
              console.log('Generated content:', content);
              // Handle generated content
            }}
            onError={(error) => {
              console.error('Generation error:', error);
            }}
            className="w-full"
            size="md"
          />

          {/* Quick AI Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-lux-blue-900">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrompt('Generate a professional color palette')}
                className="text-xs justify-start"
              >
                <Palette className="w-3 h-3 mr-2" />
                Colors
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrompt('Create engaging marketing copy')}
                className="text-xs justify-start"
              >
                <Type className="w-3 h-3 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrompt('Generate a modern logo design')}
                className="text-xs justify-start"
              >
                <Image className="w-3 h-3 mr-2" />
                Logo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrompt('Optimize design layout')}
                className="text-xs justify-start"
              >
                <TrendingUp className="w-3 h-3 mr-2" />
                Optimize
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <ToolTray
          id="ai-tools"
          title="AI Tools"
          icon={<Sparkles className="w-5 h-5" />}
          sections={sections}
          searchPlaceholder="Search AI tools..."
          viewMode="grid"
          onItemSelect={onAIToolSelect}
          onItemDoubleClick={onAIToolDoubleClick}
          onItemDragStart={onAIToolDragStart}
          className="border-0"
        />
      </div>
    </div>
  );
};

export default AIToolsToolTray;
