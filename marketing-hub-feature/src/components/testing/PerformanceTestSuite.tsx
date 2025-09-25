import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { 
  Activity,
  Clock,
  MemoryStick,
  HardDrive,
  Cpu,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Square,
  RotateCcw,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Monitor
} from 'lucide-react';
import { useCanvasStoreEnhanced } from '../../stores/canvasStoreEnhanced';
import { usePerformanceMonitor } from '../../utils/performance';

interface PerformanceTest {
  id: string;
  name: string;
  description: string;
  category: 'canvas' | 'memory' | 'network' | 'rendering';
  duration: number; // seconds
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: {
    score: number;
    metrics: Record<string, number>;
    recommendations?: string[];
  };
}

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  canvasObjects: number;
  networkLatency: number;
  cpuUsage: number;
  errorCount: number;
}

export const PerformanceTestSuite: React.FC = () => {
  const [tests, setTests] = useState<PerformanceTest[]>([
    {
      id: 'canvas-load-test',
      name: 'Canvas Load Test',
      description: 'Test canvas initialization and basic object rendering performance',
      category: 'canvas',
      duration: 30,
      status: 'pending'
    },
    {
      id: 'memory-stress-test',
      name: 'Memory Stress Test',
      description: 'Test memory usage with large numbers of objects and assets',
      category: 'memory',
      duration: 60,
      status: 'pending'
    },
    {
      id: 'rendering-performance-test',
      name: 'Rendering Performance Test',
      description: 'Test canvas rendering performance with complex scenes',
      category: 'rendering',
      duration: 45,
      status: 'pending'
    },
    {
      id: 'network-load-test',
      name: 'Network Load Test',
      description: 'Test asset loading and network performance',
      category: 'network',
      duration: 30,
      status: 'pending'
    },
    {
      id: 'large-asset-test',
      name: 'Large Asset Test',
      description: 'Test performance with high-resolution images and complex assets',
      category: 'memory',
      duration: 40,
      status: 'pending'
    },
    {
      id: 'interaction-response-test',
      name: 'Interaction Response Test',
      description: 'Test responsiveness of user interactions and tool changes',
      category: 'canvas',
      duration: 25,
      status: 'pending'
    }
  ]);

  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    canvasObjects: 0,
    networkLatency: 0,
    cpuUsage: 0,
    errorCount: 0
  });
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isRunning, setIsRunning] = useState(false);

  const { 
    objects, 
    addRectangle, 
    addCircle, 
    addText, 
    addImageFromUrl, 
    clearCanvas,
    canvas 
  } = useCanvasStoreEnhanced();

  const performanceMonitor = usePerformanceMonitor(canvas);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update metrics periodically
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setMetrics(prev => ({
          ...prev,
          fps: performanceMonitor.fps,
          memoryUsage: performanceMonitor.memoryUsage,
          renderTime: performanceMonitor.renderTime,
          canvasObjects: objects.length,
          networkLatency: Math.random() * 100, // Mock network latency
          cpuUsage: Math.random() * 100, // Mock CPU usage
          errorCount: 0 // Would track actual errors
        }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, performanceMonitor, objects.length]);

  const runTest = async (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    setCurrentTest(testId);
    setIsRunning(true);

    // Update test status
    setTests(prev => prev.map(t => 
      t.id === testId ? { ...t, status: 'running' } : t
    ));

    try {
      let result: any = {};

      switch (testId) {
        case 'canvas-load-test':
          result = await runCanvasLoadTest();
          break;
        case 'memory-stress-test':
          result = await runMemoryStressTest();
          break;
        case 'rendering-performance-test':
          result = await runRenderingPerformanceTest();
          break;
        case 'network-load-test':
          result = await runNetworkLoadTest();
          break;
        case 'large-asset-test':
          result = await runLargeAssetTest();
          break;
        case 'interaction-response-test':
          result = await runInteractionResponseTest();
          break;
        default:
          throw new Error(`Unknown test: ${testId}`);
      }

      // Update test with results
      setTests(prev => prev.map(t => 
        t.id === testId ? { 
          ...t, 
          status: 'completed',
          results: result
        } : t
      ));

      setTestResults(prev => ({
        ...prev,
        [testId]: result
      }));

    } catch (error) {
      console.error(`Test ${testId} failed:`, error);
      setTests(prev => prev.map(t => 
        t.id === testId ? { ...t, status: 'failed' } : t
      ));
    } finally {
      setCurrentTest(null);
      setIsRunning(false);
    }
  };

  const runCanvasLoadTest = async () => {
    const startTime = performance.now();
    const initialObjects = objects.length;

    // Add various objects to test canvas performance
    for (let i = 0; i < 50; i++) {
      if (i % 4 === 0) {
        await addRectangle({
          left: Math.random() * 800,
          top: Math.random() * 600,
          width: 50 + Math.random() * 100,
          height: 50 + Math.random() * 100,
          fill: `hsl(${Math.random() * 360}, 70%, 50%)`
        });
      } else if (i % 4 === 1) {
        await addCircle({
          left: Math.random() * 800,
          top: Math.random() * 600,
          radius: 25 + Math.random() * 50,
          fill: `hsl(${Math.random() * 360}, 70%, 50%)`
        });
      } else if (i % 4 === 2) {
        await addText(`Text ${i}`, {
          left: Math.random() * 800,
          top: Math.random() * 600,
          fontSize: 16 + Math.random() * 24,
          fill: `hsl(${Math.random() * 360}, 70%, 30%)`
        });
      }
      
      // Small delay to simulate real usage
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const endTime = performance.now();
    const loadTime = endTime - startTime;
    const finalObjects = objects.length;
    const objectsAdded = finalObjects - initialObjects;

    return {
      score: Math.max(0, 100 - (loadTime / 100)),
      metrics: {
        loadTime,
        objectsAdded,
        objectsPerSecond: objectsAdded / (loadTime / 1000),
        finalFps: performanceMonitor.fps,
        memoryUsage: performanceMonitor.memoryUsage
      },
      recommendations: loadTime > 5000 ? [
        'Canvas loading is slow. Consider optimizing object creation.',
        'Reduce initial object count or implement lazy loading.'
      ] : []
    };
  };

  const runMemoryStressTest = async () => {
    const startMemory = performanceMonitor.memoryUsage;
    const initialObjects = objects.length;

    // Create a large number of objects to stress test memory
    for (let i = 0; i < 200; i++) {
      await addRectangle({
        left: Math.random() * 1200,
        top: Math.random() * 800,
        width: 20 + Math.random() * 80,
        height: 20 + Math.random() * 80,
        fill: `hsl(${Math.random() * 360}, 70%, 50%)`,
        stroke: '#333',
        strokeWidth: 2
      });

      if (i % 20 === 0) {
        // Check memory every 20 objects
        const currentMemory = performanceMonitor.memoryUsage;
        if (currentMemory > 500) { // 500MB threshold
          break;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 5));
    }

    const endMemory = performanceMonitor.memoryUsage;
    const finalObjects = objects.length;
    const objectsAdded = finalObjects - initialObjects;
    const memoryIncrease = endMemory - startMemory;

    return {
      score: Math.max(0, 100 - (memoryIncrease / 10)),
      metrics: {
        memoryIncrease,
        objectsAdded,
        memoryPerObject: memoryIncrease / objectsAdded,
        finalMemory: endMemory,
        peakMemory: endMemory
      },
      recommendations: memoryIncrease > 100 ? [
        'High memory usage detected. Consider implementing object pooling.',
        'Review memory leaks in object creation and disposal.'
      ] : []
    };
  };

  const runRenderingPerformanceTest = async () => {
    const startTime = performance.now();
    
    // Create a complex scene with overlapping objects
    for (let i = 0; i < 100; i++) {
      const size = 30 + Math.random() * 70;
      await addRectangle({
        left: Math.random() * 1000,
        top: Math.random() * 700,
        width: size,
        height: size,
        fill: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.7)`,
        stroke: '#333',
        strokeWidth: 1,
        angle: Math.random() * 360
      });

      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // Test rendering performance by triggering multiple renders
    const renderStartTime = performance.now();
    if (canvas) {
      for (let i = 0; i < 10; i++) {
        canvas.renderAll();
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    const renderEndTime = performance.now();

    const totalTime = performance.now() - startTime;
    const renderTime = renderEndTime - renderStartTime;
    const avgRenderTime = renderTime / 10;

    return {
      score: Math.max(0, 100 - (avgRenderTime / 10)),
      metrics: {
        totalTime,
        renderTime,
        avgRenderTime,
        objectsCreated: 100,
        finalFps: performanceMonitor.fps
      },
      recommendations: avgRenderTime > 50 ? [
        'Rendering performance is below optimal. Consider reducing object complexity.',
        'Implement viewport culling for off-screen objects.'
      ] : []
    };
  };

  const runNetworkLoadTest = async () => {
    const startTime = performance.now();
    const testImages = [
      'https://via.placeholder.com/300x200/ff6b6b/ffffff?text=Test+Image+1',
      'https://via.placeholder.com/400x300/4ecdc4/ffffff?text=Test+Image+2',
      'https://via.placeholder.com/500x400/45b7d1/ffffff?text=Test+Image+3',
      'https://via.placeholder.com/600x400/f093fb/ffffff?text=Test+Image+4',
      'https://via.placeholder.com/350x250/ffea00/000000?text=Test+Image+5'
    ];

    let loadedImages = 0;
    let totalLoadTime = 0;

    for (const imageUrl of testImages) {
      const imageStartTime = performance.now();
      try {
        await addImageFromUrl(imageUrl, {
          left: Math.random() * 800,
          top: Math.random() * 600,
          scaleX: 0.3,
          scaleY: 0.3
        });
        const imageEndTime = performance.now();
        totalLoadTime += imageEndTime - imageStartTime;
        loadedImages++;
      } catch (error) {
        console.error('Failed to load image:', error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgImageLoadTime = totalLoadTime / loadedImages;

    return {
      score: Math.max(0, 100 - (avgImageLoadTime / 100)),
      metrics: {
        totalTime,
        totalLoadTime,
        avgImageLoadTime,
        imagesLoaded: loadedImages,
        imagesFailed: testImages.length - loadedImages,
        loadSuccessRate: (loadedImages / testImages.length) * 100
      },
      recommendations: avgImageLoadTime > 1000 ? [
        'Image loading is slow. Consider implementing image optimization.',
        'Use WebP format and implement progressive loading.'
      ] : []
    };
  };

  const runLargeAssetTest = async () => {
    const startTime = performance.now();
    const startMemory = performanceMonitor.memoryUsage;

    // Load high-resolution images
    const largeImages = [
      'https://via.placeholder.com/1920x1080/ff6b6b/ffffff?text=Large+Image+1',
      'https://via.placeholder.com/2048x1536/4ecdc4/ffffff?text=Large+Image+2',
      'https://via.placeholder.com/2560x1440/45b7d1/ffffff?text=Large+Image+3'
    ];

    let loadedImages = 0;
    for (const imageUrl of largeImages) {
      try {
        await addImageFromUrl(imageUrl, {
          left: Math.random() * 600,
          top: Math.random() * 400,
          scaleX: 0.2,
          scaleY: 0.2
        });
        loadedImages++;
      } catch (error) {
        console.error('Failed to load large image:', error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const endTime = performance.now();
    const endMemory = performanceMonitor.memoryUsage;
    const loadTime = endTime - startTime;
    const memoryIncrease = endMemory - startMemory;

    return {
      score: Math.max(0, 100 - (memoryIncrease / 50)),
      metrics: {
        loadTime,
        memoryIncrease,
        imagesLoaded: loadedImages,
        memoryPerImage: memoryIncrease / loadedImages,
        finalFps: performanceMonitor.fps
      },
      recommendations: memoryIncrease > 200 ? [
        'Large assets are consuming too much memory. Implement image compression.',
        'Consider lazy loading and memory management for large images.'
      ] : []
    };
  };

  const runInteractionResponseTest = async () => {
    const startTime = performance.now();
    
    // Test various interactions
    const interactions = [
      () => addRectangle({ left: 100, top: 100, width: 50, height: 50 }),
      () => addCircle({ left: 200, top: 100, radius: 25 }),
      () => addText('Test', { left: 300, top: 100, fontSize: 20 }),
      () => canvas?.selectAll(),
      () => canvas?.discardActiveObject(),
      () => canvas?.renderAll()
    ];

    let totalInteractionTime = 0;
    for (const interaction of interactions) {
      const interactionStart = performance.now();
      await interaction();
      const interactionEnd = performance.now();
      totalInteractionTime += interactionEnd - interactionStart;
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgInteractionTime = totalInteractionTime / interactions.length;

    return {
      score: Math.max(0, 100 - (avgInteractionTime / 10)),
      metrics: {
        totalTime,
        totalInteractionTime,
        avgInteractionTime,
        interactionsTested: interactions.length,
        finalFps: performanceMonitor.fps
      },
      recommendations: avgInteractionTime > 100 ? [
        'Interaction response is slow. Optimize canvas operations.',
        'Consider debouncing rapid interactions.'
      ] : []
    };
  };

  const runAllTests = async () => {
    for (const test of tests) {
      if (test.status === 'pending') {
        await runTest(test.id);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Pause between tests
      }
    }
  };

  const resetTests = () => {
    setTests(prev => prev.map(test => ({
      ...test,
      status: 'pending',
      results: undefined
    })));
    setTestResults({});
    clearCanvas();
  };

  const getStatusIcon = (status: PerformanceTest['status']) => {
    switch (status) {
      case 'running':
        return <Activity className="w-4 h-4 animate-pulse text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: PerformanceTest['status']) => {
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryIcon = (category: PerformanceTest['category']) => {
    switch (category) {
      case 'canvas':
        return <Monitor className="w-4 h-4" />;
      case 'memory':
        return <MemoryStick className="w-4 h-4" />;
      case 'network':
        return <Wifi className="w-4 h-4" />;
      case 'rendering':
        return <Cpu className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-lux-blue-900">Performance Test Suite</h2>
          <p className="text-lux-blue-700">Comprehensive testing for canvas performance and optimization</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-lux-blue-600 hover:bg-lux-blue-700 text-white"
          >
            {isRunning ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-pulse" />
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
            onClick={resetTests}
            disabled={isRunning}
            variant="outline"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Live Metrics */}
      <Card className="p-4">
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className="w-5 h-5 text-lux-blue-600" />
          <h3 className="text-lg font-semibold text-lux-blue-900">Live Performance Metrics</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Monitor className="w-4 h-4 mr-2 text-lux-blue-600" />
              <span className="text-sm text-lux-blue-700">FPS</span>
            </div>
            <div className={`text-2xl font-bold ${performanceMonitor.fps >= 30 ? 'text-green-600' : 'text-red-600'}`}>
              {performanceMonitor.fps.toFixed(1)}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <MemoryStick className="w-4 h-4 mr-2 text-lux-blue-600" />
              <span className="text-sm text-lux-blue-700">Memory</span>
            </div>
            <div className={`text-2xl font-bold ${performanceMonitor.memoryUsage < 200 ? 'text-green-600' : 'text-red-600'}`}>
              {performanceMonitor.memoryUsage.toFixed(1)}MB
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-4 h-4 mr-2 text-lux-blue-600" />
              <span className="text-sm text-lux-blue-700">Render Time</span>
            </div>
            <div className={`text-2xl font-bold ${performanceMonitor.renderTime < 16 ? 'text-green-600' : 'text-red-600'}`}>
              {performanceMonitor.renderTime.toFixed(1)}ms
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <HardDrive className="w-4 h-4 mr-2 text-lux-blue-600" />
              <span className="text-sm text-lux-blue-700">Objects</span>
            </div>
            <div className="text-2xl font-bold text-lux-blue-600">
              {objects.length}
            </div>
          </div>
        </div>
      </Card>

      {/* Test List */}
      <div className="space-y-4">
        {tests.map(test => (
          <Card key={test.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  {getCategoryIcon(test.category)}
                  <h3 className="text-lg font-semibold text-lux-blue-900">{test.name}</h3>
                  <Badge className={getStatusColor(test.status)}>
                    {getStatusIcon(test.status)}
                    <span className="ml-1 capitalize">{test.status}</span>
                  </Badge>
                  {test.results && (
                    <Badge className={`${getScoreColor(test.results.score)} bg-opacity-20`}>
                      Score: {test.results.score.toFixed(0)}
                    </Badge>
                  )}
                </div>
                
                <p className="text-lux-blue-700 mb-3">{test.description}</p>
                
                {test.results && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-lux-blue-600">Duration: {test.duration}s</span>
                      {Object.entries(test.results.metrics).map(([key, value]) => (
                        <span key={key} className="text-lux-blue-600">
                          {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                        </span>
                      ))}
                    </div>
                    
                    {test.results.recommendations && test.results.recommendations.length > 0 && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                          <span className="text-sm font-medium text-yellow-800">Recommendations</span>
                        </div>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {test.results.recommendations.map((rec, index) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="ml-4">
                <Button
                  onClick={() => runTest(test.id)}
                  disabled={isRunning || test.status === 'running'}
                  size="sm"
                  variant="outline"
                >
                  {test.status === 'running' ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-pulse" />
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
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PerformanceTestSuite;

