import React from 'react';
import { Download, FileText, File, AlertTriangle, Share2, Eye } from 'lucide-react';
import { FileItem } from '../../../services/fileService';
import { fileService } from '../../../services/fileService';
import { toast } from 'react-hot-toast';
import '../../../styles/tenantModals.css';

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

function fileKindLabel(file: FileItem): string {
  if (isPdf(file.type, file.url || '')) return 'PDF Document';
  if (isImage(file.type, file.url || '')) return 'Image';
  return file.type || 'Document';
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ isOpen, onClose, file, onDownload }) => {
  if (!isOpen || !file) return null;

  const url = file.url || '';
  const type = file.type || '';
  const canPreview = isDataUrl(url);
  const isImg = isImage(type, url);
  const isPdfFile = isPdf(type, url);
  const ready = Boolean(url);

  const handleShare = async () => {
    if (url && url.startsWith('http')) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Document link copied to clipboard');
      } catch {
        toast.error('Could not copy a share link for this file');
      }
      return;
    }
    toast.error('This file can be downloaded, but it does not have a shareable link.');
  };

  const renderPreview = () => {
    if (canPreview && isImg) {
      return <img src={url} alt={file.name} className="tn-drawer-preview-img" />;
    }
    if (canPreview && isPdfFile) {
      return <embed src={url} type="application/pdf" className="tn-drawer-preview-embed" title={file.name} />;
    }
    if (url.startsWith('http')) {
      return (
        <div className="tn-drawer-preview-empty">
          <AlertTriangle className="w-10 h-10" />
          <p>Secure Document Preview Available</p>
          <span>This file is stored in the vault. Download it to inspect the original.</span>
        </div>
      );
    }
    return (
      <div className="tn-drawer-preview-empty">
        <FileText className="w-10 h-10" />
        <p>Secure Document Preview Available</p>
        <span>Encrypted vault copy. Use download to view the original file.</span>
      </div>
    );
  };

  return (
    <div className="tn-drawer-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="tn-drawer" role="dialog" aria-labelledby="tn-drawer-title">
        <div className="tn-drawer-head">
          <div className="tn-drawer-head-main">
            <span className={`tn-drawer-icon ${isImg ? 'img' : isPdfFile ? 'pdf' : 'doc'}`}>
              {isImg ? <File className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </span>
            <div>
              <h2 id="tn-drawer-title">{file.name}</h2>
              <p>{fileKindLabel(file)} · {fileService.formatFileSize(file.size)} · Uploaded {file.uploadDate}</p>
            </div>
          </div>
          <button type="button" className="tn-modal-x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="tn-drawer-body">
          <div className={`tn-drawer-status ${ready ? 'ok' : 'wait'}`}>
            <div>
              <p>{ready ? 'Document stored in vault' : 'Preview unavailable'}</p>
              <span>{ready ? 'Ready to download or inspect from this record.' : 'No file payload is attached to this record.'}</span>
            </div>
            <em>{ready ? 'On file' : 'Incomplete'}</em>
          </div>

          <div className="tn-drawer-preview">
            {renderPreview()}
            {ready && (
              <button type="button" className="tn-drawer-inspect" onClick={() => onDownload(file)}>
                <Eye className="w-3.5 h-3.5" />
                Inspect Full Screen
              </button>
            )}
          </div>

          <h4>Document details</h4>
          <div className="tn-drawer-meta">
            <div><span>File name</span><strong>{file.name}</strong></div>
            <div><span>Category</span><strong>{file.category}</strong></div>
            <div><span>Type</span><strong>{fileKindLabel(file)}</strong></div>
            <div><span>Size</span><strong>{fileService.formatFileSize(file.size)}</strong></div>
            <div><span>Uploaded</span><strong>{file.uploadDate}</strong></div>
          </div>

          <h4>Document audit trail</h4>
          <div className="tn-drawer-trail">
            <div>
              <p>Document Uploaded</p>
              <span>{file.uploadDate} · File vault</span>
            </div>
          </div>
        </div>

        <div className="tn-drawer-foot">
          <button type="button" className="tn-drawer-secondary" onClick={() => onDownload(file)}>
            <Download className="w-4 h-4" />
            Download File
          </button>
          <button type="button" className="tn-drawer-primary" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
            Share Document
          </button>
        </div>
      </aside>
    </div>
  );
};

export default FilePreviewModal;
