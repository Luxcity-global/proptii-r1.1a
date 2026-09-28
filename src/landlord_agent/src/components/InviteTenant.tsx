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
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Property } from '../App';
import axios from 'axios';
import { trackEvent } from '../../../utils/analytics';
import { PRIMARY_API_BASE_URL } from '../../../utils/apiEndpoints';
import { invitationService } from '../services/invitationService';
import { tenantService } from '../services/tenantService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InviteTenantProps {
  properties: Property[];
  onBack: () => void;
  onSuccess: () => void;
  landlordEmail?: string;
  landlordId?: string;
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
  customMessage?: string
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: Arial, sans-serif; background: #E6F2F8; margin: 0; padding: 20px; }
    .wrap { max-width: 600px; margin: 0 auto; }
    .header { background: #E6F2F8; color: #136C9E; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 600; color: #136C9E; }
    .body { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
    .prop { background: white; padding: 16px 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #136C9E; }
    .prop h3 { margin: 0 0 4px; color: #374957; font-size: 14px; }
    .prop p { margin: 0; color: #555; font-size: 14px; }
    .msg { background: #f5f5f5; padding: 14px; border-radius: 5px; margin: 20px 0; font-style: italic; border-left: 3px solid #136C9E; font-size: 14px; }
    .cta { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: #DC5F12; color: white !important; padding: 13px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 15px; }
    .footer { margin-top: 28px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888; text-align: center; }
    .footer img { height: 36px; }
    p { font-size: 14px; color: #444; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header"><h1>Tenant Invitation</h1></div>
    <div class="body">
      <p>Hello,</p>
      <p>You have been invited to create your tenant profile on Proptii.</p>
      <div class="prop">
        <h3>Property</h3>
        <p>${propertyAddress}</p>
      </div>
      ${customMessage ? `<div class="msg"><strong>Message from your landlord:</strong><br/>${customMessage}</div>` : ''}
      <p>Click the button below to create your account and complete your tenant profile:</p>
      <div class="cta">
        <a href="${inviteLink}" class="btn">Create Account &amp; Complete Profile</a>
      </div>
      <p>If you have any questions, please contact your landlord directly.</p>
      <p>Best regards,<br/>The Proptii Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message from Proptii</p>
      <img src="https://framerusercontent.com/images/tjOUqAPA6VZNlXVDj9tqwYJ7BE.png" alt="Proptii" />
      <p><em>Proptii — the AI platform for tenants, agents and landlords.</em></p>
    </div>
  </div>
</body>
</html>`;
}

function buildInviteLink(
  propertyId: string,
  landlordEmail?: string,
  landlordId?: string
): string {
  const base =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : (import.meta as any)?.env?.VITE_APP_URL || 'https://proptii.co';
  const url = new URL('/tenant-onboarding', base);
  url.searchParams.set('invite', 'true');
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
  prefillEmail,
  onTenantCreated,
}: InviteTenantProps) {
  const [email, setEmail] = useState(prefillEmail ?? '');
  const [propertyId, setPropertyId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [errors, setErrors] = useState<{ email?: string; propertyId?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

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

      const inviteLink = buildInviteLink(propertyId, landlordEmail, landlordId);
      const html = buildEmailHtml(
        selectedProperty.address,
        inviteLink,
        customMessage.trim() || undefined
      );
      const subject = `You've been invited to join as a tenant — ${selectedProperty.address}`;

      // 1. Send the email (with one retry on network errors)
      const API_BASE = PRIMARY_API_BASE_URL.replace(/\/api$/, '');
      let lastErr: any = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await axios.post(
            `${API_BASE}/api/email/send`,
            { to: email.trim().toLowerCase(), subject, html },
            { timeout: 45_000, validateStatus: (s) => s < 500 }
          );
          // Check both HTTP status AND the response body — the endpoint always
          // returns HTTP 200 but sets success:false when Resend rejects the email
          if (res.status >= 400) {
            throw new Error(res.data?.message || res.data?.error || `HTTP ${res.status}`);
          }
          if (res.data && res.data.success === false) {
            throw new Error(res.data.error || 'Email service rejected the request');
          }
          break; // success
        } catch (e: any) {
          lastErr = e;
          const retryable =
            axios.isAxiosError(e) &&
            (!e.response || ['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'].includes(e.code ?? ''));
          if (!retryable || attempt === 2) throw e;
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      trackEvent('landlord_invite_tenant_sent', { property_address: selectedProperty.address });

      // 2. Record in Firestore (non-fatal if it fails — email was already sent)
      try {
        await invitationService.createInvitation({
          email: email.trim().toLowerCase(),
          propertyId,
          propertyAddress: selectedProperty.address,
          landlordId: landlordId ?? '',
          landlordEmail: landlordEmail ?? '',
          inviteType: 'new-tenant',
          customMessage: customMessage.trim() || undefined,
        });
      } catch {
        // Non-fatal — invitation email was already sent
      }

      // 3. Create a pending tenant record so the invitee appears in the Clients
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
          firstPaymentDate: now,
          leaseStart: now,
          leaseEnd: nextYear,
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
      } catch {
        // Non-fatal — the invite was sent and recorded; tenant record is best-effort
      }

      setSent(true);
      // Auto-navigate after 3 s
      setTimeout(() => onSuccess(), 3000);
    } catch (err: any) {
      let msg = 'Failed to send invitation. Please try again.';
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNREFUSED') msg = 'Cannot reach the email server. Is the backend running?';
        else if (err.code === 'ETIMEDOUT') msg = 'Request timed out. Check your connection and try again.';
        else if (err.response?.status === 500) msg = 'Server error. Check the email service configuration.';
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
        <div className="text-center space-y-5 max-w-sm w-full">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: '#136C9E' }}>
            Invitation sent!
          </h2>
          <p className="text-gray-600 text-sm">
            An invitation email has been sent to <strong>{email}</strong>.
          </p>

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

          <p className="text-xs text-gray-400">Returning to your dashboard in 3 seconds…</p>
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
                {properties.map((p) => (
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
