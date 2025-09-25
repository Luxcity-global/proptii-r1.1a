import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Download, 
  X, 
  Plus, 
  Trash2, 
  FileImage, 
  FileText, 
  File, 
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  Copy,
  Save
} from 'lucide-react';
import type { ExportSettings } from './ExportDialog';
import type { ExportJob } from './ExportProgress';
import exportService from '../../services/exportService';

export interface BatchExportItem {
  id: string;
  name: string;
  settings: ExportSettings;
  enabled: boolean;
}

export interface BatchExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchExport: (items: BatchExportItem[]) => Promise<void>;
  canvasSize: { width: number; height: number };
  defaultSettings?: Partial<ExportSettings>;
  className?: string;
}

const formatOptions = [
  {
    id: 'png' as const,
    name: 'PNG',
    description: 'High quality with transparency',
    icon: <FileImage className="w-4 h-4" />,
    color: 'text-blue-600'
  },
  {
    id: 'jpg' as const,
    name: 'JPG',
    description: 'Smaller file size',
    icon: <FileImage className="w-4 h-4" />,
    color: 'text-green-600'
  },
  {
    id: 'pdf' as const,
    name: 'PDF',
    description: 'Vector format',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-red-600'
  },
  {
    id: 'svg' as const,
    name: 'SVG',
    description: 'Web optimized',
    icon: <File className="w-4 h-4" />,
    color: 'text-purple-600'
  }
];

const sizePresets = [
  {
    id: 'original',
    name: 'Original',
    width: undefined,
    height: undefined,
    scale: 1
  },
  {
    id: 'social-square',
    name: 'Social Square',
    width: 1080,
    height: 1080
  },
  {
    id: 'social-story',
    name: 'Social Story',
    width: 1080,
    height: 1920
  },
  {
    id: 'social-feed',
    name: 'Social Feed',
    width: 1080,
    height: 1350
  },
  {
    id: 'web-banner',
    name: 'Web Banner',
    width: 728,
    height: 90
  },
  {
    id: 'hero-image',
    name: 'Hero Image',
    width: 1920,
    height: 1080
  }
];

export const BatchExportDialog: React.FC<BatchExportDialogProps> = ({
  isOpen,
  onClose,
  onBatchExport,
  canvasSize,
  defaultSettings,
  className = ''
}) => {
  const [exportItems, setExportItems] = useState<BatchExportItem[]>([
    {
      id: '1',
      name: 'Instagram Post',
      settings: {
        format: 'png',
        quality: 95,
        width: 1080,
        height: 1080,
        scale: 1,
        includeTransparency: true,
        compression: 'high',
        metadata: {
          includeMetadata: true,
          includeLayers: false,
          includeComments: false
        }
      },
      enabled: true
    },
    {
      id: '2',
      name: 'Instagram Story',
      settings: {
        format: 'png',
        quality: 95,
        width: 1080,
        height: 1920,
        scale: 1,
        includeTransparency: false,
        compression: 'high',
        metadata: {
          includeMetadata: false,
          includeLayers: false,
          includeComments: false
        }
      },
      enabled: true
    }
  ]);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setExportStatus('idle');
      setExportProgress(0);
      setSelectedTemplate('');
    }
  }, [isOpen]);

  const addExportItem = () => {
    const newItem: BatchExportItem = {
      id: Date.now().toString(),
      name: `Export ${exportItems.length + 1}`,
      settings: {
        format: 'png',
        quality: 95,
        scale: 1,
        includeTransparency: true,
        compression: 'medium',
        metadata: {
          includeMetadata: true,
          includeLayers: false,
          includeComments: false
        },
        ...defaultSettings
      },
      enabled: true
    };
    setExportItems(prev => [...prev, newItem]);
  };

  const removeExportItem = (id: string) => {
    setExportItems(prev => prev.filter(item => item.id !== id));
  };

  const updateExportItem = (id: string, updates: Partial<BatchExportItem>) => {
    setExportItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const duplicateExportItem = (id: string) => {
    const itemToDuplicate = exportItems.find(item => item.id === id);
    if (itemToDuplicate) {
      const newItem: BatchExportItem = {
        ...itemToDuplicate,
        id: Date.now().toString(),
        name: `${itemToDuplicate.name} Copy`
      };
      setExportItems(prev => [...prev, newItem]);
    }
  };

  const applySizePreset = (itemId: string, preset: typeof sizePresets[0]) => {
    updateExportItem(itemId, {
      settings: {
        ...exportItems.find(i => i.id === itemId)!.settings,
        width: preset.width,
        height: preset.height,
        scale: preset.scale || 1
      }
    });
  };

  const handleBatchExport = async () => {
    const enabledItems = exportItems.filter(item => item.enabled);
    if (enabledItems.length === 0) {
      alert('Please enable at least one export item');
      return;
    }

    setIsExporting(true);
    setExportStatus('processing');
    setExportProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onBatchExport(enabledItems);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      setExportStatus('completed');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setExportStatus('error');
      console.error('Batch export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleAllItems = (enabled: boolean) => {
    setExportItems(prev => prev.map(item => ({ ...item, enabled })));
  };

  const enabledCount = exportItems.filter(item => item.enabled).length;
  const totalCount = exportItems.length;

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-lux-cream-300">
          <div className="flex items-center space-x-3">
            <Download className="w-6 h-6 text-lux-blue-600" />
            <h2 className="text-xl font-semibold text-lux-blue-900">Batch Export</h2>
            <Badge variant="outline" className="text-xs">
              {enabledCount}/{totalCount} selected
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6">
          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAllItems(true)}
                disabled={enabledCount === totalCount}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAllItems(false)}
                disabled={enabledCount === 0}
              >
                Deselect All
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addExportItem}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Export
            </Button>
          </div>

          {/* Export Items */}
          <div className="space-y-4 mb-6">
            {exportItems.map((item, index) => {
              const formatOption = formatOptions.find(opt => opt.id === item.settings.format);
              
              return (
                <div
                  key={item.id}
                  className="border border-lux-cream-300 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) => updateExportItem(item.id, { enabled: e.target.checked })}
                        className="rounded border-lux-cream-300"
                      />
                      <div className="flex items-center space-x-2">
                        {formatOption?.icon}
                        <span className="font-medium text-lux-blue-900">{item.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatOption?.name}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateExportItem(item.id)}
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExportItem(item.id)}
                        className="text-lux-red-600 hover:text-lux-red-700"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Format Selection */}
                    <div>
                      <Label className="text-sm font-medium text-lux-blue-900 mb-2 block">
                        Format
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {formatOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => updateExportItem(item.id, {
                              settings: { ...item.settings, format: option.id }
                            })}
                            className={`
                              p-2 rounded border text-left transition-all duration-200
                              ${item.settings.format === option.id
                                ? 'border-lux-blue-500 bg-lux-blue-50'
                                : 'border-lux-cream-300 hover:border-lux-blue-300'
                              }
                            `}
                          >
                            <div className="flex items-center space-x-2">
                              <span className={option.color}>{option.icon}</span>
                              <span className="text-sm font-medium">{option.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Size Presets */}
                    <div>
                      <Label className="text-sm font-medium text-lux-blue-900 mb-2 block">
                        Size Preset
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {sizePresets.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => applySizePreset(item.id, preset)}
                            className="p-2 rounded border border-lux-cream-300 hover:border-lux-blue-300 hover:bg-lux-blue-50 transition-all duration-200 text-left"
                          >
                            <div className="text-sm font-medium text-lux-blue-900">{preset.name}</div>
                            <div className="text-xs text-lux-blue-700">
                              {preset.width && preset.height 
                                ? `${preset.width} × ${preset.height}`
                                : 'Original size'
                              }
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quality Settings */}
                    <div>
                      <Label className="text-sm font-medium text-lux-blue-900 mb-2 block">
                        Quality: {item.settings.quality}%
                      </Label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={item.settings.quality}
                        onChange={(e) => updateExportItem(item.id, {
                          settings: { ...item.settings, quality: parseInt(e.target.value) }
                        })}
                        className="w-full h-2 bg-lux-cream-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-lux-blue-600 mt-1">
                        <span>Smaller file</span>
                        <span>Higher quality</span>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div className="mt-4 pt-4 border-t border-lux-cream-200">
                    <div className="flex items-center space-x-4">
                      {formatOption?.id === 'png' && (
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={item.settings.includeTransparency}
                            onChange={(e) => updateExportItem(item.id, {
                              settings: { ...item.settings, includeTransparency: e.target.checked }
                            })}
                            className="rounded border-lux-cream-300"
                          />
                          <span className="text-sm text-lux-blue-900">Include transparency</span>
                        </label>
                      )}
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={item.settings.metadata.includeMetadata}
                          onChange={(e) => updateExportItem(item.id, {
                            settings: {
                              ...item.settings,
                              metadata: { ...item.settings.metadata, includeMetadata: e.target.checked }
                            }
                          })}
                          className="rounded border-lux-cream-300"
                        />
                        <span className="text-sm text-lux-blue-900">Include metadata</span>
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Export Progress */}
          {exportStatus === 'processing' && (
            <div className="bg-lux-orange-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <Loader2 className="w-4 h-4 text-lux-orange-600 animate-spin" />
                <span className="text-sm font-medium text-lux-orange-900">Exporting {enabledCount} files...</span>
              </div>
              <div className="w-full bg-lux-orange-200 rounded-full h-2">
                <div 
                  className="bg-lux-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <div className="text-xs text-lux-orange-700 mt-1">{exportProgress}% complete</div>
            </div>
          )}

          {exportStatus === 'completed' && (
            <div className="bg-lux-green-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-lux-green-600" />
                <span className="text-sm font-medium text-lux-green-900">
                  Batch export completed successfully! {enabledCount} files exported.
                </span>
              </div>
            </div>
          )}

          {exportStatus === 'error' && (
            <div className="bg-lux-red-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-lux-red-600" />
                <span className="text-sm font-medium text-lux-red-900">Batch export failed. Please try again.</span>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-lux-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="w-4 h-4 text-lux-blue-600" />
              <span className="text-sm font-medium text-lux-blue-900">Export Summary</span>
            </div>
            <div className="text-sm text-lux-blue-700 space-y-1">
              <div>Total exports: {enabledCount}</div>
              <div>Formats: {[...new Set(exportItems.filter(i => i.enabled).map(i => i.settings.format))].join(', ')}</div>
              <div>Estimated time: {Math.max(enabledCount * 2, 5)} seconds</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-lux-cream-300">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleBatchExport} 
            disabled={isExporting || enabledCount === 0}
            className="bg-lux-blue-600 hover:bg-lux-blue-700"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting {enabledCount} files...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export {enabledCount} Files
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BatchExportDialog;
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Download, 
  X, 
  Plus, 
  Trash2, 
  FileImage, 
  FileText, 
  File, 
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  Copy,
  Save
} from 'lucide-react';
import type { ExportSettings } from './ExportDialog';
import type { ExportJob } from './ExportProgress';
import exportService from '../../services/exportService';

export interface BatchExportItem {
  id: string;
  name: string;
  settings: ExportSettings;
  enabled: boolean;
}

export interface BatchExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchExport: (items: BatchExportItem[]) => Promise<void>;
  canvasSize: { width: number; height: number };
  defaultSettings?: Partial<ExportSettings>;
  className?: string;
}

const formatOptions = [
  {
    id: 'png' as const,
    name: 'PNG',
    description: 'High quality with transparency',
    icon: <FileImage className="w-4 h-4" />,
    color: 'text-blue-600'
  },
  {
    id: 'jpg' as const,
    name: 'JPG',
    description: 'Smaller file size',
    icon: <FileImage className="w-4 h-4" />,
    color: 'text-green-600'
  },
  {
    id: 'pdf' as const,
    name: 'PDF',
    description: 'Vector format',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-red-600'
  },
  {
    id: 'svg' as const,
    name: 'SVG',
    description: 'Web optimized',
    icon: <File className="w-4 h-4" />,
    color: 'text-purple-600'
  }
];

const sizePresets = [
  {
    id: 'original',
    name: 'Original',
    width: undefined,
    height: undefined,
    scale: 1
  },
  {
    id: 'social-square',
    name: 'Social Square',
    width: 1080,
    height: 1080
  },
  {
    id: 'social-story',
    name: 'Social Story',
    width: 1080,
    height: 1920
  },
  {
    id: 'social-feed',
    name: 'Social Feed',
    width: 1080,
    height: 1350
  },
  {
    id: 'web-banner',
    name: 'Web Banner',
    width: 728,
    height: 90
  },
  {
    id: 'hero-image',
    name: 'Hero Image',
    width: 1920,
    height: 1080
  }
];

export const BatchExportDialog: React.FC<BatchExportDialogProps> = ({
  isOpen,
  onClose,
  onBatchExport,
  canvasSize,
  defaultSettings,
  className = ''
}) => {
  const [exportItems, setExportItems] = useState<BatchExportItem[]>([
    {
      id: '1',
      name: 'Instagram Post',
      settings: {
        format: 'png',
        quality: 95,
        width: 1080,
        height: 1080,
        scale: 1,
        includeTransparency: true,
        compression: 'high',
        metadata: {
          includeMetadata: true,
          includeLayers: false,
          includeComments: false
        }
      },
      enabled: true
    },
    {
      id: '2',
      name: 'Instagram Story',
      settings: {
        format: 'png',
        quality: 95,
        width: 1080,
        height: 1920,
        scale: 1,
        includeTransparency: false,
        compression: 'high',
        metadata: {
          includeMetadata: false,
          includeLayers: false,
          includeComments: false
        }
      },
      enabled: true
    }
  ]);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setExportStatus('idle');
      setExportProgress(0);
      setSelectedTemplate('');
    }
  }, [isOpen]);

  const addExportItem = () => {
    const newItem: BatchExportItem = {
      id: Date.now().toString(),
      name: `Export ${exportItems.length + 1}`,
      settings: {
        format: 'png',
        quality: 95,
        scale: 1,
        includeTransparency: true,
        compression: 'medium',
        metadata: {
          includeMetadata: true,
          includeLayers: false,
          includeComments: false
        },
        ...defaultSettings
      },
      enabled: true
    };
    setExportItems(prev => [...prev, newItem]);
  };

  const removeExportItem = (id: string) => {
    setExportItems(prev => prev.filter(item => item.id !== id));
  };

  const updateExportItem = (id: string, updates: Partial<BatchExportItem>) => {
    setExportItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const duplicateExportItem = (id: string) => {
    const itemToDuplicate = exportItems.find(item => item.id === id);
    if (itemToDuplicate) {
      const newItem: BatchExportItem = {
        ...itemToDuplicate,
        id: Date.now().toString(),
        name: `${itemToDuplicate.name} Copy`
      };
      setExportItems(prev => [...prev, newItem]);
    }
  };

  const applySizePreset = (itemId: string, preset: typeof sizePresets[0]) => {
    updateExportItem(itemId, {
      settings: {
        ...exportItems.find(i => i.id === itemId)!.settings,
        width: preset.width,
        height: preset.height,
        scale: preset.scale || 1
      }
    });
  };

  const handleBatchExport = async () => {
    const enabledItems = exportItems.filter(item => item.enabled);
    if (enabledItems.length === 0) {
      alert('Please enable at least one export item');
      return;
    }

    setIsExporting(true);
    setExportStatus('processing');
    setExportProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onBatchExport(enabledItems);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      setExportStatus('completed');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setExportStatus('error');
      console.error('Batch export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleAllItems = (enabled: boolean) => {
    setExportItems(prev => prev.map(item => ({ ...item, enabled })));
  };

  const enabledCount = exportItems.filter(item => item.enabled).length;
  const totalCount = exportItems.length;

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-lux-cream-300">
          <div className="flex items-center space-x-3">
            <Download className="w-6 h-6 text-lux-blue-600" />
            <h2 className="text-xl font-semibold text-lux-blue-900">Batch Export</h2>
            <Badge variant="outline" className="text-xs">
              {enabledCount}/{totalCount} selected
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6">
          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAllItems(true)}
                disabled={enabledCount === totalCount}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAllItems(false)}
                disabled={enabledCount === 0}
              >
                Deselect All
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addExportItem}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Export
            </Button>
          </div>

          {/* Export Items */}
          <div className="space-y-4 mb-6">
            {exportItems.map((item, index) => {
              const formatOption = formatOptions.find(opt => opt.id === item.settings.format);
              
              return (
                <div
                  key={item.id}
                  className="border border-lux-cream-300 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) => updateExportItem(item.id, { enabled: e.target.checked })}
                        className="rounded border-lux-cream-300"
                      />
                      <div className="flex items-center space-x-2">
                        {formatOption?.icon}
                        <span className="font-medium text-lux-blue-900">{item.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatOption?.name}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateExportItem(item.id)}
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExportItem(item.id)}
                        className="text-lux-red-600 hover:text-lux-red-700"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Format Selection */}
                    <div>
                      <Label className="text-sm font-medium text-lux-blue-900 mb-2 block">
                        Format
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {formatOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => updateExportItem(item.id, {
                              settings: { ...item.settings, format: option.id }
                            })}
                            className={`
                              p-2 rounded border text-left transition-all duration-200
                              ${item.settings.format === option.id
                                ? 'border-lux-blue-500 bg-lux-blue-50'
                                : 'border-lux-cream-300 hover:border-lux-blue-300'
                              }
                            `}
                          >
                            <div className="flex items-center space-x-2">
                              <span className={option.color}>{option.icon}</span>
                              <span className="text-sm font-medium">{option.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Size Presets */}
                    <div>
                      <Label className="text-sm font-medium text-lux-blue-900 mb-2 block">
                        Size Preset
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {sizePresets.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => applySizePreset(item.id, preset)}
                            className="p-2 rounded border border-lux-cream-300 hover:border-lux-blue-300 hover:bg-lux-blue-50 transition-all duration-200 text-left"
                          >
                            <div className="text-sm font-medium text-lux-blue-900">{preset.name}</div>
                            <div className="text-xs text-lux-blue-700">
                              {preset.width && preset.height 
                                ? `${preset.width} × ${preset.height}`
                                : 'Original size'
                              }
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quality Settings */}
                    <div>
                      <Label className="text-sm font-medium text-lux-blue-900 mb-2 block">
                        Quality: {item.settings.quality}%
                      </Label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={item.settings.quality}
                        onChange={(e) => updateExportItem(item.id, {
                          settings: { ...item.settings, quality: parseInt(e.target.value) }
                        })}
                        className="w-full h-2 bg-lux-cream-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-lux-blue-600 mt-1">
                        <span>Smaller file</span>
                        <span>Higher quality</span>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div className="mt-4 pt-4 border-t border-lux-cream-200">
                    <div className="flex items-center space-x-4">
                      {formatOption?.id === 'png' && (
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={item.settings.includeTransparency}
                            onChange={(e) => updateExportItem(item.id, {
                              settings: { ...item.settings, includeTransparency: e.target.checked }
                            })}
                            className="rounded border-lux-cream-300"
                          />
                          <span className="text-sm text-lux-blue-900">Include transparency</span>
                        </label>
                      )}
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={item.settings.metadata.includeMetadata}
                          onChange={(e) => updateExportItem(item.id, {
                            settings: {
                              ...item.settings,
                              metadata: { ...item.settings.metadata, includeMetadata: e.target.checked }
                            }
                          })}
                          className="rounded border-lux-cream-300"
                        />
                        <span className="text-sm text-lux-blue-900">Include metadata</span>
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Export Progress */}
          {exportStatus === 'processing' && (
            <div className="bg-lux-orange-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <Loader2 className="w-4 h-4 text-lux-orange-600 animate-spin" />
                <span className="text-sm font-medium text-lux-orange-900">Exporting {enabledCount} files...</span>
              </div>
              <div className="w-full bg-lux-orange-200 rounded-full h-2">
                <div 
                  className="bg-lux-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <div className="text-xs text-lux-orange-700 mt-1">{exportProgress}% complete</div>
            </div>
          )}

          {exportStatus === 'completed' && (
            <div className="bg-lux-green-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-lux-green-600" />
                <span className="text-sm font-medium text-lux-green-900">
                  Batch export completed successfully! {enabledCount} files exported.
                </span>
              </div>
            </div>
          )}

          {exportStatus === 'error' && (
            <div className="bg-lux-red-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-lux-red-600" />
                <span className="text-sm font-medium text-lux-red-900">Batch export failed. Please try again.</span>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-lux-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="w-4 h-4 text-lux-blue-600" />
              <span className="text-sm font-medium text-lux-blue-900">Export Summary</span>
            </div>
            <div className="text-sm text-lux-blue-700 space-y-1">
              <div>Total exports: {enabledCount}</div>
              <div>Formats: {[...new Set(exportItems.filter(i => i.enabled).map(i => i.settings.format))].join(', ')}</div>
              <div>Estimated time: {Math.max(enabledCount * 2, 5)} seconds</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-lux-cream-300">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleBatchExport} 
            disabled={isExporting || enabledCount === 0}
            className="bg-lux-blue-600 hover:bg-lux-blue-700"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting {enabledCount} files...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export {enabledCount} Files
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BatchExportDialog;


