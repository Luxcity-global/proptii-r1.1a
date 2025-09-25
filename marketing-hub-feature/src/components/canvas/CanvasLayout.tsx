import React, { useState, useCallback } from 'react';
import { CanvasEnhanced } from './CanvasEnhanced';
import { CanvasControls } from './CanvasControls';
import { Button } from '../ui/button';
import { 
  ArrowLeft, 
  Save, 
  Download, 
  Sparkles,
  ChevronDown,
  ZoomOut,
  ZoomIn
} from 'lucide-react';
import { ToolTrayRouter } from '../tool-trays/ToolTrayRouter';
import { ToolTrayIcon } from '../tool-trays/ToolTrayIcon';
import { useToolTrayStore } from '../../stores/toolTrayStore';
import { useCanvasStoreEnhanced } from '../../stores/canvasStoreEnhanced';
import { PlatformSelector } from '../ui/PlatformSelector';
import { GenerateAIButton } from '../ai/GenerateAIButton';

interface CanvasLayoutProps {
  onCanvasReady?: (canvas: any) => void;
  onCloseCanvas?: () => void;
}

export const CanvasLayout: React.FC<CanvasLayoutProps> = ({ onCanvasReady, onCloseCanvas }) => {
  const { activeTray, setActiveTray } = useToolTrayStore();
  const { loadTemplate } = useCanvasStoreEnhanced();

  // Tool tray configuration matching Figma specifications
  const toolTrays = [
    { id: 'templates', name: 'Templates' },
    { id: 'images', name: 'Images' },
    { id: 'elements', name: 'Elements' },
    { id: 'text', name: 'Text' },
    { id: 'ai-tools', name: 'AI Tools' },
    { id: 'layers', name: 'Layers' },
    { id: 'assets', name: 'Assets' },
  ];

  // Current platform and asset type state
  const [selectedPlatform, setSelectedPlatform] = useState('facebook');
  const [postType, setPostType] = useState({ type: 'Feed Post', dimensions: '1200x630' });
  const [selectedPlatforms, setSelectedPlatforms] = useState(['facebook', 'instagram']);

  const handleTemplateLoad = useCallback(async (templateId: string) => {
    try {
      const success = await loadTemplate(templateId);
      if (success) {
        console.log('Template loaded successfully');
      } else {
        console.error('Failed to load template');
      }
    } catch (error) {
      console.error('Error loading template:', error);
    }
  }, [loadTemplate]);

  const handleToolSelect = (toolId: string) => {
    if (activeTray === toolId) {
      setActiveTray(null); // Close if already active
    } else {
      setActiveTray(toolId);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Section - Fixed Height: 80px */}
      <header className="h-20 bg-white border-b border-gray-200 flex items-center px-6">
        <div className="flex items-center justify-between w-full">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={onCloseCanvas}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Hub</span>
            </button>
          </div>

          {/* Center Section */}
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-semibold text-gray-900">Create Social Media Assets</h1>
            <p className="text-sm text-gray-600">Design compelling visuals for your property marketing</p>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Save</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
            <GenerateAIButton
              platforms={selectedPlatforms}
              onContentGenerated={(content) => {
                console.log('Generated content:', content);
              }}
              onError={(error) => {
                console.error('Generation error:', error);
              }}
              className="flex items-center space-x-2"
              size="sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate with AI</span>
            </GenerateAIButton>
          </div>
        </div>
      </header>

      {/* Platform and Asset Configuration Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Platform Selector */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {['facebook', 'instagram', 'linkedin', 'twitter'].map((platform) => (
                <button
                  key={platform}
                  onClick={() => setSelectedPlatform(platform)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPlatform === platform
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Type and Dimensions */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Type:</span>
              <button className="flex items-center space-x-1 text-sm font-medium text-gray-900 hover:text-gray-700">
                <span>{postType.type}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-900 font-mono">{postType.dimensions}</span>
            </div>
          </div>

          {/* Canvas View Controls */}
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button className="px-3 py-1 text-sm font-medium text-gray-900 hover:text-gray-700">
              Fit
            </button>
            <span className="px-3 py-1 text-sm font-medium text-gray-900">100%</span>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tool Tray Icons (80px width) */}
        <div className="w-20 bg-white border-r border-gray-200 flex flex-col">
          <div className="flex-1 py-4 space-y-4">
            {toolTrays.map((tray) => (
              <ToolTrayIcon
                key={tray.id}
                trayId={tray.id}
                name={tray.name}
                isActive={activeTray === tray.id}
                onClick={() => handleToolSelect(tray.id)}
              />
            ))}
          </div>
        </div>

        {/* Middle Panel - Tool Tray Content (320px when open) */}
        {activeTray && (
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col transition-all duration-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {toolTrays.find(t => t.id === activeTray)?.name}
              </h3>
              <button 
                onClick={() => setActiveTray(null)}
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ToolTrayRouter />
            </div>
          </div>
        )}

        {/* Canvas Area (Flexible width) */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
          {/* Canvas Container with proper scaling */}
          <div className="relative bg-white rounded-lg shadow-lg overflow-hidden" style={{ aspectRatio: '1.91/1' }}>
            <CanvasEnhanced 
              width={1200} 
              height={630}
              onCanvasReady={onCanvasReady}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* Bottom Bar - Publishing Options (60px height) */}
      <div className="h-16 bg-white border-t border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-900">Publishing Options</span>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Schedule Post</span>
            <button className="w-10 h-5 bg-gray-200 rounded-full relative">
              <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Auto-hashtags</span>
            <button className="w-10 h-5 bg-blue-600 rounded-full relative">
              <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
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


export default CanvasLayout;
