import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  MoreHorizontal,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export interface ToolTrayItem {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ToolTraySection {
  id: string;
  name: string;
  items: ToolTrayItem[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface ToolTrayProps {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  sections: ToolTraySection[];
  searchPlaceholder?: string;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  onItemSelect?: (item: ToolTrayItem) => void;
  onItemDoubleClick?: (item: ToolTrayItem) => void;
  onItemDragStart?: (item: ToolTrayItem) => void;
  onSearch?: (query: string) => void;
  onFilter?: (filters: Record<string, any>) => void;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export const ToolTray: React.FC<ToolTrayProps> = ({
  id,
  title,
  description,
  icon,
  sections,
  searchPlaceholder = "Search...",
  viewMode = 'grid',
  onViewModeChange,
  onItemSelect,
  onItemDoubleClick,
  onItemDragStart,
  onSearch,
  onFilter,
  loading = false,
  error = null,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.filter(s => s.defaultExpanded).map(s => s.id))
  );
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch?.(searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, onSearch]);

  // Handle filters
  useEffect(() => {
    onFilter?.(filters);
  }, [filters, onFilter]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleItemClick = (item: ToolTrayItem) => {
    setSelectedItem(item.id);
    onItemSelect?.(item);
  };

  const handleItemDoubleClick = (item: ToolTrayItem) => {
    onItemDoubleClick?.(item);
  };

  const handleItemDragStart = (e: React.DragEvent, item: ToolTrayItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    onItemDragStart?.(item);
  };

  const renderItem = (item: ToolTrayItem) => {
    const isSelected = selectedItem === item.id;
    
    if (viewMode === 'list') {
      return (
        <div
          key={item.id}
          className={`
            p-3 rounded-lg border cursor-pointer transition-all duration-200
            ${isSelected 
              ? 'border-lux-blue-500 bg-lux-blue-50 shadow-sm' 
              : 'border-lux-cream-300 hover:border-lux-blue-300 hover:bg-lux-blue-50'
            }
          `}
          onClick={() => handleItemClick(item)}
          onDoubleClick={() => handleItemDoubleClick(item)}
          draggable
          onDragStart={(e) => handleItemDragStart(e, item)}
        >
          <div className="flex items-start space-x-3">
            {item.thumbnail && (
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-lux-cream-200 flex-shrink-0">
                <img 
                  src={item.thumbnail} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-lux-blue-900 truncate">
                {item.name}
              </h4>
              {item.description && (
                <p className="text-xs text-lux-blue-700 mt-1 line-clamp-2">
                  {item.description}
                </p>
              )}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      +{item.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Grid view
    return (
      <div
        key={item.id}
        className={`
          group relative p-3 rounded-lg border cursor-pointer transition-all duration-200
          ${isSelected 
            ? 'border-lux-blue-500 bg-lux-blue-50 shadow-sm' 
            : 'border-lux-cream-300 hover:border-lux-blue-300 hover:bg-lux-blue-50'
          }
        `}
        onClick={() => handleItemClick(item)}
        onDoubleClick={() => handleItemDoubleClick(item)}
        draggable
        onDragStart={(e) => handleItemDragStart(e, item)}
      >
        {item.thumbnail && (
          <div className="aspect-square rounded-lg overflow-hidden bg-lux-cream-200 mb-3">
            <img 
              src={item.thumbnail} 
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-lux-blue-900 truncate">
            {item.name}
          </h4>
          {item.description && (
            <p className="text-xs text-lux-blue-700 line-clamp-2">
              {item.description}
            </p>
          )}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  +{item.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 rounded-lg transition-all duration-200 pointer-events-none" />
      </div>
    );
  };

  const renderSection = (section: ToolTraySection) => {
    const isExpanded = expandedSections.has(section.id);
    const hasItems = section.items && section.items.length > 0;

    return (
      <div key={section.id} className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {section.collapsible && (
              <button
                onClick={() => toggleSection(section.id)}
                className="p-1 hover:bg-lux-blue-50 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-lux-blue-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-lux-blue-600" />
                )}
              </button>
            )}
            <h3 className="text-sm font-semibold text-lux-blue-900">
              {section.name}
            </h3>
            {hasItems && (
              <Badge variant="outline" className="text-xs">
                {section.items.length}
              </Badge>
            )}
          </div>
        </div>

        {/* Section Content */}
        {(!section.collapsible || isExpanded) && (
          <div className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-2 gap-3' 
              : 'space-y-2'
            }
          `}>
            {hasItems ? (
              section.items.map(renderItem)
            ) : (
              <div className="col-span-2 text-center py-8 text-lux-blue-500">
                <div className="text-sm">No items found</div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-lux-red-600 text-sm mb-2">Error loading {title}</div>
        <p className="text-lux-blue-700 text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-lux-cream-300">
        <div className="flex items-center space-x-3 mb-3">
          <div className="text-lux-blue-600">{icon}</div>
          <div>
            <h2 className="text-lg font-semibold text-lux-blue-900">{title}</h2>
            {description && (
              <p className="text-sm text-lux-blue-700">{description}</p>
            )}
          </div>
        </div>

        {/* Search and Controls */}
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-lux-blue-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* View Mode and Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange?.('grid')}
                className="p-2"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange?.('list')}
                className="p-2"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            
            <Button variant="ghost" size="sm" className="p-2">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-4">
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
        ) : (
          <div className="space-y-6">
            {sections.map(renderSection)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolTray;

