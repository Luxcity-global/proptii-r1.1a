/**
 * TenantSelection — entry point for adding a tenant.
 *
 * On mount: shows a popup modal (matching index.html .modal-overlay design) asking
 * Single Tenant or Multiple (CSV). Choosing Single dismisses the modal and shows
 * the email-first flow below. Choosing Multiple calls onBulkImport directly.
 */
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mail, UserPlus, Send, CheckCircle, AlertCircle, Loader2, Upload, X } from 'lucide-react';
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
  'w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-[#136C9E] focus:outline-none transition-colors bg-white placeholder-gray-400';
const BTN_PRIMARY =
  'flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]';
const BTN_OUTLINE =
  'flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm border-2 transition-all hover:bg-gray-50 active:scale-[0.98]';

// ── Exact template values ─────────────────────────────────────────────────────
const PRIMARY_BLUE   = '#136C9E';
const PRIMARY_ORANGE = '#DC5F12';
const FONT_HEADING   = 'Archivo, sans-serif';
const FONT_BODY      = 'Nunito Sans, sans-serif';

export function TenantSelection({
  existingTenants,
  properties,
  onManualInput,
  onInviteEmail,
  onBulkImport,
  onBack,
}: TenantSelectionProps) {
  // Modal state — open by default on mount if bulk import is available
  const [modalOpen, setModalOpen]         = useState(!!onBulkImport);
  const [modalSelected, setModalSelected] = useState<'single' | 'multiple'>('single');

  const [email, setEmail]             = useState('');
  const [isChecking, setIsChecking]   = useState(false);
  const [checked, setChecked]         = useState(false);
  const [existingMatch, setExistingMatch] = useState<Tenant | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  // Focus email input once modal is dismissed
  useEffect(() => {
    if (!modalOpen) inputRef.current?.focus();
  }, [modalOpen]);

  // Debounced email check
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = email.trim().toLowerCase();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!trimmed || !valid) { setChecked(false); setExistingMatch(null); setIsChecking(false); return; }
    setIsChecking(true);
    debounceRef.current = setTimeout(() => {
      const match = existingTenants.find(t => (t.email || '').toLowerCase().trim() === trimmed);
      setExistingMatch(match ?? null);
      setChecked(true);
      setIsChecking(false);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [email, existingTenants]);

  function confirmModal() {
    if (modalSelected === 'multiple') {
      onBulkImport?.();
    } else {
      setModalOpen(false);
    }
  }

  const trimmedEmail = email.trim();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const showActions  = checked && isValidEmail;

  return (
    <>
      {/* ── Mode Selection Modal — exact .modal-overlay / .mode-option-card design ── */}
      {modalOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15,23,42,0.5)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: 20,
            animation: 'fadeInModal 0.25s ease',
          }}
        >
          {/* .modal-card.mode-select-card */}
          <div style={{
            background: '#fff',
            borderRadius: 26,
            padding: '32px 36px',
            maxWidth: 480,
            width: '100%',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
            position: 'relative',
            fontFamily: FONT_BODY,
          }}>
            {/* .modal-close-corner */}
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{ position: 'absolute', top: 20, right: 20, width: 32, height: 32, borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>

            {/* .mode-modal-header */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#eaf3f8', color: PRIMARY_BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <UserPlus size={24} />
              </div>
              <h2 style={{ fontSize: 21, fontWeight: 700, color: '#1e293b', fontFamily: FONT_HEADING, letterSpacing: '-0.01em', margin: 0 }}>
                How would you like to add tenants?
              </h2>
              <p style={{ fontSize: 13.5, color: '#64748b', marginTop: 4, lineHeight: 1.45 }}>
                Choose whether you're onboarding an individual tenant or importing multiple in bulk.
              </p>
            </div>

            {/* .mode-options-grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 26 }}>
              {/* Single Tenant option */}
              <div
                onClick={() => setModalSelected('single')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 18px',
                  border: `2px solid ${modalSelected === 'single' ? PRIMARY_BLUE : '#e2e8f0'}`,
                  borderRadius: 18,
                  cursor: 'pointer',
                  background: modalSelected === 'single' ? '#f0f7fb' : '#fff',
                  boxShadow: modalSelected === 'single' ? '0 4px 16px rgba(19,108,158,0.1)' : 'none',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 14, background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <UserPlus size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', fontFamily: FONT_HEADING }}>Single Tenant</div>
                  <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>Add one tenant manually with our step-by-step guided flow.</div>
                </div>
                {/* Radio circle */}
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${modalSelected === 'single' ? PRIMARY_BLUE : '#cbd5e1'}`, background: modalSelected === 'single' ? PRIMARY_BLUE : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s ease' }}>
                  {modalSelected === 'single' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                </div>
              </div>

              {/* Multiple / CSV option */}
              {onBulkImport && (
                <div
                  onClick={() => setModalSelected('multiple')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '16px 18px',
                    border: `2px solid ${modalSelected === 'multiple' ? PRIMARY_ORANGE : '#e2e8f0'}`,
                    borderRadius: 18,
                    cursor: 'pointer',
                    background: modalSelected === 'multiple' ? '#fff3ec' : '#fff',
                    boxShadow: modalSelected === 'multiple' ? '0 4px 16px rgba(220,95,18,0.1)' : 'none',
                    transition: 'all 0.2s ease',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: '#fff3ec', color: PRIMARY_ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Upload size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', fontFamily: FONT_HEADING }}>Multiple Tenants</div>
                    <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>Upload a CSV spreadsheet to onboard multiple tenant records in bulk.</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${modalSelected === 'multiple' ? PRIMARY_ORANGE : '#cbd5e1'}`, background: modalSelected === 'multiple' ? PRIMARY_ORANGE : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s ease' }}>
                    {modalSelected === 'multiple' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                </div>
              )}
            </div>

            {/* .btn-primary-blue */}
            <button
              type="button"
              onClick={confirmModal}
              style={{ width: '100%', height: 50, background: PRIMARY_BLUE, color: '#fff', border: 'none', borderRadius: 14, fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(19,108,158,0.28)' }}
            >
              <span>Continue</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* ── Email-first screen (shown after modal dismissed with Single) ── */}
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8FAFC', fontFamily: 'Archivo, sans-serif' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500" aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold" style={{ color: PRIMARY_BLUE }}>Add Tenant</h1>
          {onBulkImport && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{ marginLeft: 'auto', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 9999, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: PRIMARY_BLUE, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: FONT_HEADING }}
            >
              <Upload size={12} /> Change Mode
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center px-4 py-10">
          <div className="w-full max-w-md space-y-8">

            {/* Hero */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: '#E8F4F8' }}>
                <UserPlus className="w-8 h-8" style={{ color: PRIMARY_BLUE }} />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: '#374957' }}>Who are you adding?</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Start with their email address. We'll let you know if they're already on Proptii.
              </p>
            </div>

            {/* Email input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700" htmlFor="tenant-email">Tenant's email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  id="tenant-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. james@example.com"
                  className={`${INPUT_STYLE} pl-10 pr-10`}
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                />
                {isChecking && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
                {checked && isValidEmail && !isChecking && (
                  existingMatch
                    ? <AlertCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                    : <CheckCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
              </div>
            </div>

            {/* Already a tenant */}
            {showActions && existingMatch && (
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-800 text-sm">{existingMatch.name || trimmedEmail} is already your tenant</p>
                    <p className="text-amber-700 text-xs mt-0.5">Currently assigned to <span className="font-medium">{existingMatch.propertyAddress || 'a property'}</span>.</p>
                  </div>
                </div>
                <p className="text-xs text-amber-700 pl-8">To reassign them, use <strong>Edit</strong> from their tenant card in the Clients tab.</p>
              </div>
            )}

            {/* New email — two paths */}
            {showActions && !existingMatch && (
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 space-y-3 hover:border-[#136C9E] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8F4F8' }}>
                      <UserPlus className="w-4 h-4" style={{ color: PRIMARY_BLUE }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">I have their details</p>
                      <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">Fill in name, phone, rent, lease dates and more. Added immediately.</p>
                    </div>
                  </div>
                  <button onClick={() => onManualInput(trimmedEmail)} className={BTN_PRIMARY} style={{ background: `linear-gradient(135deg, ${PRIMARY_BLUE}, #1a87c4)` }}>
                    <UserPlus className="w-4 h-4" /> Add details manually
                  </button>
                </div>

                <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 space-y-3 hover:border-[#DC5F12] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFF0E8' }}>
                      <Send className="w-4 h-4" style={{ color: PRIMARY_ORANGE }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">Send them an invite</p>
                      <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">Email an invitation. Tenant completes their own profile. Visible under Invitations tab.</p>
                    </div>
                  </div>
                  <button onClick={() => onInviteEmail(trimmedEmail)} className={BTN_OUTLINE} style={{ borderColor: PRIMARY_ORANGE, color: PRIMARY_ORANGE }}>
                    <Send className="w-4 h-4" /> Send invite email
                  </button>
                </div>
              </div>
            )}

            {!showActions && !isChecking && (
              <p className="text-center text-xs text-gray-400">Enter a valid email address to see your options.</p>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
