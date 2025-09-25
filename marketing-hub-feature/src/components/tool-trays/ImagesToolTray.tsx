import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ToolTray } from './ToolTray';
import type { ToolTrayItem, ToolTraySection } from './ToolTray';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Image,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  Plus,
  X,
  Download,
  Eye,
  Trash2,
  Star,
  FolderOpen,
  Loader2
} from 'lucide-react';
import apiService from '../../services/api';
import { useCanvasStoreEnhanced } from '../../stores/canvasStoreEnhanced';

interface ImageAsset extends ToolTrayItem {
  file_path: string;
  file_size: number;
  mime_type: string;
  width: number;
  height: number;
  thumbnail_url?: string;
  is_public: boolean;
  upload_source: 'user' | 'template' | 'ai_generated';
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface ImagesToolTrayProps {
  onImageSelect?: (image: ImageAsset) => void;
  onImageDoubleClick?: (image: ImageAsset) => void;
  onImageDragStart?: (image: ImageAsset) => void;
  className?: string;
}

export const ImagesToolTray: React.FC<ImagesToolTrayProps> = ({
  onImageSelect,
  onImageDoubleClick,
  onImageDragStart,
  className = ''
}) => {
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [dragOver, setDragOver] = useState(false);
  const [loadingImage, setLoadingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addImageFromUrl } = useCanvasStoreEnhanced();

  // Categories
  const categories = [
    { id: 'all', name: 'All Images', icon: 'Image' },
    { id: 'user', name: 'My Uploads', icon: 'Save' },
    { id: 'template', name: 'Template Assets', icon: 'Layout' },
    { id: 'ai_generated', name: 'AI Generated', icon: 'Sparkles' }
  ];

  // Load images
  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAssets({
        page: 1,
        limit: 100,
        sort_by: 'created_at',
        sort_order: 'desc',
        filter: { category: 'image' }
      });

      if (response.success && response.data) {
        setImages(response.data as ImageAsset[]);
      }
    } catch (err) {
      setError('Failed to load images');
      console.error('Error loading images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImageToCanvas = useCallback(async (imageUrl: string, imageName: string) => {
    try {
      setLoadingImage(imageUrl);
      const image = await addImageFromUrl(imageUrl, {
        name: imageName,
        id: `img_${Date.now()}`
      });
      
      if (image) {
        console.log('Image added to canvas successfully:', imageName);
      } else {
        setError('Failed to add image to canvas');
      }
    } catch (error: any) {
      console.error('Error adding image to canvas:', error);
      setError(error.message || 'Failed to add image to canvas');
    } finally {
      setLoadingImage(null);
    }
  }, [addImageFromUrl]);

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setError(null);

      const fileArray = Array.from(files);
      const response = await apiService.uploadAssets(fileArray, {
        category: 'image',
        description: 'Uploaded image',
        is_public: false
      });

      if (response.success && response.data) {
        setImages(prev => [...(response.data as ImageAsset[]), ...prev]);
      }
    } catch (err) {
      setError('Failed to upload images');
      console.error('Error uploading images:', err);
    } finally {
      setUploading(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files) {
      handleFileUpload(files);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileUpload(files);
    }
  };

  // Filter images
  const filteredImages = images.filter(image => {
    const matchesSearch = searchQuery === '' || 
      image.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || 'user' === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group images by category
  const imagesByCategory = filteredImages.reduce((acc, image) => {
    const category = 'user'; // Default category since upload_source might not exist
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(image);
    return acc;
  }, {} as Record<string, ImageAsset[]>);

  // Create sections
  const sections: ToolTraySection[] = Object.entries(imagesByCategory).map(([category, categoryImages]) => {
    const categoryInfo = categories.find(c => c.id === category);
    return {
      id: category,
      name: categoryInfo?.name || category,
      items: categoryImages.map(image => ({
        ...image,
        thumbnail: image.thumbnail_url || image.file_path,
        metadata: {
          ...image.metadata,
          file_size: image.file_size,
          mime_type: image.mime_type,
          width: image.width,
          height: image.height,
          upload_source: 'user',
          processing_status: image.processing_status
        }
      })),
      collapsible: true,
      defaultExpanded: selectedCategory === category || selectedCategory === 'all'
    };
  });

  const renderImageItem = (item: ToolTrayItem) => {
    const image = item as ImageAsset;
    const isProcessing = image.processing_status === 'processing';
    const isFailed = image.processing_status === 'failed';
    
    return (
      <div className="relative group">
        {/* Processing/Failed Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-60 rounded-xl flex items-center justify-center z-10">
            <div className="text-center text-white">
              <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
              <div className="text-sm">Processing...</div>
            </div>
          </div>
        )}
        
        {isFailed && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-red-500 text-white text-xs shadow-lg">
              Failed
            </Badge>
          </div>
        )}
        
        {/* Image Card */}
        <div className="group relative p-3 rounded-xl border cursor-pointer transition-all duration-300 border-lux-cream-300 hover:border-lux-blue-300 hover:bg-lux-blue-50 hover:shadow-lg group-hover:scale-105">
          {/* Image Preview */}
          {image.thumbnail && (
            <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-lux-cream-100 to-lux-cream-200 mb-3 relative">
              <img 
                src={image.thumbnail} 
                alt={image.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    className="bg-white/90 hover:bg-white text-lux-blue-600 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Preview image:', image.name);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="bg-white/90 hover:bg-white text-lux-blue-600 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Use image:', image.name);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Use
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Image Info */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-lux-blue-900 truncate group-hover:text-lux-blue-700 transition-colors">
                {image.name}
              </h4>
              
              {image.description && (
                <p className="text-xs text-lux-blue-700 line-clamp-2 mt-1">
                  {image.description}
                </p>
              )}
            </div>
            
            {/* Image Metadata */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs px-2 py-1 bg-lux-blue-100 text-lux-blue-700">
                  {image.width}×{image.height}
                </Badge>
                
                <div className="text-lux-blue-600">
                  {(image.file_size / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
              
              <div className="flex items-center space-x-1 text-lux-blue-500">
                <span className="text-xs">
                  {new Date(image.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {/* Tags */}
            {image.tags && image.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {image.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5 bg-lux-blue-100 text-lux-blue-700">
                    {tag}
                  </Badge>
                ))}
                {image.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-lux-blue-100 text-lux-blue-700">
                    +{image.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 pt-2 border-t border-lux-cream-300">
              <Button 
                size="sm" 
                className="flex-1 bg-lux-blue-600 hover:bg-lux-blue-700 text-white text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddImageToCanvas(image.file_path, image.name);
                }}
                disabled={loadingImage === image.file_path}
              >
                {loadingImage === image.file_path ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add to Canvas'
                )}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Download image:', image.name);
                }}
              >
                <Download className="w-3 h-3" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Delete image:', image.name);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-lux-cream-300 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Image className="w-5 h-5 text-lux-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-lux-blue-900">Images</h2>
              <p className="text-sm text-lux-blue-700">Upload and manage your image assets</p>
            </div>
          </div>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload</span>
          </Button>
        </div>

        {/* Upload area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${dragOver 
              ? 'border-lux-blue-400 bg-lux-blue-50' 
              : 'border-lux-cream-300 hover:border-lux-blue-300'
            }
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-lux-blue-400" />
          <p className="text-sm text-lux-blue-700 mb-1">
            {uploading ? 'Uploading...' : 'Drag & drop images here'}
          </p>
          <p className="text-xs text-lux-blue-500">
            or click to browse files
          </p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Filters */}
        <div className="mt-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-lux-blue-400" />
            <Input
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-lux-cream-200 rounded mb-2"></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-24 bg-lux-cream-200 rounded"></div>
                  <div className="h-24 bg-lux-cream-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <div className="text-lux-red-600 text-sm mb-2">Error loading images</div>
            <p className="text-lux-blue-700 text-xs">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadImages}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : sections.length === 0 ? (
          <div className="p-4 text-center">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-lux-blue-300" />
            <div className="text-lux-blue-600 text-sm mb-1">No images found</div>
            <p className="text-lux-blue-500 text-xs">Upload some images to get started</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Custom Image Grid */}
            <div className="p-4">
              {sections.map(section => (
                <div key={section.id} className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-lux-blue-900">
                      {section.name}
                    </h3>
                    <Badge variant="outline" className="text-sm">
                      {section.items.length} images
                    </Badge>
                  </div>
                  
                  <div className={`
                    ${viewMode === 'grid' 
                      ? 'grid grid-cols-1 gap-4' 
                      : 'space-y-3'
                    }
                  `}>
                    {section.items.map(item => renderImageItem(item))}
                  </div>
                </div>
              ))}
              
              {sections.length === 0 && (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 mx-auto text-lux-blue-300 mb-4" />
                  <h3 className="text-lg font-medium text-lux-blue-900 mb-2">No images found</h3>
                  <p className="text-lux-blue-600 mb-4">
                    Upload some images to get started
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-lux-blue-600 hover:bg-lux-blue-700 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Images
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagesToolTray;
