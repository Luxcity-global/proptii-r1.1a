import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Briefcase, Home, PoundSterling, Users,
  CheckCircle, AlertTriangle, Loader2, Copy, Check,
  ArrowLeft, ShieldCheck, ExternalLink,
} from 'lucide-react';
import { getResolvedApiBaseUrl } from '../config/apiBaseUrl';
import { useAuth } from '../contexts/AuthContext';

const API = getResolvedApiBaseUrl();

interface ShareMeta {
  tenantName: string;
  recipientName: string;
  propertyAddress: string;
  notes: string;
  status: string;
  expiresAt: string;
  claimToken: string;
}

interface PassportData {
  identity?: any;
  employment?: any;
  residential?: any;
  financial?: any;
  guarantor?: any;
}

// ─── tiny helpers ──────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value?: string }) {
  if (!value || value === '[document uploaded]') return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  );
}

function SectionCard({
  icon, title, step, children, filled,
}: {
  icon: React.ReactNode;
  title: string;
  step: number;
  children: React.ReactNode;
  filled: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">{title}</p>
            <p className="text-[11px] text-gray-400">Step {step} of 5</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${filled ? 'bg-green-100 text-green-700' : 'bg-orange-50 text-orange-600'}`}>
          {filled ? 'Filled' : 'Not filled'}
        </span>
      </div>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

const ReferencingView: React.FC = () => {
  const { viewToken } = useParams<{ viewToken: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [loading, setLoading]     = useState(true);
  const [expired, setExpired]     = useState(false);
  const [notFound, setNotFound]   = useState(false);
  const [share, setShare]         = useState<ShareMeta | null>(null);
  const [form, setForm]           = useState<PassportData | null>(null);
  const [copied, setCopied]       = useState(false);
  const [claiming, setClaiming]   = useState(false);

  useEffect(() => {
    if (!viewToken) { setNotFound(true); setLoading(false); return; }

    fetch(`${API}/referencing/public/${viewToken}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success || json.expired) { setExpired(true); return; }
        setShare(json.share);
        setForm(json.formData || {});
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [viewToken]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Logged-in landlord: go straight to claim (creates conversation) then redirect to messages
  const handleClaimAsLoggedIn = async () => {
    if (!share?.claimToken) return;
    setClaiming(true);
    try {
      const token = localStorage.getItem('mock_token') ||
        (await import('../services/msalAccessToken').then(m => m.getAccessTokenForApiRequest()));

      const res = await fetch(`${API}/referencing/shares/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ claimToken: share.claimToken }),
      });
      const json = await res.json();
      if (json.success && json.conversationId) {
        navigate('/landlord/messages', { state: { conversationId: json.conversationId } });
      } else {
        navigate('/landlord');
      }
    } catch {
      navigate('/landlord');
    } finally {
      setClaiming(false);
    }
  };

  // ── Render states ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#136C9E]" />
      </div>
    );
  }

  if (expired || notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {expired ? 'This link has expired' : 'Link not found'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {expired
              ? 'Referencing passport links are valid for 30 days. Please contact the tenant to request a new link.'
              : 'This referencing link is invalid or has already been revoked.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl bg-[#136C9E] text-white font-semibold text-sm hover:bg-[#0F5A82] transition-colors"
          >
            Go to Proptii
          </button>
        </div>
      </div>
    );
  }

  const id   = form?.identity   || {};
  const emp  = form?.employment  || {};
  const res  = form?.residential || {};
  const fin  = form?.financial   || {};
  const guar = form?.guarantor   || {};

  const isLandlordLoggedIn = isAuthenticated && (user?.roles?.includes('landlord') || user?.roles?.includes('agent'));

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#136C9E]" />
              <span className="font-bold text-gray-900 text-sm">Proptii Referencing Passport</span>
            </div>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Tenant intro card */}
        <div className="bg-gradient-to-r from-[#136C9E] to-[#0D4E73] rounded-2xl p-6 text-white">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Referencing Passport</p>
          <h1 className="text-2xl font-bold mb-1">{share?.tenantName || 'Tenant'}</h1>
          {share?.propertyAddress && (
            <p className="text-blue-100 text-sm">Applying for: <span className="font-semibold text-white">{share.propertyAddress}</span></p>
          )}
          {share?.notes && (
            <div className="mt-3 bg-white/10 rounded-xl p-3 text-sm text-blue-50 italic">
              "{share.notes}"
            </div>
          )}
          <div className="mt-4 flex items-center gap-1.5 text-xs text-blue-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Verified via Proptii · expires {share?.expiresAt ? new Date(share.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </div>
        </div>

        {/* CTA banner — shown when not logged in as landlord */}
        {!isLandlordLoggedIn && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-gray-900 text-sm">Want to manage this tenant?</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Create a free Proptii account to message {share?.tenantName || 'the tenant'}, manage their application, and track everything in one place.
              </p>
            </div>
            <button
              onClick={() => navigate(`/claim-referencing?token=${share?.claimToken}`)}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#DC5F12] text-white text-sm font-semibold hover:bg-[#C45210] transition-colors shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Create Account
            </button>
          </div>
        )}

        {/* CTA banner — logged in landlord */}
        {isLandlordLoggedIn && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-gray-900 text-sm">You're signed in as a landlord</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Start a conversation with {share?.tenantName || 'the tenant'} and manage their application from your dashboard.
              </p>
            </div>
            <button
              onClick={handleClaimAsLoggedIn}
              disabled={claiming}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#136C9E] text-white text-sm font-semibold hover:bg-[#0F5A82] transition-colors shadow-sm disabled:opacity-60"
            >
              {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              {claiming ? 'Opening…' : 'Open in Dashboard'}
            </button>
          </div>
        )}

        {/* Passport sections */}
        <SectionCard icon={<User className="w-5 h-5 text-blue-600" />} title="Identity" step={1} filled={!!id.firstName}>
          <Field label="Full Name"      value={`${id.firstName || ''} ${id.lastName || ''}`.trim()} />
          <Field label="Email"          value={id.email} />
          <Field label="Phone"          value={id.phoneNumber} />
          <Field label="Date of Birth"  value={id.dateOfBirth} />
          <Field label="Nationality"    value={id.nationality} />
          {id.identityProof === '[document uploaded]' && (
            <div className="col-span-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              <CheckCircle className="w-3.5 h-3.5" /> Passport / ID document uploaded
            </div>
          )}
        </SectionCard>

        <SectionCard icon={<Briefcase className="w-5 h-5 text-blue-600" />} title="Employment" step={2} filled={!!emp.employmentStatus}>
          <Field label="Employment Status" value={emp.employmentStatus} />
          <Field label="Job Position"      value={emp.jobPosition} />
          <Field label="Company"           value={emp.companyDetails} />
          <Field label="Length"            value={emp.lengthOfEmployment} />
          <Field label="Referee"           value={emp.referenceFullName} />
          <Field label="Referee Email"     value={emp.referenceEmail} />
          <Field label="Referee Phone"     value={emp.referencePhone} />
          {emp.proofDocument === '[document uploaded]' && (
            <div className="col-span-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              <CheckCircle className="w-3.5 h-3.5" /> Proof of employment uploaded
            </div>
          )}
        </SectionCard>

        <SectionCard icon={<Home className="w-5 h-5 text-orange-500" />} title="Residential" step={3} filled={!!res.currentAddress}>
          <Field label="Current Address"      value={res.currentAddress} />
          <Field label="Duration"             value={res.durationAtCurrentAddress} />
          <Field label="Previous Address"     value={res.previousAddress} />
          <Field label="Previous Duration"    value={res.durationAtPreviousAddress} />
          <Field label="Reason for Leaving"   value={res.reasonForLeaving} />
          {res.proofDocument === '[document uploaded]' && (
            <div className="col-span-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              <CheckCircle className="w-3.5 h-3.5" /> Proof of address uploaded
            </div>
          )}
        </SectionCard>

        <SectionCard icon={<PoundSterling className="w-5 h-5 text-orange-500" />} title="Financial" step={4} filled={!!fin.monthlyIncome}>
          <Field label="Monthly Income"    value={fin.monthlyIncome ? `£${fin.monthlyIncome}` : undefined} />
          <Field label="Proof Type"        value={fin.proofOfIncomeType} />
          {fin.useOpenBanking && (
            <div className="col-span-2 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
              <CheckCircle className="w-3.5 h-3.5" /> Open Banking connected
            </div>
          )}
          {fin.proofOfIncomeDocument === '[document uploaded]' && (
            <div className="col-span-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              <CheckCircle className="w-3.5 h-3.5" /> Proof of income uploaded
            </div>
          )}
        </SectionCard>

        <SectionCard icon={<Users className="w-5 h-5 text-amber-500" />} title="Guarantor" step={5} filled={!!guar.firstName}>
          <Field label="Name"    value={`${guar.firstName || ''} ${guar.lastName || ''}`.trim()} />
          <Field label="Email"   value={guar.email} />
          <Field label="Phone"   value={guar.phoneNumber} />
          <Field label="Address" value={guar.address} />
          {guar.employmentStatus && <Field label="Employment" value={guar.employmentStatus} />}
          {guar.annualIncome && <Field label="Annual Income" value={`£${guar.annualIncome}`} />}
          {guar.relationship && <Field label="Relationship" value={guar.relationship} />}
          {guar.verifiedViaLink && (
            <div className="col-span-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              <CheckCircle className="w-3.5 h-3.5" /> Verified by Guarantor via Direct Link
            </div>
          )}
          {guar.identityDocument === '[document uploaded]' && (
            <div className="col-span-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              <CheckCircle className="w-3.5 h-3.5" /> Guarantor ID uploaded
            </div>
          )}
        </SectionCard>

        {/* Bottom CTA */}
        {!isLandlordLoggedIn && (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-3">
              Manage {share?.tenantName || 'this tenant'}'s application end-to-end with a free Proptii account.
            </p>
            <button
              onClick={() => navigate(`/claim-referencing?token=${share?.claimToken}`)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#DC5F12] text-white text-sm font-bold hover:bg-[#C45210] transition-colors shadow-md"
            >
              Create Free Landlord Account
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ReferencingView;
