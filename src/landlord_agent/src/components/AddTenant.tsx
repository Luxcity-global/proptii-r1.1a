/**
 * AddTenant — matches the index11.html design system.
 *
 * Layout: left stepper sidebar + right form card (same as index11.html screen-grid).
 * Typography: Archivo headings, Nunito Sans body (via CSS classes).
 * Colours: --primary-blue #136C9E, --primary-orange #DC5F12.
 *
 * Flow:
 *   Step 0 — Mode select        (single vs bulk)
 *   Step 1 — Personal details   (name / email / phone)
 *   Step 2 — Tenancy terms      (property / rent / dates)
 *   Step 3 — Additional details (emergency / employment / notes, skippable)
 *   Summary — dossier card for review before final POST
 *   Success — confirmation after confirmed backend write
 */
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight,
  User, Mail, Phone, Home, PoundSterling, Calendar,
  Users, Briefcase, FileText, CheckCircle, AlertTriangle, Loader2, UserPlus,
  Upload, UsersRound,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Property, Tenant, UserProfile } from '../App';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddTenantProps {
  properties:              Property[];
  onSave:                  (tenant: Omit<Tenant, 'id'>) => Promise<void>;
  onBack:                  () => void;
  onBulkImport?:           () => void;
  preselectedPropertyId?:  string;
  prefillEmail?:           string;
  userProfile?:            UserProfile | null;
}

interface FormData {
  name: string; email: string; phone: string;
  propertyId: string; rentAmount: string;
  paymentFrequency: 'monthly' | 'yearly' | 'fixed-time';
  firstPaymentDate: string; leaseStart: string; leaseEnd: string;
  emergencyName: string; emergencyPhone: string; emergencyRelationship: string;
  employmentType: string; employer: string; annualIncome: string; notes: string;
}

type FieldErrors = Partial<Record<keyof FormData, string>>;
type View = 'mode' | 'step1' | 'step2' | 'step3' | 'summary' | 'success';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fromISO(s: string): Date | null {
  if (!s) return null;
  const [y,m,d] = s.split('-').map(Number);
  if (!y||!m||!d) return null;
  return new Date(y, m-1, d, 12, 0, 0);
}
function fmtDate(s: string): string {
  const d = fromISO(s);
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}
function blank(prefillEmail?: string, preselectedPropertyId?: string): FormData {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth()+1, 1, 12,0,0);
  const end   = new Date(start.getFullYear()+1, start.getMonth(), start.getDate(), 12,0,0);
  return {
    name:'', email: prefillEmail??'', phone:'',
    propertyId: preselectedPropertyId??'',
    rentAmount:'', paymentFrequency:'monthly',
    firstPaymentDate: toISO(start), leaseStart: toISO(start), leaseEnd: toISO(end),
    emergencyName:'', emergencyPhone:'', emergencyRelationship:'',
    employmentType:'', employer:'', annualIncome:'', notes:'',
  };
}
function initials(name: string): string {
  return name.trim().split(/\s+/).map(n=>n[0]??'').join('').toUpperCase().slice(0,2)||'?';
}

// ─── Stepper config ───────────────────────────────────────────────────────────

const STEPS: { view: View; label: string; sub: string; Icon: React.ElementType; bg: string; fg: string }[] = [
  { view:'step1', label:'Step 1:', sub:'Personal details',        Icon:User,     bg:'#dcf1fc', fg:'#0284c7' },
  { view:'step2', label:'Step 2:', sub:'Lease and payment details', Icon:Home,    bg:'#e0f2fe', fg:'#0369a1' },
  { view:'step3', label:'Step 3:', sub:'Additional details',       Icon:CheckCircle, bg:'#f3e8ff', fg:'#7e22ce' },
];

// ─── Shared field styles ──────────────────────────────────────────────────────

const INP = [
  'w-full h-12 bg-white border border-[#e2e8f0] rounded-2xl px-4',
  'font-[Nunito_Sans,sans-serif] text-[14px] text-[#1e293b]',
  'transition-all outline-none',
  'hover:border-[#cbd5e1]',
  'focus:border-[#136C9E] focus:ring-[3.5px] focus:ring-[rgba(19,108,158,0.12)]',
  'placeholder:text-[#94a3b8] placeholder:font-normal',
].join(' ');

const INP_ERR = 'border-[#ef4444] bg-[#fffafb]';
const LBL     = 'block text-[13px] font-semibold text-[#334155] mb-2 font-[Archivo,sans-serif]';
const HINT    = 'flex items-center gap-1 text-[11.5px] text-[#dc2626] mt-1.5';

function Fld({label,required,error,icon:Icon,children}:{
  label:string; required?:boolean; error?:string;
  icon?:React.ElementType; children:React.ReactNode;
}) {
  return (
    <div>
      <label className={LBL}>{label}{required&&<span className="text-[#ef4444] ml-0.5">*</span>}</label>
      <div className="relative">
        {Icon && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none flex">
          <Icon size={17} strokeWidth={2}/>
        </span>}
        {children}
      </div>
      {error && <p className={HINT}><AlertTriangle size={12}/>{error}</p>}
    </div>
  );
}

// ─── Stepper item ─────────────────────────────────────────────────────────────

function StepItem({step,current,done,onClick}:{
  step: typeof STEPS[0]; current:boolean; done:boolean; onClick:()=>void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center gap-3.5 px-3.5 py-3 rounded-[18px] w-full text-left border transition-all duration-200',
        current
          ? 'bg-[#edf6fb] border-[rgba(19,108,158,0.15)] shadow-[0_4px_12px_rgba(19,108,158,0.05)]'
          : 'bg-transparent border-transparent hover:bg-[#f8fafc]',
      ].join(' ')}
    >
      {/* Icon badge */}
      <span className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 transition-all"
        style={{ background: step.bg }}>
        <step.Icon size={20} strokeWidth={2} style={{ color: step.fg }}/>
      </span>
      {/* Labels */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold leading-tight" style={{ color: current?'#0c4a6e':'#1e293b', fontFamily:'Archivo,sans-serif' }}>{step.label}</p>
        <p className="text-[12.5px] mt-0.5 truncate" style={{ color: current?'#0284c7':'#64748b', fontFamily:'Archivo,sans-serif', fontWeight: current?600:400 }}>{step.sub}</p>
      </div>
      {/* Check badge */}
      <span className={[
        'w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all',
        done
          ? 'bg-white border-2 border-[#0284c7] shadow-[0_2px_6px_rgba(2,132,199,0.2)]'
          : 'bg-white border-[1.5px] border-[#0284c7]',
      ].join(' ')}>
        <CheckCircle size={13} className={done ? 'text-[#0284c7]' : 'text-[#0284c7] opacity-0'}/>
      </span>
    </button>
  );
}

// ─── Shell layout (MUST be defined outside AddTenant so React sees a stable
//     component identity across renders. Defining it inside the component body
//     causes the entire form tree to remount on every keystroke, stealing focus.) ──

interface ShellProps {
  title: string;
  sub: string;
  view: View;
  stepIndex: number;
  done: Record<'step1'|'step2'|'step3', boolean>;
  onBack: () => void;
  onNavStep: (i: number) => void;
  onClose: () => void;
  globalError: string | null;
  children: React.ReactNode;
}

function Shell({ title, sub, view, stepIndex, done, onBack, onNavStep, onClose, globalError, children }: ShellProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background:'#f7fafc', fontFamily:'Nunito Sans,sans-serif' }}>
      {/* Navbar */}
      <header className="h-[68px] px-6 flex items-center justify-between sticky top-0 z-50"
        style={{ backdropFilter:'blur(12px)', background:'rgba(255,255,255,0.72)', borderBottom:'1px solid rgba(226,232,240,0.65)' }}>
        <div className="flex items-center gap-4">
          <button type="button" onClick={onBack}
            className="w-9 h-9 rounded-full border border-[#e2e8f0] bg-white flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-all">
            <ArrowLeft size={16} strokeWidth={2.5}/>
          </button>
          <nav className="hidden sm:flex items-center gap-2 text-[13px] text-[#64748b] font-medium" style={{fontFamily:'Nunito Sans,sans-serif'}}>
            <span className="text-[#94a3b8] text-[11px]">/</span>
            <span className="font-bold text-[#1e293b]" style={{fontFamily:'Archivo,sans-serif'}}>Add New Tenant</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#64748b] font-medium" style={{fontFamily:'Archivo,sans-serif'}}>
            {view==='summary' ? 'Review' : view==='success' ? 'Done' : `Step ${stepIndex+1} of 3`}
          </span>
          <button type="button" onClick={onClose}
            className="w-9 h-9 rounded-full border border-[#e2e8f0] bg-white flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-all"
            title="Cancel and exit">
            ✕
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 flex items-start justify-center px-4 pt-10 pb-16">
        <div className="flex items-start justify-center gap-9 w-full max-w-[1060px]">

          {/* Stepper sidebar — hidden on summary/success */}
          {view !== 'success' && (
            <aside className="hidden md:block w-[280px] shrink-0 sticky top-[88px]"
              style={{ background:'white', borderRadius:28, boxShadow:'0 20px 45px -12px rgba(19,108,158,0.08),0 4px 16px -2px rgba(0,0,0,0.04)', padding:'24px 16px' }}>
              <div className="px-3 pb-4 mb-3" style={{borderBottom:'1px solid #f1f5f9'}}>
                <p className="text-[15px] font-bold text-[#1e293b]" style={{fontFamily:'Archivo,sans-serif'}}>Add Tenant</p>
                <p className="text-[12px] text-[#64748b] mt-0.5">3 simple steps to assign tenant</p>
              </div>
              <div className="flex flex-col gap-2.5">
                {STEPS.map((s, i) => (
                  <StepItem
                    key={s.view} step={s}
                    current={view===s.view||(view==='summary'&&i===2)}
                    done={done[s.view as keyof typeof done]}
                    onClick={() => onNavStep(i)}
                  />
                ))}
              </div>
            </aside>
          )}

          {/* Form card */}
          <section style={{
            width: view==='success' ? 480 : 530,
            maxWidth:'100%',
            background:'white',
            borderRadius: 28,
            boxShadow:'0 20px 45px -12px rgba(19,108,158,0.08),0 4px 16px -2px rgba(0,0,0,0.04)',
            padding: '40px 42px 44px',
          }}>
            <h1 className="text-[24px] font-bold text-center mb-1 tracking-[-0.02em]"
              style={{ fontFamily:'Archivo,sans-serif', color:'#1e293b' }}>{title}</h1>
            <p className="text-[13.5px] text-[#64748b] text-center mb-7">{sub}</p>

            {/* Global error */}
            {globalError && (
              <div className="flex items-start gap-2 p-3 rounded-xl border border-red-200 bg-red-50 mb-5">
                <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0"/>
                <p className="text-[13px] text-red-700">{globalError}</p>
              </div>
            )}

            {children}
          </section>
        </div>
      </main>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddTenant({ properties, onSave, onBack, onBulkImport, preselectedPropertyId, prefillEmail, userProfile }: AddTenantProps) {
  const [form, setForm]           = useState<FormData>(() => blank(prefillEmail, preselectedPropertyId));
  const [errors, setErrors]       = useState<FieldErrors>({});
  const [globalError, setGE]      = useState<string|null>(null);
  const [isLoading, setLoading]   = useState(false);
  const [view, setView]           = useState<View>(() => 'step1');

  // track which steps are done for the stepper badges
  const [done, setDone] = useState<Record<'step1'|'step2'|'step3', boolean>>({ step1:false, step2:false, step3:false });

  // Auto-fill rent from property
  useEffect(() => {
    if (!form.propertyId) return;
    const p = properties.find(p => p.id === form.propertyId);
    if (p?.rent && !form.rentAmount) sf('rentAmount', String(p.rent));
  }, [form.propertyId]);

  function sf(f: keyof FormData, v: string) {
    setForm(prev => ({...prev, [f]:v}));
    if (errors[f]) setErrors(prev => ({...prev, [f]:undefined}));
    if (globalError) setGE(null);
  }

  // ─── Per-step validation ──────────────────────────────────────────────────

  function v1(): FieldErrors {
    const e: FieldErrors = {};
    if (!form.name.trim() || form.name.trim().length<2)        e.name  = 'Full name required (min 2 chars)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Valid email required';
    if (!/^[\+]?[\d\s\-\(\)]{10,}$/.test(form.phone.trim()))   e.phone = 'Valid phone required (min 10 digits)';
    return e;
  }

  function v2(): FieldErrors {
    const e: FieldErrors = {};
    if (!form.propertyId)                              e.propertyId     = 'Select a property';
    const r = parseFloat(form.rentAmount);
    if (!form.rentAmount || isNaN(r) || r<=0)          e.rentAmount     = 'Valid rent required';
    if (!fromISO(form.firstPaymentDate))               e.firstPaymentDate = 'Valid date required';
    if (!fromISO(form.leaseStart))                     e.leaseStart     = 'Valid date required';
    if (!fromISO(form.leaseEnd))                       e.leaseEnd       = 'Valid date required';
    else {
      const s=fromISO(form.leaseStart), en=fromISO(form.leaseEnd);
      if (s&&en&&en<s) e.leaseEnd = 'End must be after start';
    }
    return e;
  }

  function goTo(next: View, currentStep?: 'step1'|'step2'|'step3') {
    setErrors({}); setGE(null);
    if (currentStep) setDone(prev => ({...prev, [currentStep]:true}));
    setView(next);
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function handleStep1() {
    const e = v1(); setErrors(e);
    if (Object.keys(e).length) { setGE('Please fix the errors above.'); return; }
    goTo('step2','step1');
  }
  function handleStep2() {
    const e = v2(); setErrors(e);
    if (Object.keys(e).length) { setGE('Please fix the errors above.'); return; }
    goTo('step3','step2');
  }
  function handleReview(skip=false) {
    if (skip) { goTo('summary','step3'); return; }
    goTo('summary','step3');
  }

  // ─── Confirm & POST ───────────────────────────────────────────────────────

  async function handleConfirm() {
    if (!userProfile) { setGE('You must be signed in.'); return; }
    setGE(null); setLoading(true);
    try {
      const property = properties.find(p => p.id === form.propertyId);
      const tenant: any = {
        name:              form.name.trim(),
        email:             form.email.trim().toLowerCase(),
        phone:             form.phone.trim(),
        propertyId:        form.propertyId,
        propertyAddress:   property?.address ?? '',
        rentAmount:        parseFloat(form.rentAmount),
        paymentFrequency:  form.paymentFrequency,
        firstPaymentDate:  fromISO(form.firstPaymentDate) ?? new Date(),
        leaseStart:        fromISO(form.leaseStart)       ?? new Date(),
        leaseEnd:          fromISO(form.leaseEnd)         ?? new Date(),
        status:            'active',
        referencingStatus: 'not-started',
        paymentStatus:     'current',
        emergencyContact:  { name: form.emergencyName.trim(), phone: form.emergencyPhone.trim(), relationship: form.emergencyRelationship },
        defaultRiskScore:  75,
        ...(form.employer       && { employer:       form.employer.trim() }),
        ...(form.annualIncome   && { annualIncome:   parseFloat(form.annualIncome) }),
        ...(form.employmentType && { employmentType: form.employmentType }),
        ...(form.notes          && { notes:          form.notes.trim() }),
      };
      await onSave(tenant);
      setView('success');
    } catch (err: any) {
      setGE(err?.message || 'Failed to save tenant. Please try again.');
      setView('form' as any);
      setView('step3');
    } finally {
      setLoading(false);
    }
  }

  // ─── Page shell helpers ───────────────────────────────────────────────────

  const stepIndex = { mode:0, step1:0, step2:1, step3:2, summary:2, success:3 }[view] ?? 0;

  const shellBack = () => {
    if (view==='mode' || view==='success') { onBack(); return; }
    if (view==='step1') setView('mode');
    else if (view==='step2') setView('step1');
    else if (view==='step3') setView('step2');
    else if (view==='summary') setView('step3');
  };

  const shellNavStep = (i: number) => {
    if (i===0) setView('step1');
    else if (i===1 && (done.step1||view==='step2'||view==='step3'||view==='summary')) setView('step2');
    else if (i===2 && (done.step2||view==='step3'||view==='summary')) setView('step3');
  };

  // ─── Mode select (Step 0) ─────────────────────────────────────────────────

  if (view === 'mode') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#f7fafc', fontFamily: 'Nunito Sans,sans-serif' }}>
        {/* Navbar */}
        <header className="h-[68px] px-6 flex items-center justify-between sticky top-0 z-50"
          style={{ backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.72)', borderBottom: '1px solid rgba(226,232,240,0.65)' }}>
          <div className="flex items-center gap-4">
            <button type="button" onClick={onBack}
              className="w-9 h-9 rounded-full border border-[#e2e8f0] bg-white flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-all">
              <ArrowLeft size={16} strokeWidth={2.5}/>
            </button>
            <span className="font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif', fontSize: 15 }}>Add Tenant</span>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-[520px]">
            <div style={{ background: 'white', borderRadius: 28, boxShadow: '0 20px 45px -12px rgba(19,108,158,0.08),0 4px 16px -2px rgba(0,0,0,0.04)', padding: '48px 44px 52px' }}>
              <h1 className="text-[24px] font-bold text-center mb-2" style={{ fontFamily: 'Archivo,sans-serif', color: '#1e293b' }}>
                How would you like to add tenants?
              </h1>
              <p className="text-[13.5px] text-[#64748b] text-center mb-9">
                Add a single tenant manually, or import many tenants at once from a CSV file.
              </p>

              <div className="flex flex-col gap-4">
                {/* Single */}
                <button
                  type="button"
                  onClick={() => setView('step1')}
                  className="w-full text-left flex items-center gap-4 p-5 rounded-[20px] border-2 transition-all hover:-translate-y-0.5 group"
                  style={{ borderColor: '#136C9E', background: 'white' }}
                >
                  <div className="w-14 h-14 rounded-[16px] flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
                    style={{ background: '#dcf1fc' }}>
                    <User size={24} style={{ color: '#136C9E' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[16px] font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif' }}>Single Tenant</p>
                    <p className="text-[13px] text-[#64748b] mt-0.5">Fill in details step by step for one tenant</p>
                  </div>
                  <ArrowRight size={18} className="text-[#136C9E] shrink-0" />
                </button>

                {/* Bulk */}
                <button
                  type="button"
                  onClick={() => onBulkImport?.()}
                  disabled={!onBulkImport}
                  className="w-full text-left flex items-center gap-4 p-5 rounded-[20px] border-2 transition-all hover:-translate-y-0.5 group disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: '#DC5F12', background: 'white' }}
                >
                  <div className="w-14 h-14 rounded-[16px] flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
                    style={{ background: '#fff3ed' }}>
                    <Upload size={24} style={{ color: '#DC5F12' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[16px] font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif' }}>Bulk Import via CSV</p>
                    <p className="text-[13px] text-[#64748b] mt-0.5">Upload a spreadsheet to add up to 500 tenants at once</p>
                  </div>
                  <ArrowRight size={18} className="text-[#DC5F12] shrink-0" />
                </button>
              </div>

              <p className="text-[12px] text-[#94a3b8] text-center mt-7">
                You can assign tenants to properties after import using Bulk Assign on the Properties page.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Success ──────────────────────────────────────────────────────────────

  if (view === 'success') {
    const property = properties.find(p => p.id === form.propertyId);
    return (
      <Shell title="Tenant Saved Successfully!" sub="The tenancy record has been created."
        view={view} stepIndex={stepIndex} done={done}
        onBack={shellBack} onNavStep={shellNavStep} onClose={onBack} globalError={globalError}>
        <div className="text-center">
          <div className="w-[72px] h-[72px] rounded-full bg-[#dcfce7] flex items-center justify-center mx-auto mb-5"
            style={{boxShadow:'0 6px 20px rgba(22,163,74,0.18)'}}>
            <CheckCircle size={36} className="text-[#16a34a]"/>
          </div>

          {/* Dossier box */}
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[18px] p-5 text-left mt-6 mb-6">
            <div className="flex items-center gap-3.5 pb-4 mb-4" style={{borderBottom:'1px solid #e2e8f0'}}>
              <div className="w-12 h-12 rounded-[14px] bg-[#136C9E] flex items-center justify-center text-white text-lg font-bold"
                style={{fontFamily:'Archivo,sans-serif'}}>{initials(form.name)}</div>
              <div>
                <p className="text-[16px] font-bold text-[#1e293b]" style={{fontFamily:'Archivo,sans-serif'}}>{form.name}</p>
                <p className="text-[13px] text-[#64748b]">{form.email} · {form.phone}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[13px]">
              {[
                ['Assigned Property', property?.address || '—'],
                ['Agreed Rent', `£${parseFloat(form.rentAmount||'0').toLocaleString('en-GB')} / ${form.paymentFrequency}`],
                ['Lease Duration', `${fmtDate(form.leaseStart)} – ${fmtDate(form.leaseEnd)}`],
                ['First Payment Due', fmtDate(form.firstPaymentDate)],
                ...(form.emergencyName ? [['Emergency Contact', `${form.emergencyName}${form.emergencyRelationship?` (${form.emergencyRelationship})`:''}`]] : []),
                ...(form.employmentType||form.annualIncome ? [['Employment', `${form.employmentType||'Employed'}${form.annualIncome?` · £${parseFloat(form.annualIncome).toLocaleString('en-GB')}/yr`:''}`]] : []),
              ].map(([lbl, val]) => (
                <div key={lbl}>
                  <p className="text-[11.5px] uppercase font-semibold tracking-[0.04em] text-[#94a3b8]">{lbl}</p>
                  <p className="font-semibold text-[#1e293b] mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setForm(blank(undefined, preselectedPropertyId)); setErrors({}); setDone({step1:false,step2:false,step3:false}); setView('step1'); }}
              className="w-full h-[50px] rounded-[14px] font-semibold flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
              style={{ background:'#136C9E', color:'white', fontFamily:'Archivo,sans-serif', fontSize:15, boxShadow:'0 4px 14px rgba(19,108,158,0.28)' }}>
              <span>+</span> Add Another Tenant
            </button>
            <button
              onClick={onBack}
              className="w-full h-[50px] rounded-[14px] font-semibold border flex items-center justify-center gap-2 transition-all hover:bg-[#eaf3f8]"
              style={{ borderColor:'#136C9E', color:'#136C9E', fontFamily:'Archivo,sans-serif', fontSize:14.5 }}>
              View Tenant in Dashboard
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // ─── Summary (review dossier) ─────────────────────────────────────────────

  if (view === 'summary') {
    const property = properties.find(p => p.id === form.propertyId);
    const freqMap: Record<string,string> = { monthly:'Monthly', yearly:'Yearly', 'fixed-time':'Fixed Time' };
    return (
      <Shell title="Review Before Adding" sub="Check all details carefully before confirming"
        view={view} stepIndex={stepIndex} done={done}
        onBack={shellBack} onNavStep={shellNavStep} onClose={onBack} globalError={globalError}>
        {/* Dossier box */}
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[18px] p-5 text-left mb-6">
          <div className="flex items-center gap-3.5 pb-4 mb-4" style={{borderBottom:'1px solid #e2e8f0'}}>
            <div className="w-12 h-12 rounded-[14px] bg-[#136C9E] flex items-center justify-center text-white text-lg font-bold"
              style={{fontFamily:'Archivo,sans-serif'}}>{initials(form.name)}</div>
            <div>
              <p className="text-[16px] font-bold text-[#1e293b]" style={{fontFamily:'Archivo,sans-serif'}}>{form.name}</p>
              <p className="text-[13px] text-[#64748b]">{form.email} · {form.phone}</p>
            </div>
          </div>

          {/* Section divider — Tenancy */}
          <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[#475569] border-b border-dashed border-[#e2e8f0] pb-1.5 mb-3 mt-1"
            style={{fontFamily:'Archivo,sans-serif'}}>
            <Home size={14} className="text-[#64748b]"/> Tenancy
          </div>
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-[13px] mb-4">
            {[
              ['Property', property?.address || '—'],
              ['Monthly rent', `£${parseFloat(form.rentAmount||'0').toLocaleString('en-GB')}`],
              ['Frequency', freqMap[form.paymentFrequency]||'Monthly'],
              ['First payment', fmtDate(form.firstPaymentDate)],
              ['Lease start', fmtDate(form.leaseStart)],
              ['Lease end', fmtDate(form.leaseEnd)],
            ].map(([l,v])=>(
              <div key={l}>
                <p className="text-[11px] uppercase font-semibold tracking-[0.04em] text-[#94a3b8]">{l}</p>
                <p className="font-semibold text-[#1e293b] mt-0.5 text-[12.5px]">{v}</p>
              </div>
            ))}
          </div>

          {/* Emergency */}
          {(form.emergencyName||form.emergencyPhone) && <>
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[#475569] border-b border-dashed border-[#e2e8f0] pb-1.5 mb-3 mt-3"
              style={{fontFamily:'Archivo,sans-serif'}}>
              <Users size={14} className="text-[#64748b]"/> Emergency Contact
            </div>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[13px] mb-3">
              {form.emergencyName && <div><p className="text-[11px] uppercase font-semibold tracking-[0.04em] text-[#94a3b8]">Name</p><p className="font-semibold text-[#1e293b] mt-0.5 text-[12.5px]">{form.emergencyName}</p></div>}
              {form.emergencyPhone && <div><p className="text-[11px] uppercase font-semibold tracking-[0.04em] text-[#94a3b8]">Phone</p><p className="font-semibold text-[#1e293b] mt-0.5 text-[12.5px]">{form.emergencyPhone}</p></div>}
              {form.emergencyRelationship && <div><p className="text-[11px] uppercase font-semibold tracking-[0.04em] text-[#94a3b8]">Relationship</p><p className="font-semibold text-[#1e293b] mt-0.5 text-[12.5px]">{form.emergencyRelationship}</p></div>}
            </div>
          </>}

          {/* Employment */}
          {(form.employer||form.employmentType||form.annualIncome) && <>
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[#475569] border-b border-dashed border-[#e2e8f0] pb-1.5 mb-3 mt-3"
              style={{fontFamily:'Archivo,sans-serif'}}>
              <Briefcase size={14} className="text-[#64748b]"/> Employment
            </div>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[13px] mb-3">
              {form.employmentType && <div><p className="text-[11px] uppercase font-semibold tracking-[0.04em] text-[#94a3b8]">Type</p><p className="font-semibold text-[#1e293b] mt-0.5 text-[12.5px]">{form.employmentType}</p></div>}
              {form.employer && <div><p className="text-[11px] uppercase font-semibold tracking-[0.04em] text-[#94a3b8]">Employer</p><p className="font-semibold text-[#1e293b] mt-0.5 text-[12.5px]">{form.employer}</p></div>}
              {form.annualIncome && <div><p className="text-[11px] uppercase font-semibold tracking-[0.04em] text-[#94a3b8]">Annual income</p><p className="font-semibold text-[#1e293b] mt-0.5 text-[12.5px]">£{parseFloat(form.annualIncome).toLocaleString('en-GB')}/yr</p></div>}
            </div>
          </>}

          {/* Notes */}
          {form.notes && <>
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[#475569] border-b border-dashed border-[#e2e8f0] pb-1.5 mb-3 mt-3"
              style={{fontFamily:'Archivo,sans-serif'}}>
              <FileText size={14} className="text-[#64748b]"/> Notes
            </div>
            <p className="text-[13px] text-[#475569] leading-relaxed">{form.notes}</p>
          </>}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="button" onClick={() => setView('step3')}
            className="flex-1 h-[50px] rounded-[14px] border font-semibold text-[14.5px] flex items-center justify-center transition-all hover:bg-[#eaf3f8]"
            style={{ borderColor:'#136C9E', color:'#136C9E', fontFamily:'Archivo,sans-serif' }}>
            Edit Details
          </button>
          <button type="button" onClick={handleConfirm} disabled={isLoading}
            className="flex-1 h-[50px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:-translate-y-px"
            style={{ background:'#DC5F12', fontFamily:'Archivo,sans-serif', boxShadow:'0 4px 14px rgba(220,95,18,0.32)' }}>
            {isLoading ? <><Loader2 size={18} className="animate-spin"/>Adding…</> : <><CheckCircle size={18}/>Confirm &amp; Add Tenant</>}
          </button>
        </div>
      </Shell>
    );
  }

  // ─── Step inputs ──────────────────────────────────────────────────────────

  const selClass = `${INP} appearance-none pr-10 cursor-pointer`;

  return (
    <Shell
      title={ view==='step1' ? "Who is the tenant?" : view==='step2' ? "Tenancy terms" : "Additional details" }
      sub={ view==='step1' ? "Personal details" : view==='step2' ? "Lease and payment details" : "Optional — skip if unknown" }
      view={view} stepIndex={stepIndex} done={done}
      onBack={shellBack} onNavStep={shellNavStep} onClose={onBack} globalError={globalError}
    >

      {/* ── Step 1 ─────────────────────────────────────────── */}
      {view === 'step1' && (
        <div className="space-y-5">
          <Fld label="Full name" required error={errors.name} icon={User}>
            <input type="text" value={form.name} onChange={e=>sf('name',e.target.value)}
              placeholder="e.g. James Okafor" autoComplete="name"
              className={`${INP} pl-11 ${errors.name?INP_ERR:''}`}/>
          </Fld>
          <Fld label="Email address" required error={errors.email} icon={Mail}>
            <input type="email" value={form.email} onChange={e=>sf('email',e.target.value)}
              placeholder="tenant@email.com" autoCapitalize="none"
              className={`${INP} pl-11 ${errors.email?INP_ERR:''}`}/>
          </Fld>
          <Fld label="Phone number" required error={errors.phone} icon={Phone}>
            <input type="tel" value={form.phone} onChange={e=>sf('phone',e.target.value)}
              placeholder="+44 7000 000000" autoComplete="tel"
              className={`${INP} pl-11 ${errors.phone?INP_ERR:''}`}/>
          </Fld>

          <div className="pt-3">
            <button type="button" onClick={handleStep1}
              className="w-full h-[50px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
              style={{ background:'#136C9E', fontFamily:'Archivo,sans-serif', boxShadow:'0 4px 14px rgba(19,108,158,0.28)' }}>
              Continue <ArrowRight size={18} strokeWidth={2.5}/>
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2 ─────────────────────────────────────────── */}
      {view === 'step2' && (
        <div className="space-y-5">
          <Fld label="Property" required error={errors.propertyId}>
            <div className="relative">
              <Select value={form.propertyId} onValueChange={v=>sf('propertyId',v)}>
                <SelectTrigger className={`${INP} h-12 ${errors.propertyId?INP_ERR:''}`}>
                  <SelectValue placeholder="Select a property"/>
                </SelectTrigger>
                <SelectContent>
                  {properties.map(p=><SelectItem key={p.id} value={p.id}>{p.address}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </Fld>

          <div className="grid grid-cols-2 gap-4">
            <Fld label="Monthly rent (£)" required error={errors.rentAmount}>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b] font-bold text-[15px] pointer-events-none">£</span>
              <input type="number" min="1" value={form.rentAmount} onChange={e=>sf('rentAmount',e.target.value)}
                placeholder="1200" className={`${INP} pl-8 ${errors.rentAmount?INP_ERR:''}`}/>
            </Fld>
            <Fld label="Frequency" required>
              <Select value={form.paymentFrequency} onValueChange={v=>sf('paymentFrequency',v as any)}>
                <SelectTrigger className={`${INP} h-12`}><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="fixed-time">Fixed Time</SelectItem>
                </SelectContent>
              </Select>
            </Fld>
          </div>

          <Fld label="First payment date" required error={errors.firstPaymentDate} icon={Calendar}>
            <input type="date" value={form.firstPaymentDate} onChange={e=>sf('firstPaymentDate',e.target.value)}
              className={`${INP} pl-11 ${errors.firstPaymentDate?INP_ERR:''}`}/>
          </Fld>

          <div className="grid grid-cols-2 gap-4">
            <Fld label="Lease start" required error={errors.leaseStart}>
              <input type="date" value={form.leaseStart} onChange={e=>sf('leaseStart',e.target.value)}
                className={`${INP} ${errors.leaseStart?INP_ERR:''}`}/>
            </Fld>
            <Fld label="Lease end" required error={errors.leaseEnd}>
              <input type="date" value={form.leaseEnd} onChange={e=>sf('leaseEnd',e.target.value)}
                className={`${INP} ${errors.leaseEnd?INP_ERR:''}`}/>
            </Fld>
          </div>

          {/* Quick duration pills */}
          <div>
            <span className="text-[11.5px] text-[#64748b] font-semibold">Quick duration:</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {[6,12,24,36].map(m=>(
                <button key={m} type="button"
                  onClick={()=>{
                    const s=fromISO(form.leaseStart)||new Date();
                    const e=new Date(s); e.setMonth(e.getMonth()+m);
                    sf('leaseEnd', toISO(e));
                  }}
                  className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-[#475569] hover:bg-[#e2e8f0] transition-colors"
                  style={{fontFamily:'Archivo,sans-serif'}}
                >{m} Mo</button>
              ))}
            </div>
          </div>

          <div className="pt-1 flex flex-col gap-3">
            <button type="button" onClick={handleStep2}
              className="w-full h-[50px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
              style={{ background:'#136C9E', fontFamily:'Archivo,sans-serif', boxShadow:'0 4px 14px rgba(19,108,158,0.28)' }}>
              Continue <ArrowRight size={18} strokeWidth={2.5}/>
            </button>
            <button type="button" onClick={()=>setView('step1')}
              className="flex items-center justify-center gap-1.5 mx-auto text-[13px] font-semibold text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] px-3 py-1.5 rounded-lg transition-all"
              style={{fontFamily:'Archivo,sans-serif'}}>
              <ArrowLeft size={14} strokeWidth={2.5}/> Back to Personal details
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3 ─────────────────────────────────────────── */}
      {view === 'step3' && (
        <div className="space-y-5">

          {/* Emergency Contact */}
          <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[#475569] border-b border-dashed border-[#e2e8f0] pb-2"
            style={{fontFamily:'Archivo,sans-serif'}}>
            <Users size={15} className="text-[#64748b]"/> Emergency Contact
          </div>
          <Fld label="Name">
            <input type="text" value={form.emergencyName} onChange={e=>sf('emergencyName',e.target.value)}
              placeholder="Full name" className={INP}/>
          </Fld>
          <div className="grid grid-cols-2 gap-4">
            <Fld label="Phone">
              <input type="tel" value={form.emergencyPhone} onChange={e=>sf('emergencyPhone',e.target.value)}
                placeholder="+44 7000 …" className={INP}/>
            </Fld>
            <Fld label="Relationship">
              <Select value={form.emergencyRelationship} onValueChange={v=>sf('emergencyRelationship',v)}>
                <SelectTrigger className={`${INP} h-12`}><SelectValue placeholder="Select…"/></SelectTrigger>
                <SelectContent>
                  {['Parent','Spouse / Partner','Sibling','Child','Friend','Colleague','Other'].map(r=>(
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Fld>
          </div>

          {/* Employment */}
          <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[#475569] border-b border-dashed border-[#e2e8f0] pb-2 mt-1"
            style={{fontFamily:'Archivo,sans-serif'}}>
            <Briefcase size={15} className="text-[#64748b]"/> Employment
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Fld label="Type">
              <Select value={form.employmentType} onValueChange={v=>sf('employmentType',v)}>
                <SelectTrigger className={`${INP} h-12`}><SelectValue placeholder="Select…"/></SelectTrigger>
                <SelectContent>
                  {['Full-time','Part-time','Self-employed','Contractor','Student','Retired','Other'].map(t=>(
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Fld>
            <Fld label="Annual income (£)">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b] font-bold text-[15px] pointer-events-none">£</span>
              <input type="number" min="0" step="500" value={form.annualIncome}
                onChange={e=>sf('annualIncome',e.target.value)}
                placeholder="35000" className={`${INP} pl-8`}/>
            </Fld>
          </div>
          <Fld label="Employer">
            <input type="text" value={form.employer} onChange={e=>sf('employer',e.target.value)}
              placeholder="Employer name" className={INP}/>
          </Fld>

          {/* Notes */}
          <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[#475569] border-b border-dashed border-[#e2e8f0] pb-2 mt-1"
            style={{fontFamily:'Archivo,sans-serif'}}>
            <FileText size={15} className="text-[#64748b]"/> Notes
          </div>
          <textarea value={form.notes} onChange={e=>sf('notes',e.target.value)} rows={3}
            placeholder="Any additional information…"
            className={`${INP} h-auto py-3 resize-y min-h-[96px]`}
            style={{lineHeight:1.5}}/>

          {/* Actions */}
          <div className="pt-1 space-y-3">
            <div className="flex gap-3">
              <button type="button" onClick={()=>handleReview()}
                className="flex-1 h-[50px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
                style={{ background:'#DC5F12', fontFamily:'Archivo,sans-serif', boxShadow:'0 4px 14px rgba(220,95,18,0.32)' }}>
                <CheckCircle size={18}/> Review &amp; Save
              </button>
              <button type="button" onClick={()=>handleReview(true)}
                className="h-[50px] px-5 rounded-[14px] font-semibold border flex items-center justify-center transition-all hover:bg-[#eaf3f8]"
                style={{ borderColor:'#136C9E', color:'#136C9E', fontFamily:'Archivo,sans-serif', fontSize:14.5 }}>
                Skip &amp; Save
              </button>
            </div>
            <button type="button" onClick={()=>setView('step2')}
              className="flex items-center justify-center gap-1.5 mx-auto text-[13px] font-semibold text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] px-3 py-1.5 rounded-lg transition-all"
              style={{fontFamily:'Archivo,sans-serif'}}>
              <ArrowLeft size={14} strokeWidth={2.5}/> Back to Tenancy terms
            </button>
          </div>
        </div>
      )}

    </Shell>
  );
}

export default AddTenant;
