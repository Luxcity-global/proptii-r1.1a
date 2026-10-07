/**
 * DocumentManagement
 *
 * Two modes:
 *  - Property mode  (property != null): existing behaviour — saves to property.documents[]
 *  - Vault mode     (property == null): saves to landlord_documents collection via documentService;
 *                   shows an optional "Assign to property" picker after each upload.
 *
 * In both modes the file is uploaded via POST /api/storage/upload first to get a URL.
 */
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  ArrowLeft,
  Upload,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  X,
  Search,
  Filter,
  Plus,
  Building2,
  FolderOpen,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { Property, PropertyDocument } from '../App';
import { propertyService } from '../services/propertyService';
import { documentService, LandlordDocument } from '../services/documentService';
import { downloadPropertyDocument, previewPropertyDocument } from '../utils/downloadPropertyDocument';
import { getResolvedApiBaseUrl } from '../../../config/apiBaseUrl';
import { getAccessTokenForApiRequest } from '../../../services/msalAccessToken';

interface SelectedDocumentForm {
  file: File;
  name: string;
  type: string;
  issueDate: string;
  expiryDate: string;
}

interface DocumentManagementProps {
  property: Property | null;
  /** Available properties — used for the "assign to property" picker in vault mode */
  availableProperties?: Property[];
  userId?: string;
  onBack: () => void;
  onDocumentAdd: (propertyId: string, document: Omit<PropertyDocument, 'id'>) => void;
  onDocumentDelete?: (propertyId: string, documentId: string) => Promise<void>;
  /** Called when a vault document is assigned to a property (vault mode only) */
  onVaultDocumentAdded?: (doc: LandlordDocument) => void;
  /** Called when a vault document is deleted */
  onVaultDocumentDeleted?: (docId: string) => void;
}

const DOCUMENT_TYPES = [
  { value: 'epc',                label: 'EPC Certificate' },
  { value: 'gas-cert',           label: 'Gas Safety Certificate' },
  { value: 'tenancy-agreement',  label: 'Tenancy Agreement' },
  { value: 'insurance',          label: 'Insurance Policy' },
  { value: 'other',              label: 'Other Document' },
];

function computeStatus(expiryDate?: Date | null): PropertyDocument['status'] {
  if (!expiryDate) return 'valid';
  const days = Math.ceil((expiryDate.getTime() - Date.now()) / 86400000);
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring-soon';
  return 'valid';
}

function safeDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const secs = v._seconds ?? v.seconds;
  if (typeof secs === 'number') return new Date(secs * 1000);
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(v: any): string {
  const d = safeDate(v);
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function typeLabel(t: string) {
  return DOCUMENT_TYPES.find(x => x.value === t)?.label || t;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DocumentManagement({
  property,
  availableProperties = [],
  userId,
  onBack,
  onDocumentAdd,
  onDocumentDelete,
  onVaultDocumentAdded,
  onVaultDocumentDeleted,
}: DocumentManagementProps) {
  const isVaultMode = !property;
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(null);

  const [isUploadOpen,        setIsUploadOpen]        = useState(false);
  const [searchTerm,          setSearchTerm]           = useState('');
  const [typeFilter,          setTypeFilter]           = useState('all');
  const [statusFilter,        setStatusFilter]         = useState('all');
  const [selectedForms,       setSelectedForms]        = useState<SelectedDocumentForm[]>([]);
  const [isUploading,         setIsUploading]          = useState(false);
  const [deletingId,          setDeletingId]           = useState<string | null>(null);
  const [downloadingId,       setDownloadingId]        = useState<string | null>(null);
  const [downloadError,       setDownloadError]        = useState<string | null>(null);
  /** Vault mode: documents returned from the backend */
  const [vaultDocs,           setVaultDocs]            = useState<LandlordDocument[]>([]);
  const [vaultLoaded,         setVaultLoaded]          = useState(false);
  const [loadingVault,        setLoadingVault]         = useState(false);

  const fetchVaultDocs = React.useCallback(() => {
    setLoadingVault(true);
    documentService.getUnassignedDocuments()
      .then(docs => { setVaultDocs(docs); setVaultLoaded(true); })
      .catch(err => console.error('[DocumentManagement] vault load error:', err))
      .finally(() => setLoadingVault(false));
  }, []);
  /** After upload in vault mode — pick a property to assign all uploaded docs to */
  const [assignModalDocs,     setAssignModalDocs]      = useState<LandlordDocument[]>([]);
  const [assignModalDoc,      setAssignModalDoc]       = useState<LandlordDocument | null>(null);
  const [assignPropertyId,    setAssignPropertyId]     = useState('');
  const [isAssigning,         setIsAssigning]          = useState(false);

  // ── Load vault docs on first open (vault mode only) ──────────────────────

  React.useEffect(() => {
    if (!isVaultMode || vaultLoaded) return;
    fetchVaultDocs();
  }, [isVaultMode, vaultLoaded, fetchVaultDocs]);

  // ── Document list for display ─────────────────────────────────────────────

  const displayDocs: Array<PropertyDocument | LandlordDocument> = isVaultMode
    ? vaultDocs
    : (property?.documents ?? []);

  const filteredDocs = displayDocs.filter(doc => {
    const haystack = [doc.name, typeLabel(doc.type)].join(' ').toLowerCase();
    const matchesSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());
    const matchesType   = typeFilter   === 'all' || doc.type   === typeFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSelectedForms(prev => [
      ...prev,
      ...files.map(f => ({ file: f, name: f.name.replace(/\.[^/.]+$/, ''), type: '', issueDate: '', expiryDate: '' })),
    ]);
    e.target.value = '';
  };

  const updateForm = <K extends keyof SelectedDocumentForm>(i: number, k: K, v: SelectedDocumentForm[K]) =>
    setSelectedForms(prev => { const u = [...prev]; u[i] = { ...u[i], [k]: v }; return u; });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForms.length) { alert('Select at least one document'); return; }
    const incomplete = selectedForms.find(d => !d.name || !d.type || !d.issueDate);
    if (incomplete) { alert('Fill in all required fields for each document'); return; }

    setIsUploading(true);
    const apiBase = getResolvedApiBaseUrl();
    const createdVaultDocs: LandlordDocument[] = [];

    try {
      for (const form of selectedForms) {
        // 1. Upload file to Firebase Storage via backend
        let url = '';
        try {
          const fd = new FormData();
          fd.append('file', form.file, form.file.name);
          fd.append('folder', 'properties/documents');
          const token = await getAccessTokenForApiRequest().catch(() => null);
          const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await fetch(`${apiBase}/storage/upload`, { method: 'POST', headers, body: fd });
          if (!res.ok) throw new Error(`Storage upload failed (${res.status})`);
          const data = await res.json();
          if (!data.url) throw new Error('No URL returned from storage');
          url = data.url;
        } catch (err) {
          alert(`Upload failed for ${form.file.name}: ${(err as Error).message}`);
          continue;
        }

        const issueDate = new Date(form.issueDate);
        const expiryDate = form.expiryDate ? new Date(form.expiryDate) : undefined;
        const status = computeStatus(expiryDate ?? null);

        if (isVaultMode) {
          // 2a. Save to landlord_documents collection — no property yet
          const doc = await documentService.createDocument({
            name: form.name,
            type: form.type,
            url,
            issueDate,
            expiryDate: expiryDate ?? null,
            propertyId: null,
          });
          createdVaultDocs.push(doc);
          setVaultDocs(prev => [doc, ...prev]);
          onVaultDocumentAdded?.(doc);
        } else {
          // 2b. Property mode — save to property.documents[]
          const newDoc: Omit<PropertyDocument, 'id'> = {
            name: form.name,
            type: form.type as PropertyDocument['type'],
            url,
            issueDate,
            expiryDate,
            status,
          };
          await propertyService.addDocumentToProperty(property!.id, newDoc);
          onDocumentAdd(property!.id, newDoc);
        }
      }

      setSelectedForms([]);
      setIsUploadOpen(false);

      // After all vault uploads complete, offer to assign to a property once
      if (isVaultMode && createdVaultDocs.length > 0) {
        setAssignModalDocs(createdVaultDocs);
        setAssignModalDoc(createdVaultDocs[0]);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // ── Assign to property (vault mode) ──────────────────────────────────────

  const handleAssign = async () => {
    if (!assignModalDoc || !assignPropertyId) return;
    setIsAssigning(true);
    const docsToAssign = assignModalDocs.length > 0 ? assignModalDocs : [assignModalDoc];
    try {
      const prop = availableProperties.find(p => p.id === assignPropertyId);
      for (const doc of docsToAssign) {
        const updated = await documentService.assignToProperty(doc.id, assignPropertyId);
        setVaultDocs(prev => prev.filter(d => d.id !== updated.id));
        if (prop) {
          const asPropertyDoc: Omit<PropertyDocument, 'id'> = {
            name:       updated.name,
            type:       updated.type as PropertyDocument['type'],
            url:        updated.url,
            issueDate:  new Date(updated.issueDate),
            expiryDate: updated.expiryDate ? new Date(updated.expiryDate) : undefined,
            status:     updated.status,
          };
          onDocumentAdd(assignPropertyId, asPropertyDoc);
        }
      }
      setAssignModalDoc(null);
      setAssignModalDocs([]);
      setAssignPropertyId('');
    } catch (err) {
      alert(`Failed to assign: ${(err as Error).message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (docId: string, docName: string) => {
    setDocumentToDelete({ id: docId, name: docName });
  };

  const confirmDelete = async (docId: string) => {
    setDeletingId(docId);
    try {
      if (isVaultMode) {
        await documentService.deleteDocument(docId);
        setVaultDocs(prev => prev.filter(d => d.id !== docId));
        onVaultDocumentDeleted?.(docId);
      } else if (property) {
        if (onDocumentDelete) {
          await onDocumentDelete(property.id, docId);
        } else {
          const updatedDocs = property.documents.filter(d => d.id !== docId);
          await propertyService.updateProperty(property.id, { documents: updatedDocs } as any);
        }
      }
    } catch (err) {
      alert(`Delete failed: ${(err as Error).message}`);
    } finally {
      setDeletingId(null);
      setDocumentToDelete(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const docCount = displayDocs.length;
  const validCount      = displayDocs.filter(d => computeStatus((d as any).expiryDate ? safeDate((d as any).expiryDate) : null) === 'valid').length;
  const expiringSoon    = displayDocs.filter(d => d.status === 'expiring-soon').length;
  const expiredCount    = displayDocs.filter(d => d.status === 'expired').length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="border-b bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="mb-0.5">
                  {isVaultMode ? 'Document Vault — Unassigned' : 'Document Management'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {isVaultMode
                    ? 'Documents not yet linked to a property. Upload here and assign later.'
                    : property?.address}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {isVaultMode && (
                <Button variant="outline" className="flex items-center gap-2 rounded-full px-4"
                  onClick={() => { setVaultLoaded(false); fetchVaultDocs(); }}
                  disabled={loadingVault}
                  title="Refresh vault documents"
                >
                  <RefreshCw className={`w-4 h-4${loadingVault ? ' animate-spin' : ''}`} />
                </Button>
              )}

            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button
                  className="flex items-center gap-2 px-6 py-3 rounded-full"
                  style={{ background: 'linear-gradient(135deg,#DC5F12,#DC5F12)', fontFamily: 'Archivo,sans-serif' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                >
                  <Upload className="w-4 h-4" strokeWidth={2.5} />
                  <span>Upload Document</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 shadow-2xl" style={{ backgroundColor: '#ffffff' }}>
                <DialogHeader>
                  <DialogTitle>Upload New Document{isVaultMode ? ' (Unassigned)' : ''}</DialogTitle>
                </DialogHeader>
                {isVaultMode && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800 mb-2">
                    <FolderOpen className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>This document will be saved to the vault without a property. You can assign it to a property after uploading.</p>
                  </div>
                )}
                <form onSubmit={handleUpload} className="space-y-4">
                  {/* File picker */}
                  <div className="space-y-2">
                    <Label>Document File *</Label>
                    <div
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('dm-file-upload')?.click()}
                    >
                      <input
                        type="file"
                        id="dm-file-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        multiple
                        onChange={handleFileSelect}
                      />
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">Drag & drop or click to browse</p>
                      <span
                        className="inline-flex items-center px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent rounded-md cursor-pointer"
                        onClick={e => { e.stopPropagation(); document.getElementById('dm-file-upload')?.click(); }}
                      >
                        Browse Files
                      </span>
                      <p className="text-xs text-muted-foreground mt-2">PDF, JPG, PNG up to 25MB</p>
                    </div>
                    {selectedForms.length > 0 && (
                      <p className="text-sm text-muted-foreground text-center">
                        {selectedForms.length} file{selectedForms.length > 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>

                  {/* Per-file metadata */}
                  {selectedForms.map((form, i) => (
                    <Card key={form.file.name + form.file.lastModified} className="p-4 border border-muted-foreground/20">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-orange-600" />
                          <div>
                            <p className="text-sm font-medium">{form.file.name}</p>
                            <p className="text-xs text-muted-foreground">{(form.file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedForms(p => p.filter((_, idx) => idx !== i))}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor={`dn-${i}`}>Document Name *</Label>
                          <Input id={`dn-${i}`} value={form.name} onChange={e => updateForm(i, 'name', e.target.value)} required />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`dt-${i}`}>Document Type *</Label>
                          <Select value={form.type} onValueChange={v => updateForm(i, 'type', v)}>
                            <SelectTrigger id={`dt-${i}`}><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                              {DOCUMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`di-${i}`}>Issue Date *</Label>
                          <Input id={`di-${i}`} type="date" value={form.issueDate} onChange={e => updateForm(i, 'issueDate', e.target.value)} required />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`de-${i}`}>Expiry Date</Label>
                          <Input id={`de-${i}`} type="date" value={form.expiryDate} onChange={e => updateForm(i, 'expiryDate', e.target.value)} />
                        </div>
                      </div>
                    </Card>
                  ))}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isUploading || selectedForms.length === 0}>
                      {isUploading ? 'Uploading…' : `Upload Document${selectedForms.length > 1 ? 's' : ''}`}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* ── Assign to property modal (vault mode) ───────────────────────── */}
      {assignModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setAssignModalDoc(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#136C9E]" />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ fontFamily: 'Archivo,sans-serif' }}>Assign to a property?</p>
                <p className="text-xs text-muted-foreground">
                  {assignModalDocs.length > 1
                    ? `${assignModalDocs.length} documents saved to vault`
                    : `"${assignModalDoc.name}" is saved in the vault`}
                </p>
              </div>
            </div>

            {availableProperties.length > 0 ? (
              <>
                <Select value={assignPropertyId} onValueChange={setAssignPropertyId}>
                  <SelectTrigger className="mb-3"><SelectValue placeholder="Select a property (optional)" /></SelectTrigger>
                  <SelectContent>
                    {availableProperties.map(p => <SelectItem key={p.id} value={p.id}>{p.address.split(',')[0]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setAssignModalDoc(null); setAssignModalDocs([]); setAssignPropertyId(''); }}>Keep in vault</Button>
                  <Button className="flex-1" disabled={!assignPropertyId || isAssigning}
                    style={{ background: '#136C9E' }}
                    onClick={handleAssign}>
                    {isAssigning ? 'Assigning…' : 'Assign'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">No properties yet — the document is saved in the vault. Add a property first to assign it.</p>
                <Button variant="outline" className="w-full" onClick={() => setAssignModalDoc(null)}>OK, keep in vault</Button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Documents', value: docCount, icon: <FileText className="w-7 h-7 text-muted-foreground" /> },
            { label: 'Valid',           value: validCount,     icon: <CheckCircle  className="w-7 h-7 text-green-600" />,  cls: 'text-green-600' },
            { label: 'Expiring Soon',   value: expiringSoon,   icon: <Clock        className="w-7 h-7 text-orange-600" />, cls: 'text-orange-600' },
            { label: 'Expired',         value: expiredCount,   icon: <AlertTriangle className="w-7 h-7 text-red-600" />,   cls: 'text-red-600' },
          ].map(s => (
            <Card key={s.label} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">{s.label}</p>
                  <p className={`text-2xl font-semibold ${s.cls || ''}`}>{s.value}</p>
                </div>
                {s.icon}
              </div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="p-5 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input className="pl-10" placeholder="Search documents…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {DOCUMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="valid">Valid</SelectItem>
                  <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Download error banner */}
        {downloadError && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {downloadError}
          </div>
        )}

        {/* Document list */}
        {loadingVault ? (
          <Card className="p-12 text-center">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3 animate-spin" />
            <p className="text-muted-foreground">Loading vault documents…</p>
          </Card>
        ) : filteredDocs.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="mb-2">
              {docCount === 0
                ? isVaultMode ? 'No unassigned documents' : 'No documents uploaded'
                : 'No documents match your filters'}
            </h3>
            <p className="text-muted-foreground mb-6 text-sm">
              {docCount === 0
                ? isVaultMode
                  ? 'Upload compliance certificates or other documents here — assign them to a property at any time.'
                  : 'Upload compliance documents to track their status and never miss renewals.'
                : 'Try adjusting your search or filters.'}
            </p>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />Upload Document
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredDocs.map(doc => {
              const status = doc.status ?? computeStatus(safeDate((doc as any).expiryDate));
              const isLandlordDoc = 'landlordId' in doc; // vault doc
              return (
                <Card key={doc.id} className="p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      {status === 'valid'
                        ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                        : status === 'expiring-soon'
                        ? <Clock className="w-4 h-4 text-orange-600 shrink-0" />
                        : <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{typeLabel(doc.type)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="text-right text-xs text-muted-foreground">
                        <p>Issued: {formatDate((doc as any).issueDate)}</p>
                        {(doc as any).expiryDate && <p>Expires: {formatDate((doc as any).expiryDate)}</p>}
                      </div>

                      {/* Status badge */}
                      {status === 'valid'
                        ? <Badge className="bg-green-100 text-green-800 border-green-200">Valid</Badge>
                        : status === 'expiring-soon'
                        ? <Badge className="bg-orange-100 text-orange-800 border-orange-200">Expiring Soon</Badge>
                        : <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>}

                      {/* Vault doc — show assign button */}
                      {isVaultMode && isLandlordDoc && availableProperties.length > 0 && (
                        <Button variant="outline" size="sm" className="gap-1 text-xs"
                          onClick={() => { setAssignModalDoc(doc as LandlordDocument); setAssignPropertyId(''); }}>
                          <Building2 className="w-3 h-3" /> Assign
                        </Button>
                      )}

                      {/* Preview */}
                      <Button variant="outline" size="sm"
                        title="Preview document"
                        onClick={() => {
                          const url = (doc as any).url;
                          if (!url) {
                            setDownloadError('Document URL not available');
                            setTimeout(() => setDownloadError(null), 3000);
                            return;
                          }
                          try { previewPropertyDocument(url); }
                          catch (err) {
                            setDownloadError((err as Error).message);
                            setTimeout(() => setDownloadError(null), 3000);
                          }
                        }}>
                        <Eye className="w-4 h-4" />
                      </Button>

                      {/* Download */}
                      <Button variant="outline" size="sm"
                        title="Download document"
                        disabled={downloadingId === doc.id}
                        onClick={async () => {
                          const url = (doc as any).url;
                          if (!url) {
                            setDownloadError('Document URL not available');
                            setTimeout(() => setDownloadError(null), 3000);
                            return;
                          }
                          setDownloadingId(doc.id);
                          setDownloadError(null);
                          try {
                            await downloadPropertyDocument(url, doc.name);
                          } catch (err) {
                            setDownloadError((err as Error).message);
                            setTimeout(() => setDownloadError(null), 3000);
                          } finally {
                            setDownloadingId(null);
                          }
                        }}>
                        {downloadingId === doc.id
                          ? <Clock className="w-4 h-4 animate-spin" />
                          : <Download className="w-4 h-4" />}
                      </Button>

                      {/* Delete */}
                      <Button variant="outline" size="sm" disabled={deletingId === doc.id}
                        onClick={() => handleDelete(doc.id)} aria-label="Delete document">
                        {deletingId === doc.id
                          ? <Clock className="w-4 h-4 animate-spin" />
                          : <X className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Compliance tips */}
        <Card className="p-6 mt-8 bg-muted/50">
          <h3 className="mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
            Compliance Reminders
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            {[
              ['Gas Safety Certificate', 'Required annually for all rental properties with gas appliances'],
              ['EPC Certificate',        'Valid for 10 years, minimum rating of E required for rentals'],
              ['Insurance Policy',       'Landlord insurance should cover property damage and liability'],
              ['Tenancy Agreement',      'Keep signed agreements for all current and past tenancies'],
            ].map(([title, desc]) => (
              <div key={title}>
                <h4 className="font-medium mb-1">{title}</h4>
                <p className="text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{documentToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#DC5F12] hover:bg-[#c45310] focus:ring-[#DC5F12] text-white"
              onClick={() => documentToDelete && confirmDelete(documentToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
