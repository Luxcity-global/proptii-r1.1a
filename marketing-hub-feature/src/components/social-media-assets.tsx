import { useState } from "react";
import { CanvasLayout } from "./canvas/CanvasLayout";
import { EnhancedCanvasLayout } from "./canvas/EnhancedCanvasLayout";
import { TestingPage } from '../pages/TestingPage';

export function SocialMediaAssets() {
  const [isCanvasMode, setIsCanvasMode] = useState(false);
  const [showTestingPage, setShowTestingPage] = useState(false);

  const handleCreateNewAsset = () => {
    setIsCanvasMode(true);
  };

  const handleShowTestingPage = () => {
    setShowTestingPage(true);
  };

  const handleBackFromTesting = () => {
    setShowTestingPage(false);
  };


  if (showTestingPage) {
    return <TestingPage onBack={handleBackFromTesting} />;
  }

  if (isCanvasMode) {
    return (
      <div className="h-screen">
        <EnhancedCanvasLayout 
          onCanvasReady={(canvas) => {
            console.log('Canvas ready:', canvas);
          }}
          onCloseCanvas={() => setIsCanvasMode(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lux-cream-200">
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-lux-blue-900">Social Media Assets</h1>
            <p className="text-lux-blue-700 mt-1">Create eye-catching posts, stories, and ads for your properties</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleShowTestingPage}
              className="bg-lux-blue-600 hover:bg-lux-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Testing Suite
            </button>
            <button
              onClick={handleCreateNewAsset}
              className="bg-lux-orange-600 hover:bg-lux-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create New Asset
            </button>
          </div>
        </div>

        {/* Canvas Preview */}
        <div className="bg-white rounded-lg border border-lux-cream-300 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-lux-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-lux-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-lux-blue-900 mb-2">Canvas Editor Coming Soon</h3>
            <p className="text-lux-blue-700 mb-6">
              The advanced canvas editor with Fabric.js integration is being implemented. 
              This will include all 7 tool trays, layer management, and export capabilities.
            </p>
            <button
              onClick={handleCreateNewAsset}
              className="bg-lux-blue-600 hover:bg-lux-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Preview Canvas (Beta)
            </button>
          </div>
        </div>

        {/* Implementation Status */}
        <div className="mt-8 bg-lux-blue-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-lux-blue-900 mb-4">Version 2 Implementation Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-lux-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-lux-blue-600 rounded-full"></div>
                <span className="font-medium text-lux-blue-900">Canvas Foundation</span>
              </div>
              <p className="text-sm text-lux-blue-700">Fabric.js integration with React</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-lux-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-lux-orange-500 rounded-full"></div>
                <span className="font-medium text-lux-blue-900">Tool Trays</span>
              </div>
              <p className="text-sm text-lux-blue-700">7 tool trays in development</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-lux-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-lux-green-500 rounded-full"></div>
                <span className="font-medium text-lux-blue-900">State Management</span>
              </div>
              <p className="text-sm text-lux-blue-700">Zustand store implemented</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-lux-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="font-medium text-lux-blue-900">Export System</span>
              </div>
              <p className="text-sm text-lux-blue-700">Multi-format export planned</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
