import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  invitationService,
  ValidatedInvitation,
} from '../landlord_agent/src/services/invitationService';
import {
  Home,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  MessageSquare,
  FileText,
  ShieldCheck,
  Calendar,
  PoundSterling,
} from 'lucide-react';

const PRIMARY_BLUE = '#136C9E';
const PRIMARY_ORANGE = '#DC5F12';

export const TenantInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, login, user, patchUser } = useAuth();

  const token = searchParams.get('token') || '';
  const fallbackPropertyId = searchParams.get('propertyId') || '';
  const fallbackLandlordEmail = searchParams.get('landlordEmail') || '';
  const fallbackLandlordId = searchParams.get('landlordId') || '';

  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<ValidatedInvitation | null>(null);

  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimedConversationId, setClaimedConversationId] = useState<string | null>(null);
  const claimAttemptedRef = useRef(false);

  // ── Step 1: Validate Invitation Token ─────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function validate() {
      // If we have a token, validate via backend
      if (token) {
        try {
          const res = await invitationService.validateInvitation(token);
          if (!isMounted) return;

          if (res.valid && res.invitation) {
            setInvitation(res.invitation);
          } else {
            setValidationError(res.message || 'This invitation link is invalid or has expired.');
          }
        } catch {
          if (!isMounted) return;
          setValidationError('Could not verify invitation. Please check your connection.');
        } finally {
          if (isMounted) setIsValidating(false);
        }
        return;
      }

      // Backward compatibility fallback for legacy links without a token
      if (fallbackPropertyId) {
        if (!isMounted) return;
        setInvitation({
          id: 'legacy',
          token: '',
          propertyId: fallbackPropertyId,
          propertyAddress: 'Your Invited Property',
          landlordEmail: fallbackLandlordEmail,
        });
        setIsValidating(false);
        return;
      }

      if (isMounted) {
        setValidationError('No invitation token was provided in the link.');
        setIsValidating(false);
      }
    }

    void validate();

    return () => {
      isMounted = false;
    };
  }, [token, fallbackPropertyId, fallbackLandlordEmail]);

  // ── Step 2: Auto-claim once authenticated ────────────────────────────────────
  useEffect(() => {
    if (authLoading || !isAuthenticated || !invitation || isClaiming || claimSuccess || claimAttemptedRef.current) {
      return;
    }

    // Only claim if we have a real token
    if (!token) {
      // Legacy link without token: ensure user has tenant role and navigate
      patchUser({ roles: ['tenant'], roleResolved: true });
      setClaimSuccess(true);
      return;
    }

    claimAttemptedRef.current = true;
    setIsClaiming(true);
    setClaimError(null);

    async function performClaim() {
      try {
        const res = await invitationService.claimInvitation(token);
        if (res.success) {
          if (res.conversationId) {
            setClaimedConversationId(res.conversationId);
          }
          patchUser({ roles: ['tenant'], roleResolved: true });
          setClaimSuccess(true);
        } else {
          setClaimError(res.message || 'Failed to claim invitation.');
        }
      } catch (err: any) {
        setClaimError(err?.message || 'Something went wrong while linking your account.');
      } finally {
        setIsClaiming(false);
      }
    }

    void performClaim();
  }, [isAuthenticated, authLoading, invitation, token, isClaiming, claimSuccess, patchUser]);

  // ── Auth Handlers ────────────────────────────────────────────────────────────
  const handleGoogleAuth = async () => {
    const returnUrl = window.location.pathname + window.location.search;
    sessionStorage.setItem('redirectAfterLogin', returnUrl);
    if (token) sessionStorage.setItem('pending_invite_token', token);
    try {
      await login();
    } catch (e) {
      console.error('Google sign-in error:', e);
    }
  };

  const handleEmailAuth = () => {
    const returnUrl = window.location.pathname + window.location.search;
    sessionStorage.setItem('redirectAfterLogin', returnUrl);
    if (token) sessionStorage.setItem('pending_invite_token', token);
    navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
  };

  // ── Render: Validating State ─────────────────────────────────────────────────
  if (isValidating || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-orange-50 p-4">
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl flex flex-col items-center max-w-sm w-full border border-gray-100">
          <Loader2 className="w-10 h-10 animate-spin text-[#136C9E] mb-4" />
          <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Archivo, sans-serif' }}>
            Verifying your invitation...
          </h2>
          <p className="text-xs text-gray-500 mt-1">Checking with Proptii servers</p>
        </div>
      </div>
    );
  }

  // ── Render: Invalid or Expired State ─────────────────────────────────────────
  if (validationError || !invitation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-orange-50 p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full border border-gray-100 text-center">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Archivo, sans-serif' }}>
            Invitation Unavailable
          </h1>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            {validationError || 'This invitation link is invalid or has expired. Please contact your landlord for a new link.'}
          </p>
          <div className="space-y-3">
            <Link
              to="/login"
              className="block w-full py-3 rounded-xl bg-[#136C9E] text-white font-semibold text-sm shadow-md hover:bg-[#10567e] transition-colors"
            >
              Sign In to Existing Account
            </Link>
            <Link
              to="/"
              className="block w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Claim Success / Connected State ──────────────────────────────────
  if (claimSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-orange-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 max-w-lg w-full border border-gray-100 text-center animate-fade-in">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <CheckCircle className="w-10 h-10" />
          </div>
          <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
            Account Connected
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Archivo, sans-serif' }}>
            Welcome to Your New Home!
          </h1>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            You are now connected as the official tenant of{' '}
            <strong className="text-gray-900 font-semibold">{invitation.propertyAddress}</strong>.
          </p>

          {/* Quick Action Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
            <Link
              to="/dashboard"
              className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-[#136C9E] transition-all group flex flex-col justify-between"
            >
              <div>
                <Home className="w-5 h-5 text-[#136C9E] mb-2" />
                <p className="font-semibold text-sm text-gray-800 group-hover:text-[#136C9E]">My Tenancy</p>
                <p className="text-xs text-gray-500 mt-0.5">View rent, property details & documents</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#136C9E] mt-3 self-end" />
            </Link>

            <Link
              to={claimedConversationId ? `/dashboard/messages?conv=${claimedConversationId}` : '/dashboard/messages'}
              state={claimedConversationId ? { conversationId: claimedConversationId } : undefined}
              className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-orange-50 hover:border-[#DC5F12] transition-all group flex flex-col justify-between"
            >
              <div>
                <MessageSquare className="w-5 h-5 text-[#DC5F12] mb-2" />
                <p className="font-semibold text-sm text-gray-800 group-hover:text-[#DC5F12]">Chat with Landlord</p>
                <p className="text-xs text-gray-500 mt-0.5">Send a message to your property manager</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#DC5F12] mt-3 self-end" />
            </Link>

            <Link
              to="/dashboard/tenant-contracts"
              className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-purple-50 hover:border-purple-600 transition-all group flex flex-col justify-between"
            >
              <div>
                <FileText className="w-5 h-5 text-purple-600 mb-2" />
                <p className="font-semibold text-sm text-gray-800 group-hover:text-purple-600">Agreements</p>
                <p className="text-xs text-gray-500 mt-0.5">Review your tenancy contract draft</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 mt-3 self-end" />
            </Link>

            <Link
              to="/dashboard/tenant-referencing"
              className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-600 transition-all group flex flex-col justify-between"
            >
              <div>
                <ShieldCheck className="w-5 h-5 text-emerald-600 mb-2" />
                <p className="font-semibold text-sm text-gray-800 group-hover:text-emerald-600">Renter Passport</p>
                <p className="text-xs text-gray-500 mt-0.5">Complete referencing if required</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 mt-3 self-end" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard', { replace: true })}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm shadow-lg transition-transform active:scale-[0.99] flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${PRIMARY_BLUE}, #1a87c4)` }}
          >
            Go to Tenant Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Authenticated Claim In-Progress ──────────────────────────────────
  if (isAuthenticated && isClaiming) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-orange-50 p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full border border-gray-100 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#136C9E] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Archivo, sans-serif' }}>
            Connecting Your Tenancy...
          </h2>
          <p className="text-xs text-gray-500 mt-1">Linking your account to {invitation.propertyAddress}</p>
        </div>
      </div>
    );
  }

  // ── Render: Claim Error State ────────────────────────────────────────────────
  if (isAuthenticated && claimError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-orange-50 p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full border border-gray-100 text-center">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Archivo, sans-serif' }}>
            Claim Notice
          </h1>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">{claimError}</p>
          <button
            type="button"
            onClick={() => {
              claimAttemptedRef.current = false;
              setIsClaiming(false);
              setClaimError(null);
            }}
            className="w-full py-3 rounded-xl bg-[#136C9E] text-white font-semibold text-sm shadow hover:bg-[#10567e] transition-colors"
          >
            Retry Connecting
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Unauthenticated Invitee Landing Card ─────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-slate-50 to-orange-50 relative overflow-hidden">
      {/* Decorative Blur Circles */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#136C9E]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#DC5F12]/10 blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <Link to="/" className="flex items-center gap-2">
          <img src="/images/Logo-only.png" alt="Proptii Logo" className="h-9 w-auto object-contain" />
          <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Archivo, sans-serif' }}>
            proptii
          </span>
        </Link>
        <button
          type="button"
          onClick={handleEmailAuth}
          className="text-xs font-semibold text-[#136C9E] hover:underline"
        >
          Already have an account? Sign In
        </button>
      </header>

      {/* Main Invitation Dossier Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_12px_45px_rgba(0,0,0,0.08)] border border-white p-6 sm:p-10">
          {/* Badge */}
          <div className="flex justify-center mb-4">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase"
              style={{ backgroundColor: '#E8F4F8', color: PRIMARY_BLUE }}
            >
              <Home className="w-3.5 h-3.5" /> Tenant Invitation
            </span>
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Archivo, sans-serif' }}>
              You've Been Invited
            </h1>
            <p className="text-sm text-gray-600">
              Your landlord{' '}
              <strong className="text-gray-800">
                {invitation.landlordName || invitation.landlordEmail || 'Your landlord'}
              </strong>{' '}
              invited you to join as a tenant on Proptii.
            </p>
          </div>

          {/* Tenancy Dossier Box */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-5 mb-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-[#136C9E]">
                <Home className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Property</span>
                <p className="text-sm font-semibold text-gray-900 truncate">{invitation.propertyAddress}</p>
              </div>
            </div>

            {(invitation.rentAmount !== undefined && invitation.rentAmount !== null) || invitation.leaseStart ? (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/60">
                {invitation.rentAmount !== undefined && invitation.rentAmount !== null && (
                  <div className="flex items-center gap-2">
                    <PoundSterling className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Agreed Rent</p>
                      <p className="text-xs font-bold text-gray-800">£{invitation.rentAmount.toLocaleString()} / mo</p>
                    </div>
                  </div>
                )}
                {invitation.leaseStart && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Move-In Date</p>
                      <p className="text-xs font-bold text-gray-800">
                        {new Date(invitation.leaseStart).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {invitation.customMessage && (
              <div className="pt-2 border-t border-gray-200/60 text-xs text-gray-600 italic">
                "{invitation.customMessage}"
              </div>
            )}
          </div>

          {/* Call to Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full py-3.5 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm shadow-sm flex items-center justify-center gap-3 transition-colors active:scale-[0.99]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={handleEmailAuth}
              className="w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm shadow-md transition-transform active:scale-[0.99] flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${PRIMARY_BLUE}, #1a87c4)` }}
            >
              <Mail className="w-4 h-4" />
              <span>Create Account or Sign In</span>
            </button>
          </div>

          {/* Privacy / Security Notice */}
          <p className="text-[11px] text-gray-400 text-center mt-6">
            By accepting, your Proptii profile will link directly to this tenancy and property manager.
          </p>
        </div>
      </main>
    </div>
  );
};

export default TenantInvitePage;
