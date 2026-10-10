/**
 * SelectExistingTenant — reassign a past tenant to a new property.
 *
 * The old version queried the Azure AD B2C user directory — an internal
 * auth system that has nothing to do with a landlord's tenant portfolio.
 * The real use case is: "James was my tenant before, I want to add him to
 * my new property."
 *
 * New design:
 *  - Search is purely client-side, filtering existingTenants by name/email
 *  - No external API calls on mount
 *  - Two steps: pick tenant + property → fill rent terms
 *  - All created tenants are status: 'active' (not 'pending')
 *  - Success screen shown only after confirmed backend write
 */
import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Users,
  Home,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  PoundSterling,
  Calendar,
  User,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Property, Tenant } from '../App';
import { tenantService } from '../services/tenantService';
import { trackEvent } from '../../../utils/analytics';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectExistingTenantProps {
  properties: Property[];
  existingTenants: Tenant[];
  onBack: () => void;
  onSuccess: () => void;
  userId?: string;
}

interface LeaseDetails {
  rentAmount: string;
  paymentFrequency: 'monthly' | 'yearly' | 'fixed-time';
  firstPaymentDate: string;
  leaseStart: string;
  leaseEnd: string;
}

type Step = 'select' | 'details' | 'success';

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

function defaultLease(): LeaseDetails {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1, 12, 0, 0);
  const end = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate(), 12, 0, 0);
  return {
    rentAmount: '',
    paymentFrequency: 'monthly',
    firstPaymentDate: toISODate(start),
    leaseStart: toISODate(start),
    leaseEnd: toISODate(end),
  };
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const FIELD =
  'w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#4E97CC] focus:outline-none transition-colors bg-white';
const FIELD_ERR = 'border-red-400 focus:border-red-400';
const LABEL = 'block text-sm font-semibold text-gray-700 mb-1.5';
const ERR_MSG = 'text-xs text-red-500 mt-1 flex items-center gap-1';

// ─── Component ────────────────────────────────────────────────────────────────

export function SelectExistingTenant({
  properties,
  existingTenants,
  onBack,
  onSuccess,
  userId,
}: SelectExistingTenantProps) {
  const [step, setStep] = useState<Step>('select');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [lease, setLease] = useState<LeaseDetails>(defaultLease());
  const [leaseErrors, setLeaseErrors] = useState<Partial<Record<keyof LeaseDetails, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Client-side filtered list — only tenants who are NOT currently occupying a property
  // (status ended, or a different property, or no property).
  const eligibleTenants = useMemo(
    () =>
      existingTenants.filter(
        (t) => t.status === 'ended' || t.status === 'pending' || !t.propertyId
      ),
    [existingTenants]
  );

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return eligibleTenants;
    return eligibleTenants.filter(
      (t) =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.email || '').toLowerCase().includes(q)
    );
  }, [eligibleTenants, searchTerm]);

  const selectedTenant = existingTenants.find((t) => t.id === selectedTenantId);
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const canProceed = !!selectedTenantId && !!selectedPropertyId;

  function handleProceed() {
    if (!canProceed) return;
    const prop = properties.find((p) => p.id === selectedPropertyId);
    setLease((prev) => ({
      ...prev,
      rentAmount: prop?.rent ? String(prop.rent) : prev.rentAmount,
    }));
    setStep('details');
  }

  function setLeaseField(field: keyof LeaseDetails, value: string) {
    setLease((prev) => ({ ...prev, [field]: value }));
    if (leaseErrors[field]) setLeaseErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateLease(): boolean {
    const e: Partial<Record<keyof LeaseDetails, string>> = {};
    const rent = parseFloat(lease.rentAmount);
    if (!lease.rentAmount.trim() || isNaN(rent) || rent <= 0)
      e.rentAmount = 'Valid rent amount is required';
    if (!lease.firstPaymentDate || !fromISODate(lease.firstPaymentDate))
      e.firstPaymentDate = 'Valid first payment date is required';
    if (!lease.leaseStart || !fromISODate(lease.leaseStart))
      e.leaseStart = 'Valid rent start date is required';
    if (!lease.leaseEnd || !fromISODate(lease.leaseEnd)) {
      e.leaseEnd = 'Valid rent end date is required';
    } else {
      const s = fromISODate(lease.leaseStart);
      const en = fromISODate(lease.leaseEnd);
      if (s && en && en < s) e.leaseEnd = 'Rent end must be after rent start';
    }
    setLeaseErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate() {
    if (!validateLease()) return;
    if (!selectedTenant || !selectedProperty) return;
    if (!userId) {
      setSubmitError('User ID not found. Please log in again.');
      return;
    }

    setIsLoading(true);
    setSubmitError(null);
    try {
      const tenantData: Omit<Tenant, 'id'> = {
        name: selectedTenant.name,
        email: selectedTenant.email,
        phone: selectedTenant.phone || '',
        propertyId: selectedProperty.id,
        propertyAddress: selectedProperty.address,
        rentAmount: parseFloat(lease.rentAmount),
        paymentFrequency: lease.paymentFrequency,
        firstPaymentDate: fromISODate(lease.firstPaymentDate) ?? new Date(),
        leaseStart: fromISODate(lease.leaseStart) ?? new Date(),
        leaseEnd: fromISODate(lease.leaseEnd) ?? new Date(),
        // Landlord is actively reassigning — status is active, not pending
        status: 'active',
        referencingStatus: selectedTenant.referencingStatus || 'not-started',
        paymentStatus: 'current',
        emergencyContact: selectedTenant.emergencyContact ?? { name: '', phone: '', relationship: '' },
        defaultRiskScore: selectedTenant.defaultRiskScore ?? 75,
      };

      await tenantService.createTenant(tenantData, userId);
      trackEvent('landlord_existing_tenant_reassigned', {
        property_address: selectedProperty.address,
      });
      setStep('success');
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to assign tenant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Success ──────────────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: '#F8FAFC', fontFamily: 'Archivo, sans-serif' }}
      >
        <div className="text-center space-y-5 max-w-sm w-full">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: '#136C9E' }}>
            Tenant Reassigned!
          </h2>
          <p className="text-gray-600 text-sm">
            <strong>{selectedTenant?.name}</strong> has been assigned to{' '}
            <strong>{selectedProperty?.address}</strong> and is now active.
          </p>
          <button
            onClick={onSuccess}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #DC5F12, #DC5F12)' }}
          >
            Go to tenant list
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 2: Lease details ────────────────────────────────────────────────

  if (step === 'details') {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: '#F8FAFC', fontFamily: 'Archivo, sans-serif' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => setStep('select')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-bold" style={{ color: '#136C9E' }}>
              Rent terms
            </h1>
            <p className="text-xs text-gray-500 truncate">
              {selectedTenant?.name} → {selectedProperty?.address}
            </p>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
          {/* Tenant + property summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
              style={{ backgroundColor: '#136C9E' }}
            >
              {initials(selectedTenant?.name ?? '?')}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-blue-900 text-sm">{selectedTenant?.name}</p>
              <p className="text-blue-700 text-xs">{selectedTenant?.email}</p>
              <p className="text-blue-600 text-xs mt-0.5">→ {selectedProperty?.address}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            {/* Rent + frequency */}
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
                    value={lease.rentAmount}
                    onChange={(e) => setLeaseField('rentAmount', e.target.value)}
                    placeholder="1200"
                    className={`${FIELD} pl-10 ${leaseErrors.rentAmount ? FIELD_ERR : ''}`}
                  />
                </div>
                {leaseErrors.rentAmount && (
                  <p className={ERR_MSG}>
                    <AlertCircle className="w-3 h-3" /> {leaseErrors.rentAmount}
                  </p>
                )}
              </div>

              <div>
                <label className={LABEL} htmlFor="freq">
                  Frequency <span className="text-red-500">*</span>
                </label>
                <Select
                  value={lease.paymentFrequency}
                  onValueChange={(v) => setLeaseField('paymentFrequency', v as LeaseDetails['paymentFrequency'])}
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

            {/* First payment */}
            <div>
              <label className={LABEL} htmlFor="firstPay">
                First payment date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="firstPay"
                  type="date"
                  value={lease.firstPaymentDate}
                  onChange={(e) => setLeaseField('firstPaymentDate', e.target.value)}
                  className={`${FIELD} pl-10 ${leaseErrors.firstPaymentDate ? FIELD_ERR : ''}`}
                />
              </div>
              {leaseErrors.firstPaymentDate && (
                <p className={ERR_MSG}>
                  <AlertCircle className="w-3 h-3" /> {leaseErrors.firstPaymentDate}
                </p>
              )}
            </div>

            {/* Rent dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL} htmlFor="leaseStart">
                  Rent start <span className="text-red-500">*</span>
                </label>
                <input
                  id="leaseStart"
                  type="date"
                  value={lease.leaseStart}
                  onChange={(e) => setLeaseField('leaseStart', e.target.value)}
                  className={`${FIELD} ${leaseErrors.leaseStart ? FIELD_ERR : ''}`}
                />
                {leaseErrors.leaseStart && (
                  <p className={ERR_MSG}>
                    <AlertCircle className="w-3 h-3" /> {leaseErrors.leaseStart}
                  </p>
                )}
              </div>
              <div>
                <label className={LABEL} htmlFor="leaseEnd">
                  Rent end <span className="text-red-500">*</span>
                </label>
                <input
                  id="leaseEnd"
                  type="date"
                  value={lease.leaseEnd}
                  onChange={(e) => setLeaseField('leaseEnd', e.target.value)}
                  className={`${FIELD} ${leaseErrors.leaseEnd ? FIELD_ERR : ''}`}
                />
                {leaseErrors.leaseEnd && (
                  <p className={ERR_MSG}>
                    <AlertCircle className="w-3 h-3" /> {leaseErrors.leaseEnd}
                  </p>
                )}
              </div>
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pb-8">
            <button
              type="button"
              onClick={() => setStep('select')}
              className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={isLoading}
              className="flex-1 py-3.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #DC5F12, #DC5F12)' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Assigning…
                </>
              ) : (
                <>
                  <Home className="w-4 h-4" />
                  Assign Tenant
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 1: Select tenant + property ────────────────────────────────────

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#F8FAFC', fontFamily: 'Archivo, sans-serif' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold" style={{ color: '#136C9E' }}>
          Reassign a past tenant
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <p className="text-sm text-gray-500 leading-relaxed">
          Search your previous tenants and assign them to a new property. Only tenants whose
          tenancy has ended or who are not currently assigned appear below.
        </p>

        {/* Property selector */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <div className={`flex items-center gap-2 text-sm font-semibold`} style={{ color: '#374957' }}>
            <Home className="w-4 h-4" style={{ color: '#136C9E' }} />
            Which property?
          </div>
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className={`${FIELD} h-auto`}>
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
        </div>

        {/* Tenant search */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#374957' }}>
            <User className="w-4 h-4" style={{ color: '#136C9E' }} />
            Which tenant?
            <span className="text-gray-400 font-normal text-xs ml-1">
              ({eligibleTenants.length} available)
            </span>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email…"
              className={`${FIELD} pl-10`}
            />
          </div>

          {/* Empty states */}
          {eligibleTenants.length === 0 && (
            <div className="text-center py-10 space-y-2">
              <Users className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-500 font-medium">No previous tenants found</p>
              <p className="text-xs text-gray-400">
                Tenants whose rent has ended will appear here.
              </p>
            </div>
          )}

          {eligibleTenants.length > 0 && filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No tenants match "{searchTerm}"</p>
            </div>
          )}

          {/* Tenant list */}
          {filtered.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto -mx-1 px-1">
              {filtered.map((t) => {
                const isSelected = selectedTenantId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTenantId(t.id)}
                    className={`w-full text-left rounded-xl border-2 p-3.5 transition-all duration-150 ${
                      isSelected
                        ? 'border-[#136C9E] bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                          style={{ backgroundColor: isSelected ? '#136C9E' : '#9CA3AF' }}
                        >
                          {initials(t.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate">{t.name}</p>
                          <p className="text-xs text-gray-500 truncate">{t.email}</p>
                          {t.propertyAddress && (
                            <p className="text-xs text-gray-400 truncate">
                              Previously: {t.propertyAddress}
                            </p>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#136C9E' }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selection preview */}
        {selectedTenant && selectedProperty && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">
              <strong>{selectedTenant.name}</strong> will be assigned to{' '}
              <strong>{selectedProperty.address}</strong>. You'll complete the lease terms next.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleProceed}
            disabled={!canProceed}
            className="flex-1 py-3.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #136C9E, #1a87c4)' }}
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default SelectExistingTenant;
