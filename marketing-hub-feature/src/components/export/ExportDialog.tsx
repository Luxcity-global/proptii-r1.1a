import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Download, 
  X, 
  Settings, 
  FileImage, 
  FileText, 
  File, 
  Monitor,
  Smartphone,
  Tablet,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

export interface ExportSettings {
  format: 'png' | 'jpg' | 'pdf' | 'svg';
  quality: number; // 1-100
  width?: number;
  height?: number;
  scale: number; // 1x, 2x, 3x for retina
  backgroundColor?: string;
  includeTransparency: boolean;
  compression: 'none' | 'medium' | 'high';
  metadata: {
    includeMetadata: boolean;
    includeLayers: boolean;
    includeComments: boolean;
  };
}

export interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: ExportSettings) => Promise<void>;
  canvasSize: { width: number; height: number };
  defaultSettings?: Partial<ExportSettings>;
  className?: string;
}

const formatOptions = [
  {
    id: 'png' as const,
    name: 'PNG',
    description: 'High quality with transparency support',
    icon: <FileImage className="w-5 h-5" />,
    recommended: true,
    supportsTransparency: true
  },
  {
    id: 'jpg' as const,
    name: 'JPG',
    description: 'Smaller file size, no transparency',
    icon: <FileImage className="w-5 h-5" />,
    recommended: false,
    supportsTransparency: false
  },
  {
    id: 'pdf' as const,
    name: 'PDF',
    description: 'Vector format, scalable',
    icon: <FileText className="w-5 h-5" />,
    recommended: false,
    supportsTransparency: false
  },
  {
    id: 'svg' as const,
    name: 'SVG',
    description: 'Vector format, web optimized',
    icon: <File className="w-5 h-5" />,
    recommended: false,
    supportsTransparency: true
  }
];

const sizePresets = [
  {
    id: 'original',
    name: 'Original Size',
    description: 'Export at canvas size',
    icon: <Monitor className="w-4 h-4" />,
    multiplier: 1
  },
  {
    id: '2x',
    name: '2x Retina',
    description: 'High DPI displays',
    icon: <Monitor className="w-4 h-4" />,
    multiplier: 2
  },
  {
    id: 'social-square',
    name: 'Social Square',
    description: '1080x1080px',
    icon: <Monitor className="w-4 h-4" />,
    width: 1080,
    height: 1080
  },
  {
    id: 'social-story',
    name: 'Social Story',
    description: '1080x1920px',
    icon: <Smartphone className="w-4 h-4" />,
    width: 1080,
    height: 1920
  },
  {
    id: 'social-feed',
    name: 'Social Feed',
    description: '1080x1350px',
    icon: <Tablet className="w-4 h-4" />,
    width: 1080,
    height: 1350
  }
];

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  canvasSize,
  defaultSettings,
  className = ''
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'png',
    quality: 95,
    scale: 1,
    includeTransparency: true,
    compression: 'medium',
    metadata: {
      includeMetadata: true,
      includeLayers: false,
      includeComments: true
    },
    ...defaultSettings
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSettings(prev => ({
        ...prev,
        ...defaultSettings
      }));
      setExportStatus('idle');
      setExportProgress(0);
    }
  }, [isOpen, defaultSettings]);

  const handleFormatChange = (format: ExportSettings['format']) => {
    const formatOption = formatOptions.find(opt => opt.id === format);
    setSettings(prev => ({
      ...prev,
      format,
      includeTransparency: formatOption?.supportsTransparency || false
    }));
  };

  const handleSizePreset = (preset: typeof sizePresets[0]) => {
    if (preset.id === 'original') {
      setSettings(prev => ({
        ...prev,
        width: undefined,
        height: undefined,
        scale: 1
      }));
    } else if (preset.multiplier) {
      setSettings(prev => ({
        ...prev,
        width: Math.round(canvasSize.width * preset.multiplier),
        height: Math.round(canvasSize.height * preset.multiplier),
        scale: preset.multiplier
      }));
    } else if (preset.width && preset.height) {
      setSettings(prev => ({
        ...prev,
        width: preset.width,
        height: preset.height,
        scale: preset.width / canvasSize.width
      }));
    }
  };

  const handleExport = async () => {
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

      await onExport(settings);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      setExportStatus('completed');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setExportStatus('error');
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const selectedFormat = formatOptions.find(opt => opt.id === settings.format);
  const estimatedFileSize = calculateEstimatedFileSize(settings, canvasSize);

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-lux-cream-300">
          <div className="flex items-center space-x-3">
            <Download className="w-6 h-6 text-lux-blue-600" />
            <h2 className="text-xl font-semibold text-lux-blue-900">Export Canvas</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <Label className="text-sm font-medium text-lux-blue-900 mb-3 block">
              Export Format
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {formatOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleFormatChange(option.id)}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200 text-left
                    ${settings.format === option.id
                      ? 'border-lux-blue-500 bg-lux-blue-50'
                      : 'border-lux-cream-300 hover:border-lux-blue-300 hover:bg-lux-blue-50'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {option.icon}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-lux-blue-900">{option.name}</span>
                        {option.recommended && (
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-lux-blue-700">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Size Presets */}
          <div>
            <Label className="text-sm font-medium text-lux-blue-900 mb-3 block">
              Size Presets
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {sizePresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSizePreset(preset)}
                  className="p-3 rounded-lg border border-lux-cream-300 hover:border-lux-blue-300 hover:bg-lux-blue-50 transition-all duration-200 text-left"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {preset.icon}
                    <span className="text-sm font-medium text-lux-blue-900">{preset.name}</span>
                  </div>
                  <p className="text-xs text-lux-blue-700">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width" className="text-sm font-medium text-lux-blue-900">
                Width (px)
              </Label>
              <Input
                id="width"
                type="number"
                value={settings.width || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, width: parseInt(e.target.value) || undefined }))}
                placeholder={canvasSize.width.toString()}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-sm font-medium text-lux-blue-900">
                Height (px)
              </Label>
              <Input
                id="height"
                type="number"
                value={settings.height || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, height: parseInt(e.target.value) || undefined }))}
                placeholder={canvasSize.height.toString()}
                className="mt-1"
              />
            </div>
          </div>

          {/* Quality Settings */}
          {['png', 'jpg'].includes(settings.format) && (
            <div>
              <Label className="text-sm font-medium text-lux-blue-900 mb-3 block">
                Quality: {settings.quality}%
              </Label>
              <input
                type="range"
                min="10"
                max="100"
                value={settings.quality}
                onChange={(e) => setSettings(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                className="w-full h-2 bg-lux-cream-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-lux-blue-600 mt-1">
                <span>Smaller file</span>
                <span>Higher quality</span>
              </div>
            </div>
          )}

          {/* Advanced Options */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Settings className="w-4 h-4 text-lux-blue-600" />
              <Label className="text-sm font-medium text-lux-blue-900">Advanced Options</Label>
            </div>
            <div className="space-y-3">
              {selectedFormat?.supportsTransparency && (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.includeTransparency}
                    onChange={(e) => setSettings(prev => ({ ...prev, includeTransparency: e.target.checked }))}
                    className="rounded border-lux-cream-300"
                  />
                  <span className="text-sm text-lux-blue-900">Include transparency</span>
                </label>
              )}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.metadata.includeMetadata}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    metadata: { ...prev.metadata, includeMetadata: e.target.checked }
                  }))}
                  className="rounded border-lux-cream-300"
                />
                <span className="text-sm text-lux-blue-900">Include metadata</span>
              </label>
            </div>
          </div>

          {/* Export Preview */}
          <div className="bg-lux-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="w-4 h-4 text-lux-blue-600" />
              <span className="text-sm font-medium text-lux-blue-900">Export Preview</span>
            </div>
            <div className="text-sm text-lux-blue-700 space-y-1">
              <div>Format: {selectedFormat?.name}</div>
              <div>Size: {settings.width || canvasSize.width} × {settings.height || canvasSize.height}px</div>
              <div>Estimated file size: {estimatedFileSize}</div>
            </div>
          </div>

          {/* Export Progress */}
          {exportStatus === 'processing' && (
            <div className="bg-lux-orange-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Loader2 className="w-4 h-4 text-lux-orange-600 animate-spin" />
                <span className="text-sm font-medium text-lux-orange-900">Exporting...</span>
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
            <div className="bg-lux-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-lux-green-600" />
                <span className="text-sm font-medium text-lux-green-900">Export completed successfully!</span>
              </div>
            </div>
          )}

          {exportStatus === 'error' && (
            <div className="bg-lux-red-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-lux-red-600" />
                <span className="text-sm font-medium text-lux-red-900">Export failed. Please try again.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-lux-cream-300">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="bg-lux-blue-600 hover:bg-lux-blue-700"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper function to estimate file size
function calculateEstimatedFileSize(settings: ExportSettings, canvasSize: { width: number; height: number }): string {
  const width = settings.width || canvasSize.width;
  const height = settings.height || canvasSize.height;
  const pixels = width * height * (settings.scale || 1) ** 2;
  
  let bytesPerPixel = 4; // RGBA
  if (settings.format === 'jpg') {
    bytesPerPixel = 3; // RGB
  } else if (settings.format === 'svg') {
    bytesPerPixel = 0.1; // Vector format
  } else if (settings.format === 'pdf') {
    bytesPerPixel = 0.5; // Compressed vector
  }
  
  // Apply quality factor
  const qualityFactor = settings.quality / 100;
  const estimatedBytes = pixels * bytesPerPixel * qualityFactor;
  
  if (estimatedBytes < 1024) {
    return `${Math.round(estimatedBytes)} B`;
  } else if (estimatedBytes < 1024 * 1024) {
    return `${Math.round(estimatedBytes / 1024)} KB`;
  } else {
    return `${Math.round(estimatedBytes / (1024 * 1024))} MB`;
  }
}

export default ExportDialog;
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Download, 
  X, 
  Settings, 
  FileImage, 
  FileText, 
  File, 
  Monitor,
  Smartphone,
  Tablet,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

export interface ExportSettings {
  format: 'png' | 'jpg' | 'pdf' | 'svg';
  quality: number; // 1-100
  width?: number;
  height?: number;
  scale: number; // 1x, 2x, 3x for retina
  backgroundColor?: string;
  includeTransparency: boolean;
  compression: 'none' | 'medium' | 'high';
  metadata: {
    includeMetadata: boolean;
    includeLayers: boolean;
    includeComments: boolean;
  };
}

export interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: ExportSettings) => Promise<void>;
  canvasSize: { width: number; height: number };
  defaultSettings?: Partial<ExportSettings>;
  className?: string;
}

const formatOptions = [
  {
    id: 'png' as const,
    name: 'PNG',
    description: 'High quality with transparency support',
    icon: <FileImage className="w-5 h-5" />,
    recommended: true,
    supportsTransparency: true
  },
  {
    id: 'jpg' as const,
    name: 'JPG',
    description: 'Smaller file size, no transparency',
    icon: <FileImage className="w-5 h-5" />,
    recommended: false,
    supportsTransparency: false
  },
  {
    id: 'pdf' as const,
    name: 'PDF',
    description: 'Vector format, scalable',
    icon: <FileText className="w-5 h-5" />,
    recommended: false,
    supportsTransparency: false
  },
  {
    id: 'svg' as const,
    name: 'SVG',
    description: 'Vector format, web optimized',
    icon: <File className="w-5 h-5" />,
    recommended: false,
    supportsTransparency: true
  }
];

const sizePresets = [
  {
    id: 'original',
    name: 'Original Size',
    description: 'Export at canvas size',
    icon: <Monitor className="w-4 h-4" />,
    multiplier: 1
  },
  {
    id: '2x',
    name: '2x Retina',
    description: 'High DPI displays',
    icon: <Monitor className="w-4 h-4" />,
    multiplier: 2
  },
  {
    id: 'social-square',
    name: 'Social Square',
    description: '1080x1080px',
    icon: <Monitor className="w-4 h-4" />,
    width: 1080,
    height: 1080
  },
  {
    id: 'social-story',
    name: 'Social Story',
    description: '1080x1920px',
    icon: <Smartphone className="w-4 h-4" />,
    width: 1080,
    height: 1920
  },
  {
    id: 'social-feed',
    name: 'Social Feed',
    description: '1080x1350px',
    icon: <Tablet className="w-4 h-4" />,
    width: 1080,
    height: 1350
  }
];

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  canvasSize,
  defaultSettings,
  className = ''
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'png',
    quality: 95,
    scale: 1,
    includeTransparency: true,
    compression: 'medium',
    metadata: {
      includeMetadata: true,
      includeLayers: false,
      includeComments: true
    },
    ...defaultSettings
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSettings(prev => ({
        ...prev,
        ...defaultSettings
      }));
      setExportStatus('idle');
      setExportProgress(0);
    }
  }, [isOpen, defaultSettings]);

  const handleFormatChange = (format: ExportSettings['format']) => {
    const formatOption = formatOptions.find(opt => opt.id === format);
    setSettings(prev => ({
      ...prev,
      format,
      includeTransparency: formatOption?.supportsTransparency || false
    }));
  };

  const handleSizePreset = (preset: typeof sizePresets[0]) => {
    if (preset.id === 'original') {
      setSettings(prev => ({
        ...prev,
        width: undefined,
        height: undefined,
        scale: 1
      }));
    } else if (preset.multiplier) {
      setSettings(prev => ({
        ...prev,
        width: Math.round(canvasSize.width * preset.multiplier),
        height: Math.round(canvasSize.height * preset.multiplier),
        scale: preset.multiplier
      }));
    } else if (preset.width && preset.height) {
      setSettings(prev => ({
        ...prev,
        width: preset.width,
        height: preset.height,
        scale: preset.width / canvasSize.width
      }));
    }
  };

  const handleExport = async () => {
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

      await onExport(settings);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      setExportStatus('completed');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setExportStatus('error');
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const selectedFormat = formatOptions.find(opt => opt.id === settings.format);
  const estimatedFileSize = calculateEstimatedFileSize(settings, canvasSize);

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-lux-cream-300">
          <div className="flex items-center space-x-3">
            <Download className="w-6 h-6 text-lux-blue-600" />
            <h2 className="text-xl font-semibold text-lux-blue-900">Export Canvas</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <Label className="text-sm font-medium text-lux-blue-900 mb-3 block">
              Export Format
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {formatOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleFormatChange(option.id)}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200 text-left
                    ${settings.format === option.id
                      ? 'border-lux-blue-500 bg-lux-blue-50'
                      : 'border-lux-cream-300 hover:border-lux-blue-300 hover:bg-lux-blue-50'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {option.icon}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-lux-blue-900">{option.name}</span>
                        {option.recommended && (
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-lux-blue-700">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Size Presets */}
          <div>
            <Label className="text-sm font-medium text-lux-blue-900 mb-3 block">
              Size Presets
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {sizePresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSizePreset(preset)}
                  className="p-3 rounded-lg border border-lux-cream-300 hover:border-lux-blue-300 hover:bg-lux-blue-50 transition-all duration-200 text-left"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {preset.icon}
                    <span className="text-sm font-medium text-lux-blue-900">{preset.name}</span>
                  </div>
                  <p className="text-xs text-lux-blue-700">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width" className="text-sm font-medium text-lux-blue-900">
                Width (px)
              </Label>
              <Input
                id="width"
                type="number"
                value={settings.width || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, width: parseInt(e.target.value) || undefined }))}
                placeholder={canvasSize.width.toString()}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-sm font-medium text-lux-blue-900">
                Height (px)
              </Label>
              <Input
                id="height"
                type="number"
                value={settings.height || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, height: parseInt(e.target.value) || undefined }))}
                placeholder={canvasSize.height.toString()}
                className="mt-1"
              />
            </div>
          </div>

          {/* Quality Settings */}
          {['png', 'jpg'].includes(settings.format) && (
            <div>
              <Label className="text-sm font-medium text-lux-blue-900 mb-3 block">
                Quality: {settings.quality}%
              </Label>
              <input
                type="range"
                min="10"
                max="100"
                value={settings.quality}
                onChange={(e) => setSettings(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                className="w-full h-2 bg-lux-cream-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-lux-blue-600 mt-1">
                <span>Smaller file</span>
                <span>Higher quality</span>
              </div>
            </div>
          )}

          {/* Advanced Options */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Settings className="w-4 h-4 text-lux-blue-600" />
              <Label className="text-sm font-medium text-lux-blue-900">Advanced Options</Label>
            </div>
            <div className="space-y-3">
              {selectedFormat?.supportsTransparency && (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.includeTransparency}
                    onChange={(e) => setSettings(prev => ({ ...prev, includeTransparency: e.target.checked }))}
                    className="rounded border-lux-cream-300"
                  />
                  <span className="text-sm text-lux-blue-900">Include transparency</span>
                </label>
              )}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.metadata.includeMetadata}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    metadata: { ...prev.metadata, includeMetadata: e.target.checked }
                  }))}
                  className="rounded border-lux-cream-300"
                />
                <span className="text-sm text-lux-blue-900">Include metadata</span>
              </label>
            </div>
          </div>

          {/* Export Preview */}
          <div className="bg-lux-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="w-4 h-4 text-lux-blue-600" />
              <span className="text-sm font-medium text-lux-blue-900">Export Preview</span>
            </div>
            <div className="text-sm text-lux-blue-700 space-y-1">
              <div>Format: {selectedFormat?.name}</div>
              <div>Size: {settings.width || canvasSize.width} × {settings.height || canvasSize.height}px</div>
              <div>Estimated file size: {estimatedFileSize}</div>
            </div>
          </div>

          {/* Export Progress */}
          {exportStatus === 'processing' && (
            <div className="bg-lux-orange-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Loader2 className="w-4 h-4 text-lux-orange-600 animate-spin" />
                <span className="text-sm font-medium text-lux-orange-900">Exporting...</span>
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
            <div className="bg-lux-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-lux-green-600" />
                <span className="text-sm font-medium text-lux-green-900">Export completed successfully!</span>
              </div>
            </div>
          )}

          {exportStatus === 'error' && (
            <div className="bg-lux-red-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-lux-red-600" />
                <span className="text-sm font-medium text-lux-red-900">Export failed. Please try again.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-lux-cream-300">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="bg-lux-blue-600 hover:bg-lux-blue-700"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper function to estimate file size
function calculateEstimatedFileSize(settings: ExportSettings, canvasSize: { width: number; height: number }): string {
  const width = settings.width || canvasSize.width;
  const height = settings.height || canvasSize.height;
  const pixels = width * height * (settings.scale || 1) ** 2;
  
  let bytesPerPixel = 4; // RGBA
  if (settings.format === 'jpg') {
    bytesPerPixel = 3; // RGB
  } else if (settings.format === 'svg') {
    bytesPerPixel = 0.1; // Vector format
  } else if (settings.format === 'pdf') {
    bytesPerPixel = 0.5; // Compressed vector
  }
  
  // Apply quality factor
  const qualityFactor = settings.quality / 100;
  const estimatedBytes = pixels * bytesPerPixel * qualityFactor;
  
  if (estimatedBytes < 1024) {
    return `${Math.round(estimatedBytes)} B`;
  } else if (estimatedBytes < 1024 * 1024) {
    return `${Math.round(estimatedBytes / 1024)} KB`;
  } else {
    return `${Math.round(estimatedBytes / (1024 * 1024))} MB`;
  }
}

export default ExportDialog;


