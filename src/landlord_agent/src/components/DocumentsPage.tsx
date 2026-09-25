import React, { useMemo, useState } from 'react';
import {
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  Calendar,
  Building2,
  Download,
  Trash2,
  Archive,
  ChevronDown,
  Upload,
  LayoutGrid,
  List,
  Home,
  Users,
  FolderOpen,
  Plus,
  User,
  RefreshCw,
  Settings,
  Bell,
  Eye,
  Share2,
  X,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useIsMobile } from './ui/use-mobile';
import { Property, PropertyDocument, UserProfile } from '../App';
import { LandlordPageEmptyShell } from './LandlordPageEmptyShell';
import { isNewPortfolioUser } from '../utils/portfolioStatus';
import { downloadPropertyDocument } from '../utils/downloadPropertyDocument';
import '../styles/documentsPage.css';

interface DocumentsPageProps {
  properties: Property[];
  onViewProperty: (property: Property) => void;
  onManageDocuments: (property: Property) => void;
  onDeleteDocuments?: (documentIds: string[]) => void;
  onArchiveDocuments?: (documentIds: string[]) => void;
  onExportDocuments?: (format: 'json' | 'csv' | 'excel' | 'pdf', documentIds: string[]) => void;
  userProfile?: UserProfile | null;
  onAddProperty?: () => void;
  onRefresh?: () => void;
  onViewSettings?: () => void;
  onViewNotifications?: () => void;
}

interface DocumentWithProperty extends PropertyDocument {
  propertyAddress: string;
  propertyId: string;
  tenantName: string | null;
}

type ViewScope = 'property' | 'tenant' | 'all';
type DisplayStyle = 'grid' | 'table';
type CategoryFilter = 'all' | 'compliance' | 'contracts' | 'insurance' | 'other';
type AttachCategory =
  | 'compliance'
  | 'contract'
  | 'identity'
  | 'employment'
  | 'financial'
  | 'residential'
  | 'guarantor';

interface AttachFormState {
  title: string;
  propertyId: string;
  tenant: string;
  category: AttachCategory;
  fileSize: string;
}

const ATTACH_CATEGORIES: { value: AttachCategory; label: string }[] = [
  { value: 'compliance', label: 'Property Compliance' },
  { value: 'contract', label: 'Tenancy Contract' },
  { value: 'identity', label: 'Identity Record' },
  { value: 'employment', label: 'Employment Proof' },
  { value: 'financial', label: 'Financial Statement' },
  { value: 'residential', label: 'Residential History' },
  { value: 'guarantor', label: 'Guarantor Proof' },
];

const initialAttachForm: AttachFormState = {
  title: '',
  propertyId: '',
  tenant: 'Property-Wide',
  category: 'compliance',
  fileSize: '1.8 MB',
};

const CATEGORY_TYPES: Record<Exclude<CategoryFilter, 'all'>, PropertyDocument['type'][]> = {
  compliance: ['epc', 'gas-cert'],
  contracts: ['tenancy-agreement'],
  insurance: ['insurance'],
  other: ['other'],
};

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function ocrCodeForDocument(document: DocumentWithProperty): string {
  const seed = `${document.id}${document.propertyId}`.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `OCR-${seed.slice(0, 4) || 'PROP'}-${seed.slice(4, 8) || 'FILE'}-GB`;
}

function statusBannerCopy(status: PropertyDocument['status']): string {
  switch (status) {
    case 'valid':
      return 'Verified & Sealed';
    case 'expiring-soon':
      return 'Expiring Soon — Review Required';
    case 'expired':
      return 'Expired — Action Required';
    default:
      return String(status);
  }
}

function propertyName(address: string): string {
  return (address.split(',')[0] || address).trim();
}

function coverUrl(property: Property): string | null {
  const cover = property.photos?.find((p) => p.isCover) || property.photos?.[0];
  return cover?.url || null;
}

function formatDocumentType(type: PropertyDocument['type']): string {
  switch (type) {
    case 'epc':
      return 'EPC Certificate';
    case 'gas-cert':
      return 'Gas Safety Certificate';
    case 'tenancy-agreement':
      return 'Tenancy Agreement';
    case 'insurance':
      return 'Insurance Policy';
    case 'other':
      return 'Other Document';
    default:
      return type;
  }
}

function categoryForType(type: PropertyDocument['type']): Exclude<CategoryFilter, 'all'> {
  if (type === 'epc' || type === 'gas-cert') return 'compliance';
  if (type === 'tenancy-agreement') return 'contracts';
  if (type === 'insurance') return 'insurance';
  return 'other';
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getDaysUntilExpiry(expiryDate?: Date) {
  if (!expiryDate) return null;
  const diffTime = expiryDate.getTime() - Date.now();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function statusIcon(status: PropertyDocument['status']) {
  switch (status) {
    case 'expired':
      return <AlertTriangle size={14} />;
    case 'expiring-soon':
      return <Clock size={14} />;
    case 'valid':
      return <CheckCircle size={14} />;
    default:
      return <FileText size={14} />;
  }
}

function statusLabel(status: PropertyDocument['status']): string {
  return status.replace('-', ' ');
}

function complianceHealth(docs: PropertyDocument[]): number {
  if (!docs.length) return 0;
  const valid = docs.filter((d) => d.status === 'valid').length;
  return Math.round((valid / docs.length) * 100);
}

function complianceFillClass(health: number): string {
  if (health < 50) return 'is-danger';
  if (health < 80) return 'is-warn';
  return '';
}

export function DocumentsPage({
  properties,
  onViewProperty,
  onManageDocuments,
  onDeleteDocuments,
  onArchiveDocuments,
  onExportDocuments,
  userProfile,
  onAddProperty,
  onRefresh,
  onViewSettings,
  onViewNotifications,
}: DocumentsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<CategoryFilter>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [viewScope, setViewScope] = useState<ViewScope>('property');
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>('grid');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [attachForm, setAttachForm] = useState<AttachFormState>(initialAttachForm);
  const [inspectionDoc, setInspectionDoc] = useState<DocumentWithProperty | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useIsMobile();

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh?.();
    window.setTimeout(() => setIsRefreshing(false), 700);
  };

  const allDocuments = useMemo<DocumentWithProperty[]>(() => {
    return (properties || []).flatMap((property) =>
      (property.documents || []).map((document) => ({
        ...document,
        propertyAddress: property.address,
        propertyId: property.id,
        tenantName: property.tenant?.name ?? null,
      })),
    );
  }, [properties]);

  const tenantOptions = useMemo(() => {
    const names = new Set<string>();
    (properties || []).forEach((p) => {
      if (p.tenant?.name) names.add(p.tenant.name);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [properties]);

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      all: allDocuments.length,
      compliance: 0,
      contracts: 0,
      insurance: 0,
      other: 0,
    };
    allDocuments.forEach((doc) => {
      counts[categoryForType(doc.type)] += 1;
    });
    return counts;
  }, [allDocuments]);

  const filteredDocuments = useMemo(() => {
    return allDocuments.filter((document) => {
      const haystack = [
        document.name,
        document.propertyAddress,
        document.type,
        document.tenantName || '',
      ]
        .join(' ')
        .toLowerCase();
      const matchesSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'valid' && document.status === 'valid') ||
        (statusFilter === 'expiring-soon' && document.status === 'expiring-soon') ||
        (statusFilter === 'expired' && document.status === 'expired');

      const matchesType =
        typeFilter === 'all' || CATEGORY_TYPES[typeFilter].includes(document.type);

      const matchesProperty =
        propertyFilter === 'all' || document.propertyId === propertyFilter;

      const matchesTenant =
        tenantFilter === 'all' || document.tenantName === tenantFilter;

      return matchesSearch && matchesStatus && matchesType && matchesProperty && matchesTenant;
    });
  }, [allDocuments, searchTerm, statusFilter, typeFilter, propertyFilter, tenantFilter]);

  const filteredProperties = useMemo(() => {
    const ids = new Set(filteredDocuments.map((d) => d.propertyId));
    // Include properties with zero docs only when no filters are narrowing results
    const filtersIdle =
      !searchTerm &&
      statusFilter === 'all' &&
      typeFilter === 'all' &&
      propertyFilter === 'all' &&
      tenantFilter === 'all';

    if (filtersIdle) return properties || [];

    return (properties || []).filter((p) => {
      if (propertyFilter !== 'all' && p.id !== propertyFilter) return false;
      if (tenantFilter !== 'all' && p.tenant?.name !== tenantFilter) return false;
      return ids.has(p.id);
    });
  }, [
    properties,
    filteredDocuments,
    searchTerm,
    statusFilter,
    typeFilter,
    propertyFilter,
    tenantFilter,
  ]);

  const filteredTenants = useMemo(() => {
    return filteredProperties
      .filter((p) => p.tenant)
      .map((p) => ({
        property: p,
        tenant: p.tenant!,
        docs: filteredDocuments.filter((d) => d.propertyId === p.id),
      }));
  }, [filteredProperties, filteredDocuments]);

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId) ? prev.filter((id) => id !== documentId) : [...prev, documentId],
    );
  };

  const selectAllDocuments = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map((doc) => doc.id));
    }
  };

  const clearSelection = () => {
    setSelectedDocuments([]);
    setShowBulkActions(false);
  };

  const handleBulkDelete = () => {
    if (onDeleteDocuments) {
      onDeleteDocuments(selectedDocuments);
      clearSelection();
    }
  };

  const handleBulkArchive = () => {
    if (onArchiveDocuments) {
      onArchiveDocuments(selectedDocuments);
      clearSelection();
    }
  };

  const handleBulkExport = (format: 'json' | 'csv' | 'excel' | 'pdf') => {
    if (onExportDocuments) {
      onExportDocuments(format, selectedDocuments);
    }
  };

  React.useEffect(() => {
    setShowBulkActions(selectedDocuments.length > 0);
  }, [selectedDocuments]);

  const documentStats = useMemo(() => {
    const total = allDocuments.length;
    const expired = allDocuments.filter((doc) => doc.status === 'expired').length;
    const expiringSoon = allDocuments.filter((doc) => doc.status === 'expiring-soon').length;
    const valid = allDocuments.filter((doc) => doc.status === 'valid').length;
    const propertiesDocumented = (properties || []).filter((p) => (p.documents || []).length > 0)
      .length;
    const tenantsTracked = (properties || []).filter((p) => p.tenant).length;
    const actionsNeeded = expired + expiringSoon;
    const compliancePct =
      total > 0 ? Math.round((valid / total) * 100) : propertiesDocumented > 0 ? 100 : 0;

    return {
      total,
      expired,
      expiringSoon,
      valid,
      propertiesDocumented,
      tenantsTracked,
      actionsNeeded,
      compliancePct,
    };
  }, [allDocuments, properties]);

  const hasActiveFilters =
    Boolean(searchTerm) ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    propertyFilter !== 'all' ||
    tenantFilter !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setPropertyFilter('all');
    setTenantFilter('all');
  };

  const openAttachFlow = (property?: Property) => {
    const list = properties || [];
    const target = property || (list.length === 1 ? list[0] : undefined);
    setAttachForm({
      ...initialAttachForm,
      propertyId: target?.id || '',
      tenant: target?.tenant?.name || 'Property-Wide',
    });
    setAttachModalOpen(true);
  };

  const closeAttachModal = () => {
    setAttachModalOpen(false);
    setAttachForm(initialAttachForm);
  };

  const handleAttachSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const property = (properties || []).find((p) => p.id === attachForm.propertyId);
    if (!property) return;
    // Preserve the existing DocumentManagement upload path for real files.
    if (typeof window !== 'undefined' && attachForm.title.trim()) {
      window.sessionStorage.setItem(
        'proptii.pendingDocumentAttach',
        JSON.stringify({
          title: attachForm.title.trim(),
          category: attachForm.category,
          tenant: attachForm.tenant,
        }),
      );
    }
    closeAttachModal();
    onManageDocuments(property);
  };

  const openInspectionDrawer = (document: DocumentWithProperty) => {
    setShareFeedback(null);
    setInspectionDoc(document);
  };

  const closeInspectionDrawer = () => {
    setInspectionDoc(null);
    setShareFeedback(null);
  };

  const handleShareDocument = async (document: DocumentWithProperty) => {
    const shareTarget = document.url?.trim() || `${document.name} · ${document.propertyAddress}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareTarget);
        setShareFeedback('Link copied to clipboard');
      } else {
        setShareFeedback('Share link ready');
      }
    } catch {
      setShareFeedback('Unable to copy link');
    }
    window.setTimeout(() => setShareFeedback(null), 2200);
  };

  const getPropertyByDocument = (propertyId: string) =>
    properties.find((p) => p.id === propertyId);

  const documentRowKey = (document: DocumentWithProperty) =>
    `${document.propertyId}-${document.id}`;

  const handleDownloadDocument = async (document: DocumentWithProperty) => {
    const key = documentRowKey(document);
    if (!document.url?.trim()) return;
    setDownloadingKey(key);
    try {
      await downloadPropertyDocument(document.url, document.name);
    } catch (e) {
      console.error('Document download failed:', e);
    } finally {
      setDownloadingKey(null);
    }
  };

  if (!userProfile) {
    return <LandlordPageEmptyShell page="documents" variant="guest" />;
  }

  if (isNewPortfolioUser(properties)) {
    return (
      <LandlordPageEmptyShell
        page="documents"
        variant="new-user"
        onAddProperty={onAddProperty}
        userName={userProfile.name}
      />
    );
  }

  const effectiveDisplay: DisplayStyle = isMobile && viewScope === 'all' ? 'grid' : displayStyle;
  const vaultEmpty = allDocuments.length === 0 && !hasActiveFilters;
  const filterEmpty =
    !vaultEmpty &&
    ((viewScope === 'all' && filteredDocuments.length === 0) ||
      (viewScope === 'property' && filteredProperties.length === 0) ||
      (viewScope === 'tenant' && filteredTenants.length === 0));

  const renderBulkBar = () =>
    showBulkActions && selectedDocuments.length > 0 ? (
      <div className="ll-docs-bulk">
        <div className="ll-docs-bulk-left">
          <span>
            {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected
          </span>
          <button type="button" className="ll-docs-ghost-btn" onClick={clearSelection}>
            Clear Selection
          </button>
          <button type="button" className="ll-docs-ghost-btn" onClick={selectAllDocuments}>
            {selectedDocuments.length === filteredDocuments.length ? 'Deselect all' : 'Select all'}
          </button>
        </div>
        <div className="ll-docs-bulk-actions">
          {onArchiveDocuments && (
            <button type="button" className="ll-docs-ghost-btn" onClick={handleBulkArchive}>
              <Archive size={14} />
              Archive
            </button>
          )}
          {onExportDocuments && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="ll-docs-ghost-btn">
                  <Download size={14} />
                  Export
                  <ChevronDown size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBulkExport('json')}>
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkExport('csv')}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkExport('excel')}>
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkExport('pdf')}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {onDeleteDocuments && (
            <button type="button" className="ll-docs-danger-btn" onClick={handleBulkDelete}>
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>
      </div>
    ) : null;

  const renderDocumentTable = () => (
    <div className="ll-docs-table-wrap">
      <div className="ll-docs-table-scroll">
        <table className="ll-docs-table">
          <thead>
            <tr>
              <th style={{ width: 44 }}>
                <input
                  type="checkbox"
                  className="ll-docs-check"
                  checked={
                    selectedDocuments.length === filteredDocuments.length &&
                    filteredDocuments.length > 0
                  }
                  onChange={selectAllDocuments}
                  aria-label="Select all documents"
                />
              </th>
              <th>Document / File</th>
              <th>Attached Property</th>
              <th>Attached Tenant</th>
              <th>Category</th>
              <th>Validity / Upload</th>
              <th>Audit Status</th>
              <th className="is-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.map((document) => {
              const property = getPropertyByDocument(document.propertyId);
              const daysUntilExpiry = getDaysUntilExpiry(document.expiryDate);
              return (
                <tr
                  key={documentRowKey(document)}
                  className={selectedDocuments.includes(document.id) ? 'is-selected' : ''}
                >
                  <td>
                    <input
                      type="checkbox"
                      className="ll-docs-check"
                      checked={selectedDocuments.includes(document.id)}
                      onChange={() => toggleDocumentSelection(document.id)}
                      aria-label={`Select ${document.name}`}
                    />
                  </td>
                  <td>
                    <div className="ll-docs-table-doc">
                      {statusIcon(document.status)}
                      <span title={document.name}>{document.name}</span>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="ll-docs-prop-btn"
                      onClick={() => property && onViewProperty(property)}
                    >
                      <Building2 size={14} />
                      <span>{document.propertyAddress}</span>
                    </button>
                  </td>
                  <td>{document.tenantName || '—'}</td>
                  <td>{formatDocumentType(document.type)}</td>
                  <td>
                    <div className="ll-docs-date">
                      <Calendar size={13} />
                      <span>{formatDate(document.issueDate)}</span>
                    </div>
                    {document.expiryDate && (
                      <div className="ll-docs-date" style={{ marginTop: 4 }}>
                        <span
                          className={
                            daysUntilExpiry != null && daysUntilExpiry < 0
                              ? 'is-danger'
                              : daysUntilExpiry != null && daysUntilExpiry < 30
                                ? 'is-warn'
                                : undefined
                          }
                        >
                          Exp {formatDate(document.expiryDate)}
                          {daysUntilExpiry != null
                            ? daysUntilExpiry < 0
                              ? ' (Expired)'
                              : ` (${daysUntilExpiry}d)`
                            : ''}
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`ll-docs-status-pill is-${document.status}`}>
                      {statusLabel(document.status)}
                    </span>
                  </td>
                  <td className="is-right">
                    <div className="ll-docs-row-actions">
                      <button
                        type="button"
                        className="ll-docs-icon-btn"
                        title="Inspect document"
                        onClick={() => openInspectionDrawer(document)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        className="ll-docs-icon-btn"
                        title="Download"
                        disabled={
                          !document.url?.trim() || downloadingKey === documentRowKey(document)
                        }
                        onClick={() => handleDownloadDocument(document)}
                      >
                        <Download size={15} />
                      </button>
                      <button
                        type="button"
                        className="ll-docs-icon-btn"
                        title="Manage documents"
                        onClick={() => property && onManageDocuments(property)}
                      >
                        <FolderOpen size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDocumentGrid = () => (
    <div className="ll-docs-file-grid">
      {filteredDocuments.map((document) => {
        const property = getPropertyByDocument(document.propertyId);
        const daysUntilExpiry = getDaysUntilExpiry(document.expiryDate);
        return (
          <div
            key={documentRowKey(document)}
            className={`ll-docs-file-card${selectedDocuments.includes(document.id) ? ' is-selected' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => openInspectionDrawer(document)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openInspectionDrawer(document);
              }
            }}
          >
            <div className="ll-docs-file-card-top" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                className="ll-docs-check"
                checked={selectedDocuments.includes(document.id)}
                onChange={() => toggleDocumentSelection(document.id)}
                aria-label={`Select ${document.name}`}
              />
              <div className="ll-docs-file-card-body" style={{ flex: 1, minWidth: 0 }}>
                <strong title={document.name}>{document.name}</strong>
                <span className={`ll-docs-status-pill is-${document.status}`}>
                  {statusLabel(document.status)}
                </span>
              </div>
            </div>
            <div className="ll-docs-file-card-body">
              <button
                type="button"
                className="ll-docs-prop-btn"
                onClick={() => property && onViewProperty(property)}
              >
                <Building2 size={14} />
                <span>{document.propertyAddress}</span>
              </button>
              <div>Type: {formatDocumentType(document.type)}</div>
              <div>Issued: {formatDate(document.issueDate)}</div>
              <div>
                Expiry:{' '}
                {document.expiryDate
                  ? `${formatDate(document.expiryDate)}${
                      daysUntilExpiry != null
                        ? daysUntilExpiry < 0
                          ? ' (Expired)'
                          : ` (${daysUntilExpiry}d)`
                        : ''
                    }`
                  : 'No expiry'}
              </div>
              {document.tenantName && <div>Tenant: {document.tenantName}</div>}
            </div>
            <div className="ll-docs-file-card-actions" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="ll-docs-ghost-btn"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => openInspectionDrawer(document)}
              >
                <Eye size={14} />
                Inspect
              </button>
              <button
                type="button"
                className="ll-docs-ghost-btn"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={!document.url?.trim() || downloadingKey === documentRowKey(document)}
                onClick={() => handleDownloadDocument(document)}
              >
                <Download size={14} />
                Download
              </button>
              <button
                type="button"
                className="ll-docs-icon-btn"
                title="Manage documents"
                onClick={() => property && onManageDocuments(property)}
              >
                <FolderOpen size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderPropertyCards = () => (
    <div className="ll-docs-card-grid">
      {filteredProperties.map((property) => {
        const docs = filteredDocuments.filter((d) => d.propertyId === property.id);
        const allPropDocs = property.documents || [];
        const health = complianceHealth(allPropDocs);
        const thumb = coverUrl(property);
        const alertDoc = allPropDocs.find(
          (d) => d.status === 'expired' || d.status === 'expiring-soon',
        );
        return (
          <article key={property.id} className="ll-docs-card">
            <div className="ll-docs-card-top">
              <div className="ll-docs-card-identity">
                {thumb ? (
                  <img src={thumb} alt="" className="ll-docs-card-thumb" />
                ) : (
                  <div className="ll-docs-card-thumb is-placeholder">
                    <Building2 size={22} />
                  </div>
                )}
                <div>
                  <h3>{propertyName(property.address)}</h3>
                  <p>{property.address}</p>
                  <div className="ll-docs-card-meta">
                    {property.tenant?.name && (
                      <span className="ll-docs-chip">
                        <User size={11} />
                        {property.tenant.name}
                      </span>
                    )}
                    <span className="ll-docs-rent">£{property.rent.toLocaleString()}/mo</span>
                  </div>
                </div>
              </div>
              <span
                className={`ll-docs-status-pill is-${
                  alertDoc?.status === 'expired'
                    ? 'expired'
                    : alertDoc?.status === 'expiring-soon'
                      ? 'expiring-soon'
                      : property.status === 'occupied'
                        ? 'occupied'
                        : 'vacant'
                }`}
              >
                {alertDoc
                  ? statusLabel(alertDoc.status)
                  : property.status === 'occupied'
                    ? 'Occupied'
                    : property.status === 'under-renovation'
                      ? 'Renovation'
                      : 'Vacant'}
              </span>
            </div>

            <div className="ll-docs-compliance">
              <div className="ll-docs-compliance-head">
                <span>Attached Documents & Compliance</span>
                <span>
                  {allPropDocs.length} Document{allPropDocs.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="ll-docs-compliance-track">
                <div
                  className={`ll-docs-compliance-fill ${complianceFillClass(health)}`}
                  style={{ width: `${health}%` }}
                />
              </div>
            </div>

            <div className="ll-docs-file-list">
              <div className="ll-docs-file-list-label">
                Attached Files ({docs.length}
                {hasActiveFilters && docs.length !== allPropDocs.length
                  ? ` of ${allPropDocs.length}`
                  : ''}
                )
              </div>
              {docs.length === 0 ? (
                <div className="ll-docs-file-row">
                  <span className="ll-docs-file-row-name">
                    <FileText size={14} />
                    <span>No matching files</span>
                  </span>
                </div>
              ) : (
                docs.slice(0, 4).map((doc) => (
                  <button
                    key={documentRowKey(doc)}
                    type="button"
                    className="ll-docs-file-row is-clickable"
                    onClick={() => openInspectionDrawer(doc)}
                  >
                    <div className="ll-docs-file-row-name">
                      {statusIcon(doc.status)}
                      <span title={doc.name}>{doc.name}</span>
                    </div>
                    <span className={`ll-docs-status-pill is-${doc.status}`}>
                      {statusLabel(doc.status)}
                    </span>
                  </button>
                ))
              )}
              {docs.length > 4 && (
                <div className="ll-docs-file-row">
                  <span className="ll-docs-file-row-name">
                    <span>+{docs.length - 4} more</span>
                  </span>
                </div>
              )}
            </div>

            <div className="ll-docs-card-footer">
              <button
                type="button"
                className="ll-docs-link-btn"
                onClick={() => openAttachFlow(property)}
              >
                <Plus size={14} />
                Attach File
              </button>
              <button
                type="button"
                className="ll-docs-link-btn is-muted"
                onClick={() => onViewProperty(property)}
              >
                <Building2 size={14} />
                View Property
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );

  const renderPropertyTable = () => (
    <div className="ll-docs-table-wrap">
      <div className="ll-docs-table-scroll">
        <table className="ll-docs-table">
          <thead>
            <tr>
              <th>Property / Address</th>
              <th>Primary Tenant</th>
              <th>Rent / Status</th>
              <th>Compliance Health</th>
              <th>Attached Files</th>
              <th>Alert Status</th>
              <th className="is-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProperties.map((property) => {
              const allPropDocs = property.documents || [];
              const docs = filteredDocuments.filter((d) => d.propertyId === property.id);
              const health = complianceHealth(allPropDocs);
              const thumb = coverUrl(property);
              const alertDoc = allPropDocs.find(
                (d) => d.status === 'expired' || d.status === 'expiring-soon',
              );
              return (
                <tr key={property.id}>
                  <td>
                    <div className="ll-docs-card-identity">
                      {thumb ? (
                        <img src={thumb} alt="" className="ll-docs-card-thumb" style={{ width: 40, height: 40 }} />
                      ) : (
                        <div
                          className="ll-docs-card-thumb is-placeholder"
                          style={{ width: 40, height: 40 }}
                        >
                          <Building2 size={16} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {propertyName(property.address)}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{property.address}</div>
                      </div>
                    </div>
                  </td>
                  <td>{property.tenant?.name || '—'}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>£{property.rent.toLocaleString()}/mo</div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>
                      {property.status.replace('-', ' ')}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{health}%</div>
                    <div className="ll-docs-compliance-track" style={{ width: 80 }}>
                      <div
                        className={`ll-docs-compliance-fill ${complianceFillClass(health)}`}
                        style={{ width: `${health}%` }}
                      />
                    </div>
                  </td>
                  <td>
                    {docs.length}
                    {hasActiveFilters && docs.length !== allPropDocs.length
                      ? ` / ${allPropDocs.length}`
                      : ''}
                  </td>
                  <td>
                    {alertDoc ? (
                      <span className={`ll-docs-status-pill is-${alertDoc.status}`}>
                        {statusLabel(alertDoc.status)}
                      </span>
                    ) : (
                      <span className="ll-docs-status-pill is-valid">Healthy</span>
                    )}
                  </td>
                  <td className="is-right">
                    <div className="ll-docs-row-actions">
                      <button
                        type="button"
                        className="ll-docs-icon-btn"
                        title="Attach document"
                        onClick={() => openAttachFlow(property)}
                      >
                        <Upload size={15} />
                      </button>
                      <button
                        type="button"
                        className="ll-docs-icon-btn"
                        title="Manage documents"
                        onClick={() => onManageDocuments(property)}
                      >
                        <FolderOpen size={15} />
                      </button>
                      <button
                        type="button"
                        className="ll-docs-icon-btn"
                        title="View property"
                        onClick={() => onViewProperty(property)}
                      >
                        <Building2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTenantCards = () => (
    <div className="ll-docs-card-grid">
      {filteredTenants.map(({ property, tenant, docs }) => (
        <article key={`${property.id}-${tenant.id}`} className="ll-docs-card">
          <div className="ll-docs-card-top">
            <div className="ll-docs-card-identity">
              <div className="ll-docs-card-thumb is-placeholder">
                <Users size={22} />
              </div>
              <div>
                <h3>{tenant.name}</h3>
                <p>{property.address}</p>
                <div className="ll-docs-card-meta">
                  <span className="ll-docs-chip">{tenant.status}</span>
                  <span className="ll-docs-rent">£{tenant.rentAmount.toLocaleString()}/mo</span>
                </div>
              </div>
            </div>
            <span className="ll-docs-status-pill is-valid">
              {docs.length} file{docs.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="ll-docs-file-list">
            <div className="ll-docs-file-list-label">Property Documents</div>
            {docs.length === 0 ? (
              <div className="ll-docs-file-row">
                <span className="ll-docs-file-row-name">
                  <FileText size={14} />
                  <span>No matching files</span>
                </span>
              </div>
            ) : (
              docs.slice(0, 4).map((doc) => (
                <button
                  key={documentRowKey(doc)}
                  type="button"
                  className="ll-docs-file-row is-clickable"
                  onClick={() => openInspectionDrawer(doc)}
                >
                  <div className="ll-docs-file-row-name">
                    {statusIcon(doc.status)}
                    <span title={doc.name}>{doc.name}</span>
                  </div>
                  <span className={`ll-docs-status-pill is-${doc.status}`}>
                    {statusLabel(doc.status)}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="ll-docs-card-footer">
            <button
              type="button"
              className="ll-docs-link-btn"
              onClick={() => openAttachFlow(property)}
            >
              <Plus size={14} />
              Attach File
            </button>
            <button
              type="button"
              className="ll-docs-link-btn is-muted"
              onClick={() => onViewProperty(property)}
            >
              <Building2 size={14} />
              View Property
            </button>
          </div>
        </article>
      ))}
    </div>
  );

  const renderTenantTable = () => (
    <div className="ll-docs-table-wrap">
      <div className="ll-docs-table-scroll">
        <table className="ll-docs-table">
          <thead>
            <tr>
              <th>Tenant / Applicant</th>
              <th>Assigned Property</th>
              <th>Lease Status</th>
              <th>Attached Files</th>
              <th className="is-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTenants.map(({ property, tenant, docs }) => (
              <tr key={`${property.id}-${tenant.id}`}>
                <td style={{ fontWeight: 700, color: '#0f172a' }}>{tenant.name}</td>
                <td>
                  <button
                    type="button"
                    className="ll-docs-prop-btn"
                    onClick={() => onViewProperty(property)}
                  >
                    <Building2 size={14} />
                    <span>{property.address}</span>
                  </button>
                </td>
                <td style={{ textTransform: 'capitalize' }}>{tenant.status}</td>
                <td>{docs.length}</td>
                <td className="is-right">
                  <div className="ll-docs-row-actions">
                    <button
                      type="button"
                      className="ll-docs-icon-btn"
                      title="Manage documents"
                      onClick={() => onManageDocuments(property)}
                    >
                      <FolderOpen size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="ll-docs">
      <header className="ll-docs-header">
        <div className="ll-docs-inner ll-docs-header-inner">
          <div className="ll-docs-header-copy">
            <h1>Your Documents</h1>
            <p>
              Inspect, attach, and audit compliance files
              <br />
              linked to each property and tenant.
            </p>
          </div>

          <div className="ll-docs-header-actions">
            <button
              type="button"
              className={`ll-docs-header-icon${isRefreshing ? ' refreshing' : ''}`}
              title="Refresh Portfolio Data"
              onClick={handleRefresh}
            >
              <RefreshCw size={16} />
            </button>
            <button
              type="button"
              className="ll-docs-header-icon"
              title="Settings"
              onClick={onViewSettings}
            >
              <Settings size={18} />
            </button>
            <button
              type="button"
              className="ll-docs-header-icon"
              title="Notifications"
              onClick={onViewNotifications}
            >
              <Bell size={18} />
              <span className="ll-docs-header-dot" />
            </button>

            <div className="ll-docs-scope" role="tablist" aria-label="Document view scope">
              <button
                type="button"
                role="tab"
                aria-selected={viewScope === 'property'}
                className={`ll-docs-scope-btn${viewScope === 'property' ? ' is-active' : ''}`}
                onClick={() => setViewScope('property')}
              >
                <Home size={14} />
                <span className="hide-sm">By Property</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewScope === 'tenant'}
                className={`ll-docs-scope-btn${viewScope === 'tenant' ? ' is-active' : ''}`}
                onClick={() => setViewScope('tenant')}
              >
                <Users size={14} />
                <span className="hide-sm">By Tenant</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewScope === 'all'}
                className={`ll-docs-scope-btn${viewScope === 'all' ? ' is-active' : ''}`}
                onClick={() => setViewScope('all')}
              >
                <FileText size={14} />
                <span className="hide-sm">All Documents</span>
              </button>
            </div>

            <button
              type="button"
              className="ll-docs-btn-attach"
              onClick={() => openAttachFlow()}
              disabled={(properties || []).length === 0}
            >
              <Upload size={16} />
              Attach Document
            </button>
          </div>
        </div>
      </header>

      <div className="ll-docs-inner ll-docs-body">
        <div className="ll-docs-kpi-grid">
          <div className="ll-docs-kpi">
            <div className="ll-docs-kpi-top">
              <span className="ll-docs-kpi-label">Total Attached Files</span>
              <span className="ll-docs-kpi-icon is-blue">
                <FileText size={16} />
              </span>
            </div>
            <div>
              <div className="ll-docs-kpi-value">{documentStats.total}</div>
              <p className="ll-docs-kpi-hint">Linked to property or tenant</p>
            </div>
          </div>

          <div className="ll-docs-kpi">
            <div className="ll-docs-kpi-top">
              <span className="ll-docs-kpi-label">Properties Documented</span>
              <span className="ll-docs-kpi-icon is-green">
                <Home size={16} />
              </span>
            </div>
            <div>
              <div className="ll-docs-kpi-value">{documentStats.propertiesDocumented}</div>
              <p className="ll-docs-kpi-hint is-green">
                {documentStats.compliancePct}% Compliance Health
              </p>
            </div>
          </div>

          <div className="ll-docs-kpi">
            <div className="ll-docs-kpi-top">
              <span className="ll-docs-kpi-label">Tenants Tracked</span>
              <span className="ll-docs-kpi-icon is-purple">
                <Users size={16} />
              </span>
            </div>
            <div>
              <div className="ll-docs-kpi-value">{documentStats.tenantsTracked}</div>
              <p className="ll-docs-kpi-hint">
                {documentStats.valid} valid · {documentStats.expired} expired
              </p>
            </div>
          </div>

          <div className="ll-docs-kpi">
            <div className="ll-docs-kpi-top">
              <span className="ll-docs-kpi-label">Action & Renewals</span>
              <span className="ll-docs-kpi-icon is-amber">
                <AlertTriangle size={16} />
              </span>
            </div>
            <div>
              <div
                className={`ll-docs-kpi-value${documentStats.actionsNeeded > 0 ? ' is-amber' : ''}`}
              >
                {documentStats.actionsNeeded}
              </div>
              <p className="ll-docs-kpi-hint is-amber">
                {documentStats.expiringSoon} expiring · {documentStats.expired} expired
              </p>
            </div>
          </div>
        </div>

        {documentStats.expired > 0 && (
          <div className="ll-docs-alert is-danger" role="status">
            <AlertTriangle size={16} />
            <div>
              <strong>{documentStats.expired} documents have expired</strong> and require immediate
              attention.
            </div>
          </div>
        )}

        {documentStats.expiringSoon > 0 && (
          <div className="ll-docs-alert is-warn" role="status">
            <Clock size={16} />
            <div>
              <strong>{documentStats.expiringSoon} documents are expiring soon</strong> and should be
              renewed.
            </div>
          </div>
        )}

        <button
          type="button"
          className="ll-docs-dropzone"
          onClick={() => openAttachFlow()}
          disabled={(properties || []).length === 0}
        >
          <div className="ll-docs-dropzone-main">
            <span className="ll-docs-dropzone-icon">
              <Upload size={22} />
            </span>
            <div>
              <h3>Attach Documents to Property or Tenant</h3>
              <p>
                Link compliance certificates to properties, or open a property vault to manage
                attached files.
              </p>
            </div>
          </div>
          <span className="ll-docs-dropzone-btn">Browse & Attach</span>
        </button>

        <div className="ll-docs-toolbar">
          <div className="ll-docs-toolbar-top">
            <div className="ll-docs-cats" role="tablist" aria-label="Document categories">
              {(
                [
                  ['all', 'All Files'],
                  ['compliance', 'Compliance'],
                  ['contracts', 'Contracts'],
                  ['insurance', 'Insurance'],
                  ['other', 'Other'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`ll-docs-cat${typeFilter === key ? ' is-active' : ''}`}
                  onClick={() => setTypeFilter(key)}
                >
                  {label} ({categoryCounts[key]})
                </button>
              ))}
            </div>

            <div className="ll-docs-display" role="group" aria-label="Display style">
              <button
                type="button"
                className={`ll-docs-display-btn${displayStyle === 'grid' ? ' is-active' : ''}`}
                onClick={() => setDisplayStyle('grid')}
              >
                <LayoutGrid size={14} />
                <span className="hide-sm">Grid View</span>
              </button>
              <button
                type="button"
                className={`ll-docs-display-btn${displayStyle === 'table' ? ' is-active' : ''}`}
                onClick={() => setDisplayStyle('table')}
              >
                <List size={14} />
                <span className="hide-sm">Table View</span>
              </button>
            </div>
          </div>

          <div className="ll-docs-toolbar-filters">
            <div className="ll-docs-search">
              <Search size={16} />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search document, property, or tenant..."
                aria-label="Search documents"
              />
            </div>

            <select
              className="ll-docs-select"
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              aria-label="Filter by property"
            >
              <option value="all">
                All Properties ({(properties || []).length} Properties)
              </option>
              {(properties || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address}
                </option>
              ))}
            </select>

            <select
              className="ll-docs-select"
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              aria-label="Filter by tenant"
            >
              <option value="all">All Tenants / Clients</option>
              {tenantOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <select
              className="ll-docs-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Audit Statuses</option>
              <option value="valid">Valid</option>
              <option value="expiring-soon">Expiring Soon</option>
              <option value="expired">Expired / Action Required</option>
            </select>
          </div>
        </div>

        {vaultEmpty ? (
          <div className="ll-docs-empty">
            <div className="ll-docs-empty-icon">
              <FolderOpen size={28} />
            </div>
            <h3>No Documents in Vault Yet</h3>
            <p>
              Start attaching compliance certificates (Gas Safety, EPC, EICR) to properties to build
              your audit-ready repository.
            </p>
            <div className="ll-docs-empty-actions">
              <button
                type="button"
                className="ll-docs-btn-attach"
                onClick={() => openAttachFlow()}
                disabled={(properties || []).length === 0}
              >
                <Upload size={16} />
                Attach First Document
              </button>
            </div>
          </div>
        ) : filterEmpty ? (
          <div className="ll-docs-empty is-filter">
            <div className="ll-docs-empty-icon">
              <Search size={22} />
            </div>
            <h3>No matching documents found</h3>
            <p>
              No documents match your active property, tenant, or category filters. Try clearing your
              filters or attach a new file.
            </p>
            <div className="ll-docs-empty-actions">
              <button type="button" className="ll-docs-ghost-btn" onClick={resetFilters}>
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <>
            {viewScope === 'property' && (
              <section className="space-y-4">
                <div className="ll-docs-section-head">
                  <h2>Properties & Attached Document Packs</h2>
                  <span>
                    Showing {filteredProperties.length} propert
                    {filteredProperties.length === 1 ? 'y' : 'ies'}
                  </span>
                </div>
                {effectiveDisplay === 'grid' ? renderPropertyCards() : renderPropertyTable()}
              </section>
            )}

            {viewScope === 'tenant' && (
              <section className="space-y-4">
                <div className="ll-docs-section-head">
                  <h2>Tenants & Attached Document Records</h2>
                  <span>
                    Showing {filteredTenants.length} tenant
                    {filteredTenants.length === 1 ? '' : 's'}
                  </span>
                </div>
                {filteredTenants.length === 0 ? (
                  <div className="ll-docs-empty is-filter">
                    <div className="ll-docs-empty-icon">
                      <Users size={22} />
                    </div>
                    <h3>No tenants with documents</h3>
                    <p>
                      Assign tenants to properties to group documents by tenant, or switch to By
                      Property / All Documents.
                    </p>
                  </div>
                ) : effectiveDisplay === 'grid' ? (
                  renderTenantCards()
                ) : (
                  renderTenantTable()
                )}
              </section>
            )}

            {viewScope === 'all' && (
              <section className="space-y-4">
                <div className="ll-docs-section-head">
                  <h2>All Document Records</h2>
                  <span>
                    Showing {filteredDocuments.length} file
                    {filteredDocuments.length === 1 ? '' : 's'}
                  </span>
                </div>
                {renderBulkBar()}
                {effectiveDisplay === 'table' && !isMobile
                  ? renderDocumentTable()
                  : renderDocumentGrid()}
              </section>
            )}
          </>
        )}
      </div>

      {attachModalOpen && (
        <div
          className="ll-docs-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ll-docs-attach-title"
          onClick={closeAttachModal}
        >
          <div className="ll-docs-attach-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ll-docs-attach-head">
              <div>
                <h3 id="ll-docs-attach-title">Attach Document to Property / Tenant</h3>
                <p>
                  Link uploaded compliance certificates, tenancy contracts, or referencing proof.
                </p>
              </div>
              <button
                type="button"
                className="ll-docs-icon-btn"
                aria-label="Close"
                onClick={closeAttachModal}
              >
                <X size={16} />
              </button>
            </div>

            <form className="ll-docs-attach-form" onSubmit={handleAttachSubmit}>
              <label className="ll-docs-field">
                <span>Document Title</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gas_Safety_Certificate_2026.pdf"
                  value={attachForm.title}
                  onChange={(e) => setAttachForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </label>

              <label className="ll-docs-field">
                <span>Target Property</span>
                <select
                  required
                  value={attachForm.propertyId}
                  onChange={(e) => {
                    const nextProperty = (properties || []).find((p) => p.id === e.target.value);
                    setAttachForm((prev) => ({
                      ...prev,
                      propertyId: e.target.value,
                      tenant: nextProperty?.tenant?.name || 'Property-Wide',
                    }));
                  }}
                >
                  <option value="" disabled>
                    Select a property
                  </option>
                  {(properties || []).map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.address}
                    </option>
                  ))}
                </select>
              </label>

              <label className="ll-docs-field">
                <span>Target Tenant (Optional)</span>
                <select
                  value={attachForm.tenant}
                  onChange={(e) => setAttachForm((prev) => ({ ...prev, tenant: e.target.value }))}
                >
                  <option value="Property-Wide">Property-Wide (Building Compliance)</option>
                  {tenantOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="ll-docs-attach-grid">
                <label className="ll-docs-field">
                  <span>Document Category</span>
                  <select
                    required
                    value={attachForm.category}
                    onChange={(e) =>
                      setAttachForm((prev) => ({
                        ...prev,
                        category: e.target.value as AttachCategory,
                      }))
                    }
                  >
                    {ATTACH_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ll-docs-field">
                  <span>File Size</span>
                  <input
                    type="text"
                    value={attachForm.fileSize}
                    onChange={(e) =>
                      setAttachForm((prev) => ({ ...prev, fileSize: e.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="ll-docs-attach-drop">
                <Upload size={22} />
                <strong>Continue to vault upload</strong>
                <p>PDF, JPG, PNG up to 25MB — file selection opens in the property vault.</p>
              </div>

              <div className="ll-docs-attach-actions">
                <button type="button" className="ll-docs-ghost-btn" onClick={closeAttachModal}>
                  Cancel
                </button>
                <button type="submit" className="ll-docs-btn-attach" disabled={!attachForm.propertyId}>
                  Attach & Seal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {inspectionDoc && (
        <div
          className="ll-docs-drawer-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ll-docs-drawer-title"
          onClick={closeInspectionDrawer}
        >
          <aside className="ll-docs-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="ll-docs-drawer-head">
              <div className="ll-docs-drawer-title-wrap">
                <div className={`ll-docs-drawer-icon is-${inspectionDoc.status}`}>
                  <FileText size={18} />
                </div>
                <div className="ll-docs-drawer-title">
                  <h2 id="ll-docs-drawer-title">{inspectionDoc.name}</h2>
                  <p>
                    {formatDocumentType(inspectionDoc.type)} · Uploaded{' '}
                    {formatDate(inspectionDoc.issueDate)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="ll-docs-icon-btn"
                aria-label="Close inspection"
                onClick={closeInspectionDrawer}
              >
                <X size={16} />
              </button>
            </div>

            <div className="ll-docs-drawer-body">
              <div className={`ll-docs-drawer-banner is-${inspectionDoc.status}`}>
                <span>{statusBannerCopy(inspectionDoc.status)}</span>
                <span>
                  {inspectionDoc.expiryDate
                    ? `Expiry: ${formatDate(inspectionDoc.expiryDate)}`
                    : 'Permanent Record'}
                </span>
              </div>

              <div className="ll-docs-drawer-card">
                <div className="ll-docs-drawer-card-label">Attached Property</div>
                <div className="ll-docs-drawer-card-row">
                  {(() => {
                    const property = getPropertyByDocument(inspectionDoc.propertyId);
                    const thumb = property ? coverUrl(property) : null;
                    return thumb ? (
                      <img src={thumb} alt="" className="ll-docs-drawer-thumb" />
                    ) : (
                      <div className="ll-docs-drawer-thumb is-placeholder">
                        <Building2 size={16} />
                      </div>
                    );
                  })()}
                  <div>
                    <strong>{propertyName(inspectionDoc.propertyAddress)}</strong>
                    <span>{inspectionDoc.propertyAddress}</span>
                  </div>
                </div>
              </div>

              <div className="ll-docs-drawer-card">
                <div className="ll-docs-drawer-card-label">Attached Tenant / Applicant</div>
                <div className="ll-docs-drawer-card-row">
                  <div className="ll-docs-drawer-avatar">
                    {initialsFromName(inspectionDoc.tenantName || 'PW')}
                  </div>
                  <div>
                    <strong>{inspectionDoc.tenantName || 'Property-Wide'}</strong>
                    <span>
                      {inspectionDoc.tenantName
                        ? 'Attached to tenancy'
                        : 'Building compliance record'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ll-docs-drawer-section">
                <div className="ll-docs-drawer-card-label">Automated Audit & OCR Metrics</div>
                <div className="ll-docs-drawer-metrics">
                  <div>
                    <span>Document Type / Pillar</span>
                    <strong>{formatDocumentType(inspectionDoc.type)}</strong>
                  </div>
                  <div>
                    <span>OCR Hash Code</span>
                    <strong className="is-mono">{ocrCodeForDocument(inspectionDoc)}</strong>
                  </div>
                  <div>
                    <span>Compliance Notes</span>
                    <strong>
                      {inspectionDoc.status === 'valid'
                        ? 'Passes compliance verification'
                        : inspectionDoc.status === 'expiring-soon'
                          ? 'Renewal window approaching'
                          : 'Requires remediation'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="ll-docs-drawer-section">
                <div className="ll-docs-drawer-card-label">Chain of Custody Audit Trail</div>
                <div className="ll-docs-drawer-trail">
                  <div className="ll-docs-drawer-trail-item">
                    <span className="dot is-green" />
                    <div>
                      <strong>{statusBannerCopy(inspectionDoc.status)}</strong>
                      <span>
                        {userProfile?.name || 'Agent'} · {formatDate(inspectionDoc.issueDate)}
                      </span>
                    </div>
                  </div>
                  <div className="ll-docs-drawer-trail-item">
                    <span className="dot is-blue" />
                    <div>
                      <strong>OCR Extraction Completed</strong>
                      <span>Proptii AI Engine · {formatDate(inspectionDoc.issueDate)}</span>
                    </div>
                  </div>
                  <div className="ll-docs-drawer-trail-item">
                    <span className="dot" />
                    <div>
                      <strong>File Uploaded & Linked</strong>
                      <span>
                        {inspectionDoc.tenantName || 'Agent'} · {formatDate(inspectionDoc.issueDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {shareFeedback && <p className="ll-docs-drawer-feedback">{shareFeedback}</p>}
            </div>

            <div className="ll-docs-drawer-footer">
              <button
                type="button"
                className="ll-docs-drawer-download"
                disabled={
                  !inspectionDoc.url?.trim() ||
                  downloadingKey === documentRowKey(inspectionDoc)
                }
                onClick={() => handleDownloadDocument(inspectionDoc)}
              >
                <Download size={15} />
                Download
              </button>
              <button
                type="button"
                className="ll-docs-drawer-share"
                onClick={() => handleShareDocument(inspectionDoc)}
              >
                <Share2 size={15} />
                Share
              </button>
              <button
                type="button"
                className="ll-docs-drawer-share"
                onClick={() => {
                  const property = getPropertyByDocument(inspectionDoc.propertyId);
                  closeInspectionDrawer();
                  if (property) onManageDocuments(property);
                }}
              >
                <FolderOpen size={15} />
                Manage
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
