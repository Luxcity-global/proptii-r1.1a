import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Activity,
  Monitor,
  MemoryStick,
  Clock,
  HardDrive,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  objectCount: number;
  timestamp: number;
}

interface PerformanceDashboardProps {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  objectCount?: number;
  className?: string;
  compact?: boolean;
  showHistory?: boolean;
  onSettingsClick?: () => void;
}

interface MetricHistory {
  fps: number[];
  memoryUsage: number[];
  renderTime: number[];
  objectCount: number[];
  timestamps: number[];
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  fps,
  memoryUsage,
  renderTime,
  objectCount = 0,
  className = '',
  compact = false,
  showHistory = false,
  onSettingsClick
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [history, setHistory] = useState<MetricHistory>({
    fps: [],
    memoryUsage: [],
    renderTime: [],
    objectCount: [],
    timestamps: []
  });
  const [maxHistoryLength] = useState(60); // 60 data points (1 minute at 1s intervals)

  // Update history
  useEffect(() => {
    setHistory(prev => {
      const newHistory = {
        fps: [...prev.fps, fps].slice(-maxHistoryLength),
        memoryUsage: [...prev.memoryUsage, memoryUsage].slice(-maxHistoryLength),
        renderTime: [...prev.renderTime, renderTime].slice(-maxHistoryLength),
        objectCount: [...prev.objectCount, objectCount].slice(-maxHistoryLength),
        timestamps: [...prev.timestamps, Date.now()].slice(-maxHistoryLength)
      };
      return newHistory;
    });
  }, [fps, memoryUsage, renderTime, objectCount, maxHistoryLength]);

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }, isInverse = false) => {
    if (isInverse) {
      if (value < thresholds.critical) return 'text-red-600';
      if (value < thresholds.warning) return 'text-yellow-600';
      return 'text-green-600';
    } else {
      if (value > thresholds.critical) return 'text-red-600';
      if (value > thresholds.warning) return 'text-yellow-600';
      return 'text-green-600';
    }
  };

  const getStatusIcon = (value: number, thresholds: { warning: number; critical: number }, isInverse = false) => {
    if (isInverse) {
      if (value < thresholds.critical) return <XCircle className="w-3 h-3 text-red-500" />;
      if (value < thresholds.warning) return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
      return <CheckCircle className="w-3 h-3 text-green-500" />;
    } else {
      if (value > thresholds.critical) return <XCircle className="w-3 h-3 text-red-500" />;
      if (value > thresholds.warning) return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
      return <CheckCircle className="w-3 h-3 text-green-500" />;
    }
  };

  const getTrend = (values: number[]) => {
    if (values.length < 2) return 'stable';
    const recent = values.slice(-5);
    const older = values.slice(-10, -5);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-red-500" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-green-500" />;
      default:
        return <Activity className="w-3 h-3 text-gray-500" />;
    }
  };

  const fpsThresholds = { warning: 30, critical: 15 };
  const memoryThresholds = { warning: 200, critical: 500 };
  const renderThresholds = { warning: 16, critical: 33 };
  const objectThresholds = { warning: 100, critical: 500 };

  const fpsTrend = getTrend(history.fps);
  const memoryTrend = getTrend(history.memoryUsage);
  const renderTrend = getTrend(history.renderTime);
  const objectTrend = getTrend(history.objectCount);

  if (compact && !isExpanded) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsExpanded(true)}
          className="bg-lux-blue-600 hover:bg-lux-blue-700 text-white shadow-lg"
          size="sm"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Performance
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card className="w-80 bg-white/95 backdrop-blur-sm border border-lux-cream-300 shadow-xl">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-lux-blue-600" />
              <h3 className="text-lg font-semibold text-lux-blue-900">Performance</h3>
            </div>
            <div className="flex items-center space-x-2">
              {onSettingsClick && (
                <Button
                  onClick={onSettingsClick}
                  variant="ghost"
                  size="sm"
                  className="p-1"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="ghost"
                size="sm"
                className="p-1"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* FPS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-lux-blue-600" />
                  <span className="text-sm font-medium text-lux-blue-700">FPS</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(fps, fpsThresholds, true)}
                  {getTrendIcon(fpsTrend)}
                </div>
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(fps, fpsThresholds, true)}`}>
                {fps.toFixed(1)}
              </div>
              {showHistory && history.fps.length > 1 && (
                <div className="text-xs text-lux-blue-600">
                  Avg: {(history.fps.reduce((sum, val) => sum + val, 0) / history.fps.length).toFixed(1)}
                </div>
              )}
            </div>

            {/* Memory */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MemoryStick className="w-4 h-4 text-lux-blue-600" />
                  <span className="text-sm font-medium text-lux-blue-700">Memory</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(memoryUsage, memoryThresholds)}
                  {getTrendIcon(memoryTrend)}
                </div>
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(memoryUsage, memoryThresholds)}`}>
                {memoryUsage.toFixed(1)}MB
              </div>
              {showHistory && history.memoryUsage.length > 1 && (
                <div className="text-xs text-lux-blue-600">
                  Peak: {Math.max(...history.memoryUsage).toFixed(1)}MB
                </div>
              )}
            </div>

            {/* Render Time */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-lux-blue-600" />
                  <span className="text-sm font-medium text-lux-blue-700">Render</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(renderTime, renderThresholds)}
                  {getTrendIcon(renderTrend)}
                </div>
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(renderTime, renderThresholds)}`}>
                {renderTime.toFixed(1)}ms
              </div>
              {showHistory && history.renderTime.length > 1 && (
                <div className="text-xs text-lux-blue-600">
                  Avg: {(history.renderTime.reduce((sum, val) => sum + val, 0) / history.renderTime.length).toFixed(1)}ms
                </div>
              )}
            </div>

            {/* Object Count */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-lux-blue-600" />
                  <span className="text-sm font-medium text-lux-blue-700">Objects</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(objectCount, objectThresholds)}
                  {getTrendIcon(objectTrend)}
                </div>
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(objectCount, objectThresholds)}`}>
                {objectCount}
              </div>
              {showHistory && history.objectCount.length > 1 && (
                <div className="text-xs text-lux-blue-600">
                  Max: {Math.max(...history.objectCount)}
                </div>
              )}
            </div>
          </div>

          {/* Status Summary */}
          <div className="mt-4 pt-4 border-t border-lux-cream-300">
            <div className="flex items-center justify-between">
              <span className="text-sm text-lux-blue-700">Overall Status</span>
              <Badge 
                className={
                  fps >= fpsThresholds.warning && 
                  memoryUsage <= memoryThresholds.warning && 
                  renderTime <= renderThresholds.warning && 
                  objectCount <= objectThresholds.warning
                    ? 'bg-green-100 text-green-800'
                    : fps >= fpsThresholds.critical && 
                      memoryUsage <= memoryThresholds.critical && 
                      renderTime <= renderThresholds.critical && 
                      objectCount <= objectThresholds.critical
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }
              >
                {fps >= fpsThresholds.warning && 
                 memoryUsage <= memoryThresholds.warning && 
                 renderTime <= renderThresholds.warning && 
                 objectCount <= objectThresholds.warning
                  ? 'Good'
                  : fps >= fpsThresholds.critical && 
                    memoryUsage <= memoryThresholds.critical && 
                    renderTime <= renderThresholds.critical && 
                    objectCount <= objectThresholds.critical
                  ? 'Warning'
                  : 'Critical'
                }
              </Badge>
            </div>
          </div>

          {/* Recommendations */}
          {(fps < fpsThresholds.warning || 
            memoryUsage > memoryThresholds.warning || 
            renderTime > renderThresholds.warning || 
            objectCount > objectThresholds.warning) && (
            <div className="mt-4 pt-4 border-t border-lux-cream-300">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-lux-blue-900">Recommendations</span>
              </div>
              <div className="space-y-1">
                {fps < fpsThresholds.warning && (
                  <div className="text-xs text-lux-blue-700">• Reduce object count or complexity</div>
                )}
                {memoryUsage > memoryThresholds.warning && (
                  <div className="text-xs text-lux-blue-700">• Implement object pooling or cleanup</div>
                )}
                {renderTime > renderThresholds.warning && (
                  <div className="text-xs text-lux-blue-700">• Optimize canvas operations</div>
                )}
                {objectCount > objectThresholds.warning && (
                  <div className="text-xs text-lux-blue-700">• Consider grouping objects</div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;