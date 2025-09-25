import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Settings, 
  Palette, 
  Layers, 
  FileText, 
  Image, 
  Download,
  Save,
  FolderOpen,
  Clock,
  Info
} from 'lucide-react';
import type { ExportSettings } from './ExportDialog';

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  settings: ExportSettings;
  category: 'social' | 'print' | 'web' | 'custom';
  isDefault: boolean;
  createdAt: Date;
  usageCount: number;
}

export interface ExportOptionsProps {
  settings: ExportSettings;
  onSettingsChange: (settings: ExportSettings) => void;
  onSaveTemplate: (template: Omit<ExportTemplate, 'id' | 'createdAt' | 'usageCount'>) => void;
  onLoadTemplate: (template: ExportTemplate) => void;
  templates: ExportTemplate[];
  className?: string;
}

const socialTemplates: Omit<ExportTemplate, 'id' | 'createdAt' | 'usageCount'>[] = [
  {
    name: 'Instagram Post',
    description: 'Square format for Instagram posts',
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
    category: 'social',
    isDefault: true
  },
  {
    name: 'Instagram Story',
    description: 'Vertical format for Instagram stories',
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
    category: 'social',
    isDefault: true
  },
  {
    name: 'Facebook Post',
    description: 'Square format for Facebook posts',
    settings: {
      format: 'jpg',
      quality: 90,
      width: 1200,
      height: 1200,
      scale: 1,
      includeTransparency: false,
      compression: 'medium',
      metadata: {
        includeMetadata: true,
        includeLayers: false,
        includeComments: false
      }
    },
    category: 'social',
    isDefault: true
  },
  {
    name: 'Twitter Header',
    description: 'Wide format for Twitter headers',
    settings: {
      format: 'jpg',
      quality: 90,
      width: 1500,
      height: 500,
      scale: 1,
      includeTransparency: false,
      compression: 'medium',
      metadata: {
        includeMetadata: true,
        includeLayers: false,
        includeComments: false
      }
    },
    category: 'social',
    isDefault: true
  }
];

const printTemplates: Omit<ExportTemplate, 'id' | 'createdAt' | 'usageCount'>[] = [
  {
    name: 'Business Card',
    description: 'Standard business card size',
    settings: {
      format: 'pdf',
      quality: 100,
      width: 1050,
      height: 600,
      scale: 1,
      includeTransparency: false,
      compression: 'none',
      metadata: {
        includeMetadata: true,
        includeLayers: true,
        includeComments: true
      }
    },
    category: 'print',
    isDefault: true
  },
  {
    name: 'Flyer A4',
    description: 'A4 size for print flyers',
    settings: {
      format: 'pdf',
      quality: 100,
      width: 2480,
      height: 3508,
      scale: 1,
      includeTransparency: false,
      compression: 'none',
      metadata: {
        includeMetadata: true,
        includeLayers: true,
        includeComments: true
      }
    },
    category: 'print',
    isDefault: true
  }
];

const webTemplates: Omit<ExportTemplate, 'id' | 'createdAt' | 'usageCount'>[] = [
  {
    name: 'Web Banner',
    description: 'Standard web banner size',
    settings: {
      format: 'png',
      quality: 85,
      width: 728,
      height: 90,
      scale: 1,
      includeTransparency: true,
      compression: 'high',
      metadata: {
        includeMetadata: false,
        includeLayers: false,
        includeComments: false
      }
    },
    category: 'web',
    isDefault: true
  },
  {
    name: 'Hero Image',
    description: 'Large hero image for websites',
    settings: {
      format: 'jpg',
      quality: 90,
      width: 1920,
      height: 1080,
      scale: 1,
      includeTransparency: false,
      compression: 'medium',
      metadata: {
        includeMetadata: true,
        includeLayers: false,
        includeComments: false
      }
    },
    category: 'web',
    isDefault: true
  }
];

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  settings,
  onSettingsChange,
  onSaveTemplate,
  onLoadTemplate,
  templates,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'advanced' | 'saved'>('templates');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleLoadTemplate = (template: Omit<ExportTemplate, 'id' | 'createdAt' | 'usageCount'>) => {
    onLoadTemplate({
      ...template,
      id: 'temp',
      createdAt: new Date(),
      usageCount: 0
    });
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) return;

    onSaveTemplate({
      name: newTemplateName,
      description: newTemplateDescription,
      settings,
      category: 'custom',
      isDefault: false
    });

    setNewTemplateName('');
    setNewTemplateDescription('');
    setShowSaveDialog(false);
  };

  const renderTemplateGrid = (templateList: Omit<ExportTemplate, 'id' | 'createdAt' | 'usageCount'>[], title: string) => (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-lux-blue-900 mb-3">{title}</h4>
      <div className="grid grid-cols-2 gap-3">
        {templateList.map((template, index) => (
          <button
            key={index}
            onClick={() => handleLoadTemplate(template)}
            className="p-3 rounded-lg border border-lux-cream-300 hover:border-lux-blue-300 hover:bg-lux-blue-50 transition-all duration-200 text-left"
          >
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 bg-lux-blue-100 rounded flex items-center justify-center">
                {template.category === 'social' && <Image className="w-3 h-3 text-lux-blue-600" />}
                {template.category === 'print' && <FileText className="w-3 h-3 text-lux-blue-600" />}
                {template.category === 'web' && <Download className="w-3 h-3 text-lux-blue-600" />}
              </div>
              <span className="text-sm font-medium text-lux-blue-900">{template.name}</span>
            </div>
            <p className="text-xs text-lux-blue-700">{template.description}</p>
            <div className="mt-2 text-xs text-lux-blue-600">
              {template.settings.width} × {template.settings.height}px • {template.settings.format.toUpperCase()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderAdvancedOptions = () => (
    <div className="space-y-6">
      {/* Background Color */}
      <div>
        <Label className="text-sm font-medium text-lux-blue-900 mb-2 block">
          Background Color
        </Label>
        <div className="flex items-center space-x-3">
          <input
            type="color"
            value={settings.backgroundColor || '#ffffff'}
            onChange={(e) => onSettingsChange({ ...settings, backgroundColor: e.target.value })}
            className="w-12 h-8 rounded border border-lux-cream-300 cursor-pointer"
          />
          <Input
            value={settings.backgroundColor || '#ffffff'}
            onChange={(e) => onSettingsChange({ ...settings, backgroundColor: e.target.value })}
            placeholder="#ffffff"
            className="flex-1"
          />
        </div>
      </div>

      {/* Compression Settings */}
      <div>
        <Label className="text-sm font-medium text-lux-blue-900 mb-3 block">
          Compression Level
        </Label>
        <div className="space-y-2">
          {[
            { value: 'none', label: 'None', description: 'No compression, largest file size' },
            { value: 'medium', label: 'Medium', description: 'Balanced compression and quality' },
            { value: 'high', label: 'High', description: 'Maximum compression, smallest file size' }
          ].map((option) => (
            <label key={option.value} className="flex items-start space-x-3">
              <input
                type="radio"
                name="compression"
                value={option.value}
                checked={settings.compression === option.value}
                onChange={(e) => onSettingsChange({ ...settings, compression: e.target.value as any })}
                className="mt-1"
              />
              <div>
                <div className="text-sm font-medium text-lux-blue-900">{option.label}</div>
                <div className="text-xs text-lux-blue-700">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Metadata Options */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <Layers className="w-4 h-4 text-lux-blue-600" />
          <Label className="text-sm font-medium text-lux-blue-900">Metadata Options</Label>
        </div>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.metadata.includeMetadata}
              onChange={(e) => onSettingsChange({
                ...settings,
                metadata: { ...settings.metadata, includeMetadata: e.target.checked }
              })}
              className="rounded border-lux-cream-300"
            />
            <span className="text-sm text-lux-blue-900">Include metadata</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.metadata.includeLayers}
              onChange={(e) => onSettingsChange({
                ...settings,
                metadata: { ...settings.metadata, includeLayers: e.target.checked }
              })}
              className="rounded border-lux-cream-300"
            />
            <span className="text-sm text-lux-blue-900">Include layer information</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.metadata.includeComments}
              onChange={(e) => onSettingsChange({
                ...settings,
                metadata: { ...settings.metadata, includeComments: e.target.checked }
              })}
              className="rounded border-lux-cream-300"
            />
            <span className="text-sm text-lux-blue-900">Include comments</span>
          </label>
        </div>
      </div>

      {/* Export Timing */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <Clock className="w-4 h-4 text-lux-blue-600" />
          <Label className="text-sm font-medium text-lux-blue-900">Export Timing</Label>
        </div>
        <div className="bg-lux-blue-50 rounded-lg p-3">
          <div className="text-sm text-lux-blue-700">
            <div className="flex items-center space-x-2 mb-1">
              <Info className="w-4 h-4" />
              <span className="font-medium">Export Queue</span>
            </div>
            <p>Your export will be added to the processing queue. You can continue working while it processes in the background.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSavedTemplates = () => (
    <div className="space-y-4">
      {templates.length === 0 ? (
        <div className="text-center py-8">
          <FolderOpen className="w-12 h-12 text-lux-blue-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-lux-blue-900 mb-2">No Saved Templates</h4>
          <p className="text-lux-blue-700">Save your current settings as a template for future use.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="p-4 border border-lux-cream-300 rounded-lg hover:bg-lux-blue-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-lux-blue-900">{template.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-lux-blue-600">
                    Used {template.usageCount} times
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLoadTemplate(template)}
                  >
                    Load
                  </Button>
                </div>
              </div>
              <p className="text-sm text-lux-blue-700 mb-2">{template.description}</p>
              <div className="text-xs text-lux-blue-600">
                {template.settings.width} × {template.settings.height}px • {template.settings.format.toUpperCase()} • Quality: {template.settings.quality}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-white rounded-lg border border-lux-cream-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-lux-cream-300">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-lux-blue-600" />
          <h3 className="text-lg font-semibold text-lux-blue-900">Export Options</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSaveDialog(true)}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Template
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-lux-cream-300">
        {[
          { id: 'templates', label: 'Templates', count: socialTemplates.length + printTemplates.length + webTemplates.length },
          { id: 'advanced', label: 'Advanced' },
          { id: 'saved', label: 'Saved', count: templates.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors
              ${activeTab === tab.id
                ? 'text-lux-blue-600 border-b-2 border-lux-blue-600'
                : 'text-lux-blue-700 hover:text-lux-blue-600'
              }
            `}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'templates' && (
          <div>
            {renderTemplateGrid(socialTemplates, 'Social Media')}
            {renderTemplateGrid(printTemplates, 'Print')}
            {renderTemplateGrid(webTemplates, 'Web')}
          </div>
        )}
        
        {activeTab === 'advanced' && renderAdvancedOptions()}
        
        {activeTab === 'saved' && renderSavedTemplates()}
      </div>

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h4 className="text-lg font-semibold text-lux-blue-900 mb-4">Save Export Template</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name" className="text-sm font-medium text-lux-blue-900">
                  Template Name
                </Label>
                <Input
                  id="template-name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="My Custom Template"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="template-description" className="text-sm font-medium text-lux-blue-900">
                  Description (Optional)
                </Label>
                <Input
                  id="template-description"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Description of when to use this template"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveTemplate}
                disabled={!newTemplateName.trim()}
                className="bg-lux-blue-600 hover:bg-lux-blue-700"
              >
                Save Template
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportOptions;
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Settings, 
  Palette, 
  Layers, 
  FileText, 
  Image, 
  Download,
  Save,
  FolderOpen,
  Clock,
  Info
} from 'lucide-react';
import type { ExportSettings } from './ExportDialog';

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  settings: ExportSettings;
  category: 'social' | 'print' | 'web' | 'custom';
  isDefault: boolean;
  createdAt: Date;
  usageCount: number;
}

export interface ExportOptionsProps {
  settings: ExportSettings;
  onSettingsChange: (settings: ExportSettings) => void;
  onSaveTemplate: (template: Omit<ExportTemplate, 'id' | 'createdAt' | 'usageCount'>) => void;
  onLoadTemplate: (template: ExportTemplate) => void;
  templates: ExportTemplate[];
  className?: string;
}

const socialTemplates: Omit<ExportTemplate, 'id' | 'createdAt' | 'usageCount'>[] = [
  {
    name: 'Instagram Post',
    description: 'Square format for Instagram posts',
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
    category: 'social',
    isDefault: true
  },
  {
    name: 'Instagram Story',
    description: 'Vertical format for Instagram stories',
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
    category: 'social',
    isDefault: true
  },
  {
    name: 'Facebook Post',
    description: 'Square format for Facebook posts',
    settings: {
      format: 'jpg',
      quality: 90,
      width: 1200,
      height: 1200,
      scale: 1,
      includeTransparency: false,
      compression: 'medium',
      metadata: {
        includeMetadata: true,
        includeLayers: false,
        includeComments: false
      }
    },
    category: 'social',
    isDefault: true
  },
  {
    name: 'Twitter Header',
    description: 'Wide format for Twitter headers',
    settings: {
      format: 'jpg',
      quality: 90,
      width: 1500,
      height: 500,
      scale: 1,
      includeTransparency: false,
      compression: 'medium',
      metadata: {
        includeMetadata: true,
        includeLayers: false,
        includeComments: false
      }
    },
    category: 'social',
    isDefault: true
  }
];

const printTemplates: Omit<ExportTemplate, 'id' | 'createdAt' | 'usageCount'>[] = [
  {
    name: 'Business Card',
    description: 'Standard business card size',
    settings: {
      format: 'pdf',
      quality: 100,
      width: 1050,
      height: 600,
      scale: 1,
      includeTransparency: false,
      compression: 'none',
      metadata: {
        includeMetadata: true,
        includeLayers: true,
        includeComments: true
      }
    },
    category: 'print',
    isDefault: true
  },
  {
    name: 'Flyer A4',
    description: 'A4 size for print flyers',
    settings: {
      format: 'pdf',
      quality: 100,
      width: 2480,
      height: 3508,
      scale: 1,
      includeTransparency: false,
      compression: 'none',
      metadata: {
        includeMetadata: true,
        includeLayers: true,
        includeComments: true
      }
    },
    category: 'print',
    isDefault: true
  }
];

const webTemplates: Omit<ExportTemplate, 'id' | 'createdAt' | 'usageCount'>[] = [
  {
    name: 'Web Banner',
    description: 'Standard web banner size',
    settings: {
      format: 'png',
      quality: 85,
      width: 728,
      height: 90,
      scale: 1,
      includeTransparency: true,
      compression: 'high',
      metadata: {
        includeMetadata: false,
        includeLayers: false,
        includeComments: false
      }
    },
    category: 'web',
    isDefault: true
  },
  {
    name: 'Hero Image',
    description: 'Large hero image for websites',
    settings: {
      format: 'jpg',
      quality: 90,
      width: 1920,
      height: 1080,
      scale: 1,
      includeTransparency: false,
      compression: 'medium',
      metadata: {
        includeMetadata: true,
        includeLayers: false,
        includeComments: false
      }
    },
    category: 'web',
    isDefault: true
  }
];

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  settings,
  onSettingsChange,
  onSaveTemplate,
  onLoadTemplate,
  templates,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'advanced' | 'saved'>('templates');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleLoadTemplate = (template: Omit<ExportTemplate, 'id' | 'createdAt' | 'usageCount'>) => {
    onLoadTemplate({
      ...template,
      id: 'temp',
      createdAt: new Date(),
      usageCount: 0
    });
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) return;

    onSaveTemplate({
      name: newTemplateName,
      description: newTemplateDescription,
      settings,
      category: 'custom',
      isDefault: false
    });

    setNewTemplateName('');
    setNewTemplateDescription('');
    setShowSaveDialog(false);
  };

  const renderTemplateGrid = (templateList: Omit<ExportTemplate, 'id' | 'createdAt' | 'usageCount'>[], title: string) => (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-lux-blue-900 mb-3">{title}</h4>
      <div className="grid grid-cols-2 gap-3">
        {templateList.map((template, index) => (
          <button
            key={index}
            onClick={() => handleLoadTemplate(template)}
            className="p-3 rounded-lg border border-lux-cream-300 hover:border-lux-blue-300 hover:bg-lux-blue-50 transition-all duration-200 text-left"
          >
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 bg-lux-blue-100 rounded flex items-center justify-center">
                {template.category === 'social' && <Image className="w-3 h-3 text-lux-blue-600" />}
                {template.category === 'print' && <FileText className="w-3 h-3 text-lux-blue-600" />}
                {template.category === 'web' && <Download className="w-3 h-3 text-lux-blue-600" />}
              </div>
              <span className="text-sm font-medium text-lux-blue-900">{template.name}</span>
            </div>
            <p className="text-xs text-lux-blue-700">{template.description}</p>
            <div className="mt-2 text-xs text-lux-blue-600">
              {template.settings.width} × {template.settings.height}px • {template.settings.format.toUpperCase()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderAdvancedOptions = () => (
    <div className="space-y-6">
      {/* Background Color */}
      <div>
        <Label className="text-sm font-medium text-lux-blue-900 mb-2 block">
          Background Color
        </Label>
        <div className="flex items-center space-x-3">
          <input
            type="color"
            value={settings.backgroundColor || '#ffffff'}
            onChange={(e) => onSettingsChange({ ...settings, backgroundColor: e.target.value })}
            className="w-12 h-8 rounded border border-lux-cream-300 cursor-pointer"
          />
          <Input
            value={settings.backgroundColor || '#ffffff'}
            onChange={(e) => onSettingsChange({ ...settings, backgroundColor: e.target.value })}
            placeholder="#ffffff"
            className="flex-1"
          />
        </div>
      </div>

      {/* Compression Settings */}
      <div>
        <Label className="text-sm font-medium text-lux-blue-900 mb-3 block">
          Compression Level
        </Label>
        <div className="space-y-2">
          {[
            { value: 'none', label: 'None', description: 'No compression, largest file size' },
            { value: 'medium', label: 'Medium', description: 'Balanced compression and quality' },
            { value: 'high', label: 'High', description: 'Maximum compression, smallest file size' }
          ].map((option) => (
            <label key={option.value} className="flex items-start space-x-3">
              <input
                type="radio"
                name="compression"
                value={option.value}
                checked={settings.compression === option.value}
                onChange={(e) => onSettingsChange({ ...settings, compression: e.target.value as any })}
                className="mt-1"
              />
              <div>
                <div className="text-sm font-medium text-lux-blue-900">{option.label}</div>
                <div className="text-xs text-lux-blue-700">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Metadata Options */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <Layers className="w-4 h-4 text-lux-blue-600" />
          <Label className="text-sm font-medium text-lux-blue-900">Metadata Options</Label>
        </div>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.metadata.includeMetadata}
              onChange={(e) => onSettingsChange({
                ...settings,
                metadata: { ...settings.metadata, includeMetadata: e.target.checked }
              })}
              className="rounded border-lux-cream-300"
            />
            <span className="text-sm text-lux-blue-900">Include metadata</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.metadata.includeLayers}
              onChange={(e) => onSettingsChange({
                ...settings,
                metadata: { ...settings.metadata, includeLayers: e.target.checked }
              })}
              className="rounded border-lux-cream-300"
            />
            <span className="text-sm text-lux-blue-900">Include layer information</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.metadata.includeComments}
              onChange={(e) => onSettingsChange({
                ...settings,
                metadata: { ...settings.metadata, includeComments: e.target.checked }
              })}
              className="rounded border-lux-cream-300"
            />
            <span className="text-sm text-lux-blue-900">Include comments</span>
          </label>
        </div>
      </div>

      {/* Export Timing */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <Clock className="w-4 h-4 text-lux-blue-600" />
          <Label className="text-sm font-medium text-lux-blue-900">Export Timing</Label>
        </div>
        <div className="bg-lux-blue-50 rounded-lg p-3">
          <div className="text-sm text-lux-blue-700">
            <div className="flex items-center space-x-2 mb-1">
              <Info className="w-4 h-4" />
              <span className="font-medium">Export Queue</span>
            </div>
            <p>Your export will be added to the processing queue. You can continue working while it processes in the background.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSavedTemplates = () => (
    <div className="space-y-4">
      {templates.length === 0 ? (
        <div className="text-center py-8">
          <FolderOpen className="w-12 h-12 text-lux-blue-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-lux-blue-900 mb-2">No Saved Templates</h4>
          <p className="text-lux-blue-700">Save your current settings as a template for future use.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="p-4 border border-lux-cream-300 rounded-lg hover:bg-lux-blue-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-lux-blue-900">{template.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-lux-blue-600">
                    Used {template.usageCount} times
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLoadTemplate(template)}
                  >
                    Load
                  </Button>
                </div>
              </div>
              <p className="text-sm text-lux-blue-700 mb-2">{template.description}</p>
              <div className="text-xs text-lux-blue-600">
                {template.settings.width} × {template.settings.height}px • {template.settings.format.toUpperCase()} • Quality: {template.settings.quality}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-white rounded-lg border border-lux-cream-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-lux-cream-300">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-lux-blue-600" />
          <h3 className="text-lg font-semibold text-lux-blue-900">Export Options</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSaveDialog(true)}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Template
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-lux-cream-300">
        {[
          { id: 'templates', label: 'Templates', count: socialTemplates.length + printTemplates.length + webTemplates.length },
          { id: 'advanced', label: 'Advanced' },
          { id: 'saved', label: 'Saved', count: templates.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors
              ${activeTab === tab.id
                ? 'text-lux-blue-600 border-b-2 border-lux-blue-600'
                : 'text-lux-blue-700 hover:text-lux-blue-600'
              }
            `}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'templates' && (
          <div>
            {renderTemplateGrid(socialTemplates, 'Social Media')}
            {renderTemplateGrid(printTemplates, 'Print')}
            {renderTemplateGrid(webTemplates, 'Web')}
          </div>
        )}
        
        {activeTab === 'advanced' && renderAdvancedOptions()}
        
        {activeTab === 'saved' && renderSavedTemplates()}
      </div>

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h4 className="text-lg font-semibold text-lux-blue-900 mb-4">Save Export Template</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name" className="text-sm font-medium text-lux-blue-900">
                  Template Name
                </Label>
                <Input
                  id="template-name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="My Custom Template"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="template-description" className="text-sm font-medium text-lux-blue-900">
                  Description (Optional)
                </Label>
                <Input
                  id="template-description"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Description of when to use this template"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveTemplate}
                disabled={!newTemplateName.trim()}
                className="bg-lux-blue-600 hover:bg-lux-blue-700"
              >
                Save Template
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportOptions;


