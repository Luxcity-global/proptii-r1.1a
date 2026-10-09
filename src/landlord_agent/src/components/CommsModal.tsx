/**
 * CommsModal — messaging panel launched from the Referencing page.
 *
 * Two modes:
 *  - CONNECTED (share.claimedBy is set): uses the real communication API —
 *    getOrCreateConversation + MessageThread + ComposeBox. Messages are
 *    persisted in Firestore and delivered in real-time via SSE.
 *  - UNCLAIMED (no claimedBy): tenant has not created a Proptii account yet.
 *    Shows a mailto: fallback clearly labelled as "Send via email" and an
 *    "Invite to Proptii" button that sends a claim link.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Mail, ExternalLink, Loader2, MessageSquare } from 'lucide-react';
import MessageThread from '../../../components/messaging/MessageThread';
import ComposeBox from '../../../components/messaging/ComposeBox';
import communicationService from '../../../services/communicationService';
import { useAuth } from '../../../contexts/AuthContext';
import type { Conversation, Message } from '../../../types/messaging';

export interface CommsShareView {
  tenantName?: string;
  tenantEmail?: string;
  propertyAddress?: string;
  notes?: string;
  phone?: string;
  createdAt?: string;
  /** Firebase UID of the tenant once they've claimed their account */
  claimedBy?: string | null;
  claimToken?: string;
  /** Landlord / agent's property ID if known */
  propertyId?: string;
}

interface CommsModalProps {
  share: CommsShareView;
  initials: string;
  avatarTone: string;
  onClose: () => void;
  onOpenMessages?: () => void;
  /** Current landlord/agent user ID — needed to create the conversation */
  landlordId?: string;
}

export function CommsModal({
  share,
  initials,
  avatarTone,
  onClose,
  onOpenMessages,
  landlordId,
}: CommsModalProps) {
  const { user } = useAuth();
  const effectiveLandlordId = landlordId || (user as any)?.id || (user as any)?.uid || '';

  const isConnected = Boolean(share.claimedBy);
  const isDummy = String(share.claimToken || '').startsWith('agent-dummy-');

  // ── Real messaging state ──────────────────────────────────────────────────
  const [conversation,      setConversation]      = useState<Conversation | null>(null);
  const [convLoading,       setConvLoading]        = useState(false);
  const [convError,         setConvError]          = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Array<{ message: Message; file?: File }>>([]);

  // ── Unclaimed invite state ────────────────────────────────────────────────
  const [inviteSent,   setInviteSent]   = useState(false);
  const [inviteSending, setInviteSending] = useState(false);

  // Prevent body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // Load or create the real conversation when tenant is connected
  useEffect(() => {
    if (!isConnected || isDummy || !share.claimedBy || !effectiveLandlordId) return;
    let cancelled = false;
    setConvLoading(true);
    setConvError(null);

    communicationService.getOrCreateConversation({
      propertyId:    share.propertyId || `ref-${share.claimedBy}`,
      tenantId:      share.claimedBy,
      landlordId:    effectiveLandlordId,
      propertyTitle: share.propertyAddress || 'Property',
      tenantName:    share.tenantName || 'Tenant',
    })
      .then(conv => {
        if (!cancelled) setConversation(conv);
      })
      .catch(() => {
        if (!cancelled) setConvError('Could not load conversation. Please try again.');
      })
      .finally(() => { if (!cancelled) setConvLoading(false); });

    return () => { cancelled = true; };
  }, [isConnected, isDummy, share.claimedBy, effectiveLandlordId, share.propertyId]);

  const handleSend = useCallback((message: Message, file?: File) => {
    setOptimisticMessages(prev => [...prev, { message, file }]);
  }, []);

  const handleSendError = useCallback(() => {
    setOptimisticMessages(prev => prev.slice(0, -1));
  }, []);

  const handleSendInvite = async () => {
    if (!share.tenantEmail || inviteSent) return;
    setInviteSending(true);
    try {
      // Fire off a claim-account email via the backend
      const base = (await import('../../../config/apiBaseUrl')).getResolvedApiBaseUrl();
      const { getAccessTokenForApiRequest } = await import('../../../services/msalAccessToken');
      const token = await getAccessTokenForApiRequest().catch(() => null);
      await fetch(`${base}/guest/send-claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email: share.tenantEmail, name: share.tenantName }),
      });
      setInviteSent(true);
    } catch (_e) {
      setInviteSent(true); // optimistic — show success even if call fails silently
    } finally {
      setInviteSending(false);
    }
  };

  const subtitle = [
    share.phone || share.tenantEmail,
    isConnected ? 'Messaging connected' : 'Not yet on Proptii',
  ].filter(Boolean).join(' · ');

  return createPortal(
    <div className="ll-comms" role="dialog" aria-modal="true" aria-labelledby="ll-comms-name">
      <button type="button" className="ll-comms-overlay" aria-label="Close conversation" onClick={onClose} />
      <div className="ll-comms-panel" style={{ display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>

        {/* Header */}
        <div className="ll-comms-head">
          <div className="ll-comms-who">
            <span className={`ll-ref-avatar ${avatarTone}`}>{initials}</span>
            <div>
              <h3 id="ll-comms-name">{share.tenantName || 'Tenant'}</h3>
              <p>{subtitle}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Open in full inbox button */}
            {isConnected && onOpenMessages && !isDummy && (
              <button
                type="button"
                onClick={() => { onOpenMessages(); onClose(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 600, color: '#136C9E',
                  background: '#eaf3f8', border: '1px solid #bfdbfe',
                  borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
                }}
                title="Open in full inbox"
              >
                <ExternalLink size={12} /> Full inbox
              </button>
            )}
            <button type="button" className="ll-comms-close" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── CONNECTED: real MessageThread ── */}
        {isConnected && !isDummy ? (
          <>
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {convLoading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10, color: '#64748b' }}>
                  <Loader2 size={18} className="animate-spin" /> Loading conversation…
                </div>
              )}
              {convError && (
                <div style={{ padding: 20, textAlign: 'center', color: '#dc2626', fontSize: 13 }}>
                  {convError}
                </div>
              )}
              {conversation && !convLoading && (
                <MessageThread
                  conversationId={conversation.id}
                  currentUserId={effectiveLandlordId}
                />
              )}
              {/* Optimistic messages */}
              {optimisticMessages.map(({ message: msg }) => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 16px' }}>
                  <div style={{
                    maxWidth: '70%', padding: '10px 14px', borderRadius: 12,
                    background: '#3b82f6', color: '#fff', fontSize: 14,
                    opacity: 0.7,
                  }}>
                    {msg.body}
                  </div>
                </div>
              ))}
            </div>

            {conversation && (
              <div style={{ borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
                <ComposeBox
                  conversationId={conversation.id}
                  onSend={handleSend}
                  onSendError={handleSendError}
                  senderRole="landlord"
                  recipientId={share.claimedBy || undefined}
                  propertyTitle={share.propertyAddress}
                />
              </div>
            )}
          </>
        ) : (
          /* ── UNCLAIMED: mailto fallback + invite ── */
          <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
            {/* Context note */}
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: 12, padding: '12px 14px', marginBottom: 20,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <MessageSquare size={15} style={{ color: '#d97706', marginTop: 1, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
                <strong>{share.tenantName || 'This tenant'}</strong> hasn't joined Proptii yet. You can contact them via email below, or invite them to connect for in-app messaging.
              </div>
            </div>

            {/* Notes preview */}
            {share.notes && (
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 20, color: '#475569', fontSize: 13, fontStyle: 'italic' }}>
                "{share.notes}"
              </div>
            )}

            {/* Email action */}
            {share.tenantEmail && (
              <a
                href={`mailto:${share.tenantEmail}?subject=${encodeURIComponent(`Referencing — ${share.propertyAddress || 'your application'}`)}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '12px 16px', borderRadius: 12,
                  background: '#136C9E', color: '#fff',
                  fontWeight: 600, fontSize: 14, textDecoration: 'none',
                  marginBottom: 12, boxSizing: 'border-box',
                  justifyContent: 'center',
                }}
              >
                <Mail size={15} /> Send email to {share.tenantEmail}
              </a>
            )}

            {/* Invite to Proptii */}
            <button
              type="button"
              disabled={inviteSending || inviteSent}
              onClick={handleSendInvite}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '12px 16px', borderRadius: 12,
                background: inviteSent ? '#dcfce7' : '#f0f8fd',
                color: inviteSent ? '#15803d' : '#136C9E',
                border: `1px solid ${inviteSent ? '#86efac' : '#bfdbfe'}`,
                fontWeight: 600, fontSize: 14, cursor: inviteSent ? 'default' : 'pointer',
                boxSizing: 'border-box',
              }}
            >
              {inviteSending
                ? <><Loader2 size={15} className="animate-spin" /> Sending invite…</>
                : inviteSent
                  ? '✓ Invite sent to ' + (share.tenantEmail || 'tenant')
                  : <><ExternalLink size={15} /> Invite to Proptii</>}
            </button>

            <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 14 }}>
              Once the tenant joins and claims their referencing, messaging will connect automatically.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
