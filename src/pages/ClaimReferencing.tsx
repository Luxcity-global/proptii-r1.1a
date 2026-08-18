import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getResolvedApiBaseUrl } from '../config/apiBaseUrl';
import { getAccessTokenForApiRequest } from '../services/msalAccessToken';
import { Loader2, AlertTriangle, Check, Home, ShieldCheck } from 'lucide-react';

const API = getResolvedApiBaseUrl();

interface ClaimMeta {
  tenantName: string;
  recipientName: string;
  propertyAddress: string;
  expiresAt: string;
}

const ClaimReferencing: React.FC = () => {
  const [searchParams] = useSearchParams();
  const claimToken = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, login, user } = useAuth();

  const [validating, setValidating]   = useState(true);
  const [invalid, setInvalid]         = useState(false);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [meta, setMeta]               = useState<ClaimMeta | null>(null);
  const [claiming, setClaiming]       = useState(false);
  const [claimed, setClaimed]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [loginBusy, setLoginBusy]     = useState(false);

  // ── Step 1: validate the claim token (no auth needed) ─────────────────────
  useEffect(() => {
    if (!claimToken) { setInvalid(true); setValidating(false); return; }

    fetch(`${API}/referencing/shares/validate-claim?token=${encodeURIComponent(claimToken)}`)
      .then(r => r.json())
      .then(json => {
        if (!json.valid) {
          if (json.alreadyClaimed) setAlreadyClaimed(true);
          else setInvalid(true);
        } else {
          setMeta({
            tenantName:      json.tenantName      || 'A tenant',
            recipientName:   json.recipientName   || '',
            propertyAddress: json.propertyAddress || '',
            expiresAt:       json.expiresAt       || '',
          });
        }
      })
      .catch(() => setInvalid(true))
      .finally(() => setValidating(false));
  }, [claimToken]);

  // ── Step 2: once authenticated, auto-claim ─────────────────────────────────
  useEffect(() => {
    if (authLoading || !isAuthenticated || !meta || claiming || claimed) return;

    const doClaim = async () => {
      setClaiming(true);
      setError(null);
      try {
        const token = await getAccessTokenForApiRequest();
        const res = await fetch(`${API}/referencing/shares/claim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ claimToken }),
        });
        const json = await res.json();

        if (json.success) {
          setClaimed(true);
          // Redirect to landlord messages with the new conversation
          setTimeout(() => {
            navigate('/landlord/messages', {
              state: { conversationId: json.conversationId },
            });
          }, 2500);
        } else {
          setError(json.error || 'Failed to claim. Please try again.');
        }
      } catch (err: any) {
        setError(err?.message || 'Something went wrong. Please try again.');
      } finally {
        setClaiming(false);
      }
    };

    doClaim();
  }, [isAuthenticated, authLoading, meta, claiming, claimed]);

  const handleLogin = async () => {
    setLoginBusy(true);
    setError(null);
    // Store this URL so AuthRedirectHandler brings back after login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
    try {
      await login('google');
    } catch {
      setError('Sign-in was cancelled or failed. Please try again.');
    } finally {
      setLoginBusy(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (validating || authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#136C9E]" />
      </div>
    );
  }

  if (invalid || alreadyClaimed) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {alreadyClaimed ? 'Invitation already used' : 'Invalid invitation link'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {alreadyClaimed
              ? 'This referencing invitation has already been claimed. Log in to your Proptii account to access it.'
              : 'This invitation link is invalid or has expired. Please contact the tenant to request a new one.'}
          </p>
          <button
            onClick={() => navigate(alreadyClaimed ? '/landlord' : '/')}
            className="w-full py-3 rounded-xl bg-[#136C9E] text-white font-semibold text-sm hover:bg-[#0F5A82] transition-colors"
          >
            {alreadyClaimed ? 'Go to Dashboard' : 'Go to Proptii'}
          </button>
        </div>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">All set!</h2>
          <p className="text-sm text-gray-500 mb-2">
            You now have access to <strong>{meta?.tenantName}</strong>'s referencing passport.
            A conversation has been created in your inbox.
          </p>
          <p className="text-xs text-gray-400">Redirecting to your messages…</p>
        </div>
      </div>
    );
  }

  // ── Claiming in progress (just logged in) ────────────────────────────────
  if (isAuthenticated && claiming) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#136C9E] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900">Setting up your access…</h2>
          <p className="text-sm text-gray-500 mt-1">Creating your landlord account and conversation.</p>
        </div>
      </div>
    );
  }

  // ── Pre-login: show invitation details + Google sign-up ─────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#136C9E] to-[#0D4E73] px-8 py-7 text-white text-center">
          <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold">Referencing Passport Invitation</h1>
          <p className="text-blue-100 text-sm mt-1">from Proptii</p>
        </div>

        <div className="px-8 py-7">
          {/* Invitation summary */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 space-y-2">
            <div className="flex items-start gap-2">
              <Home className="w-4 h-4 text-[#136C9E] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Tenant</p>
                <p className="text-sm font-bold text-gray-900">{meta?.tenantName}</p>
              </div>
            </div>
            {meta?.propertyAddress && (
              <div className="flex items-start gap-2">
                <Home className="w-4 h-4 text-[#136C9E] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Property</p>
                  <p className="text-sm font-bold text-gray-900">{meta.propertyAddress}</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-1">
            <strong>{meta?.tenantName}</strong> has shared their referencing passport with you.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Create a free Proptii account to view their full passport, message them, and manage their application — all in one place.
          </p>

          {/* Benefits list */}
          <ul className="space-y-2 mb-6">
            {[
              'View the full referencing passport',
              'Message the tenant directly',
              'Track and manage the application',
              'Add more properties & tenants anytime',
            ].map(b => (
              <li key={b} className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" strokeWidth={3} />
                {b}
              </li>
            ))}
          </ul>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Google sign-up */}
          <button
            onClick={handleLogin}
            disabled={loginBusy}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-[#136C9E] text-white font-bold text-sm hover:bg-[#0F5A82] transition-colors shadow-md disabled:opacity-60"
          >
            {loginBusy ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9c0-.4 0-.8 0-1.4z" />
                <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
              </svg>
            )}
            {loginBusy ? 'Connecting…' : 'Create Account with Google'}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Already have an account?{' '}
            <button
              onClick={handleLogin}
              className="text-[#136C9E] font-semibold hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClaimReferencing;
