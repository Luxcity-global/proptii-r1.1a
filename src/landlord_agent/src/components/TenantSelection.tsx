/**
 * TenantSelection — smart email-first entry point for adding a tenant.
 *
 * Flow:
 *  0. Mode select — Single tenant (email-first below) OR Bulk CSV import
 *  1. Landlord types the tenant's email address
 *  2. System checks in real-time: is this email already in the landlord's tenant list?
 *     - Match found  → "This person is already your tenant" — offer to reassign
 *     - No match     → Two paths: manual add or send invite
 */
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mail, UserPlus, Send, CheckCircle, AlertCircle, Loader2, Upload, Users } from 'lucide-react';
import type { Tenant, Property } from '../App';

interface TenantSelectionProps {
  existingTenants: Tenant[];
  properties: Property[];
  onManualInput: (prefillEmail?: string) => void;
  onInviteEmail: (prefillEmail?: string) => void;
  onBulkImport?: () => void;
  onBack: () => void;
}

const INPUT_STYLE =
  'w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-[#4E97CC] focus:outline-none transition-colors bg-white placeholder-gray-400';
const BTN_PRIMARY =
  'flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]';
const BTN_OUTLINE =
  'flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm border-2 transition-all hover:bg-gray-50 active:scale-[0.98]';

export function TenantSelection({
  existingTenants,
  properties,
  onManualInput,
  onInviteEmail,
  onBulkImport,
  onBack,
}: TenantSelectionProps) {
  const [email, setEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [existingMatch, setExistingMatch] = useState<Tenant | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the email input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Check the email against existing tenants with a 400ms debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = email.trim().toLowerCase();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

    if (!trimmed || !isValidEmail) {
      setChecked(false);
      setExistingMatch(null);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    debounceRef.current = setTimeout(() => {
      const match = existingTenants.find(
        (t) => (t.email || '').toLowerCase().trim() === trimmed
      );
      setExistingMatch(match ?? null);
      setChecked(true);
      setIsChecking(false);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [email, existingTenants]);

  const trimmedEmail = email.trim();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const showActions = checked && isValidEmail;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#F8FAFC', fontFamily: 'Archivo, sans-serif' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold" style={{ color: '#136C9E' }}>
          Add Tenant
        </h1>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-md space-y-8">

          {/* Hero */}
          <div className="text-center space-y-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ backgroundColor: '#E8F4F8' }}
            >
              <UserPlus className="w-8 h-8" style={{ color: '#136C9E' }} />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: '#374957' }}>
              Who are you adding?
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Start with their email address. We'll let you know if they're already on Proptii.
            </p>
          </div>

          {/* Bulk import option */}
          {onBulkImport && (
            <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 space-y-3 hover:border-[#DC5F12] transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFF0E8' }}>
                  <Upload className="w-4 h-4" style={{ color: '#DC5F12' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">Import multiple tenants via CSV</p>
                  <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                    Upload a spreadsheet to add up to 500 tenants at once. Property assignment is optional — you can bulk assign after import.
                  </p>
                </div>
              </div>
              <button
                onClick={onBulkImport}
                className={BTN_OUTLINE}
                style={{ borderColor: '#DC5F12', color: '#DC5F12' }}
              >
                <Upload className="w-4 h-4" />
                Bulk import via CSV
              </button>
            </div>
          )}

          {/* Divider */}
          {onBulkImport && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or add a single tenant</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}

          {/* Email input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700" htmlFor="tenant-email">
              Tenant's email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                id="tenant-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. james@example.com"
                className={`${INPUT_STYLE} pl-10 pr-10`}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
              />
              {isChecking && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
              )}
              {checked && isValidEmail && !isChecking && (
                existingMatch ? (
                  <AlertCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                ) : (
                  <CheckCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )
              )}
            </div>
          </div>

          {/* ── Already a tenant ─────────────────────────────── */}
          {showActions && existingMatch && (
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800 text-sm">
                    {existingMatch.name || trimmedEmail} is already your tenant
                  </p>
                  <p className="text-amber-700 text-xs mt-0.5">
                    Currently assigned to{' '}
                    <span className="font-medium">{existingMatch.propertyAddress || 'a property'}</span>.
                  </p>
                </div>
              </div>
              <p className="text-xs text-amber-700 pl-8">
                If you want to reassign them to a different property, use the <strong>Edit</strong> option
                from their tenant card in the Clients tab.
              </p>
            </div>
          )}

          {/* ── New email — show two paths ────────────────────── */}
          {showActions && !existingMatch && (
            <div className="space-y-4">
              {/* "I have their details" path */}
              <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 space-y-3 hover:border-[#136C9E] transition-colors group">
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#E8F4F8' }}
                  >
                    <UserPlus className="w-4 h-4" style={{ color: '#136C9E' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">I have their details</p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                      Fill in their name, phone, rent amount, lease dates and emergency contact.
                      They'll be added to your list immediately.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onManualInput(trimmedEmail)}
                  className={BTN_PRIMARY}
                  style={{ background: 'linear-gradient(135deg, #136C9E, #1a87c4)' }}
                >
                  <UserPlus className="w-4 h-4" />
                  Add details manually
                </button>
              </div>

              {/* "Send invite" path */}
              <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 space-y-3 hover:border-[#DC5F12] transition-colors">
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#FFF0E8' }}
                  >
                    <Send className="w-4 h-4" style={{ color: '#DC5F12' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">Send them an invite</p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                      Email an invitation link. The tenant signs up and completes their own profile.
                      You'll see the invite under the <strong>Invitations</strong> tab.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onInviteEmail(trimmedEmail)}
                  className={BTN_OUTLINE}
                  style={{ borderColor: '#DC5F12', color: '#DC5F12' }}
                >
                  <Send className="w-4 h-4" />
                  Send invite email
                </button>
              </div>
            </div>
          )}

          {/* ── Hint before email is entered ─────────────────── */}
          {!showActions && !isChecking && (
            <p className="text-center text-xs text-gray-400">
              Enter a valid email address to see your options.
            </p>
          )}

        </div>
      </div>
    </div>
  );
}

export default TenantSelection;
