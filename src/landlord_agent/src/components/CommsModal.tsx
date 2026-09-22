import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Send, X } from 'lucide-react';

export interface CommsShareView {
  tenantName?: string;
  tenantEmail?: string;
  propertyAddress?: string;
  notes?: string;
  phone?: string;
  createdAt?: string;
  claimedBy?: string | null;
  claimToken?: string;
}

interface CommsMessage {
  id: string;
  from: 'tenant' | 'agent';
  text: string;
  time: string;
}

interface CommsModalProps {
  share: CommsShareView;
  initials: string;
  avatarTone: string;
  onClose: () => void;
  onOpenMessages?: () => void;
}

function formatMessageTime(value?: string): string {
  if (!value) return 'Today';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Today';
  const now = new Date();
  const time = d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  if (d.toDateString() === now.toDateString()) return `Today, ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${time}`;
}

function inboundText(share: CommsShareView): string {
  const note = (share.notes || '').trim();
  if (note && note.length > 40) return note;
  const property = share.propertyAddress || 'the property';
  return `Hi! I just completed my referencing passport submission for ${property}. Let me know if you need additional documents.`;
}

export function CommsModal({ share, initials, avatarTone, onClose, onOpenMessages }: CommsModalProps) {
  const connected = Boolean(share.claimedBy);
  const realClaim =
    Boolean(share.claimToken) && !String(share.claimToken).startsWith('agent-dummy-') && !connected;
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<CommsMessage[]>(() => [
    {
      id: 'inbound',
      from: 'tenant',
      text: inboundText(share),
      time: formatMessageTime(share.createdAt),
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  const subtitle = [share.phone || share.tenantEmail, connected ? 'Messaging connected' : 'Not yet connected']
    .filter(Boolean)
    .join(' · ');

  const send = (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: `out-${prev.length}`, from: 'agent', text, time: 'Just now' },
    ]);
    setDraft('');
    const dummy = String(share.claimToken || '').startsWith('agent-dummy-');
    if (dummy) return;
    if (connected && onOpenMessages) {
      onOpenMessages();
      onClose();
      return;
    }
    if (share.tenantEmail) {
      window.location.href = `mailto:${share.tenantEmail}?subject=${encodeURIComponent(
        `Referencing — ${share.propertyAddress || 'your application'}`,
      )}&body=${encodeURIComponent(text)}`;
    }
  };

  return createPortal(
    <div className="ll-comms" role="dialog" aria-modal="true" aria-labelledby="ll-comms-name">
      <button type="button" className="ll-comms-overlay" aria-label="Close conversation" onClick={onClose} />
      <div className="ll-comms-panel">
        <div className="ll-comms-head">
          <div className="ll-comms-who">
            <span className={`ll-ref-avatar ${avatarTone}`}>{initials}</span>
            <div>
              <h3 id="ll-comms-name">{share.tenantName || 'Tenant'}</h3>
              <p>{subtitle}</p>
            </div>
          </div>
          <button type="button" className="ll-comms-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="ll-comms-thread" ref={listRef}>
          {messages.map((message) => (
            <div key={message.id} className={`ll-comms-bubble is-${message.from}`}>
              <p>{message.text}</p>
              <span>{message.time}</span>
            </div>
          ))}
        </div>

        {realClaim ? (
          <div className="ll-comms-connect">
            <button
              type="button"
              className="ll-comms-connect-btn"
              onClick={() => window.open(`/claim-referencing?token=${share.claimToken}`, '_blank', 'noopener')}
            >
              Connect in Proptii
            </button>
          </div>
        ) : null}

        <form className="ll-comms-composer" onSubmit={send}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type an SMS response..."
            aria-label="Message"
          />
          <button type="submit" aria-label="Send message" disabled={!draft.trim()}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
