import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { 
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  Square,
  RotateCcw,
  Copy,
  Download,
  Upload,
  Database,
  Globe,
  Zap,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import apiService from '../../services/api';
import { TemplateService } from '../../services/templateService';

interface APITest {
  id: string;
  name: string;
  description: string;
  category: 'assets' | 'templates' | 'canvas' | 'authentication';
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  response?: any;
  error?: string;
  expectedStatus?: number;
  testFunction: () => Promise<any>;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: APITest[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
}

export const APITestSuite: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // Initialize test suites
  useEffect(() => {
    initializeTestSuites();
  }, []);

  const initializeTestSuites = () => {
    const suites: TestSuite[] = [
      {
        id: 'assets-api',
        name: 'Assets API',
        description: 'Test asset upload, retrieval, and management endpoints',
        status: 'pending',
        tests: [
          {
            id: 'get-assets',
            name: 'Get Assets',
            description: 'Test retrieving list of assets',
            category: 'assets',
            method: 'GET',
            endpoint: '/api/assets',
            status: 'pending',
            expectedStatus: 200,
            testFunction: async () => {
              const response = await apiService.getAssets({
                page: 1,
                limit: 10
              });
              return response;
            }
          },
          {
            id: 'upload-asset',
            name: 'Upload Asset',
            description: 'Test asset upload functionality',
            category: 'assets',
            method: 'POST',
            endpoint: '/api/assets/upload',
            status: 'pending',
            expectedStatus: 201,
            testFunction: async () => {
              // Create a test file
              const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
              const formData = new FormData();
              formData.append('asset', testFile);
              
              const response = await apiService.uploadAsset(formData);
              return response;
            }
          },
          {
            id: 'get-asset-by-id',
            name: 'Get Asset by ID',
            description: 'Test retrieving specific asset by ID',
            category: 'assets',
            method: 'GET',
            endpoint: '/api/assets/:id',
            status: 'pending',
            expectedStatus: 200,
            testFunction: async () => {
              // First get a list of assets to get an ID
              const assetsResponse = await apiService.getAssets({ page: 1, limit: 1 });
              if (assetsResponse.success && assetsResponse.data && assetsResponse.data.length > 0) {
                const assetId = assetsResponse.data[0].id;
                const response = await apiService.get(`/assets/${assetId}`);
                return response;
              }
              throw new Error('No assets available to test');
            }
          },
          {
            id: 'update-asset',
            name: 'Update Asset',
            description: 'Test updating asset metadata',
            category: 'assets',
            method: 'PUT',
            endpoint: '/api/assets/:id',
            status: 'pending',
            expectedStatus: 200,
            testFunction: async () => {
              const assetsResponse = await apiService.getAssets({ page: 1, limit: 1 });
              if (assetsResponse.success && assetsResponse.data && assetsResponse.data.length > 0) {
                const assetId = assetsResponse.data[0].id;
                const response = await apiService.put(`/assets/${assetId}`, {
                  name: 'Updated Test Asset',
                  description: 'Updated description'
                });
                return response;
              }
              throw new Error('No assets available to test');
            }
          },
          {
            id: 'delete-asset',
            name: 'Delete Asset',
            description: 'Test asset deletion',
            category: 'assets',
            method: 'DELETE',
            endpoint: '/api/assets/:id',
            status: 'pending',
            expectedStatus: 200,
            testFunction: async () => {
              // Upload a test asset first
              const testFile = new File(['delete test'], 'delete-test.txt', { type: 'text/plain' });
              const formData = new FormData();
              formData.append('asset', testFile);
              
              const uploadResponse = await apiService.uploadAsset(formData);
              if (uploadResponse.success && uploadResponse.data) {
                const response = await apiService.delete(`/assets/${uploadResponse.data.id}`);
                return response;
              }
              throw new Error('Failed to upload test asset for deletion');
            }
          }
        ]
      },
      {
        id: 'templates-api',
        name: 'Templates API',
        description: 'Test template management endpoints',
        status: 'pending',
        tests: [
          {
            id: 'get-templates',
            name: 'Get Templates',
            description: 'Test retrieving list of templates',
            category: 'templates',
            method: 'GET',
            endpoint: '/api/templates',
            status: 'pending',
            expectedStatus: 200,
            testFunction: async () => {
              const response = await TemplateService.getTemplates({
                page: 1,
                limit: 10
              });
              return response;
            }
          },
          {
            id: 'get-featured-templates',
            name: 'Get Featured Templates',
            description: 'Test retrieving featured templates',
            category: 'templates',
            method: 'GET',
            endpoint: '/api/templates/featured',
            status: 'pending',
            expectedStatus: 200,
            testFunction: async () => {
              const response = await TemplateService.getFeaturedTemplates(5);
              return response;
            }
          },
          {
            id: 'get-template-by-id',
            name: 'Get Template by ID',
            description: 'Test retrieving specific template by ID',
            category: 'templates',
            method: 'GET',
            endpoint: '/api/templates/:id',
            status: 'pending',
            expectedStatus: 200,
            testFunction: async () => {
              const templatesResponse = await TemplateService.getTemplates({ page: 1, limit: 1 });
              if (templatesResponse.success && templatesResponse.data && templatesResponse.data.length > 0) {
                const templateId = templatesResponse.data[0].id;
                const response = await TemplateService.getTemplateById(templateId);
                return response;
              }
              throw new Error('No templates available to test');
            }
          },
          {
            id: 'record-template-usage',
            name: 'Record Template Usage',
            description: 'Test recording template usage',
            category: 'templates',
            method: 'POST',
            endpoint: '/api/templates/:id/use',
            status: 'pending',
            expectedStatus: 200,
            testFunction: async () => {
              const templatesResponse = await TemplateService.getTemplates({ page: 1, limit: 1 });
              if (templatesResponse.success && templatesResponse.data && templatesResponse.data.length > 0) {
                const templateId = templatesResponse.data[0].id;
                const response = await TemplateService.recordTemplateUsage(templateId);
                return response;
              }
              throw new Error('No templates available to test');
            }
          }
        ]
      },
      {
        id: 'canvas-api',
        name: 'Canvas API',
        description: 'Test canvas project management endpoints',
        status: 'pending',
        tests: [
          {
            id: 'create-canvas-project',
            name: 'Create Canvas Project',
            description: 'Test creating a new canvas project',
            category: 'canvas',
            method: 'POST',
            endpoint: '/api/canvas/projects',
            status: 'pending',
            expectedStatus: 201,
            testFunction: async () => {
              const response = await apiService.post('/canvas/projects', {
                name: 'Test Canvas Project',
                description: 'Test project for API testing',
                width: 800,
                height: 600
              });
              return response;
            }
          },
          {
            id: 'get-canvas-projects',
            name: 'Get Canvas Projects',
            description: 'Test retrieving canvas projects',
            category: 'canvas',
            method: 'GET',
            endpoint: '/api/canvas/projects',
            status: 'pending',
            expectedStatus: 200,
            testFunction: async () => {
              const response = await apiService.get('/canvas/projects');
              return response;
            }
          },
          {
            id: 'save-canvas-state',
            name: 'Save Canvas State',
            description: 'Test saving canvas state',
            category: 'canvas',
            method: 'POST',
            endpoint: '/api/canvas/:id/save',
            status: 'pending',
            expectedStatus: 200,
            testFunction: async () => {
              // First create a project
              const createResponse = await apiService.post('/canvas/projects', {
                name: 'Test Save Project',
                description: 'Test project for save testing'
              });
              
              if (createResponse.success && createResponse.data) {
                const projectId = createResponse.data.id;
                const response = await apiService.post(`/canvas/${projectId}/save`, {
                  state: {
                    objects: [
                      {
                        type: 'rect',
                        left: 100,
                        top: 100,
                        width: 100,
                        height: 100,
                        fill: '#ff6b6b'
                      }
                    ]
                  }
                });
                return response;
              }
              throw new Error('Failed to create test project');
            }
          },
          {
            id: 'load-canvas-state',
            name: 'Load Canvas State',
            description: 'Test loading canvas state',
            category: 'canvas',
            method: 'GET',
            endpoint: '/api/canvas/:id/load',
            status: 'pending',
            expectedStatus: 200,
            testFunction: async () => {
              const projectsResponse = await apiService.get('/canvas/projects');
              if (projectsResponse.success && projectsResponse.data && projectsResponse.data.length > 0) {
                const projectId = projectsResponse.data[0].id;
                const response = await apiService.get(`/canvas/${projectId}/load`);
                return response;
              }
              throw new Error('No canvas projects available to test');
            }
          }
        ]
      },
      {
        id: 'health-check',
        name: 'Health Check',
        description: 'Test basic API health and connectivity',
        status: 'pending',
        tests: [
          {
            id: 'health-endpoint',
            name: 'Health Endpoint',
            description: 'Test API health endpoint',
            category: 'authentication',
            method: 'GET',
            endpoint: '/api/health',
            status: 'pending',
            expectedStatus: 200,
            testFunction: async () => {
              const response = await apiService.get('/health');
              return response;
            }
          },
          {
            id: 'cors-check',
            name: 'CORS Check',
            description: 'Test CORS configuration',
            category: 'authentication',
            method: 'OPTIONS',
            endpoint: '/api/assets',
            status: 'pending',
            expectedStatus: 200,
            testFunction: async () => {
              const response = await fetch('/api/assets', {
                method: 'OPTIONS',
                headers: {
                  'Origin': window.location.origin,
                  'Access-Control-Request-Method': 'GET',
                  'Access-Control-Request-Headers': 'Content-Type'
                }
              });
              return { success: response.ok, status: response.status };
            }
          }
        ]
      }
    ];

    setTestSuites(suites);
  };

  const runTest = async (suiteId: string, testId: string) => {
    const suite = testSuites.find(s => s.id === suiteId);
    const test = suite?.tests.find(t => t.id === testId);
    
    if (!test) return;

    setCurrentTest(testId);
    setIsRunning(true);

    // Update test status
    setTestSuites(prev => prev.map(s => 
      s.id === suiteId ? {
        ...s,
        tests: s.tests.map(t => 
          t.id === testId ? { ...t, status: 'running' } : t
        )
      } : s
    ));

    try {
      const startTime = performance.now();
      const result = await test.testFunction();
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Update test with results
      setTestSuites(prev => prev.map(s => 
        s.id === suiteId ? {
          ...s,
          tests: s.tests.map(t => 
            t.id === testId ? { 
              ...t, 
              status: 'completed',
              duration,
              response: result
            } : t
          )
        } : s
      ));

      setTestResults(prev => ({
        ...prev,
        [testId]: { result, duration }
      }));

    } catch (error: any) {
      const endTime = performance.now();
      const duration = endTime - performance.now();

      console.error(`Test ${testId} failed:`, error);
      setTestSuites(prev => prev.map(s => 
        s.id === suiteId ? {
          ...s,
          tests: s.tests.map(t => 
            t.id === testId ? { 
              ...t, 
              status: 'failed',
              duration,
              error: error.message 
            } : t
          )
        } : s
      ));
    } finally {
      setCurrentTest(null);
      setIsRunning(false);
    }
  };

  const runSuite = async (suiteId: string) => {
    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite) return;

    setTestSuites(prev => prev.map(s => 
      s.id === suiteId ? { ...s, status: 'running' } : s
    ));

    const startTime = performance.now();
    let passed = 0;
    let failed = 0;

    for (const test of suite.tests) {
      await runTest(suiteId, test.id);
      
      const updatedSuite = testSuites.find(s => s.id === suiteId);
      const updatedTest = updatedSuite?.tests.find(t => t.id === test.id);
      
      if (updatedTest?.status === 'completed') {
        passed++;
      } else if (updatedTest?.status === 'failed') {
        failed++;
      }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    setTestSuites(prev => prev.map(s => 
      s.id === suiteId ? { 
        ...s, 
        status: 'completed',
        results: {
          total: suite.tests.length,
          passed,
          failed,
          duration
        }
      } : s
    ));
  };

  const runAllTests = async () => {
    for (const suite of testSuites) {
      await runSuite(suite.id);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Pause between suites
    }
  };

  const resetTests = () => {
    setTestSuites(prev => prev.map(suite => ({
      ...suite,
      status: 'pending',
      results: undefined,
      tests: suite.tests.map(test => ({
        ...test,
        status: 'pending',
        duration: undefined,
        response: undefined,
        error: undefined
      }))
    })));
    setTestResults({});
  };

  const exportResults = () => {
    const results = {
      timestamp: new Date().toISOString(),
      suites: testSuites.map(suite => ({
        id: suite.id,
        name: suite.name,
        status: suite.status,
        results: suite.results,
        tests: suite.tests.map(test => ({
          id: test.id,
          name: test.name,
          status: test.status,
          duration: test.duration,
          error: test.error
        }))
      }))
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-test-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-800';
      case 'POST':
        return 'bg-blue-100 text-blue-800';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-lux-blue-900">API Test Suite</h2>
          <p className="text-lux-blue-700">Comprehensive testing for all canvas and asset APIs</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-lux-blue-600 hover:bg-lux-blue-700 text-white"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run All Tests
              </>
            )}
          </Button>
          <Button
            onClick={exportResults}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Results
          </Button>
          <Button
            onClick={resetTests}
            disabled={isRunning}
            variant="outline"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Test Suites */}
      <div className="space-y-4">
        {testSuites.map(suite => (
          <Card key={suite.id} className="p-6">
            <div className="space-y-4">
              {/* Suite Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TestTube className="w-6 h-6 text-lux-blue-600" />
                  <div>
                    <h3 className="text-xl font-semibold text-lux-blue-900">{suite.name}</h3>
                    <p className="text-lux-blue-700">{suite.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(suite.status)}>
                    {getStatusIcon(suite.status)}
                    <span className="ml-1 capitalize">{suite.status}</span>
                  </Badge>
                  {suite.results && (
                    <Badge variant="outline">
                      {suite.results.passed}/{suite.results.total} passed
                    </Badge>
                  )}
                  <Button
                    onClick={() => runSuite(suite.id)}
                    disabled={isRunning}
                    size="sm"
                    variant="outline"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Run Suite
                  </Button>
                </div>
              </div>

              {/* Suite Results */}
              {suite.results && (
                <div className="grid grid-cols-4 gap-4 p-4 bg-lux-cream-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-lux-blue-900">{suite.results.total}</div>
                    <div className="text-sm text-lux-blue-700">Total Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{suite.results.passed}</div>
                    <div className="text-sm text-lux-blue-700">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{suite.results.failed}</div>
                    <div className="text-sm text-lux-blue-700">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-lux-blue-600">{(suite.results.duration / 1000).toFixed(1)}s</div>
                    <div className="text-sm text-lux-blue-700">Duration</div>
                  </div>
                </div>
              )}

              {/* Tests */}
              <div className="space-y-2">
                {suite.tests.map(test => (
                  <div key={test.id} className="border border-lux-cream-300 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge className={getMethodColor(test.method)}>
                            {test.method}
                          </Badge>
                          <h4 className="text-lg font-medium text-lux-blue-900">{test.name}</h4>
                          <Badge className={getStatusColor(test.status)}>
                            {getStatusIcon(test.status)}
                            <span className="ml-1 capitalize">{test.status}</span>
                          </Badge>
                          {test.duration && (
                            <Badge variant="outline">
                              {(test.duration).toFixed(0)}ms
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-lux-blue-700 mb-2">{test.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-lux-blue-600">
                          <span>Endpoint: <code className="bg-lux-cream-200 px-2 py-1 rounded">{test.endpoint}</code></span>
                          {test.expectedStatus && (
                            <span>Expected: {test.expectedStatus}</span>
                          )}
                        </div>

                        {/* Test Results */}
                        {test.response && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-green-800">Response</span>
                              <Button
                                onClick={() => setShowDetails(prev => ({ ...prev, [test.id]: !prev[test.id] }))}
                                variant="ghost"
                                size="sm"
                                className="p-1"
                              >
                                {showDetails[test.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                            {showDetails[test.id] && (
                              <pre className="text-xs text-green-700 bg-green-100 p-2 rounded overflow-auto max-h-40">
                                {JSON.stringify(test.response, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}

                        {test.error && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                              <span className="text-sm font-medium text-red-800">Error</span>
                            </div>
                            <p className="text-sm text-red-700">{test.error}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        <Button
                          onClick={() => runTest(suite.id, test.id)}
                          disabled={isRunning || test.status === 'running'}
                          size="sm"
                          variant="outline"
                        >
                          {test.status === 'running' ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Running
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Run
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default APITestSuite;

