/**
 * AddPropertyWizard
 *
 * A single-component, multi-step wizard that replaces the 5 separate full-page
 * screens (PropertyTypeSelection → PropertyDetailsSelection → AmenitiesSelection →
 * ImagesAndNotesSelection → PropertyPreview). All wizard state lives here and is
 * lifted to the parent via callbacks when the landlord hits "Publish / Save".
 *
 * Steps:
 *   1 — Property Type
 *   2 — Property Details  (address, rent, beds, baths, sq ft)
 *   3 — Amenities
 *   4 — Photos & Notes
 *   5 — Review & Publish
 *
 * Design system: matches AddTenant — sidebar stepper + centred form card,
 * Archivo headings, Nunito Sans body, primary blue #136C9E, accent orange #DC5F12.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Home,
  Building2,
  Users,
  Briefcase,
  HelpCircle,
  MapPin,
  PoundSterling,
  BedDouble,
  Bath,
  Maximize2,
  Wifi,
  Car,
  Dog,
  Dumbbell,
  Waves,
  TreePine,
  Shield,
  Utensils,
  WashingMachine,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Plus,
  Check,
  Eye,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WizardPropertyData {
  propertyType: string | null;
  address: string;
  monthlyRent: string;
  bedrooms: string;
  bathrooms: string;
  squareFootage: string;
  uploadedDocuments: File[];
  amenities: string[];
  images: string[];       // blob: URLs for preview
  imageFiles: File[];     // actual File objects for upload
  additionalNotes: string;
  status?: 'vacant' | 'occupied' | 'under-renovation';
}

interface AddPropertyWizardProps {
  /** Pre-filled data when editing an existing property */
  initialData?: Partial<WizardPropertyData>;
  isEditing?: boolean;
  isPublishing?: boolean;
  onPublish: (data: WizardPropertyData) => Promise<void>;
  onBulkImport?: () => void;
  onBack: () => void;           // cancel → previous screen
  onAddTenant?: () => void;     // from review step
}

type Step = 1 | 2 | 3 | 4 | 5;

type FieldErrors = Partial<Record<string, string>>;

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { step: 1 as Step, label: 'Step 1:', sub: 'Property Type',    icon: Home },
  { step: 2 as Step, label: 'Step 2:', sub: 'Property Details', icon: MapPin },
  { step: 3 as Step, label: 'Step 3:', sub: 'Amenities',        icon: Wifi },
  { step: 4 as Step, label: 'Step 4:', sub: 'Photos & Notes',   icon: ImageIcon },
  { step: 5 as Step, label: 'Step 5:', sub: 'Review & Publish', icon: CheckCircle },
];

const PROPERTY_TYPES = [
  { id: 'house',      name: 'House',               icon: Home,      desc: 'Detached, semi-detached or terraced' },
  { id: 'flat',       name: 'Flat / Apartment',    icon: Building2, desc: 'Self-contained residential unit' },
  { id: 'studio',     name: 'Studio',              icon: Home,      desc: 'Single room with kitchen and bathroom' },
  { id: 'shared',     name: 'Room in shared house',icon: Users,     desc: 'Private room in shared accommodation' },
  { id: 'commercial', name: 'Commercial',          icon: Briefcase, desc: 'Business or retail property' },
  { id: 'other',      name: 'Other',               icon: HelpCircle,desc: 'Any other property type' },
];

const AMENITIES = [
  { id: 'wifi',            name: 'WiFi',            icon: Wifi },
  { id: 'parking',         name: 'Parking',         icon: Car },
  { id: 'pet-friendly',    name: 'Pet Friendly',    icon: Dog },
  { id: 'gym',             name: 'Gym',             icon: Dumbbell },
  { id: 'pool',            name: 'Swimming Pool',   icon: Waves },
  { id: 'garden',          name: 'Garden',          icon: TreePine },
  { id: 'security',        name: 'Security',        icon: Shield },
  { id: 'kitchen',         name: 'Kitchen',         icon: Utensils },
  { id: 'washing-machine', name: 'Washing Machine', icon: WashingMachine },
];

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: 'House', flat: 'Flat / Apartment', studio: 'Studio',
  shared: 'Room in shared house', commercial: 'Commercial', other: 'Other',
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const INP = [
  'w-full h-12 bg-white border border-[#e2e8f0] rounded-2xl px-4',
  'font-[Nunito_Sans,sans-serif] text-[14px] text-[#1e293b]',
  'transition-all outline-none',
  'hover:border-[#cbd5e1]',
  'focus:border-[#136C9E] focus:ring-[3.5px] focus:ring-[rgba(19,108,158,0.12)]',
  'placeholder:text-[#94a3b8] placeholder:font-normal',
].join(' ');

const INP_ERR = 'border-[#ef4444] bg-[#fffafb]';
const LBL     = 'block text-[13px] font-semibold text-[#334155] mb-1.5 font-[Archivo,sans-serif]';
const HINT    = 'flex items-center gap-1 text-[11.5px] text-[#dc2626] mt-1.5';

// ─── Sub-components ───────────────────────────────────────────────────────────

function Fld({
  label, required, error, icon: Icon, children,
}: {
  label: string; required?: boolean; error?: string;
  icon?: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div>
      <label className={LBL}>
        {label}{required && <span className="text-[#ef4444] ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none flex">
            <Icon size={17} strokeWidth={2} />
          </span>
        )}
        {children}
      </div>
      {error && (
        <p className={HINT}>
          <AlertTriangle size={12} />{error}
        </p>
      )}
    </div>
  );
}

function StepItem({
  s, current, done, onClick,
}: {
  s: typeof STEPS[0]; current: boolean; done: boolean; onClick: () => void;
}) {
  const Icon = s.icon;
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
      <span
        className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
        style={{ background: current ? '#dcf1fc' : '#f1f5f9' }}
      >
        <Icon size={20} strokeWidth={2} style={{ color: current ? '#136C9E' : '#94a3b8' }} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold leading-tight"
          style={{ color: current ? '#0c4a6e' : '#1e293b', fontFamily: 'Archivo,sans-serif' }}>
          {s.label}
        </p>
        <p className="text-[12.5px] mt-0.5 truncate"
          style={{ color: current ? '#0284c7' : '#64748b', fontFamily: 'Archivo,sans-serif', fontWeight: current ? 600 : 400 }}>
          {s.sub}
        </p>
      </div>
      <span className={[
        'w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all',
        done
          ? 'bg-white border-2 border-[#0284c7] shadow-[0_2px_6px_rgba(2,132,199,0.2)]'
          : 'bg-white border-[1.5px] border-[#cbd5e1]',
      ].join(' ')}>
        <CheckCircle size={13} className={done ? 'text-[#0284c7]' : 'text-[#cbd5e1]'} />
      </span>
    </button>
  );
}

// ─── Blank form ───────────────────────────────────────────────────────────────

function blank(init?: Partial<WizardPropertyData>): WizardPropertyData {
  return {
    propertyType:      init?.propertyType      ?? null,
    address:           init?.address           ?? '',
    monthlyRent:       init?.monthlyRent        ?? '',
    bedrooms:          init?.bedrooms          ?? '',
    bathrooms:         init?.bathrooms         ?? '',
    squareFootage:     init?.squareFootage      ?? '',
    uploadedDocuments: init?.uploadedDocuments  ?? [],
    amenities:         init?.amenities         ?? [],
    images:            init?.images            ?? [],
    imageFiles:        init?.imageFiles        ?? [],
    additionalNotes:   init?.additionalNotes   ?? '',
    status:            init?.status,
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AddPropertyWizard({
  initialData, isEditing = false, isPublishing = false,
  onPublish, onBulkImport, onBack, onAddTenant,
}: AddPropertyWizardProps) {
  const [form, setForm]         = useState<WizardPropertyData>(() => blank(initialData));
  const [step, setStep]         = useState<Step>(1);
  const [done, setDone]         = useState<Record<Step, boolean>>({ 1:false,2:false,3:false,4:false,5:false });
  const [errors, setErrors]     = useState<FieldErrors>({});
  const [globalError, setGE]    = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [showModeModal, setShowModeModal] = useState(!isEditing && !!onBulkImport);
  const [modeChoice, setModeChoice]       = useState<'single'|'bulk'>('single');

  // Keep form in sync if initialData changes (edit mode repopulates)
  useEffect(() => {
    if (initialData) setForm(blank(initialData));
  }, [JSON.stringify(initialData)]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef  = useRef<HTMLInputElement>(null);

  function sf<K extends keyof WizardPropertyData>(k: K, v: WizardPropertyData[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
    if ((errors as any)[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
    if (globalError) setGE(null);
  }

  // ─── Validation ─────────────────────────────────────────────────────────────

  function v1(): FieldErrors {
    const e: FieldErrors = {};
    if (!form.propertyType) e.propertyType = 'Please select a property type';
    return e;
  }

  function v2(): FieldErrors {
    const e: FieldErrors = {};
    if (!form.address.trim())              e.address     = 'Property address is required';
    const rent = parseFloat(form.monthlyRent);
    if (!form.monthlyRent || isNaN(rent) || rent <= 0) e.monthlyRent = 'Enter a valid monthly rent';
    const beds = parseInt(form.bedrooms, 10);
    if (!form.bedrooms || isNaN(beds) || beds < 0 || beds > 50) e.bedrooms = 'Enter a valid number of bedrooms (0–50)';
    const baths = parseInt(form.bathrooms, 10);
    if (!form.bathrooms || isNaN(baths) || baths < 0 || baths > 20) e.bathrooms = 'Enter a valid number of bathrooms (0–20)';
    return e;
  }

  function advance(fromStep: Step) {
    const validators: Partial<Record<Step, () => FieldErrors>> = { 1: v1, 2: v2 };
    const validate = validators[fromStep];
    if (validate) {
      const e = validate();
      setErrors(e);
      if (Object.keys(e).length) { setGE('Please fix the errors above.'); return; }
    }
    setErrors({}); setGE(null);
    setDone(prev => ({ ...prev, [fromStep]: true }));
    const next = (fromStep + 1) as Step;
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goTo(s: Step) {
    // Allow navigating back to any step, or forward to completed steps
    if (s < step || done[s as Step] || s <= step) setStep(s);
  }

  // ─── Publish ─────────────────────────────────────────────────────────────────

  async function handlePublish() {
    const e = v2();
    if (!form.propertyType) (e as any).propertyType = 'Property type required';
    if (Object.keys(e).length) { setErrors(e); setGE('Fix the highlighted errors before publishing.'); return; }
    setGE(null);
    setPublishing(true);
    try {
      await onPublish(form);
    } catch (err: any) {
      setGE(err?.message || 'Failed to save property. Please try again.');
    } finally {
      setPublishing(false);
    }
  }

  // ─── Photo helpers ────────────────────────────────────────────────────────────

  function addImages(files: FileList | null) {
    if (!files) return;
    const arr   = Array.from(files);
    const blobs = arr.map(f => URL.createObjectURL(f));
    sf('images',    [...form.images,    ...blobs]);
    sf('imageFiles', [...form.imageFiles, ...arr]);
  }

  function removeImage(i: number) {
    const img = form.images[i];
    const blobsBefore = form.images.slice(0, i).filter(u => u.startsWith('blob:')).length;
    const newImages = form.images.filter((_, idx) => idx !== i);
    let newFiles = form.imageFiles;
    if (img?.startsWith('blob:')) newFiles = form.imageFiles.filter((_, fi) => fi !== blobsBefore);
    sf('images', newImages);
    sf('imageFiles', newFiles);
  }

  function addDocs(files: FileList | null) {
    if (!files) return;
    sf('uploadedDocuments', [...form.uploadedDocuments, ...Array.from(files)]);
  }

  function removeDoc(i: number) {
    sf('uploadedDocuments', form.uploadedDocuments.filter((_, idx) => idx !== i));
  }

  // ─── Mode modal ──────────────────────────────────────────────────────────────

  if (showModeModal && onBulkImport) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'url(/images/pti_home_background.png) center/cover no-repeat', fontFamily: 'Nunito Sans,sans-serif' }}>
        <div style={{
          background: '#fff', borderRadius: 26, padding: '40px 44px', maxWidth: 500, width: '100%',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.06)',
        }}>
          <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-4"
            style={{ background: '#eaf3f8', color: '#136C9E' }}>
            <Home size={24} />
          </div>
          <h2 className="text-[22px] font-bold mb-1.5"
            style={{ fontFamily: 'Archivo,sans-serif', color: '#1e293b' }}>
            How would you like to add properties?
          </h2>
          <p className="text-[13.5px] text-[#64748b] mb-7">
            Add a single property step-by-step, or import many at once from a spreadsheet.
          </p>

          <div className="flex flex-col gap-3 mb-7">
            {/* Single */}
            <button type="button" onClick={() => setModeChoice('single')}
              className="flex items-center gap-4 p-5 rounded-[20px] text-left transition-all"
              style={{
                border: `2px solid ${modeChoice === 'single' ? '#136C9E' : '#e2e8f0'}`,
                background: modeChoice === 'single' ? '#f0f7fb' : '#fff',
              }}>
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0"
                style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <Home size={22} />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-[#1e293b]"
                  style={{ fontFamily: 'Archivo,sans-serif' }}>Single Property</p>
                <p className="text-[12.5px] text-[#64748b] mt-0.5">
                  Fill in details step-by-step for one property.
                </p>
              </div>
              <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{
                  borderColor: modeChoice === 'single' ? '#136C9E' : '#cbd5e1',
                  background:  modeChoice === 'single' ? '#136C9E' : 'transparent',
                }}>
                {modeChoice === 'single' && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
            </button>

            {/* Bulk */}
            <button type="button" onClick={() => setModeChoice('bulk')}
              className="flex items-center gap-4 p-5 rounded-[20px] text-left transition-all"
              style={{
                border: `2px solid ${modeChoice === 'bulk' ? '#DC5F12' : '#e2e8f0'}`,
                background: modeChoice === 'bulk' ? '#fff3ec' : '#fff',
              }}>
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0"
                style={{ background: '#fff3ec', color: '#DC5F12' }}>
                <Upload size={22} />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-[#1e293b]"
                  style={{ fontFamily: 'Archivo,sans-serif' }}>Multiple Properties (CSV)</p>
                <p className="text-[12.5px] text-[#64748b] mt-0.5">
                  Upload a spreadsheet to add up to 500 properties at once.
                </p>
              </div>
              <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{
                  borderColor: modeChoice === 'bulk' ? '#DC5F12' : '#cbd5e1',
                  background:  modeChoice === 'bulk' ? '#DC5F12' : 'transparent',
                }}>
                {modeChoice === 'bulk' && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
            </button>
          </div>

          <button type="button"
            onClick={() => {
              if (modeChoice === 'bulk') { onBulkImport(); }
              else { setShowModeModal(false); }
            }}
            className="w-full h-[50px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
            style={{ background: '#136C9E', fontFamily: 'Archivo,sans-serif', boxShadow: '0 4px 14px rgba(19,108,158,0.28)' }}>
            Continue <ArrowRight size={18} strokeWidth={2.5} />
          </button>

          <button type="button" onClick={onBack}
            className="w-full mt-3 text-[13px] text-[#64748b] hover:text-[#1e293b] font-semibold py-2 rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ─── Step titles ─────────────────────────────────────────────────────────────

  const STEP_META: Record<Step, { title: string; sub: string }> = {
    1: { title: 'Property Type',    sub: 'Choose the type that best describes your property' },
    2: { title: 'Property Details', sub: 'Address, rent and key specifications' },
    3: { title: 'Amenities',        sub: 'Select features available at this property' },
    4: { title: 'Photos & Notes',   sub: 'Add photos and any extra information' },
    5: { title: 'Review & Publish', sub: isEditing ? 'Confirm changes before saving' : 'Check all details before going live' },
  };
  const { title, sub } = STEP_META[step];

  // ─── Shell ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'url(/images/pti_home_background.png) center/cover no-repeat', fontFamily: 'Nunito Sans,sans-serif' }}>
      {/* Navbar */}
      <header className="h-[68px] px-6 flex items-center justify-between sticky top-0 z-50"
        style={{ backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.80)', borderBottom: '1px solid rgba(226,232,240,0.65)' }}>
        <div className="flex items-center gap-4">
          <button type="button" onClick={onBack}
            className="w-9 h-9 rounded-full border border-[#e2e8f0] bg-white flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-all">
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <nav className="hidden sm:flex items-center gap-2 text-[13px] text-[#64748b]">
            <span className="text-[#94a3b8] text-[11px]">/</span>
            <span className="font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif' }}>
              {isEditing ? 'Edit Property' : 'Add New Property'}
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#64748b] font-medium" style={{ fontFamily: 'Archivo,sans-serif' }}>
            Step {step} of 5
          </span>
          <button type="button" onClick={onBack}
            className="w-9 h-9 rounded-full border border-[#e2e8f0] bg-white flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-all"
            title="Cancel">
            ✕
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 flex items-start justify-center px-4 pt-10 pb-16">
        <div className="flex items-start justify-center gap-9 w-full max-w-[1060px]">

          {/* Sidebar stepper */}
          <aside className="hidden md:block w-[280px] shrink-0 sticky top-[88px]"
            style={{ background: 'white', borderRadius: 28, boxShadow: '0 20px 45px -12px rgba(19,108,158,0.08),0 4px 16px -2px rgba(0,0,0,0.04)', padding: '24px 16px' }}>
            <div className="px-3 pb-4 mb-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <p className="text-[15px] font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif' }}>
                {isEditing ? 'Edit Property' : 'Add Property'}
              </p>
              <p className="text-[12px] text-[#64748b] mt-0.5">5 steps to list your property</p>
            </div>
            <div className="flex flex-col gap-2">
              {STEPS.map(s => (
                <StepItem key={s.step} s={s} current={step === s.step} done={done[s.step]} onClick={() => goTo(s.step)} />
              ))}
            </div>
          </aside>

          {/* Form card */}
          <section style={{
            width: 530, maxWidth: '100%', background: 'white',
            borderRadius: 28,
            boxShadow: '0 20px 45px -12px rgba(19,108,158,0.08),0 4px 16px -2px rgba(0,0,0,0.04)',
            padding: '40px 42px 44px',
          }}>
            {/* Step heading */}
            <h1 className="text-[24px] font-bold text-center mb-1 tracking-[-0.02em]"
              style={{ fontFamily: 'Archivo,sans-serif', color: '#1e293b' }}>{title}</h1>
            <p className="text-[13.5px] text-[#64748b] text-center mb-7">{sub}</p>

            {/* Global error banner */}
            {globalError && (
              <div className="flex items-start gap-2 p-3 rounded-xl border border-red-200 bg-red-50 mb-5">
                <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-[13px] text-red-700">{globalError}</p>
              </div>
            )}

            {/* ── STEP 1: Property Type ─────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {PROPERTY_TYPES.map(pt => {
                    const Icon = pt.icon;
                    const sel  = form.propertyType === pt.id;
                    return (
                      <button key={pt.id} type="button"
                        onClick={() => sf('propertyType', pt.id)}
                        className="relative flex flex-col items-start gap-2 p-4 rounded-[18px] border-2 transition-all text-left hover:-translate-y-0.5"
                        style={{
                          borderColor: sel ? '#136C9E' : '#e2e8f0',
                          background:  sel ? '#f0f8fd' : '#fff',
                          boxShadow:   sel ? '0 4px 16px rgba(19,108,158,0.12)' : 'none',
                        }}>
                        <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: sel ? '#136C9E' : '#f1f5f9' }}>
                          <Check size={11} className="text-white" strokeWidth={3} />
                        </span>
                        <span className="w-10 h-10 rounded-[12px] flex items-center justify-center"
                          style={{ background: sel ? '#dcf1fc' : '#f8fafc' }}>
                          <Icon size={20} style={{ color: sel ? '#136C9E' : '#94a3b8' }} />
                        </span>
                        <div>
                          <p className="text-[13.5px] font-bold text-[#1e293b]"
                            style={{ fontFamily: 'Archivo,sans-serif' }}>{pt.name}</p>
                          <p className="text-[11.5px] text-[#64748b] mt-0.5 leading-snug">{pt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.propertyType && (
                  <p className={HINT}><AlertTriangle size={12} />{errors.propertyType}</p>
                )}
                <div className="pt-2">
                  <button type="button" onClick={() => advance(1)}
                    className="w-full h-[50px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
                    style={{ background: '#136C9E', fontFamily: 'Archivo,sans-serif', boxShadow: '0 4px 14px rgba(19,108,158,0.28)' }}>
                    Continue <ArrowRight size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Property Details ──────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <Fld label="Property Address" required error={errors.address} icon={MapPin}>
                  <input type="text" value={form.address}
                    onChange={e => sf('address', e.target.value)}
                    placeholder="e.g. 12 Church Lane, London, SW1A 1AA"
                    className={`${INP} pl-11 ${errors.address ? INP_ERR : ''}`} />
                </Fld>
                <Fld label="Monthly Rent (£)" required error={errors.monthlyRent} icon={PoundSterling}>
                  <input type="number" min="1" value={form.monthlyRent}
                    onChange={e => sf('monthlyRent', e.target.value)}
                    placeholder="1200"
                    className={`${INP} pl-11 ${errors.monthlyRent ? INP_ERR : ''}`} />
                </Fld>
                <div className="grid grid-cols-2 gap-4">
                  <Fld label="Bedrooms" required error={errors.bedrooms} icon={BedDouble}>
                    <input type="number" min="0" max="50" value={form.bedrooms}
                      onChange={e => sf('bedrooms', e.target.value)}
                      placeholder="2"
                      className={`${INP} pl-11 ${errors.bedrooms ? INP_ERR : ''}`} />
                  </Fld>
                  <Fld label="Bathrooms" required error={errors.bathrooms} icon={Bath}>
                    <input type="number" min="0" max="20" value={form.bathrooms}
                      onChange={e => sf('bathrooms', e.target.value)}
                      placeholder="1"
                      className={`${INP} pl-11 ${errors.bathrooms ? INP_ERR : ''}`} />
                  </Fld>
                </div>
                <Fld label="Square Footage (optional)" icon={Maximize2}>
                  <input type="number" min="1" value={form.squareFootage}
                    onChange={e => sf('squareFootage', e.target.value)}
                    placeholder="750"
                    className={`${INP} pl-11`} />
                </Fld>

                {/* Docs */}
                <div>
                  <label className={LBL}>Property Documents <span className="text-[#94a3b8] font-normal">(optional)</span></label>
                  <button type="button" onClick={() => docInputRef.current?.click()}
                    className="w-full h-11 rounded-[14px] border border-dashed border-[#cbd5e1] flex items-center justify-center gap-2 text-[13px] text-[#64748b] hover:border-[#136C9E] hover:text-[#136C9E] hover:bg-[#f0f8fd] transition-all"
                    style={{ fontFamily: 'Archivo,sans-serif' }}>
                    <FileText size={16} /> Upload documents (PDF, DOC)
                  </button>
                  <input ref={docInputRef} type="file" multiple accept=".pdf,.doc,.docx,image/*"
                    className="hidden" onChange={e => addDocs(e.target.files)} />
                  {form.uploadedDocuments.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {form.uploadedDocuments.map((f, i) => (
                        <li key={i} className="flex items-center justify-between bg-[#f8fafc] rounded-[10px] px-3 py-2">
                          <span className="text-[12.5px] text-[#334155] truncate flex items-center gap-2">
                            <FileText size={13} className="text-[#64748b] shrink-0" />{f.name}
                          </span>
                          <button type="button" onClick={() => removeDoc(i)}
                            className="w-5 h-5 rounded-full bg-[#fee2e2] text-[#dc2626] flex items-center justify-center ml-2 shrink-0 hover:bg-[#fca5a5] transition-colors">
                            <X size={11} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-2 space-y-3">
                  <button type="button" onClick={() => advance(2)}
                    className="w-full h-[50px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
                    style={{ background: '#136C9E', fontFamily: 'Archivo,sans-serif', boxShadow: '0 4px 14px rgba(19,108,158,0.28)' }}>
                    Continue <ArrowRight size={18} strokeWidth={2.5} />
                  </button>
                  <button type="button" onClick={() => setStep(1)}
                    className="flex items-center justify-center gap-1.5 mx-auto text-[13px] font-semibold text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] px-3 py-1.5 rounded-lg transition-all">
                    <ArrowLeft size={14} strokeWidth={2.5} /> Back to Property Type
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Amenities ─────────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {AMENITIES.map(a => {
                    const Icon = a.icon;
                    const sel  = form.amenities.includes(a.id);
                    return (
                      <button key={a.id} type="button"
                        onClick={() => {
                          const next = sel
                            ? form.amenities.filter(x => x !== a.id)
                            : [...form.amenities, a.id];
                          sf('amenities', next);
                        }}
                        className="relative flex flex-col items-start gap-2 p-4 rounded-[16px] border-2 transition-all text-left hover:-translate-y-0.5"
                        style={{
                          borderColor: sel ? '#136C9E' : '#e2e8f0',
                          background:  sel ? '#f0f8fd' : '#fff',
                        }}>
                        <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: sel ? '#136C9E' : '#f1f5f9' }}>
                          <Check size={11} className="text-white" strokeWidth={3} />
                        </span>
                        <Icon size={20} style={{ color: sel ? '#136C9E' : '#94a3b8' }} />
                        <p className="text-[12.5px] font-semibold text-[#334155]"
                          style={{ fontFamily: 'Archivo,sans-serif' }}>{a.name}</p>
                      </button>
                    );
                  })}
                </div>
                {form.amenities.length > 0 && (
                  <p className="text-[12px] text-[#64748b] text-center">
                    {form.amenities.length} amenit{form.amenities.length === 1 ? 'y' : 'ies'} selected
                  </p>
                )}
                <div className="pt-2 space-y-3">
                  <button type="button" onClick={() => advance(3)}
                    className="w-full h-[50px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
                    style={{ background: '#136C9E', fontFamily: 'Archivo,sans-serif', boxShadow: '0 4px 14px rgba(19,108,158,0.28)' }}>
                    Continue <ArrowRight size={18} strokeWidth={2.5} />
                  </button>
                  <button type="button" onClick={() => setStep(2)}
                    className="flex items-center justify-center gap-1.5 mx-auto text-[13px] font-semibold text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] px-3 py-1.5 rounded-lg transition-all">
                    <ArrowLeft size={14} strokeWidth={2.5} /> Back to Property Details
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Photos & Notes ────────────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-6">
                {/* Upload zone */}
                <div>
                  <label className={LBL}>Property Photos <span className="text-[#94a3b8] font-normal">(recommended: 4+)</span></label>
                  <div
                    className="border-2 border-dashed border-[#e2e8f0] rounded-[18px] p-8 text-center cursor-pointer transition-all hover:border-[#136C9E] hover:bg-[#f0f8fd]"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); addImages(e.dataTransfer.files); }}>
                    <Upload size={32} className="mx-auto mb-3 text-[#94a3b8]" />
                    <p className="text-[14px] font-semibold text-[#334155]"
                      style={{ fontFamily: 'Archivo,sans-serif' }}>Drag & drop or click to upload</p>
                    <p className="text-[12px] text-[#64748b] mt-1">JPG, PNG, HEIC — max 10MB each</p>
                  </div>
                  <input ref={fileInputRef} type="file" multiple accept="image/*"
                    className="hidden" onChange={e => addImages(e.target.files)} />
                </div>

                {/* Photo grid */}
                {form.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {form.images.map((src, i) => (
                      <div key={i} className="relative group aspect-video rounded-[12px] overflow-hidden bg-[#f1f5f9]">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        {i === 0 && (
                          <span className="absolute top-1.5 left-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ background: '#136C9E', fontFamily: 'Archivo,sans-serif' }}>Cover</span>
                        )}
                        <button type="button" onClick={() => removeImage(i)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="aspect-video rounded-[12px] border-2 border-dashed border-[#e2e8f0] flex items-center justify-center text-[#94a3b8] hover:border-[#136C9E] hover:text-[#136C9E] hover:bg-[#f0f8fd] transition-all">
                      <Plus size={20} />
                    </button>
                  </div>
                )}

                {form.images.length > 0 && form.images.length < 4 && (
                  <div className="flex items-center gap-2 p-3 rounded-[12px] bg-amber-50 border border-amber-200">
                    <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                    <p className="text-[12px] text-amber-700">
                      Properties with 4+ photos attract more enquiries.
                    </p>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className={LBL}>Additional Notes <span className="text-[#94a3b8] font-normal">(optional)</span></label>
                  <textarea
                    value={form.additionalNotes}
                    onChange={e => sf('additionalNotes', e.target.value)}
                    rows={4}
                    placeholder="Any additional information about this property…"
                    className={`${INP} h-auto py-3 resize-y min-h-[96px]`}
                    style={{ lineHeight: 1.5 }}
                  />
                </div>

                <div className="pt-2 space-y-3">
                  <button type="button" onClick={() => advance(4)}
                    className="w-full h-[50px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
                    style={{ background: '#DC5F12', fontFamily: 'Archivo,sans-serif', boxShadow: '0 4px 14px rgba(220,95,18,0.32)' }}>
                    <Eye size={18} /> Review & Publish
                  </button>
                  <button type="button" onClick={() => setStep(3)}
                    className="flex items-center justify-center gap-1.5 mx-auto text-[13px] font-semibold text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] px-3 py-1.5 rounded-lg transition-all">
                    <ArrowLeft size={14} strokeWidth={2.5} /> Back to Amenities
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 5: Review & Publish ──────────────────────────────────── */}
            {step === 5 && (
              <div className="space-y-5">
                {/* Dossier */}
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[18px] p-8 space-y-6">

                  {/* Cover photo */}
                  {form.images.length > 0 && (
                    <div className="rounded-[12px] overflow-hidden aspect-square">
                      <img src={form.images[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Core info */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[16px] font-bold text-[#1e293b]"
                          style={{ fontFamily: 'Archivo,sans-serif' }}>{form.address || '—'}</p>
                        <p className="text-[13px] text-[#64748b] mt-0.5">
                          {PROPERTY_TYPE_LABELS[form.propertyType || ''] || '—'}
                        </p>
                      </div>
                      <span className="text-[15px] font-bold text-[#136C9E] shrink-0"
                        style={{ fontFamily: 'Archivo,sans-serif' }}>
                        £{parseFloat(form.monthlyRent || '0').toLocaleString('en-GB')}/mo
                      </span>
                    </div>
                  </div>

                  {/* Spec grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Bedrooms',   value: form.bedrooms   || '—' },
                      { label: 'Bathrooms',  value: form.bathrooms  || '—' },
                      { label: 'Sq Ft',      value: form.squareFootage || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white rounded-[12px] border border-[#e2e8f0] p-3 text-center">
                        <p className="text-[11px] uppercase font-semibold tracking-wide text-[#94a3b8]">{label}</p>
                        <p className="text-[15px] font-bold text-[#1e293b] mt-0.5"
                          style={{ fontFamily: 'Archivo,sans-serif' }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Amenities */}
                  {form.amenities.length > 0 && (
                    <div>
                      <p className="text-[11px] uppercase font-semibold tracking-wide text-[#94a3b8] mb-2">Amenities</p>
                      <div className="flex flex-wrap gap-1.5">
                        {form.amenities.map(id => {
                          const a = AMENITIES.find(x => x.id === id);
                          return a ? (
                            <span key={id} className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
                              style={{ background: '#eaf3f8', color: '#136C9E', border: '1px solid rgba(19,108,158,0.18)' }}>
                              {a.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Photos count */}
                  <p className="text-[12.5px] text-[#64748b]">
                    {form.images.length} photo{form.images.length !== 1 ? 's' : ''} · {form.uploadedDocuments.length} document{form.uploadedDocuments.length !== 1 ? 's' : ''}
                  </p>

                  {/* Notes */}
                  {form.additionalNotes && (
                    <div>
                      <p className="text-[11px] uppercase font-semibold tracking-wide text-[#94a3b8] mb-1">Notes</p>
                      <p className="text-[13px] text-[#475569] leading-relaxed">{form.additionalNotes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(4)}
                    className="flex-1 h-[50px] rounded-[14px] border font-semibold text-[14.5px] flex items-center justify-center transition-all hover:bg-[#eaf3f8]"
                    style={{ borderColor: '#136C9E', color: '#136C9E', fontFamily: 'Archivo,sans-serif' }}>
                    Edit Details
                  </button>
                  <button type="button" onClick={handlePublish} disabled={publishing || isPublishing}
                    className="flex-1 h-[50px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:-translate-y-px"
                    style={{ background: '#DC5F12', fontFamily: 'Archivo,sans-serif', boxShadow: '0 4px 14px rgba(220,95,18,0.32)' }}>
                    {(publishing || isPublishing)
                      ? <><Loader2 size={18} className="animate-spin" />{isEditing ? 'Saving…' : 'Publishing…'}</>
                      : <><CheckCircle size={18} />{isEditing ? 'Save Changes' : 'Publish Property'}</>}
                  </button>
                </div>

                {/* Add tenant shortcut */}
                {!isEditing && onAddTenant && (
                  <button type="button" onClick={onAddTenant}
                    className="w-full h-[44px] rounded-[14px] border border-dashed border-[#136C9E] text-[13.5px] font-semibold text-[#136C9E] flex items-center justify-center gap-2 hover:bg-[#f0f8fd] transition-all"
                    style={{ fontFamily: 'Archivo,sans-serif' }}>
                    <Plus size={15} strokeWidth={2.5} /> Add a Tenant Now
                  </button>
                )}
              </div>
            )}

          </section>
        </div>
      </main>
    </div>
  );
}

export default AddPropertyWizard;
