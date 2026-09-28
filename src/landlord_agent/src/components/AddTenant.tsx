/**
 * AddTenant — single-page form with collapsible numbered sections.
 *
 * One scrollable white card containing three sections:
 *   1  Tenant details    — name, email, phone          (open by default, required)
 *   2  Tenancy terms     — property, rent, dates        (open by default, required)
 *   3  Additional details — emergency, employment, notes (closed by default, optional)
 *
 * Each section header shows:
 *   • Numbered badge (1/2/3)
 *   • Icon + title
 *   • Green ✓ when the section's required fields are complete
 *   • Chevron to toggle open/closed
 *
 * Save Tenant button fires only after the backend confirms the write.
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
  UserPlus,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Property, Tenant, UserProfile } from '../App';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddTenantProps {
  properties: Property[];
  onSave: (tenant: Omit<Tenant, 'id'>) => Promise<void>;
  onBack: () => void;
  preselectedPropertyId?: string;
  prefillEmail?: string;
  userProfile?: UserProfile | null;
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
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;
  employmentType: string;
  employer: string;
  annualIncome: string;
  notes: string;
}

type FieldErrors = Partial<Record<keyof FormData, string>>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fromISO(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0);
}
function defaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1, 12, 0, 0);
  const end = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate(), 12, 0, 0);
  return { start: toISO(start), end: toISO(end), first: toISO(start) };
}
function blank(prefillEmail?: string, preselectedPropertyId?: string): FormData {
  const { start, end, first } = defaultDates();
  return {
    name: '', email: prefillEmail ?? '', phone: '',
    propertyId: preselectedPropertyId ?? '',
    rentAmount: '', paymentFrequency: 'monthly',
    firstPaymentDate: first, leaseStart: start, leaseEnd: end,
    emergencyName: '', emergencyPhone: '', emergencyRelationship: '',
    employmentType: '', employer: '', annualIncome: '', notes: '',
  };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const F = 'w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:border-[#4E97CC] focus:outline-none transition-colors bg-white';
const FE = 'border-red-400 focus:border-red-400';
const LB = 'block text-sm font-semibold text-gray-700 mb-1.5';
const EM = 'text-xs text-red-500 mt-1.5 flex items-center gap-1';

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className={LB}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className={EM}><AlertTriangle className="w-3 h-3 shrink-0" />{error}</p>
      )}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

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
      {/* Number badge */}
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors"
        style={{
          background: complete ? '#dcfce7' : '#F1F5F9',
          color: complete ? '#16a34a' : '#64748b',
        }}
      >
        {complete ? <CheckCircle className="w-4 h-4" /> : num}
      </span>

      {/* Icon */}
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconBg }}
      >
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Chevron */}
      {open
        ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddTenant({
  properties, onSave, onBack,
  preselectedPropertyId, prefillEmail, userProfile,
}: AddTenantProps) {
  const [form, setForm] = useState<FormData>(() => blank(prefillEmail, preselectedPropertyId));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  // Sections 1 + 2 open by default; section 3 closed
  const [open, setOpen] = useState<[boolean, boolean, boolean]>([true, true, false]);

  function toggle(i: 0 | 1 | 2) {
    setOpen(prev => { const next = [...prev] as [boolean, boolean, boolean]; next[i] = !next[i]; return next; });
  }

  // Auto-fill rent from property
  useEffect(() => {
    if (!form.propertyId) return;
    const p = properties.find(p => p.id === form.propertyId);
    if (p?.rent && !form.rentAmount) set('rentAmount', String(p.rent));
  }, [form.propertyId]);

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
    if (!fromISO(form.firstPaymentDate)) return false;
    if (!fromISO(form.leaseStart)) return false;
    if (!fromISO(form.leaseEnd)) return false;
    const s = fromISO(form.leaseStart), en = fromISO(form.leaseEnd);
    if (s && en && en < s) return false;
    return true;
  })();

  // ─── Validation (full, on submit) ─────────────────────────────────────────

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

    // Open any section that has errors
    const s1err = !!(e.name || e.email || e.phone);
    const s2err = !!(e.propertyId || e.rentAmount || e.firstPaymentDate || e.leaseStart || e.leaseEnd);
    if (s1err || s2err) {
      setOpen([open[0] || s1err, open[1] || s2err, open[2]]);
    }

    return Object.keys(e).length === 0;
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    setGlobalError(null);
    if (!userProfile) { setGlobalError('You must be signed in to add a tenant.'); return; }
    if (!validate()) {
      setGlobalError('Please fix the highlighted errors before saving.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setIsLoading(true);
    try {
      const property = properties.find(p => p.id === form.propertyId);
      const tenant: any = {
        name:             form.name.trim(),
        email:            form.email.trim().toLowerCase(),
        phone:            form.phone.trim(),
        propertyId:       form.propertyId,
        propertyAddress:  property?.address ?? '',
        rentAmount:       parseFloat(form.rentAmount),
        paymentFrequency: form.paymentFrequency,
        firstPaymentDate: fromISO(form.firstPaymentDate) ?? new Date(),
        leaseStart:       fromISO(form.leaseStart)       ?? new Date(),
        leaseEnd:         fromISO(form.leaseEnd)         ?? new Date(),
        status:           'active',
        referencingStatus:'not-started',
        paymentStatus:    'current',
        emergencyContact: {
          name:         form.emergencyName.trim(),
          phone:        form.emergencyPhone.trim(),
          relationship: form.emergencyRelationship,
        },
        defaultRiskScore: 75,
        ...(form.employer       && { employer:       form.employer.trim() }),
        ...(form.annualIncome   && { annualIncome:   parseFloat(form.annualIncome) }),
        ...(form.employmentType && { employmentType: form.employmentType }),
        ...(form.notes          && { notes:          form.notes.trim() }),
      };
      // Only reaches success screen after confirmed backend write
      await onSave(tenant);
      setSaved(true);
    } catch (err: any) {
      setGlobalError(err?.message || 'Failed to save tenant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Success screen ───────────────────────────────────────────────────────

  if (saved) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: '#F8FAFC', fontFamily: 'Archivo, sans-serif' }}
      >
        <div className="text-center space-y-6 max-w-sm w-full">
          <div className="relative mx-auto w-24 h-24">
            <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: '#dcfce7' }}>
              <UserPlus className="w-12 h-12 text-green-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#136C9E' }}>Tenant Added!</h1>
            <p className="text-gray-600 mt-2">
              <strong>{form.name}</strong> has been added to your tenant list.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setForm(blank(undefined, preselectedPropertyId)); setErrors({}); setSaved(false); setOpen([true, true, false]); }}
              className="w-full py-3 rounded-full border-2 font-semibold text-sm transition-all hover:bg-gray-50"
              style={{ borderColor: '#136C9E', color: '#136C9E' }}
            >
              Add another tenant
            </button>
            <button
              onClick={onBack}
              className="w-full py-3 rounded-full font-semibold text-sm text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #DC5F12, #DC5F12)' }}
            >
              Go to tenant list
            </button>
          </div>
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
            <h1 className="text-base font-bold leading-tight" style={{ color: '#136C9E' }}>Add Tenant</h1>
            <p className="text-xs text-gray-400 leading-tight">Fill in the details below</p>
          </div>
        </div>
        <button
          form="add-tenant-form"
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #DC5F12, #DC5F12)' }}
        >
          {isLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
            : <><CheckCircle className="w-4 h-4" />Save Tenant</>}
        </button>
      </div>

      <form
        id="add-tenant-form"
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

            {/* ── Section 1: Tenant details ───────────────────── */}
            <SectionHeader
              num={1}
              icon={User} iconColor="#06B6D4" iconBg="#E0F7FA"
              title="Tenant details"
              subtitle="Name, email and phone number"
              complete={s1ok}
              open={open[0]}
              onToggle={() => toggle(0)}
            />

            {open[0] && (
              <div className="px-6 pb-6 pt-1 space-y-4 border-t border-gray-100">
                <Field label="Full name" required error={errors.name}>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text" value={form.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder="e.g. James Okafor"
                      className={`${F} pl-10 ${errors.name ? FE : ''}`}
                      autoComplete="name"
                    />
                  </div>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Email address" required error={errors.email}>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="email" value={form.email}
                        onChange={e => set('email', e.target.value)}
                        placeholder="tenant@email.com"
                        className={`${F} pl-10 ${errors.email ? FE : ''}`}
                        autoCapitalize="none"
                      />
                    </div>
                  </Field>

                  <Field label="Phone number" required error={errors.phone}>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="tel" value={form.phone}
                        onChange={e => set('phone', e.target.value)}
                        placeholder="+44 7000 000000"
                        className={`${F} pl-10 ${errors.phone ? FE : ''}`}
                        autoComplete="tel"
                      />
                    </div>
                  </Field>
                </div>
              </div>
            )}

            <div className="h-px bg-gray-100 mx-6" />

            {/* ── Section 2: Tenancy terms ────────────────────── */}
            <SectionHeader
              num={2}
              icon={Home} iconColor="#136C9E" iconBg="#E8F4F8"
              title="Tenancy terms"
              subtitle="Property, rent and lease dates"
              complete={s2ok}
              open={open[1]}
              onToggle={() => toggle(1)}
            />

            {open[1] && (
              <div className="px-6 pb-6 pt-1 space-y-4 border-t border-gray-100">
                <Field label="Property" required error={errors.propertyId}>
                  <Select value={form.propertyId} onValueChange={v => set('propertyId', v)}>
                    <SelectTrigger className={`${F} h-auto ${errors.propertyId ? FE : ''}`}>
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.address}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Monthly rent (£)" required error={errors.rentAmount}>
                    <div className="relative">
                      <PoundSterling className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="number" min="1" value={form.rentAmount}
                        onChange={e => set('rentAmount', e.target.value)}
                        placeholder="1200"
                        className={`${F} pl-10 ${errors.rentAmount ? FE : ''}`}
                      />
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
                    <input
                      type="date" value={form.firstPaymentDate}
                      onChange={e => set('firstPaymentDate', e.target.value)}
                      className={`${F} pl-10 ${errors.firstPaymentDate ? FE : ''}`}
                    />
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Lease start" required error={errors.leaseStart}>
                    <input
                      type="date" value={form.leaseStart}
                      onChange={e => set('leaseStart', e.target.value)}
                      className={`${F} ${errors.leaseStart ? FE : ''}`}
                    />
                  </Field>
                  <Field label="Lease end" required error={errors.leaseEnd}>
                    <input
                      type="date" value={form.leaseEnd}
                      onChange={e => set('leaseEnd', e.target.value)}
                      className={`${F} ${errors.leaseEnd ? FE : ''}`}
                    />
                  </Field>
                </div>
              </div>
            )}

            <div className="h-px bg-gray-100 mx-6" />

            {/* ── Section 3: Additional details (optional) ────── */}
            <SectionHeader
              num={3}
              icon={Shield} iconColor="#7C3AED" iconBg="#F3E8FF"
              title="Additional details"
              subtitle="Emergency contact, employment and notes — optional"
              complete={false}
              open={open[2]}
              onToggle={() => toggle(2)}
            />

            {open[2] && (
              <div className="px-6 pb-6 pt-1 space-y-5 border-t border-gray-100">

                {/* Emergency contact */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 pt-1">
                    <Users className="w-3.5 h-3.5" /> Emergency contact
                  </p>
                  <Field label="Name">
                    <input type="text" value={form.emergencyName}
                      onChange={e => set('emergencyName', e.target.value)}
                      placeholder="Full name" className={F} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Phone">
                      <input type="tel" value={form.emergencyPhone}
                        onChange={e => set('emergencyPhone', e.target.value)}
                        placeholder="+44 7000 …" className={F} />
                    </Field>
                    <Field label="Relationship">
                      <Select value={form.emergencyRelationship} onValueChange={v => set('emergencyRelationship', v)}>
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
                  <Field label="Employer">
                    <input type="text" value={form.employer}
                      onChange={e => set('employer', e.target.value)}
                      placeholder="Employer name" className={F} />
                  </Field>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Notes
                  </p>
                  <textarea
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    rows={3}
                    placeholder="Any additional information about this tenant…"
                    className={`${F} min-h-[80px] resize-y`}
                  />
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
              ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Saving tenant…</span>
              : 'Save Tenant'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddTenant;
