import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Eye,
  Upload,
  Search,
  User,
  File,
  Trash2,
  AlertCircle,
  Loader,
  LayoutGrid,
  List,
} from 'lucide-react';
import { fileService, FileItem } from '../../../services/fileService';
import { useAuth } from '../../../contexts/AuthContext';
import { firestoreService, ReferencingFormData } from '../../../services/firestoreService';
import { contractService } from '../../../services/contractService';
import { useIsMobile } from '../ui/use-mobile';
import TenantPageHeader from '../ui/TenantPageHeader';
import FileUploadModal from './FileUploadModal';
import FilePreviewModal from './FilePreviewModal';
import '../../../styles/tenantFiles.css';
import '../../../styles/tenantModals.css';

const PILLARS = [
  { id: 'All Files', label: 'All Files' },
  { id: 'Identity', label: 'Identity' },
  { id: 'Employment', label: 'Employment' },
  { id: 'Financial', label: 'Financial' },
  { id: 'Residential', label: 'Residential' },
  { id: 'Guarantor', label: 'Guarantor' },
  { id: 'Contracts', label: 'Contracts' },
] as const;

function categoryClass(category: string): string {
  switch (category) {
    case 'Identity': return 'identity';
    case 'Employment': return 'employment';
    case 'Financial': return 'financial';
    case 'Residential': return 'residential';
    case 'Guarantor': return 'guarantor';
    case 'Contracts': return 'contracts';
    default: return 'default';
  }
}

function fileIconKind(fileName: string, fileType: string): 'pdf' | 'img' | 'other' {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (fileType === 'application/pdf' || extension === 'pdf') return 'pdf';
  if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'img';
  return 'other';
}

const YourFiles: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('All Files');
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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [dropOver, setDropOver] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadFiles();
  }, [user?.id]);

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

      fileService.setCurrentUser(user?.id || null);

      const loadedFiles = await fileService.getFiles();
      setFiles(loadedFiles);

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
            if (document && document.name && (document.dataUrl || document.url)) {
              referencingFilesList.push({
                id: Date.now() + Math.random(),
                name: document.name,
                category,
                type: document.type || 'application/pdf',
                size: document.size || 0,
                uploadDate: new Date(document.lastModified || Date.now()).toLocaleDateString(),
                url: document.dataUrl || document.url,
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
          id: 200000 + index,
          name: contract.name,
          category: 'Contracts',
          type: contract.fileType,
          size: contract.fileSize,
          uploadDate: contract.uploadDate,
          url: contract.fileUrl || `data:${contract.fileType};base64,${contract.fileData}`,
          firestoreId: contract.id
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

      const failedUploads = results.filter(r => !r.success);
      if (failedUploads.length > 0) {
        setError(`Failed to upload ${failedUploads.length} file(s)`);
      }

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
      const contractFile = contractFiles.find(f => f.id === fileId);
      if (contractFile && contractFile.firestoreId) {
        const result = await contractService.deleteContractTemplate(contractFile.firestoreId);
        if (result.success) {
          setContractFiles(prev => prev.filter(f => f.id !== fileId));
          setDeleteConfirm(null);
          console.log('Contract file deleted from Firestore');
        } else {
          setError(result.error || 'Delete failed');
        }
      } else {
        const result = await fileService.deleteFile(fileId, firestoreId);
        if (result.success) {
          setFiles(prev => prev.filter(f => f.id !== fileId));
          setDeleteConfirm(null);

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

  const formatFileSize = (bytes: number): string => {
    return fileService.formatFileSize(bytes);
  };

  const allFiles = [...files, ...referencingFiles, ...contractFiles];

  const filteredFiles = allFiles.filter(file => {
    const matchesCategory = selectedFilter === 'All Files' || file.category === selectedFilter;
    const matchesSearch = searchQuery === '' ||
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, searchQuery, allFiles.length]);

  const stats = fileService.getFileStats(filteredFiles);

  const pillarCount = (id: string) => {
    if (id === 'All Files') return allFiles.length;
    return allFiles.filter((file) => file.category === id).length;
  };

  const renderFileIcon = (file: FileItem) => {
    const kind = fileIconKind(file.name, file.type);
    return (
      <span className={`tn-fl-file-icon ${kind}`}>
        {kind === 'img' ? <File className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
      </span>
    );
  };

  const renderRowActions = (file: FileItem) => (
    <div className="tn-fl-actions">
      <button type="button" className="tn-fl-icon-btn" onClick={() => handleView(file)} title="Preview">
        <Eye className="w-3.5 h-3.5" />
      </button>
      <button type="button" className="tn-fl-icon-btn" onClick={() => handleDownload(file)} title="Download">
        <Download className="w-3.5 h-3.5" />
      </button>
      <button type="button" className="tn-fl-icon-btn danger" onClick={() => setDeleteConfirm(file.id)} title="Delete">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  const showEmpty = !loading && filteredFiles.length === 0;

  return (
    <div className="tn-fl">
      <TenantPageHeader
        title="Your Files"
        subtitle="Manage, preview, and audit uploaded verification documents, contracts, and compliance evidence."
        primaryLabel={uploading ? 'Uploading...' : 'Upload Document'}
        primaryIcon={uploading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        onPrimary={() => setIsUploadModalOpen(true)}
        primaryDisabled={uploading}
        onInsights={() => setIsInsightsOpen(true)}
      />
      <div className="tn-fl-body">
      <div className="tn-fl-kpi-grid">
        <div className="tn-fl-kpi">
          <div className="tn-fl-kpi-top">
            <span className="tn-fl-kpi-label">Total Files</span>
            <span className="tn-fl-kpi-icon blue"><FileText className="w-4 h-4" /></span>
          </div>
          <div className="tn-fl-kpi-value">
            {loading ? <Loader className="w-6 h-6 animate-spin" /> : referencingFiles.length + contractFiles.length}
          </div>
          <div className="tn-fl-kpi-sub">All updated files</div>
        </div>
        <div className="tn-fl-kpi">
          <div className="tn-fl-kpi-top">
            <span className="tn-fl-kpi-label">Referencing Files</span>
            <span className="tn-fl-kpi-icon purple"><User className="w-4 h-4" /></span>
          </div>
          <div className="tn-fl-kpi-value">
            {loading ? <Loader className="w-6 h-6 animate-spin" /> : referencingFiles.length}
          </div>
          <div className="tn-fl-kpi-sub">Documents uploaded</div>
        </div>
        <div className="tn-fl-kpi">
          <div className="tn-fl-kpi-top">
            <span className="tn-fl-kpi-label">Contract Files</span>
            <span className="tn-fl-kpi-icon emerald"><FileText className="w-4 h-4" /></span>
          </div>
          <div className="tn-fl-kpi-value">
            {loading ? <Loader className="w-6 h-6 animate-spin" /> : contractFiles.length}
          </div>
          <div className="tn-fl-kpi-sub">Signed contracts</div>
        </div>
        <div className="tn-fl-kpi">
          <div className="tn-fl-kpi-top">
            <span className="tn-fl-kpi-label">Storage Used</span>
            <span className="tn-fl-kpi-icon orange"><FileText className="w-4 h-4" /></span>
          </div>
          <div className="tn-fl-kpi-value">
            {loading ? <Loader className="w-6 h-6 animate-spin" /> : formatFileSize(stats.totalSize)}
          </div>
          <div className="tn-fl-kpi-sub">of 100 MB</div>
        </div>
      </div>

      <button
        type="button"
        className={`tn-fl-dropzone${dropOver ? ' is-over' : ''}`}
        onClick={() => setIsUploadModalOpen(true)}
        onDragEnter={(e) => { e.preventDefault(); setDropOver(true); }}
        onDragOver={(e) => { e.preventDefault(); setDropOver(true); }}
        onDragLeave={() => setDropOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDropOver(false);
          setIsUploadModalOpen(true);
        }}
      >
        <div className="tn-fl-drop-left">
          <div className="tn-fl-drop-icon">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3>Quick Upload Files</h3>
            <p>Drag & drop files here, or click to browse. Supports PDF, PNG, JPG (Identity, Employment, Financial, Residential & Guarantor records).</p>
          </div>
        </div>
        <span className="tn-fl-browse">Browse Files</span>
      </button>

      <div className="tn-fl-filters">
        <div className="tn-fl-pills">
          {PILLARS.map((pillar) => (
            <button
              key={pillar.id}
              type="button"
              className={`tn-fl-pill${selectedFilter === pillar.id ? ' is-active' : ''}`}
              onClick={() => setSelectedFilter(pillar.id)}
            >
              {pillar.label} ({pillarCount(pillar.id)})
            </button>
          ))}
        </div>
        <div className="tn-fl-filters-row">
          <div className="tn-fl-search">
            <Search className="w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by file name, category..."
            />
          </div>
          <div className="tn-fl-view-toggle">
            <button
              type="button"
              className={viewMode === 'table' ? 'is-active' : ''}
              onClick={() => setViewMode('table')}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={viewMode === 'grid' ? 'is-active' : ''}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="tn-fl-error">
          <strong>Error:</strong> {error}{' '}
          <button type="button" onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#be123c', fontWeight: 700, cursor: 'pointer' }}>
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="tn-fl-table-wrap" style={{ padding: 24 }}>
          <div className="tn-fl-skel" style={{ height: 56, marginBottom: 12 }} />
          <div className="tn-fl-skel" style={{ height: 56, marginBottom: 12 }} />
          <div className="tn-fl-skel" style={{ height: 56, marginBottom: 12 }} />
          <div className="tn-fl-skel" style={{ height: 56 }} />
        </div>
      ) : showEmpty ? (
        <div className="tn-fl-empty">
          <div className="tn-fl-empty-icon">
            <FileText className="w-8 h-8" />
          </div>
          <h2>{searchQuery || selectedFilter !== 'All Files' ? 'No matching files' : 'No files uploaded yet'}</h2>
          <p>
            {searchQuery || selectedFilter !== 'All Files'
              ? 'Try adjusting your search or category filter.'
              : 'Once you upload identity documents, employment records, bank statements, or residential agreements, they will be securely encrypted and listed here.'}
          </p>
          {!searchQuery && selectedFilter === 'All Files' && (
            <>
              <div className="tn-fl-empty-steps">
                <div className="tn-fl-empty-step"><span className="tn-fl-empty-num">1</span>Select Document</div>
                <div className="tn-fl-empty-step"><span className="tn-fl-empty-num">2</span>Upload File</div>
                <div className="tn-fl-empty-step"><span className="tn-fl-empty-num">3</span>OCR & Audit</div>
                <div className="tn-fl-empty-step"><span className="tn-fl-empty-num">4</span>Secured & Cleared</div>
              </div>
              <div className="tn-fl-empty-actions">
                <button type="button" className="tn-fl-btn-primary" onClick={() => setIsUploadModalOpen(true)}>
                  <Upload className="w-4 h-4" />
                  Upload First File
                </button>
                <button type="button" className="tn-fl-btn-outline" onClick={() => navigate('/dashboard/tenant-referencing')}>
                  <span>View Referencing Passport</span>
                  <span>→</span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : viewMode === 'grid' && !isMobile ? (
        <>
          <div className="tn-fl-grid">
            {paginatedFiles.map((file) => (
              <div key={file.id} className="tn-fl-grid-card">
                <div>
                  <div className="tn-fl-grid-top">
                    {renderFileIcon(file)}
                    <span className={`tn-fl-cat ${categoryClass(file.category)}`}>{file.category}</span>
                  </div>
                  <h4 onClick={() => handleView(file)}>{file.name}</h4>
                  <p className="tn-fl-grid-meta">{formatFileSize(file.size)} • {file.uploadDate}</p>
                </div>
                <div className="tn-fl-grid-foot">
                  <button type="button" className="tn-fl-grid-preview" onClick={() => handleView(file)}>Preview</button>
                  <button type="button" className="tn-fl-icon-btn" onClick={() => handleDownload(file)} title="Download">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" className="tn-fl-icon-btn danger" onClick={() => setDeleteConfirm(file.id)} title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="tn-fl-table-wrap">
          <div className="tn-fl-table-scroll">
            <table className="tn-fl-table">
              <thead>
                <tr>
                  <th>Document / File Name</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Upload Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFiles.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <div className="tn-fl-file">
                        {renderFileIcon(file)}
                        <div>
                          <button type="button" className="tn-fl-file-name" onClick={() => handleView(file)}>
                            {file.name}
                          </button>
                          <div className="tn-fl-file-meta">{formatFileSize(file.size)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`tn-fl-cat ${categoryClass(file.category)}`}>{file.category}</span>
                    </td>
                    <td>{file.type.split('/')[1]?.toUpperCase() || 'FILE'}</td>
                    <td className="tn-fl-date">{file.uploadDate}</td>
                    <td>{renderRowActions(file)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tn-fl-cards">
            {paginatedFiles.map((file) => (
              <div key={`m-${file.id}`} className="tn-fl-grid-card">
                <div className="tn-fl-grid-top">
                  {renderFileIcon(file)}
                  {renderRowActions(file)}
                </div>
                <h4 onClick={() => handleView(file)}>{file.name}</h4>
                <p className="tn-fl-grid-meta">{formatFileSize(file.size)} • {file.uploadDate}</p>
                <div className="tn-fl-grid-foot">
                  <span className={`tn-fl-cat ${categoryClass(file.category)}`}>{file.category}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredFiles.length > ITEMS_PER_PAGE && (
            <div className="tn-fl-footer">
              <div>
                Showing {filteredFiles.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredFiles.length)} of {filteredFiles.length} files
              </div>
              <div className="tn-fl-pager">
                <button type="button" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                  Previous
                </button>
                <span className="is-current" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 30, height: 30, borderRadius: 8 }}>
                  {currentPage}
                </span>
                <button type="button" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !showEmpty && viewMode === 'grid' && !isMobile && filteredFiles.length > ITEMS_PER_PAGE && (
        <div className="tn-fl-footer" style={{ marginTop: 16, borderRadius: 16, border: '1px solid rgba(226,232,240,0.8)', background: '#fff' }}>
          <div>
            Showing {startIndex + 1} to {Math.min(endIndex, filteredFiles.length)} of {filteredFiles.length} files
          </div>
          <div className="tn-fl-pager">
            <button type="button" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>Previous</button>
            <button type="button" className="is-current">{currentPage}</button>
            <button type="button" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>Next</button>
          </div>
        </div>
      )}
      </div>

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

      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />

      <FilePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setSelectedFile(null);
        }}
        file={selectedFile}
        onDownload={handleDownload}
      />

      {isInsightsOpen && (
        <div className="tn-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsInsightsOpen(false); }}>
          <div className="tn-modal" role="dialog" aria-labelledby="tn-vault-insights">
            <div className="tn-modal-head">
              <div className="tn-drawer-head-main">
                <span className="tn-modal-ico blue">📊</span>
                <div>
                  <h3 id="tn-vault-insights">Document Vault Insights</h3>
                </div>
              </div>
              <button type="button" className="tn-modal-x" onClick={() => setIsInsightsOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="tn-modal-body">
              <p style={{ margin: 0, color: '#64748b', lineHeight: 1.6 }}>
                File counts and storage for the documents currently in your vault.
              </p>
              <div className="tn-insights-grid">
                <div className="tn-insights-card">
                  <span>Total files</span>
                  <p>{allFiles.length}</p>
                  <em>In your vault</em>
                </div>
                <div className="tn-insights-card">
                  <span>Referencing files</span>
                  <p>{referencingFiles.length}</p>
                  <em>Identity to guarantor records</em>
                </div>
                <div className="tn-insights-card">
                  <span>Storage used</span>
                  <p>{formatFileSize(stats.totalSize)}</p>
                  <em>of 100 MB</em>
                </div>
                <div className="tn-insights-card">
                  <span>Contract files</span>
                  <p>{contractFiles.length}</p>
                  <em>Signed agreements on file</em>
                </div>
              </div>
            </div>
            <div className="tn-modal-foot">
              <button type="button" className="tn-modal-blue" onClick={() => setIsInsightsOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YourFiles;
