import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when the user confirms — the parent performs the actual upload */
  onUpload: (document: {
    name: string;
    type: string;
    file: File;
    expiryDate?: string;
  }) => void;
  /** Set to true by the parent while upload is in flight */
  isUploading?: boolean;
  /** Error message surfaced by the parent if the upload fails */
  uploadError?: string | null;
}

export function DocumentUploadModal({ isOpen, onClose, onUpload, isUploading = false, uploadError = null }: DocumentUploadModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    expiryDate: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const documentTypes = [
    { value: 'tenancy-agreement', label: 'Tenancy Agreement' },
    { value: 'deposit-certificate', label: 'Deposit Protection Certificate' },
    { value: 'right-to-rent', label: 'Right to Rent Check' },
    { value: 'id-document', label: 'ID Document' },
    { value: 'employment-reference', label: 'Employment Reference' },
    { value: 'bank-statement', label: 'Bank Statement' },
    { value: 'other', label: 'Other Document' }
  ];

  const MAX_FILE_SIZE_MB = 10;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setLocalError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    setLocalError(null);
    setSelectedFile(file);
    // Auto-fill document name from filename if not already set
    if (!formData.name) {
      setFormData(prev => ({
        ...prev,
        name: file.name.replace(/\.[^/.]+$/, '')
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setLocalError('Please select a file to upload.');
      return;
    }
    if (!formData.name.trim()) {
      setLocalError('Please enter a document name.');
      return;
    }
    if (!formData.type) {
      setLocalError('Please select a document type.');
      return;
    }

    setLocalError(null);
    onUpload({
      name: formData.name.trim(),
      type: formData.type,
      file: selectedFile,
      expiryDate: formData.expiryDate || undefined
    });
  };

  const handleClose = () => {
    if (isUploading) return; // Prevent closing mid-upload
    setFormData({ name: '', type: '', expiryDate: '' });
    setSelectedFile(null);
    setLocalError(null);
    onClose();
  };

  // Reset form when modal is opened fresh (and upload completes successfully)
  const prevUploading = React.useRef(isUploading);
  React.useEffect(() => {
    if (prevUploading.current && !isUploading && !uploadError && isOpen) {
      // Upload just finished successfully — reset and close
      setFormData({ name: '', type: '', expiryDate: '' });
      setSelectedFile(null);
      setLocalError(null);
      onClose();
    }
    prevUploading.current = isUploading;
  }, [isUploading, uploadError, isOpen]);

  if (!isOpen) return null;

  const displayError = localError || uploadError;
  const isFormDisabled = isUploading;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-upload-title"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 120,
        padding: '1rem'
      }}
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h2 id="doc-upload-title" style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#374957',
            margin: 0,
            fontFamily: 'Archivo, sans-serif'
          }}>
            Upload Document
          </h2>
          <button
            onClick={handleClose}
            disabled={isFormDisabled}
            aria-label="Close upload dialog"
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#F3F4F6',
              cursor: isFormDisabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { if (!isFormDisabled) e.currentTarget.style.backgroundColor = '#E5E7EB'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
          >
            <X size={16} color="#6B7280" />
          </button>
        </div>

        {/* Error banner */}
        {displayError && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            color: '#B91C1C',
            fontSize: '0.875rem',
            fontFamily: 'Archivo, sans-serif'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{displayError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* File Upload */}
          <div>
            <Label style={{ color: '#374957', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
              Select Document <span style={{ color: '#DC2626' }}>*</span>
            </Label>
            <div
              style={{
                border: `2px dashed ${selectedFile ? '#10B981' : '#D1D5DB'}`,
                borderRadius: '0.5rem',
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: selectedFile ? '#F0FDF4' : '#F9FAFB',
                transition: 'all 0.2s',
                cursor: isFormDisabled ? 'not-allowed' : 'pointer',
                opacity: isFormDisabled ? 0.6 : 1
              }}
              onClick={() => !isFormDisabled && document.getElementById('file-input')?.click()}
              onMouseEnter={(e) => {
                if (!isFormDisabled && !selectedFile) {
                  e.currentTarget.style.borderColor = '#DC5F12';
                  e.currentTarget.style.backgroundColor = '#FEF7F0';
                }
              }}
              onMouseLeave={(e) => {
                if (!isFormDisabled && !selectedFile) {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                }
              }}
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={isFormDisabled}
                style={{ display: 'none' }}
              />
              <Upload size={32} color={selectedFile ? '#10B981' : '#DC5F12'} style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ color: selectedFile ? '#059669' : '#6B7280', margin: '0 0 0.25rem 0', fontFamily: 'Archivo, sans-serif', fontWeight: selectedFile ? 600 : 400 }}>
                {selectedFile ? selectedFile.name : 'Click to select file'}
              </p>
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: 0, fontFamily: 'Archivo, sans-serif' }}>
                PDF, DOC, DOCX, JPG, PNG (Max {MAX_FILE_SIZE_MB} MB)
              </p>
            </div>
          </div>

          {/* Document Name */}
          <div>
            <Label htmlFor="doc-name" style={{ color: '#374957', fontWeight: '500', marginBottom: '0.5rem', display: 'block', fontFamily: 'Archivo, sans-serif' }}>
              Document Name <span style={{ color: '#DC2626' }}>*</span>
            </Label>
            <Input
              id="doc-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter document name"
              required
              disabled={isFormDisabled}
              style={{
                border: '1px solid #D1D5DB',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '1rem',
                fontFamily: 'Archivo, sans-serif'
              }}
            />
          </div>

          {/* Document Type */}
          <div>
            <Label htmlFor="doc-type" style={{ color: '#374957', fontWeight: '500', marginBottom: '0.5rem', display: 'block', fontFamily: 'Archivo, sans-serif' }}>
              Document Type <span style={{ color: '#DC2626' }}>*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              disabled={isFormDisabled}
            >
              <SelectTrigger style={{
                border: '1px solid #D1D5DB',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '1rem',
                fontFamily: 'Archivo, sans-serif'
              }}>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent className="z-[130]">
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expiry Date (Optional) */}
          <div>
            <Label htmlFor="doc-expiry" style={{ color: '#374957', fontWeight: '500', marginBottom: '0.5rem', display: 'block', fontFamily: 'Archivo, sans-serif' }}>
              Expiry Date <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(Optional)</span>
            </Label>
            <Input
              id="doc-expiry"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
              disabled={isFormDisabled}
              style={{
                border: '1px solid #D1D5DB',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '1rem',
                fontFamily: 'Archivo, sans-serif'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isFormDisabled}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #D1D5DB',
                borderRadius: '0.5rem',
                backgroundColor: 'white',
                color: '#374957',
                fontFamily: 'Archivo, sans-serif',
                cursor: isFormDisabled ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isFormDisabled || !selectedFile || !formData.name.trim() || !formData.type}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#DC5F12',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontFamily: 'Archivo, sans-serif',
                cursor: (isFormDisabled || !selectedFile || !formData.name.trim() || !formData.type) ? 'not-allowed' : 'pointer',
                opacity: (isFormDisabled || !selectedFile || !formData.name.trim() || !formData.type) ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: '140px',
                justifyContent: 'center'
              }}
            >
              {isUploading ? (
                <>
                  <div style={{
                    width: '1rem', height: '1rem',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.75s linear infinite',
                    flexShrink: 0
                  }} />
                  Uploading…
                </>
              ) : (
                'Upload Document'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}