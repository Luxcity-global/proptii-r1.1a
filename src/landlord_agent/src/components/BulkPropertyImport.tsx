/**
 * BulkPropertyImport — exact match to drive-download-20261002T082209Z-1-001/index.html design
 *
 * Same structure as BulkTenantImport: .stepper-card sidebar + .form-card-wide main card
 * Colors: --primary-blue #136C9E, --primary-orange #DC5F12
 * Fonts: Archivo (headings/buttons), Nunito Sans (body/inputs)
 */
import React, { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import {
  ArrowLeft, Upload, Download, CheckCircle, XCircle,
  AlertTriangle, Loader2, X, ChevronDown, ChevronUp,
  RotateCcw, Camera,
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
  _createdId?: string;
}

interface BulkPropertyImportProps {
  userProfile: UserProfile | null;
  userId: string;
  userEmail?: string;
  onBack: () => void;
  onComplete: () => void;
  onEnrich?: (importedIds: string[]) => void;
}

type Step = 'upload' | 'preview' | 'results';

const REQUIRED_COLS = ['address', 'type', 'bedrooms', 'rent'];
const MAX_ROWS = 500;
const VALID_STATUSES = ['vacant', 'occupied', 'under-renovation'];

function validateRow(row: BulkPropertyRow): string[] {
  const errs: string[] = [];
  if (!row.address?.trim() || row.address.trim().length < 5) errs.push('Address required (min 5 chars)');
  if (!row.type?.trim()) errs.push('Property type required');
  const beds = parseInt(row.bedrooms);
  if (!row.bedrooms || isNaN(beds) || beds < 0 || beds > 50) errs.push('Bedrooms must be 0–50');
  const rent = parseFloat(row.rent);
  if (!row.rent || isNaN(rent) || rent < 0) errs.push('Rent must be a non-negative number');
  if (row.status && !VALID_STATUSES.includes(row.status.toLowerCase())) errs.push(`Status: vacant, occupied, or under-renovation`);
  return errs;
}

// Shared style constants matching the template CSS vars
const CARD_SHADOW = '0 20px 45px -12px rgba(19,108,158,0.08),0 4px 16px -2px rgba(0,0,0,0.04)';
const CARD_RADIUS = 28;
const PRIMARY_BLUE = '#136C9E';
const PRIMARY_ORANGE = '#DC5F12';
const FONT_HEADING = 'Archivo,sans-serif';
const FONT_BODY = 'Nunito Sans,sans-serif';

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  background: '#fff',
  border: '1.5px solid #e2e8f0',
  borderRadius: 14,
  padding: '0 16px',
  fontFamily: FONT_BODY,
  fontSize: 14,
  color: '#1e293b',
  outline: 'none',
};

export function BulkPropertyImport({ userProfile, userId, userEmail, onBack, onComplete, onEnrich }: BulkPropertyImportProps) {
  const [step, setStep]     = useState<Step>('upload');
  const [rows, setRows]     = useState<BulkPropertyRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validRows   = rows.filter(r => !r._errors?.length);
  const invalidRows = rows.filter(r => r._errors?.length);
  const succeeded   = rows.filter(r => r._status === 'success').length;
  const failed      = rows.filter(r => r._status === 'error').length;

  // ── Parse ──────────────────────────────────────────────────────────────────

  const parseFile = useCallback((file: File) => {
    setParseError(null);
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setParseError('Only .CSV files are supported.');
      return;
    }
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim().replace(/\s+/g, '').replace(/^"|"$/g, ''),
      complete: res => {
        const headers = res.meta.fields || [];
        const missing = REQUIRED_COLS.filter(c => !headers.includes(c));
        if (missing.length) { setParseError(`Missing columns: ${missing.join(', ')}`); return; }
        if (res.data.length > MAX_ROWS) { setParseError(`Max ${MAX_ROWS} rows — file has ${res.data.length}.`); return; }
        if (res.data.length === 0) { setParseError('File is empty.'); return; }

        const parsed: BulkPropertyRow[] = res.data.map((raw, i) => {
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
        setStep('preview');
      },
      error: err => setParseError(`Parse error: ${err.message}`),
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

  // ── Import ─────────────────────────────────────────────────────────────────

  async function runImport() {
    setIsImporting(true);
    const updated = [...rows];
    const ids: string[] = [];

    for (let i = 0; i < updated.length; i++) {
      const row = updated[i];
      if (row._errors?.length) {
        updated[i] = { ...row, _status: 'error', _resultMessage: 'Skipped — validation errors' };
        continue;
      }
      try {
        const payload: any = {
          address:      row.address,
          type:         row.type,
          bedrooms:     parseInt(row.bedrooms) || 1,
          rent:         parseFloat(row.rent) || 0,
          status:       (row.status as any) || 'vacant',
          amenities:    row.amenities ? row.amenities.split(';').map(a => a.trim()).filter(Boolean) : [],
          notes:        row.notes || '',
          photos:       [],
          documents:    [],
          ...(row.bathrooms     && { bathrooms:     parseFloat(row.bathrooms) }),
          ...(row.squareFootage && { squareFootage: parseFloat(row.squareFootage) }),
        };
        const newId = await propertyService.createProperty(payload, userId, userEmail);
        ids.push(newId);
        updated[i] = { ...row, _status: 'success', _resultMessage: 'Imported successfully', _createdId: newId };
      } catch (err: any) {
        updated[i] = { ...row, _status: 'error', _resultMessage: err?.message || 'Import failed' };
      }
      setRows([...updated]);
      if (i < updated.length - 1) await new Promise(r => setTimeout(r, 50));
    }

    setImportedIds(ids);
    setIsImporting(false);
    setStep('results');
  }

  function editRow(idx: number, field: keyof BulkPropertyRow, value: string) {
    setRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const u = { ...r, [field]: value };
      u._errors = validateRow(u);
      return u;
    }));
  }

  function removeRow(idx: number) {
    setRows(prev => prev.filter((_, i) => i !== idx));
  }

  function downloadErrorReport() {
    const bad = rows.filter(r => r._status === 'error' || r._errors?.length);
    if (!bad.length) return;
    const csv = bad.map(r => [r._row, r.address, r.type, r.rent, r._errors?.join('; ') || r._resultMessage || ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + 'row,address,type,rent,errors\n' + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'property-import-errors.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f7fafc', backgroundImage: "url('/assets/bg-mesh.png')", backgroundSize: 'cover', backgroundAttachment: 'fixed', fontFamily: FONT_BODY }}>

      {/* Navbar */}
      <header style={{ height: 68, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.72)', borderBottom: '1px solid rgba(226,232,240,0.65)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button type="button" onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
            <span style={{ color: '#94a3b8', fontSize: 11 }}>/</span>
            <span style={{ color: '#64748b', cursor: 'pointer' }}>Properties</span>
            <span style={{ color: '#94a3b8', fontSize: 11 }}>/</span>
            <span style={{ color: '#1e293b', fontWeight: 700, fontFamily: FONT_HEADING }}>Bulk Property Import</span>
          </nav>
        </div>
        <a href="/templates/property-import-template.csv" download style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 9999, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, color: '#64748b', fontFamily: FONT_HEADING, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          <Download size={14} /> Download Template
        </a>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 24px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 36, width: '100%', maxWidth: 1060 }}>

          {/* LEFT SIDEBAR */}
          <aside style={{ width: 300, background: '#fff', borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW, padding: '24px 20px', flexShrink: 0, position: 'sticky', top: 100 }}>
            <div style={{ padding: '4px 12px 16px', borderBottom: '1px solid #f1f5f9', marginBottom: 16 }}>
              <div style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Bulk Import</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Import multiple properties via CSV</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16 }}>
                <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>1</span>
                  <span>Download Template</span>
                </div>
                <p style={{ color: '#64748b', fontSize: 12, lineHeight: 1.4, marginBottom: 12 }}>Use the official Proptii CSV template with required headers.</p>
                <a href="/templates/property-import-template.csv" download style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '8px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 9999, fontSize: 12.5, fontWeight: 600, color: '#64748b', fontFamily: FONT_HEADING, textDecoration: 'none' }}>
                  <Download size={14} /> Download .CSV Template
                </a>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16 }}>
                <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>2</span>
                  <span>Required Columns</span>
                </div>
                <ul style={{ color: '#64748b', fontSize: 11.5, lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
                  <li>address *</li>
                  <li>type * (Flat, House, Studio…)</li>
                  <li>bedrooms *</li>
                  <li>rent * (monthly £)</li>
                  <li>bathrooms, squareFootage</li>
                  <li>status (vacant/occupied)</li>
                  <li>amenities (semicolon-separated)</li>
                  <li>notes</li>
                </ul>
              </div>

              <div style={{ background: '#fff3ec', border: '1px solid #fed7aa', borderRadius: 16, padding: 16 }}>
                <div style={{ fontWeight: 700, color: PRIMARY_ORANGE, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT_HEADING, fontSize: 12.5 }}>
                  <Camera size={14} /> After Import
                </div>
                <p style={{ color: '#92400e', fontSize: 11.5, lineHeight: 1.4, margin: 0 }}>
                  Photos and documents can't be added via CSV. After import, use the <strong>Enrich Properties</strong> button to add them one by one.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px dashed #e2e8f0', textAlign: 'center' }}>
              <button type="button" onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: FONT_HEADING }}>
                <ArrowLeft size={14} /> Back to Add Property
              </button>
            </div>
          </aside>

          {/* RIGHT CARD */}
          <section style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW, padding: '40px 42px 44px' }}>

            {/* ── UPLOAD ─────────────────────────────────────────── */}
            {step === 'upload' && (
              <div>
                <h1 style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 700, textAlign: 'center', color: '#1e293b', letterSpacing: '-0.02em', marginBottom: 4 }}>Import multiple properties</h1>
                <p style={{ fontSize: 13.5, color: '#64748b', textAlign: 'center', marginBottom: 28 }}>Upload a spreadsheet to add your portfolio in one go</p>

                {/* .csv-dropzone */}
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: `2px dashed ${isDragging ? PRIMARY_BLUE : '#cbd5e1'}`, borderRadius: 20, padding: '38px 24px', textAlign: 'center', background: isDragging ? '#f0f7fc' : '#fafcff', cursor: 'pointer', marginBottom: 20, transition: 'all 0.2s ease' }}
                >
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: '#eaf4fb', color: PRIMARY_BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 4px 12px rgba(19,108,158,0.1)' }}>
                    <Upload size={26} />
                  </div>
                  <button type="button" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }} style={{ background: PRIMARY_BLUE, color: '#fff', borderRadius: 12, padding: '11px 24px', fontWeight: 600, fontFamily: FONT_HEADING, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(19,108,158,0.25)', marginBottom: 8 }}>
                    <Upload size={16} /> Import CSV
                  </button>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>or drag and drop your spreadsheet file here</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
                    {['.CSV', 'Max 500 rows'].map(t => (
                      <span key={t} style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={onFileChange} />

                {parseError && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, border: '1px solid #fecaca', background: '#fef2f2', marginTop: 16 }}>
                    <AlertTriangle size={16} style={{ color: '#dc2626', marginTop: 2, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: '#b91c1c', margin: 0 }}>{parseError}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── PREVIEW ──────────────────────────────────────────── */}
            {step === 'preview' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h1 style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 700, color: '#1e293b' }}>Review & Confirm</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 700 }}>
                      <CheckCircle size={14} /> {validRows.length} Ready
                    </span>
                    {invalidRows.length > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 700 }}>
                        <AlertTriangle size={14} /> {invalidRows.length} Errors
                      </span>
                    )}
                  </div>
                </div>

                {/* .csv-table-wrapper */}
                <div style={{ maxHeight: 380, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 14, background: '#fff', marginBottom: 20 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['#', 'Address', 'Type', 'Beds', 'Rent/mo', 'Status', ''].map(h => (
                          <th key={h} style={{ padding: '10px 14px', fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #e2e8f0', fontFamily: FONT_HEADING, position: 'sticky', top: 0, background: '#f8fafc', zIndex: 2 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => {
                        const hasErr = (row._errors?.length || 0) > 0;
                        const isExpanded = expandedRow === idx;
                        return (
                          <React.Fragment key={idx}>
                            <tr style={{ background: hasErr ? '#fff8f8' : '#fff', borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 11.5 }}>{row._row}</td>
                              <td style={{ padding: '10px 14px', maxWidth: 200 }}>
                                {hasErr
                                  ? <input value={row.address} onChange={e => editRow(idx, 'address', e.target.value)} style={{ ...inputStyle, height: 34, fontSize: 12, borderColor: '#fca5a5' }} />
                                  : <div style={{ fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.address}</div>}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                {hasErr
                                  ? <input value={row.type} onChange={e => editRow(idx, 'type', e.target.value)} style={{ ...inputStyle, height: 34, fontSize: 12, width: 100 }} />
                                  : <span style={{ color: '#475569' }}>{row.type}</span>}
                              </td>
                              <td style={{ padding: '10px 14px', color: '#475569' }}>{row.bedrooms}</td>
                              <td style={{ padding: '10px 14px', fontWeight: 700, color: PRIMARY_BLUE }}>
                                £{parseFloat(row.rent || '0').toLocaleString()}<span style={{ fontSize: 11, fontWeight: 400, color: '#64748b' }}>/mo</span>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                {hasErr
                                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 700 }}><XCircle size={11} /> {row._errors!.length} error{row._errors!.length > 1 ? 's' : ''}</span>
                                  : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 700 }}><CheckCircle size={11} /> Ready</span>}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  {hasErr && (
                                    <button type="button" onClick={() => setExpandedRow(expandedRow === idx ? null : idx)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                  )}
                                  <button type="button" onClick={() => removeRow(idx)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <X size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && hasErr && (
                              <tr style={{ background: '#fff8f8', borderBottom: '1px solid #f1f5f9' }}>
                                <td colSpan={7} style={{ padding: '8px 14px 12px' }}>
                                  {row._errors!.map((e, i) => (
                                    <p key={i} style={{ fontSize: 12, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0' }}><AlertTriangle size={11} /> {e}</p>
                                  ))}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
                                    <div>
                                      <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Bathrooms</label>
                                      <input value={row.bathrooms || ''} onChange={e => editRow(idx, 'bathrooms', e.target.value)} placeholder="e.g. 2" style={{ ...inputStyle, height: 36, fontSize: 12 }} />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Status</label>
                                      <select value={row.status || 'vacant'} onChange={e => editRow(idx, 'status', e.target.value)} style={{ ...inputStyle, height: 36, fontSize: 12, appearance: 'none' }}>
                                        {VALID_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Sq Ft</label>
                                      <input value={row.squareFootage || ''} onChange={e => editRow(idx, 'squareFootage', e.target.value)} placeholder="e.g. 850" style={{ ...inputStyle, height: 36, fontSize: 12 }} />
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

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <button type="button" onClick={runImport} disabled={isImporting || validRows.length === 0}
                      style={{ flex: 1, height: 50, background: PRIMARY_ORANGE, color: '#fff', border: 'none', borderRadius: 14, fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 600, cursor: isImporting || validRows.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(220,95,18,0.32)', opacity: validRows.length === 0 ? 0.5 : 1 }}>
                      {isImporting ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Importing…</> : <><CheckCircle size={18} /> Import {validRows.length} Propert{validRows.length !== 1 ? 'ies' : 'y'}</>}
                    </button>
                    <button type="button" onClick={() => { setRows([]); setStep('upload'); }}
                      style={{ height: 50, padding: '0 24px', background: '#fff', color: PRIMARY_BLUE, border: `1.5px solid ${PRIMARY_BLUE}`, borderRadius: 14, fontFamily: FONT_HEADING, fontSize: 14.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <RotateCcw size={15} /> Upload New File
                    </button>
                  </div>
                  {invalidRows.length > 0 && validRows.length > 0 && (
                    <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', margin: 0 }}>{invalidRows.length} row{invalidRows.length > 1 ? 's' : ''} with errors will be skipped.</p>
                  )}
                </div>
              </div>
            )}

            {/* ── RESULTS ──────────────────────────────────────────── */}
            {step === 'results' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: succeeded > 0 ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: `0 6px 20px ${succeeded > 0 ? 'rgba(22,163,74,0.18)' : 'rgba(220,38,38,0.14)'}` }}>
                  {succeeded > 0 ? <CheckCircle size={36} style={{ color: '#16a34a' }} /> : <XCircle size={36} style={{ color: '#dc2626' }} />}
                </div>
                <h2 style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em' }}>
                  {succeeded} Propert{succeeded !== 1 ? 'ies' : 'y'} Successfully Imported!
                </h2>
                <p style={{ fontSize: 13.5, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
                  {failed > 0 && <><strong style={{ color: '#dc2626' }}>{failed} failed</strong> — </>}all records have been processed.
                </p>

                {/* .dossier-box */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 18, padding: 20, textAlign: 'left', margin: '24px 0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid #e2e8f0', marginBottom: 16 }}>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Imported</div>
                      <div style={{ fontWeight: 700, color: PRIMARY_BLUE, fontSize: 20, marginTop: 2 }}>{succeeded}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Failed</div>
                      <div style={{ fontWeight: 700, color: failed > 0 ? '#dc2626' : '#16a34a', fontSize: 20, marginTop: 2 }}>{failed}</div>
                    </div>
                  </div>

                  {/* What's missing note */}
                  <div style={{ background: '#fff3ec', border: '1px solid #fed7aa', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Camera size={16} style={{ color: PRIMARY_ORANGE, marginTop: 1, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#92400e', fontFamily: FONT_HEADING }}>Photos & documents not yet added</div>
                      <div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>Properties are created with basic data only. Use <strong>Enrich Properties</strong> to add photos, EPC certs and other documents to each property.</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {onEnrich && succeeded > 0 && (
                    <button type="button" onClick={() => onEnrich(importedIds)}
                      style={{ width: '100%', height: 50, background: PRIMARY_ORANGE, color: '#fff', border: 'none', borderRadius: 14, fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(220,95,18,0.32)' }}>
                      <Camera size={18} /> Add Photos & Documents →
                    </button>
                  )}
                  <div style={{ display: 'flex', gap: 14 }}>
                    <button type="button" onClick={onComplete}
                      style={{ flex: 1, height: 50, background: onEnrich && succeeded > 0 ? '#fff' : PRIMARY_BLUE, color: onEnrich && succeeded > 0 ? PRIMARY_BLUE : '#fff', border: `1.5px solid ${PRIMARY_BLUE}`, borderRadius: 14, fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: onEnrich && succeeded > 0 ? 'none' : '0 4px 14px rgba(19,108,158,0.28)' }}>
                      {onEnrich && succeeded > 0 ? 'Skip — View Properties' : 'View Properties'}
                    </button>
                    {failed > 0 && (
                      <button type="button" onClick={downloadErrorReport}
                        style={{ height: 50, padding: '0 20px', background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 14, fontFamily: FONT_HEADING, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Download size={15} /> Error Report
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

          </section>
        </div>
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default BulkPropertyImport;
