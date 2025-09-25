import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  TestTube,
  BarChart3,
  Database,
  Monitor,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { PerformanceTestSuite } from '../components/testing/PerformanceTestSuite';
import { APITestSuite } from '../components/testing/APITestSuite';

interface TestingPageProps {
  onBack?: () => void;
}

export const TestingPage: React.FC<TestingPageProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'performance' | 'api'>('performance');

  const tabs = [
    {
      id: 'performance' as const,
      name: 'Performance Testing',
      description: 'Canvas performance and optimization tests',
      icon: <Monitor className="w-5 h-5" />,
      component: PerformanceTestSuite
    },
    {
      id: 'api' as const,
      name: 'API Testing',
      description: 'Comprehensive API endpoint testing',
      icon: <Database className="w-5 h-5" />,
      component: APITestSuite
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-lux-cream-100">
      {/* Header */}
      <div className="bg-white border-b border-lux-cream-300">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button
                  onClick={onBack}
                  variant="ghost"
                  size="sm"
                  className="text-lux-blue-600 hover:text-lux-blue-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-lux-blue-100 rounded-lg">
                  <TestTube className="w-6 h-6 text-lux-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-lux-blue-900">Testing Suite</h1>
                  <p className="text-lux-blue-700">Comprehensive testing for canvas performance and API functionality</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="text-lux-blue-600 hover:text-lux-blue-800"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-lux-cream-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-3 px-6 py-4 border-b-2 transition-colors duration-200
                  ${activeTab === tab.id
                    ? 'border-lux-blue-600 text-lux-blue-600 bg-lux-blue-50'
                    : 'border-transparent text-lux-blue-700 hover:text-lux-blue-600 hover:border-lux-blue-300'
                  }
                `}
              >
                {tab.icon}
                <div className="text-left">
                  <div className="font-medium">{tab.name}</div>
                  <div className="text-sm opacity-75">{tab.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Tab Overview */}
          <Card className="p-6 bg-gradient-to-r from-lux-blue-50 to-lux-cream-50 border-lux-blue-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                {tabs.find(tab => tab.id === activeTab)?.icon}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-lux-blue-900">
                  {tabs.find(tab => tab.id === activeTab)?.name}
                </h2>
                <p className="text-lux-blue-700">
                  {tabs.find(tab => tab.id === activeTab)?.description}
                </p>
              </div>
            </div>
          </Card>

          {/* Active Component */}
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-lux-cream-300 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-lux-blue-600">
            <div className="flex items-center space-x-4">
              <span>Testing Suite v1.0</span>
              <span>•</span>
              <span>Canvas Performance & API Testing</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Last Updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestingPage;

