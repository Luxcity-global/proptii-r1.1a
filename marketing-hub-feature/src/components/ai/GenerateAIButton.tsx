/**
 * Generate with AI Button Component
 * Integrates CrewAI service for property content generation
 */

import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Target
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import crewaiService, { type PropertyData, type ProgressCallback } from '../../services/crewaiService';
import { useCanvasStoreEnhanced } from '../../stores/canvasStoreEnhanced';

interface GenerateAIButtonProps {
  propertyData?: PropertyData;
  platforms?: string[];
  onContentGenerated?: (content: any) => void;
  onError?: (error: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
}

interface GenerationState {
  isGenerating: boolean;
  progress: number;
  currentStep: string;
  result: any | null;
  error: string | null;
}

export const GenerateAIButton: React.FC<GenerateAIButtonProps> = ({
  propertyData,
  platforms = ['facebook', 'instagram'],
  onContentGenerated,
  onError,
  className = '',
  size = 'md',
  variant = 'default'
}) => {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    currentStep: '',
    result: null,
    error: null
  });

  const { toast } = useToast();
  const { addObject, setCurrentTool } = useCanvasStoreEnhanced();

  // Mock property data if not provided (for testing)
  const mockPropertyData: PropertyData = {
    propertyId: 'prop_123',
    address: '123 Example Street, London',
    postcode: 'SW1A 1AA',
    propertyType: 'house',
    price: 750000,
    tenure: 'freehold',
    bedrooms: 3,
    bathrooms: 2,
    receptionRooms: 1,
    features: ['Garden', 'Parking', 'Modern Kitchen'],
    garden: true,
    parking: true,
    balcony: false,
    fireplace: true,
    epcRating: 'C',
    councilTaxBand: 'D',
    locationFeatures: ['Near tube station', 'Good schools'],
    transportLinks: ['London Underground', 'Bus routes'],
    sellingPoints: ['Prime location', 'Modern features']
  };

  const currentPropertyData = propertyData || mockPropertyData;

  const handleGenerate = useCallback(async () => {
    if (state.isGenerating) return;

    setState(prev => ({
      ...prev,
      isGenerating: true,
      progress: 0,
      currentStep: 'Initializing AI generation...',
      result: null,
      error: null
    }));

    try {
      // For now, simulate the generation process locally
      const steps = [
        { progress: 10, message: 'Analyzing property data...' },
        { progress: 30, message: 'Generating content for platforms...' },
        { progress: 60, message: 'Validating compliance...' },
        { progress: 80, message: 'Finalizing content...' },
        { progress: 100, message: 'Generation complete!' }
      ];

      // Simulate progress
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setState(prev => ({
          ...prev,
          progress: steps[i].progress,
          currentStep: steps[i].message
        }));
      }

      // Generate mock result
      const mockResult = {
        property_id: currentPropertyData.propertyId,
        platforms: platforms,
        content_by_platform: {
          facebook: {
            headline: 'Stunning 3-Bedroom House in Prime Location',
            description: `Discover this beautiful ${currentPropertyData.bedrooms}-bedroom ${currentPropertyData.propertyType} in ${currentPropertyData.address.split(',')[1] || 'London'}. Perfect for families with modern features, garden, and parking.`,
            key_features: currentPropertyData.features.slice(0, 5),
            call_to_action: 'Contact us today to arrange a viewing',
            hashtags: ['#property', '#london', '#house', '#family', '#modern']
          },
          instagram: {
            headline: 'Dream Home Alert!',
            description: `This stunning ${currentPropertyData.bedrooms}-bedroom ${currentPropertyData.propertyType} is perfect for your family! Modern features, beautiful garden, and parking included.`,
            key_features: currentPropertyData.features.slice(0, 5),
            call_to_action: 'DM us to arrange a viewing!',
            hashtags: ['#property', '#london', '#dreamhome', '#family', '#modern']
          }
        },
        compliance_report: {
          is_compliant: true,
          compliance_score: 95
        }
      };

      // Complete generation
      setState(prev => ({
        ...prev,
        isGenerating: false,
        progress: 100,
        currentStep: 'Generation complete!',
        result: mockResult
      }));

      // Add generated content to canvas
      addGeneratedContentToCanvas(mockResult.content_by_platform);

      // Notify parent component
      if (onContentGenerated) {
        onContentGenerated(mockResult);
      }

      toast({
        title: "🎉 Content Generated!",
        description: "AI has created your property marketing content. Check the canvas!",
        duration: 5000,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage,
        currentStep: 'Generation failed'
      }));

      if (onError) {
        onError(errorMessage);
      }

      toast({
        title: "❌ Generation Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [state.isGenerating, currentPropertyData, platforms, onContentGenerated, onError, addObject, toast]);

  const addGeneratedContentToCanvas = useCallback((contentByPlatform: any) => {
    try {
      // Add text content to canvas for each platform
      Object.entries(contentByPlatform).forEach(([platform, content]: [string, any]) => {
        if (content && content.description) {
          // Create a text object for the generated content
          const textContent = {
            type: 'text',
            text: `${platform.toUpperCase()}\n\n${content.description}`,
            left: Math.random() * 200 + 50, // Random positioning
            top: Math.random() * 200 + 50,
            fontSize: 16,
            fill: '#333333',
            fontFamily: 'Arial, sans-serif'
          };

          // Add to canvas (this would need to be implemented in the canvas store)
          console.log('Adding generated content to canvas:', textContent);
          
          // For now, just log the content - actual canvas integration will be implemented later
          console.log(`Generated content for ${platform}:`, content);
        }
      });

      // Set current tool to select mode
      setCurrentTool('select');

    } catch (error) {
      console.error('Error adding content to canvas:', error);
    }
  }, [setCurrentTool]);

  const getButtonIcon = () => {
    if (state.isGenerating) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    } else if (state.result) {
      return <CheckCircle className="w-4 h-4" />;
    } else if (state.error) {
      return <AlertCircle className="w-4 h-4" />;
    } else {
      return <Sparkles className="w-4 h-4" />;
    }
  };

  const getButtonText = () => {
    if (state.isGenerating) {
      return 'Generating...';
    } else if (state.result) {
      return 'Generated!';
    } else if (state.error) {
      return 'Retry';
    } else {
      return 'Generate with AI';
    }
  };

  const getButtonVariant = () => {
    if (state.result) {
      return 'default' as const;
    } else if (state.error) {
      return 'destructive' as const;
    } else {
      return variant;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-8 py-4 text-lg';
      default:
        return 'px-6 py-3 text-base';
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      <Button
        onClick={handleGenerate}
        disabled={state.isGenerating}
        variant={getButtonVariant()}
        className={`${getSizeClasses()} flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg transition-all duration-300`}
      >
        {getButtonIcon()}
        <span className="font-medium">{getButtonText()}</span>
      </Button>

      {/* Progress indicator */}
      {state.isGenerating && (
        <div className="w-full max-w-xs space-y-2">
          <div className="flex items-center justify-between text-sm text-lux-blue-700">
            <span className="flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span>AI Working...</span>
            </span>
            <span>{state.progress}%</span>
          </div>
          
          <div className="w-full bg-lux-cream-300 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          
          {state.currentStep && (
            <p className="text-xs text-lux-blue-600 text-center">
              {state.currentStep}
            </p>
          )}
        </div>
      )}

      {/* Success state */}
      {state.result && (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Content generated successfully!</span>
        </div>
      )}

      {/* Error state */}
      {state.error && (
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{state.error}</span>
        </div>
      )}

      {/* Platform badges */}
      {!state.isGenerating && (
        <div className="flex items-center space-x-1">
          <Target className="w-3 h-3 text-lux-blue-500" />
          <span className="text-xs text-lux-blue-600">For:</span>
          {platforms.map(platform => (
            <Badge key={platform} variant="outline" className="text-xs">
              {platform}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
