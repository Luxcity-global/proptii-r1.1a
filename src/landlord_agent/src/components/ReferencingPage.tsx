import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Send, Eye, MessageSquare, Clock, CheckCircle2,
  User, Search, ChevronDown, Loader2, AlertCircle, RefreshCw,
  FileSearch, Mail,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { getResolvedApiBaseUrl } from '../../../config/apiBaseUrl';
import { getAccessTokenForApiRequest } from '../../../services/msalAccessToken';
import { referencingService } from '../services/referencingService';
import { Tenant, UserProfile } from '../App';

const API = getResolvedApiBaseUrl();

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReceivedShare {
  id: string;
  tenantName: string;
  tenantEmail: string;
  propertyAddress: string;
  notes: string;
  status: 'sent' | 'viewed' | 'claimed';
  viewToken: string;
  claimToken: string;
  expiresAt: string;
  claimedBy: string | null;
  createdAt: string;
}

interface ReferencingPageProps {
  tenants: Tenant[];
  userProfile: UserProfile | null;
  onViewTenant?: (tenant: Tenant) => void;
  onOpenMessages?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  sent:    'bg-blue-100 text-blue-700',
  viewed:  'bg-green-100 text-green-700',
  claimed: 'bg-purple-100 text-purple-700',
};

const STATUS_LABELS: Record<string, string> = {
  sent:    'Received',
  viewed:  'Viewed',
  claimed: 'Connected',
};

function getReferencingStatusColor(status: 'not-started' | 'in-progress' | 'complete') {
  switch (status) {
    case 'complete':    return 'bg-green-100 text-green-800';
    case 'in-progress': return 'bg-blue-100 text-blue-800';
    default:            return 'bg-gray-100 text-gray-800';
  }
}

function getReferencingStatusLabel(status: 'not-started' | 'in-progress' | 'complete') {
  switch (status) {
    case 'complete':    return 'Complete';
    case 'in-progress': return 'In progress';
    default:            return 'Not started';
  }
}

// ─── Received Passports panel ─────────────────────────────────────────────────

function ReceivedPassports({ onOpenMessages }: { onOpenMessages?: () => void }) {
  const [shares, setShares]   = useState<ReceivedShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessTokenForApiRequest();
      const res = await fetch(`${API}/referencing/received`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setShares(json.data || []);
    } catch {
      setError('Could not load received referencings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = shares.filter(s => {
    const q = search.toLowerCase();
    return (
      s.tenantName?.toLowerCase().includes(q) ||
      s.tenantEmail?.toLowerCase().includes(q) ||
      s.propertyAddress?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#136C9E]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-500">{error}</p>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by tenant name, email or property..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Summary pills */}
      {shares.length > 0 && (
        <div className="flex gap-2 flex-wrap text-xs">
          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
            {shares.length} total
          </span>
          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
            {shares.filter(s => s.status === 'sent').length} new
          </span>
          <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">
            {shares.filter(s => s.status === 'viewed').length} viewed
          </span>
          <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
            {shares.filter(s => s.status === 'claimed').length} connected
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-[#136C9E]" />
          </div>
          <p className="font-semibold text-gray-800 text-sm">
            {search ? 'No results match your search' : 'No referencing passports yet'}
          </p>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
            {search
              ? 'Try a different name, email or address.'
              : 'When a tenant shares their referencing passport with you, it will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(share => (
            <div
              key={share.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#136C9E]/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-[#136C9E]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{share.tenantName || 'Tenant'}</p>
                    <p className="text-xs text-gray-500 truncate">{share.tenantEmail}</p>
                    {share.propertyAddress && (
                      <p className="text-xs text-gray-400 truncate">{share.propertyAddress}</p>
                    )}
                  </div>
                </div>
                <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[share.status] || STATUS_STYLES.sent}`}>
                  {STATUS_LABELS[share.status] || 'Received'}
                </span>
              </div>

              {share.notes && (
                <p className="mt-2 text-xs text-gray-500 italic line-clamp-2">"{share.notes}"</p>
              )}

              <div className="mt-3 flex items-center gap-3 text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(share.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                {share.expiresAt && new Date(share.expiresAt) > new Date() && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                )}
                {share.expiresAt && new Date(share.expiresAt) <= new Date() && (
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertCircle className="w-3 h-3" /> Expired
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => window.open(`/referencing/view/${share.viewToken}`, '_blank', 'noopener')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Passport
                </button>
                <button
                  onClick={() => {
                    if (share.claimedBy && onOpenMessages) {
                      onOpenMessages();
                    } else {
                      window.open(`/claim-referencing?token=${share.claimToken}`, '_blank', 'noopener');
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#136C9E] text-white text-xs font-semibold hover:bg-[#0F5A82] transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {share.claimedBy ? 'Messages' : 'Connect & Message'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Request Referencing panel ────────────────────────────────────────────────

interface RequestState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

function RequestReferencing({
  tenants,
  userProfile,
  onViewTenant,
}: {
  tenants: Tenant[];
  userProfile: UserProfile | null;
  onViewTenant?: (tenant: Tenant) => void;
}) {
  const [search, setSearch]   = useState('');
  const [statuses, setStatuses] = useState<Map<string, 'not-started' | 'in-progress' | 'complete'>>(new Map());
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [requestStates, setRequestStates] = useState<Record<string, RequestState>>({});
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName]   = useState('');
  const [manualProperty, setManualProperty] = useState('');
  const [manualState, setManualState] = useState<RequestState>({ loading: false, success: false, error: null });

  // Load referencing statuses for all tenants
  useEffect(() => {
    if (!tenants.length) { setLoadingStatuses(false); return; }
    const emails = tenants.filter(t => t.email?.trim()).map(t => t.email);
    referencingService.getReferencingStatusForTenants(emails)
      .then(map => setStatuses(map))
      .finally(() => setLoadingStatuses(false));
  }, [tenants]);

  const sendRequest = async (tenantEmail: string, tenantName: string, propertyAddress: string) => {
    setRequestStates(prev => ({ ...prev, [tenantEmail]: { loading: true, success: false, error: null } }));
    try {
      const token = await getAccessTokenForApiRequest();
      const res = await fetch(`${API}/referencing/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tenantEmail,
          tenantName,
          propertyAddress,
          landlordName: userProfile?.name || userProfile?.email || 'Your landlord',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `Request failed (${res.status})`);
      }
      setRequestStates(prev => ({ ...prev, [tenantEmail]: { loading: false, success: true, error: null } }));
    } catch (err: any) {
      setRequestStates(prev => ({ ...prev, [tenantEmail]: { loading: false, success: false, error: err.message } }));
    }
  };

  const sendManualRequest = async () => {
    if (!manualEmail.trim()) return;
    setManualState({ loading: true, success: false, error: null });
    try {
      const token = await getAccessTokenForApiRequest();
      const res = await fetch(`${API}/referencing/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tenantEmail:     manualEmail.trim(),
          tenantName:      manualName.trim() || manualEmail.trim(),
          propertyAddress: manualProperty.trim(),
          landlordName:    userProfile?.name || userProfile?.email || 'Your landlord',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `Request failed (${res.status})`);
      }
      setManualState({ loading: false, success: true, error: null });
      setManualEmail('');
      setManualName('');
      setManualProperty('');
    } catch (err: any) {
      setManualState({ loading: false, success: false, error: err.message });
    }
  };

  const filteredTenants = tenants.filter(t => {
    const q = search.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.propertyAddress?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">

      {/* ── Manual request (send to any email) ────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#136C9E]" />
            Request from any tenant
          </CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">
            Send a referencing request to a tenant who is not yet in your clients list.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Tenant email *"
              type="email"
              value={manualEmail}
              onChange={e => setManualEmail(e.target.value)}
            />
            <Input
              placeholder="Tenant name (optional)"
              value={manualName}
              onChange={e => setManualName(e.target.value)}
            />
            <Input
              placeholder="Property address (optional)"
              value={manualProperty}
              onChange={e => setManualProperty(e.target.value)}
            />
          </div>

          {manualState.error && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {manualState.error}
            </p>
          )}
          {manualState.success && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Request sent — tenant will receive an email with the referencing link.
            </p>
          )}

          <Button
            onClick={sendManualRequest}
            disabled={!manualEmail.trim() || manualState.loading}
            className="w-full sm:w-auto"
            style={{ backgroundColor: '#136C9E' }}
          >
            {manualState.loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send Request
          </Button>
        </CardContent>
      </Card>

      {/* ── From existing tenants ──────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-[#136C9E]" />
            Request from existing tenants
          </CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">
            Tenants already in your clients list. Click "Send Request" to email them a referencing link.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search tenants..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {tenants.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400">
              No tenants in your clients list yet.
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400">
              No tenants match "{search}".
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTenants.map(tenant => {
                const status    = statuses.get(tenant.email) || 'not-started';
                const reqState  = requestStates[tenant.email];
                const isLoading = reqState?.loading;
                const isSent    = reqState?.success;
                const reqError  = reqState?.error;

                return (
                  <div key={tenant.id} className="flex items-center gap-3 py-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-[#136C9E]/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-[#136C9E]" />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 truncate">{tenant.name}</p>
                        {loadingStatuses ? (
                          <Badge className="bg-gray-100 text-gray-500 text-[10px]">
                            <Loader2 className="w-2.5 h-2.5 mr-1 animate-spin" /> Loading...
                          </Badge>
                        ) : (
                          <Badge className={`${getReferencingStatusColor(status)} text-[10px]`}>
                            {getReferencingStatusLabel(status)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{tenant.email}</p>
                      {tenant.propertyAddress && (
                        <p className="text-[11px] text-gray-400 truncate">{tenant.propertyAddress}</p>
                      )}
                      {reqError && (
                        <p className="text-[11px] text-red-500 mt-0.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {reqError}
                        </p>
                      )}
                      {isSent && (
                        <p className="text-[11px] text-green-600 mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Request sent
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {onViewTenant && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs px-3"
                          onClick={() => onViewTenant(tenant)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="h-8 text-xs px-3"
                        style={{ backgroundColor: isSent ? '#16a34a' : '#136C9E' }}
                        disabled={isLoading || isSent || status === 'complete'}
                        onClick={() => sendRequest(tenant.email, tenant.name, tenant.propertyAddress || '')}
                        title={status === 'complete' ? 'Referencing already complete' : undefined}
                      >
                        {isLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isSent ? (
                          <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Sent</>
                        ) : (
                          <><Send className="w-3.5 h-3.5 mr-1" /> Send Request</>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main ReferencingPage ─────────────────────────────────────────────────────

export function ReferencingPage({ tenants, userProfile, onViewTenant, onOpenMessages }: ReferencingPageProps) {
  const [activeTab, setActiveTab] = useState<'received' | 'request'>('received');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#136C9E]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Referencing</h1>
            <p className="text-sm text-gray-500">
              View passports tenants have shared with you, or request referencing from a tenant.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'received' | 'request')}>
          <TabsList className="mb-6">
            <TabsTrigger value="received" className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Received Passports
            </TabsTrigger>
            <TabsTrigger value="request" className="flex items-center gap-1.5">
              <Send className="w-4 h-4" />
              Request Referencing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received">
            <ReceivedPassports onOpenMessages={onOpenMessages} />
          </TabsContent>

          <TabsContent value="request">
            <RequestReferencing
              tenants={tenants}
              userProfile={userProfile}
              onViewTenant={onViewTenant}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
