import React, { useState, useEffect, useCallback } from 'react';
import { ToolTray } from './ToolTray';
import type { ToolTrayItem, ToolTraySection } from './ToolTray';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  FolderOpen,
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
  Clock,
  Tag,
  Folder,
  FileImage,
  FileText,
  FileVideo,
  FileMusic,
  Archive,
  Share,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import apiService from '../../services/api';
import { useCanvasStoreEnhanced } from '../../stores/canvasStoreEnhanced';

interface Asset extends ToolTrayItem {
  file_path: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  duration?: number; // for video/audio
  thumbnail_url?: string;
  is_public: boolean;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  upload_date: string;
  last_accessed?: string;
  access_count: number;
  tags: string[];
  folder_id?: string;
  version: number;
  versions: AssetVersion[];
  is_favorite: boolean;
  usage_count: number;
  last_used?: string;
  permissions: {
    can_edit: boolean;
    can_delete: boolean;
    can_share: boolean;
    can_download: boolean;
  };
  metadata: {
    dimensions?: { width: number; height: number };
    duration?: number;
    color_palette?: string[];
    dominant_colors?: string[];
    ai_tags?: string[];
    file_format?: string;
    compression_ratio?: number;
    created_by?: string;
    modified_by?: string;
    camera_info?: any;
    exif_data?: any;
  };
}

interface AssetVersion {
  id: string;
  version: number;
  file_path: string;
  file_size: number;
  created_at: string;
  created_by: string;
  change_description?: string;
  is_current: boolean;
}

interface Folder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  asset_count: number;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  color?: string;
  icon?: string;
  permissions: {
    can_edit: boolean;
    can_delete: boolean;
    can_add_assets: boolean;
  };
  metadata: {
    total_size: number;
    last_modified: string;
    created_by: string;
  };
}

interface AssetCollection {
  id: string;
  name: string;
  description?: string;
  assets: string[]; // Asset IDs
  created_at: string;
  is_public: boolean;
  tags: string[];
  cover_image?: string;
}

interface AssetFilter {
  type?: 'image' | 'video' | 'audio' | 'document' | 'all';
  size?: 'small' | 'medium' | 'large' | 'all';
  date_range?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  folder?: string;
  favorites?: boolean;
  recently_used?: boolean;
}

interface AssetsToolTrayProps {
  onAssetSelect?: (asset: Asset) => void;
  onAssetDoubleClick?: (asset: Asset) => void;
  onAssetDragStart?: (asset: Asset) => void;
  className?: string;
}

export const AssetsToolTray: React.FC<AssetsToolTrayProps> = ({
  onAssetSelect,
  onAssetDoubleClick,
  onAssetDragStart,
  className = ''
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loadingAsset, setLoadingAsset] = useState<string | null>(null);
  const [showFolders, setShowFolders] = useState(true);

  const { addImageFromUrl, addText } = useCanvasStoreEnhanced();

  // Asset types
  const assetTypes = [
    { id: 'all', name: 'All Assets', icon: 'Save', count: assets.length },
    { id: 'image', name: 'Images', icon: 'Image', count: assets.filter(a => a.mime_type.startsWith('image/')).length },
    { id: 'video', name: 'Videos', icon: 'Video', count: assets.filter(a => a.mime_type.startsWith('video/')).length },
    { id: 'audio', name: 'Audio', icon: 'Music', count: assets.filter(a => a.mime_type.startsWith('audio/')).length },
    { id: 'document', name: 'Documents', icon: 'FileText', count: assets.filter(a => a.mime_type.includes('pdf') || a.mime_type.includes('text')).length }
  ];

  // Load assets and folders
  useEffect(() => {
    loadAssets();
    loadFolders();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAssets({
        page: 1,
        limit: 100,
        sort_by: 'created_at',
        sort_order: 'desc'
      });

      if (response.success && response.data) {
        setAssets(response.data as Asset[]);
      }
    } catch (err) {
      setError('Failed to load assets');
      console.error('Error loading assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      // Mock folder data for now
      const mockFolders: Folder[] = [
        {
          id: 'recent',
          name: 'Recent',
          asset_count: assets.filter(a => new Date(a.upload_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_default: true
        },
        {
          id: 'favorites',
          name: 'Favorites',
          asset_count: assets.filter(a => a.tags.includes('favorite')).length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_default: true
        },
        {
          id: 'social-media',
          name: 'Social Media',
          asset_count: assets.filter(a => a.tags.includes('social-media')).length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_default: false
        },
        {
          id: 'brand-assets',
          name: 'Brand Assets',
          asset_count: assets.filter(a => a.tags.includes('brand')).length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_default: false
        }
      ];
      setFolders(mockFolders);
    } catch (err) {
      console.error('Error loading folders:', err);
    }
  };

  const handleAddAssetToCanvas = useCallback(async (asset: Asset) => {
    try {
      setLoadingAsset(asset.id);
      
      if (asset.mime_type.startsWith('image/')) {
        const image = await addImageFromUrl(asset.file_path, {
          name: asset.name,
          id: `asset_${asset.id}`
        });
        
        if (image) {
          console.log('Asset added to canvas successfully:', asset.name);
        } else {
          setError('Failed to add asset to canvas');
        }
      } else if (asset.mime_type.includes('text')) {
        // For text assets, add as text element
        addText(asset.name, {
          fontSize: 16,
          fontFamily: 'Arial',
          fill: '#333333'
        });
        console.log('Text asset added to canvas:', asset.name);
      } else {
        setError('Asset type not supported for canvas');
      }
    } catch (error: any) {
      console.error('Error adding asset to canvas:', error);
      setError(error.message || 'Failed to add asset to canvas');
    } finally {
      setLoadingAsset(null);
    }
  }, [addImageFromUrl, addText]);

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = searchQuery === '' || 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'all' || 
      (selectedType === 'image' && asset.mime_type.startsWith('image/')) ||
      (selectedType === 'video' && asset.mime_type.startsWith('video/')) ||
      (selectedType === 'audio' && asset.mime_type.startsWith('audio/')) ||
      (selectedType === 'document' && (asset.mime_type.includes('pdf') || asset.mime_type.includes('text')));

    const matchesFolder = selectedFolder === 'all' ||
      (selectedFolder === 'recent' && new Date(asset.upload_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (selectedFolder === 'favorites' && asset.tags.includes('favorite')) ||
      (selectedFolder === 'social-media' && asset.tags.includes('social-media')) ||
      (selectedFolder === 'brand-assets' && asset.tags.includes('brand'));

    return matchesSearch && matchesType && matchesFolder;
  });

  // Create sections
  const sections: ToolTraySection[] = [];

  if (filteredAssets.length > 0) {
    sections.push({
      id: 'assets',
      name: `${selectedFolder === 'all' ? 'All Assets' : folders.find(f => f.id === selectedFolder)?.name || 'Assets'}`,
      items: filteredAssets.map(asset => ({
        ...asset,
        thumbnail: asset.thumbnail_url || asset.file_path,
        metadata: {
          ...asset.metadata,
          file_size: asset.file_size,
          mime_type: asset.mime_type,
          upload_date: asset.upload_date,
          access_count: asset.access_count
        }
      })),
      defaultExpanded: true
    });
  }

  const getAssetIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="w-4 h-4" />;
    if (mimeType.startsWith('video/')) return <FileVideo className="w-4 h-4" />;
    if (mimeType.startsWith('audio/')) return <FileMusic className="w-4 h-4" />;
    if (mimeType.includes('pdf') || mimeType.includes('text')) return <FileText className="w-4 h-4" />;
    return <Archive className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderAssetItem = (item: ToolTrayItem) => {
    const asset = item as Asset;
    const isProcessing = asset.processing_status === 'processing';
    const isFailed = asset.processing_status === 'failed';
    const isFavorite = asset.tags.includes('favorite');
    
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

        {/* Favorite Badge */}
        {isFavorite && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-yellow-500 text-white text-xs shadow-lg">
              <Star className="w-3 h-3 mr-1 fill-current" />
            </Badge>
          </div>
        )}

        {/* Asset Card */}
        <div className={`
          relative p-3 rounded-xl border cursor-pointer transition-all duration-300
          ${isProcessing || isFailed 
            ? 'border-gray-300 bg-gray-50' 
            : 'border-lux-cream-300 hover:border-lux-blue-300 hover:bg-lux-blue-50 hover:shadow-md'
          }
          group-hover:scale-105 group-hover:shadow-lg
        `}>
          {/* Asset Preview */}
          {asset.thumbnail && asset.mime_type.startsWith('image/') ? (
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-lux-cream-100 to-lux-cream-200 mb-3 relative">
              <img 
                src={asset.thumbnail} 
                alt={asset.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button 
                    size="sm" 
                    className="bg-white/90 hover:bg-white text-lux-blue-600 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Quick preview:', asset.name);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-lux-cream-100 to-lux-cream-200 mb-3 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl mb-2">
                  {getAssetIcon(asset.mime_type)}
                </div>
                <div className="text-xs text-lux-blue-600 font-medium">
                  {asset.mime_type.split('/')[1]?.toUpperCase()}
                </div>
              </div>
            </div>
          )}
          
          {/* Asset Info */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-lux-blue-900 truncate group-hover:text-lux-blue-700 transition-colors">
                {asset.name}
              </h4>
              
              {asset.description && (
                <p className="text-xs text-lux-blue-700 line-clamp-2 mt-1">
                  {asset.description}
                </p>
              )}
            </div>
            
            {/* Asset Metadata */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline" 
                  className="text-xs px-2 py-1 border-lux-blue-300 text-lux-blue-700 bg-lux-blue-50"
                >
                  {formatFileSize(asset.file_size)}
                </Badge>
                
                {asset.metadata.dimensions && (
                  <div className="flex items-center text-lux-blue-600">
                    {getAssetIcon(asset.mime_type)}
                    <span className="ml-1">{asset.metadata.dimensions.width}x{asset.metadata.dimensions.height}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center text-lux-blue-500">
                <Clock className="w-3 h-3 mr-1" />
                <span>{new Date(asset.upload_date).toLocaleDateString()}</span>
              </div>
            </div>
            
            {/* Access Count */}
            {asset.access_count > 0 && (
              <div className="flex items-center text-xs text-lux-blue-500">
                <Eye className="w-3 h-3 mr-1" />
                <span>{asset.access_count} views</span>
              </div>
            )}
            
            {/* Tags */}
            {asset.tags && asset.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {asset.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5 bg-lux-blue-100 text-lux-blue-700">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
                {asset.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-lux-blue-100 text-lux-blue-700">
                    +{asset.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pt-2 border-t border-lux-cream-300">
            <Button 
              size="sm" 
              className="flex-1 bg-lux-blue-600 hover:bg-lux-blue-700 text-white text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleAddAssetToCanvas(asset);
              }}
              disabled={loadingAsset === asset.id || isProcessing || isFailed}
            >
              {loadingAsset === asset.id ? (
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
                console.log('Download asset:', asset.name);
              }}
            >
              <Download className="w-3 h-3" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="p-2"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Share asset:', asset.name);
              }}
            >
              <Share className="w-3 h-3" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="p-2"
              onClick={(e) => {
                e.stopPropagation();
                console.log('More options:', asset.name);
              }}
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header with filters */}
      <div className="p-4 border-b border-lux-cream-300 bg-white">
        <div className="flex items-center space-x-3 mb-4">
          <FolderOpen className="w-5 h-5 text-lux-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-lux-blue-900">Assets</h2>
            <p className="text-sm text-lux-blue-700">Manage your uploaded assets and media library</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2 mb-4">
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowFolders(!showFolders)}
          >
            <Folder className="w-4 h-4" />
          </Button>
        </div>

        {/* Asset Types */}
        <div className="flex flex-wrap gap-2 mb-4">
          {assetTypes.map(type => (
            <Button
              key={type.id}
              variant={selectedType === type.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type.id)}
              className="text-xs"
            >
              <span className="mr-1">{type.icon}</span>
              {type.name}
              {type.count > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {type.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Folders */}
        {showFolders && (
          <div className="flex flex-wrap gap-2">
            {folders.map(folder => (
              <Button
                key={folder.id}
                variant={selectedFolder === folder.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedFolder(folder.id)}
                className="text-xs"
              >
                <Folder className="w-3 h-3 mr-1" />
                {folder.name}
                {folder.asset_count > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {folder.asset_count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        )}
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
            <div className="text-lux-red-600 text-sm mb-2">Error loading assets</div>
            <p className="text-lux-blue-700 text-xs">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadAssets}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : sections.length === 0 ? (
          <div className="p-4 text-center">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-lux-blue-300" />
            <div className="text-lux-blue-600 text-sm mb-1">No assets found</div>
            <p className="text-lux-blue-500 text-xs">Upload some assets to get started</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Custom Asset Grid */}
            <div className="p-4">
              {sections.map(section => (
                <div key={section.id} className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-lux-blue-900">
                      {section.name}
                    </h3>
                    <Badge variant="outline" className="text-sm">
                      {section.items.length} assets
                    </Badge>
                  </div>
                  
                  <div className={`
                    ${viewMode === 'grid' 
                      ? 'grid grid-cols-1 gap-4' 
                      : 'space-y-3'
                    }
                  `}>
                    {section.items.map(item => renderAssetItem(item))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetsToolTray;


