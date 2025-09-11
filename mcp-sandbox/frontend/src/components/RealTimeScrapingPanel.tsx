import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Database, 
  Activity, 
  Settings, 
  Play, 
 
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react';
import { 
  triggerScraping, 
  getScrapingStatus, 
  getCacheInfo, 
  clearCache, 
  getHealthStatus,
  getDataSources 
} from '../services/api';

interface ScrapingStatus {
  isRunning: boolean;
  progress: number;
  currentPage: number;
  totalPages: number;
  propertiesFound: number;
  errors: string[];
  startTime: string;
  estimatedCompletion: string;
}

interface CacheInfo {
  totalEntries: number;
  sources: {
    [key: string]: {
      entries: number;
      lastUpdated: string;
      expiry: string;
    };
  };
  memoryUsage: string;
  hitRate: number;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    [key: string]: {
      status: 'up' | 'down';
      responseTime: number;
      lastCheck: string;
    };
  };
  scraping: {
    enabled: boolean;
    rateLimit: number;
    lastScrape: string;
  };
}

interface DataSource {
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastUpdate: string;
  propertiesCount: number;
  errorRate: number;
}

const RealTimeScrapingPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrapingStatus, setScrapingStatus] = useState<ScrapingStatus | null>(null);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Auto-refresh status every 5 seconds when panel is open
  useEffect(() => {
    if (!isOpen || !autoRefresh) return;

    const interval = setInterval(() => {
      refreshStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, autoRefresh]);

  const refreshStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statusRes, cacheRes, healthRes, sourcesRes] = await Promise.all([
        getScrapingStatus().catch(() => null),
        getCacheInfo().catch(() => null),
        getHealthStatus().catch(() => null),
        getDataSources().catch(() => null)
      ]);

      if (statusRes) setScrapingStatus(statusRes.data);
      if (cacheRes) setCacheInfo(cacheRes.data);
      if (healthRes) setHealthStatus(healthRes.data);
      if (sourcesRes) setDataSources(sourcesRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartScraping = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await triggerScraping({
        source: 'openrent',
        query: 'london',
        pages: 4,
        filters: {
          maxPrice: 3000,
          minBedrooms: 1
        }
      });

      // Refresh status after starting
      setTimeout(refreshStatus, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start scraping');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async (source?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await clearCache(source);
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'unhealthy':
      case 'down':
      case 'error':
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-50"
        title="Real-time Scraping Controls"
      >
        <Activity className="w-6 h-6" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Real-time Scraping Controls</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2 rounded ${autoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                  title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
                >
                  <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={refreshStatus}
                  disabled={isLoading}
                  className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50"
                  title="Refresh status"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scraping Controls */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <span>Scraping Controls</span>
                  </h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleStartScraping}
                      disabled={isLoading || scrapingStatus?.isRunning}
                      className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Real-time Scraping</span>
                    </button>

                    {scrapingStatus && (
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Status:</span>
                          <div className="flex items-center space-x-2">
                            {scrapingStatus.isRunning ? (
                              <div className="flex items-center space-x-1 text-green-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span>Running</span>
                              </div>
                            ) : (
                              <span className="text-gray-600">Idle</span>
                            )}
                          </div>
                        </div>

                        {scrapingStatus.isRunning && (
                          <>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>{scrapingStatus.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(scrapingStatus.progress)}`}
                                  style={{ width: `${scrapingStatus.progress}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Page:</span>
                                <span className="ml-2 font-medium">{scrapingStatus.currentPage}/{scrapingStatus.totalPages}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Properties:</span>
                                <span className="ml-2 font-medium">{scrapingStatus.propertiesFound}</span>
                              </div>
                            </div>

                            {scrapingStatus.errors.length > 0 && (
                              <div className="text-sm text-red-600">
                                <span className="font-medium">Errors:</span>
                                <ul className="mt-1 space-y-1">
                                  {scrapingStatus.errors.map((error, index) => (
                                    <li key={index}>• {error}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cache Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <Database className="w-5 h-5 text-purple-600" />
                    <span>Cache Management</span>
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleClearCache()}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-4 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Clear All Cache</span>
                      </button>
                      <button
                        onClick={() => handleClearCache('openrent')}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-2 px-4 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Clear Openrent</span>
                      </button>
                    </div>

                    {cacheInfo && (
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Total Entries:</span>
                          <span>{cacheInfo.totalEntries}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Hit Rate:</span>
                          <span>{cacheInfo.hitRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Memory Usage:</span>
                          <span>{cacheInfo.memoryUsage}</span>
                        </div>

                        <div className="space-y-2">
                          <span className="font-medium text-sm">Sources:</span>
                          {Object.entries(cacheInfo.sources).map(([source, info]) => (
                            <div key={source} className="flex justify-between text-sm">
                              <span className="capitalize">{source}:</span>
                              <span>{info.entries} entries</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Health Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    <span>System Health</span>
                  </h3>
                  
                  {healthStatus && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Overall Status:</span>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(healthStatus.status)}
                          <span className="capitalize">{healthStatus.status}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="font-medium text-sm">Services:</span>
                        {Object.entries(healthStatus.services).map(([service, info]) => (
                          <div key={service} className="flex justify-between items-center text-sm">
                            <span className="capitalize">{service}:</span>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(info.status)}
                              <span>{info.responseTime}ms</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span>Scraping Enabled:</span>
                          <span>{healthStatus.scraping.enabled ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Rate Limit:</span>
                          <span>{healthStatus.scraping.rateLimit}ms</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Data Sources */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    <span>Data Sources</span>
                  </h3>
                  
                  {dataSources.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      {dataSources.map((source) => (
                        <div key={source.name} className="flex items-center justify-between p-3 bg-white rounded border">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(source.status)}
                            <div>
                              <div className="font-medium capitalize">{source.name}</div>
                              <div className="text-sm text-gray-600">
                                {source.propertiesCount} properties
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="text-gray-600">
                              {source.errorRate > 0 ? `${source.errorRate}% errors` : 'No errors'}
                            </div>
                            <div className="text-gray-500">
                              {new Date(source.lastUpdate).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RealTimeScrapingPanel; 