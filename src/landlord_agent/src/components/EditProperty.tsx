/**
 * EditProperty — single-page form with collapsible numbered sections.
 *
 * Uses the shared UK property catalogue for types and amenities.
 * Description is the public listing copy; notes remain internal.
 */
import React, { useMemo, useState, useEffect } from 'react';
import {
  ArrowLeft,
  Home,
  MapPin,
  PoundSterling,
  BedDouble,
  Bath,
  Maximize2,
  Wifi,
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
  Map as MapIcon,
  Trees,
  Warehouse,
  Layout,
  Store,
  Factory,
  Hotel,
  Dumbbell,
  Landmark,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import type { Property, UserProfile } from '../App';
import {
  getAllCategories,
  getTypeGroupsForCategory,
  getSubtypeById,
  getAmenitiesGroupedForSubtype,
  getAmenityById,
  getAmenityLabel,
  resolveClassificationFromStoredType,
  subtypeLabel,
  type PropertyCategoryId,
} from '../../../shared/propertyCatalogue';

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  Home, Building2, Briefcase, Map: MapIcon, Trees, Warehouse, Users, Layout,
  Store, Factory, Hotel, Dumbbell, Landmark, Layers, HelpCircle,
};

function catalogueIcon(name?: string): LucideIcon {
  if (!name) return HelpCircle;
  return ICON_MAP[name] ?? HelpCircle;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditPropertyProps {
  property: Property;
  userProfile?: UserProfile | null;
  onSave: (updates: Partial<Omit<Property, 'id' | 'createdAt' | 'tenant'>>) => Promise<void>;
  onBack: () => void;
}

interface FormData {
  propertyCategory: PropertyCategoryId | null;
  propertyTypeGroup: string | null;
  propertySubtype: string | null;
  type: string;
  address: string;
  rent: string;
  bedrooms: string;
  bathrooms: string;
  squareFootage: string;
  amenities: string[];
  description: string;
  notes: string;
  status: Property['status'];
}

type FieldErrors = Partial<Record<keyof FormData | 'propertySubtype', string>>;

// ─── Styles ───────────────────────────────────────────────────────────────────

const F  = 'w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:border-[#4E97CC] focus:outline-none transition-colors bg-white';
const FE = 'border-red-400 focus:border-red-400';
const LB = 'block text-sm font-semibold text-gray-700 mb-1.5';
const EM = 'text-xs text-red-500 mt-1.5 flex items-center gap-1';

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, required, error, children, hint }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <div>
      <label className={LB}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
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
  const classification =
    p.propertyClassification ||
    resolveClassificationFromStoredType(p.type) ||
    null;
  return {
    propertyCategory: (classification?.categoryId as PropertyCategoryId) || null,
    propertyTypeGroup: classification?.typeGroupId || null,
    propertySubtype: classification?.subtypeId || null,
    type: classification?.subtypeId || p.type || '',
    address: p.address || '',
    rent: p.rent ? String(p.rent) : '',
    bedrooms: p.bedrooms != null ? String(p.bedrooms) : '',
    bathrooms: p.bathrooms != null ? String(p.bathrooms) : '',
    squareFootage: p.squareFootage != null ? String(p.squareFootage) : '',
    amenities: p.amenities || [],
    description: p.description || '',
    notes: p.notes || '',
    status: p.status || 'vacant',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditProperty({ property, userProfile, onSave, onBack }: EditPropertyProps) {
  const [form, setForm] = useState<FormData>(() => propertyToForm(property));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState<[boolean, boolean, boolean, boolean]>([true, true, true, true]);
  const [amenitySearch, setAmenitySearch] = useState('');

  function toggle(i: 0 | 1 | 2 | 3) {
    setOpen((prev) => { const n = [...prev] as typeof open; n[i] = !n[i]; return n; });
  }

  useEffect(() => {
    setForm(propertyToForm(property));
    setErrors({});
    setGlobalError(null);
    setSaved(false);
    setOpen([true, true, true, true]);
  }, [property.id]);

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
    if ((errors as any)[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
    if (globalError) setGlobalError(null);
  }

  const categories = useMemo(() => getAllCategories(), []);
  const typeGroups = useMemo(
    () => (form.propertyCategory ? getTypeGroupsForCategory(form.propertyCategory) : []),
    [form.propertyCategory],
  );
  const selectedGroup = useMemo(
    () => typeGroups.find((g) => g.id === form.propertyTypeGroup) ?? null,
    [typeGroups, form.propertyTypeGroup],
  );
  const subtypeId = form.propertySubtype || form.type;
  const detailsForm = getSubtypeById(subtypeId)?.detailsForm ?? 'residential';

  const amenityGroups = useMemo(() => {
    if (!subtypeId || !getSubtypeById(subtypeId)) return [];
    return getAmenitiesGroupedForSubtype(subtypeId, {
      search: amenitySearch.trim() || undefined,
      includeLegacy: true,
    });
  }, [subtypeId, amenitySearch]);

  function selectCategory(id: PropertyCategoryId) {
    setForm((prev) => ({
      ...prev,
      propertyCategory: id,
      propertyTypeGroup: null,
      propertySubtype: null,
      type: '',
      amenities: [],
    }));
  }

  function selectTypeGroup(id: string) {
    setForm((prev) => ({
      ...prev,
      propertyTypeGroup: id,
      propertySubtype: null,
      type: '',
      amenities: [],
    }));
  }

  function selectSubtype(id: string) {
    setForm((prev) => ({
      ...prev,
      propertySubtype: id,
      type: id,
    }));
  }

  function toggleAmenity(id: string) {
    const next = form.amenities.includes(id)
      ? form.amenities.filter((a) => a !== id)
      : [...form.amenities, id];
    set('amenities', next);
  }

  const s1ok = !!(form.propertySubtype || (form.type && getSubtypeById(form.type)));
  const s2ok = !!(
    form.address.trim() &&
    parseFloat(form.rent) > 0 &&
    form.description.trim().length >= 10 &&
    (detailsForm !== 'residential' || parseInt(form.bedrooms, 10) >= 0)
  );

  function validate(): boolean {
    const e: FieldErrors = {};
    if (!form.propertySubtype && !getSubtypeById(form.type)) {
      e.type = 'Select a property subtype';
    }
    if (!form.address.trim()) e.address = 'Address is required';
    const r = parseFloat(form.rent);
    if (!form.rent || isNaN(r) || r <= 0) e.rent = 'Enter a valid monthly rent';
    if (form.description.trim().length < 10) {
      e.description = 'Description must be at least 10 characters';
    }
    if (detailsForm === 'residential') {
      const b = parseInt(form.bedrooms, 10);
      if (form.bedrooms === '' || isNaN(b) || b < 0) e.bedrooms = 'Enter a valid number of bedrooms';
      if (form.bathrooms !== '') {
        const ba = parseInt(form.bathrooms, 10);
        if (isNaN(ba) || ba < 0) e.bathrooms = 'Enter a valid number of bathrooms';
      }
    }
    setErrors(e);
    const s1err = !!e.type;
    const s2err = !!(e.address || e.rent || e.bedrooms || e.bathrooms || e.description);
    if (s1err || s2err) {
      setOpen((prev) => [prev[0] || s1err, prev[1] || s2err, prev[2], prev[3]]);
    }
    return Object.keys(e).length === 0;
  }

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
      const subtype = form.propertySubtype || form.type;
      const classification =
        (form.propertyCategory && form.propertyTypeGroup && subtype
          ? { categoryId: form.propertyCategory, typeGroupId: form.propertyTypeGroup, subtypeId: subtype }
          : null) ||
        resolveClassificationFromStoredType(subtype);

      const updates: Partial<Omit<Property, 'id' | 'createdAt' | 'tenant'>> = {
        type: subtype,
        address: form.address.trim(),
        rent: parseFloat(form.rent),
        bedrooms: detailsForm === 'residential' ? parseInt(form.bedrooms, 10) || 0 : parseInt(form.bedrooms, 10) || 0,
        amenities: form.amenities,
        description: form.description.trim(),
        notes: form.notes,
        status: form.status,
        ...(classification ? { propertyClassification: classification } : {}),
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

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: '#F8FAFC', fontFamily: 'Archivo, sans-serif' }}>

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
          {globalError && (
            <div className="flex items-start gap-3 p-4 rounded-2xl border border-red-200 bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{globalError}</p>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

            {/* Section 1: Type */}
            <SectionHeader
              num={1} icon={Home} iconColor="#136C9E" iconBg="#E8F4F8"
              title="Property Type"
              subtitle={form.propertySubtype || form.type
                ? subtypeLabel(form.propertySubtype || form.type)
                : 'Category → type → subtype'}
              complete={s1ok} open={open[0]} onToggle={() => toggle(0)}
            />
            {open[0] && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-100 space-y-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category</p>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((cat) => {
                      const Icon = catalogueIcon(cat.icon);
                      const sel = form.propertyCategory === cat.id;
                      return (
                        <button key={cat.id} type="button" onClick={() => selectCategory(cat.id)}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-[14px] border-2 transition-all"
                          style={{
                            borderColor: sel ? '#136C9E' : '#e5e7eb',
                            background: sel ? '#f0f8fd' : '#fff',
                          }}>
                          <Icon size={18} style={{ color: sel ? '#136C9E' : '#9ca3af' }} />
                          <span className="text-[11px] font-bold" style={{ color: sel ? '#0c4a6e' : '#6b7280' }}>
                            {cat.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.propertyCategory && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Type</p>
                    <div className="grid grid-cols-2 gap-2">
                      {typeGroups.map((g) => {
                        const Icon = catalogueIcon(g.icon);
                        const sel = form.propertyTypeGroup === g.id;
                        return (
                          <button key={g.id} type="button" onClick={() => selectTypeGroup(g.id)}
                            className="relative flex flex-col items-start gap-1.5 p-3 rounded-[14px] border-2 text-left"
                            style={{
                              borderColor: sel ? '#136C9E' : '#e5e7eb',
                              background: sel ? '#f0f8fd' : '#fff',
                            }}>
                            <Icon size={16} style={{ color: sel ? '#136C9E' : '#9ca3af' }} />
                            <span className="text-[12px] font-bold text-gray-800">{g.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedGroup && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Subtype</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedGroup.subtypes.map((st) => {
                        const sel = form.propertySubtype === st.id || form.type === st.id;
                        return (
                          <button key={st.id} type="button" onClick={() => selectSubtype(st.id)}
                            className="relative flex flex-col items-start gap-1 p-3 rounded-[14px] border-2 text-left"
                            style={{
                              borderColor: sel ? '#136C9E' : '#e5e7eb',
                              background: sel ? '#f0f8fd' : '#fff',
                            }}>
                            <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ background: sel ? '#136C9E' : '#f3f4f6' }}>
                              <Check size={9} className="text-white" strokeWidth={3} />
                            </span>
                            <span className="text-[12px] font-bold text-gray-800 pr-4">{st.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {errors.type && (
                  <p className={EM}><AlertTriangle className="w-3 h-3 shrink-0" />{errors.type}</p>
                )}
              </div>
            )}

            <div className="h-px bg-gray-100 mx-6" />

            {/* Section 2: Details */}
            <SectionHeader
              num={2} icon={MapPin} iconColor="#06B6D4" iconBg="#E0F7FA"
              title="Property Details" subtitle="Address, rent, description and specs"
              complete={s2ok} open={open[1]} onToggle={() => toggle(1)}
            />
            {open[1] && (
              <div className="px-6 pb-6 pt-1 space-y-4 border-t border-gray-100">
                <Field label="Property Address" required error={errors.address}>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="text" value={form.address}
                      onChange={(e) => set('address', e.target.value)}
                      placeholder="e.g. 12 Church Lane, London, SW1A 1AA"
                      className={`${F} pl-10 ${errors.address ? FE : ''}`} />
                  </div>
                </Field>

                <Field label="Monthly Rent (£)" required error={errors.rent}>
                  <div className="relative">
                    <PoundSterling className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="number" min="1" value={form.rent}
                      onChange={(e) => set('rent', e.target.value)}
                      placeholder="1200"
                      className={`${F} pl-10 ${errors.rent ? FE : ''}`} />
                  </div>
                </Field>

                <Field
                  label="Property Description"
                  required
                  error={errors.description}
                  hint="Shown on the listing for renters and buyers"
                >
                  <textarea
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={4}
                    placeholder="Describe the property…"
                    className={`${F} min-h-[96px] resize-y ${errors.description ? FE : ''}`}
                  />
                </Field>

                {detailsForm === 'residential' && (
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Bedrooms" required error={errors.bedrooms}>
                      <div className="relative">
                        <BedDouble className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input type="number" min="0" max="50" value={form.bedrooms}
                          onChange={(e) => set('bedrooms', e.target.value)}
                          placeholder="2"
                          className={`${F} pl-10 ${errors.bedrooms ? FE : ''}`} />
                      </div>
                    </Field>
                    <Field label="Bathrooms" error={errors.bathrooms}>
                      <div className="relative">
                        <Bath className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input type="number" min="0" max="20" value={form.bathrooms}
                          onChange={(e) => set('bathrooms', e.target.value)}
                          placeholder="1"
                          className={`${F} pl-10 ${errors.bathrooms ? FE : ''}`} />
                      </div>
                    </Field>
                  </div>
                )}

                <Field label={detailsForm === 'commercial' ? 'Floor area (sq ft)' : 'Square Footage'}>
                  <div className="relative">
                    <Maximize2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="number" min="1" value={form.squareFootage}
                      onChange={(e) => set('squareFootage', e.target.value)}
                      placeholder="750"
                      className={`${F} pl-10`} />
                  </div>
                </Field>
              </div>
            )}

            <div className="h-px bg-gray-100 mx-6" />

            {/* Section 3: Amenities & Notes */}
            <SectionHeader
              num={3} icon={Wifi} iconColor="#7C3AED" iconBg="#F3E8FF"
              title="Amenities & Notes" subtitle="Features and internal notes"
              complete={false} open={open[2]} onToggle={() => toggle(2)}
            />
            {open[2] && (
              <div className="px-6 pb-6 pt-1 space-y-5 border-t border-gray-100">
                {!subtypeId || !getSubtypeById(subtypeId) ? (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    Select a property subtype above to choose amenities.
                  </p>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 pt-2 mb-3">
                      <Wifi className="w-3.5 h-3.5" /> Amenities
                    </p>
                    <input
                      type="search"
                      value={amenitySearch}
                      onChange={(e) => setAmenitySearch(e.target.value)}
                      placeholder="Search amenities…"
                      className={`${F} mb-3`}
                    />
                    {amenityGroups.length === 0 ? (
                      <p className="text-xs text-gray-400">No amenities match your search.</p>
                    ) : (
                      <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                        {amenityGroups.map(({ category, amenities }) => (
                          <div key={category.id}>
                            <p className="text-[11px] font-bold text-gray-500 mb-2">{category.label}</p>
                            <div className="grid grid-cols-2 gap-2">
                              {amenities.map((a) => {
                                const sel = form.amenities.includes(a.id);
                                return (
                                  <button key={a.id} type="button"
                                    onClick={() => toggleAmenity(a.id)}
                                    className="relative flex flex-col items-start gap-1 p-3 rounded-[14px] border-2 text-left"
                                    style={{
                                      borderColor: sel ? '#136C9E' : '#e5e7eb',
                                      background: sel ? '#f0f8fd' : '#fff',
                                    }}>
                                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                                      style={{ background: sel ? '#136C9E' : '#f3f4f6' }}>
                                      <Check size={9} className="text-white" strokeWidth={3} />
                                    </span>
                                    <p className="text-[11px] font-semibold text-gray-700 leading-tight pr-4">{a.label}</p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Keep legacy selected ids visible */}
                    {form.amenities.some((id) => !getAmenityById(id) || !amenityGroups.some((g) => g.amenities.some((a) => a.id === id))) && (
                      <div className="mt-3">
                        <p className="text-[11px] font-bold text-gray-500 mb-2">Selected / Other</p>
                        <div className="flex flex-wrap gap-1.5">
                          {form.amenities
                            .filter((id) => !amenityGroups.some((g) => g.amenities.some((a) => a.id === id)))
                            .map((id) => (
                              <button
                                key={id}
                                type="button"
                                onClick={() => toggleAmenity(id)}
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                                style={{ background: '#eaf3f8', color: '#136C9E' }}
                              >
                                {getAmenityLabel(id)} ×
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                    {form.amenities.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        {form.amenities.length} amenit{form.amenities.length === 1 ? 'y' : 'ies'} selected
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Internal notes
                  </p>
                  <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3}
                    placeholder="Internal notes — not shown on the public listing…"
                    className={`${F} min-h-[80px] resize-y`} />
                </div>
              </div>
            )}

            <div className="h-px bg-gray-100 mx-6" />

            {/* Section 4: Status */}
            <SectionHeader
              num={4} icon={Settings} iconColor="#DC5F12" iconBg="#FFF0E8"
              title="Property Status" subtitle="Current occupancy state"
              complete={false} open={open[3]} onToggle={() => toggle(3)}
            />
            {open[3] && (
              <div className="px-6 pb-6 pt-1 border-t border-gray-100">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                  {([
                    { value: 'vacant', label: 'Vacant', dot: '#f43f5e', bg: '#fee2e2', text: '#b91c1c' },
                    { value: 'occupied', label: 'Occupied', dot: '#10b981', bg: '#dcfce7', text: '#15803d' },
                    { value: 'under-renovation', label: 'Renovation', dot: '#f59e0b', bg: '#fef9c3', text: '#92400e' },
                  ] as const).map((opt) => {
                    const sel = form.status === opt.value;
                    return (
                      <button key={opt.value} type="button"
                        onClick={() => set('status', opt.value)}
                        className="flex flex-col items-center gap-2 p-3 rounded-[14px] border-2 transition-all"
                        style={{
                          borderColor: sel ? opt.dot : '#e5e7eb',
                          background: sel ? opt.bg : '#fff',
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
