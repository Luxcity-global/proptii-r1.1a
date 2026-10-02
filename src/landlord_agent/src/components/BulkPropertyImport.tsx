/**
 * BulkPropertyImport — CSV upload → validate → confirm → results
 *
 * Same design system as BulkTenantImport.
 * Colours: #136C9E blue, #DC5F12 orange
 */
import React, { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import {
  ArrowLeft, ArrowRight, Upload, Download, CheckCircle,
  AlertTriangle, XCircle, Loader2, Home, RotateCcw,
  ChevronDown, ChevronUp, X, Camera,
} from 'lucide-react';
import type { UserProfile } from '../App';
import { propertyService } from '../services/propertyService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BulkPropertyRow {
  _row: number;
  address: string;
  type: string;
  bedrooms: string;
  bathrooms?: string;
  squareFootage?: string;
  rent: string;
  status?: string;
  amenities?: string;
  notes?: string;
  _errors?: string[];
  _status?: 'pending' | 'success' | 'error';
  _resultMessage?: string;
}

interface BulkPropertyImportProps {
  userProfile: UserProfile | null;
  userId: string;
  userEmail?: string;
  onBack: () => void;
  onComplete: () => void;
  /** Called with IDs of successfully imported properties to open the enrichment queue */
  onEnrich?: (importedIds: string[]) => void;
}

type Step = 'upload' | 'validate' | 'confirm' | 'results';

const REQUIRED_COLS = ['address', 'type', 'bedrooms', 'rent'];
const MAX_ROWS = 500;
const VALID_STATUSES = ['vacant', 'occupied', 'under-renovation'];
const VALID_TYPES = ['Flat', 'House', 'Studio', 'HMO', 'Maisonette', 'Bungalow', 'Commercial', 'Other'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateRow(row: BulkPropertyRow): string[] {
  const errs: string[] = [];
  if (!row.address?.trim() || row.address.trim().length < 5) errs.push('Address required (min 5 chars)');
  if (!row.type?.trim()) errs.push('Property type required');
  const beds = parseInt(row.bedrooms);
  if (!row.bedrooms || isNaN(beds) || beds < 0 || beds > 50) errs.push('Bedrooms must be a number 0–50');
  const rent = parseFloat(row.rent);
  if (!row.rent || isNaN(rent) || rent < 0) errs.push('Rent must be a non-negative number');
  if (row.status && !VALID_STATUSES.includes(row.status.toLowerCase())) errs.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  if (row.bathrooms) {
    const baths = parseFloat(row.bathrooms);
    if (isNaN(baths) || baths < 0) errs.push('Bathrooms must be a positive number');
  }
  return errs;
}

const INP = [
  'w-full h-11 bg-white border border-[#e2e8f0] rounded-2xl px-4',
  'font-[Nunito_Sans,sans-serif] text-[14px] text-[#1e293b]',
  'outline-none focus:border-[#136C9E] focus:ring-[3px] focus:ring-[rgba(19,108,158,0.12)]',
  'placeholder:text-[#94a3b8]',
].join(' ');

// ─── Stepper ─────────────────────────────────────────────────────────────────

const STEPS: { id: Step; label: string; sub: string }[] = [
  { id: 'upload',   label: 'Step 1', sub: 'Upload CSV' },
  { id: 'validate', label: 'Step 2', sub: 'Review & Fix' },
  { id: 'confirm',  label: 'Step 3', sub: 'Confirm Import' },
  { id: 'results',  label: 'Step 4', sub: 'Results' },
];

function StepperSidebar({ current, counts }: { current: Step; counts: { valid: number; invalid: number; total: number } }) {
  const stepColors = ['#dcf1fc', '#e0f2fe', '#f3e8ff', '#dcfce7'];
  const stepFg     = ['#0284c7', '#0369a1', '#7e22ce', '#16a34a'];
  const stepIcons  = [Upload, CheckCircle, Home, CheckCircle];
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
        <p className="text-[15px] font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif' }}>Bulk Property Import</p>
        <p className="text-[12px] text-[#64748b] mt-0.5">Up to {MAX_ROWS} properties via CSV</p>
      </div>
      <div className="flex flex-col gap-2.5">
        {STEPS.map((s, i) => {
          const Icon = stepIcons[i];
          const isCurrent = current === s.id;
          const isDone = i < currentIdx;
          return (
            <div key={s.id}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-[18px] border transition-all',
                isCurrent ? 'bg-[#edf6fb] border-[rgba(19,108,158,0.15)]' : 'bg-transparent border-transparent',
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export function BulkPropertyImport({ userProfile, userId, userEmail, onBack, onComplete, onEnrich }: BulkPropertyImportProps) {
  const [step, setStep]           = useState<Step>('upload');
  const [rows, setRows]           = useState<BulkPropertyRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validRows   = rows.filter(r => !r._errors?.length);
  const invalidRows = rows.filter(r => r._errors?.length);
  const counts = { valid: validRows.length, invalid: invalidRows.length, total: rows.length };

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
          setParseError(`Missing required columns: ${missing.join(', ')}`);
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
        const parsed: BulkPropertyRow[] = results.data.map((raw, i) => {
          const row: BulkPropertyRow = {
            _row:         i + 2,
            address:      (raw.address || '').trim(),
            type:         (raw.type || '').trim(),
            bedrooms:     (raw.bedrooms || '').trim(),
            bathrooms:    (raw.bathrooms || '').trim() || undefined,
            squareFootage:(raw.squareFootage || '').trim() || undefined,
            rent:         (raw.rent || '').trim(),
            status:       (raw.status || 'vacant').trim().toLowerCase(),
            amenities:    (raw.amenities || '').trim() || undefined,
            notes:        (raw.notes || '').trim() || undefined,
            _status: 'pending',
          };
          row._errors = validateRow(row);
          return row;
        });
        setRows(parsed);
        setStep('validate');
      },
      error: (err) => setParseError(`Failed to parse CSV: ${err.message}`),
    });
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = '';
  }, [parseFile]);

  function editRow(rowIdx: number, field: keyof BulkPropertyRow, value: string) {
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

  async function runImport() {
    setIsImporting(true);
    const updated = [...rows];
    const successIds: string[] = [];

    for (let i = 0; i < updated.length; i++) {
      const row = updated[i];
      if (row._errors?.length) {
        updated[i] = { ...row, _status: 'error', _resultMessage: 'Skipped due to validation errors' };
        continue;
      }
      try {
        const amenitiesArr = row.amenities
          ? row.amenities.split(';').map(a => a.trim()).filter(Boolean)
          : [];

        const payload: any = {
          address:      row.address,
          type:         row.type,
          bedrooms:     parseInt(row.bedrooms) || 1,
          rent:         parseFloat(row.rent) || 0,
          status:       (row.status as any) || 'vacant',
          amenities:    amenitiesArr,
          notes:        row.notes || '',
          photos:       [],
          documents:    [],
          ...(row.bathrooms    && { bathrooms:     parseFloat(row.bathrooms) }),
          ...(row.squareFootage && { squareFootage: parseFloat(row.squareFootage) }),
        };

        const newId = await propertyService.createProperty(payload, userId, userEmail);
        successIds.push(newId);
        updated[i] = { ...row, _status: 'success', _resultMessage: 'Imported successfully' };
      } catch (err: any) {
        updated[i] = { ...row, _status: 'error', _resultMessage: err?.message || 'Import failed' };
      }

      setRows([...updated]);
      if (i < updated.length - 1) await new Promise(r => setTimeout(r, 50));
    }

    setImportedIds(successIds);
    setIsImporting(false);
    setStep('results');
  }

  function downloadErrorReport() {
    const failed = rows.filter(r => r._status === 'error' || r._errors?.length);
    if (!failed.length) return;
    const csvRows = failed.map(r => [r._row, r.address, r.type, r.bedrooms, r.rent,
      r._errors?.join('; ') || r._resultMessage || ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob(['\uFEFF' + ['row,address,type,bedrooms,rent,errors', ...csvRows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'property-import-errors.csv';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const succeeded = rows.filter(r => r._status === 'success').length;
  const failed    = rows.filter(r => r._status === 'error').length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f7fafc', fontFamily: 'Nunito Sans,sans-serif' }}>
      {/* Navbar */}
      <header className="h-[68px] px-6 flex items-center justify-between sticky top-0 z-50"
        style={{ backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.72)', borderBottom: '1px solid rgba(226,232,240,0.65)' }}>
        <div className="flex items-center gap-4">
          <button type="button" onClick={onBack}
            className="w-9 h-9 rounded-full border border-[#e2e8f0] bg-white flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-all">
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <span className="font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif', fontSize: 15 }}>Bulk Property Import</span>
        </div>
        <a href="/templates/property-import-template.csv" download
          className="flex items-center gap-1.5 text-[12px] font-semibold text-[#136C9E] hover:underline"
          style={{ fontFamily: 'Archivo,sans-serif' }}>
          <Download size={14} /> Download Template
        </a>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 pt-10 pb-16">
        <div className="flex items-start gap-8 w-full max-w-[1060px]">
          <StepperSidebar current={step} counts={counts} />

          <section className="flex-1 min-w-0"
            style={{ background: 'white', borderRadius: 28, boxShadow: '0 20px 45px -12px rgba(19,108,158,0.08),0 4px 16px -2px rgba(0,0,0,0.04)', padding: '40px 42px 44px' }}>

            {/* ── Step 1: Upload ──────────────────────────────────────────── */}
            {step === 'upload' && (
              <div>
                <h1 className="text-[24px] font-bold text-center mb-1" style={{ fontFamily: 'Archivo,sans-serif', color: '#1e293b' }}>
                  Import Properties via CSV
                </h1>
                <p className="text-[13.5px] text-[#64748b] text-center mb-8">
                  Upload up to {MAX_ROWS} properties at once. Tenants can be assigned after import.
                </p>

                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer flex flex-col items-center justify-center gap-4 rounded-[22px] border-2 border-dashed transition-all"
                  style={{ borderColor: isDragging ? '#136C9E' : '#cbd5e1', background: isDragging ? 'rgba(19,108,158,0.04)' : '#fafbfc', padding: '52px 24px' }}
                >
                  <div className="w-16 h-16 rounded-[18px] flex items-center justify-center" style={{ background: '#dcf1fc' }}>
                    <Upload size={28} style={{ color: '#136C9E' }} />
                  </div>
                  <div className="text-center">
                    <p className="text-[15px] font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif' }}>
                      {isDragging ? 'Drop your CSV here' : 'Drag & drop your CSV file'}
                    </p>
                    <p className="text-[13px] text-[#64748b] mt-1">or click to browse</p>
                  </div>
                  <span className="px-5 py-2 rounded-full border border-[#136C9E] text-[#136C9E] text-[13px] font-semibold hover:bg-[#eaf3f8] transition-colors"
                    style={{ fontFamily: 'Archivo,sans-serif' }}>Choose file</span>
                </div>
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />

                {parseError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl border border-red-200 bg-red-50 mt-5">
                    <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-[13px] text-red-700">{parseError}</p>
                  </div>
                )}

                <div className="mt-7 p-4 rounded-[16px] bg-[#f8fafc] border border-[#e2e8f0]">
                  <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#475569] mb-3" style={{ fontFamily: 'Archivo,sans-serif' }}>Required columns</p>
                  <div className="flex flex-wrap gap-2">
                    {REQUIRED_COLS.map(c => (
                      <span key={c} className="px-3 py-1 rounded-full bg-[#136C9E] text-white text-[11px] font-semibold" style={{ fontFamily: 'Archivo,sans-serif' }}>{c}</span>
                    ))}
                  </div>
                  <p className="text-[12px] text-[#64748b] mt-3">Optional: bathrooms, squareFootage, status, amenities (semicolon-separated), notes</p>
                  <p className="text-[12px] text-[#94a3b8] mt-2">Valid types: {VALID_TYPES.join(', ')}. Status: vacant, occupied, under-renovation</p>
                </div>
              </div>
            )}

            {/* ── Step 2: Validate ────────────────────────────────────────── */}
            {step === 'validate' && (
              <div>
                <h1 className="text-[22px] font-bold mb-1" style={{ fontFamily: 'Archivo,sans-serif', color: '#1e293b' }}>Review & Fix Errors</h1>
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 rounded-full bg-[#f0fdf4] text-[#15803d] text-[12px] font-semibold">{validRows.length} valid</span>
                  {invalidRows.length > 0 && <span className="px-3 py-1 rounded-full bg-[#fff1f2] text-[#e11d48] text-[12px] font-semibold">{invalidRows.length} with errors</span>}
                  <span className="text-[12px] text-[#64748b]">{rows.length} total</span>
                </div>

                <div className="overflow-x-auto rounded-[16px] border border-[#e2e8f0]" style={{ maxHeight: 460, overflowY: 'auto' }}>
                  <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b] w-10">#</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Address</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Type</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Beds</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Rent/mo</th>
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
                            <tr style={{ background: hasErr ? '#fff8f8' : 'white', borderBottom: '1px solid #f1f5f9' }}>
                              <td className="px-4 py-3 text-[#94a3b8]">{row._row}</td>
                              <td className="px-4 py-3">
                                {hasErr
                                  ? <input className={INP + ' h-9 text-[13px]'} value={row.address} onChange={e => editRow(idx, 'address', e.target.value)} style={{ borderColor: row._errors?.some(e => e.includes('Address')) ? '#fca5a5' : '#e2e8f0' }} />
                                  : <span className="font-semibold text-[#1e293b]">{row.address}</span>}
                              </td>
                              <td className="px-4 py-3">
                                {hasErr
                                  ? <input className={INP + ' h-9 text-[13px] w-28'} value={row.type} onChange={e => editRow(idx, 'type', e.target.value)} />
                                  : <span className="text-[#475569]">{row.type}</span>}
                              </td>
                              <td className="px-4 py-3">
                                {hasErr
                                  ? <input className={INP + ' h-9 text-[13px] w-16'} value={row.bedrooms} onChange={e => editRow(idx, 'bedrooms', e.target.value)} />
                                  : <span className="text-[#475569]">{row.bedrooms}</span>}
                              </td>
                              <td className="px-4 py-3">
                                {hasErr
                                  ? <input className={INP + ' h-9 text-[13px] w-24'} value={row.rent} onChange={e => editRow(idx, 'rent', e.target.value)} />
                                  : <span className="font-semibold text-[#1e293b]">£{parseFloat(row.rent || '0').toLocaleString()}</span>}
                              </td>
                              <td className="px-4 py-3">
                                {hasErr
                                  ? <span className="flex items-center gap-1 text-[#e11d48] text-[12px] font-semibold"><XCircle size={13} /> {row._errors!.length} error{row._errors!.length > 1 ? 's' : ''}</span>
                                  : <span className="flex items-center gap-1 text-[#15803d] text-[12px] font-semibold"><CheckCircle size={13} /> Valid</span>}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  {hasErr && (
                                    <button type="button" onClick={() => toggleExpand(idx)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9]">
                                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                  )}
                                  <button type="button" onClick={() => removeRow(idx)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-[#e11d48] hover:bg-[#fff1f2]">
                                    <X size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && hasErr && (
                              <tr style={{ background: '#fff8f8', borderBottom: '1px solid #f1f5f9' }}>
                                <td colSpan={7} className="px-4 pb-3">
                                  <div className="flex flex-col gap-1 pt-1 mb-2">
                                    {row._errors!.map((err, ei) => (
                                      <p key={ei} className="text-[12px] text-[#dc2626] flex items-center gap-1.5"><AlertTriangle size={11} /> {err}</p>
                                    ))}
                                  </div>
                                  <div className="grid grid-cols-3 gap-3">
                                    <div>
                                      <label className="block text-[11px] font-semibold text-[#475569] mb-1">Status</label>
                                      <select className={INP + ' h-9 text-[13px]'} value={row.status || 'vacant'} onChange={e => editRow(idx, 'status', e.target.value)}>
                                        {VALID_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-semibold text-[#475569] mb-1">Bathrooms</label>
                                      <input className={INP + ' h-9 text-[13px]'} value={row.bathrooms || ''} onChange={e => editRow(idx, 'bathrooms', e.target.value)} placeholder="e.g. 2" />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-semibold text-[#475569] mb-1">Sq. Footage</label>
                                      <input className={INP + ' h-9 text-[13px]'} value={row.squareFootage || ''} onChange={e => editRow(idx, 'squareFootage', e.target.value)} placeholder="e.g. 850" />
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
              </div>
            )}

            {/* ── Step 3: Confirm ─────────────────────────────────────────── */}
            {step === 'confirm' && (
              <div>
                <h1 className="text-[22px] font-bold mb-1" style={{ fontFamily: 'Archivo,sans-serif', color: '#1e293b' }}>Confirm Import</h1>
                <p className="text-[13.5px] text-[#64748b] mb-6">
                  You are about to import <strong>{validRows.length}</strong> propert{validRows.length !== 1 ? 'ies' : 'y'}.
                  {invalidRows.length > 0 && ` ${invalidRows.length} row${invalidRows.length > 1 ? 's' : ''} with errors will be skipped.`}
                </p>

                <div className="flex flex-col gap-3 mb-6" style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {validRows.map((row, i) => (
                    <div key={i} className="p-4 rounded-[16px] border border-[#e2e8f0] bg-[#f8fafc] flex items-start gap-3">
                      <div className="w-10 h-10 rounded-[12px] bg-[#dcf1fc] flex items-center justify-center shrink-0">
                        <Home size={18} style={{ color: '#136C9E' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[14px] text-[#1e293b] truncate" style={{ fontFamily: 'Archivo,sans-serif' }}>{row.address}</p>
                        <p className="text-[12px] text-[#64748b] mt-0.5">{row.type} · {row.bedrooms} bed{parseInt(row.bedrooms) !== 1 ? 's' : ''}{row.bathrooms ? ` · ${row.bathrooms} bath` : ''}</p>
                        {row.amenities && <p className="text-[11px] text-[#94a3b8] mt-0.5">{row.amenities.split(';').slice(0, 3).map(a => a.trim()).join(' · ')}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-[14px] text-[#1e293b]">£{parseFloat(row.rent || '0').toLocaleString()}<span className="text-[11px] text-[#64748b] font-normal">/mo</span></p>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${row.status === 'occupied' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                          {row.status || 'vacant'}
                        </span>
                      </div>
                    </div>
                  ))}
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
                      : <><CheckCircle size={18} /> Import {validRows.length} Propert{validRows.length !== 1 ? 'ies' : 'y'}</>}
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
                    {succeeded > 0 ? <CheckCircle size={36} className="text-[#16a34a]" /> : <XCircle size={36} className="text-[#e11d48]" />}
                  </div>
                  <h1 className="text-[22px] font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif' }}>Import Complete</h1>
                  <p className="text-[13.5px] text-[#64748b] mt-1">
                    <strong className="text-[#15803d]">{succeeded} succeeded</strong>
                    {failed > 0 && <> · <strong className="text-[#e11d48]">{failed} failed</strong></>}
                  </p>
                </div>

                <div className="overflow-x-auto rounded-[16px] border border-[#e2e8f0] mb-6" style={{ maxHeight: 360, overflowY: 'auto' }}>
                  <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Address</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Type</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Result</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: row._status === 'error' ? '#fff8f8' : 'white' }}>
                          <td className="px-4 py-3 font-semibold text-[#1e293b] max-w-[200px] truncate">{row.address}</td>
                          <td className="px-4 py-3 text-[#475569]">{row.type}</td>
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
                  {onEnrich && succeeded > 0 && (
                    <button type="button" onClick={() => onEnrich(importedIds)}
                      className="flex-1 h-[48px] rounded-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
                      style={{ background: '#DC5F12', fontFamily: 'Archivo,sans-serif', fontSize: 15, boxShadow: '0 4px 14px rgba(220,95,18,0.32)' }}>
                      <Camera size={17} /> Add Photos & Documents →
                    </button>
                  )}
                  <button type="button" onClick={onComplete}
                    className={`${onEnrich && succeeded > 0 ? '' : 'flex-1 '} h-[48px] px-5 rounded-[14px] font-semibold flex items-center justify-center gap-2 transition-all hover:-translate-y-px`}
                    style={onEnrich && succeeded > 0
                      ? { borderColor: '#136C9E', color: '#136C9E', border: '1.5px solid #136C9E', fontFamily: 'Archivo,sans-serif', fontSize: 14, background: 'white' }
                      : { background: '#136C9E', color: 'white', fontFamily: 'Archivo,sans-serif', fontSize: 15, boxShadow: '0 4px 14px rgba(19,108,158,0.28)' }
                    }>
                    <CheckCircle size={17} /> {onEnrich && succeeded > 0 ? 'Skip →' : 'Done — View Properties'}
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

export default BulkPropertyImport;
