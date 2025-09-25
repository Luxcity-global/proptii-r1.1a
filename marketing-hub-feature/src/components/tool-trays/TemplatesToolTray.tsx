import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Star,
  Eye,
  Copy,
  Loader2
} from 'lucide-react';
import { useCanvasStoreEnhanced } from '../../stores/canvasStoreEnhanced';

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  platform_targets: string[];
  content_type: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_completion_time: number;
  rating: number;
  rating_count: number;
  usage_count: number;
  is_featured: boolean;
  tags: string[];
  metadata: any;
}

interface TemplatesToolTrayProps {
  onTemplateSelect?: (template: Template) => void;
  onTemplateDoubleClick?: (template: Template) => void;
  onTemplateDragStart?: (template: Template) => void;
  className?: string;
}

export const TemplatesToolTray: React.FC<TemplatesToolTrayProps> = ({
  onTemplateSelect,
  onTemplateDoubleClick,
  onTemplateDragStart,
  className = ''
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);

  const { loadTemplate } = useCanvasStoreEnhanced();

  // Mock templates matching Figma design
  const mockTemplates: Template[] = [
    {
      id: 'modern-minimal',
      name: 'Modern Minimal',
      description: 'Clean, contemporary design with minimalist elements',
      thumbnail: '/api/placeholder/200/200',
      category: 'real_estate',
      platform_targets: ['facebook', 'instagram'],
      content_type: 'social_media',
      difficulty_level: 'beginner',
      estimated_completion_time: 15,
      rating: 4.8,
      rating_count: 120,
      usage_count: 2450,
      is_featured: true,
      tags: ['modern', 'minimal', 'clean'],
      metadata: {}
    },
    {
      id: 'luxury-elegant',
      name: 'Luxury Elegant',
      description: 'Premium styling with sophisticated typography',
      thumbnail: '/api/placeholder/200/200',
      category: 'real_estate',
      platform_targets: ['facebook', 'instagram', 'linkedin'],
      content_type: 'social_media',
      difficulty_level: 'intermediate',
      estimated_completion_time: 25,
      rating: 4.9,
      rating_count: 89,
      usage_count: 1890,
      is_featured: true,
      tags: ['luxury', 'elegant', 'premium'],
      metadata: {}
    },
    {
      id: 'family-friendly',
      name: 'Family Friendly',
      description: 'Warm, inviting design perfect for family properties',
      thumbnail: '/api/placeholder/200/200',
      category: 'real_estate',
      platform_targets: ['facebook', 'instagram'],
      content_type: 'social_media',
      difficulty_level: 'beginner',
      estimated_completion_time: 12,
      rating: 4.7,
      rating_count: 156,
      usage_count: 3200,
      is_featured: false,
      tags: ['family', 'warm', 'inviting'],
      metadata: {}
    }
  ];

  // Load templates
  useEffect(() => {
    setTemplates(mockTemplates);
    setLoading(false);
  }, []);

  const handleTemplateLoad = async (templateId: string) => {
    try {
      setLoadingTemplate(templateId);
      const success = await loadTemplate(templateId);
      
      if (success) {
        console.log('Template loaded successfully:', templateId);
      } else {
        setError('Failed to load template');
      }
    } catch (error: any) {
      console.error('Error loading template:', error);
      setError(error.message || 'Failed to load template');
    } finally {
      setLoadingTemplate(null);
    }
  };

  const renderTemplateItem = (template: Template) => {
    const isLoading = loadingTemplate === template.id;

    return (
      <div
        key={template.id}
        className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer aspect-square"
        onClick={() => {
          handleTemplateLoad(template.id);
          onTemplateSelect?.(template);
        }}
        onDoubleClick={() => {
          handleTemplateLoad(template.id);
          onTemplateDoubleClick?.(template);
        }}
        onDragStart={() => onTemplateDragStart?.(template)}
        draggable
      >
        {/* Template Thumbnail */}
        <div className="relative h-32 bg-gray-100">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          ) : (
            <img
              src={template.thumbnail}
              alt={template.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/api/placeholder/200/200';
              }}
            />
          )}
          
          {/* Featured Badge */}
          {template.is_featured && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
              <Button size="sm" variant="secondary" className="bg-white text-gray-900">
                <Eye className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="secondary" className="bg-white text-gray-900">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Template Info */}
        <div className="p-3">
          <h3 className="font-medium text-gray-900 text-sm truncate">{template.name}</h3>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{template.description}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Templates</h3>
          <p className="text-sm text-gray-600">1200x630 Facebook • Feed Post</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">Templates</h3>
        <p className="text-sm text-gray-600">1200x630 Facebook • Feed Post</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {/* Templates Grid */}
        <div className="grid grid-cols-1 gap-4">
          {templates.map(renderTemplateItem)}
        </div>
      </div>

      {/* Caption Section */}
      <div className="p-3 border-t border-gray-200 flex-shrink-0">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
            <textarea
              placeholder="Write your caption here..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">0/2200</span>
              <Button variant="outline" size="sm">
                # Add hashtags
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Publishing Options */}
      <div className="p-3 border-t border-gray-200 flex-shrink-0">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Publishing Options</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Schedule Post</span>
            <button className="w-10 h-5 bg-gray-200 rounded-full relative">
              <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Auto-hashtags</span>
            <button className="w-10 h-5 bg-blue-600 rounded-full relative">
              <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Cross-post</span>
            <button className="w-10 h-5 bg-gray-200 rounded-full relative">
              <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesToolTray;

