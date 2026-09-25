import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  ArrowLeft,
  Search,
  Users,
  Home,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  ChevronRight,
} from 'lucide-react';
import { Property, Tenant } from '../App';
import { tenantService } from '../services/tenantService';
import { trackEvent } from '../../../utils/analytics';
import axios from 'axios';
import { PRIMARY_API_BASE_URL } from '../../../utils/apiEndpoints';

interface AzureUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  givenName: string;
  surname: string;
  createdAt?: string;
  azureObjectId: string;
  userPrincipalName: string;
}

interface TenantDetails {
  rentAmount: string;
  paymentFrequency: 'monthly' | 'yearly' | 'fixed-time';
  firstPaymentDate: string;
  leaseStart: string;
  leaseEnd: string;
}

interface SelectExistingTenantProps {
  properties: Property[];
  existingTenants: Tenant[];
  onBack: () => void;
  onSuccess: () => void;
  userId?: string;
}

type Step = 'select' | 'details' | 'success';

/** Returns today's date as a yyyy-mm-dd string, safe from timezone shifts. */
const toISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Constructs a Date at local noon from a yyyy-mm-dd string to avoid tz edge-cases. */
const fromISODate = (s: string): Date | null => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0);
};

const isTodayOrFuture = (s: string): boolean => {
  const dt = fromISODate(s);
  if (!dt) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dt >= today;
};

const defaultDetails = (): TenantDetails => {
  const now = new Date();
  // lease starts 1st of next month
  const leaseStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 12, 0, 0);
  // lease ends 1 year after start
  const leaseEnd = new Date(leaseStart.getFullYear() + 1, leaseStart.getMonth(), leaseStart.getDate(), 12, 0, 0);
  return {
    rentAmount: '',
    paymentFrequency: 'monthly',
    firstPaymentDate: toISODate(leaseStart),
    leaseStart: toISODate(leaseStart),
    leaseEnd: toISODate(leaseEnd),
  };
};

export function SelectExistingTenant({
  properties,
  existingTenants,
  onBack,
  onSuccess,
  userId,
}: SelectExistingTenantProps) {
  const [step, setStep] = useState<Step>('select');

  // Step 1 state
  const [searchTerm, setSearchTerm] = useState('');
  const [azureUsers, setAzureUsers] = useState<AzureUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Step 2 state
  const [details, setDetails] = useState<TenantDetails>(defaultDetails());
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});

  // Submission state
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch Azure AD B2C users with debounced search
  useEffect(() => {
    const fetchAzureUsers = async () => {
      setIsLoadingUsers(true);
      setFetchError(null);
      try {
        const API_BASE_URL = PRIMARY_API_BASE_URL.replace(/\/api$/, '');
        const response = await axios.get(`${API_BASE_URL}/api/azure-users`, {
          params: searchTerm ? { search: searchTerm } : {},
          timeout: 30000,
        });

        if (response.data.success) {
          setAzureUsers(response.data.users || []);
        } else {
          throw new Error(response.data.error || 'Failed to fetch users');
        }
      } catch (err: any) {
        let msg = 'Failed to load users';
        if (axios.isAxiosError(err)) {
          if (err.code === 'ECONNREFUSED') msg = 'Cannot connect to backend server. Please ensure it is running.';
          else if (err.code === 'ETIMEDOUT') msg = 'Request timed out. Please try again.';
          else if (err.response?.status === 500 && err.response.data?.error?.includes('not configured'))
            msg = 'Azure AD B2C is not configured on the backend.';
          else msg = err.response?.data?.error || err.message || msg;
        } else if (err instanceof Error) {
          msg = err.message;
        }
        setFetchError(msg);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    const id = setTimeout(fetchAzureUsers, searchTerm ? 500 : 0);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const selectedUser = azureUsers.find((u) => u.id === selectedUserId);
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  // ─── Step 1: validate before proceeding ───────────────────────────────────
  const canProceedToDetails = !!selectedUserId && !!selectedPropertyId;

  const handleProceedToDetails = () => {
    if (!canProceedToDetails) return;
    // Pre-fill rent from property if available
    const prop = properties.find((p) => p.id === selectedPropertyId);
    setDetails((prev) => ({
      ...prev,
      rentAmount: prop?.rent ? String(prop.rent) : prev.rentAmount,
    }));
    setStep('details');
  };

  // ─── Step 2: validate details ─────────────────────────────────────────────
  const validateDetails = (): boolean => {
    const errs: Record<string, string> = {};

    const rent = parseFloat(details.rentAmount);
    if (!details.rentAmount.trim()) errs.rentAmount = 'Rent amount is required';
    else if (isNaN(rent) || rent <= 0) errs.rentAmount = 'Enter a valid rent amount greater than zero';

    if (!details.firstPaymentDate) errs.firstPaymentDate = 'First payment date is required';
    else if (!isTodayOrFuture(details.firstPaymentDate))
      errs.firstPaymentDate = 'First payment date must be today or in the future';

    if (!details.leaseStart) errs.leaseStart = 'Lease start date is required';

    if (!details.leaseEnd) {
      errs.leaseEnd = 'Lease end date is required';
    } else if (details.leaseStart) {
      const start = fromISODate(details.leaseStart);
      const end = fromISODate(details.leaseEnd);
      if (start && end && end < start) errs.leaseEnd = 'Lease end must be on or after start date';
    }

    setDetailErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Step 2: submit ────────────────────────────────────────────────────────
  const handleCreateTenant = async () => {
    if (!validateDetails()) return;
    if (!selectedUser || !selectedProperty) return;

    const currentUserId = userId || '';
    if (!currentUserId) {
      setSubmitError('User ID not found. Please log in again.');
      return;
    }

    setIsLoading(true);
    setSubmitError(null);

    try {
      const leaseStartDate = fromISODate(details.leaseStart) ?? new Date();
      const leaseEndDate = fromISODate(details.leaseEnd) ?? new Date();
      const firstPaymentDate = fromISODate(details.firstPaymentDate) ?? new Date();

      const tenantData: Omit<Tenant, 'id'> = {
        name: selectedUser.name,
        email: selectedUser.email,
        phone: selectedUser.phone || '',
        propertyId: selectedProperty.id,
        propertyAddress: selectedProperty.address,
        rentAmount: parseFloat(details.rentAmount),
        paymentFrequency: details.paymentFrequency,
        firstPaymentDate,
        leaseStart: leaseStartDate,
        leaseEnd: leaseEndDate,
        status: 'pending',
        referencingStatus: 'not-started',
        paymentStatus: 'current',
        emergencyContact: { name: '', phone: '', relationship: '' },
        defaultRiskScore: 75,
      };

      const tenantId = await tenantService.createTenant(tenantData, currentUserId);
      trackEvent('landlord_existing_user_assigned', { property_address: selectedProperty.address });
      console.log('✅ [SelectExistingTenant] Tenant created:', tenantId);
      setStep('success');

      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err: any) {
      console.error('[SelectExistingTenant] Failed to create tenant:', err);
      setSubmitError(err?.message || 'Failed to assign tenant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Success screen ────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: '#F7F7F7', fontFamily: 'Archivo, sans-serif' }}
      >
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#374957' }}>
              Tenant Created!
            </h2>
            <p className="text-gray-600 mb-6">
              <strong>{selectedUser?.name}</strong> has been created as a tenant and assigned to{' '}
              <strong>{selectedProperty?.address}</strong>.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800 text-left">
                  The tenant is pending — they can log in to complete their profile and verify occupancy.
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Redirecting you back to the tenant list…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Step 2: Tenancy Details ───────────────────────────────────────────────
  if (step === 'details') {
    return (
      <div
        className="min-h-screen flex flex-col px-4"
        style={{ backgroundColor: '#F7F7F7', fontFamily: 'Archivo, sans-serif' }}
      >
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col py-8">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Button variant="ghost" onClick={() => setStep('select')} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#374957' }}>
                Tenancy Details
              </h1>
              <p className="text-gray-500 text-sm">
                Complete the lease terms for{' '}
                <strong>{selectedUser?.name}</strong> at{' '}
                <strong>{selectedProperty?.address}</strong>
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Rent Amount */}
              <div className="space-y-2">
                <Label htmlFor="rent">
                  Monthly Rent <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">£</span>
                  <Input
                    id="rent"
                    type="number"
                    min="0"
                    step="0.01"
                    value={details.rentAmount}
                    onChange={(e) =>
                      setDetails((p) => ({ ...p, rentAmount: e.target.value }))
                    }
                    className={`pl-8 ${detailErrors.rentAmount ? 'border-red-500' : ''}`}
                    placeholder="1200"
                  />
                </div>
                {detailErrors.rentAmount && (
                  <p className="text-red-500 text-sm">{detailErrors.rentAmount}</p>
                )}
              </div>

              {/* Payment Frequency */}
              <div className="space-y-2">
                <Label htmlFor="freq">
                  Payment Frequency <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={details.paymentFrequency}
                  onValueChange={(v) =>
                    setDetails((p) => ({
                      ...p,
                      paymentFrequency: v as TenantDetails['paymentFrequency'],
                    }))
                  }
                >
                  <SelectTrigger id="freq">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="fixed-time">Fixed Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* First Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="firstPay">
                  First Payment Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstPay"
                  type="date"
                  value={details.firstPaymentDate}
                  onChange={(e) =>
                    setDetails((p) => ({ ...p, firstPaymentDate: e.target.value }))
                  }
                  className={detailErrors.firstPaymentDate ? 'border-red-500' : ''}
                />
                {detailErrors.firstPaymentDate && (
                  <p className="text-red-500 text-sm">{detailErrors.firstPaymentDate}</p>
                )}
              </div>

              {/* Lease Start */}
              <div className="space-y-2">
                <Label htmlFor="leaseStart">
                  Lease Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="leaseStart"
                  type="date"
                  value={details.leaseStart}
                  onChange={(e) =>
                    setDetails((p) => ({ ...p, leaseStart: e.target.value }))
                  }
                  className={detailErrors.leaseStart ? 'border-red-500' : ''}
                />
                {detailErrors.leaseStart && (
                  <p className="text-red-500 text-sm">{detailErrors.leaseStart}</p>
                )}
              </div>

              {/* Lease End */}
              <div className="space-y-2">
                <Label htmlFor="leaseEnd">
                  Lease End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="leaseEnd"
                  type="date"
                  value={details.leaseEnd}
                  onChange={(e) =>
                    setDetails((p) => ({ ...p, leaseEnd: e.target.value }))
                  }
                  className={detailErrors.leaseEnd ? 'border-red-500' : ''}
                />
                {detailErrors.leaseEnd && (
                  <p className="text-red-500 text-sm">{detailErrors.leaseEnd}</p>
                )}
              </div>

              {/* Submit error */}
              {submitError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep('select')}>
                  Back
                </Button>
                <Button
                  onClick={handleCreateTenant}
                  disabled={isLoading}
                  style={{ backgroundColor: '#DC5F12', borderColor: '#DC5F12' }}
                  className="text-white px-6 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Tenant…
                    </>
                  ) : (
                    <>
                      <Home className="w-4 h-4" />
                      Create Tenant
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Step 1: Select User & Property ───────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col px-4"
      style={{ backgroundColor: '#F7F7F7', fontFamily: 'Archivo, sans-serif' }}
    >
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8 pt-8">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#374957' }}>
              Select Existing User
            </h1>
            <p className="text-gray-600 mt-1">
              Find a registered Proptii user and assign them as a tenant
            </p>
          </div>
        </div>

        {/* Search & Property */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Name or email…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  {isLoadingUsers && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="property">Assign to Property <span className="text-red-500">*</span></Label>
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger id="property">
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
            </div>
          </CardContent>
        </Card>

        {/* Fetch error */}
        {fetchError && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{fetchError}</p>
            </CardContent>
          </Card>
        )}

        {/* User list */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4" />
              Registered Users ({azureUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingUsers && azureUsers.length === 0 ? (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 text-gray-400 mx-auto mb-3 animate-spin" />
                <p className="text-gray-500">Loading users…</p>
              </div>
            ) : azureUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No users found. Try adjusting your search.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {azureUsers.map((user) => {
                  const isSelected = selectedUserId === user.id;
                  const alreadyTenant = existingTenants.some(
                    (t) => t.email === user.email
                  );
                  return (
                    <button
                      key={user.id}
                      type="button"
                      disabled={alreadyTenant}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                        alreadyTenant
                          ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
                          : isSelected
                          ? 'border-orange-500 bg-orange-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-semibold">
                              {user.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm" style={{ color: '#374957' }}>
                              {user.name}
                            </p>
                            <p className="text-gray-500 text-xs truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {alreadyTenant && (
                            <Badge className="bg-gray-100 text-gray-600 text-xs">Already a tenant</Badge>
                          )}
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-orange-500" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview & CTA */}
        {selectedUser && selectedProperty && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>{selectedUser.name}</strong> will be assigned to{' '}
                <strong>{selectedProperty.address}</strong>. You'll complete the lease terms on the next screen.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-between pb-8">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={handleProceedToDetails}
            disabled={!canProceedToDetails}
            className="px-6 flex items-center gap-2 text-white"
            style={{
              backgroundColor: canProceedToDetails ? '#DC5F12' : undefined,
              borderColor: canProceedToDetails ? '#DC5F12' : undefined,
            }}
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SelectExistingTenant;
