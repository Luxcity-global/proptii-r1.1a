import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Download, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Pause, 
  Play, 
  Loader2,
  FileImage,
  FileText,
  File,
  Trash2
} from 'lucide-react';

export interface ExportJob {
  id: string;
  name: string;
  format: 'png' | 'jpg' | 'pdf' | 'svg';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused' | 'cancelled';
  progress: number; // 0-100
  fileSize?: number;
  downloadUrl?: string;
  errorMessage?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number; // seconds
}

export interface ExportProgressProps {
  jobs: ExportJob[];
  onCancelJob: (jobId: string) => void;
  onPauseJob: (jobId: string) => void;
  onResumeJob: (jobId: string) => void;
  onRetryJob: (jobId: string) => void;
  onDownloadJob: (jobId: string) => void;
  onRemoveJob: (jobId: string) => void;
  className?: string;
}

const getFormatIcon = (format: string) => {
  switch (format) {
    case 'png':
    case 'jpg':
      return <FileImage className="w-4 h-4" />;
    case 'pdf':
      return <FileText className="w-4 h-4" />;
    case 'svg':
      return <File className="w-4 h-4" />;
    default:
      return <File className="w-4 h-4" />;
  }
};

const getStatusColor = (status: ExportJob['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-lux-orange-100 text-lux-orange-800 border-lux-orange-200';
    case 'processing':
      return 'bg-lux-blue-100 text-lux-blue-800 border-lux-blue-200';
    case 'completed':
      return 'bg-lux-green-100 text-lux-green-800 border-lux-green-200';
    case 'failed':
      return 'bg-lux-red-100 text-lux-red-800 border-lux-red-200';
    case 'paused':
      return 'bg-lux-gray-100 text-lux-gray-800 border-lux-gray-200';
    case 'cancelled':
      return 'bg-lux-gray-100 text-lux-gray-800 border-lux-gray-200';
    default:
      return 'bg-lux-gray-100 text-lux-gray-800 border-lux-gray-200';
  }
};

const getStatusIcon = (status: ExportJob['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4" />;
    case 'processing':
      return <Loader2 className="w-4 h-4 animate-spin" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'failed':
      return <AlertCircle className="w-4 h-4" />;
    case 'paused':
      return <Pause className="w-4 h-4" />;
    case 'cancelled':
      return <X className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'Unknown';
  
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  } else {
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  }
};

const formatTimeRemaining = (seconds?: number): string => {
  if (!seconds) return '';
  
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m`;
  } else {
    return `${Math.round(seconds / 3600)}h`;
  }
};

const formatDuration = (startedAt?: Date, completedAt?: Date): string => {
  if (!startedAt) return '';
  
  const end = completedAt || new Date();
  const duration = end.getTime() - startedAt.getTime();
  const seconds = Math.floor(duration / 1000);
  
  return formatTimeRemaining(seconds);
};

export const ExportProgress: React.FC<ExportProgressProps> = ({
  jobs,
  onCancelJob,
  onPauseJob,
  onResumeJob,
  onRetryJob,
  onDownloadJob,
  onRemoveJob,
  className = ''
}) => {
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [showCompletedJobs, setShowCompletedJobs] = useState(false);

  const activeJobs = jobs.filter(job => 
    ['pending', 'processing', 'paused'].includes(job.status)
  );
  
  const completedJobs = jobs.filter(job => 
    ['completed', 'failed', 'cancelled'].includes(job.status)
  );

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const renderJobActions = (job: ExportJob) => {
    switch (job.status) {
      case 'pending':
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancelJob(job.id)}
            className="text-lux-red-600 hover:text-lux-red-700"
          >
            Cancel
          </Button>
        );
      
      case 'processing':
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPauseJob(job.id)}
            >
              <Pause className="w-3 h-3 mr-1" />
              Pause
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancelJob(job.id)}
              className="text-lux-red-600 hover:text-lux-red-700"
            >
              Cancel
            </Button>
          </div>
        );
      
      case 'paused':
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResumeJob(job.id)}
            >
              <Play className="w-3 h-3 mr-1" />
              Resume
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancelJob(job.id)}
              className="text-lux-red-600 hover:text-lux-red-700"
            >
              Cancel
            </Button>
          </div>
        );
      
      case 'completed':
        return (
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => onDownloadJob(job.id)}
              className="bg-lux-blue-600 hover:bg-lux-blue-700"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemoveJob(job.id)}
              className="text-lux-gray-600 hover:text-lux-gray-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        );
      
      case 'failed':
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetryJob(job.id)}
            >
              Retry
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemoveJob(job.id)}
              className="text-lux-gray-600 hover:text-lux-gray-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        );
      
      case 'cancelled':
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemoveJob(job.id)}
            className="text-lux-gray-600 hover:text-lux-gray-700"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        );
      
      default:
        return null;
    }
  };

  const renderJobDetails = (job: ExportJob) => {
    if (!expandedJobs.has(job.id)) return null;

    return (
      <div className="mt-3 p-3 bg-lux-blue-50 rounded-lg border border-lux-blue-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-lux-blue-900">Created:</span>
            <span className="ml-2 text-lux-blue-700">
              {job.createdAt.toLocaleTimeString()}
            </span>
          </div>
          {job.startedAt && (
            <div>
              <span className="font-medium text-lux-blue-900">Started:</span>
              <span className="ml-2 text-lux-blue-700">
                {job.startedAt.toLocaleTimeString()}
              </span>
            </div>
          )}
          {job.completedAt && (
            <div>
              <span className="font-medium text-lux-blue-900">Completed:</span>
              <span className="ml-2 text-lux-blue-700">
                {job.completedAt.toLocaleTimeString()}
              </span>
            </div>
          )}
          {job.fileSize && (
            <div>
              <span className="font-medium text-lux-blue-900">File Size:</span>
              <span className="ml-2 text-lux-blue-700">
                {formatFileSize(job.fileSize)}
              </span>
            </div>
          )}
          {job.startedAt && !job.completedAt && (
            <div>
              <span className="font-medium text-lux-blue-900">Duration:</span>
              <span className="ml-2 text-lux-blue-700">
                {formatDuration(job.startedAt)}
              </span>
            </div>
          )}
          {job.estimatedTimeRemaining && job.status === 'processing' && (
            <div>
              <span className="font-medium text-lux-blue-900">ETA:</span>
              <span className="ml-2 text-lux-blue-700">
                {formatTimeRemaining(job.estimatedTimeRemaining)}
              </span>
            </div>
          )}
        </div>
        {job.errorMessage && (
          <div className="mt-3 p-2 bg-lux-red-50 border border-lux-red-200 rounded text-sm text-lux-red-800">
            <span className="font-medium">Error:</span> {job.errorMessage}
          </div>
        )}
      </div>
    );
  };

  const renderJobList = (jobList: ExportJob[], title: string) => {
    if (jobList.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-lux-blue-900">{title}</h3>
          {title === 'Completed Exports' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCompletedJobs(!showCompletedJobs)}
            >
              {showCompletedJobs ? 'Hide' : 'Show'} ({completedJobs.length})
            </Button>
          )}
        </div>
        
        {title === 'Completed Exports' && !showCompletedJobs ? null : (
          <div className="space-y-3">
            {jobList.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-lux-cream-300 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {getFormatIcon(job.format)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-lux-blue-900">{job.name}</span>
                        <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(job.status)}
                            <span>{job.status}</span>
                          </div>
                        </Badge>
                        <span className="text-sm text-lux-blue-600 uppercase">
                          {job.format}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      {job.status === 'processing' && (
                        <div className="w-full bg-lux-cream-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-lux-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-lux-blue-700">
                        <span>{job.progress}% complete</span>
                        {job.fileSize && <span>{formatFileSize(job.fileSize)}</span>}
                        {job.estimatedTimeRemaining && job.status === 'processing' && (
                          <span>ETA: {formatTimeRemaining(job.estimatedTimeRemaining)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {renderJobActions(job)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleJobExpansion(job.id)}
                    >
                      {expandedJobs.has(job.id) ? '−' : '+'}
                    </Button>
                  </div>
                </div>
                
                {renderJobDetails(job)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (jobs.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Download className="w-12 h-12 text-lux-blue-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-lux-blue-900 mb-2">No Export Jobs</h3>
        <p className="text-lux-blue-700">Start an export to see progress here.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {renderJobList(activeJobs, 'Active Exports')}
      {renderJobList(completedJobs, 'Completed Exports')}
    </div>
  );
};

export default ExportProgress;
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Download, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Pause, 
  Play, 
  Loader2,
  FileImage,
  FileText,
  File,
  Trash2
} from 'lucide-react';

export interface ExportJob {
  id: string;
  name: string;
  format: 'png' | 'jpg' | 'pdf' | 'svg';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused' | 'cancelled';
  progress: number; // 0-100
  fileSize?: number;
  downloadUrl?: string;
  errorMessage?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number; // seconds
}

export interface ExportProgressProps {
  jobs: ExportJob[];
  onCancelJob: (jobId: string) => void;
  onPauseJob: (jobId: string) => void;
  onResumeJob: (jobId: string) => void;
  onRetryJob: (jobId: string) => void;
  onDownloadJob: (jobId: string) => void;
  onRemoveJob: (jobId: string) => void;
  className?: string;
}

const getFormatIcon = (format: string) => {
  switch (format) {
    case 'png':
    case 'jpg':
      return <FileImage className="w-4 h-4" />;
    case 'pdf':
      return <FileText className="w-4 h-4" />;
    case 'svg':
      return <File className="w-4 h-4" />;
    default:
      return <File className="w-4 h-4" />;
  }
};

const getStatusColor = (status: ExportJob['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-lux-orange-100 text-lux-orange-800 border-lux-orange-200';
    case 'processing':
      return 'bg-lux-blue-100 text-lux-blue-800 border-lux-blue-200';
    case 'completed':
      return 'bg-lux-green-100 text-lux-green-800 border-lux-green-200';
    case 'failed':
      return 'bg-lux-red-100 text-lux-red-800 border-lux-red-200';
    case 'paused':
      return 'bg-lux-gray-100 text-lux-gray-800 border-lux-gray-200';
    case 'cancelled':
      return 'bg-lux-gray-100 text-lux-gray-800 border-lux-gray-200';
    default:
      return 'bg-lux-gray-100 text-lux-gray-800 border-lux-gray-200';
  }
};

const getStatusIcon = (status: ExportJob['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4" />;
    case 'processing':
      return <Loader2 className="w-4 h-4 animate-spin" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'failed':
      return <AlertCircle className="w-4 h-4" />;
    case 'paused':
      return <Pause className="w-4 h-4" />;
    case 'cancelled':
      return <X className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'Unknown';
  
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  } else {
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  }
};

const formatTimeRemaining = (seconds?: number): string => {
  if (!seconds) return '';
  
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m`;
  } else {
    return `${Math.round(seconds / 3600)}h`;
  }
};

const formatDuration = (startedAt?: Date, completedAt?: Date): string => {
  if (!startedAt) return '';
  
  const end = completedAt || new Date();
  const duration = end.getTime() - startedAt.getTime();
  const seconds = Math.floor(duration / 1000);
  
  return formatTimeRemaining(seconds);
};

export const ExportProgress: React.FC<ExportProgressProps> = ({
  jobs,
  onCancelJob,
  onPauseJob,
  onResumeJob,
  onRetryJob,
  onDownloadJob,
  onRemoveJob,
  className = ''
}) => {
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [showCompletedJobs, setShowCompletedJobs] = useState(false);

  const activeJobs = jobs.filter(job => 
    ['pending', 'processing', 'paused'].includes(job.status)
  );
  
  const completedJobs = jobs.filter(job => 
    ['completed', 'failed', 'cancelled'].includes(job.status)
  );

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const renderJobActions = (job: ExportJob) => {
    switch (job.status) {
      case 'pending':
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancelJob(job.id)}
            className="text-lux-red-600 hover:text-lux-red-700"
          >
            Cancel
          </Button>
        );
      
      case 'processing':
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPauseJob(job.id)}
            >
              <Pause className="w-3 h-3 mr-1" />
              Pause
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancelJob(job.id)}
              className="text-lux-red-600 hover:text-lux-red-700"
            >
              Cancel
            </Button>
          </div>
        );
      
      case 'paused':
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResumeJob(job.id)}
            >
              <Play className="w-3 h-3 mr-1" />
              Resume
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancelJob(job.id)}
              className="text-lux-red-600 hover:text-lux-red-700"
            >
              Cancel
            </Button>
          </div>
        );
      
      case 'completed':
        return (
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => onDownloadJob(job.id)}
              className="bg-lux-blue-600 hover:bg-lux-blue-700"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemoveJob(job.id)}
              className="text-lux-gray-600 hover:text-lux-gray-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        );
      
      case 'failed':
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetryJob(job.id)}
            >
              Retry
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemoveJob(job.id)}
              className="text-lux-gray-600 hover:text-lux-gray-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        );
      
      case 'cancelled':
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemoveJob(job.id)}
            className="text-lux-gray-600 hover:text-lux-gray-700"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        );
      
      default:
        return null;
    }
  };

  const renderJobDetails = (job: ExportJob) => {
    if (!expandedJobs.has(job.id)) return null;

    return (
      <div className="mt-3 p-3 bg-lux-blue-50 rounded-lg border border-lux-blue-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-lux-blue-900">Created:</span>
            <span className="ml-2 text-lux-blue-700">
              {job.createdAt.toLocaleTimeString()}
            </span>
          </div>
          {job.startedAt && (
            <div>
              <span className="font-medium text-lux-blue-900">Started:</span>
              <span className="ml-2 text-lux-blue-700">
                {job.startedAt.toLocaleTimeString()}
              </span>
            </div>
          )}
          {job.completedAt && (
            <div>
              <span className="font-medium text-lux-blue-900">Completed:</span>
              <span className="ml-2 text-lux-blue-700">
                {job.completedAt.toLocaleTimeString()}
              </span>
            </div>
          )}
          {job.fileSize && (
            <div>
              <span className="font-medium text-lux-blue-900">File Size:</span>
              <span className="ml-2 text-lux-blue-700">
                {formatFileSize(job.fileSize)}
              </span>
            </div>
          )}
          {job.startedAt && !job.completedAt && (
            <div>
              <span className="font-medium text-lux-blue-900">Duration:</span>
              <span className="ml-2 text-lux-blue-700">
                {formatDuration(job.startedAt)}
              </span>
            </div>
          )}
          {job.estimatedTimeRemaining && job.status === 'processing' && (
            <div>
              <span className="font-medium text-lux-blue-900">ETA:</span>
              <span className="ml-2 text-lux-blue-700">
                {formatTimeRemaining(job.estimatedTimeRemaining)}
              </span>
            </div>
          )}
        </div>
        {job.errorMessage && (
          <div className="mt-3 p-2 bg-lux-red-50 border border-lux-red-200 rounded text-sm text-lux-red-800">
            <span className="font-medium">Error:</span> {job.errorMessage}
          </div>
        )}
      </div>
    );
  };

  const renderJobList = (jobList: ExportJob[], title: string) => {
    if (jobList.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-lux-blue-900">{title}</h3>
          {title === 'Completed Exports' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCompletedJobs(!showCompletedJobs)}
            >
              {showCompletedJobs ? 'Hide' : 'Show'} ({completedJobs.length})
            </Button>
          )}
        </div>
        
        {title === 'Completed Exports' && !showCompletedJobs ? null : (
          <div className="space-y-3">
            {jobList.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-lux-cream-300 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {getFormatIcon(job.format)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-lux-blue-900">{job.name}</span>
                        <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(job.status)}
                            <span>{job.status}</span>
                          </div>
                        </Badge>
                        <span className="text-sm text-lux-blue-600 uppercase">
                          {job.format}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      {job.status === 'processing' && (
                        <div className="w-full bg-lux-cream-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-lux-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-lux-blue-700">
                        <span>{job.progress}% complete</span>
                        {job.fileSize && <span>{formatFileSize(job.fileSize)}</span>}
                        {job.estimatedTimeRemaining && job.status === 'processing' && (
                          <span>ETA: {formatTimeRemaining(job.estimatedTimeRemaining)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {renderJobActions(job)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleJobExpansion(job.id)}
                    >
                      {expandedJobs.has(job.id) ? '−' : '+'}
                    </Button>
                  </div>
                </div>
                
                {renderJobDetails(job)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (jobs.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Download className="w-12 h-12 text-lux-blue-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-lux-blue-900 mb-2">No Export Jobs</h3>
        <p className="text-lux-blue-700">Start an export to see progress here.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {renderJobList(activeJobs, 'Active Exports')}
      {renderJobList(completedJobs, 'Completed Exports')}
    </div>
  );
};

export default ExportProgress;


