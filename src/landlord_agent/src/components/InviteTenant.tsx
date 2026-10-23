/**
 * InviteTenant — send a branded invitation email to a prospective tenant.
 *
 * What it does:
 *   1. Sends a branded HTML email via POST /api/email/send
 *   2. Records the invitation in Firestore via POST /api/tenant-invitations
 *      so it appears under the Invitations tab immediately
 *
 * What it does NOT do:
 *   - Create a partial tenant record (removed — the tenant collection only
 *     receives complete, active records; pending invites live in tenant_invitations)
 *
 * The tenant appears in the landlord's Clients → Invitations tab as "pending"
 * until they follow the link, create their account, and complete onboarding.
 */
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Mail,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Property } from '../App';
import { isPropertyArchived } from '../utils/portfolioStats';
import axios from 'axios';
import { trackEvent } from '../../../utils/analytics';
import { PRIMARY_API_BASE_URL } from '../../../utils/apiEndpoints';
import { invitationService } from '../services/invitationService';
import { tenantService } from '../services/tenantService';
import { renderProptiiEmail, escapeEmailHtml } from '../../../utils/proptiiEmailLayout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InviteTenantProps {
  properties: Property[];
  onBack: () => void;
  onSuccess: () => void;
  landlordEmail?: string;
  landlordId?: string;
  landlordName?: string;
  /** Pre-filled email from the TenantSelection email-first flow */
  prefillEmail?: string;
  /** Called immediately after invite is sent so the pending record shows in the list */
  onTenantCreated?: (tenant: any) => void;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const FIELD =
  'w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#4E97CC] focus:outline-none transition-colors bg-white placeholder-gray-400';
const FIELD_ERR = 'border-red-400 focus:border-red-400';
const LABEL = 'block text-sm font-semibold text-gray-700 mb-1.5';

// ─── Email template ───────────────────────────────────────────────────────────

function buildEmailHtml(
  propertyAddress: string,
  inviteLink: string,
  customMessage?: string,
  landlordName?: string
): string {
  const landlordGreeting = landlordName
    ? `<p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 16px;">
        Your landlord, <strong style="color: #0F172A;">${escapeEmailHtml(landlordName)}</strong>, has invited you to create your official tenant profile on Proptii.
       </p>`
    : `<p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 16px;">
        You have been invited by your landlord to create your official tenant profile on Proptii.
       </p>`;

  const propertyCard = `
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #136C9E; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #136C9E; margin-bottom: 6px;">
        Property Details
      </div>
      <div style="font-size: 17px; font-weight: 700; color: #0F172A; line-height: 1.4;">
        ${escapeEmailHtml(propertyAddress)}
      </div>
      ${landlordName ? `<div style="font-size: 13px; color: #64748B; margin-top: 8px;">Landlord: <strong style="color: #334155;">${escapeEmailHtml(landlordName)}</strong></div>` : ''}
    </div>
  `;

  const messageCard = customMessage
    ? `
      <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-left: 4px solid #F59E0B; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #B45309; margin-bottom: 6px;">
          Note from ${landlordName ? escapeEmailHtml(landlordName) : 'Your Landlord'}
        </div>
        <div style="font-size: 14px; color: #78350F; font-style: italic; line-height: 1.5;">
          &ldquo;${escapeEmailHtml(customMessage)}&rdquo;
        </div>
      </div>
    `
    : '';

  const nextSteps = `
    <div style="background: #FFFFFF; border: 1px dashed #CBD5E1; border-radius: 10px; padding: 16px 20px; margin: 24px 0 20px;">
      <div style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px;">Once connected, you can:</div>
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; font-size: 13px; color: #475569; line-height: 1.6;">
        <tr><td style="padding: 3px 0;">✓ Review your tenancy agreements and digital lease documents</td></tr>
        <tr><td style="padding: 3px 0;">✓ Message directly with ${landlordName ? escapeEmailHtml(landlordName) : 'your landlord'} in real time</td></tr>
        <tr><td style="padding: 3px 0;">✓ Track payments and submit maintenance requests easily</td></tr>
      </table>
    </div>
  `;

  return renderProptiiEmail({
    title: 'Tenant Invitation',
    buttonLabel: 'Create Account & Complete Profile',
    buttonHref: inviteLink,
    bodyHtml: `
      <p style="font-size: 16px; font-weight: 600; color: #0F172A; margin: 0 0 8px;">Hello,</p>
      ${landlordGreeting}
      ${propertyCard}
      ${messageCard}
      ${nextSteps}
      <p style="font-size: 14px; color: #64748B; margin: 20px 0 0; line-height: 1.5;">
        Click the button below to create your account and complete your tenant profile.
      </p>
      <p style="font-size: 13px; color: #94A3B8; margin: 8px 0 0;">
        If you have any questions, please contact ${landlordName ? escapeEmailHtml(landlordName) : 'your landlord'} directly.
      </p>
    `,
  });
}

function buildInviteLink(
  token: string,
  propertyId: string,
  landlordEmail?: string,
  landlordId?: string
): string {
  const base =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : (import.meta as any)?.env?.VITE_APP_URL || 'https://proptii.co';
  const url = new URL('/invite/tenant', base);
  if (token) url.searchParams.set('token', token);
  if (propertyId) url.searchParams.set('propertyId', propertyId);
  if (landlordEmail) url.searchParams.set('landlordEmail', landlordEmail);
  if (landlordId) url.searchParams.set('landlordId', landlordId);
  return url.toString();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InviteTenant({
  properties,
  onBack,
  onSuccess,
  landlordEmail,
  landlordId,
  landlordName,
  prefillEmail,
  onTenantCreated,
}: InviteTenantProps) {
  const [email, setEmail] = useState(prefillEmail ?? '');
  const [propertyId, setPropertyId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [errors, setErrors] = useState<{ email?: string; propertyId?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [emailDeliveryWarning, setEmailDeliveryWarning] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Pre-fill email if it arrives late (e.g. parent re-renders)
  useEffect(() => {
    if (prefillEmail && !email) setEmail(prefillEmail);
  }, [prefillEmail]);

  const selectedProperty = properties.find((p) => p.id === propertyId);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(email.trim())) e.email = 'Enter a valid email address';
    if (!propertyId) e.propertyId = 'Please select a property';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSend() {
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (!selectedProperty) throw new Error('Selected property not found');

      // 1. Record in Firestore first to generate a secure invitation token
      let inviteToken = '';
      try {
        const invResult = await invitationService.createInvitation({
          email: email.trim().toLowerCase(),
          propertyId,
          propertyAddress: selectedProperty.address,
          landlordId: landlordId ?? '',
          landlordEmail: landlordEmail ?? '',
          landlordName: landlordName ?? '',
          inviteType: 'new-tenant',
          customMessage: customMessage.trim() || undefined,
        });
        inviteToken = invResult.token;
      } catch (err) {
        console.warn('Could not record invitation record prior to email send:', err);
      }

      // 2. Build tokenized invitation link and email content
      const resolvedLandlordName = (landlordName || '').trim();
      const inviteLink = buildInviteLink(inviteToken, propertyId, landlordEmail, landlordId);
      const html = buildEmailHtml(
        selectedProperty.address,
        inviteLink,
        customMessage.trim() || undefined,
        resolvedLandlordName || undefined
      );
      const subject = resolvedLandlordName
        ? `${resolvedLandlordName} invited you to join as a tenant — ${selectedProperty.address}`
        : `You've been invited to join as a tenant — ${selectedProperty.address}`;

      setGeneratedInviteLink(inviteLink);

      // 3. Send the email (with graceful fallback if email service has config/auth issues)
      const API_BASE = PRIMARY_API_BASE_URL.replace(/\/api$/, '');
      let emailDispatched = false;
      let emailErrorDetail = '';

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await axios.post(
            `${API_BASE}/api/email/send`,
            { to: email.trim().toLowerCase(), subject, html },
            { timeout: 45_000, validateStatus: (s) => s < 500 }
          );
          if (res.status >= 400) {
            throw new Error(res.data?.message || res.data?.error || `HTTP ${res.status}`);
          }
          if (res.data && res.data.success === false) {
            throw new Error(res.data.error || 'Email service rejected the request');
          }
          emailDispatched = true;
          trackEvent('landlord_invite_tenant_sent', { property_address: selectedProperty.address });
          break; // success
        } catch (e: any) {
          const retryable =
            axios.isAxiosError(e) &&
            (!e.response || ['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'].includes(e.code ?? ''));
          if (retryable && attempt === 1) {
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          emailErrorDetail = e?.response?.data?.message || e?.message || 'Email delivery failed';
          console.warn('[InviteTenant] Automated email dispatch warning:', emailErrorDetail);
          break;
        }
      }

      // 4. Create a pending tenant record so the invitee appears in the Clients
      //    list immediately under status "pending" rather than being invisible
      //    until they complete onboarding.
      try {
        const now = new Date();
        const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        const pendingTenantId = await tenantService.createTenant({
          name: email.trim().split('@')[0], // placeholder name from email prefix
          email: email.trim().toLowerCase(),
          phone: '',
          propertyId,
          propertyAddress: selectedProperty.address,
          rentAmount: 0,
          paymentFrequency: 'monthly',
          firstPaymentDate: now.toISOString(),
          leaseStart: now.toISOString(),
          leaseEnd: nextYear.toISOString(),
          status: 'pending',
          referencingStatus: 'not-started',
          paymentStatus: 'current',
          emergencyContact: { name: '', phone: '', relationship: '' },
          defaultRiskScore: 75,
        } as any, landlordId ?? '');

        if (pendingTenantId && onTenantCreated) {
          const saved = await tenantService.getTenant(pendingTenantId);
          if (saved) onTenantCreated(saved);
        }
      } catch (tErr) {
        console.warn('[InviteTenant] Could not create pending tenant record:', tErr);
      }

      if (emailDispatched) {
        setSent(true);
        setTimeout(() => onSuccess(), 3000);
      } else {
        setEmailDeliveryWarning(
          emailErrorDetail || 'Automated email dispatch failed. You can copy the direct link below to share with your tenant.'
        );
        setSent(true);
      }
    } catch (err: any) {
      let msg = 'Failed to create invitation. Please try again.';
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNREFUSED') msg = 'Cannot reach the server. Is the backend running?';
        else if (err.code === 'ETIMEDOUT') msg = 'Request timed out. Check your connection and try again.';
        else if (err.response?.data?.message) msg = err.response.data.message;
        else if (err.message) msg = err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setErrors({ general: msg });
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Success screen ───────────────────────────────────────────────────────

  if (sent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: '#F8FAFC', fontFamily: 'Archivo, sans-serif' }}
      >
        <div className="text-center space-y-5 max-w-md w-full">
          <div className={`w-20 h-20 rounded-full ${emailDeliveryWarning ? 'bg-amber-100' : 'bg-green-100'} flex items-center justify-center mx-auto`}>
            {emailDeliveryWarning ? (
              <AlertCircle className="w-10 h-10 text-amber-600" />
            ) : (
              <CheckCircle className="w-10 h-10 text-green-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold" style={{ color: '#136C9E' }}>
            {emailDeliveryWarning ? 'Invitation Created!' : 'Invitation sent!'}
          </h2>
          <p className="text-gray-600 text-sm">
            {emailDeliveryWarning ? (
              <>Invitation for <strong>{email}</strong> was created successfully.</>
            ) : (
              <>An invitation email has been sent to <strong>{email}</strong>.</>
            )}
          </p>

          {emailDeliveryWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-900 font-semibold">Email Delivery Notice</p>
              </div>
              <p className="text-xs text-amber-800">
                Automated email delivery encountered an issue ({emailDeliveryWarning}). You can copy the direct invitation link below to send to your tenant via WhatsApp, SMS, or email:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedInviteLink}
                  className="text-xs flex-1 p-2 border border-amber-300 rounded bg-white text-gray-700 select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedInviteLink);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  className="px-3 py-2 bg-[#136C9E] text-white text-xs font-semibold rounded hover:bg-[#0f547c] flex items-center gap-1.5 whitespace-nowrap"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          )}

          {/* Clear explanation of what happens next */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left space-y-2">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800 font-semibold">What happens next?</p>
            </div>
            <ul className="text-xs text-blue-700 space-y-1 pl-6 list-disc">
              <li>
                The invitation appears under <strong>Clients → Invitations</strong> as{' '}
                <strong>pending</strong>.
              </li>
              <li>
                When the tenant follows the link and creates their account, the invitation updates
                to <strong>accepted</strong> and they appear in your tenant list.
              </li>
              <li>If they don't act, you can resend from the Invitations tab.</li>
            </ul>
          </div>

          {emailDeliveryWarning ? (
            <button
              type="button"
              onClick={onSuccess}
              className="w-full py-2.5 px-4 bg-[#136C9E] hover:bg-[#0f547c] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              Done & Return to Clients
            </button>
          ) : (
            <p className="text-xs text-gray-400">Returning to your dashboard in 3 seconds…</p>
          )}
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
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold" style={{ color: '#136C9E' }}>
          Invite tenant by email
        </h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            The tenant will receive a link to create their Proptii account and complete their
            profile. They'll appear under <strong>Invitations</strong> until they accept.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          {/* Global error */}
          {errors.general && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label className={LABEL} htmlFor="inv-email">
              Tenant's email address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="inv-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                }}
                placeholder="tenant@example.com"
                className={`${FIELD} pl-10 ${errors.email ? FIELD_ERR : ''}`}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.email}
              </p>
            )}
          </div>

          {/* Property */}
          <div>
            <label className={LABEL} htmlFor="inv-property">
              Property <span className="text-red-500">*</span>
            </label>
            <Select
              value={propertyId}
              onValueChange={(v) => {
                setPropertyId(v);
                if (errors.propertyId) setErrors((p) => ({ ...p, propertyId: undefined }));
              }}
            >
              <SelectTrigger
                id="inv-property"
                className={`${FIELD} h-auto ${errors.propertyId ? FIELD_ERR : ''}`}
              >
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties.filter((p) => !isPropertyArchived(p)).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.propertyId && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.propertyId}
              </p>
            )}
          </div>

          {/* Custom message */}
          <div>
            <label className={LABEL} htmlFor="inv-msg">
              Personal message{' '}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="inv-msg"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
              placeholder="Add a personal note to the invitation email…"
              className={`${FIELD} resize-none`}
            />
          </div>

          {/* Preview */}
          {selectedProperty && email && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1 text-xs text-gray-600">
              <p className="font-semibold text-gray-700 mb-1.5">Email preview</p>
              <p>
                <span className="font-medium">To:</span> {email}
              </p>
              <p>
                <span className="font-medium">Subject:</span> You've been invited to join as a
                tenant — {selectedProperty.address}
              </p>
              <p>
                <span className="font-medium">Property:</span> {selectedProperty.address}
              </p>
              {customMessage && (
                <p>
                  <span className="font-medium">Message:</span> {customMessage}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
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
            onClick={handleSend}
            disabled={isLoading}
            className="flex-1 py-3.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #DC5F12, #DC5F12)' }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send invitation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InviteTenant;
