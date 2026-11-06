import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import {
  X,
  FileText,
  User,
  Users,
  Mail,
  AlertCircle,
  Send,
  Search,
  PenLine,
  UploadCloud,
  Lock,
} from 'lucide-react';
import { trackEvent } from '../../../utils/analytics';

interface SendContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (contractData: {
    file?: File;
    recipientName: string;
    recipientEmail: string;
    additionalEmail?: string;
  }) => Promise<void>;
  tenants?: Array<{ id: string; name: string; email: string; propertyId?: string }>;
  /** Plan does not include contracts. Shows an upgrade overlay and blocks sending. */
  locked?: boolean;
  /** Plan is still loading. Sending waits until access is known. */
  accessPending?: boolean;
  onUpgrade?: () => void;
}

type RecipientMode = 'existing' | 'manual';

const BRAND_ORANGE = '#DC5F12';
const BRAND_BLUE = '#136C9E';
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const LARGE_FILE_BYTES = 20 * 1024 * 1024;

const pillActive =
  'flex-1 sm:flex-initial justify-center px-3 py-1.5 sm:py-1 text-[11px] font-bold rounded-lg text-white shadow-sm transition-all flex items-center gap-1';
const pillIdle =
  'flex-1 sm:flex-initial justify-center px-3 py-1.5 sm:py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-all flex items-center gap-1';
const inputClass =
  'w-full text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20 transition-all';
const sectionClass = 'bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-3';
const sectionLabelClass = 'text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.slice(0, 3).map((p) => p[0]).join('').toUpperCase();
}

function fileBadge(name: string): string {
  const ext = name.split('.').pop()?.toUpperCase() || 'FILE';
  return ext.length > 4 ? 'FILE' : ext;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 text-red-600 text-xs">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function SendContractModal({
  isOpen,
  onClose,
  onSend,
  tenants = [],
  locked = false,
  accessPending = false,
  onUpgrade,
}: SendContractModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [additionalEmail, setAdditionalEmail] = useState('');
  const [recipientType, setRecipientType] = useState<RecipientMode>('manual');
  const [selectedExistingTenant, setSelectedExistingTenant] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTenantList, setShowTenantList] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const formBodyRef = useRef<HTMLDivElement>(null);

  const existingTenants = useMemo(
    () =>
      tenants.map((t) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        property: t.propertyId || '',
      })),
    [tenants],
  );

  const filteredTenants = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return existingTenants;
    return existingTenants.filter(
      (tenant) =>
        tenant.name.toLowerCase().includes(q) ||
        tenant.email.toLowerCase().includes(q) ||
        tenant.property.toLowerCase().includes(q),
    );
  }, [existingTenants, searchTerm]);

  const selectedTenant = existingTenants.find((t) => t.id === selectedExistingTenant);

  // Open on the tenant picker when the landlord already has tenants.
  useEffect(() => {
    if (isOpen) {
      setRecipientType(existingTenants.length > 0 ? 'existing' : 'manual');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Keeps keyboard focus out of the form while the upgrade overlay covers it.
  useEffect(() => {
    const node = formBodyRef.current;
    if (!node) return;
    if (locked) node.setAttribute('inert', '');
    else node.removeAttribute('inert');
  });

  useEffect(() => {
    if (!showTenantList) return;
    const onPointerDown = (event: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target as Node)) {
        setShowTenantList(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [showTenantList]);

  const acceptContractFile = (file: File | undefined) => {
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedByExtension = extension === 'pdf' || extension === 'doc' || extension === 'docx';
    if (!allowedTypes.includes(file.type) && !allowedByExtension) {
      setErrors((prev) => ({ ...prev, file: 'Please select a PDF or Word document' }));
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setErrors((prev) => ({ ...prev, file: `File size must be less than 50MB. Your file is ${fileSizeMB}MB` }));
      return;
    }

    if (file.size > LARGE_FILE_BYTES) {
      console.warn('Large file detected:', file.size, 'bytes. This may take longer to process.');
    }

    setSelectedFile(file);
    setErrors((prev) => ({ ...prev, file: '' }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    acceptContractFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isUploading) setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    if (isUploading) return;
    acceptContractFile(event.dataTransfer.files?.[0]);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setErrors((prev) => ({ ...prev, file: '' }));
  };

  const handleRecipientTypeChange = (type: RecipientMode) => {
    if (type === recipientType) return;
    setRecipientType(type);
    if (type === 'existing') {
      setRecipientName('');
      setRecipientEmail('');
      setErrors((prev) => ({ ...prev, recipientName: '', recipientEmail: '' }));
    } else {
      setSelectedExistingTenant('');
      setSearchTerm('');
      setShowTenantList(false);
      setErrors((prev) => ({ ...prev, existingTenant: '' }));
    }
  };

  const handleExistingTenantSelect = (tenantId: string) => {
    const tenant = existingTenants.find((t) => t.id === tenantId);
    if (tenant) {
      setSelectedExistingTenant(tenantId);
      setRecipientName(tenant.name);
      setRecipientEmail(tenant.email);
      setShowTenantList(false);
      setSearchTerm('');
      setErrors((prev) => ({ ...prev, recipientName: '', recipientEmail: '', existingTenant: '' }));
    }
  };

  const clearSelectedTenant = () => {
    setSelectedExistingTenant('');
    setRecipientName('');
    setRecipientEmail('');
    setSearchTerm('');
    setShowTenantList(true);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (recipientType === 'manual') {
      if (!recipientName.trim()) {
        newErrors.recipientName = 'Please enter recipient name';
      }
      if (!recipientEmail.trim()) {
        newErrors.recipientEmail = 'Please enter recipient email';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
        newErrors.recipientEmail = 'Please enter a valid email address';
      }
    } else if (!selectedExistingTenant) {
      newErrors.existingTenant = 'Please select an existing tenant';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setSelectedFile(null);
    setRecipientName('');
    setRecipientEmail('');
    setAdditionalEmail('');
    setRecipientType('manual');
    setSelectedExistingTenant('');
    setSearchTerm('');
    setShowTenantList(false);
    setErrors({});
  };

  const handleSend = async () => {
    if (locked || accessPending) return;
    if (!validateForm()) return;

    setIsUploading(true);
    setUploadProgress(0);
    setIsConverting(selectedFile != null);

    try {
      const contractData = {
        file: selectedFile || undefined,
        recipientName: recipientType === 'manual' ? recipientName : selectedTenant?.name || '',
        recipientEmail: recipientType === 'manual' ? recipientEmail : selectedTenant?.email || '',
        additionalEmail: additionalEmail.trim() || undefined,
      };

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev >= 88 ? 88 : prev + 4));
      }, 300);

      try {
        await onSend(contractData);
        clearInterval(progressInterval);
        setUploadProgress(100);
        trackEvent('landlord_contract_sent', { has_file: !!selectedFile });
      } catch (sendError: any) {
        clearInterval(progressInterval);
        setUploadProgress(0);
        setErrors((prev) => ({ ...prev, file: sendError?.message || 'Failed to send contract. Please try again.' }));
        return;
      }

      resetForm();
    } finally {
      setIsUploading(false);
      setIsConverting(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onClose();
      resetForm();
    }
  };

  const sendDisabled = isUploading || locked || accessPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="bg-white w-[calc(100vw-1rem)] sm:w-full max-w-lg sm:max-w-lg p-0 gap-0 rounded-2xl sm:rounded-3xl border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] [&>button:last-child]:hidden"
        style={{ fontFamily: '"Nunito Sans", Archivo, system-ui, sans-serif' }}
      >
        <header className="px-5 sm:px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#fff7ed', color: BRAND_ORANGE }}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-left">
              <DialogTitle
                className="text-base font-extrabold text-slate-900 tracking-tight"
                style={{ fontFamily: 'Archivo, sans-serif' }}
              >
                Send Contract
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Dispatch legal agreement for electronic signing
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="relative flex-1 min-h-0 flex flex-col">
          <div
            className={`flex-1 min-h-0 flex flex-col ${locked ? 'pointer-events-none select-none blur-[2px] opacity-60' : ''}`}
            ref={formBodyRef}
            aria-hidden={locked || undefined}
          >
            <div className="p-5 overflow-y-auto overscroll-contain space-y-4 flex-1 min-h-0 bg-slate-50/40">
              {/* Recipient */}
              <div className={sectionClass}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className={sectionLabelClass} style={{ fontFamily: 'Archivo, sans-serif' }}>
                    <User className="w-3.5 h-3.5 shrink-0" style={{ color: BRAND_BLUE }} />
                    <span>Recipient *</span>
                  </span>
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl w-full sm:w-auto" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={recipientType === 'existing'}
                      onClick={() => handleRecipientTypeChange('existing')}
                      className={recipientType === 'existing' ? pillActive : pillIdle}
                      style={recipientType === 'existing' ? { backgroundColor: BRAND_BLUE } : undefined}
                    >
                      <Users className="w-3 h-3 shrink-0" />
                      <span>Existing Tenant</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={recipientType === 'manual'}
                      onClick={() => handleRecipientTypeChange('manual')}
                      className={recipientType === 'manual' ? pillActive : pillIdle}
                      style={recipientType === 'manual' ? { backgroundColor: BRAND_BLUE } : undefined}
                    >
                      <PenLine className="w-3 h-3 shrink-0" />
                      <span>Manual Entry</span>
                    </button>
                  </div>
                </div>

                {recipientType === 'existing' ? (
                  <div className="space-y-2.5">
                    {selectedTenant ? (
                      <div className="rounded-xl p-3 flex items-center justify-between border bg-[#e8f3f8]/60 border-[#bcd9ea]">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0"
                            style={{ backgroundColor: BRAND_BLUE, fontFamily: 'Archivo, sans-serif' }}
                          >
                            {initials(selectedTenant.name)}
                          </div>
                          <div className="min-w-0 text-left">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-xs text-slate-900 truncate">{selectedTenant.name}</span>
                              {selectedTenant.property && (
                                <span
                                  className="bg-blue-100 text-[9px] font-bold px-1.5 rounded shrink-0 truncate max-w-[120px]"
                                  style={{ color: BRAND_BLUE }}
                                  title={selectedTenant.property}
                                >
                                  {selectedTenant.property}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate" title={selectedTenant.email}>
                              {selectedTenant.email}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearSelectedTenant}
                          className="text-xs font-semibold hover:underline px-2 py-1 shrink-0"
                          style={{ color: BRAND_BLUE }}
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div ref={searchWrapRef} className="relative">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value);
                              setShowTenantList(true);
                            }}
                            onFocus={() => setShowTenantList(true)}
                            placeholder="Search by tenant name, email, or property..."
                            className={`${inputClass} pl-9 pr-8 py-2.5`}
                            aria-label="Search tenants"
                          />
                          {searchTerm && (
                            <button
                              type="button"
                              onClick={() => setSearchTerm('')}
                              className="text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5"
                              aria-label="Clear search"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {showTenantList && (
                          <div className="mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                            {filteredTenants.length === 0 ? (
                              <div className="p-3 text-center text-xs text-slate-400">
                                {existingTenants.length === 0
                                  ? 'You have no tenants yet. Switch to Manual Entry above.'
                                  : `No tenants found matching "${searchTerm}". You can switch to Manual Entry above.`}
                              </div>
                            ) : (
                              filteredTenants.map((tenant) => (
                                <button
                                  type="button"
                                  key={tenant.id}
                                  onClick={() => handleExistingTenantSelect(tenant.id)}
                                  className="w-full p-2.5 hover:bg-blue-50/70 transition-colors flex items-center justify-between text-left"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className="w-8 h-8 rounded-full bg-blue-100 font-bold text-[10px] flex items-center justify-center shrink-0"
                                      style={{ color: BRAND_BLUE }}
                                    >
                                      {initials(tenant.name)}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-xs text-slate-900 truncate">{tenant.name}</div>
                                      <div className="text-[11px] text-slate-500 truncate">{tenant.email}</div>
                                      {tenant.property && (
                                        <div className="text-[10px] text-slate-400 truncate">{tenant.property}</div>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold shrink-0" style={{ color: BRAND_BLUE }}>
                                    Select
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <FieldError message={errors.existingTenant} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label htmlFor="recipient-name" className="block text-[11px] font-semibold text-slate-600">
                        Recipient Name *
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="recipient-name"
                          type="text"
                          placeholder="e.g. Sarah Jenkins"
                          value={recipientName}
                          onChange={(e) => {
                            setRecipientName(e.target.value);
                            setErrors((prev) => ({ ...prev, recipientName: '' }));
                          }}
                          className={`${inputClass} pl-8 pr-3 py-2`}
                        />
                      </div>
                      <FieldError message={errors.recipientName} />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="recipient-email" className="block text-[11px] font-semibold text-slate-600">
                        Recipient Email *
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="recipient-email"
                          type="email"
                          placeholder="name@example.com"
                          value={recipientEmail}
                          onChange={(e) => {
                            setRecipientEmail(e.target.value);
                            setErrors((prev) => ({ ...prev, recipientEmail: '' }));
                          }}
                          className={`${inputClass} pl-8 pr-3 py-2`}
                        />
                      </div>
                      <FieldError message={errors.recipientEmail} />
                    </div>
                  </div>
                )}
              </div>

              {/* Contract document */}
              <div className={sectionClass}>
                <div className="flex items-center justify-between">
                  <span className={sectionLabelClass} style={{ fontFamily: 'Archivo, sans-serif' }}>
                    <FileText className="w-3.5 h-3.5" style={{ color: BRAND_ORANGE }} />
                    <span>Contract Document</span>
                  </span>
                  {selectedFile ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Attached &bull; Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400">Optional</span>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                />

                {selectedFile ? (
                  <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {fileBadge(selectedFile.name)}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="font-bold text-xs text-slate-900 truncate" title={selectedFile.name}>
                          {selectedFile.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          {selectedFile.size > LARGE_FILE_BYTES && (
                            <span className="text-orange-600 ml-1.5">(Large file - may take longer)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-xs font-semibold text-slate-500 hover:text-[#136C9E] px-2 py-1 transition-colors disabled:opacity-50"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        disabled={isUploading}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center disabled:opacity-50"
                        aria-label="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    onDragEnter={handleDragOver}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                      isDragOver ? 'border-[#136C9E] bg-blue-50' : 'border-slate-300 hover:border-[#136C9E] bg-slate-50/70'
                    }`}
                  >
                    <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                    <div className="text-xs font-bold text-slate-800">Click to upload or drag &amp; drop</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Maximum file size: 50MB (PDF, DOC, DOCX)</div>
                  </div>
                )}
                <FieldError message={errors.file} />
              </div>

              {/* Message */}
              <div className={`${sectionClass} space-y-2`}>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="additional-notes"
                    className={sectionLabelClass}
                    style={{ fontFamily: 'Archivo, sans-serif' }}
                  >
                    <PenLine className="w-3.5 h-3.5 text-slate-500" />
                    <span>Message to Recipient</span>
                  </label>
                  <span className="text-[10px] font-semibold text-slate-400">Optional</span>
                </div>
                <textarea
                  id="additional-notes"
                  rows={3}
                  placeholder="Add any instructions or personalised message for the recipient..."
                  value={additionalEmail}
                  onChange={(e) => setAdditionalEmail(e.target.value)}
                  className={`${inputClass} p-3 leading-relaxed resize-y`}
                />
              </div>
            </div>

            <footer className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 shrink-0">
              {isUploading && uploadProgress > 0 && (
                <div className="mb-3">
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%`, backgroundColor: BRAND_BLUE }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 text-center">
                    {isConverting ? 'Processing file...' : 'Uploading...'} {uploadProgress}%
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isUploading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sendDisabled}
                  className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm hover:shadow hover:brightness-95 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-60 disabled:active:scale-100"
                  style={{ backgroundColor: BRAND_ORANGE }}
                >
                  {isUploading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isConverting ? 'Processing file...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send Contract
                    </>
                  )}
                </button>
              </div>
            </footer>
          </div>

          {locked && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-5 bg-white/40">
              <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-xl p-6 text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: '#fff7ed', color: BRAND_ORANGE }}
                >
                  <Lock className="w-6 h-6" />
                </div>
                <h4
                  className="font-extrabold text-base text-slate-900 tracking-tight"
                  style={{ fontFamily: 'Archivo, sans-serif' }}
                >
                  Contracts aren&apos;t included in Explorer
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Upgrade to a paid plan to send contracts to tenants and collect e-signatures.
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  {onUpgrade && (
                    <button
                      type="button"
                      onClick={onUpgrade}
                      className="w-full py-2.5 rounded-xl text-white text-xs font-bold shadow-sm hover:brightness-95 transition-all"
                      style={{ backgroundColor: BRAND_ORANGE }}
                    >
                      Upgrade plan
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
