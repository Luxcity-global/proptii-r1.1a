/**
 * AddTenant — grouped Typeform-card form.
 *
 * Three full-screen cards, one visible at a time, navigated with
 * Next / Back buttons — same visual language as the old 17-step wizard
 * but with logically grouped fields so the landlord fills 2-4 fields
 * per screen rather than one.
 *
 * Cards:
 *   1  Tenant details    — name, email, phone
 *   2  Tenancy terms     — property, rent, frequency, first payment, lease dates
 *   3  Optional extras   — emergency contact, employment, notes  (can be skipped)
 *
 * UX rules:
 *   - Full-screen centred card, #F8FAFC background — matches old wizard feel
 *   - Large step title with icon, progress bar at top
 *   - Inline field validation — errors appear under each field on blur / submit
 *   - Save Tenant fires only on card 3 (or when the landlord skips it)
 *   - Success screen only shown after confirmed backend write
 *   - Email pre-filled from TenantSelection email-first flow
 */
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
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

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fromISO(s: string): Date | null {
  if (!s) return null;
  const [y,m,d] = s.split('-').map(Number);
  if (!y||!m||!d) return null;
  return new Date(y, m-1, d, 12, 0, 0);
}
function defaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth()+1, 1, 12, 0, 0);
  const end   = new Date(start.getFullYear()+1, start.getMonth(), start.getDate(), 12, 0, 0);
  return { start: toISO(start), end: toISO(end), first: toISO(start) };
}
function blank(prefillEmail?: string, preselectedPropertyId?: string): FormData {
  const { start, end, first } = defaultDates();
  return {
    name:'', email: prefillEmail??'', phone:'',
    propertyId: preselectedPropertyId??'',
    rentAmount:'', paymentFrequency:'monthly',
    firstPaymentDate: first, leaseStart: start, leaseEnd: end,
    emergencyName:'', emergencyPhone:'', emergencyRelationship:'',
    employmentType:'', employer:'', annualIncome:'', notes:'',
  };
}

// ─── Card step definitions ────────────────────────────────────────────────────

const STEPS = [
  { id: 'tenant',   title: "Who is the tenant?",  subtitle: 'Personal details',         Icon: User,      color: '#06B6D4', bg: '#E0F7FA' },
  { id: 'tenancy',  title: 'Tenancy terms',        subtitle: 'Lease and payment details', Icon: Home,      color: '#136C9E', bg: '#E8F4F8' },
  { id: 'optional', title: 'Additional details',   subtitle: 'Optional — skip if unknown', Icon: Shield,    color: '#7C3AED', bg: '#F3E8FF' },
];

// ─── Shared styles ────────────────────────────────────────────────────────────

const F = 'w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:border-[#4E97CC] focus:outline-none transition-colors bg-white';
const FE = 'border-red-400 focus:border-red-400';
const LB = 'block text-sm font-semibold text-gray-700 mb-1.5';
const EM = 'text-xs text-red-500 mt-1 flex items-center gap-1';

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className={LB}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {error && <p className={EM}><AlertTriangle className="w-3 h-3"/>{error}</p>}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddTenant({ properties, onSave, onBack, preselectedPropertyId, prefillEmail, userProfile }: AddTenantProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(() => blank(prefillEmail, preselectedPropertyId));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string|null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Auto-fill rent when property chosen
  useEffect(() => {
    if (!form.propertyId) return;
    const p = properties.find(p => p.id === form.propertyId);
    if (p?.rent && !form.rentAmount) set('rentAmount', String(p.rent));
  }, [form.propertyId]);

  function set(f: keyof FormData, v: string) {
    setForm(prev => ({...prev, [f]: v}));
    if (errors[f]) setErrors(prev => ({...prev, [f]: undefined}));
    if (globalError) setGlobalError(null);
  }

  // ─── Per-step validation ──────────────────────────────────────────────────

  function validateStep(s: number): FieldErrors {
    const e: FieldErrors = {};
    if (s === 0) {
      if (!form.name.trim() || form.name.trim().length < 2)       e.name  = 'Full name required (min 2 chars)';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Valid email required';
      if (!/^[\+]?[\d\s\-\(\)]{10,}$/.test(form.phone.trim()))   e.phone = 'Valid phone required (min 10 digits)';
    }
    if (s === 1) {
      if (!form.propertyId)                                             e.propertyId     = 'Select a property';
      const r = parseFloat(form.rentAmount);
      if (!form.rentAmount || isNaN(r) || r <= 0)                       e.rentAmount     = 'Valid rent required';
      if (!form.firstPaymentDate || !fromISO(form.firstPaymentDate))    e.firstPaymentDate = 'Valid date required';
      if (!form.leaseStart || !fromISO(form.leaseStart))                e.leaseStart     = 'Valid date required';
      if (!form.leaseEnd || !fromISO(form.leaseEnd))                    e.leaseEnd       = 'Valid date required';
      else {
        const s = fromISO(form.leaseStart), en = fromISO(form.leaseEnd);
        if (s && en && en < s) e.leaseEnd = 'End must be after start';
      }
    }
    return e;
  }

  function goNext() {
    const e = validateStep(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setErrors({});
    setGlobalError(null);
    if (step === 0) { onBack(); return; }
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSave() {
    setGlobalError(null);
    if (!userProfile) { setGlobalError('You must be signed in.'); return; }
    setIsLoading(true);
    try {
      const property = properties.find(p => p.id === form.propertyId);
      const tenant: any = {
        name:          form.name.trim(),
        email:         form.email.trim().toLowerCase(),
        phone:         form.phone.trim(),
        propertyId:    form.propertyId,
        propertyAddress: property?.address ?? '',
        rentAmount:    parseFloat(form.rentAmount),
        paymentFrequency: form.paymentFrequency,
        firstPaymentDate: fromISO(form.firstPaymentDate) ?? new Date(),
        leaseStart:    fromISO(form.leaseStart) ?? new Date(),
        leaseEnd:      fromISO(form.leaseEnd)   ?? new Date(),
        status:        'active',
        referencingStatus: 'not-started',
        paymentStatus: 'current',
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
      await onSave(tenant);
      setSaved(true);
    } catch (err: any) {
      setGlobalError(err?.message || 'Failed to save tenant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Success ──────────────────────────────────────────────────────────────

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F8FAFC', fontFamily: 'Archivo, sans-serif' }}>
        <div className="text-center space-y-6 max-w-sm w-full animate-fade-in-up">
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
            <p className="text-gray-600 mt-2"><strong>{form.name}</strong> has been added to your tenant list.</p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => { setForm(blank(undefined, preselectedPropertyId)); setErrors({}); setSaved(false); setStep(0); }}
              className="w-full py-3 rounded-full border-2 font-semibold text-sm transition-all hover:bg-gray-50"
              style={{ borderColor: '#136C9E', color: '#136C9E' }}>
              Add another tenant
            </button>
            <button onClick={onBack}
              className="w-full py-3 rounded-full font-semibold text-sm text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #DC5F12, #DC5F12)' }}>
              Go to tenant list
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { title, subtitle, Icon, color, bg } = STEPS[step];
  const progress = ((step) / STEPS.length) * 100;

  // ─── Main card render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8FAFC', fontFamily: 'Archivo, sans-serif' }}>

      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-200">
        <div className="h-1 transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #136C9E, #4E97CC)' }} />
      </div>

      {/* Back button row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-0">
        <button onClick={goBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-xs text-gray-400 font-medium">Step {step + 1} of {STEPS.length}</span>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center px-4 pt-6 pb-10">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Card header */}
          <div className="px-8 pt-8 pb-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: bg }}>
              <Icon className="w-8 h-8" style={{ color }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#374957' }}>{title}</h1>
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            </div>
          </div>

          {/* Global error */}
          {globalError && (
            <div className="mx-8 mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{globalError}</p>
            </div>
          )}

          {/* ── Card 1: Tenant details ─────────────────────────── */}
          {step === 0 && (
            <div className="px-8 pb-8 space-y-4">
              <Field label="Full name" required error={errors.name}>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
                  <input type="text" value={form.name} onChange={e=>set('name',e.target.value)}
                    placeholder="e.g. James Okafor"
                    className={`${F} pl-10 ${errors.name?FE:''}`} autoComplete="name"/>
                </div>
              </Field>

              <Field label="Email address" required error={errors.email}>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
                  <input type="email" value={form.email} onChange={e=>set('email',e.target.value)}
                    placeholder="tenant@email.com"
                    className={`${F} pl-10 ${errors.email?FE:''}`} autoCapitalize="none"/>
                </div>
              </Field>

              <Field label="Phone number" required error={errors.phone}>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
                  <input type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)}
                    placeholder="+44 7000 000000"
                    className={`${F} pl-10 ${errors.phone?FE:''}`} autoComplete="tel"/>
                </div>
              </Field>
            </div>
          )}

          {/* ── Card 2: Tenancy terms ──────────────────────────── */}
          {step === 1 && (
            <div className="px-8 pb-8 space-y-4">
              <Field label="Property" required error={errors.propertyId}>
                <Select value={form.propertyId} onValueChange={v=>set('propertyId',v)}>
                  <SelectTrigger className={`${F} h-auto ${errors.propertyId?FE:''}`}>
                    <SelectValue placeholder="Select a property"/>
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(p=><SelectItem key={p.id} value={p.id}>{p.address}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Monthly rent (£)" required error={errors.rentAmount}>
                  <div className="relative">
                    <PoundSterling className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
                    <input type="number" min="1" value={form.rentAmount} onChange={e=>set('rentAmount',e.target.value)}
                      placeholder="1200" className={`${F} pl-10 ${errors.rentAmount?FE:''}`}/>
                  </div>
                </Field>
                <Field label="Frequency" required>
                  <Select value={form.paymentFrequency} onValueChange={v=>set('paymentFrequency',v as any)}>
                    <SelectTrigger className={`${F} h-auto`}><SelectValue/></SelectTrigger>
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
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
                  <input type="date" value={form.firstPaymentDate} onChange={e=>set('firstPaymentDate',e.target.value)}
                    className={`${F} pl-10 ${errors.firstPaymentDate?FE:''}`}/>
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Lease start" required error={errors.leaseStart}>
                  <input type="date" value={form.leaseStart} onChange={e=>set('leaseStart',e.target.value)}
                    className={`${F} ${errors.leaseStart?FE:''}`}/>
                </Field>
                <Field label="Lease end" required error={errors.leaseEnd}>
                  <input type="date" value={form.leaseEnd} onChange={e=>set('leaseEnd',e.target.value)}
                    className={`${F} ${errors.leaseEnd?FE:''}`}/>
                </Field>
              </div>
            </div>
          )}

          {/* ── Card 3: Optional extras ────────────────────────── */}
          {step === 2 && (
            <div className="px-8 pb-8 space-y-5">
              {/* Emergency contact */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5"/> Emergency contact
                </p>
                <Field label="Name">
                  <input type="text" value={form.emergencyName} onChange={e=>set('emergencyName',e.target.value)}
                    placeholder="Full name" className={F}/>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone">
                    <input type="tel" value={form.emergencyPhone} onChange={e=>set('emergencyPhone',e.target.value)}
                      placeholder="+44 7000 …" className={F}/>
                  </Field>
                  <Field label="Relationship">
                    <Select value={form.emergencyRelationship} onValueChange={v=>set('emergencyRelationship',v)}>
                      <SelectTrigger className={`${F} h-auto`}><SelectValue placeholder="Select…"/></SelectTrigger>
                      <SelectContent>
                        {['Parent','Spouse / Partner','Sibling','Friend','Colleague','Other'].map(r=>(
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
                  <Briefcase className="w-3.5 h-3.5"/> Employment
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Type">
                    <Select value={form.employmentType} onValueChange={v=>set('employmentType',v)}>
                      <SelectTrigger className={`${F} h-auto`}><SelectValue placeholder="Select…"/></SelectTrigger>
                      <SelectContent>
                        {['Full-time','Part-time','Self-employed','Student','Unemployed','Retired'].map(t=>(
                          <SelectItem key={t} value={t.toLowerCase().replace(' ','-')}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Annual income (£)">
                    <div className="relative">
                      <PoundSterling className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
                      <input type="number" min="0" value={form.annualIncome} onChange={e=>set('annualIncome',e.target.value)}
                        placeholder="35000" className={`${F} pl-10`}/>
                    </div>
                  </Field>
                </div>
                <Field label="Employer">
                  <input type="text" value={form.employer} onChange={e=>set('employer',e.target.value)}
                    placeholder="Employer name" className={F}/>
                </Field>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5"/> Notes
                </p>
                <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3}
                  placeholder="Any additional information…"
                  className={`${F} min-h-[80px] resize-y`}/>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="w-full max-w-lg mt-5 flex gap-3">
          {step < STEPS.length - 1 ? (
            <button onClick={goNext}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #136C9E, #1a87c4)' }}>
              Continue <ArrowRight className="w-5 h-5"/>
            </button>
          ) : (
            <button onClick={handleSave} disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-50 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #DC5F12, #DC5F12)' }}>
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin"/>Saving…</> : <><CheckCircle className="w-5 h-5"/>Save Tenant</>}
            </button>
          )}
          {step === STEPS.length - 1 && (
            <button onClick={handleSave} disabled={isLoading}
              className="px-5 py-4 rounded-2xl font-semibold text-sm border-2 transition-all hover:bg-gray-50 disabled:opacity-50"
              style={{ borderColor: '#136C9E', color: '#136C9E' }}>
              Skip &amp; Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddTenant;
