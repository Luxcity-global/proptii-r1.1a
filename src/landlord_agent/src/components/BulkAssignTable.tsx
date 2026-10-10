/**
 * BulkAssignTable — assign multiple tenants to multiple properties
 *
 * Accessed from PropertiesPage "Assign Tenants" button.
 * Design: same system as BulkTenantImport (Archivo / Nunito Sans, #136C9E / #DC5F12)
 *
 * Flow:
 *   1. Left column: unassigned tenants
 *   2. Right column: vacant properties  
 *   3. User drags/selects tenant → picks property from dropdown → sets rent + dates
 *   4. Review assignments table → Confirm → Results
 */
import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, CheckCircle, XCircle, Loader2, Users, Home,
  PlusCircle, X, AlertTriangle, ArrowRight, Download,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Tenant, Property } from '../App';
import { tenantService } from '../services/tenantService';
import { propertyService } from '../services/propertyService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Assignment {
  tenantId: string;
  propertyId: string;
  rentAmount: string;
  leaseStart: string;
  leaseEnd: string;
  firstPaymentDate: string;
  paymentFrequency: 'monthly' | 'yearly' | 'fixed-time';
  _status?: 'pending' | 'success' | 'error';
  _resultMessage?: string;
}

interface BulkAssignTableProps {
  tenants: Tenant[];
  properties: Property[];
  onBack: () => void;
  onComplete: () => void;
}

type Step = 'build' | 'review' | 'results';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDate(s?: string) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(n => n[0] || '').join('').toUpperCase().slice(0, 2) || '?';
}

const now = new Date();
const defaultStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
const defaultEnd   = new Date(defaultStart.getFullYear() + 1, defaultStart.getMonth(), defaultStart.getDate());

const INP = 'w-full h-10 bg-white border border-[#e2e8f0] rounded-xl px-3 text-[13px] text-[#1e293b] outline-none focus:border-[#136C9E] focus:ring-[3px] focus:ring-[rgba(19,108,158,0.12)] placeholder:text-[#94a3b8]';

// ─── Component ────────────────────────────────────────────────────────────────

export function BulkAssignTable({ tenants, properties, onBack, onComplete }: BulkAssignTableProps) {
  const [step, setStep]             = useState<Step>('build');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tenants without a property assignment
  const unassignedTenants = useMemo(() =>
    tenants.filter(t => !t.propertyId || t.propertyId === '' || t.status === 'pending'),
    [tenants]
  );

  // Vacant properties
  const vacantProperties = useMemo(() =>
    properties.filter(p => p.status === 'vacant' && !p.tenantId),
    [properties]
  );

  // Property IDs already in the assignments list
  const usedPropertyIds = useMemo(() => new Set(assignments.map(a => a.propertyId)), [assignments]);
  // Tenant IDs already in assignments
  const usedTenantIds   = useMemo(() => new Set(assignments.map(a => a.tenantId)), [assignments]);

  function addRow(tenantId?: string) {
    const defaults: Assignment = {
      tenantId:         tenantId || '',
      propertyId:       '',
      rentAmount:       '',
      leaseStart:       toISO(defaultStart),
      leaseEnd:         toISO(defaultEnd),
      firstPaymentDate: toISO(defaultStart),
      paymentFrequency: 'monthly',
      _status:          'pending',
    };
    // Auto-fill rent from selected tenant's current rent if available
    if (tenantId) {
      const t = tenants.find(x => x.id === tenantId);
      if (t?.rentAmount) defaults.rentAmount = String(t.rentAmount);
    }
    setAssignments(prev => [...prev, defaults]);
  }

  function updateRow(idx: number, field: keyof Assignment, value: string) {
    setAssignments(prev => prev.map((a, i) => {
      if (i !== idx) return a;
      const updated = { ...a, [field]: value };
      // Auto-fill rent from property if rent is empty
      if (field === 'propertyId' && !updated.rentAmount) {
        const prop = properties.find(p => p.id === value);
        if (prop?.rent) updated.rentAmount = String(prop.rent);
      }
      return updated;
    }));
  }

  function removeRow(idx: number) {
    setAssignments(prev => prev.filter((_, i) => i !== idx));
  }

  function validateAssignments(): string[] {
    const errs: string[] = [];
    assignments.forEach((a, i) => {
      if (!a.tenantId)                          errs.push(`Row ${i + 1}: select a tenant`);
      if (!a.propertyId)                        errs.push(`Row ${i + 1}: select a property`);
      if (!a.rentAmount || isNaN(parseFloat(a.rentAmount)) || parseFloat(a.rentAmount) <= 0)
                                                 errs.push(`Row ${i + 1}: valid rent required`);
      if (!a.leaseStart || isNaN(Date.parse(a.leaseStart))) errs.push(`Row ${i + 1}: valid rent start required`);
      if (!a.leaseEnd   || isNaN(Date.parse(a.leaseEnd)))   errs.push(`Row ${i + 1}: valid rent end required`);
    });
    // duplicate property check
    const propIds = assignments.map(a => a.propertyId).filter(Boolean);
    const dupes = propIds.filter((id, i) => propIds.indexOf(id) !== i);
    if (dupes.length) errs.push(`Duplicate property assignment: one property cannot appear twice`);
    return errs;
  }

  const validationErrors = validateAssignments();

  async function runAssignments() {
    setIsSubmitting(true);
    const updated = assignments.map(a => ({ ...a }));

    for (let i = 0; i < updated.length; i++) {
      const a = updated[i];
      try {
        const property = properties.find(p => p.id === a.propertyId);
        // Update tenant with new property
        await tenantService.updateTenant(a.tenantId, {
          propertyId:      a.propertyId,
          propertyAddress: property?.address || '',
          rentAmount:      parseFloat(a.rentAmount),
          paymentFrequency: a.paymentFrequency,
          leaseStart:      new Date(a.leaseStart),
          leaseEnd:        new Date(a.leaseEnd),
          firstPaymentDate: new Date(a.firstPaymentDate || a.leaseStart),
          status:          'active',
        } as any);
        // Update property status to occupied
        await propertyService.updateProperty(a.propertyId, {
          status: 'occupied',
          tenantId: a.tenantId,
        } as any);
        updated[i] = { ...a, _status: 'success', _resultMessage: `Assigned to ${property?.address || a.propertyId}` };
      } catch (err: any) {
        updated[i] = { ...a, _status: 'error', _resultMessage: err?.message || 'Assignment failed' };
      }
      setAssignments([...updated]);
      if (i < updated.length - 1) await new Promise(r => setTimeout(r, 50));
    }

    setIsSubmitting(false);
    setStep('results');
  }

  function downloadReport() {
    const failed = assignments.filter(a => a._status === 'error');
    if (!failed.length) return;
    const rows = failed.map(a => {
      const t = tenants.find(x => x.id === a.tenantId);
      const p = properties.find(x => x.id === a.propertyId);
      return [t?.name || a.tenantId, t?.email || '', p?.address || a.propertyId, a._resultMessage || '']
        .map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const blob = new Blob(['\uFEFF' + ['tenantName,email,property,error', ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'assign-errors.csv';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const succeeded = assignments.filter(a => a._status === 'success').length;
  const failedCount = assignments.filter(a => a._status === 'error').length;

  // ── Render ────────────────────────────────────────────────────────────────

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
          <span className="font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif', fontSize: 15 }}>Bulk Assign Tenants</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#64748b]">
            {unassignedTenants.length} unassigned · {vacantProperties.length} vacant
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 pt-10 pb-16">
        <div className="w-full max-w-[900px]">

          {/* ── Step: Build ─────────────────────────────────────────────── */}
          {step === 'build' && (
            <div style={{ background: 'white', borderRadius: 28, boxShadow: '0 20px 45px -12px rgba(19,108,158,0.08),0 4px 16px -2px rgba(0,0,0,0.04)', padding: '40px 42px 44px' }}>
              <h1 className="text-[22px] font-bold mb-1" style={{ fontFamily: 'Archivo,sans-serif', color: '#1e293b' }}>
                Assign Tenants to Properties
              </h1>
              <p className="text-[13.5px] text-[#64748b] mb-7">
                Match each tenant to a vacant property. Set rent, rent dates, and payment frequency.
              </p>

              {/* Quick-add unassigned tenants */}
              {unassignedTenants.length > 0 && assignments.length === 0 && (
                <div className="mb-6 p-4 rounded-[16px] bg-[#f0f9ff] border border-[#bae6fd]">
                  <p className="text-[13px] font-semibold text-[#0369a1] mb-3" style={{ fontFamily: 'Archivo,sans-serif' }}>
                    {unassignedTenants.length} unassigned tenant{unassignedTenants.length > 1 ? 's' : ''} — add them all at once:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {unassignedTenants.slice(0, 8).map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => !usedTenantIds.has(t.id) && addRow(t.id)}
                        disabled={usedTenantIds.has(t.id)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] font-semibold transition-all disabled:opacity-40"
                        style={{ borderColor: '#136C9E', color: '#136C9E', background: usedTenantIds.has(t.id) ? '#f0f9ff' : 'white' }}
                      >
                        <span className="w-5 h-5 rounded-full bg-[#136C9E] text-white text-[10px] flex items-center justify-center font-bold">{initials(t.name)}</span>
                        {t.name.split(' ')[0]}
                      </button>
                    ))}
                    {unassignedTenants.length > 8 && (
                      <span className="text-[12px] text-[#64748b] self-center">+{unassignedTenants.length - 8} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Assignment rows */}
              {assignments.length > 0 && (
                <div className="flex flex-col gap-4 mb-5">
                  {assignments.map((a, idx) => {
                    const tenant   = tenants.find(t => t.id === a.tenantId);
                    const property = properties.find(p => p.id === a.propertyId);
                    const availableProps = vacantProperties.filter(p => !usedPropertyIds.has(p.id) || p.id === a.propertyId);
                    const availableTenants = tenants.filter(t => !usedTenantIds.has(t.id) || t.id === a.tenantId);

                    return (
                      <div key={idx} className="p-4 rounded-[18px] border border-[#e2e8f0] bg-[#f8fafc]">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#64748b]" style={{ fontFamily: 'Archivo,sans-serif' }}>
                            Assignment {idx + 1}
                          </span>
                          <button type="button" onClick={() => removeRow(idx)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-[#e11d48] hover:bg-[#fff1f2]">
                            <X size={14} />
                          </button>
                        </div>

                        {/* Tenant + Property row */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-[11.5px] font-semibold text-[#475569] mb-1.5" style={{ fontFamily: 'Archivo,sans-serif' }}>Tenant *</label>
                            <Select value={a.tenantId} onValueChange={v => updateRow(idx, 'tenantId', v)}>
                              <SelectTrigger className={INP + ' h-10'}>
                                <SelectValue placeholder="Select tenant…">
                                  {tenant ? (
                                    <span className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-[#136C9E] text-white text-[10px] flex items-center justify-center font-bold shrink-0">{initials(tenant.name)}</span>
                                      {tenant.name}
                                    </span>
                                  ) : 'Select tenant…'}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {availableTenants.length === 0
                                  ? <SelectItem value="_none" disabled>No available tenants</SelectItem>
                                  : availableTenants.map(t => (
                                    <SelectItem key={t.id} value={t.id}>
                                      <span className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-[#136C9E] text-white text-[10px] flex items-center justify-center font-bold">{initials(t.name)}</span>
                                        {t.name} <span className="text-[11px] text-[#94a3b8]">{t.email}</span>
                                      </span>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-[11.5px] font-semibold text-[#475569] mb-1.5" style={{ fontFamily: 'Archivo,sans-serif' }}>Property *</label>
                            <Select value={a.propertyId} onValueChange={v => updateRow(idx, 'propertyId', v)}>
                              <SelectTrigger className={INP + ' h-10'}>
                                <SelectValue placeholder="Select property…">
                                  {property ? (
                                    <span className="flex items-center gap-2">
                                      <Home size={13} className="text-[#136C9E] shrink-0" />
                                      <span className="truncate">{property.address.split(',')[0]}</span>
                                    </span>
                                  ) : 'Select property…'}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {availableProps.length === 0
                                  ? <SelectItem value="_none" disabled>No vacant properties available</SelectItem>
                                  : availableProps.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.address} <span className="text-[11px] text-[#94a3b8]">· £{p.rent.toLocaleString()}/mo</span>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Rent + dates */}
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#475569] mb-1.5" style={{ fontFamily: 'Archivo,sans-serif' }}>Rent (£/mo) *</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] font-bold text-[13px] pointer-events-none">£</span>
                              <input type="number" min="1" value={a.rentAmount} onChange={e => updateRow(idx, 'rentAmount', e.target.value)}
                                placeholder="1200" className={INP + ' pl-6'} />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#475569] mb-1.5" style={{ fontFamily: 'Archivo,sans-serif' }}>Frequency</label>
                            <Select value={a.paymentFrequency} onValueChange={v => updateRow(idx, 'paymentFrequency', v)}>
                              <SelectTrigger className={INP + ' h-10'}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                                <SelectItem value="fixed-time">Fixed Time</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#475569] mb-1.5" style={{ fontFamily: 'Archivo,sans-serif' }}>Lease Start *</label>
                            <input type="date" value={a.leaseStart} onChange={e => updateRow(idx, 'leaseStart', e.target.value)} className={INP} />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#475569] mb-1.5" style={{ fontFamily: 'Archivo,sans-serif' }}>Rent End *</label>
                            <input type="date" value={a.leaseEnd} onChange={e => updateRow(idx, 'leaseEnd', e.target.value)} className={INP} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty state */}
              {assignments.length === 0 && unassignedTenants.length === 0 && (
                <div className="text-center py-12 text-[#94a3b8]">
                  <Users size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="text-[14px] font-semibold">All tenants are already assigned to properties</p>
                  <p className="text-[13px] mt-1">You can still create manual assignments below</p>
                </div>
              )}

              <button type="button" onClick={() => addRow()}
                className="w-full h-[44px] rounded-[14px] border-2 border-dashed flex items-center justify-center gap-2 text-[13.5px] font-semibold transition-all hover:bg-[#f0f9ff] hover:border-[#136C9E]"
                style={{ borderColor: '#cbd5e1', color: '#64748b', fontFamily: 'Archivo,sans-serif' }}>
                <PlusCircle size={16} /> Add Assignment Row
              </button>

              {/* Validation errors */}
              {validationErrors.length > 0 && assignments.length > 0 && (
                <div className="mt-4 p-3 rounded-[12px] bg-red-50 border border-red-200">
                  {validationErrors.slice(0, 3).map((e, i) => (
                    <p key={i} className="text-[12px] text-red-700 flex items-center gap-1.5"><AlertTriangle size={11} /> {e}</p>
                  ))}
                  {validationErrors.length > 3 && <p className="text-[12px] text-red-600 mt-1">+{validationErrors.length - 3} more errors</p>}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={onBack}
                  className="h-[50px] px-5 rounded-[14px] border font-semibold flex items-center gap-2 transition-all hover:bg-[#f8fafc]"
                  style={{ borderColor: '#e2e8f0', color: '#64748b', fontFamily: 'Archivo,sans-serif', fontSize: 14 }}>
                  Cancel
                </button>
                <button type="button" onClick={() => setStep('review')}
                  disabled={assignments.length === 0 || validationErrors.length > 0}
                  className="flex-1 h-[50px] rounded-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px disabled:opacity-40"
                  style={{ background: '#136C9E', fontFamily: 'Archivo,sans-serif', fontSize: 15, boxShadow: '0 4px 14px rgba(19,108,158,0.28)' }}>
                  Review {assignments.length} Assignment{assignments.length !== 1 ? 's' : ''} <ArrowRight size={17} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Review ────────────────────────────────────────────── */}
          {step === 'review' && (
            <div style={{ background: 'white', borderRadius: 28, boxShadow: '0 20px 45px -12px rgba(19,108,158,0.08),0 4px 16px -2px rgba(0,0,0,0.04)', padding: '40px 42px 44px' }}>
              <h1 className="text-[22px] font-bold mb-1" style={{ fontFamily: 'Archivo,sans-serif', color: '#1e293b' }}>Review Assignments</h1>
              <p className="text-[13.5px] text-[#64748b] mb-6">Confirm you're happy with these {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}.</p>

              <div className="overflow-x-auto rounded-[16px] border border-[#e2e8f0] mb-6">
                <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Tenant</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Property</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Rent</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Lease Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a, i) => {
                      const t = tenants.find(x => x.id === a.tenantId);
                      const p = properties.find(x => x.id === a.propertyId);
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-full bg-[#136C9E] text-white text-[10px] flex items-center justify-center font-bold shrink-0">{initials(t?.name || '')}</span>
                              <div>
                                <p className="font-semibold text-[#1e293b]">{t?.name || '—'}</p>
                                <p className="text-[11px] text-[#64748b]">{t?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-[#1e293b] max-w-[180px] truncate">{p?.address?.split(',')[0] || '—'}</p>
                            <p className="text-[11px] text-[#64748b]">{p?.type} · {p?.bedrooms} bed</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-[#1e293b]">£{parseFloat(a.rentAmount || '0').toLocaleString()}</p>
                            <p className="text-[11px] text-[#64748b]">{a.paymentFrequency}</p>
                          </td>
                          <td className="px-4 py-3 text-[#475569]">
                            {fmtDate(a.leaseStart)} – {fmtDate(a.leaseEnd)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('build')}
                  className="h-[50px] px-5 rounded-[14px] border font-semibold flex items-center gap-2"
                  style={{ borderColor: '#136C9E', color: '#136C9E', fontFamily: 'Archivo,sans-serif', fontSize: 14 }}>
                  <ArrowLeft size={15} /> Edit
                </button>
                <button type="button" onClick={runAssignments} disabled={isSubmitting}
                  className="flex-1 h-[50px] rounded-[14px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: '#DC5F12', fontFamily: 'Archivo,sans-serif', fontSize: 15, boxShadow: '0 4px 14px rgba(220,95,18,0.32)' }}>
                  {isSubmitting
                    ? <><Loader2 size={18} className="animate-spin" /> Assigning…</>
                    : <><CheckCircle size={18} /> Confirm {assignments.length} Assignment{assignments.length !== 1 ? 's' : ''}</>}
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Results ───────────────────────────────────────────── */}
          {step === 'results' && (
            <div style={{ background: 'white', borderRadius: 28, boxShadow: '0 20px 45px -12px rgba(19,108,158,0.08),0 4px 16px -2px rgba(0,0,0,0.04)', padding: '40px 42px 44px' }}>
              <div className="text-center mb-7">
                <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: succeeded > 0 ? '#dcfce7' : '#fff1f2', boxShadow: `0 6px 20px ${succeeded > 0 ? 'rgba(22,163,74,0.18)' : 'rgba(225,29,72,0.12)'}` }}>
                  {succeeded > 0 ? <CheckCircle size={36} className="text-[#16a34a]" /> : <XCircle size={36} className="text-[#e11d48]" />}
                </div>
                <h1 className="text-[22px] font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif' }}>Assignments Complete</h1>
                <p className="text-[13.5px] text-[#64748b] mt-1">
                  <strong className="text-[#15803d]">{succeeded} succeeded</strong>
                  {failedCount > 0 && <> · <strong className="text-[#e11d48]">{failedCount} failed</strong></>}
                </p>
              </div>

              <div className="overflow-x-auto rounded-[16px] border border-[#e2e8f0] mb-6" style={{ maxHeight: 340, overflowY: 'auto' }}>
                <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Tenant</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Result</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a, i) => {
                      const t = tenants.find(x => x.id === a.tenantId);
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: a._status === 'error' ? '#fff8f8' : 'white' }}>
                          <td className="px-4 py-3 font-semibold text-[#1e293b]">{t?.name || a.tenantId}</td>
                          <td className="px-4 py-3">
                            {a._status === 'success'
                              ? <span className="flex items-center gap-1 text-[#15803d] font-semibold"><CheckCircle size={13} /> Success</span>
                              : <span className="flex items-center gap-1 text-[#e11d48] font-semibold"><XCircle size={13} /> Failed</span>}
                          </td>
                          <td className="px-4 py-3 text-[12px] text-[#64748b]">{a._resultMessage}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                {failedCount > 0 && (
                  <button type="button" onClick={downloadReport}
                    className="flex items-center gap-2 h-[48px] px-5 rounded-[14px] border font-semibold"
                    style={{ borderColor: '#e2e8f0', color: '#64748b', fontFamily: 'Archivo,sans-serif', fontSize: 13.5 }}>
                    <Download size={15} /> Download Error Report
                  </button>
                )}
                <button type="button" onClick={onComplete}
                  className="flex-1 h-[48px] rounded-[14px] font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: '#136C9E', fontFamily: 'Archivo,sans-serif', fontSize: 15, boxShadow: '0 4px 14px rgba(19,108,158,0.28)' }}>
                  <CheckCircle size={17} /> Done — View Properties
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default BulkAssignTable;
