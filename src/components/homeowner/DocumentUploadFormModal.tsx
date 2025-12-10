import React, { useState, useEffect } from 'react';
import { FileText, X } from 'lucide-react';
import { HomeDocument } from './DocumentationHub';

interface DocumentUploadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (document: Omit<HomeDocument, 'id' | 'fileUrl' | 'fileType' | 'fileSize' | 'uploadDate'> & { file: File }) => void;
  initialDocument?: HomeDocument | null;
}

export function DocumentUploadFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialDocument,
}: DocumentUploadFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'other' as HomeDocument['category'],
    expiryDate: '',
    description: '',
    tags: '',
    relatedToType: '' as 'maintenance' | 'project' | 'appliance' | '',
    relatedToId: '',
    relatedToName: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (initialDocument) {
      setFormData({
        name: initialDocument.name,
        category: initialDocument.category,
        expiryDate: initialDocument.expiryDate || '',
        description: initialDocument.description || '',
        tags: initialDocument.tags?.join(', ') || '',
        relatedToType: initialDocument.relatedTo?.type || '',
        relatedToId: initialDocument.relatedTo?.id || '',
        relatedToName: initialDocument.relatedTo?.name || '',
      });
    } else {
      setFormData({
        name: '',
        category: 'other',
        expiryDate: '',
        description: '',
        tags: '',
        relatedToType: '',
        relatedToId: '',
        relatedToName: '',
      });
      setSelectedFile(null);
    }
  }, [initialDocument, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.name) {
        setFormData({ ...formData, name: file.name });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!initialDocument && !selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    const document: Omit<HomeDocument, 'id' | 'fileUrl' | 'fileType' | 'fileSize' | 'uploadDate'> & { file: File } = {
      name: formData.name,
      category: formData.category,
      expiryDate: formData.expiryDate || undefined,
      description: formData.description || undefined,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      relatedTo: formData.relatedToType && formData.relatedToId ? {
        type: formData.relatedToType,
        id: formData.relatedToId,
        name: formData.relatedToName,
      } : undefined,
      file: selectedFile!,
    };

    onSubmit(document);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 text-green-600 p-2 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-[#374957]">
              {initialDocument ? 'Edit Document' : 'Upload Document'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!initialDocument && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">File</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Document Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              placeholder="e.g., HVAC Warranty"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as HomeDocument['category'] })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
            >
              <option value="warranty">Warranty</option>
              <option value="manual">Manual</option>
              <option value="receipt">Receipt</option>
              <option value="permit">Permit & Certificate</option>
              <option value="insurance">Insurance</option>
              <option value="improvement">Home Improvement</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date (Optional)
            </label>
            <input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              placeholder="Add a description for this document..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              id="tags"
              type="text"
              placeholder="e.g., HVAC, warranty, 2024"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Related To (Optional)</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <select
                  value={formData.relatedToType}
                  onChange={(e) => setFormData({ ...formData, relatedToType: e.target.value as typeof formData.relatedToType })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
                >
                  <option value="">Type</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="project">Project</option>
                  <option value="appliance">Appliance</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="ID"
                  value={formData.relatedToId}
                  onChange={(e) => setFormData({ ...formData, relatedToId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.relatedToName}
                  onChange={(e) => setFormData({ ...formData, relatedToName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#DC5F12] hover:bg-[#c54f0f] text-white rounded-lg font-medium transition-colors"
            >
              {initialDocument ? 'Update Document' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
