/**
 * BulkTenantImport — CSV upload → validate → confirm → results
 *
 * Design system: matches drive-download-20261002T082209Z-1-001/index.html
 * Colours: --primary-blue #136C9E, --primary-orange #DC5F12
 * Fonts: Archivo (headings/buttons), Nunito Sans (body)
 * Components: stepper-card, form-card, csv-dropzone, csv-table, dossier-box
 */
import React, { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import {
  ArrowLeft, ArrowRight, Upload, Download, CheckCircle,
  AlertTriangle, XCircle, Loader2, Users, FileText,
  RotateCcw, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import type { Property, UserProfile } from '../App';
import { tenantService } from '../services/tenantService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BulkTenantRow {
  _row: number;
  name: string;
  email: string;
  phone: string;
  propertyAddress?: string;
  rentAmount: string;
  paymentFrequency?: string;
  leaseStart: string;
  leaseEnd: string;
  firstPaymentDate?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelationship?: string;
  employmentType?: string;
  employer?: string;
  annualIncome?: string;
  notes?: string;
  _errors?: string[];
  _status?: 'pending' | 'success' | 'error';
  _resultMessage?: string;
}

interface BulkTenantImportProps {
  properties: Property[];
  userProfile: UserProfile | null;
  userId: string;
  onBack: () => void;
  onComplete: () => void;
}

type Step = 'upload' | 'validate' | 'confirm' | 'results';

// ─── Constants ────────────────────────────────────────────────────────────────

const REQUIRED_COLS = ['name', 'email', 'phone', 'rentAmount', 'leaseStart', 'leaseEnd'];
const MAX_ROWS = 500;

const FREQ_OPTIONS = ['monthly', 'yearly', 'fixed-time'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateRow(row: BulkTenantRow): string[] {
  const errs: string[] = [];
  if (!row.name?.trim() || row.name.trim().length < 2) errs.push('Name required (min 2 chars)');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email?.trim() || '')) errs.push('Valid email required');
  if (!/^[\+]?[\d\s\-\(\)]{7,}$/.test(row.phone?.trim() || '')) errs.push('Valid phone required');
  const rent = parseFloat(row.rentAmount);
  if (!row.rentAmount || isNaN(rent) || rent <= 0) errs.push('Rent must be a positive number');
  if (!row.leaseStart || isNaN(Date.parse(row.leaseStart))) errs.push('Lease start date invalid (use YYYY-MM-DD)');
  if (!row.leaseEnd || isNaN(Date.parse(row.leaseEnd))) errs.push('Lease end date invalid (use YYYY-MM-DD)');
  else if (row.leaseStart && new Date(row.leaseEnd) <= new Date(row.leaseStart)) errs.push('Lease end must be after lease start');
  if (row.paymentFrequency && !FREQ_OPTIONS.includes(row.paymentFrequency)) errs.push(`Payment frequency must be one of: ${FREQ_OPTIONS.join(', ')}`);
  return errs;
}

function fmtDate(s?: string): string {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Shared styles ─────────────────────────────────────────────────────────

const INP = [
  'w-full h-11 bg-white border border-[#e2e8f0] rounded-2xl px-4',
  'font-[Nunito_Sans,sans-serif] text-[14px] text-[#1e293b]',
  'outline-none focus:border-[#136C9E] focus:ring-[3px] focus:ring-[rgba(19,108,158,0.12)]',
  'placeholder:text-[#94a3b8]',
].join(' ');

// ─── Stepper ───────────────────────────────────────────────────────────────

const STEPS: { id: Step; label: string; sub: string }[] = [
  { id: 'upload',   label: 'Step 1', sub: 'Upload CSV' },
  { id: 'validate', label: 'Step 2', sub: 'Review & Fix' },
  { id: 'confirm',  label: 'Step 3', sub: 'Confirm Import' },
  { id: 'results',  label: 'Step 4', sub: 'Results' },
];

function StepperSidebar({ current, counts }: { current: Step; counts: { valid: number; invalid: number; total: number } }) {
  const stepColors = ['#dcf1fc', '#e0f2fe', '#f3e8ff', '#dcfce7'];
  const stepFg     = ['#0284c7', '#0369a1', '#7e22ce', '#16a34a'];
  const stepIcons  = [Upload, CheckCircle, Users, CheckCircle];
  const order: Step[] = ['upload', 'validate', 'confirm', 'results'];
  const currentIdx = order.indexOf(current);

  return (
    <aside
      className="hidden md:flex flex-col w-[270px] shrink-0 sticky top-[88px]"
      style={{
        background: 'white',
        borderRadius: 28,
        boxShadow: '0 20px 45px -12px rgba(19,108,158,0.08),0 4px 16px -2px rgba(0,0,0,0.04)',
        padding: '24px 16px',
      }}
    >
      <div className="px-3 pb-4 mb-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <p className="text-[15px] font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif' }}>Bulk Tenant Import</p>
        <p className="text-[12px] text-[#64748b] mt-0.5">Up to {MAX_ROWS} tenants via CSV</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {STEPS.map((s, i) => {
          const Icon = stepIcons[i];
          const isCurrent = current === s.id;
          const isDone = i < currentIdx;
          return (
            <div
              key={s.id}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-[18px] border transition-all',
                isCurrent
                  ? 'bg-[#edf6fb] border-[rgba(19,108,158,0.15)]'
                  : 'bg-transparent border-transparent',
              ].join(' ')}
            >
              <span className="w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0"
                style={{ background: stepColors[i] }}>
                <Icon size={18} style={{ color: stepFg[i] }} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold" style={{ color: isCurrent ? '#0c4a6e' : '#1e293b', fontFamily: 'Archivo,sans-serif' }}>{s.label}</p>
                <p className="text-[12px] truncate" style={{ color: isCurrent ? '#0284c7' : '#64748b', fontWeight: isCurrent ? 600 : 400 }}>{s.sub}</p>
              </div>
              {isDone && <CheckCircle size={14} className="text-[#0284c7] shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Summary pills */}
      {counts.total > 0 && (
        <div className="mt-5 pt-4 flex flex-col gap-2" style={{ borderTop: '1px solid #f1f5f9' }}>
          <div className="flex items-center justify-between px-3 py-2 rounded-[12px] bg-[#f0fdf4]">
            <span className="text-[12px] text-[#15803d] font-semibold">Valid rows</span>
            <span className="text-[13px] font-bold text-[#15803d]">{counts.valid}</span>
          </div>
          {counts.invalid > 0 && (
            <div className="flex items-center justify-between px-3 py-2 rounded-[12px] bg-[#fff1f2]">
              <span className="text-[12px] text-[#e11d48] font-semibold">Errors</span>
              <span className="text-[13px] font-bold text-[#e11d48]">{counts.invalid}</span>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function BulkTenantImport({ properties, userProfile, userId, onBack, onComplete }: BulkTenantImportProps) {
  const [step, setStep]           = useState<Step>('upload');
  const [rows, setRows]           = useState<BulkTenantRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validRows   = rows.filter(r => !r._errors?.length);
  const invalidRows = rows.filter(r => r._errors?.length);
  const counts = { valid: validRows.length, invalid: invalidRows.length, total: rows.length };

  // ── Parse CSV ────────────────────────────────────────────────────────────

  const parseFile = useCallback((file: File) => {
    setParseError(null);
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setParseError('Only CSV files are supported.');
      return;
    }
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().replace(/\s+/g, '').replace(/^"|"$/g, ''),
      complete: (results) => {
        const headers = results.meta.fields || [];
        const missing = REQUIRED_COLS.filter(c => !headers.includes(c));
        if (missing.length) {
          setParseError(`Missing required columns: ${missing.join(', ')}. Download the template to see the correct format.`);
          return;
        }
        if (results.data.length > MAX_ROWS) {
          setParseError(`CSV has ${results.data.length} rows — maximum is ${MAX_ROWS}.`);
          return;
        }
        if (results.data.length === 0) {
          setParseError('CSV file is empty.');
          return;
        }
        const parsed: BulkTenantRow[] = results.data.map((raw, i) => {
          const row: BulkTenantRow = {
            _row: i + 2, // 1-indexed, +1 for header
            name:                  (raw.name || '').trim(),
            email:                 (raw.email || '').trim().toLowerCase(),
            phone:                 (raw.phone || '').trim(),
            propertyAddress:       (raw.propertyAddress || '').trim(),
            rentAmount:            (raw.rentAmount || '').trim(),
            paymentFrequency:      (raw.paymentFrequency || 'monthly').trim().toLowerCase(),
            leaseStart:            (raw.leaseStart || '').trim(),
            leaseEnd:              (raw.leaseEnd || '').trim(),
            firstPaymentDate:      (raw.firstPaymentDate || raw.leaseStart || '').trim(),
            emergencyName:         (raw.emergencyName || '').trim(),
            emergencyPhone:        (raw.emergencyPhone || '').trim(),
            emergencyRelationship: (raw.emergencyRelationship || '').trim(),
            employmentType:        (raw.employmentType || '').trim(),
            employer:              (raw.employer || '').trim(),
            annualIncome:          (raw.annualIncome || '').trim(),
            notes:                 (raw.notes || '').trim(),
            _status: 'pending',
          };
          row._errors = validateRow(row);
          return row;
        });
        setRows(parsed);
        setStep('validate');
      },
      error: (err) => {
        setParseError(`Failed to parse CSV: ${err.message}`);
      },
    });
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = '';
  }, [parseFile]);

  // ── Inline edit ──────────────────────────────────────────────────────────

  function editRow(rowIdx: number, field: keyof BulkTenantRow, value: string) {
    setRows(prev => prev.map((r, i) => {
      if (i !== rowIdx) return r;
      const updated = { ...r, [field]: value };
      updated._errors = validateRow(updated);
      return updated;
    }));
  }

  function removeRow(rowIdx: number) {
    setRows(prev => prev.filter((_, i) => i !== rowIdx));
  }

  function toggleExpand(rowIdx: number) {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(rowIdx) ? next.delete(rowIdx) : next.add(rowIdx);
      return next;
    });
  }

  // ── Import ───────────────────────────────────────────────────────────────

  async function runImport() {
    setIsImporting(true);
    const updated = [...rows];

    for (let i = 0; i < updated.length; i++) {
      const row = updated[i];
      if (row._errors?.length) {
        updated[i] = { ...row, _status: 'error', _resultMessage: 'Skipped due to validation errors' };
        continue;
      }
      try {
        // Find matching property by address (optional)
        const matchedProp = properties.find(p =>
          p.address.toLowerCase().trim() === (row.propertyAddress || '').toLowerCase().trim()
        );
        const payload: any = {
          name:              row.name,
          email:             row.email,
          phone:             row.phone,
          propertyId:        matchedProp?.id || '',
          propertyAddress:   matchedProp?.address || row.propertyAddress || '',
          rentAmount:        parseFloat(row.rentAmount),
          paymentFrequency:  row.paymentFrequency || 'monthly',
          firstPaymentDate:  row.firstPaymentDate ? new Date(row.firstPaymentDate) : new Date(row.leaseStart),
          leaseStart:        new Date(row.leaseStart),
          leaseEnd:          new Date(row.leaseEnd),
          status:            'active',
          referencingStatus: 'not-started',
          paymentStatus:     'current',
          userId,
          ...(row.emergencyName && {
            emergencyContact: {
              name:         row.emergencyName,
              phone:        row.emergencyPhone || '',
              relationship: row.emergencyRelationship || '',
            },
          }),
          ...(row.employmentType && { employmentType: row.employmentType }),
          ...(row.employer     && { employer:       row.employer }),
          ...(row.annualIncome && { annualIncome:   parseFloat(row.annualIncome) }),
          ...(row.notes        && { notes:          row.notes }),
          defaultRiskScore: 75,
        };

        await tenantService.createTenant(payload, userId);
        updated[i] = { ...row, _status: 'success', _resultMessage: 'Imported successfully' };
      } catch (err: any) {
        updated[i] = { ...row, _status: 'error', _resultMessage: err?.message || 'Import failed' };
      }

      // Update state progressively so user sees live results
      setRows([...updated]);

      // 50ms delay between writes
      if (i < updated.length - 1) {
        await new Promise(r => setTimeout(r, 50));
      }
    }

    setIsImporting(false);
    setStep('results');
  }

  // ── Download error report ────────────────────────────────────────────────

  function downloadErrorReport() {
    const failed = rows.filter(r => r._status === 'error' || r._errors?.length);
    if (!failed.length) return;
    const headers = ['row', 'name', 'email', 'phone', 'errors'];
    const csvRows = failed.map(r => [
      r._row,
      r.name,
      r.email,
      r.phone,
      (r._errors?.join('; ') || r._resultMessage || ''),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob(['\uFEFF' + [headers.join(','), ...csvRows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'tenant-import-errors.csv';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  const succeeded = rows.filter(r => r._status === 'success').length;
  const failed    = rows.filter(r => r._status === 'error').length;

  // ── Shell layout ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f7fafc', fontFamily: 'Nunito Sans,sans-serif' }}>
      {/* Navbar */}
      <header
        className="h-[68px] px-6 flex items-center justify-between sticky top-0 z-50"
        style={{ backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.72)', borderBottom: '1px solid rgba(226,232,240,0.65)' }}
      >
        <div className="flex items-center gap-4">
          <button type="button" onClick={onBack}
            className="w-9 h-9 rounded-full border border-[#e2e8f0] bg-white flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-all">
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <nav className="hidden sm:flex items-center gap-2 text-[13px]" style={{ fontFamily: 'Nunito Sans,sans-serif' }}>
            <span className="text-[#94a3b8] text-[11px]">/</span>
            <span className="font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif' }}>Bulk Tenant Import</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/templates/tenant-import-template.csv"
            download
            className="flex items-center gap-1.5 text-[12px] font-semibold text-[#136C9E] hover:underline"
            style={{ fontFamily: 'Archivo,sans-serif' }}
          >
            <Download size={14} /> Download Template
          </a>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 flex items-start justify-center px-4 pt-10 pb-16">
        <div className="flex items-start gap-8 w-full max-w-[1060px]">
          <StepperSidebar current={step} counts={counts} />

          {/* Main card */}
          <section
            className="flex-1 min-w-0"
            style={{
              background: 'white',
              borderRadius: 28,
              boxShadow: '0 20px 45px -12px rgba(19,108,158,0.08),0 4px 16px -2px rgba(0,0,0,0.04)',
              padding: '40px 42px 44px',
            }}
          >
            {/* ── Step 1: Upload ─────────────────────────────────────────── */}
            {step === 'upload' && (
              <div>
                <h1 className="text-[24px] font-bold text-center mb-1" style={{ fontFamily: 'Archivo,sans-serif', color: '#1e293b' }}>
                  Import Tenants via CSV
                </h1>
                <p className="text-[13.5px] text-[#64748b] text-center mb-8">
                  Upload a CSV file with up to {MAX_ROWS} tenants. Property assignment is optional.
                </p>

                {/* Dropzone */}
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer flex flex-col items-center justify-center gap-4 rounded-[22px] border-2 border-dashed transition-all"
                  style={{
                    borderColor: isDragging ? '#136C9E' : '#cbd5e1',
                    background: isDragging ? 'rgba(19,108,158,0.04)' : '#fafbfc',
                    padding: '52px 24px',
                  }}
                >
                  <div className="w-16 h-16 rounded-[18px] flex items-center justify-center"
                    style={{ background: '#dcf1fc' }}>
                    <Upload size={28} style={{ color: '#136C9E' }} />
                  </div>
                  <div className="text-center">
                    <p className="text-[15px] font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif' }}>
                      {isDragging ? 'Drop your CSV here' : 'Drag & drop your CSV file'}
                    </p>
                    <p className="text-[13px] text-[#64748b] mt-1">or click to browse — max {MAX_ROWS} rows</p>
                  </div>
                  <span className="px-5 py-2 rounded-full border border-[#136C9E] text-[#136C9E] text-[13px] font-semibold hover:bg-[#eaf3f8] transition-colors"
                    style={{ fontFamily: 'Archivo,sans-serif' }}>
                    Choose file
                  </span>
                </div>
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />

                {parseError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl border border-red-200 bg-red-50 mt-5">
                    <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-[13px] text-red-700">{parseError}</p>
                  </div>
                )}

                {/* Required columns */}
                <div className="mt-7 p-4 rounded-[16px] bg-[#f8fafc] border border-[#e2e8f0]">
                  <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#475569] mb-3" style={{ fontFamily: 'Archivo,sans-serif' }}>
                    Required columns
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {REQUIRED_COLS.map(c => (
                      <span key={c} className="px-3 py-1 rounded-full bg-[#136C9E] text-white text-[11px] font-semibold"
                        style={{ fontFamily: 'Archivo,sans-serif' }}>{c}</span>
                    ))}
                  </div>
                  <p className="text-[12px] text-[#64748b] mt-3">
                    Optional: propertyAddress, paymentFrequency, firstPaymentDate, emergencyName, emergencyPhone, emergencyRelationship, employmentType, employer, annualIncome, notes
                  </p>
                  <p className="text-[12px] text-[#94a3b8] mt-2">Dates must be in <strong>YYYY-MM-DD</strong> format. propertyAddress is optional — assign tenants to properties separately after import.</p>
                </div>
              </div>
            )}

            {/* ── Step 2: Validate ───────────────────────────────────────── */}
            {step === 'validate' && (
              <div>
                <h1 className="text-[22px] font-bold mb-1" style={{ fontFamily: 'Archivo,sans-serif', color: '#1e293b' }}>
                  Review & Fix Errors
                </h1>
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 rounded-full bg-[#f0fdf4] text-[#15803d] text-[12px] font-semibold">{validRows.length} valid</span>
                  {invalidRows.length > 0 && (
                    <span className="px-3 py-1 rounded-full bg-[#fff1f2] text-[#e11d48] text-[12px] font-semibold">{invalidRows.length} with errors</span>
                  )}
                  <span className="text-[12px] text-[#64748b]">{rows.length} total rows</span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-[16px] border border-[#e2e8f0]" style={{ maxHeight: 480, overflowY: 'auto' }}>
                  <table className="w-full text-[13px]" style={{ fontFamily: 'Nunito Sans,sans-serif', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b] w-10">#</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Name</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Email</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Rent</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Lease Start</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Status</th>
                        <th className="px-4 py-3 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => {
                        const hasErr = (row._errors?.length || 0) > 0;
                        const isExpanded = expandedRows.has(idx);
                        return (
                          <React.Fragment key={idx}>
                            <tr
                              style={{
                                background: hasErr ? '#fff8f8' : 'white',
                                borderBottom: '1px solid #f1f5f9',
                              }}
                            >
                              <td className="px-4 py-3 text-[#94a3b8]">{row._row}</td>
                              <td className="px-4 py-3">
                                {hasErr ? (
                                  <input
                                    className={INP + ' h-9 text-[13px]'}
                                    value={row.name}
                                    onChange={e => editRow(idx, 'name', e.target.value)}
                                    style={{ borderColor: '#fca5a5' }}
                                  />
                                ) : (
                                  <span className="font-semibold text-[#1e293b]">{row.name || '—'}</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {hasErr ? (
                                  <input
                                    className={INP + ' h-9 text-[13px]'}
                                    value={row.email}
                                    onChange={e => editRow(idx, 'email', e.target.value)}
                                    style={{ borderColor: row._errors?.some(e => e.includes('email')) ? '#fca5a5' : '#e2e8f0' }}
                                  />
                                ) : (
                                  <span className="text-[#475569]">{row.email || '—'}</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {hasErr ? (
                                  <input
                                    className={INP + ' h-9 text-[13px] w-24'}
                                    value={row.rentAmount}
                                    onChange={e => editRow(idx, 'rentAmount', e.target.value)}
                                    style={{ borderColor: row._errors?.some(e => e.includes('Rent')) ? '#fca5a5' : '#e2e8f0' }}
                                  />
                                ) : (
                                  <span className="font-semibold text-[#1e293b]">£{parseFloat(row.rentAmount || '0').toLocaleString()}</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {hasErr ? (
                                  <input
                                    type="date"
                                    className={INP + ' h-9 text-[13px] w-36'}
                                    value={row.leaseStart}
                                    onChange={e => editRow(idx, 'leaseStart', e.target.value)}
                                    style={{ borderColor: row._errors?.some(e => e.includes('start')) ? '#fca5a5' : '#e2e8f0' }}
                                  />
                                ) : (
                                  <span className="text-[#475569]">{fmtDate(row.leaseStart)}</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {hasErr ? (
                                  <span className="flex items-center gap-1 text-[#e11d48] text-[12px] font-semibold">
                                    <XCircle size={13} /> {row._errors!.length} error{row._errors!.length > 1 ? 's' : ''}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[#15803d] text-[12px] font-semibold">
                                    <CheckCircle size={13} /> Valid
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  {hasErr && (
                                    <button type="button" onClick={() => toggleExpand(idx)}
                                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9]">
                                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                  )}
                                  <button type="button" onClick={() => removeRow(idx)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-[#e11d48] hover:bg-[#fff1f2]">
                                    <X size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && hasErr && (
                              <tr style={{ background: '#fff8f8', borderBottom: '1px solid #f1f5f9' }}>
                                <td colSpan={7} className="px-4 pb-3">
                                  <div className="flex flex-col gap-1 pt-1">
                                    {row._errors!.map((err, ei) => (
                                      <p key={ei} className="text-[12px] text-[#dc2626] flex items-center gap-1.5">
                                        <AlertTriangle size={11} /> {err}
                                      </p>
                                    ))}
                                  </div>
                                  {/* Extra editable fields for date fixes */}
                                  <div className="mt-3 grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[11px] font-semibold text-[#475569] mb-1">Phone</label>
                                      <input className={INP + ' h-9 text-[13px]'} value={row.phone} onChange={e => editRow(idx, 'phone', e.target.value)} />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-semibold text-[#475569] mb-1">Lease End</label>
                                      <input type="date" className={INP + ' h-9 text-[13px]'} value={row.leaseEnd} onChange={e => editRow(idx, 'leaseEnd', e.target.value)} />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => { setRows([]); setStep('upload'); }}
                    className="h-[48px] px-5 rounded-[14px] border font-semibold flex items-center gap-2 transition-all hover:bg-[#f8fafc]"
                    style={{ borderColor: '#e2e8f0', color: '#64748b', fontFamily: 'Archivo,sans-serif', fontSize: 14 }}>
                    <RotateCcw size={15} /> Upload new file
                  </button>
                  <button type="button" onClick={() => setStep('confirm')} disabled={validRows.length === 0}
                    className="flex-1 h-[48px] rounded-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px disabled:opacity-40"
                    style={{ background: '#136C9E', fontFamily: 'Archivo,sans-serif', fontSize: 15, boxShadow: '0 4px 14px rgba(19,108,158,0.28)' }}>
                    Continue with {validRows.length} valid rows <ArrowRight size={17} />
                  </button>
                </div>
                {invalidRows.length > 0 && validRows.length > 0 && (
                  <p className="text-[12px] text-[#94a3b8] text-center mt-3">
                    {invalidRows.length} row{invalidRows.length > 1 ? 's' : ''} with errors will be skipped. Fix them above or remove them to include all rows.
                  </p>
                )}
              </div>
            )}

            {/* ── Step 3: Confirm ─────────────────────────────────────────── */}
            {step === 'confirm' && (
              <div>
                <h1 className="text-[22px] font-bold mb-1" style={{ fontFamily: 'Archivo,sans-serif', color: '#1e293b' }}>
                  Confirm Import
                </h1>
                <p className="text-[13.5px] text-[#64748b] mb-6">
                  You are about to import <strong>{validRows.length}</strong> tenant{validRows.length !== 1 ? 's' : ''}.
                  {invalidRows.length > 0 && ` ${invalidRows.length} row${invalidRows.length > 1 ? 's' : ''} with errors will be skipped.`}
                </p>

                {/* Summary dossier boxes */}
                <div className="flex flex-col gap-3 mb-6" style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {validRows.map((row, i) => {
                    const matchedProp = properties.find(p =>
                      p.address.toLowerCase().trim() === (row.propertyAddress || '').toLowerCase().trim()
                    );
                    return (
                      <div key={i} className="p-4 rounded-[16px] border border-[#e2e8f0] bg-[#f8fafc]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[12px] bg-[#136C9E] text-white flex items-center justify-center text-sm font-bold shrink-0"
                            style={{ fontFamily: 'Archivo,sans-serif' }}>
                            {(row.name.trim().split(/\s+/).map(n => n[0] || '').join('').toUpperCase().slice(0, 2)) || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[14px] text-[#1e293b] truncate" style={{ fontFamily: 'Archivo,sans-serif' }}>{row.name}</p>
                            <p className="text-[12px] text-[#64748b] truncate">{row.email} · {row.phone}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-[14px] text-[#1e293b]">£{parseFloat(row.rentAmount).toLocaleString()}<span className="text-[11px] text-[#64748b] font-normal">/{row.paymentFrequency || 'mo'}</span></p>
                            <p className="text-[11px] text-[#64748b]">{fmtDate(row.leaseStart)} – {fmtDate(row.leaseEnd)}</p>
                          </div>
                        </div>
                        {row.propertyAddress && (
                          <p className="text-[12px] mt-2 flex items-center gap-1.5" style={{ color: matchedProp ? '#15803d' : '#94a3b8' }}>
                            {matchedProp ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                            {matchedProp ? `→ ${matchedProp.address}` : `Property not found: "${row.propertyAddress}" (will import without assignment)`}
                          </p>
                        )}
                        {!row.propertyAddress && (
                          <p className="text-[12px] text-[#94a3b8] mt-1.5">No property assigned — use Bulk Assign after import</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep('validate')}
                    className="h-[50px] px-5 rounded-[14px] border font-semibold flex items-center gap-2 transition-all hover:bg-[#f8fafc]"
                    style={{ borderColor: '#136C9E', color: '#136C9E', fontFamily: 'Archivo,sans-serif', fontSize: 14 }}>
                    <ArrowLeft size={15} /> Back
                  </button>
                  <button type="button" onClick={runImport} disabled={isImporting}
                    className="flex-1 h-[50px] rounded-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                    style={{ background: '#DC5F12', fontFamily: 'Archivo,sans-serif', fontSize: 15, boxShadow: '0 4px 14px rgba(220,95,18,0.32)' }}>
                    {isImporting
                      ? <><Loader2 size={18} className="animate-spin" /> Importing…</>
                      : <><CheckCircle size={18} /> Import {validRows.length} Tenant{validRows.length !== 1 ? 's' : ''}</>}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 4: Results ─────────────────────────────────────────── */}
            {step === 'results' && (
              <div>
                <div className="text-center mb-7">
                  <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: succeeded > 0 ? '#dcfce7' : '#fff1f2', boxShadow: `0 6px 20px ${succeeded > 0 ? 'rgba(22,163,74,0.18)' : 'rgba(225,29,72,0.12)'}` }}>
                    {succeeded > 0
                      ? <CheckCircle size={36} className="text-[#16a34a]" />
                      : <XCircle size={36} className="text-[#e11d48]" />}
                  </div>
                  <h1 className="text-[22px] font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif' }}>
                    Import Complete
                  </h1>
                  <p className="text-[13.5px] text-[#64748b] mt-1">
                    <strong className="text-[#15803d]">{succeeded} succeeded</strong>
                    {failed > 0 && <> · <strong className="text-[#e11d48]">{failed} failed</strong></>}
                  </p>
                </div>

                {/* Results table */}
                <div className="overflow-x-auto rounded-[16px] border border-[#e2e8f0] mb-6" style={{ maxHeight: 380, overflowY: 'auto' }}>
                  <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Name</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Email</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Result</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: row._status === 'error' ? '#fff8f8' : 'white' }}>
                          <td className="px-4 py-3 font-semibold text-[#1e293b]">{row.name}</td>
                          <td className="px-4 py-3 text-[#475569]">{row.email}</td>
                          <td className="px-4 py-3">
                            {row._status === 'success'
                              ? <span className="flex items-center gap-1 text-[#15803d] font-semibold"><CheckCircle size={13} /> Success</span>
                              : <span className="flex items-center gap-1 text-[#e11d48] font-semibold"><XCircle size={13} /> Failed</span>}
                          </td>
                          <td className="px-4 py-3 text-[12px] text-[#64748b]">{row._resultMessage || (row._errors?.join('; '))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3">
                  {failed > 0 && (
                    <button type="button" onClick={downloadErrorReport}
                      className="flex items-center gap-2 h-[48px] px-5 rounded-[14px] border font-semibold transition-all hover:bg-[#f8fafc]"
                      style={{ borderColor: '#e2e8f0', color: '#64748b', fontFamily: 'Archivo,sans-serif', fontSize: 13.5 }}>
                      <Download size={15} /> Download Error Report
                    </button>
                  )}
                  <button type="button" onClick={onComplete}
                    className="flex-1 h-[48px] rounded-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
                    style={{ background: '#136C9E', fontFamily: 'Archivo,sans-serif', fontSize: 15, boxShadow: '0 4px 14px rgba(19,108,158,0.28)' }}>
                    <CheckCircle size={17} /> Done — View Tenants
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default BulkTenantImport;
