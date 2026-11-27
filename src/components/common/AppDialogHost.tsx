import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, Trash2, X } from 'lucide-react';
import {
  ActiveAppDialog,
  AppDialogTone,
  resolveActiveAppDialog,
  subscribeAppDialog,
} from '../../utils/appDialog';

const TONE_STYLES: Record<
  AppDialogTone,
  {
    badgeBg: string;
    badgeColor: string;
    btnBg: string;
    btnHoverBg: string;
  }
> = {
  danger: {
    badgeBg: '#FEE2E2',
    badgeColor: '#DC2626',
    btnBg: '#DC2626',
    btnHoverBg: '#B91C1C',
  },
  warning: {
    badgeBg: '#FFEDD5',
    badgeColor: '#DC5F12',
    btnBg: '#E65D24',
    btnHoverBg: '#D14E17',
  },
  success: {
    badgeBg: '#D1FAE5',
    badgeColor: '#047857',
    btnBg: '#047857',
    btnHoverBg: '#065F46',
  },
  info: {
    badgeBg: 'rgba(19, 108, 158, 0.12)',
    badgeColor: '#136C9E',
    btnBg: '#136C9E',
    btnHoverBg: '#0F567E',
  },
};

function renderToneIcon(dialog: ActiveAppDialog) {
  const iconProps = { size: 20, 'aria-hidden': true as const };
  if (dialog.tone === 'success') return <CheckCircle2 {...iconProps} />;
  if (dialog.tone === 'danger' && dialog.kind === 'confirm') return <Trash2 {...iconProps} />;
  if (dialog.tone === 'danger' || dialog.tone === 'warning') return <AlertTriangle {...iconProps} />;
  return <Info {...iconProps} />;
}

/** Global modal host rendering branded alert and confirmation dialogs instead of native browser dialogs. */
export const AppDialogHost: React.FC = () => {
  const [dialog, setDialog] = useState<ActiveAppDialog | null>(null);
  const [hoverPrimary, setHoverPrimary] = useState(false);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => subscribeAppDialog(setDialog), []);

  useEffect(() => {
    setHoverPrimary(false);
    if (!dialog) return;

    const timer = window.setTimeout(() => {
      if (dialog.kind === 'confirm' && dialog.tone === 'danger') {
        cancelBtnRef.current?.focus();
      } else {
        confirmBtnRef.current?.focus();
      }
    }, 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        resolveActiveAppDialog(dialog.id, false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dialog]);

  if (!dialog || typeof document === 'undefined') return null;

  const tone = TONE_STYLES[dialog.tone];
  const dismiss = () => resolveActiveAppDialog(dialog.id, false);
  const accept = () => resolveActiveAppDialog(dialog.id, true);

  const modalNode = (
    <div
      role="presentation"
      onClick={dismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(15, 23, 42, 0.48)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        aria-describedby="app-dialog-message"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 20,
          boxShadow: '0 25px 50px rgba(15, 23, 42, 0.22)',
          overflow: 'hidden',
          fontFamily: "'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '18px 22px 14px',
            borderBottom: '1px solid #F1F5F9',
            background: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: tone.badgeBg,
                color: tone.badgeColor,
              }}
            >
              {renderToneIcon(dialog)}
            </div>
            <h2
              id="app-dialog-title"
              style={{
                margin: 0,
                fontFamily: 'Archivo, sans-serif',
                fontSize: 18,
                fontWeight: 700,
                color: '#0F172A',
                lineHeight: 1.3,
              }}
            >
              {dialog.title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={dismiss}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#64748B',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div style={{ padding: '20px 22px' }}>
          <p
            id="app-dialog-message"
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.6,
              color: '#334155',
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
            }}
          >
            {dialog.message}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '14px 22px 20px',
            borderTop: '1px solid #F1F5F9',
          }}
        >
          {dialog.kind === 'confirm' && (
            <button
              ref={cancelBtnRef}
              type="button"
              onClick={dismiss}
              style={{
                padding: '9px 18px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {dialog.cancelLabel || 'Cancel'}
            </button>
          )}
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={accept}
            onMouseEnter={() => setHoverPrimary(true)}
            onMouseLeave={() => setHoverPrimary(false)}
            style={{
              padding: '9px 20px',
              borderRadius: 10,
              border: 'none',
              background: hoverPrimary ? tone.btnHoverBg : tone.btnBg,
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 150ms ease',
            }}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};

export default AppDialogHost;
