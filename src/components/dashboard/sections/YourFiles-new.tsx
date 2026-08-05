import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Upload, Search, Filter, User, Briefcase, Home, DollarSign, File, Calendar, ChevronDown, Trash2, AlertCircle, Loader } from 'lucide-react';
import { fileService, FileItem } from '../../../services/fileService';
import { useAuth } from '../../../contexts/AuthContext';
import { firestoreService, ReferencingFormData } from '../../../services/firestoreService';
import { contractService, ContractTemplate } from '../../../services/contractService';
import { useIsMobile } from '../ui/use-mobile';
import FileUploadModal from './FileUploadModal';
import FilePreviewModal from './FilePreviewModal';

/**
 * Your Files section - fully functional file management
 */
const YourFiles: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedFilter, setSelectedFilter] = useState('All Files');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [referencingFiles, setReferencingFiles] = useState<FileItem[]>([]);
  const [contractFiles, setContractFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;
  const ACCENT_BLUE = '#136C9E';

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, [user?.id]);

  // Set up real-time subscription for contract files
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time subscription for contract files');
    const unsubscribe = contractService.subscribeToUserContractTemplates(
      user.id,
      (templates) => {
        console.log('Real-time contract files update:', templates);
        const contractFilesList: FileItem[] = templates.map((contract, index) => ({
          id: 100000 + index,
          name: contract.name,
          category: 'Contracts',
          type: contract.fileType,
          size: contract.fileSize,
          uploadDate: contract.uploadDate,
          url: contract.fileUrl || `data:${contract.fileType};base64,${contract.fileData}`,
          firestoreId: contract.id
        }));
        setContractFiles(contractFilesList);
        console.log(`✅ Real-time update: ${contractFilesList.length} contract files`);
      },
      (error) => {
        console.error('❌ Error in contract files subscription:', error);
      }
    );

    return () => {
      console.log('Cleaning up contract files subscription');
      unsubscribe();
    };
  }, [user?.id]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Set current user in fileService
      fileService.setCurrentUser(user?.id || null);
      
      // Load regular files from fileService (now includes user-specific files from Firestore)
      const loadedFiles = await fileService.getFiles();
      setFiles(loadedFiles);
      
      // Load referencing files from Firestore
      if (user?.id) {
        await loadReferencingFiles();
        await loadContractFiles();
      }
    } catch (err) {
      setError('Failed to load files');
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReferencingFiles = async () => {
    try {
      if (!user?.id) return;
      
      const propertyId = `general_${user.id}`;
      const result = await firestoreService.getReferencingForm(user.id, propertyId);
      
      if (result.success && result.data) {
        const referencingFilesList: FileItem[] = [];
        const formData = result.data.formData;
        
        // Extract files from each section
        const sections = [
          { section: 'identity', field: 'identityProof', category: 'Identity' },
          { section: 'employment', field: 'proofDocument', category: 'Employment' },
          { section: 'residential', field: 'proofDocument', category: 'Residential' },
          { section: 'financial', field: 'proofOfIncomeDocument', category: 'Financial' },
          { section: 'guarantor', field: 'identityDocument', category: 'Guarantor' }
        ];
        
        sections.forEach(({ section, field, category }) => {
          const sectionData = formData[section as keyof ReferencingFormData];
          if (sectionData && (sectionData as any)[field]) {
            const document = (sectionData as any)[field];
            if (document && document.name && document.dataUrl) {
              referencingFilesList.push({
                id: Date.now() + Math.random(), // Generate unique ID
                name: document.name,
                category,
                type: document.type || 'application/pdf',
                size: document.size || 0,
                uploadDate: new Date(document.lastModified || Date.now()).toLocaleDateString(),
                url: document.dataUrl // Use the actual dataUrl from Firestore
              });
            }
          }
        });
        
        setReferencingFiles(referencingFilesList);
      }
    } catch (error) {
      console.error('Error loading referencing files:', error);
    }
  };

  const loadContractFiles = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID available for loading contract files');
        return;
      }
      
      console.log('Loading contract files from Firestore for user:', user.id);
      const result = await contractService.getUserContractTemplates(user.id);
      
      console.log('Contract service result:', result);
      
      if (result.success && result.templates) {
        console.log('Found contract templates:', result.templates);
        const contractFilesList: FileItem[] = result.templates.map((contract, index) => ({
          id: 200000 + index, // Use unique numeric ID
          name: contract.name,
          category: 'Contracts',
          type: contract.fileType,
          size: contract.fileSize,
          uploadDate: contract.uploadDate,
          url: contract.fileUrl || `data:${contract.fileType};base64,${contract.fileData}`, // Create data URL from base64 or use Firebase URL
          firestoreId: contract.id // Store Firestore ID for operations
        }));
        
        console.log('Mapped contract files:', contractFilesList);
        setContractFiles(contractFilesList);
        console.log(`✅ Loaded ${contractFilesList.length} contract files from Firestore`);
      } else {
        console.log('No contract templates found or error:', result.error);
        setContractFiles([]);
      }
    } catch (error) {
      console.error('❌ Error loading contract files:', error);
      setContractFiles([]);
    }
  };

  const handleUpload = async (uploadFiles: File[], category: string) => {
    try {
      setUploading(true);
      setError(null);
      
      const results = await fileService.uploadFiles(uploadFiles, category);
      
      // Check if all uploads were successful
      const failedUploads = results.filter(r => !r.success);
      if (failedUploads.length > 0) {
        setError(`Failed to upload ${failedUploads.length} file(s)`);
      }
      
      // Reload files to show new uploads
      await loadFiles();
    } catch (err) {
      setError('Upload failed');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      await fileService.downloadFile(file);
    } catch (err) {
      setError('Download failed');
      console.error('Download error:', err);
    }
  };

  const handleDelete = async (fileId: number, firestoreId?: string) => {
    try {
      // Check if it's a contract file
      const contractFile = contractFiles.find(f => f.id === fileId);
      if (contractFile && contractFile.firestoreId) {
        // Delete from Firestore
        const result = await contractService.deleteContractTemplate(contractFile.firestoreId);
        if (result.success) {
          setContractFiles(prev => prev.filter(f => f.id !== fileId));
          setDeleteConfirm(null);
          console.log('Contract file deleted from Firestore');
        } else {
          setError(result.error || 'Delete failed');
        }
      } else {
        // Handle regular files
        const result = await fileService.deleteFile(fileId, firestoreId);
        if (result.success) {
          // Remove from local state immediately
          setFiles(prev => prev.filter(f => f.id !== fileId));
          setDeleteConfirm(null);
          
          // For legacy files (no firestoreId), we don't need to reload
          // For Firestore files, reload to ensure consistency
          if (firestoreId) {
            await loadFiles();
          }
        } else {
          setError(result.error || 'Delete failed');
        }
      }
    } catch (err) {
      setError('Delete failed');
      console.error('Delete error:', err);
    }
  };

  const handleView = (file: FileItem) => {
    setSelectedFile(file);
    setIsPreviewModalOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Identity':
        return <User className="w-4 h-4 text-gray-600" />;
      case 'Employment':
        return <Briefcase className="w-4 h-4 text-gray-600" />;
      case 'Residential':
        return <Home className="w-4 h-4 text-gray-600" />;
      case 'Financial':
        return <DollarSign className="w-4 h-4 text-gray-600" />;
      case 'Guarantor':
        return <User className="w-4 h-4 text-gray-600" />;
      case 'Contracts':
        return <FileText className="w-4 h-4 text-gray-600" />;
      default:
        return <File className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Identity':
        return 'text-blue-600';
      case 'Employment':
        return 'text-green-600';
      case 'Residential':
        return 'text-purple-600';
      case 'Financial':
        return 'text-yellow-600';
      case 'Guarantor':
        return 'text-orange-600';
      case 'Contracts':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const categories = ['All Files', 'Identity', 'Employment', 'Residential', 'Financial', 'Guarantor', 'Contracts'];

  // Get file type icon based on file extension
  const getFileTypeIcon = (fileName: string, fileType: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (fileType === 'application/pdf' || extension === 'pdf') {
      return <FileText className="w-4 h-4 text-red-600" />;
    } else if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <FileText className="w-4 h-4 text-blue-600" />;
    } else if (['doc', 'docx'].includes(extension || '')) {
      return <FileText className="w-4 h-4 text-blue-500" />;
    } else {
      return <File className="w-4 h-4 text-gray-600" />;
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    return fileService.formatFileSize(bytes);
  };

  // Combine regular files, referencing files, and contract files
  const allFiles = [...files, ...referencingFiles, ...contractFiles];

  // Filter files based on selected category and search query
  const filteredFiles = allFiles.filter(file => {
    const matchesCategory = selectedFilter === 'All Files' || file.category === selectedFilter;
    const matchesSearch = searchQuery === '' || 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination helpers
  const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, searchQuery, allFiles.length]);

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-100 rounded-lg p-4 mt-4">
        <div className="text-sm text-gray-600">
          Showing {filteredFiles.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredFiles.length)} of {filteredFiles.length} files
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center px-3 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronDown className="rotate-90 w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[36px] px-2 py-1.5 text-sm rounded-lg border ${
                      currentPage === page ? 'text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    style={currentPage === page ? { backgroundColor: ACCENT_BLUE, borderColor: ACCENT_BLUE } : {}}
                  >
                    {page}
                  </button>
                );
              }
              if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-2 text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center px-3 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronDown className="-rotate-90 w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    );
  };

  // Get file statistics
  const stats = fileService.getFileStats(filteredFiles);

  return (
    <div className="space-y-6 pb-8" style={{ fontFamily: 'Archivo, sans-serif' }}>
      {/* Header Section */}
      <div className="flex items-center justify-between mt-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#374957' }}>
            Your Files
          </h1>
          <p className="text-base" style={{ color: '#717182' }}>
            Complete your referencing to proceed with your tenancy application
          </p>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          disabled={uploading}
          className="px-12 py-3 text-white rounded-full text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
            border: '1px solid #DC5F12',
            minHeight: '3.5rem',
            minWidth: '180px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            if (!uploading) {
            e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B1A 0%, #DC5F12 100%)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 95, 18, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading) {
            e.currentTarget.style.background = 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            }
          }}
        >
          {uploading ? (
            <div className="flex items-center space-x-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Uploading...</span>
            </div>
          ) : (
            'Upload File'
          )}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Files Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Total Files</h3>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {loading ? <Loader className="w-6 h-6 animate-spin" /> : referencingFiles.length + contractFiles.length}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>All updated files</p>
          </div>
        </div>

        {/* Referencing Files Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Referencing Files</h3>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {loading ? <Loader className="w-6 h-6 animate-spin" /> : referencingFiles.length}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>Documents uploaded</p>
          </div>
        </div>

        {/* Contract Files Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Contract Files</h3>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {loading ? <Loader className="w-6 h-6 animate-spin" /> : contractFiles.length}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>Signed contracts</p>
          </div>
        </div>

        {/* Storage Used Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Storage Used</h3>
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {loading ? <Loader className="w-6 h-6 animate-spin" /> : formatFileSize(stats.totalSize)}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>of 100 MB</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-xl border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm" style={{ color: '#374957' }}>{selectedFilter}</span>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
            {isFilterOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedFilter(category);
                      setIsFilterOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    style={{ color: '#374957' }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {!isMobile && (
          <>
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: '#E7F2FF' }}>
              <div className="grid grid-cols-6 gap-4 text-sm font-medium text-black">
                <div>File Name</div>
                <div>Category</div>
                <div>Type</div>
                <div>Size</div>
                <div>Uploaded At</div>
                <div></div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="px-6 py-8 text-center">
                  <Loader className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">Loading files...</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No files found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchQuery || selectedFilter !== 'All Files' 
                      ? 'Try adjusting your search or filter' 
                      : 'Upload your first file to get started'
                    }
                  </p>
                </div>
              ) : (
                paginatedFiles.map((file, index) => (
                  <div key={file.id} className={`px-6 py-4 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <div className="grid grid-cols-6 gap-4 items-center">
                      {/* File Name */}
                      <div className="flex items-center gap-3">
                        {getFileTypeIcon(file.name, file.type)}
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </span>
                      </div>
                      
                      {/* Category */}
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(file.category)}
                        <span className={`text-sm font-medium ${getCategoryColor(file.category)}`}>
                          {file.category}
                        </span>
                      </div>
                      
                      {/* Type */}
                      <div className="text-sm text-gray-700">
                        {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                      </div>
                      
                      {/* Size */}
                      <div className="text-sm text-gray-700">
                        {formatFileSize(file.size)}
                      </div>
                      
                      {/* Uploaded At */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{file.uploadDate}</span>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleView(file)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="View file"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button 
                          onClick={() => handleDownload(file)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Download file"
                        >
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm(file.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {isMobile && (
          <div className="p-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Loading files...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700">No files found</p>
                <p className="text-xs text-gray-500 mt-1">
                  {searchQuery || selectedFilter !== 'All Files' 
                    ? 'Try adjusting your search or filter' 
                    : 'Upload your first file to get started'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedFiles.map((file) => (
                  <div key={file.id} className="border border-gray-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="mt-0.5">
                          {getFileTypeIcon(file.name, file.type)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{file.name}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${getCategoryColor(file.category)} bg-gray-50`}>
                              {file.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleView(file)}
                          className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-50"
                          title="View file"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button 
                          onClick={() => handleDownload(file)}
                          className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-50"
                          title="Download file"
                        >
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm(file.id)}
                          className="p-1.5 rounded-full border border-red-200 hover:bg-red-50"
                          title="Delete file"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-3">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-gray-400" />
                        <span className="truncate">{file.type.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-3 h-3 text-gray-400" />
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="truncate">{file.uploadDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Search className="w-3 h-3 text-gray-400" />
                        <span className="truncate">{file.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!loading && <PaginationControls />}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-600 hover:text-red-800 mt-2"
              >
                Dismiss
                  </button>
                </div>
              </div>
            </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete File</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this file? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const file = allFiles.find(f => f.id === deleteConfirm);
                    handleDelete(deleteConfirm, file?.firestoreId);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
        </div>
      </div>
        </div>
      )}

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setSelectedFile(null);
        }}
        file={selectedFile}
        onDownload={handleDownload}
      />
    </div>
  );
};

export default YourFiles;

