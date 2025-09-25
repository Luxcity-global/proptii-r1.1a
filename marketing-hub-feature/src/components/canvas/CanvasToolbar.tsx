import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { 
  Undo, 
  Redo, 
  Save, 
  Download, 
  Share2, 
  Settings,
  ZoomIn,
  ZoomOut,
  Grid
} from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import { ExportDialog } from '../export/ExportDialog';
import { ExportProgress } from '../export/ExportProgress';
import { BatchExportDialog } from '../export/BatchExportDialog';
import type { ExportSettings, ExportJob } from '../export/ExportDialog';
import type { BatchExportItem } from '../export/BatchExportDialog';
import exportService from '../../services/exportService';

export const CanvasToolbar: React.FC = () => {
  const { 
    undo, 
    redo, 
    saveCanvas, 
    setZoom, 
    zoom, 
    toggleGrid, 
    grid,
    isLoading,
    isModified,
    canvas,
    objects
  } = useCanvasStore();

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showBatchExportDialog, setShowBatchExportDialog] = useState(false);
  const [showExportProgress, setShowExportProgress] = useState(false);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 5);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.1);
    setZoom(newZoom);
  };

  const handleExport = async (settings: ExportSettings) => {
    try {
      if (!canvas) {
        throw new Error('Canvas not available');
      }

      // Get canvas data
      const canvasData = JSON.stringify({
        version: '1.0',
        objects: canvas.toJSON(['id', 'name', 'metadata']),
        width: canvas.getWidth(),
        height: canvas.getHeight(),
        zoom: canvas.getZoom()
      });

      // Start export
      const response = await exportService.exportCanvas({
        canvasData,
        settings,
        projectId: 'current-project', // TODO: Get from context
        userId: 'current-user' // TODO: Get from auth context
      });

      // Add job to list
      const newJob: ExportJob = {
        id: response.jobId,
        name: `Export ${settings.format.toUpperCase()}`,
        format: settings.format,
        status: 'processing',
        progress: 0,
        createdAt: new Date()
      };

      setExportJobs(prev => [newJob, ...prev]);
      setShowExportProgress(true);

      // Poll for updates
      pollExportStatus(response.jobId);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  };

  const pollExportStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await exportService.getExportStatus(jobId);
        
        setExportJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, ...status } : job
        ));

        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Failed to poll export status:', error);
        clearInterval(pollInterval);
      }
    }, 2000);

    // Clean up after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000);
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await exportService.cancelExport(jobId);
      setExportJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'cancelled' } : job
      ));
    } catch (error) {
      console.error('Failed to cancel export:', error);
    }
  };

  const handleDownloadJob = async (jobId: string) => {
    try {
      const blob = await exportService.downloadExport(jobId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${jobId}.${exportJobs.find(j => j.id === jobId)?.format || 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download export:', error);
    }
  };

  const handleRemoveJob = (jobId: string) => {
    setExportJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const handleBatchExport = async (items: BatchExportItem[]) => {
    try {
      if (!canvas) {
        throw new Error('Canvas not available');
      }

      // Get canvas data
      const canvasData = JSON.stringify({
        version: '1.0',
        objects: canvas.toJSON(['id', 'name', 'metadata']),
        width: canvas.getWidth(),
        height: canvas.getHeight(),
        zoom: canvas.getZoom()
      });

      // Prepare batch export request
      const batchRequest = {
        canvasData,
        exports: items.map(item => ({
          name: item.name,
          settings: item.settings
        })),
        projectId: 'current-project', // TODO: Get from context
        userId: 'current-user' // TODO: Get from auth context
      };

      // Start batch export
      const response = await exportService.batchExport(batchRequest);

      // Add jobs to list
      const newJobs: ExportJob[] = items.map((item, index) => ({
        id: response.jobIds[index] || `batch-${Date.now()}-${index}`,
        name: item.name,
        format: item.settings.format,
        status: 'processing',
        progress: 0,
        createdAt: new Date()
      }));

      setExportJobs(prev => [...newJobs, ...prev]);
      setShowExportProgress(true);

      // Poll for updates on all jobs
      response.jobIds.forEach(jobId => {
        pollExportStatus(jobId);
      });
    } catch (error) {
      console.error('Batch export failed:', error);
      throw error;
    }
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share functionality coming soon...');
  };

  const getCanvasSize = () => {
    if (!canvas) return { width: 800, height: 600 };
    return { width: canvas.getWidth(), height: canvas.getHeight() };
  };

  return (
    <div className="bg-white border-b border-lux-cream-300 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left Section - Canvas Actions */}
        <div className="flex items-center space-x-2">
          {/* Undo/Redo */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={isLoading}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={isLoading}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Save */}
          <Button
            variant="ghost"
            size="sm"
            onClick={saveCanvas}
            disabled={isLoading}
            title="Save (Ctrl+S)"
          >
            <Save className="w-4 h-4 mr-2" />
            {isModified ? 'Save*' : 'Saved'}
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={isLoading}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={isLoading}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Grid Toggle */}
          <Button
            variant={grid ? "default" : "ghost"}
            size="sm"
            onClick={toggleGrid}
            disabled={isLoading}
            title="Toggle Grid"
          >
            <Grid className="w-4 h-4" />
          </Button>
        </div>

        {/* Center Section - Canvas Title */}
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold text-lux-blue-900">
            Social Media Canvas
          </h2>
          {isModified && (
            <div className="w-2 h-2 bg-orange-500 rounded-full" title="Unsaved changes" />
          )}
        </div>

        {/* Right Section - Export & Share */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
              disabled={isLoading}
              title="Single Export"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBatchExportDialog(true)}
              disabled={isLoading}
              title="Batch Export Multiple Formats"
            >
              <Download className="w-4 h-4 mr-2" />
              Batch Export
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={isLoading}
            title="Share Canvas"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            title="Canvas Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        canvasSize={getCanvasSize()}
        defaultSettings={{
          format: 'png',
          quality: 95,
          includeTransparency: true,
          compression: 'medium'
        }}
      />

      {/* Batch Export Dialog */}
      <BatchExportDialog
        isOpen={showBatchExportDialog}
        onClose={() => setShowBatchExportDialog(false)}
        onBatchExport={handleBatchExport}
        canvasSize={getCanvasSize()}
        defaultSettings={{
          format: 'png',
          quality: 95,
          includeTransparency: true,
          compression: 'medium'
        }}
      />

      {/* Export Progress Dialog */}
      {showExportProgress && (
        <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl border border-lux-cream-300 z-50">
          <div className="p-4 border-b border-lux-cream-300">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-lux-blue-900">Export Progress</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExportProgress(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <ExportProgress
              jobs={exportJobs}
              onCancelJob={handleCancelJob}
              onPauseJob={() => {}} // TODO: Implement pause functionality
              onResumeJob={() => {}} // TODO: Implement resume functionality
              onRetryJob={() => {}} // TODO: Implement retry functionality
              onDownloadJob={handleDownloadJob}
              onRemoveJob={handleRemoveJob}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasToolbar;
