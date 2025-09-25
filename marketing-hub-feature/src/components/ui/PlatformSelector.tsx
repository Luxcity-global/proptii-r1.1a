/**
 * Platform Selector Component
 * Allows users to select social media platforms for content generation
 */

import React, { useState, useCallback } from 'react';
import { Button } from './button';
import { Badge } from './badge';
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter,
  Check,
  Monitor,
  Smartphone
} from 'lucide-react';

export interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  dimensions: {
    width: number;
    height: number;
    ratio: string;
  };
  maxTextLength: number;
  hashtagLimit: number;
}

export const PLATFORMS: Platform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <Facebook className="w-4 h-4" />,
    color: '#1877F2',
    dimensions: {
      width: 1200,
      height: 630,
      ratio: '1.91:1'
    },
    maxTextLength: 2200,
    hashtagLimit: 30
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: <Instagram className="w-4 h-4" />,
    color: '#E4405F',
    dimensions: {
      width: 1080,
      height: 1080,
      ratio: '1:1'
    },
    maxTextLength: 2200,
    hashtagLimit: 30
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: <Linkedin className="w-4 h-4" />,
    color: '#0A66C2',
    dimensions: {
      width: 1200,
      height: 627,
      ratio: '1.91:1'
    },
    maxTextLength: 3000,
    hashtagLimit: 5
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: <Twitter className="w-4 h-4" />,
    color: '#1DA1F2',
    dimensions: {
      width: 1200,
      height: 675,
      ratio: '16:9'
    },
    maxTextLength: 280,
    hashtagLimit: 10
  }
];

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onPlatformsChange: (platforms: string[]) => void;
  maxSelections?: number;
  showDimensions?: boolean;
  showTextLimits?: boolean;
  className?: string;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatforms,
  onPlatformsChange,
  maxSelections,
  showDimensions = true,
  showTextLimits = false,
  className = ''
}) => {
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);

  const handlePlatformToggle = useCallback((platformId: string) => {
    const isSelected = selectedPlatforms.includes(platformId);
    
    if (isSelected) {
      // Remove platform
      onPlatformsChange(selectedPlatforms.filter(id => id !== platformId));
    } else {
      // Add platform (check max selections)
      if (!maxSelections || selectedPlatforms.length < maxSelections) {
        onPlatformsChange([...selectedPlatforms, platformId]);
      }
    }
  }, [selectedPlatforms, onPlatformsChange, maxSelections]);

  const handleSelectAll = useCallback(() => {
    const allPlatforms = PLATFORMS.map(p => p.id);
    const limitedPlatforms = maxSelections ? allPlatforms.slice(0, maxSelections) : allPlatforms;
    onPlatformsChange(limitedPlatforms);
  }, [onPlatformsChange, maxSelections]);

  const handleClearAll = useCallback(() => {
    onPlatformsChange([]);
  }, [onPlatformsChange]);

  const getPlatformById = (id: string) => PLATFORMS.find(p => p.id === id);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-lux-blue-900">Select Platforms</h3>
          <p className="text-sm text-lux-blue-700">
            Choose which social media platforms to generate content for
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={maxSelections ? selectedPlatforms.length >= maxSelections : false}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={selectedPlatforms.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Platform Grid */}
      <div className="grid grid-cols-2 gap-3">
        {PLATFORMS.map(platform => {
          const isSelected = selectedPlatforms.includes(platform.id);
          const isDisabled = !isSelected && maxSelections && selectedPlatforms.length >= maxSelections;
          const isHovered = hoveredPlatform === platform.id;

          return (
            <div
              key={platform.id}
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'border-lux-blue-500 bg-lux-blue-50' 
                  : isDisabled
                  ? 'border-lux-cream-300 bg-lux-cream-100 cursor-not-allowed opacity-50'
                  : 'border-lux-cream-300 bg-white hover:border-lux-blue-300 hover:bg-lux-blue-25'
                }
                ${isHovered ? 'shadow-md' : 'shadow-sm'}
              `}
              onClick={() => !isDisabled && handlePlatformToggle(platform.id)}
              onMouseEnter={() => setHoveredPlatform(platform.id)}
              onMouseLeave={() => setHoveredPlatform(null)}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 bg-lux-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}

              {/* Platform info */}
              <div className="flex items-center space-x-3">
                <div 
                  className="p-2 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${platform.color}20`, color: platform.color }}
                >
                  {platform.icon}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium text-lux-blue-900">{platform.name}</h4>
                  
                  {showDimensions && (
                    <div className="flex items-center space-x-2 text-xs text-lux-blue-600">
                      <Monitor className="w-3 h-3" />
                      <span>{platform.dimensions.ratio}</span>
                      <span>•</span>
                      <span>{platform.dimensions.width}×{platform.dimensions.height}</span>
                    </div>
                  )}
                  
                  {showTextLimits && (
                    <div className="flex items-center space-x-2 text-xs text-lux-blue-600 mt-1">
                      <span>Text: {platform.maxTextLength} chars</span>
                      <span>•</span>
                      <span>Hashtags: {platform.hashtagLimit}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hover effect */}
              {isHovered && !isSelected && !isDisabled && (
                <div className="absolute inset-0 rounded-lg border-2 border-lux-blue-300 bg-lux-blue-25 opacity-50" />
              )}
            </div>
          );
        })}
      </div>

      {/* Selection summary */}
      {selectedPlatforms.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-lux-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-lux-blue-900">
              Selected platforms:
            </span>
            <div className="flex items-center space-x-1">
              {selectedPlatforms.map(platformId => {
                const platform = getPlatformById(platformId);
                return platform ? (
                  <Badge 
                    key={platformId} 
                    variant="secondary" 
                    className="text-xs"
                    style={{ backgroundColor: `${platform.color}20`, color: platform.color }}
                  >
                    {platform.icon}
                    <span className="ml-1">{platform.name}</span>
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
          
          <span className="text-xs text-lux-blue-600">
            {selectedPlatforms.length} of {maxSelections || PLATFORMS.length} selected
          </span>
        </div>
      )}

      {/* Help text */}
      <div className="text-xs text-lux-blue-600 bg-lux-blue-25 p-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <Smartphone className="w-4 h-4" />
          <span>
            Content will be optimized for each selected platform's format, character limits, and audience expectations.
          </span>
        </div>
      </div>
    </div>
  );
};


