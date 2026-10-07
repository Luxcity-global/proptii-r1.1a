/**
 * EditProperty — single-page form with collapsible numbered sections.
 *
 * Same visual design as EditTenant. Four sections:
 *   1  Property Type      — house / flat / studio / shared / commercial / other
 *   2  Property Details   — address, rent, beds, baths, sq ft
 *   3  Amenities & Notes  — toggleable amenity chips + notes textarea
 *   4  Status             — occupancy status (admin quick-set)
 *
 * All fields pre-populated from the existing property record.
 * All sections open by default — data already exists.
 * Save fires only after confirmed backend write.
 */
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Home,
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
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Settings,
  Building2,
  Users,
  HelpCircle,
  Briefcase,
  Check,
} from 'lucide-react';
import type { Property, UserProfile } from '../App';

// ─── Constants ────────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { id: 'house',      name: 'House',                icon: Home,       desc: 'Detached, semi-detached or terraced' },
  { id: 'flat',       name: 'Flat / Apartment',     icon: Building2,  desc: 'Self-contained residential unit' },
  { id: 'studio',     name: 'Studio',               icon: Home,       desc: 'Single room with kitchen and bathroom' },
  { id: 'shared',     name: 'Room in shared house', icon: Users,      desc: 'Private room in shared accommodation' },
  { id: 'commercial', name: 'Commercial',           icon: Briefcase,  desc: 'Business or retail property' },
  { id: 'other',      name: 'Other',                icon: HelpCircle, desc: 'Any other property type' },
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditPropertyProps {
  property: Property;
  userProfile?: UserProfile | null;
  onSave: (updates: Partial<Omit<Property, 'id' | 'createdAt' | 'tenant'>>) => Promise<void>;
  onBack: () => void;
}

interface FormData {
  type:         string;
  address:      string;
  rent:         string;
  bedrooms:     string;
  bathrooms:    string;
  squareFootage:string;
  amenities:    string[];
  notes:        string;
  status:       Property['status'];
}

type FieldErrors = Partial<Record<keyof FormData, string>>;

// ─── Styles (same tokens as EditTenant) ──────────────────────────────────────

const F  = 'w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:border-[#4E97CC] focus:outline-none transition-colors bg-white';
const FE = 'border-red-400 focus:border-red-400';
const LB = 'block text-sm font-semibold text-gray-700 mb-1.5';
const EM = 'text-xs text-red-500 mt-1.5 flex items-center gap-1';

// ─── Sub-components ───────────────────────────────────────────────────────────

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
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function propertyToForm(p: Property): FormData {
  return {
    type:          p.type || '',
    address:       p.address || '',
    rent:          p.rent ? String(p.rent) : '',
    bedrooms:      p.bedrooms != null ? String(p.bedrooms) : '',
    bathrooms:     (p as any).bathrooms != null ? String((p as any).bathrooms) : '',
    squareFootage: (p as any).squareFootage != null ? String((p as any).squareFootage) : '',
    amenities:     p.amenities || [],
    notes:         p.notes || '',
    status:        p.status || 'vacant',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditProperty({ property, userProfile, onSave, onBack }: EditPropertyProps) {
  const [form,        setForm]        = useState<FormData>(() => propertyToForm(property));
  const [errors,      setErrors]      = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isLoading,   setIsLoading]   = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [open,        setOpen]        = useState<[boolean, boolean, boolean, boolean]>([true, true, true, true]);

  function toggle(i: 0 | 1 | 2 | 3) {
    setOpen(prev => { const n = [...prev] as typeof open; n[i] = !n[i]; return n; });
  }

  useEffect(() => {
    setForm(propertyToForm(property));
    setErrors({});
    setGlobalError(null);
    setSaved(false);
    setOpen([true, true, true, true]);
  }, [property.id]);

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
    if ((errors as any)[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
    if (globalError) setGlobalError(null);
  }

  function toggleAmenity(id: string) {
    const next = form.amenities.includes(id)
      ? form.amenities.filter(a => a !== id)
      : [...form.amenities, id];
    set('amenities', next);
  }

  // ─── Section completion ───────────────────────────────────────────────────

  const s1ok = !!form.type;
  const s2ok = !!(
    form.address.trim() &&
    parseFloat(form.rent) > 0 &&
    parseInt(form.bedrooms, 10) >= 0
  );

  // ─── Validation ───────────────────────────────────────────────────────────

  function validate(): boolean {
    const e: FieldErrors = {};
    if (!form.type)                                  e.type     = 'Select a property type';
    if (!form.address.trim())                        e.address  = 'Address is required';
    const r = parseFloat(form.rent);
    if (!form.rent || isNaN(r) || r <= 0)            e.rent     = 'Enter a valid monthly rent';
    const b = parseInt(form.bedrooms, 10);
    if (form.bedrooms === '' || isNaN(b) || b < 0)   e.bedrooms = 'Enter a valid number of bedrooms';
    if (form.bathrooms !== '') {
      const ba = parseInt(form.bathrooms, 10);
      if (isNaN(ba) || ba < 0) e.bathrooms = 'Enter a valid number of bathrooms';
    }
    setErrors(e);
    // Auto-open sections with errors
    const s1err = !!(e.type);
    const s2err = !!(e.address || e.rent || e.bedrooms || e.bathrooms);
    if (s1err || s2err) {
      setOpen(prev => [prev[0] || s1err, prev[1] || s2err, prev[2], prev[3]]);
    }
    return Object.keys(e).length === 0;
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    setGlobalError(null);
    if (!userProfile) { setGlobalError('You must be signed in to edit a property.'); return; }
    if (!validate()) {
      setGlobalError('Please fix the highlighted errors before saving.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setIsLoading(true);
    try {
      const updates: Partial<Omit<Property, 'id' | 'createdAt' | 'tenant'>> = {
        type:     form.type,
        address:  form.address.trim(),
        rent:     parseFloat(form.rent),
        bedrooms: parseInt(form.bedrooms, 10),
        amenities: form.amenities,
        notes:    form.notes,
        status:   form.status,
      };
      if (form.bathrooms !== '') (updates as any).bathrooms = parseInt(form.bathrooms, 10);
      if (form.squareFootage !== '') (updates as any).squareFootage = parseInt(form.squareFootage, 10);
      await onSave(updates);
      setSaved(true);
    } catch (err: any) {
      setGlobalError(err?.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Success screen ───────────────────────────────────────────────────────

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: '#F8FAFC', fontFamily: 'Archivo, sans-serif' }}>
        <div className="text-center space-y-6 max-w-sm w-full">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
            style={{ background: '#dcfce7' }}>
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#136C9E' }}>Changes Saved</h1>
            <p className="text-gray-600 mt-2">
              <strong>{form.address.split(',')[0]}</strong>'s details have been updated.
            </p>
          </div>
          <button
            onClick={onBack}
            className="w-full py-3.5 rounded-full font-semibold text-sm text-white transition-all hover:opacity-90"
            style={{ background: '#DC5F12' }}
          >
            Back to property
          </button>
        </div>
      </div>
    );
  }

  // ─── Main form ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: '#F8FAFC', fontFamily: 'Archivo, sans-serif' }}>

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold leading-tight" style={{ color: '#136C9E' }}>Edit Property</h1>
            <p className="text-xs text-gray-400 leading-tight truncate max-w-[220px]">
              {property.address}
            </p>
          </div>
        </div>
        <button
          form="edit-property-form"
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 hover:opacity-90"
          style={{ background: '#DC5F12' }}
        >
          {isLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
            : <><CheckCircle className="w-4 h-4" />Save Changes</>}
        </button>
      </div>

      <form
        id="edit-property-form"
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

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

            {/* ── Section 1: Property Type ── */}
            <SectionHeader
              num={1} icon={Home} iconColor="#136C9E" iconBg="#E8F4F8"
              title="Property Type" subtitle="What kind of property is this?"
              complete={s1ok} open={open[0]} onToggle={() => toggle(0)}
            />
            {open[0] && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {PROPERTY_TYPES.map(pt => {
                    const Icon = pt.icon;
                    const sel  = form.type === pt.id;
                    return (
                      <button key={pt.id} type="button"
                        onClick={() => set('type', pt.id)}
                        className="relative flex flex-col items-start gap-2 p-4 rounded-[18px] border-2 transition-all text-left hover:-translate-y-0.5"
                        style={{
                          borderColor: sel ? '#136C9E' : '#e5e7eb',
                          background:  sel ? '#f0f8fd' : '#fff',
                          boxShadow:   sel ? '0 4px 16px rgba(19,108,158,0.12)' : 'none',
                        }}>
                        <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: sel ? '#136C9E' : '#f3f4f6' }}>
                          <Check size={11} className="text-white" strokeWidth={3} />
                        </span>
                        <span className="w-9 h-9 rounded-[12px] flex items-center justify-center"
                          style={{ background: sel ? '#dcf1fc' : '#f8fafc' }}>
                          <Icon size={18} style={{ color: sel ? '#136C9E' : '#9ca3af' }} />
                        </span>
                        <div>
                          <p className="text-[13px] font-bold text-gray-800">{pt.name}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{pt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.type && (
                  <p className={EM}><AlertTriangle className="w-3 h-3 shrink-0" />{errors.type}</p>
                )}
              </div>
            )}

            <div className="h-px bg-gray-100 mx-6" />

            {/* ── Section 2: Property Details ── */}
            <SectionHeader
              num={2} icon={MapPin} iconColor="#06B6D4" iconBg="#E0F7FA"
              title="Property Details" subtitle="Address, rent and key specifications"
              complete={s2ok} open={open[1]} onToggle={() => toggle(1)}
            />
            {open[1] && (
              <div className="px-6 pb-6 pt-1 space-y-4 border-t border-gray-100">
                <Field label="Property Address" required error={errors.address}>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="text" value={form.address}
                      onChange={e => set('address', e.target.value)}
                      placeholder="e.g. 12 Church Lane, London, SW1A 1AA"
                      className={`${F} pl-10 ${errors.address ? FE : ''}`} />
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Monthly Rent (£)" required error={errors.rent}>
                    <div className="relative">
                      <PoundSterling className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input type="number" min="1" value={form.rent}
                        onChange={e => set('rent', e.target.value)}
                        placeholder="1200"
                        className={`${F} pl-10 ${errors.rent ? FE : ''}`} />
                    </div>
                  </Field>
                  <Field label="Bedrooms" required error={errors.bedrooms}>
                    <div className="relative">
                      <BedDouble className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input type="number" min="0" max="50" value={form.bedrooms}
                        onChange={e => set('bedrooms', e.target.value)}
                        placeholder="2"
                        className={`${F} pl-10 ${errors.bedrooms ? FE : ''}`} />
                    </div>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bathrooms" error={errors.bathrooms}>
                    <div className="relative">
                      <Bath className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input type="number" min="0" max="20" value={form.bathrooms}
                        onChange={e => set('bathrooms', e.target.value)}
                        placeholder="1"
                        className={`${F} pl-10 ${errors.bathrooms ? FE : ''}`} />
                    </div>
                  </Field>
                  <Field label="Square Footage">
                    <div className="relative">
                      <Maximize2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input type="number" min="1" value={form.squareFootage}
                        onChange={e => set('squareFootage', e.target.value)}
                        placeholder="750"
                        className={`${F} pl-10`} />
                    </div>
                  </Field>
                </div>
              </div>
            )}

            <div className="h-px bg-gray-100 mx-6" />

            {/* ── Section 3: Amenities & Notes ── */}
            <SectionHeader
              num={3} icon={Wifi} iconColor="#7C3AED" iconBg="#F3E8FF"
              title="Amenities & Notes" subtitle="Features available and additional information"
              complete={false} open={open[2]} onToggle={() => toggle(2)}
            />
            {open[2] && (
              <div className="px-6 pb-6 pt-1 space-y-5 border-t border-gray-100">
                {/* Amenity grid */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 pt-2 mb-3">
                    <Wifi className="w-3.5 h-3.5" /> Amenities
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {AMENITIES.map(a => {
                      const Icon = a.icon;
                      const sel  = form.amenities.includes(a.id);
                      return (
                        <button key={a.id} type="button"
                          onClick={() => toggleAmenity(a.id)}
                          className="relative flex flex-col items-start gap-1.5 p-3 rounded-[14px] border-2 transition-all text-left"
                          style={{
                            borderColor: sel ? '#136C9E' : '#e5e7eb',
                            background:  sel ? '#f0f8fd' : '#fff',
                          }}>
                          <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ background: sel ? '#136C9E' : '#f3f4f6' }}>
                            <Check size={9} className="text-white" strokeWidth={3} />
                          </span>
                          <Icon size={16} style={{ color: sel ? '#136C9E' : '#9ca3af' }} />
                          <p className="text-[11px] font-semibold text-gray-700 leading-tight">{a.name}</p>
                        </button>
                      );
                    })}
                  </div>
                  {form.amenities.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      {form.amenities.length} amenit{form.amenities.length === 1 ? 'y' : 'ies'} selected
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Notes
                  </p>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
                    placeholder="Any additional information about this property…"
                    className={`${F} min-h-[80px] resize-y`} />
                </div>
              </div>
            )}

            <div className="h-px bg-gray-100 mx-6" />

            {/* ── Section 4: Status ── */}
            <SectionHeader
              num={4} icon={Settings} iconColor="#DC5F12" iconBg="#FFF0E8"
              title="Property Status" subtitle="Current occupancy state"
              complete={false} open={open[3]} onToggle={() => toggle(3)}
            />
            {open[3] && (
              <div className="px-6 pb-6 pt-1 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {([
                    { value: 'vacant',           label: 'Vacant',           dot: '#f43f5e', bg: '#fee2e2', text: '#b91c1c' },
                    { value: 'occupied',         label: 'Occupied',         dot: '#10b981', bg: '#dcfce7', text: '#15803d' },
                    { value: 'under-renovation', label: 'Renovation',       dot: '#f59e0b', bg: '#fef9c3', text: '#92400e' },
                  ] as const).map(opt => {
                    const sel = form.status === opt.value;
                    return (
                      <button key={opt.value} type="button"
                        onClick={() => set('status', opt.value)}
                        className="flex flex-col items-center gap-2 p-3 rounded-[14px] border-2 transition-all"
                        style={{
                          borderColor: sel ? opt.dot : '#e5e7eb',
                          background:  sel ? opt.bg  : '#fff',
                        }}>
                        <span className="w-3 h-3 rounded-full" style={{ background: opt.dot }} />
                        <span className="text-[11.5px] font-bold" style={{ color: sel ? opt.text : '#6b7280' }}>
                          {opt.label}
                        </span>
                        {sel && <Check size={12} style={{ color: opt.dot }} strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Note: status updates automatically when a tenant is assigned or removed.
                </p>
              </div>
            )}
          </div>

          {/* ── Bottom save ── */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-50 hover:opacity-90"
            style={{ background: '#DC5F12' }}
          >
            {isLoading
              ? <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />Saving changes…
                </span>
              : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProperty;
