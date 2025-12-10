import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Calendar,
  AlertCircle,
  Download,
  Eye,
  Trash2,
  Folder,
  Plus,
  X
} from 'lucide-react';
import { DocumentUploadFormModal } from './DocumentUploadFormModal';

export interface HomeDocument {
  id: string;
  name: string;
  category: 'warranty' | 'manual' | 'receipt' | 'permit' | 'insurance' | 'improvement' | 'other';
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  expiryDate?: string;
  description?: string;
  tags?: string[];
  relatedTo?: {
    type: 'maintenance' | 'project' | 'appliance';
    id: string;
    name: string;
  };
}

interface DocumentationHubProps {
  onBack: () => void;
  onUploadDocument: () => void;
  onViewDocument: (document: HomeDocument) => void;
  onDeleteDocument: (documentId: string) => void;
}

export function DocumentationHub({
  onBack,
  onUploadDocument,
  onViewDocument,
  onDeleteDocument,
}: DocumentationHubProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expiryFilter, setExpiryFilter] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<HomeDocument | null>(null);

  // Mock data - will be replaced with Firebase data
  const [documents] = useState<HomeDocument[]>([
    {
      id: '1',
      name: 'HVAC Warranty.pdf',
      category: 'warranty',
      fileUrl: '#',
      fileType: 'application/pdf',
      fileSize: 245000,
      uploadDate: '2024-01-15',
      expiryDate: '2026-01-15',
      description: '5-year warranty for HVAC system',
      relatedTo: {
        type: 'appliance',
        id: 'a1',
        name: 'HVAC System',
      },
    },
    {
      id: '2',
      name: 'Kitchen Renovation Permit.pdf',
      category: 'permit',
      fileUrl: '#',
      fileType: 'application/pdf',
      fileSize: 180000,
      uploadDate: '2024-06-10',
      expiryDate: '2025-06-10',
      description: 'Building permit for kitchen renovation',
      relatedTo: {
        type: 'project',
        id: 'p1',
        name: 'Kitchen Renovation',
      },
    },
    {
      id: '3',
      name: 'Home Insurance Policy.pdf',
      category: 'insurance',
      fileUrl: '#',
      fileType: 'application/pdf',
      fileSize: 320000,
      uploadDate: '2024-11-01',
      expiryDate: '2025-11-01',
      description: 'Annual home insurance policy',
    },
    {
      id: '4',
      name: 'Washing Machine Manual.pdf',
      category: 'manual',
      fileUrl: '#',
      fileType: 'application/pdf',
      fileSize: 150000,
      uploadDate: '2024-03-20',
      description: 'User manual for washing machine',
      relatedTo: {
        type: 'appliance',
        id: 'a2',
        name: 'Washing Machine',
      },
    },
    {
      id: '5',
      name: 'Plumber Receipt - Dec 2024.pdf',
      category: 'receipt',
      fileUrl: '#',
      fileType: 'application/pdf',
      fileSize: 95000,
      uploadDate: '2024-12-05',
      description: 'Receipt for plumbing repair',
      relatedTo: {
        type: 'maintenance',
        id: 'm1',
        name: 'Water Leak Repair',
      },
    },
  ]);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'warranty', label: 'Warranties' },
    { value: 'manual', label: 'Manuals' },
    { value: 'receipt', label: 'Receipts' },
    { value: 'permit', label: 'Permits & Certificates' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'improvement', label: 'Home Improvements' },
    { value: 'other', label: 'Other' },
  ];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    
    let matchesExpiry = true;
    if (expiryFilter === 'expiring') {
      if (!doc.expiryDate) matchesExpiry = false;
      else {
        const daysUntilExpiry = Math.ceil(
          (new Date(doc.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        matchesExpiry = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }
    } else if (expiryFilter === 'expired') {
      if (!doc.expiryDate) matchesExpiry = false;
      else matchesExpiry = new Date(doc.expiryDate) < new Date();
    }

    let matchesTab = true;
    if (selectedTab === 'expiring') {
      if (!doc.expiryDate) matchesTab = false;
      else {
        const daysUntilExpiry = Math.ceil(
          (new Date(doc.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        matchesTab = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }
    } else if (selectedTab === 'expired') {
      if (!doc.expiryDate) matchesTab = false;
      else matchesTab = new Date(doc.expiryDate) < new Date();
    }

    return matchesSearch && matchesCategory && matchesExpiry && matchesTab;
  });

  const getCategoryColor = (category: HomeDocument['category']) => {
    const colors: Record<HomeDocument['category'], string> = {
      warranty: 'bg-blue-50 text-blue-700 border-blue-200',
      manual: 'bg-green-50 text-green-700 border-green-200',
      receipt: 'bg-purple-50 text-purple-700 border-purple-200',
      permit: 'bg-orange-50 text-orange-700 border-orange-200',
      insurance: 'bg-red-50 text-red-700 border-red-200',
      improvement: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      other: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return colors[category];
  };

  const getCategoryLabel = (category: HomeDocument['category']) => {
    const labels: Record<HomeDocument['category'], string> = {
      warranty: 'Warranty',
      manual: 'Manual',
      receipt: 'Receipt',
      permit: 'Permit',
      insurance: 'Insurance',
      improvement: 'Improvement',
      other: 'Other',
    };
    return labels[category];
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const expiringCount = documents.filter(doc => isExpiringSoon(doc.expiryDate)).length;
  const expiredCount = documents.filter(doc => isExpired(doc.expiryDate)).length;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 mb-3 flex items-center gap-2 transition-colors group"
          >
            <X className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-3xl font-bold text-[#374957] mb-2">Documentation Hub</h1>
          <p className="text-gray-600">Store and organize all your home documents</p>
        </div>
        <button
          onClick={() => {
            setEditingDocument(null);
            setIsUploadModalOpen(true);
          }}
          className="bg-[#DC5F12] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#c54f0f] transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setSelectedTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'all'
                ? 'border-[#DC5F12] text-[#DC5F12]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Documents
          </button>
          <button
            onClick={() => setSelectedTab('expiring')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              selectedTab === 'expiring'
                ? 'border-[#DC5F12] text-[#DC5F12]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Expiring Soon
            {expiringCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full">
                {expiringCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setSelectedTab('expired')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              selectedTab === 'expired'
                ? 'border-[#DC5F12] text-[#DC5F12]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Expired
            {expiredCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                {expiredCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent transition-all bg-white"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-2">No documents found</p>
              <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or upload a new document</p>
              <button
                onClick={onUploadDocument}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2 mx-auto shadow-sm"
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
            </div>
          </div>
        ) : (
          filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => onViewDocument(doc)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDocument(doc);
                    }}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 hover:text-blue-700"
                    aria-label="View document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDocument(doc.id);
                    }}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 hover:text-red-700"
                    aria-label="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-[#374957] mb-3 truncate group-hover:text-[#DC5F12] transition-colors">{doc.name}</h3>
              
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getCategoryColor(doc.category)}`}>
                  {getCategoryLabel(doc.category)}
                </span>
                {isExpiringSoon(doc.expiryDate) && (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Expiring
                  </span>
                )}
                {isExpired(doc.expiryDate) && (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Expired
                  </span>
                )}
              </div>

              {doc.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description}</p>
              )}

              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span>Size: {formatFileSize(doc.fileSize)}</span>
                  <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                </div>
                {doc.expiryDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {isExpired(doc.expiryDate) ? 'Expired: ' : 'Expires: '}
                      {new Date(doc.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {doc.relatedTo && (
                  <div className="text-xs text-blue-600">
                    Related to: {doc.relatedTo.name}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Document Upload Form Modal */}
      <DocumentUploadFormModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setEditingDocument(null);
        }}
        onSubmit={(documentData) => {
          onUploadDocument();
          // TODO: Upload document with documentData
          console.log('Upload document:', documentData);
        }}
        initialDocument={editingDocument}
      />
    </div>
  );
}
