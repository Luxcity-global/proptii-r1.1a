/**
 * Enhanced Canvas Layout Component
 * Features platform-specific dimensions, zoom controls, and publishing options
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Save, 
  Download, 
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronDown,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Calendar,
  Hash,
  Share2,
  MoreHorizontal,
  ArrowLeft
} from 'lucide-react';
import { GenerateAIButton } from '../ai/GenerateAIButton';
import { ToolTrayRouter } from '../tool-trays/ToolTrayRouter';
import { ToolTrayIcon } from '../tool-trays/ToolTrayIcon';
import { useToolTrayStore } from '../../stores/toolTrayStore';
import { PLATFORM_CONFIG, getPlatformById, getPlatformTypeById, getDefaultTypeForPlatform, type PlatformType } from '../../constants/platformConfig';

interface EnhancedCanvasLayoutProps {
  onCanvasReady?: (canvas: fabric.Canvas) => void;
  onCloseCanvas?: () => void;
  className?: string;
}

interface CanvasState {
  selectedPlatform: string;
  selectedType: string;
  zoom: number;
  dimensions: { width: number; height: number };
  isDragging: boolean;
}

type ToolTrayType = 'templates' | 'images' | 'elements' | 'text' | 'ai-tools' | 'layers' | 'assets';

const PLATFORM_ICONS = {
  facebook: <Facebook className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
  twitter: <Twitter className="w-4 h-4" />
};

const EnhancedCanvasLayout: React.FC<EnhancedCanvasLayoutProps> = ({
  onCanvasReady,
  onCloseCanvas,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const { activeTray: activeToolTray, setActiveTray: setActiveToolTray } = useToolTrayStore();

  const toolTrays = [
    { id: 'templates', name: 'Templates', icon: undefined, color: 'bg-blue-500' },
    { id: 'images', name: 'Images', icon: undefined, color: 'bg-green-500' },
    { id: 'elements', name: 'Elements', icon: undefined, color: 'bg-purple-500' },
    { id: 'text', name: 'Text', icon: undefined, color: 'bg-orange-500' },
    { id: 'ai-tools', name: 'AI Tools', icon: undefined, color: 'bg-pink-500' },
    { id: 'layers', name: 'Layers', icon: undefined, color: 'bg-indigo-500' },
    { id: 'assets', name: 'Assets', icon: undefined, color: 'bg-gray-500' }
  ];

  const [canvasState, setCanvasState] = useState<CanvasState>({
    selectedPlatform: 'facebook',
    selectedType: 'feed-post',
    zoom: 100,
    dimensions: { width: 1200, height: 630 },
    isDragging: false
  });

  // Enhanced sample content creation matching exact Figma design
  const createSampleContent = useCallback(async (canvas: fabric.Canvas) => {
    canvas.clear();
    canvas.backgroundColor = '#FFFFFF'; // White background
    
    // Use full canvas dimensions (matching Figma design)
    const containerWidth = canvas.getWidth();
    const containerHeight = canvas.getHeight();
    
    // Layer 1: Full background property image 
    try {
      let img;
      try {
        // Try to load the exact Figma image first
        img = await new Promise((resolve, reject) => {
          const imageObj = new Image();
          imageObj.crossOrigin = 'anonymous';
          imageObj.onload = () => resolve(imageObj);
          imageObj.onerror = reject;
          // Using similar modern apartment image to match Figma
          imageObj.src = 'https://images.unsplash.com/photo-1603072845032-7b5bd641a82a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzU4MDQ2MTA3fDA&ixlib=rb-4.1.0&q=80&w=1200&h=630';
        });
      } catch (firstError) {
        // Fallback to local image
        img = await new Promise((resolve, reject) => {
          const imageObj = new Image();
          imageObj.onload = () => resolve(imageObj);
          imageObj.onerror = reject;
          imageObj.src = '/images/main-home-photo-1.jpg';
        });
      }
      
      const heroImage = new (window as any).fabric.Image(img, {
        left: 0,
        top: 0,
        scaleToWidth: containerWidth,
        scaleToHeight: containerHeight,
        crossOrigin: 'anonymous'
      });
      canvas.add(heroImage);
    } catch (error) {
      // Fallback gradient if all images fail
      const gradientBackground = new (window as any).fabric.Rect({
        left: 0,
        top: 0,
        width: containerWidth,
        height: containerHeight,
        fill: 'linear-gradient(135deg, #64748B 0%, #475569 100%)'
      });
      canvas.add(gradientBackground);
    }
    
    // Layer 2: Gradient overlay for text readability (matching Figma)
    const gradientOverlay = new (window as any).fabric.Rect({
      left: 0,
      top: 0,
      width: containerWidth,
      height: containerHeight,
      fill: 'rgba(0, 0, 0, 0.4)', // Subtle dark overlay
      opacity: 0.6
    });
    canvas.add(gradientOverlay);
    
    // Layer 3: Status Badge (Top-left) - "✓ AVAILABLE NOW" (exact Figma styling)
    const availableBadge = new (window as any).fabric.Rect({
      left: 24,
      top: 24,
      width: 140,
      height: 32,
      fill: '#22C55E', // Figma green color
      rx: 16,
      ry: 16,
      shadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
    });
    canvas.add(availableBadge);
    
    const availableText = new (window as any).fabric.Text('✓ AVAILABLE NOW', {
      left: 94,
      top: 40,
      fontSize: 13,
      fill: '#FFFFFF',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontWeight: 'bold',
      originX: 'center',
      originY: 'center'
    });
    canvas.add(availableText);
    
    // Layer 4: New Listing Badge (Top-right) - "🔥 NEW LISTING" (exact Figma styling)
    const newListingBadge = new (window as any).fabric.Rect({
      left: containerWidth - 148,
      top: 24,
      width: 124,
      height: 32,
      fill: '#FF6B35', // Figma orange color  
      rx: 16,
      ry: 16,
      shadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
    });
    canvas.add(newListingBadge);
    
    const newListingText = new (window as any).fabric.Text('🔥 NEW LISTING', {
      left: containerWidth - 86,
      top: 40,
      fontSize: 13,
      fill: '#FFFFFF',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontWeight: 'bold',
      originX: 'center',
      originY: 'center'
    });
    canvas.add(newListingText);
    
    // Layer 5: Main Title (Center) - Larger and bolder like Figma
    const mainTitle = new (window as any).fabric.Text('Luxury Shoreditch Apartment', {
      left: containerWidth / 2,
      top: containerHeight * 0.42,
      fontSize: Math.max(32, containerWidth * 0.045), // Responsive but larger
      fill: '#FFFFFF',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontWeight: 'bold',
      originX: 'center',
      originY: 'center',
      textAlign: 'center',
      shadow: '0 2px 12px rgba(0, 0, 0, 0.5)' // Text shadow for readability
    });
    canvas.add(mainTitle);
    
    // Layer 6: Subtitle (Below title) - Matching Figma positioning
    const subtitle = new (window as any).fabric.Text('Book Viewing Now', {
      left: containerWidth / 2,
      top: containerHeight * 0.58,
      fontSize: Math.max(18, containerWidth * 0.032), // Responsive sizing
      fill: '#FFFFFF',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontWeight: '600',
      originX: 'center',
      originY: 'center',
      textAlign: 'center',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
    });
    canvas.add(subtitle);
    
    // Layer 7: Thumbnail Gallery (Bottom-right) - Matching Figma position
    const thumbSize = 42; // Larger like Figma
    const thumbSpacing = 6;
    const thumbStartX = containerWidth - 180; // Right side positioning
    const thumbY = containerHeight - 120; // Bottom positioning
    
    // First thumbnail with actual image
    try {
      const thumb1Img = await new Promise((resolve, reject) => {
        const imageObj = new Image();
        imageObj.crossOrigin = 'anonymous';
        imageObj.onload = () => resolve(imageObj);
        imageObj.onerror = reject;
        imageObj.src = 'https://images.unsplash.com/photo-1668089677938-b52086753f77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxsdXh1cnklMjBiZWRyb29tJTIwbW9kZXJuJTIwZGVzaWdufGVufDF8fHx8MTc1ODEwNzUxM3ww&ixlib=rb-4.1.0&q=80&w=200&h=200';
      });
      
      const thumb1 = new (window as any).fabric.Image(thumb1Img, {
        left: thumbStartX,
        top: thumbY,
        scaleToWidth: thumbSize,
        scaleToHeight: thumbSize,
        crossOrigin: 'anonymous',
        clipPath: new (window as any).fabric.Rect({
          left: thumbStartX,
          top: thumbY,
          width: thumbSize,
          height: thumbSize,
          rx: 8,
          ry: 8,
          absolutePositioned: true
        })
      });
      canvas.add(thumb1);
    } catch (error) {
      // Fallback rectangle
      const thumb1 = new (window as any).fabric.Rect({
        left: thumbStartX,
        top: thumbY,
        width: thumbSize,
        height: thumbSize,
        fill: '#64748B',
        rx: 8,
        ry: 8
      });
      canvas.add(thumb1);
    }
    
    // Second thumbnail with actual image
    try {
      const thumb2Img = await new Promise((resolve, reject) => {
        const imageObj = new Image();
        imageObj.crossOrigin = 'anonymous';
        imageObj.onload = () => resolve(imageObj);
        imageObj.onerror = reject;
        imageObj.src = 'https://images.unsplash.com/photo-1672322331200-c4ac12a93c15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxtb2Rlcm4lMjBraXRjaGVuJTIwYXBhcnRtZW50JTIwdmlld3xlbnwxfHx8fDE3NTgxMDc1MTd8MA&ixlib=rb-4.1.0&q=80&w=200&h=200';
      });
      
      const thumb2 = new (window as any).fabric.Image(thumb2Img, {
        left: thumbStartX + thumbSize + thumbSpacing,
        top: thumbY,
        scaleToWidth: thumbSize,
        scaleToHeight: thumbSize,
        crossOrigin: 'anonymous',
        clipPath: new (window as any).fabric.Rect({
          left: thumbStartX + thumbSize + thumbSpacing,
          top: thumbY,
          width: thumbSize,
          height: thumbSize,
          rx: 8,
          ry: 8,
          absolutePositioned: true
        })
      });
      canvas.add(thumb2);
    } catch (error) {
      // Fallback rectangle
      const thumb2 = new (window as any).fabric.Rect({
        left: thumbStartX + thumbSize + thumbSpacing,
        top: thumbY,
        width: thumbSize,
        height: thumbSize,
        fill: '#475569',
        rx: 8,
        ry: 8
      });
      canvas.add(thumb2);
    }
    
    // "+5" counter with Figma blue background
    const plusCounter = new (window as any).fabric.Rect({
      left: thumbStartX + (thumbSize + thumbSpacing) * 2,
      top: thumbY,
      width: thumbSize,
      height: thumbSize,
      fill: '#3B82F6', // Figma blue color
      rx: 8,
      ry: 8,
      stroke: '#FFFFFF',
      strokeWidth: 2
    });
    canvas.add(plusCounter);
    
    const plusText = new (window as any).fabric.Text('+5', {
      left: thumbStartX + (thumbSize + thumbSpacing) * 2 + thumbSize / 2,
      top: thumbY + thumbSize / 2,
      fontSize: 14,
      fill: '#FFFFFF',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontWeight: 'bold',
      originX: 'center',
      originY: 'center'
    });
    canvas.add(plusText);
    
    // Layer 8: Bottom Info Bar (white background) - Matching Figma
    const infoBarHeight = 80;
    const infoBar = new (window as any).fabric.Rect({
      left: 0,
      top: containerHeight - infoBarHeight,
      width: containerWidth,
      height: infoBarHeight,
      fill: '#FFFFFF',
      stroke: '#E5E7EB',
      strokeWidth: 1
    });
    canvas.add(infoBar);
    
    // Layer 9: Proptii Logo and Info (Left side) - Exact Figma styling
    const logoCircle = new (window as any).fabric.Circle({
      left: 24,
      top: containerHeight - infoBarHeight + 20,
      radius: 20,
      fill: '#3B82F6', // Figma blue
      stroke: '#FFFFFF',
      strokeWidth: 2
    });
    canvas.add(logoCircle);
    
    const logoText = new (window as any).fabric.Text('P', {
      left: 24 + 20,
      top: containerHeight - infoBarHeight + 40,
      fontSize: 16,
      fill: '#FFFFFF',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontWeight: 'bold',
      originX: 'center',
      originY: 'center'
    });
    canvas.add(logoText);
    
    const companyName = new (window as any).fabric.Text('Proptii', {
      left: 70,
      top: containerHeight - infoBarHeight + 28,
      fontSize: 16,
      fill: '#1F2937',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontWeight: 'bold'
    });
    canvas.add(companyName);
    
    const tagline = new (window as any).fabric.Text('Trusted Property Partner', {
      left: 70,
      top: containerHeight - infoBarHeight + 48,
      fontSize: 12,
      fill: '#6B7280',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontWeight: '500'
    });
    canvas.add(tagline);
    
    // Layer 10: Location and Verification (Right side) - Exact Figma positioning
    const locationText = new (window as any).fabric.Text('📍 Shoreditch, E1', {
      left: containerWidth - 24,
      top: containerHeight - infoBarHeight + 28,
      fontSize: 12,
      fill: '#3B82F6',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontWeight: '500',
      originX: 'right'
    });
    canvas.add(locationText);
    
    const verificationText = new (window as any).fabric.Text('✓ Verified Listing', {
      left: containerWidth - 24,
      top: containerHeight - infoBarHeight + 48,
      fontSize: 12,
      fill: '#22C55E',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontWeight: '600',
      originX: 'right'
    });
    canvas.add(verificationText);
    
    // Render all canvas elements
    canvas.renderAll();
  }, [canvasState.dimensions]);

  const updateCanvasSize = useCallback((dimensions: { width: number; height: number }) => {
    if (!fabricCanvasRef.current || !canvasContainerRef.current) return;
    
    const container = canvasContainerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate size to fit 60% of container while maintaining aspect ratio
    const aspectRatio = dimensions.width / dimensions.height;
    const maxWidth = containerWidth * 0.6;
    const maxHeight = containerHeight * 0.6;
    
    let canvasWidth, canvasHeight;
    
    if (maxWidth / aspectRatio <= maxHeight) {
      canvasWidth = maxWidth;
      canvasHeight = maxWidth / aspectRatio;
    } else {
      canvasHeight = maxHeight;
      canvasWidth = maxHeight * aspectRatio;
    }
    
    // Apply zoom
    const zoomedWidth = (canvasWidth * canvasState.zoom) / 100;
    const zoomedHeight = (canvasHeight * canvasState.zoom) / 100;
    
    fabricCanvasRef.current.setDimensions({
      width: zoomedWidth,
      height: zoomedHeight
    });
    
    fabricCanvasRef.current.setViewportTransform([canvasState.zoom / 100, 0, 0, canvasState.zoom / 100, 0, 0]);
    
    // After resizing, rebuild sample content exactly once to avoid duplicates
    fabricCanvasRef.current.off && fabricCanvasRef.current.off('after:render');
    createSampleContent(fabricCanvasRef.current);
    
    fabricCanvasRef.current.renderAll();
  }, [canvasState.zoom, createSampleContent]);

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [publishingOptions, setPublishingOptions] = useState({
    schedulePost: false,
    autoHashtags: true,
    crossPost: false
  });

  // Initialize fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new (window as any).fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f8f9fa',
      selection: true,
      preserveObjectStacking: true
    });

    fabricCanvasRef.current = canvas;
    
    // Size canvas and draw once it's ready
    updateCanvasSize(canvasState.dimensions);
    if (onCanvasReady) {
      onCanvasReady(canvas);
    }

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [updateCanvasSize, onCanvasReady]);

  // Handle zoom changes
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setZoom(canvasState.zoom / 100);
      // Recenter content to prevent drift on zoom
      createSampleContent(fabricCanvasRef.current);
      fabricCanvasRef.current.renderAll();
    }
  }, [canvasState.zoom, createSampleContent]);

  // Update canvas when platform or type changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    
    const platform = getPlatformById(canvasState.selectedPlatform);
    const type = getPlatformTypeById(canvasState.selectedPlatform, canvasState.selectedType);
    
    if (platform && type) {
      setCanvasState(prev => ({
        ...prev,
        dimensions: type.dimensions
      }));
      updateCanvasSize(type.dimensions);
    }
  }, [canvasState.selectedPlatform, canvasState.selectedType, createSampleContent, updateCanvasSize]);

  const handlePlatformChange = (platformId: string) => {
    const defaultType = getDefaultTypeForPlatform(platformId);
    if (defaultType) {
      setCanvasState(prev => ({
        ...prev,
        selectedPlatform: platformId,
        selectedType: defaultType.id,
        dimensions: defaultType.dimensions
      }));
    }
  };

  const handleTypeChange = (typeId: string) => {
    const type = getPlatformTypeById(canvasState.selectedPlatform, typeId);
    if (type) {
      setCanvasState(prev => ({
        ...prev,
        selectedType: typeId,
        dimensions: type.dimensions
      }));
    }
    setShowTypeDropdown(false);
  };

  const handleZoomIn = () => {
    setCanvasState(prev => {
      const newZoom = Math.min(prev.zoom + 25, 200);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.setZoom(newZoom / 100);
        fabricCanvasRef.current.renderAll();
      }
      return { ...prev, zoom: newZoom };
    });
  };

  const handleZoomOut = () => {
    setCanvasState(prev => {
      const newZoom = Math.max(prev.zoom - 25, 50);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.setZoom(newZoom / 100);
        fabricCanvasRef.current.renderAll();
      }
      return { ...prev, zoom: newZoom };
    });
  };

  const handleFit = () => {
    setCanvasState(prev => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.setZoom(1);
        fabricCanvasRef.current.renderAll();
      }
      return { ...prev, zoom: 100 };
    });
  };

  const togglePublishingOption = (option: keyof typeof publishingOptions) => {
    setPublishingOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const platform = getPlatformById(canvasState.selectedPlatform);
  const currentType = getPlatformTypeById(canvasState.selectedPlatform, canvasState.selectedType);

  return (
    <div className={`flex flex-col h-screen bg-gray-50 overflow-hidden ${className}`}>
      {/* Enhanced Header Navigation */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0" style={{height: '64px'}}>
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:text-gray-900 px-2 font-medium"
              onClick={onCloseCanvas}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Hub
            </Button>
            <div className="border-l border-gray-200 pl-6">
              <h1 className="text-xl font-semibold text-slate-800 mb-1" style={{fontSize: '20px', fontWeight: '600'}}>
                Create Social Media Assets
              </h1>
              <p className="text-sm text-gray-500" style={{fontSize: '14px', fontWeight: '400'}}>
                Design compelling visuals for your property marketing
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
              style={{borderRadius: '8px', padding: '12px 16px', fontSize: '14px', fontWeight: '500'}}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
              style={{borderRadius: '8px', padding: '12px 16px', fontSize: '14px', fontWeight: '500'}}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              style={{backgroundColor: '#1877F2', borderRadius: '8px', padding: '12px 16px', fontSize: '14px', fontWeight: '500'}}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate with AI
            </Button>
          </div>
        </div>
      </header>
      
      {/* Enhanced Platform Selection */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Platform Tabs */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700" style={{fontSize: '14px', fontWeight: '500'}}>Platform:</span>
              <div className="flex space-x-1">
                {PLATFORM_CONFIG.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => handlePlatformChange(platform.id)}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      canvasState.selectedPlatform === platform.id
                        ? 'text-white border-transparent shadow-sm'
                        : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                    style={{
                      backgroundColor: canvasState.selectedPlatform === platform.id ? platform.color : undefined,
                      fontSize: '14px',
                      fontWeight: '500',
                      padding: '12px',
                      gap: '4px'
                    }}
                  >
                    {PLATFORM_ICONS[platform.id as keyof typeof PLATFORM_ICONS]}
                    <span className="ml-2">{platform.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Asset Type Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700" style={{fontSize: '14px', fontWeight: '500'}}>Type:</span>
              <div className="relative">
                <button
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="inline-flex items-center justify-between w-48 px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{
                    fontSize: '14px',
                    fontWeight: '400',
                    borderRadius: '6px',
                    padding: '8px',
                    width: '192px'
                  }}
                >
                  <span className="flex items-center">
                    {currentType?.name || 'Select Type'}
                    <Badge 
                      variant="outline" 
                      className="ml-2 text-xs text-gray-500 border-gray-300"
                      style={{fontSize: '12px'}}
                    >
                      {currentType?.dimensions ? `${currentType.dimensions.width}×${currentType.dimensions.height}` : ''}
                    </Badge>
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {showTypeDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20" style={{borderRadius: '8px'}}>
                    {platform?.types?.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleTypeChange(type.id)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between"
                        style={{fontSize: '14px', fontWeight: '400', padding: '8px 12px'}}
                      >
                        <span>{type.name}</span>
                        <Badge 
                          variant="outline" 
                          className="text-xs text-gray-500 border-gray-300"
                          style={{fontSize: '12px'}}
                        >
                          {type.dimensions.width}×{type.dimensions.height}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Canvas Control Bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Dimension Badge */}
            <Badge 
              variant="outline" 
              className="text-sm font-medium text-gray-600 border-gray-300 bg-white"
              style={{
                fontSize: '14px', 
                fontWeight: '500',
                borderRadius: '999px',
                padding: '4px 8px'
              }}
            >
              {currentType?.dimensions ? `${currentType.dimensions.width}×${currentType.dimensions.height}` : '1200×630'}
            </Badge>
            
            {/* Context Label */}
            <span className="text-sm text-gray-500" style={{fontSize: '14px', fontWeight: '400'}}>
              {platform?.name} • {currentType?.name || 'Feed Post'}
            </span>
          </div>
          
          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleZoomOut}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              style={{borderRadius: '6px'}}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleFit}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              style={{borderRadius: '6px', fontSize: '14px', fontWeight: '500'}}
            >
              Fit
            </Button>
            
            <span 
              className="px-2 py-1 text-sm font-medium text-gray-600 min-w-[3rem] text-center"
              style={{fontSize: '14px', fontWeight: '500'}}
            >
              {canvasState.zoom}%
            </span>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleZoomIn}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              style={{borderRadius: '6px'}}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Tool Tray Icons */}
        <div className="w-20 bg-white border-r border-gray-200 flex flex-col justify-start py-4 space-y-4 flex-shrink-0">
          {toolTrays.map((tray) => (
            <ToolTrayIcon
              key={tray.id}
              id={tray.id}
              name={tray.name}
              icon={tray.icon}
              color={tray.color}
              isActive={activeToolTray === tray.id}
              onClick={() => {
                // Toggle behavior: close if already active, open if inactive
                if (activeToolTray === tray.id) {
                  setActiveToolTray(null);
                } else {
                  setActiveToolTray(tray.id);
                }
              }}
            />
          ))}
        </div>

        {/* Middle Panel - Tool Tray Content (only show when active) */}
        {activeToolTray && (
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col transition-all duration-200 flex-shrink-0">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">
                {toolTrays.find(t => t.id === activeToolTray)?.name}
              </h3>
              <button 
                onClick={() => setActiveToolTray(null)}
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                title="Close tool tray"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <ToolTrayRouter activeToolTray={activeToolTray} />
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-2 bg-gray-50 min-h-0" ref={canvasContainerRef}>
          <div className="relative w-full h-full flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="border border-gray-300 shadow-lg rounded-lg max-w-full max-h-full"
            />
          </div>
        </div>
      </div>
      
      {/* Enhanced Publishing Options */}
      <div className="bg-white border-t border-gray-200 px-6 py-6 flex-shrink-0" style={{padding: '24px'}}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-blue-900" style={{fontSize: '16px', fontWeight: '500', color: '#1E293B'}}>
            Publishing Options
          </h3>
          
          <div className="flex items-center space-x-6" style={{gap: '16px'}}>
            {/* Schedule Post Toggle */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700" style={{fontSize: '14px', fontWeight: '400'}}>
                Schedule Post
              </span>
              <button
                onClick={() => togglePublishingOption('schedulePost')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  publishingOptions.schedulePost ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                style={{
                  backgroundColor: publishingOptions.schedulePost ? '#1877F2' : '#D1D5DB',
                  width: '44px',
                  height: '24px',
                  borderRadius: '999px'
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                    publishingOptions.schedulePost ? 'translate-x-6' : 'translate-x-1'
                  }`}
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '50%',
                    transform: publishingOptions.schedulePost ? 'translateX(20px)' : 'translateX(2px)',
                    transition: 'transform 200ms ease-in-out'
                  }}
                />
              </button>
            </div>
            
            {/* Auto-hashtags Toggle */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700" style={{fontSize: '14px', fontWeight: '400'}}>
                Auto-hashtags
              </span>
              <button
                onClick={() => togglePublishingOption('autoHashtags')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  publishingOptions.autoHashtags ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                style={{
                  backgroundColor: publishingOptions.autoHashtags ? '#1877F2' : '#D1D5DB',
                  width: '44px',
                  height: '24px',
                  borderRadius: '999px'
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                    publishingOptions.autoHashtags ? 'translate-x-6' : 'translate-x-1'
                  }`}
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '50%',
                    transform: publishingOptions.autoHashtags ? 'translateX(20px)' : 'translateX(2px)',
                    transition: 'transform 200ms ease-in-out'
                  }}
                />
              </button>
            </div>
            
            {/* Cross-post Toggle */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700" style={{fontSize: '14px', fontWeight: '400'}}>
                Cross-post
              </span>
              <button
                onClick={() => togglePublishingOption('crossPost')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  publishingOptions.crossPost ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                style={{
                  backgroundColor: publishingOptions.crossPost ? '#1877F2' : '#D1D5DB',
                  width: '44px',
                  height: '24px',
                  borderRadius: '999px'
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                    publishingOptions.crossPost ? 'translate-x-6' : 'translate-x-1'
                  }`}
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '50%',
                    transform: publishingOptions.crossPost ? 'translateX(20px)' : 'translateX(2px)',
                    transition: 'transform 200ms ease-in-out'
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { EnhancedCanvasLayout };
export default EnhancedCanvasLayout;