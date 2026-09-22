import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, File, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import '../../../styles/tenantModals.css';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[], category: string) => Promise<void>;
}

const CATEGORIES = [
  { value: 'Identity', label: 'Identity (Passports, National ID, Driving Licence)' },
  { value: 'Employment', label: 'Employment (Payslips, P60, Employment Contracts)' },
  { value: 'Financial', label: 'Financial (Bank Statements, Proof of Funds)' },
  { value: 'Residential', label: 'Residential (Utility Bills, Landlord References, Council Tax)' },
  { value: 'Guarantor', label: 'Guarantor (Deed of Guarantee, Guarantor Proofs)' },
  { value: 'Contracts', label: 'Contracts (AST, Lease, Signed Agreements)' },
];

const FileUploadModal: React.FC<FileUploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('Identity');
  const [notes, setNotes] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'pending' | 'uploading' | 'success' | 'error'>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ownerLabel = user?.name
    ? `${user.name}${user.email ? ` (${user.email})` : ''}`
    : user?.email || 'Current tenant';

  const maxFileSize = 25 * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `${file.name} is too large. Maximum size is 25 MB.`;
    }
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    if (!allowed.includes(fileExtension)) {
      return `${file.name} must be a PDF, PNG, or JPG.`;
    }
    return null;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleFiles = (files: File[]) => {
    const newFiles: File[] = [];
    const newErrors: string[] = [];
    files.forEach((file) => {
      const error = validateFile(file);
      if (error) newErrors.push(error);
      else newFiles.push(file);
    });
    setErrors(newErrors);
    if (newFiles.length > 0) setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(Array.from(e.target.files));
  };

  const resetModal = () => {
    setSelectedFiles([]);
    setErrors([]);
    setUploadStatus({});
    setUploading(false);
    setNotes('');
    setSelectedCategory('Identity');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setErrors([]);
    const nextStatus: Record<string, 'pending' | 'uploading' | 'success' | 'error'> = {};
    selectedFiles.forEach((file) => { nextStatus[file.name] = 'uploading'; });
    setUploadStatus(nextStatus);
    try {
      await onUpload(selectedFiles, selectedCategory);
      const successStatus: Record<string, 'success'> = {};
      selectedFiles.forEach((file) => { successStatus[file.name] = 'success'; });
      setUploadStatus(successStatus);
      setTimeout(() => {
        resetModal();
        onClose();
      }, 800);
    } catch (error) {
      setErrors([`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="tn-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="tn-modal tn-modal-lg" role="dialog" aria-labelledby="tn-upload-title">
        <div className="tn-modal-head">
          <div>
            <h3 id="tn-upload-title">Upload Document</h3>
            <p>Add documents directly to your secure file vault.</p>
          </div>
          <button type="button" className="tn-modal-x" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        <div className="tn-modal-body">
          <label className="tn-modal-label">
            Associated Client / Tenant
            <input type="text" value={ownerLabel} readOnly />
          </label>

          <label className="tn-modal-label">
            Category
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </label>

          <div className="tn-modal-label">
            <span>Select File (PDF, PNG, JPG)</span>
            <button
              type="button"
              className={`tn-modal-drop${dragActive ? ' is-over' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-8 h-8" />
              <strong>Click to choose a file or drag here</strong>
              <span>Maximum file size: 25 MB</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {selectedFiles.length > 0 && (
            <ul className="tn-modal-files">
              {selectedFiles.map((file, index) => (
                <li key={`${file.name}-${index}`}>
                  <File className="w-4 h-4" />
                  <div>
                    <p>{file.name}</p>
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                  {uploadStatus[file.name] === 'uploading' && <Loader className="w-4 h-4 animate-spin" />}
                  {uploadStatus[file.name] === 'success' && <CheckCircle className="w-4 h-4 tn-ok" />}
                  {!uploading && (
                    <button type="button" className="tn-modal-x sm" onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== index))} aria-label="Remove file">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <label className="tn-modal-label">
            Notes / Remarks (Optional)
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified against payroll records"
            />
          </label>

          {errors.length > 0 && (
            <div className="tn-modal-errors">
              <AlertCircle className="w-4 h-4" />
              <ul>
                {errors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="tn-modal-foot">
          <button type="button" className="tn-modal-cancel" onClick={handleClose} disabled={uploading}>Cancel</button>
          <button
            type="button"
            className="tn-modal-primary"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload & Secure'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;
