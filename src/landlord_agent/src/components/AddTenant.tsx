/**
 * AddTenant — focused 2-section single-page form.
 *
 * Replaces the old 17-step Typeform-style wizard.
 *
 * Sections:
 *   1. Who is the tenant?  — name, email, phone (required)
 *   2. Tenancy terms       — property, rent, frequency, first payment, lease dates (required)
 *   3. Optional details    — emergency contact, employment, notes (collapsed by default)
 *
 * Design rules:
 *   - Single page, single Save button — landlord can see everything at once
 *   - Email pre-filled when coming from TenantSelection email-first flow
 *   - All landlord-created tenants default to status: 'active'
 *   - onSave throws on backend failure — success screen only shown on confirmed write
 *   - No localStorage progress saving — form is short enough not to need it
 */
import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  ChevronUp,
  Loader2,
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
  // Section 1 — Who
  name: string;
  email: string;
  phone: string;
  // Section 2 — Terms
  propertyId: string;
  rentAmount: string;
  paymentFrequency: 'monthly' | 'yearly' | 'fixed-time';
  firstPaymentDate: string;
  leaseStart: string;
  leaseEnd: string;
  // Section 3 — Optional
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

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fromISODate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0);
}

function defaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1, 12, 0, 0);
  const end = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate(), 12, 0, 0);
  return { start: toISODate(start), end: toISODate(end), first: toISODate(start) };
}

function initialForm(prefillEmail?: string, preselectedPropertyId?: string): FormData {
  const { start, end, first } = defaultDates();
  return {
    name: '',
    email: prefillEmail ?? '',
    phone: '',
    propertyId: preselectedPropertyId ?? '',
    rentAmount: '',
    paymentFrequency: 'monthly',
    firstPaymentDate: first,
    leaseStart: start,
    leaseEnd: end,
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    employmentType: '',
    employer: '',
    annualIncome: '',
    notes: '',
  };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const FIELD =
  'w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#4E97CC] focus:outline-none transition-colors bg-white disabled:bg-gray-50 disabled:text-gray-400';
const FIELD_ERR = 'border-red-400 focus:border-red-400';
const LABEL = 'block text-sm font-semibold text-gray-700 mb-1.5';
const SECTION = 'bg-white rounded-2xl border border-gray-200 p-5 space-y-4';
const SECTION_TITLE = 'flex items-center gap-2 text-base font-bold text-gray-800 mb-1';
const ERR_MSG = 'text-xs text-red-500 mt-1 flex items-center gap-1';

// ─── Component ────────────────────────────────────────────────────────────────

export function AddTenant({
  properties,
  onSave,
  onBack,
  preselectedPropertyId,
  prefillEmail,
  userProfile,
}: AddTenantProps) {
  const [form, setForm] = useState<FormData>(() =>
    initialForm(prefillEmail, preselectedPropertyId)
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const firstErrorRef = useRef<HTMLDivElement>(null);

  // Pre-fill rent when property is selected
  useEffect(() => {
    if (!form.propertyId) return;
    const prop = properties.find((p) => p.id === form.propertyId);
    if (prop?.rent && !form.rentAmount) {
      set('rentAmount', String(prop.rent));
    }
  }, [form.propertyId]);

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (globalError) setGlobalError(null);
  }

  // ─── Validation ──────────────────────────────────────────────────────────

  function validate(): boolean {
    const e: FieldErrors = {};

    // Section 1
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name = 'Full name is required (min 2 characters)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = 'Valid email address is required';
    if (!/^[\+]?[\d\s\-\(\)]{10,}$/.test(form.phone.trim()))
      e.phone = 'Valid phone number is required (min 10 digits)';

    // Section 2
    if (!form.propertyId) e.propertyId = 'Please select a property';
    const rent = parseFloat(form.rentAmount);
    if (!form.rentAmount.trim() || isNaN(rent) || rent <= 0)
      e.rentAmount = 'Valid rent amount is required';
    if (!form.firstPaymentDate || !fromISODate(form.firstPaymentDate))
      e.firstPaymentDate = 'Valid first payment date is required';
    if (!form.leaseStart || !fromISODate(form.leaseStart))
      e.leaseStart = 'Valid lease start date is required';
    if (!form.leaseEnd || !fromISODate(form.leaseEnd)) {
      e.leaseEnd = 'Valid lease end date is required';
    } else {
      const s = fromISODate(form.leaseStart);
      const en = fromISODate(form.leaseEnd);
      if (s && en && en < s) e.leaseEnd = 'Lease end must be after lease start';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    setGlobalError(null);

    if (!userProfile) {
      setGlobalError('You must be signed in to add a tenant.');
      return;
    }

    if (!validate()) {
      setGlobalError('Please fix the errors below before saving.');
      setTimeout(() => firstErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }

    setIsLoading(true);
    try {
      const property = properties.find((p) => p.id === form.propertyId);
      const tenant: Omit<Tenant, 'id'> = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        propertyId: form.propertyId,
        propertyAddress: property?.address ?? '',
        rentAmount: parseFloat(form.rentAmount),
        paymentFrequency: form.paymentFrequency,
        firstPaymentDate: fromISODate(form.firstPaymentDate) ?? new Date(),
        leaseStart: fromISODate(form.leaseStart) ?? new Date(),
        leaseEnd: fromISODate(form.leaseEnd) ?? new Date(),
        // All landlord-created tenants are active immediately
        status: 'active',
        referencingStatus: 'not-started',
        paymentStatus: 'current',
        emergencyContact: {
          name: form.emergencyName.trim(),
          phone: form.emergencyPhone.trim(),
          relationship: form.emergencyRelationship,
        },
        defaultRiskScore: 75,
        // Optional extras attached as extra fields — backend accepts any
        ...(form.employer && { employer: form.employer.trim() }),
        ...(form.annualIncome && { annualIncome: parseFloat(form.annualIncome) }),
        ...(form.employmentType && { employmentType: form.employmentType }),
        ...(form.notes && { notes: form.notes.trim() }),
      } as any;

      // onSave throws on backend failure — success screen only reached on confirmed write
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
        style={{ backgroundColor: '#F8FAFC', fontFamily: 'Archivo, sans-serif' }}
      >
        <div className="text-center space-y-6 max-w-sm w-full">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: '#dcfce7' }}
          >
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold" style={{ color: '#136C9E' }}>
              Tenant Added!
            </h1>
            <p className="text-gray-600">
              <strong>{form.name}</strong> has been added to your tenant list.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setForm(initialForm(undefined, preselectedPropertyId));
                setErrors({});
                setSaved(false);
              }}
              className="w-full py-3 rounded-xl border-2 font-semibold text-sm transition-all hover:bg-gray-50"
              style={{ borderColor: '#136C9E', color: '#136C9E' }}
            >
              Add another tenant
            </button>
            <button
              onClick={onBack}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
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
      className="min-h-screen"
      style={{ backgroundColor: '#F8FAFC', fontFamily: 'Archivo, sans-serif' }}
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold" style={{ color: '#136C9E' }}>
            Add Tenant
          </h1>
        </div>
        <button
          form="add-tenant-form"
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #DC5F12, #DC5F12)' }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Save Tenant
            </>
          )}
        </button>
      </div>

      <form
        id="add-tenant-form"
        onSubmit={handleSave}
        className="max-w-2xl mx-auto px-4 py-6 space-y-5"
        noValidate
      >
        {/* Global error */}
        {globalError && (
          <div
            ref={firstErrorRef}
            className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{globalError}</p>
          </div>
        )}

        {/* ── Section 1: Who is the tenant? ─────────────────── */}
        <section className={SECTION}>
          <div className={SECTION_TITLE}>
            <User className="w-4 h-4" style={{ color: '#136C9E' }} />
            Who is the tenant?
          </div>
          <p className="text-xs text-gray-500 -mt-2">Basic personal details</p>

          <div>
            <label className={LABEL} htmlFor="name">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. James Okafor"
              className={`${FIELD} ${errors.name ? FIELD_ERR : ''}`}
              autoComplete="name"
            />
            {errors.name && (
              <p className={ERR_MSG}>
                <AlertTriangle className="w-3 h-3" /> {errors.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL} htmlFor="email">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="tenant@email.com"
                  className={`${FIELD} pl-10 ${errors.email ? FIELD_ERR : ''}`}
                  autoComplete="email"
                  autoCapitalize="none"
                />
              </div>
              {errors.email && (
                <p className={ERR_MSG}>
                  <AlertTriangle className="w-3 h-3" /> {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className={LABEL} htmlFor="phone">
                Phone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+44 7000 000000"
                  className={`${FIELD} pl-10 ${errors.phone ? FIELD_ERR : ''}`}
                  autoComplete="tel"
                />
              </div>
              {errors.phone && (
                <p className={ERR_MSG}>
                  <AlertTriangle className="w-3 h-3" /> {errors.phone}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Section 2: Tenancy terms ───────────────────────── */}
        <section className={SECTION}>
          <div className={SECTION_TITLE}>
            <Home className="w-4 h-4" style={{ color: '#136C9E' }} />
            Tenancy terms
          </div>
          <p className="text-xs text-gray-500 -mt-2">Lease and payment details</p>

          {/* Property */}
          <div>
            <label className={LABEL} htmlFor="property">
              Property <span className="text-red-500">*</span>
            </label>
            <Select value={form.propertyId} onValueChange={(v) => set('propertyId', v)}>
              <SelectTrigger
                id="property"
                className={`${FIELD} h-auto ${errors.propertyId ? FIELD_ERR : ''}`}
              >
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.propertyId && (
              <p className={ERR_MSG}>
                <AlertTriangle className="w-3 h-3" /> {errors.propertyId}
              </p>
            )}
          </div>

          {/* Rent + Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL} htmlFor="rent">
                Monthly rent (£) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="rent"
                  type="number"
                  min="1"
                  step="1"
                  value={form.rentAmount}
                  onChange={(e) => set('rentAmount', e.target.value)}
                  placeholder="1200"
                  className={`${FIELD} pl-10 ${errors.rentAmount ? FIELD_ERR : ''}`}
                />
              </div>
              {errors.rentAmount && (
                <p className={ERR_MSG}>
                  <AlertTriangle className="w-3 h-3" /> {errors.rentAmount}
                </p>
              )}
            </div>

            <div>
              <label className={LABEL} htmlFor="freq">
                Payment frequency <span className="text-red-500">*</span>
              </label>
              <Select
                value={form.paymentFrequency}
                onValueChange={(v) => set('paymentFrequency', v as FormData['paymentFrequency'])}
              >
                <SelectTrigger id="freq" className={`${FIELD} h-auto`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="fixed-time">Fixed Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* First Payment Date */}
          <div>
            <label className={LABEL} htmlFor="firstPay">
              First payment date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="firstPay"
                type="date"
                value={form.firstPaymentDate}
                onChange={(e) => set('firstPaymentDate', e.target.value)}
                className={`${FIELD} pl-10 ${errors.firstPaymentDate ? FIELD_ERR : ''}`}
              />
            </div>
            {errors.firstPaymentDate && (
              <p className={ERR_MSG}>
                <AlertTriangle className="w-3 h-3" /> {errors.firstPaymentDate}
              </p>
            )}
          </div>

          {/* Lease Start + End */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL} htmlFor="leaseStart">
                Lease start <span className="text-red-500">*</span>
              </label>
              <input
                id="leaseStart"
                type="date"
                value={form.leaseStart}
                onChange={(e) => set('leaseStart', e.target.value)}
                className={`${FIELD} ${errors.leaseStart ? FIELD_ERR : ''}`}
              />
              {errors.leaseStart && (
                <p className={ERR_MSG}>
                  <AlertTriangle className="w-3 h-3" /> {errors.leaseStart}
                </p>
              )}
            </div>

            <div>
              <label className={LABEL} htmlFor="leaseEnd">
                Lease end <span className="text-red-500">*</span>
              </label>
              <input
                id="leaseEnd"
                type="date"
                value={form.leaseEnd}
                onChange={(e) => set('leaseEnd', e.target.value)}
                className={`${FIELD} ${errors.leaseEnd ? FIELD_ERR : ''}`}
              />
              {errors.leaseEnd && (
                <p className={ERR_MSG}>
                  <AlertTriangle className="w-3 h-3" /> {errors.leaseEnd}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Section 3: Optional details (collapsed) ────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOptional((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Optional details</span>
              <span className="text-xs text-gray-400 font-normal ml-1">
                — emergency contact, employment, notes
              </span>
            </div>
            {showOptional ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showOptional && (
            <div className="px-5 pb-5 space-y-5 border-t border-gray-100">
              {/* Emergency contact */}
              <div className="pt-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Emergency contact
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL} htmlFor="emName">Name</label>
                    <input
                      id="emName"
                      type="text"
                      value={form.emergencyName}
                      onChange={(e) => set('emergencyName', e.target.value)}
                      placeholder="Contact name"
                      className={FIELD}
                    />
                  </div>
                  <div>
                    <label className={LABEL} htmlFor="emPhone">Phone</label>
                    <input
                      id="emPhone"
                      type="tel"
                      value={form.emergencyPhone}
                      onChange={(e) => set('emergencyPhone', e.target.value)}
                      placeholder="+44 7000 000000"
                      className={FIELD}
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL} htmlFor="emRel">Relationship</label>
                  <Select
                    value={form.emergencyRelationship}
                    onValueChange={(v) => set('emergencyRelationship', v)}
                  >
                    <SelectTrigger id="emRel" className={`${FIELD} h-auto`}>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Parent', 'Spouse / Partner', 'Sibling', 'Friend', 'Colleague', 'Other'].map(
                        (r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Employment */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Employment
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL} htmlFor="empType">Employment type</label>
                    <Select
                      value={form.employmentType}
                      onValueChange={(v) => set('employmentType', v)}
                    >
                      <SelectTrigger id="empType" className={`${FIELD} h-auto`}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          'Full-time',
                          'Part-time',
                          'Self-employed',
                          'Student',
                          'Unemployed',
                          'Retired',
                        ].map((t) => (
                          <SelectItem key={t} value={t.toLowerCase().replace(' ', '-')}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className={LABEL} htmlFor="income">Annual income (£)</label>
                    <div className="relative">
                      <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        id="income"
                        type="number"
                        min="0"
                        value={form.annualIncome}
                        onChange={(e) => set('annualIncome', e.target.value)}
                        placeholder="35000"
                        className={`${FIELD} pl-10`}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={LABEL} htmlFor="employer">Employer</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      id="employer"
                      type="text"
                      value={form.employer}
                      onChange={(e) => set('employer', e.target.value)}
                      placeholder="Employer name"
                      className={`${FIELD} pl-10`}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={LABEL} htmlFor="notes">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Additional notes
                  </span>
                </label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={3}
                  placeholder="Any additional information about this tenant…"
                  className={`${FIELD} min-h-[80px] resize-y`}
                />
              </div>
            </div>
          )}
        </section>

        {/* Bottom save button (mobile-friendly duplicate) */}
        <div className="pb-8">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-50 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #DC5F12, #DC5F12)' }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving tenant…
              </span>
            ) : (
              'Save Tenant'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddTenant;
