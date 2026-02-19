import React, { useState } from 'react';
import { X, Upload, FileText, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (document: {
    name: string;
    type: string;
    file: File;
    expiryDate?: string;
  }) => void;
}

export function DocumentUploadModal({ isOpen, onClose, onUpload }: DocumentUploadModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    expiryDate: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const documentTypes = [
    { value: 'tenancy-agreement', label: 'Tenancy Agreement' },
    { value: 'deposit-certificate', label: 'Deposit Protection Certificate' },
    { value: 'right-to-rent', label: 'Right to Rent Check' },
    { value: 'id-document', label: 'ID Document' },
    { value: 'employment-reference', label: 'Employment Reference' },
    { value: 'bank-statement', label: 'Bank Statement' },
    { value: 'other', label: 'Other Document' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill document name if not already set
      if (!formData.name) {
        setFormData(prev => ({
          ...prev,
          name: file.name.replace(/\.[^/.]+$/, "") // Remove file extension
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !formData.name || !formData.type) {
      return;
    }

    setIsUploading(true);
    
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onUpload({
        name: formData.name,
        type: formData.type,
        file: selectedFile,
        expiryDate: formData.expiryDate || undefined
      });
      
      // Reset form
      setFormData({ name: '', type: '', expiryDate: '' });
      setSelectedFile(null);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', type: '', expiryDate: '' });
    setSelectedFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '1rem'
    }}>
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
          <h2 style={{
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
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#F3F4F6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E5E7EB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F3F4F6';
            }}
          >
            <X size={16} color="#6B7280" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* File Upload */}
          <div>
            <Label style={{ color: '#374957', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
              Select Document
            </Label>
            <div style={{
              border: '2px dashed #D1D5DB',
              borderRadius: '0.5rem',
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: '#F9FAFB',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('file-input')?.click()}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#DC5F12';
              e.currentTarget.style.backgroundColor = '#FEF7F0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#D1D5DB';
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <Upload size={32} color="#DC5F12" style={{ marginBottom: '0.5rem' }} />
              <p style={{ color: '#6B7280', margin: '0 0 0.25rem 0' }}>
                {selectedFile ? selectedFile.name : 'Click to select file'}
              </p>
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: 0 }}>
                PDF, DOC, DOCX, JPG, PNG (Max 10MB)
              </p>
            </div>
          </div>

          {/* Document Name */}
          <div>
            <Label htmlFor="name" style={{ color: '#374957', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
              Document Name
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter document name"
              required
              style={{
                border: '1px solid #D1D5DB',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Document Type */}
          <div>
            <Label htmlFor="type" style={{ color: '#374957', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
              Document Type
            </Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger style={{
                border: '1px solid #D1D5DB',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '1rem'
              }}>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
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
            <Label htmlFor="expiry" style={{ color: '#374957', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
              Expiry Date (Optional)
            </Label>
            <Input
              id="expiry"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
              style={{
                border: '1px solid #D1D5DB',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            marginTop: '1rem'
          }}>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #D1D5DB',
                borderRadius: '0.5rem',
                backgroundColor: 'white',
                color: '#374957',
                cursor: 'pointer'
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || !formData.name || !formData.type || isUploading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#DC5F12',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                opacity: (!selectedFile || !formData.name || !formData.type || isUploading) ? 0.5 : 1
              }}
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

