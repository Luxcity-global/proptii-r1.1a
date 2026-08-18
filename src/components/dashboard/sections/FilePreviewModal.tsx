import React from 'react';
import { X, Download, FileText, File, AlertTriangle } from 'lucide-react';
import { FileItem } from '../../../services/fileService';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
  onDownload: (file: FileItem) => void;
}

function isDataUrl(url: string): boolean {
  return url.startsWith('data:');
}

function isImage(type: string, url: string): boolean {
  if (type.startsWith('image/')) return true;
  const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
}

function isPdf(type: string, url: string): boolean {
  if (type === 'application/pdf') return true;
  const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase();
  return ext === 'pdf';
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ isOpen, onClose, file, onDownload }) => {
  if (!isOpen || !file) return null;

  const url = file.url || '';
  const type = file.type || '';
  const canPreview = isDataUrl(url);
  const isImg = isImage(type, url);
  const isPdfFile = isPdf(type, url);

  const renderContent = () => {
    // ── Base64 data URL — always safe to display inline ─────────────────────
    if (canPreview) {
      if (isImg) {
        return (
          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-xl min-h-[300px]">
            <img
              src={url}
              alt={file.name}
              className="max-w-full max-h-[60vh] object-contain rounded shadow"
            />
          </div>
        );
      }

      if (isPdfFile) {
        return (
          <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: '65vh' }}>
            <embed
              src={url}
              type="application/pdf"
              width="100%"
              height="100%"
              title={file.name}
            />
          </div>
        );
      }

      // Other file types with a dataUrl — offer download, can't render inline
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 bg-gray-50 rounded-xl min-h-[200px]">
          <File className="w-16 h-16 text-gray-400" />
          <p className="text-gray-600 text-sm text-center">
            This file type can't be previewed inline.
          </p>
          <button
            onClick={() => onDownload(file)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#136C9E] text-white rounded-xl text-sm font-medium hover:bg-[#0F5A82] transition-colors"
          >
            <Download className="w-4 h-4" />
            Download to view
          </button>
        </div>
      );
    }

    // ── External / Azure URL — do NOT fetch it (would cause the public access error)
    // Show a friendly message with a download option instead
    if (url.startsWith('http')) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 bg-amber-50 rounded-xl border border-amber-200 min-h-[200px]">
          <AlertTriangle className="w-12 h-12 text-amber-500" />
          <div className="text-center">
            <p className="font-semibold text-gray-800 mb-1">Preview unavailable</p>
            <p className="text-sm text-gray-500 max-w-xs">
              This file was uploaded to cloud storage and can't be previewed directly.
              Download the file to view it.
            </p>
          </div>
          <button
            onClick={() => onDownload(file)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#136C9E] text-white rounded-xl text-sm font-medium hover:bg-[#0F5A82] transition-colors"
          >
            <Download className="w-4 h-4" />
            Download file
          </button>
        </div>
      );
    }

    // ── No URL at all
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8 bg-gray-50 rounded-xl min-h-[200px]">
        <FileText className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500 text-sm">No preview available for this file.</p>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 text-[#136C9E] flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-sm">{file.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{file.category} · {file.uploadDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <button
              onClick={() => onDownload(file)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#136C9E] border border-[#136C9E] rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close preview"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
