import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShieldCheck,
  Send,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle2,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Mail,
  User,
  MapPin,
  Settings,
  Bell,
  Plus,
  Sparkles,
  ChevronDown,
  X,
} from 'lucide-react';
import { getResolvedApiBaseUrl } from '../../../config/apiBaseUrl';
import { getAccessTokenForApiRequest } from '../../../services/msalAccessToken';
import { referencingService } from '../services/referencingService';
import { Tenant, UserProfile } from '../App';
import {
  getAgentDummyReceivedShares,
  isAgentTestAccount,
  mergeById,
  type PassportStep,
} from '../data/agentTestPersona';
import { PassportModal, derivePassportSteps } from './PassportModal';
import { CommsModal } from './CommsModal';
import '../styles/referencingPage.css';

const API = getResolvedApiBaseUrl();

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
  phone?: string;
  score?: number;
  checks?: { label: string; passed: boolean }[];
  steps?: PassportStep[];
}

interface ReferencingPageProps {
  tenants: Tenant[];
  userProfile: UserProfile | null;
  onViewTenant?: (tenant: Tenant) => void;
  onOpenMessages?: () => void;
  onViewInsights?: () => void;
  onViewSettings?: () => void;
  onViewNotifications?: () => void;
}

interface RequestState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

const AVATAR_TONES = ['sky', 'green', 'amber', 'violet', 'rose'] as const;

function initials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'T';
  return ((parts[0][0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

function avatarTone(name: string): (typeof AVATAR_TONES)[number] {
  const sum = (name || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_TONES[sum % AVATAR_TONES.length];
}

function getReferencingStatusLabel(status: 'not-started' | 'in-progress' | 'complete') {
  switch (status) {
    case 'complete':
      return 'Complete';
    case 'in-progress':
      return 'In progress';
    default:
      return 'Not started';
  }
}

function getReferencingBadgeClass(status: 'not-started' | 'in-progress' | 'complete') {
  switch (status) {
    case 'complete':
      return 'complete';
    case 'in-progress':
      return 'progress';
    default:
      return 'idle';
  }
}

function shareBadgeClass(status: string, expired: boolean) {
  if (expired) return 'expired';
  if (status === 'claimed') return 'claimed';
  if (status === 'viewed') return 'viewed';
  return 'sent';
}

function shareBadgeLabel(status: string, expired: boolean) {
  if (expired) return 'Expired';
  if (status === 'claimed') return 'Connected';
  if (status === 'viewed') return 'Verified';
  return 'Pending';
}

function formatReceivedAt(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  if (sameDay) return `Received Today, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Received Yesterday, ${time}`;
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (days >= 2 && days < 7) return `Received ${days} days ago`;
  return `Received ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function timeAgo(value?: string | Date | number | null): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const days = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function passportProgress(share: ReceivedShare): number {
  if (typeof share.score === 'number' && Number.isFinite(share.score)) {
    return Math.max(0, Math.min(100, Math.round(share.score)));
  }
  if (share.steps?.length) {
    const value = share.steps.reduce((acc, step) => {
      if (step.status === 'Filled') return acc + 1;
      if (step.status === 'Progress Saved') return acc + 0.5;
      return acc;
    }, 0);
    return Math.round((value / share.steps.length) * 100);
  }
  if (share.checks?.length) {
    return Math.round((share.checks.filter((check) => check.passed).length / share.checks.length) * 100);
  }
  const expired = Boolean(share.expiresAt && new Date(share.expiresAt) <= new Date());
  if (expired) return 0;
  if (share.status === 'claimed') return 100;
  if (share.status === 'viewed') return 70;
  return 35;
}

function donutTone(score: number, expired: boolean): 'good' | 'mid' | 'low' {
  if (expired) return 'low';
  if (score >= 80) return 'good';
  if (score >= 60) return 'mid';
  return 'low';
}

const DONUT_C = 2 * Math.PI * 14;

function PassportDonut({ score, tone, label }: { score: number; tone: 'good' | 'mid' | 'low'; label: string }) {
  const offset = DONUT_C - (score / 100) * DONUT_C;
  return (
    <div className={`ll-ref-donut is-${tone}`} aria-label={label}>
      <svg viewBox="0 0 36 36" className="ll-ref-donut-svg" aria-hidden="true">
        <circle cx="18" cy="18" r="14" fill="none" className="ll-ref-donut-track" strokeWidth="2.5" />
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          className="ll-ref-donut-value"
          strokeWidth="2.5"
          strokeDasharray={DONUT_C}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span>{score}</span>
    </div>
  );
}

function ReceivedPassports({
  shares,
  tenants,
  loading,
  error,
  onReload,
  onOpenMessages,
  onRequestTab,
}: {
  shares: ReceivedShare[];
  tenants: Tenant[];
  loading: boolean;
  error: string | null;
  onReload: () => void;
  onOpenMessages?: () => void;
  onRequestTab: () => void;
}) {
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [passportShare, setPassportShare] = useState<ReceivedShare | null>(null);
  const [passportSteps, setPassportSteps] = useState<PassportStep[]>([]);
  const [passportLoading, setPassportLoading] = useState(false);
  const [commsShare, setCommsShare] = useState<ReceivedShare | null>(null);

  const filtered = shares.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.tenantName?.toLowerCase().includes(q) ||
      s.tenantEmail?.toLowerCase().includes(q) ||
      s.propertyAddress?.toLowerCase().includes(q)
    );
  });

  const openPassport = async (share: ReceivedShare) => {
    setPassportShare(share);
    if (share.steps && share.steps.length > 0) {
      setPassportSteps(share.steps);
      setPassportLoading(false);
      return;
    }
    setPassportSteps([]);
    setPassportLoading(true);
    try {
      const result = await referencingService.getReferencingStatusByEmail(share.tenantEmail);
      setPassportSteps(derivePassportSteps(result.data?.formData, result.status));
    } catch {
      setPassportSteps(derivePassportSteps(undefined, 'not-started'));
    } finally {
      setPassportLoading(false);
    }
  };

  const openComms = (share: ReceivedShare) => {
    const match = tenants.find(
      (tenant) => tenant.email && share.tenantEmail && tenant.email.toLowerCase() === share.tenantEmail.toLowerCase(),
    );
    setCommsShare({
      ...share,
      phone: share.phone || match?.phone || '',
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="ll-ref-cards">
        {[1, 2, 3].map((i) => (
          <div key={i} className="ll-ref-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="ll-ref-sk" style={{ width: 40, height: 40, borderRadius: 999 }} />
              <div>
                <div className="ll-ref-sk" style={{ width: 140, height: 14, marginBottom: 8 }} />
                <div className="ll-ref-sk" style={{ width: 220, height: 10 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="ll-ref-error">
        <AlertCircle className="w-8 h-8" />
        <p>{error}</p>
        <button type="button" className="ll-ref-btn-ghost" onClick={onReload}>
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="ll-ref-search">
        <Search size={16} />
        <input
          placeholder="Search by tenant name, email or property..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="ll-ref-empty">
          <div className="ll-ref-empty-icon">
            <ShieldCheck size={32} />
          </div>
          <h3>{search ? 'No results match your search' : 'No Received Passports Yet'}</h3>
          <p>
            {search
              ? 'Try a different name, email or address.'
              : 'When prospective tenants share their Proptii Referencing Passports with you, they will appear here with full verification details.'}
          </p>
          {!search ? (
            <button type="button" className="ll-ref-btn-add" onClick={onRequestTab}>
              Request Referencing Now
            </button>
          ) : null}
        </div>
      ) : (
        <div className="ll-ref-cards">
          {filtered.map((share) => {
            const expired = Boolean(share.expiresAt && new Date(share.expiresAt) <= new Date());
            const expanded = expandedIds.has(share.id);
            const score = passportProgress(share);
            return (
              <div key={share.id} className="ll-ref-card">
                <div className="ll-ref-card-main">
                  <div className="ll-ref-person">
                    <span className={`ll-ref-avatar ${avatarTone(share.tenantName || share.tenantEmail)}`}>
                      {initials(share.tenantName || share.tenantEmail)}
                    </span>
                    <div>
                      <div className="ll-ref-person-name">
                        <h3>{share.tenantName || 'Tenant'}</h3>
                        <span className={`ll-ref-badge ${shareBadgeClass(share.status, expired)}`}>
                          {shareBadgeLabel(share.status, expired)}
                        </span>
                      </div>
                      <div className="ll-ref-person-meta">
                        <span>{share.tenantEmail}</span>
                        {share.propertyAddress ? (
                          <>
                            <span>·</span>
                            <span>{share.propertyAddress}</span>
                          </>
                        ) : null}
                        <span>·</span>
                        <span>{formatReceivedAt(share.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ll-ref-card-actions">
                    <PassportDonut
                      score={score}
                      tone={donutTone(score, expired)}
                      label={`Passport progress ${score}`}
                    />
                    <button
                      type="button"
                      className="ll-ref-btn-ghost"
                      onClick={() => openPassport(share)}
                    >
                      <Eye size={14} className="text-sky-600" />
                      View Passport
                    </button>
                    <button
                      type="button"
                      className="ll-ref-btn-ghost"
                      onClick={() => openComms(share)}
                    >
                      <MessageSquare size={14} />
                      Connect and message
                    </button>
                    <button
                      type="button"
                      className="ll-ref-chevron"
                      onClick={() => toggleExpanded(share.id)}
                      aria-label={expanded ? 'Collapse details' : 'Expand details'}
                    >
                      <ChevronDown size={16} style={{ transform: expanded ? 'rotate(180deg)' : undefined }} />
                    </button>
                  </div>
                </div>

                {expanded ? (
                  <div className="ll-ref-checks">
                    <div className="ll-ref-checks-label">
                      {share.checks?.length ? 'Check results' : 'Passport details'}
                    </div>
                    <div className="ll-ref-checks-grid">
                      {share.checks?.length ? (
                        share.checks.map((check) => (
                          <div key={check.label} className="ll-ref-check">
                            <span className={`ll-ref-check-icon ${check.passed ? 'ok' : 'warn'}`}>
                              {check.passed ? <CheckCircle2 size={10} /> : <X size={10} />}
                            </span>
                            {check.label}
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="ll-ref-check">
                            <span className={`ll-ref-check-icon ${share.status === 'viewed' || share.status === 'claimed' ? 'ok' : 'warn'}`}>
                              {share.status === 'viewed' || share.status === 'claimed' ? (
                                <CheckCircle2 size={10} />
                              ) : (
                                <Clock size={10} />
                              )}
                            </span>
                            Status: {shareBadgeLabel(share.status, expired)}
                          </div>
                          <div className="ll-ref-check">
                            <span className={`ll-ref-check-icon ${expired ? 'warn' : 'ok'}`}>
                              {expired ? <X size={10} /> : <CheckCircle2 size={10} />}
                            </span>
                            {expired ? 'Share expired' : 'Share active'}
                          </div>
                          <div className="ll-ref-check">
                            <span className={`ll-ref-check-icon ${share.claimedBy ? 'ok' : 'warn'}`}>
                              {share.claimedBy ? <CheckCircle2 size={10} /> : <MessageSquare size={10} />}
                            </span>
                            {share.claimedBy ? 'Messaging connected' : 'Not yet connected'}
                          </div>
                          <div className="ll-ref-check">
                            <span className="ll-ref-check-icon ok">
                              <MapPin size={10} />
                            </span>
                            {share.propertyAddress || 'No property listed'}
                          </div>
                        </>
                      )}
                    </div>
                    {share.notes ? <p className="ll-ref-quote">&ldquo;{share.notes}&rdquo;</p> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      {passportShare ? (
        <PassportModal
          share={passportShare}
          steps={passportSteps}
          loading={passportLoading}
          onClose={() => setPassportShare(null)}
        />
      ) : null}
      {commsShare ? (
        <CommsModal
          share={commsShare}
          initials={initials(commsShare.tenantName || commsShare.tenantEmail)}
          avatarTone={avatarTone(commsShare.tenantName || commsShare.tenantEmail)}
          onClose={() => setCommsShare(null)}
          onOpenMessages={onOpenMessages}
        />
      ) : null}
    </div>
  );
}

function RequestReferencing({
  tenants,
  userProfile,
  onViewTenant,
  statuses,
  loadingStatuses,
  inviteEmailRef,
}: {
  tenants: Tenant[];
  userProfile: UserProfile | null;
  onViewTenant?: (tenant: Tenant) => void;
  statuses: Map<string, 'not-started' | 'in-progress' | 'complete'>;
  loadingStatuses: boolean;
  inviteEmailRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [search, setSearch] = useState('');
  const [requestStates, setRequestStates] = useState<Record<string, RequestState>>({});
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualProperty, setManualProperty] = useState('');
  const [manualState, setManualState] = useState<RequestState>({ loading: false, success: false, error: null });

  const sendRequest = async (tenantEmail: string, tenantName: string, propertyAddress: string) => {
    setRequestStates((prev) => ({ ...prev, [tenantEmail]: { loading: true, success: false, error: null } }));
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
      setRequestStates((prev) => ({ ...prev, [tenantEmail]: { loading: false, success: true, error: null } }));
    } catch (err: any) {
      setRequestStates((prev) => ({ ...prev, [tenantEmail]: { loading: false, success: false, error: err.message } }));
    }
  };

  const sendManualRequest = async (e?: React.FormEvent) => {
    e?.preventDefault();
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
          tenantEmail: manualEmail.trim(),
          tenantName: manualName.trim() || manualEmail.trim(),
          propertyAddress: manualProperty.trim(),
          landlordName: userProfile?.name || userProfile?.email || 'Your landlord',
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

  const filteredTenants = tenants.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.propertyAddress?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="ll-ref-panel">
        <div className="ll-ref-panel-head">
          <div className="ll-ref-panel-title">
            <div className="ll-ref-panel-icon orange">
              <User size={18} />
            </div>
            <div>
              <h3>Request from any tenant</h3>
              <p>Send a referencing request to a tenant who is not yet in your clients list.</p>
            </div>
          </div>
        </div>
        <form className="ll-ref-form" onSubmit={sendManualRequest}>
          <div className="ll-ref-form-grid">
            <div className="ll-ref-field">
              <label>
                Tenant email <span className="req">*</span>
              </label>
              <div className="ll-ref-field-input">
                <Mail size={16} />
                <input
                  ref={inviteEmailRef}
                  type="email"
                  required
                  placeholder="e.g. tenant@email.com"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="ll-ref-field">
              <label>
                Tenant name <span className="opt">(optional)</span>
              </label>
              <div className="ll-ref-field-input">
                <User size={16} />
                <input
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
              </div>
            </div>
            <div className="ll-ref-field">
              <label>
                Property address <span className="opt">(optional)</span>
              </label>
              <div className="ll-ref-field-input">
                <MapPin size={16} />
                <input
                  type="text"
                  placeholder="e.g. 123 Baker St"
                  value={manualProperty}
                  onChange={(e) => setManualProperty(e.target.value)}
                />
              </div>
            </div>
          </div>

          {manualState.error && (
            <p className="ll-ref-msg error">
              <AlertCircle size={14} /> {manualState.error}
            </p>
          )}
          {manualState.success && (
            <p className="ll-ref-msg ok">
              <CheckCircle2 size={14} /> Request sent — tenant will receive an email with the referencing link.
            </p>
          )}

          <button type="submit" className="ll-ref-btn-send" disabled={!manualEmail.trim() || manualState.loading}>
            {manualState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={16} />}
            Send Request
          </button>
        </form>
      </div>

      <div className="ll-ref-panel">
        <div className="ll-ref-panel-head">
          <div className="ll-ref-panel-title">
            <div className="ll-ref-panel-icon slate">
              <Search size={18} />
            </div>
            <div>
              <h3>Request from existing tenants</h3>
              <p>Tenants already in your clients list. Click &quot;Send Request&quot; to email them a referencing link.</p>
            </div>
          </div>
          <div className="ll-ref-search" style={{ marginBottom: 0, width: '100%', maxWidth: 288 }}>
            <Search size={16} />
            <input
              placeholder="Search tenants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="ll-ref-table-wrap">
          <table className="ll-ref-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Contact</th>
                <th>Property</th>
                <th>Last Activity</th>
                <th className="right">Action</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 ? (
                <tr className="ll-ref-empty-row">
                  <td colSpan={5} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                    No tenants in your clients list yet.
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr className="ll-ref-empty-row">
                  <td colSpan={5} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                    No tenants match &quot;{search}&quot;.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => {
                  const status = statuses.get(tenant.email) || 'not-started';
                  const reqState = requestStates[tenant.email];
                  const isLoading = reqState?.loading;
                  const isSent = reqState?.success;
                  const reqError = reqState?.error;
                  return (
                    <tr key={tenant.id}>
                      <td>
                        <div className="ll-ref-table-tenant">
                          <span className={`ll-ref-avatar ${avatarTone(tenant.name)}`} style={{ width: 32, height: 32, fontSize: 11 }}>
                            {initials(tenant.name)}
                          </span>
                          <span className="ll-ref-table-name">
                            {tenant.name}
                            {loadingStatuses ? (
                              <span className="ll-ref-badge idle" style={{ marginLeft: 8 }}>Loading…</span>
                            ) : (
                              <span className={`ll-ref-badge ${getReferencingBadgeClass(status)}`} style={{ marginLeft: 8 }}>
                                {getReferencingStatusLabel(status)}
                              </span>
                            )}
                          </span>
                        </div>
                        {reqError ? (
                          <p className="ll-ref-msg error" style={{ margin: '4px 0 0 44px' }}>
                            <AlertCircle size={12} /> {reqError}
                          </p>
                        ) : null}
                        {isSent ? (
                          <p className="ll-ref-msg ok" style={{ margin: '4px 0 0 44px' }}>
                            <CheckCircle2 size={12} /> Request sent
                          </p>
                        ) : null}
                      </td>
                      <td>{tenant.email}</td>
                      <td>{tenant.propertyAddress || '—'}</td>
                      <td>{timeAgo(tenant.leaseStart)}</td>
                      <td className="right">
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          {onViewTenant ? (
                            <button type="button" className="ll-ref-btn-ghost" onClick={() => onViewTenant(tenant)}>
                              <Eye size={14} /> View
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className={`ll-ref-btn-row${isSent ? ' done' : ''}`}
                            disabled={isLoading || isSent || status === 'complete'}
                            title={status === 'complete' ? 'Referencing already complete' : undefined}
                            onClick={() => sendRequest(tenant.email, tenant.name, tenant.propertyAddress || '')}
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isSent ? (
                              <><CheckCircle2 size={12} /> Sent</>
                            ) : (
                              <><Send size={12} /> Send Request</>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="ll-ref-table-foot">
          <span>
            Showing {filteredTenants.length} of {tenants.length} existing tenants
          </span>
        </div>
      </div>
    </div>
  );
}

export function ReferencingPage({
  tenants,
  userProfile,
  onViewTenant,
  onOpenMessages,
  onViewInsights,
  onViewSettings,
  onViewNotifications,
}: ReferencingPageProps) {
  const [activeTab, setActiveTab] = useState<'received' | 'request'>('received');
  const [shares, setShares] = useState<ReceivedShare[]>([]);
  const [loadingShares, setLoadingShares] = useState(true);
  const [sharesError, setSharesError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Map<string, 'not-started' | 'in-progress' | 'complete'>>(new Map());
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const inviteEmailRef = useRef<HTMLInputElement>(null);

  const loadShares = async () => {
    const agentPersona = isAgentTestAccount((userProfile as { id?: string } | null)?.id, userProfile?.email);
    if (agentPersona) {
      setShares(getAgentDummyReceivedShares());
      setSharesError(null);
      setLoadingShares(false);
    } else {
      setLoadingShares(true);
      setSharesError(null);
    }
    try {
      const token = await getAccessTokenForApiRequest();
      const res = await fetch(`${API}/referencing/received`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      const live = json.data || [];
      setShares(agentPersona ? mergeById(getAgentDummyReceivedShares(), live) : live);
    } catch {
      if (agentPersona) {
        setShares(getAgentDummyReceivedShares());
        setSharesError(null);
      } else {
        setSharesError('Could not load received referencings.');
      }
    } finally {
      setLoadingShares(false);
    }
  };

  useEffect(() => {
    loadShares();
  }, [userProfile?.email]);

  useEffect(() => {
    if (!tenants.length) {
      setLoadingStatuses(false);
      return;
    }
    const emails = tenants.filter((t) => t.email?.trim()).map((t) => t.email);
    referencingService
      .getReferencingStatusForTenants(emails)
      .then((map) => setStatuses(map))
      .finally(() => setLoadingStatuses(false));
  }, [tenants]);

  const kpis = useMemo(() => {
    const pendingShares = shares.filter((s) => s.status === 'sent' || s.status === 'viewed').length;
    const completedShares = shares.filter((s) => s.status === 'claimed').length;
    let pendingTenants = 0;
    let completedTenants = 0;
    statuses.forEach((status) => {
      if (status === 'in-progress') pendingTenants += 1;
      if (status === 'complete') completedTenants += 1;
    });
    return {
      sent: shares.length + pendingTenants + completedTenants,
      pending: pendingShares + pendingTenants,
      completed: completedShares + completedTenants,
    };
  }, [shares, statuses]);

  const openRequestTab = () => {
    setActiveTab('request');
    setTimeout(() => inviteEmailRef.current?.focus(), 50);
  };

  return (
    <div className="ll-ref">
      <header className="ll-ref-header">
        <div className="ll-ref-inner ll-ref-header-inner">
          <div>
            <h1>Referencing</h1>
            <p>View passports tenants have shared with you, or request referencing from a tenant.</p>
          </div>
          <div className="ll-ref-header-actions">
            {onViewSettings && (
              <button type="button" className="ll-ref-header-icon" title="Referencing settings" onClick={onViewSettings}>
                <Settings size={18} />
              </button>
            )}
            {onViewNotifications && (
              <button type="button" className="ll-ref-header-icon" title="Notifications" onClick={onViewNotifications}>
                <Bell size={18} />
                <span className="ll-ref-header-dot" />
              </button>
            )}
            {onViewInsights && (
              <button type="button" className="ll-ref-btn-insights" onClick={onViewInsights}>
                <span className="ll-ref-insights-icon">
                  <Sparkles size={12} />
                </span>
                Portfolio Insights
              </button>
            )}
            <button type="button" className="ll-ref-btn-add" onClick={openRequestTab}>
              <Plus size={16} strokeWidth={2.5} />
              Add Tenant
            </button>
          </div>
        </div>
      </header>

      <div className="ll-ref-inner ll-ref-body">
        <section className="ll-ref-kpi-grid">
          <article className="ll-ref-kpi">
            <div className="ll-ref-kpi-top">
              <div className="ll-ref-kpi-icon indigo">
                <Send size={16} />
              </div>
            </div>
            <div className="ll-ref-kpi-label">Sent Requests</div>
            <div className="ll-ref-kpi-value">{kpis.sent}</div>
          </article>
          <article className="ll-ref-kpi">
            <div className="ll-ref-kpi-top">
              <div className="ll-ref-kpi-icon amber">
                <Clock size={16} />
              </div>
              <span className="ll-ref-kpi-chip amber">Pending</span>
            </div>
            <div className="ll-ref-kpi-label">Pending Checks</div>
            <div className="ll-ref-kpi-value">{kpis.pending}</div>
          </article>
          <article className="ll-ref-kpi">
            <div className="ll-ref-kpi-top">
              <div className="ll-ref-kpi-icon green">
                <CheckCircle2 size={16} />
              </div>
              <span className="ll-ref-kpi-chip green">Completed</span>
            </div>
            <div className="ll-ref-kpi-label">Completed Checks</div>
            <div className="ll-ref-kpi-value">{kpis.completed}</div>
          </article>
        </section>

        <div className="ll-ref-tabs">
          <button
            type="button"
            className={`ll-ref-tab${activeTab === 'received' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('received')}
          >
            <ShieldCheck size={16} />
            Received Passports
            <span className="ll-ref-tab-count">{shares.length}</span>
          </button>
          <button
            type="button"
            className={`ll-ref-tab${activeTab === 'request' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('request')}
          >
            <Send size={16} />
            Request Referencing
            <span className="ll-ref-tab-count">{tenants.length}</span>
          </button>
        </div>

        {activeTab === 'received' ? (
          <ReceivedPassports
            shares={shares}
            tenants={tenants}
            loading={loadingShares}
            error={sharesError}
            onReload={loadShares}
            onOpenMessages={onOpenMessages}
            onRequestTab={openRequestTab}
          />
        ) : (
          <RequestReferencing
            tenants={tenants}
            userProfile={userProfile}
            onViewTenant={onViewTenant}
            statuses={statuses}
            loadingStatuses={loadingStatuses}
            inviteEmailRef={inviteEmailRef}
          />
        )}
      </div>
    </div>
  );
}
