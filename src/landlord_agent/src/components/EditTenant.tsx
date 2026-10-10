/**
 * EditTenant — single-page form with collapsible numbered sections.
 *
 * Same visual design as AddTenant. Three sections:
 *   1  Personal details  — name, email, phone
 *   2  Tenancy terms     — property, rent, dates, status dropdowns
 *   3  Additional details — emergency contact, employment, notes
 *
 * All fields pre-populated from the existing tenant record.
 * Sections 1+2 open by default; section 3 open too (since data already exists).
 * Save fires only after confirmed backend write.
 */
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Home,
  PoundSterling,
  Calendar,
  Users,
  Briefcase,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Shield,
  ChevronDown,
  ChevronUp,
  Settings,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Property, Tenant, UserProfile } from '../App';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditTenantProps {
  tenant: Tenant;
  properties: Property[];
  userProfile?: UserProfile | null;
  onSave: (updates: Partial<Omit<Tenant, 'id'>>) => Promise<void>;
  onBack: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  rentAmount: string;
  paymentFrequency: 'monthly' | 'yearly' | 'fixed-time';
  firstPaymentDate: string;
  leaseStart: string;
  leaseEnd: string;
  status: 'active' | 'pending' | 'ended';
  referencingStatus: 'not-started' | 'in-progress' | 'complete';
  paymentStatus: 'current' | 'overdue' | 'payment-plan';
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  employmentType: string;
  employer: string;
  jobTitle: string;
  annualIncome: string;
  notes: string;
}

type FieldErrors = Partial<Record<keyof FormData, string>>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(date: Date | string | undefined | null): string {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fromISO(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0);
}

function tenantToForm(t: Tenant): FormData {
  const x = t as any;
  return {
    name:                         t.name || '',
    email:                        t.email || '',
    phone:                        t.phone || '',
    propertyId:                   t.propertyId || '',
    rentAmount:                   t.rentAmount?.toString() || '',
    paymentFrequency:             t.paymentFrequency || 'monthly',
    firstPaymentDate:             toISO(t.firstPaymentDate),
    leaseStart:                   toISO(t.leaseStart),
    leaseEnd:                     toISO(t.leaseEnd),
    status:                       (t.status as any) || 'active',
    referencingStatus:            (t.referencingStatus as any) || 'not-started',
    paymentStatus:                (t.paymentStatus as any) || 'current',
    emergencyContactName:         t.emergencyContact?.name || '',
    emergencyContactPhone:        t.emergencyContact?.phone || '',
    emergencyContactRelationship: t.emergencyContact?.relationship || '',
    employmentType:               x.employmentType || '',
    employer:                     x.employer || '',
    jobTitle:                     x.jobTitle || '',
    annualIncome:                 x.annualIncome?.toString() || '',
    notes:                        x.notes || '',
  };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const F  = 'w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:border-[#4E97CC] focus:outline-none transition-colors bg-white';
const FE = 'border-red-400 focus:border-red-400';
const LB = 'block text-sm font-semibold text-gray-700 mb-1.5';
const EM = 'text-xs text-red-500 mt-1.5 flex items-center gap-1';

// ─── Shared sub-components ────────────────────────────────────────────────────

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className={LB}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {error && <p className={EM}><AlertTriangle className="w-3 h-3 shrink-0" />{error}</p>}
    </div>
  );
}

function SectionHeader({
  num, icon: Icon, iconColor, iconBg, title, subtitle, complete, open, onToggle,
}: {
  num: number; icon: React.ElementType; iconColor: string; iconBg: string;
  title: string; subtitle: string; complete: boolean; open: boolean; onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-4 px-6 py-5 hover:bg-gray-50/60 transition-colors text-left"
    >
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors"
        style={{ background: complete ? '#dcfce7' : '#F1F5F9', color: complete ? '#16a34a' : '#64748b' }}
      >
        {complete ? <CheckCircle className="w-4 h-4" /> : num}
      </span>
      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      {open
        ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditTenant({ tenant, properties, userProfile, onSave, onBack }: EditTenantProps) {
  const [form, setForm] = useState<FormData>(() => tenantToForm(tenant));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  // All three open by default in edit mode — data is already present
  const [open, setOpen] = useState<[boolean, boolean, boolean]>([true, true, true]);

  function toggle(i: 0 | 1 | 2) {
    setOpen(prev => { const n = [...prev] as [boolean, boolean, boolean]; n[i] = !n[i]; return n; });
  }

  // Re-populate when tenant changes
  useEffect(() => {
    setForm(tenantToForm(tenant));
    setErrors({});
    setGlobalError(null);
    setSaved(false);
    setOpen([true, true, true]);
  }, [tenant.id]);

  function set(f: keyof FormData, v: string) {
    setForm(prev => ({ ...prev, [f]: v }));
    if (errors[f]) setErrors(prev => ({ ...prev, [f]: undefined }));
    if (globalError) setGlobalError(null);
  }

  // ─── Section completion checks ────────────────────────────────────────────

  const s1ok =
    form.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
    /^[\+]?[\d\s\-\(\)]{10,}$/.test(form.phone.trim());

  const s2ok = (() => {
    if (!form.propertyId) return false;
    const r = parseFloat(form.rentAmount);
    if (!form.rentAmount || isNaN(r) || r <= 0) return false;
    if (!fromISO(form.firstPaymentDate) || !fromISO(form.leaseStart) || !fromISO(form.leaseEnd)) return false;
    const s = fromISO(form.leaseStart), en = fromISO(form.leaseEnd);
    if (s && en && en < s) return false;
    return true;
  })();

  // ─── Validation ───────────────────────────────────────────────────────────

  function validate(): boolean {
    const e: FieldErrors = {};
    if (!form.name.trim() || form.name.trim().length < 2)        e.name  = 'Full name required (min 2 chars)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))  e.email = 'Valid email required';
    if (!/^[\+]?[\d\s\-\(\)]{10,}$/.test(form.phone.trim()))    e.phone = 'Valid phone required (min 10 digits)';
    if (!form.propertyId)                                         e.propertyId = 'Select a property';
    const r = parseFloat(form.rentAmount);
    if (!form.rentAmount || isNaN(r) || r <= 0)                   e.rentAmount = 'Valid rent required';
    if (!fromISO(form.firstPaymentDate))                          e.firstPaymentDate = 'Valid date required';
    if (!fromISO(form.leaseStart))                                e.leaseStart = 'Valid date required';
    if (!fromISO(form.leaseEnd))                                  e.leaseEnd = 'Valid date required';
    else {
      const s = fromISO(form.leaseStart), en = fromISO(form.leaseEnd);
      if (s && en && en < s) e.leaseEnd = 'End must be after start';
    }
    setErrors(e);
    const s1err = !!(e.name || e.email || e.phone);
    const s2err = !!(e.propertyId || e.rentAmount || e.firstPaymentDate || e.leaseStart || e.leaseEnd);
    if (s1err || s2err) setOpen([open[0] || s1err, open[1] || s2err, open[2]]);
    return Object.keys(e).length === 0;
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    setGlobalError(null);
    if (!userProfile) { setGlobalError('You must be signed in to edit a tenant.'); return; }
    if (!validate()) {
      setGlobalError('Please fix the highlighted errors before saving.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setIsLoading(true);
    try {
      const property = properties.find(p => p.id === form.propertyId);
      const updates: any = {
        name:             form.name.trim(),
        email:            form.email.trim().toLowerCase(),
        phone:            form.phone.trim(),
        propertyId:       form.propertyId,
        propertyAddress:  property?.address || tenant.propertyAddress,
        rentAmount:       parseFloat(form.rentAmount),
        paymentFrequency: form.paymentFrequency,
        firstPaymentDate: fromISO(form.firstPaymentDate) || tenant.firstPaymentDate,
        leaseStart:       fromISO(form.leaseStart)       || tenant.leaseStart,
        leaseEnd:         fromISO(form.leaseEnd)         || tenant.leaseEnd,
        status:           form.status,
        referencingStatus:form.referencingStatus,
        paymentStatus:    form.paymentStatus,
        emergencyContact: {
          name:         form.emergencyContactName.trim(),
          phone:        form.emergencyContactPhone.trim(),
          relationship: form.emergencyContactRelationship,
        },
        ...(form.notes          && { notes:          form.notes }),
        ...(form.employer       && { employer:        form.employer }),
        ...(form.jobTitle       && { jobTitle:        form.jobTitle }),
        ...(form.annualIncome && !isNaN(parseFloat(form.annualIncome)) && { annualIncome: parseFloat(form.annualIncome) }),
        ...(form.employmentType && { employmentType:  form.employmentType }),
      };
      await onSave(updates);
      setSaved(true);
    } catch (err: any) {
      setGlobalError(err?.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Success ──────────────────────────────────────────────────────────────

  if (saved) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: '#F8FAFC', fontFamily: 'Archivo, sans-serif' }}
      >
        <div className="text-center space-y-6 max-w-sm w-full">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto" style={{ background: '#dcfce7' }}>
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#136C9E' }}>Changes Saved</h1>
            <p className="text-gray-600 mt-2"><strong>{form.name}</strong>'s details have been updated.</p>
          </div>
          <button
            onClick={onBack}
            className="w-full py-3.5 rounded-full font-semibold text-sm text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #DC5F12, #DC5F12)' }}
          >
            Back to tenant
          </button>
        </div>
      </div>
    );
  }

  // ─── Main form ────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#F8FAFC', fontFamily: 'Archivo, sans-serif' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold leading-tight" style={{ color: '#136C9E' }}>Edit Tenant</h1>
            <p className="text-xs text-gray-400 leading-tight">{tenant.name}</p>
          </div>
        </div>
        <button
          form="edit-tenant-form"
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #DC5F12, #DC5F12)' }}
        >
          {isLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
            : <><CheckCircle className="w-4 h-4" />Save Changes</>}
        </button>
      </div>

      <form
        id="edit-tenant-form"
        onSubmit={handleSave}
        className="flex-1 flex flex-col items-center px-4 py-6 pb-10"
        noValidate
      >
        <div className="w-full max-w-lg space-y-4">

          {/* Global error */}
          {globalError && (
            <div className="flex items-start gap-3 p-4 rounded-2xl border border-red-200 bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{globalError}</p>
            </div>
          )}

          {/* ── Card ─────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

            {/* ── Section 1: Personal details ─────────────────── */}
            <SectionHeader
              num={1} icon={User} iconColor="#06B6D4" iconBg="#E0F7FA"
              title="Personal details" subtitle="Name, email and phone number"
              complete={s1ok} open={open[0]} onToggle={() => toggle(0)}
            />

            {open[0] && (
              <div className="px-6 pb-6 pt-1 space-y-4 border-t border-gray-100">
                <Field label="Full name" required error={errors.name}>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                      placeholder="Full name" className={`${F} pl-10 ${errors.name ? FE : ''}`} />
                  </div>
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Email address" required error={errors.email}>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                        placeholder="tenant@email.com" className={`${F} pl-10 ${errors.email ? FE : ''}`} autoCapitalize="none" />
                    </div>
                  </Field>
                  <Field label="Phone number" required error={errors.phone}>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                        placeholder="+44 7000 000000" className={`${F} pl-10 ${errors.phone ? FE : ''}`} />
                    </div>
                  </Field>
                </div>
              </div>
            )}

            <div className="h-px bg-gray-100 mx-6" />

            {/* ── Section 2: Tenancy terms ────────────────────── */}
            <SectionHeader
              num={2} icon={Home} iconColor="#136C9E" iconBg="#E8F4F8"
              title="Tenancy terms" subtitle="Property, rent, rent dates and status"
              complete={s2ok} open={open[1]} onToggle={() => toggle(1)}
            />

            {open[1] && (
              <div className="px-6 pb-6 pt-1 space-y-4 border-t border-gray-100">
                <Field label="Property" required error={errors.propertyId}>
                  <Select value={form.propertyId} onValueChange={v => set('propertyId', v)}>
                    <SelectTrigger className={`${F} h-auto ${errors.propertyId ? FE : ''}`}>
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.address}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Monthly rent (£)" required error={errors.rentAmount}>
                    <div className="relative">
                      <PoundSterling className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input type="number" min="1" value={form.rentAmount} onChange={e => set('rentAmount', e.target.value)}
                        placeholder="1200" className={`${F} pl-10 ${errors.rentAmount ? FE : ''}`} />
                    </div>
                  </Field>
                  <Field label="Frequency" required>
                    <Select value={form.paymentFrequency} onValueChange={v => set('paymentFrequency', v as any)}>
                      <SelectTrigger className={`${F} h-auto`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="fixed-time">Fixed Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field label="First payment date" required error={errors.firstPaymentDate}>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="date" value={form.firstPaymentDate} onChange={e => set('firstPaymentDate', e.target.value)}
                      className={`${F} pl-10 ${errors.firstPaymentDate ? FE : ''}`} />
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Rent start" required error={errors.leaseStart}>
                    <input type="date" value={form.leaseStart} onChange={e => set('leaseStart', e.target.value)}
                      className={`${F} ${errors.leaseStart ? FE : ''}`} />
                  </Field>
                  <Field label="Rent end" required error={errors.leaseEnd}>
                    <input type="date" value={form.leaseEnd} onChange={e => set('leaseEnd', e.target.value)}
                      className={`${F} ${errors.leaseEnd ? FE : ''}`} />
                  </Field>
                </div>

                {/* Status row — edit mode only */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <Settings className="w-3.5 h-3.5" /> Tenancy status
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Status">
                      <Select value={form.status} onValueChange={v => set('status', v as any)}>
                        <SelectTrigger className={`${F} h-auto`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="ended">Ended</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Referencing">
                      <Select value={form.referencingStatus} onValueChange={v => set('referencingStatus', v as any)}>
                        <SelectTrigger className={`${F} h-auto`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not-started">Not started</SelectItem>
                          <SelectItem value="in-progress">In progress</SelectItem>
                          <SelectItem value="complete">Complete</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Payment">
                      <Select value={form.paymentStatus} onValueChange={v => set('paymentStatus', v as any)}>
                        <SelectTrigger className={`${F} h-auto`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="current">Current</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="payment-plan">Plan</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </div>
              </div>
            )}

            <div className="h-px bg-gray-100 mx-6" />

            {/* ── Section 3: Additional details ───────────────── */}
            <SectionHeader
              num={3} icon={Shield} iconColor="#7C3AED" iconBg="#F3E8FF"
              title="Additional details" subtitle="Emergency contact, employment and notes"
              complete={false} open={open[2]} onToggle={() => toggle(2)}
            />

            {open[2] && (
              <div className="px-6 pb-6 pt-1 space-y-5 border-t border-gray-100">

                {/* Emergency contact */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 pt-1">
                    <Users className="w-3.5 h-3.5" /> Emergency contact
                  </p>
                  <Field label="Name">
                    <input type="text" value={form.emergencyContactName}
                      onChange={e => set('emergencyContactName', e.target.value)}
                      placeholder="Full name" className={F} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Phone">
                      <input type="tel" value={form.emergencyContactPhone}
                        onChange={e => set('emergencyContactPhone', e.target.value)}
                        placeholder="+44 7000 …" className={F} />
                    </Field>
                    <Field label="Relationship">
                      <Select value={form.emergencyContactRelationship} onValueChange={v => set('emergencyContactRelationship', v)}>
                        <SelectTrigger className={`${F} h-auto`}><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent>
                          {['Parent', 'Spouse / Partner', 'Sibling', 'Friend', 'Colleague', 'Other'].map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </div>

                {/* Employment */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Employment
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Type">
                      <Select value={form.employmentType} onValueChange={v => set('employmentType', v)}>
                        <SelectTrigger className={`${F} h-auto`}><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent>
                          {['Full-time', 'Part-time', 'Self-employed', 'Student', 'Unemployed', 'Retired'].map(t => (
                            <SelectItem key={t} value={t.toLowerCase().replace(' ', '-')}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Annual income (£)">
                      <div className="relative">
                        <PoundSterling className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input type="number" min="0" value={form.annualIncome}
                          onChange={e => set('annualIncome', e.target.value)}
                          placeholder="35000" className={`${F} pl-10`} />
                      </div>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Employer">
                      <input type="text" value={form.employer} onChange={e => set('employer', e.target.value)}
                        placeholder="Employer name" className={F} />
                    </Field>
                    <Field label="Job title">
                      <input type="text" value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)}
                        placeholder="e.g. Engineer" className={F} />
                    </Field>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Notes
                  </p>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
                    placeholder="Any additional information about this tenant…"
                    className={`${F} min-h-[80px] resize-y`} />
                </div>
              </div>
            )}
          </div>

          {/* Bottom save button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-50 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #DC5F12, #DC5F12)' }}
          >
            {isLoading
              ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Saving changes…</span>
              : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditTenant;
