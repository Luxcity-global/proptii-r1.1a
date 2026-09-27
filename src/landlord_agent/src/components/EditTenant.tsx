import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertTriangle, Save, X } from 'lucide-react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Property, Tenant, UserProfile } from '../App';

interface EditTenantProps {
  tenant: Tenant;
  properties: Property[];
  userProfile?: UserProfile | null;
  onSave: (updates: Partial<Omit<Tenant, 'id'>>) => Promise<void>;
  onBack: () => void;
}

interface EditFormData {
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
  notes: string;
  employer: string;
  jobTitle: string;
  annualIncome: string;
  employmentType: string;
}

function formatDateValue(date: Date | string | undefined | null): string {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toDateOnly(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0);
}

function tenantToFormData(tenant: Tenant): EditFormData {
  const t = tenant as any;
  return {
    name: tenant.name || '',
    email: tenant.email || '',
    phone: tenant.phone || '',
    propertyId: tenant.propertyId || '',
    rentAmount: tenant.rentAmount?.toString() || '',
    paymentFrequency: tenant.paymentFrequency || 'monthly',
    firstPaymentDate: formatDateValue(tenant.firstPaymentDate),
    leaseStart: formatDateValue(tenant.leaseStart),
    leaseEnd: formatDateValue(tenant.leaseEnd),
    status: tenant.status || 'active',
    referencingStatus: tenant.referencingStatus || 'not-started',
    paymentStatus: tenant.paymentStatus || 'current',
    emergencyContactName: tenant.emergencyContact?.name || '',
    emergencyContactPhone: tenant.emergencyContact?.phone || '',
    emergencyContactRelationship: tenant.emergencyContact?.relationship || '',
    notes: t.notes || '',
    employer: t.employer || '',
    jobTitle: t.jobTitle || '',
    annualIncome: t.annualIncome?.toString() || '',
    employmentType: t.employmentType || 'full-time',
  };
}

const FIELD_STYLE = 'w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-[#4E97CC] focus:outline-none transition-colors bg-white';
const LABEL_STYLE = 'block text-sm font-medium text-gray-700 mb-1';
const SECTION_STYLE = 'bg-white rounded-2xl border border-gray-200 p-6 space-y-4';

export function EditTenant({ tenant, properties, userProfile, onSave, onBack }: EditTenantProps) {
  const [form, setForm] = useState<EditFormData>(() => tenantToFormData(tenant));
  const [errors, setErrors] = useState<Partial<Record<keyof EditFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Re-populate if tenant prop changes (e.g. navigating between tenants)
  useEffect(() => {
    setForm(tenantToFormData(tenant));
    setErrors({});
    setGlobalError(null);
    setSaved(false);
  }, [tenant.id]);

  function set(field: keyof EditFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    // clear error on change
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof EditFormData, string>> = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name = 'Full name is required (min 2 characters)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Valid email address is required';
    if (!/^[\+]?[\d\s\-\(\)]{10,}$/.test(form.phone))
      e.phone = 'Valid phone number is required (min 10 digits)';
    if (!form.propertyId)
      e.propertyId = 'Please select a property';
    if (!form.rentAmount || isNaN(parseFloat(form.rentAmount)) || parseFloat(form.rentAmount) <= 0)
      e.rentAmount = 'Valid rent amount is required';
    if (!form.firstPaymentDate || !toDateOnly(form.firstPaymentDate))
      e.firstPaymentDate = 'Valid first payment date is required';
    if (!form.leaseStart || !toDateOnly(form.leaseStart))
      e.leaseStart = 'Valid lease start date is required';
    if (!form.leaseEnd || !toDateOnly(form.leaseEnd))
      e.leaseEnd = 'Valid lease end date is required';
    else {
      const s = toDateOnly(form.leaseStart);
      const e2 = toDateOnly(form.leaseEnd);
      if (s && e2 && e2 < s) e.leaseEnd = 'Lease end must be after lease start';
    }
    if (!form.emergencyContactName.trim())
      e.emergencyContactName = 'Emergency contact name is required';
    if (!/^[\+]?[\d\s\-\(\)]{10,}$/.test(form.emergencyContactPhone))
      e.emergencyContactPhone = 'Valid emergency contact phone is required';
    if (!form.emergencyContactRelationship)
      e.emergencyContactRelationship = 'Relationship is required';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userProfile) {
      setGlobalError('You must be signed in to edit a tenant.');
      return;
    }
    if (!validate()) {
      setGlobalError('Please fix the errors below before saving.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsLoading(true);
    setGlobalError(null);
    try {
      const property = properties.find(p => p.id === form.propertyId);
      const updates: Partial<Omit<Tenant, 'id'>> = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        propertyId: form.propertyId,
        propertyAddress: property?.address || tenant.propertyAddress,
        rentAmount: parseFloat(form.rentAmount),
        paymentFrequency: form.paymentFrequency,
        firstPaymentDate: toDateOnly(form.firstPaymentDate) || tenant.firstPaymentDate,
        leaseStart: toDateOnly(form.leaseStart) || tenant.leaseStart,
        leaseEnd: toDateOnly(form.leaseEnd) || tenant.leaseEnd,
        status: form.status,
        referencingStatus: form.referencingStatus,
        paymentStatus: form.paymentStatus,
        emergencyContact: {
          name: form.emergencyContactName.trim(),
          phone: form.emergencyContactPhone.trim(),
          relationship: form.emergencyContactRelationship,
        },
      };
      // Optional extra fields
      const extra: Record<string, any> = {};
      if (form.notes) extra.notes = form.notes;
      if (form.employer) extra.employer = form.employer;
      if (form.jobTitle) extra.jobTitle = form.jobTitle;
      if (form.annualIncome && !isNaN(parseFloat(form.annualIncome)))
        extra.annualIncome = parseFloat(form.annualIncome);
      if (form.employmentType) extra.employmentType = form.employmentType;

      await onSave({ ...updates, ...extra });
      setSaved(true);
    } catch (err: any) {
      setGlobalError(err?.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F8FAFC' }}>
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#dcfce7' }}>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}>
            Changes Saved
          </h1>
          <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>
            {form.name}'s details have been updated successfully.
          </p>
          <button
            onClick={onBack}
            className="w-full py-3 rounded-full font-medium text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #DC5F12, #DC5F12)', fontFamily: 'Archivo, sans-serif' }}
          >
            Back to Tenant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC', fontFamily: 'Archivo, sans-serif' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-lg font-bold" style={{ color: '#136C9E' }}>Edit Tenant</h1>
        <button
          type="submit"
          form="edit-tenant-form"
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-medium transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #DC5F12, #DC5F12)' }}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isLoading ? 'Saving…' : 'Save'}
        </button>
      </div>

      <form id="edit-tenant-form" onSubmit={handleSave} className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Global error */}
        {globalError && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{globalError}</p>
            <button type="button" onClick={() => setGlobalError(null)} className="ml-auto shrink-0">
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}

        {/* Personal Details */}
        <section className={SECTION_STYLE}>
          <h2 className="text-base font-semibold text-gray-800">Personal Details</h2>
          <div>
            <label className={LABEL_STYLE}>Full Name <span className="text-red-500">*</span></label>
            <input
              className={`${FIELD_STYLE} ${errors.name ? 'border-red-400' : ''}`}
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Tenant full name"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className={LABEL_STYLE}>Email Address <span className="text-red-500">*</span></label>
            <input
              type="email"
              className={`${FIELD_STYLE} ${errors.email ? 'border-red-400' : ''}`}
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="tenant@email.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className={LABEL_STYLE}>Phone Number <span className="text-red-500">*</span></label>
            <input
              type="tel"
              className={`${FIELD_STYLE} ${errors.phone ? 'border-red-400' : ''}`}
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="+44 7000 000000"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
        </section>

        {/* Tenancy Details */}
        <section className={SECTION_STYLE}>
          <h2 className="text-base font-semibold text-gray-800">Tenancy Details</h2>
          <div>
            <label className={LABEL_STYLE}>Property <span className="text-red-500">*</span></label>
            <Select value={form.propertyId} onValueChange={v => set('propertyId', v)}>
              <SelectTrigger className={`${FIELD_STYLE} ${errors.propertyId ? 'border-red-400' : ''}`}>
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.address}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.propertyId && <p className="text-red-500 text-xs mt-1">{errors.propertyId}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_STYLE}>Monthly Rent (£) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="1"
                className={`${FIELD_STYLE} ${errors.rentAmount ? 'border-red-400' : ''}`}
                value={form.rentAmount}
                onChange={e => set('rentAmount', e.target.value)}
                placeholder="1200"
              />
              {errors.rentAmount && <p className="text-red-500 text-xs mt-1">{errors.rentAmount}</p>}
            </div>
            <div>
              <label className={LABEL_STYLE}>Payment Frequency <span className="text-red-500">*</span></label>
              <Select value={form.paymentFrequency} onValueChange={v => set('paymentFrequency', v as any)}>
                <SelectTrigger className={FIELD_STYLE}>
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
          <div>
            <label className={LABEL_STYLE}>First Payment Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              className={`${FIELD_STYLE} ${errors.firstPaymentDate ? 'border-red-400' : ''}`}
              value={form.firstPaymentDate}
              onChange={e => set('firstPaymentDate', e.target.value)}
            />
            {errors.firstPaymentDate && <p className="text-red-500 text-xs mt-1">{errors.firstPaymentDate}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_STYLE}>Lease Start <span className="text-red-500">*</span></label>
              <input
                type="date"
                className={`${FIELD_STYLE} ${errors.leaseStart ? 'border-red-400' : ''}`}
                value={form.leaseStart}
                onChange={e => set('leaseStart', e.target.value)}
              />
              {errors.leaseStart && <p className="text-red-500 text-xs mt-1">{errors.leaseStart}</p>}
            </div>
            <div>
              <label className={LABEL_STYLE}>Lease End <span className="text-red-500">*</span></label>
              <input
                type="date"
                className={`${FIELD_STYLE} ${errors.leaseEnd ? 'border-red-400' : ''}`}
                value={form.leaseEnd}
                onChange={e => set('leaseEnd', e.target.value)}
              />
              {errors.leaseEnd && <p className="text-red-500 text-xs mt-1">{errors.leaseEnd}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL_STYLE}>Status</label>
              <Select value={form.status} onValueChange={v => set('status', v as any)}>
                <SelectTrigger className={FIELD_STYLE}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={LABEL_STYLE}>Referencing</label>
              <Select value={form.referencingStatus} onValueChange={v => set('referencingStatus', v as any)}>
                <SelectTrigger className={FIELD_STYLE}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">Not started</SelectItem>
                  <SelectItem value="in-progress">In progress</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={LABEL_STYLE}>Payment Status</label>
              <Select value={form.paymentStatus} onValueChange={v => set('paymentStatus', v as any)}>
                <SelectTrigger className={FIELD_STYLE}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="payment-plan">Payment plan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Emergency Contact */}
        <section className={SECTION_STYLE}>
          <h2 className="text-base font-semibold text-gray-800">Emergency Contact</h2>
          <div>
            <label className={LABEL_STYLE}>Name <span className="text-red-500">*</span></label>
            <input
              className={`${FIELD_STYLE} ${errors.emergencyContactName ? 'border-red-400' : ''}`}
              value={form.emergencyContactName}
              onChange={e => set('emergencyContactName', e.target.value)}
              placeholder="Contact full name"
            />
            {errors.emergencyContactName && <p className="text-red-500 text-xs mt-1">{errors.emergencyContactName}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_STYLE}>Phone <span className="text-red-500">*</span></label>
              <input
                type="tel"
                className={`${FIELD_STYLE} ${errors.emergencyContactPhone ? 'border-red-400' : ''}`}
                value={form.emergencyContactPhone}
                onChange={e => set('emergencyContactPhone', e.target.value)}
                placeholder="+44 7000 000000"
              />
              {errors.emergencyContactPhone && <p className="text-red-500 text-xs mt-1">{errors.emergencyContactPhone}</p>}
            </div>
            <div>
              <label className={LABEL_STYLE}>Relationship <span className="text-red-500">*</span></label>
              <Select value={form.emergencyContactRelationship} onValueChange={v => set('emergencyContactRelationship', v)}>
                <SelectTrigger className={`${FIELD_STYLE} ${errors.emergencyContactRelationship ? 'border-red-400' : ''}`}>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Parent">Parent</SelectItem>
                  <SelectItem value="Spouse">Spouse / Partner</SelectItem>
                  <SelectItem value="Sibling">Sibling</SelectItem>
                  <SelectItem value="Friend">Friend</SelectItem>
                  <SelectItem value="Colleague">Colleague</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.emergencyContactRelationship && <p className="text-red-500 text-xs mt-1">{errors.emergencyContactRelationship}</p>}
            </div>
          </div>
        </section>

        {/* Employment (optional) */}
        <section className={SECTION_STYLE}>
          <h2 className="text-base font-semibold text-gray-800">Employment <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_STYLE}>Employment Type</label>
              <Select value={form.employmentType} onValueChange={v => set('employmentType', v)}>
                <SelectTrigger className={FIELD_STYLE}><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="self-employed">Self-employed</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={LABEL_STYLE}>Annual Income (£)</label>
              <input
                type="number"
                min="0"
                className={FIELD_STYLE}
                value={form.annualIncome}
                onChange={e => set('annualIncome', e.target.value)}
                placeholder="e.g. 35000"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_STYLE}>Employer</label>
              <input
                className={FIELD_STYLE}
                value={form.employer}
                onChange={e => set('employer', e.target.value)}
                placeholder="Employer name"
              />
            </div>
            <div>
              <label className={LABEL_STYLE}>Job Title</label>
              <input
                className={FIELD_STYLE}
                value={form.jobTitle}
                onChange={e => set('jobTitle', e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </div>
          </div>
        </section>

        {/* Notes (optional) */}
        <section className={SECTION_STYLE}>
          <h2 className="text-base font-semibold text-gray-800">Notes <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
          <textarea
            className={`${FIELD_STYLE} min-h-[100px] resize-y`}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Any additional notes about this tenant…"
          />
        </section>

        {/* Bottom save button */}
        <div className="pb-8">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl font-semibold text-white text-base transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #DC5F12, #DC5F12)', fontFamily: 'Archivo, sans-serif' }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving changes…
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
