import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Phone, X } from 'lucide-react';
import '../styles/clientDetails.css';

export type ClientDrawerTab = { id: string; label: string };
export type ClientStatusTone =
  | 'paid'
  | 'due'
  | 'overdue'
  | 'active'
  | 'pending'
  | 'inactive'
  | 'complete'
  | 'progress'
  | 'idle';

interface ClientDetailsDrawerProps {
  initials: string;
  name: string;
  statusLabel: string;
  statusTone: ClientStatusTone;
  subtitle: string;
  phone?: string;
  email?: string;
  tabs: ClientDrawerTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onClose: () => void;
  loading?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function clientInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
}

export function ClientDetailsDrawer({
  initials,
  name,
  statusLabel,
  statusTone,
  subtitle,
  phone,
  email,
  tabs,
  activeTab,
  onTabChange,
  onClose,
  loading,
  actions,
  children,
}: ClientDetailsDrawerProps) {
  const tel = (phone || '').replace(/\s+/g, '');
  const bodyRef = useRef<HTMLDivElement>(null);

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
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [name, activeTab]);

  return createPortal(
    <div className="ll-cd" role="dialog" aria-modal="true" aria-labelledby="ll-cd-title">
      <button type="button" className="ll-cd-overlay" aria-label="Close client details" onClick={onClose} />
      <aside className="ll-cd-panel">
        <div className="ll-cd-header">
          <div className="ll-cd-header-top">
            <div className="ll-cd-identity">
              <div className="ll-cd-avatar" aria-hidden="true">{initials}</div>
              <div>
                <div className="ll-cd-name-row">
                  <h2 id="ll-cd-title" className="ll-cd-name">{name}</h2>
                  <span className={`ll-cd-pill is-${statusTone}`}>{statusLabel}</span>
                </div>
                <p className="ll-cd-subtitle">{subtitle}</p>
              </div>
            </div>
            <button type="button" className="ll-cd-close" onClick={onClose} aria-label="Close">
              <X size={14} />
            </button>
          </div>

          <div className="ll-cd-comms">
            {tel ? (
              <a className="ll-cd-comm" href={`tel:${tel}`}>
                <Phone size={14} className="ll-cd-comm-icon is-call" />
                <span>Call: {phone}</span>
              </a>
            ) : (
              <span className="ll-cd-comm is-disabled">
                <Phone size={14} className="ll-cd-comm-icon is-call" />
                <span>Call unavailable</span>
              </span>
            )}
            {email ? (
              <a className="ll-cd-comm" href={`mailto:${email}`}>
                <Mail size={14} className="ll-cd-comm-icon is-mail" />
                <span>Email Client</span>
              </a>
            ) : (
              <span className="ll-cd-comm is-disabled">
                <Mail size={14} className="ll-cd-comm-icon is-mail" />
                <span>Email Client</span>
              </span>
            )}
            {actions}
          </div>

          <nav className="ll-cd-tabs" aria-label="Client details">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`ll-cd-tab${activeTab === tab.id ? ' is-active' : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="ll-cd-body" ref={bodyRef}>
          {loading ? (
            <div className="ll-cd-loading">
              <div className="ll-cd-spinner" />
              <p>Loading details…</p>
            </div>
          ) : (
            children
          )}
        </div>
      </aside>
    </div>,
    document.body
  );
}
