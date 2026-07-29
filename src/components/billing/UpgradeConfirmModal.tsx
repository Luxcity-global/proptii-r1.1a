import React from 'react';

interface Props {
  open: boolean;
  planName: string;
  amountLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/** S4-12 — Proration confirmation before opening Stripe Billing Portal plan change. */
const UpgradeConfirmModal: React.FC<Props> = ({
  open,
  planName,
  amountLabel,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!open) return null;

  return (
    <div
      className="pr-signup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      style={{ zIndex: 200 }}
    >
      <div
        className="pr-signup-modal pr-fade-in"
        style={{ maxWidth: 440, textAlign: 'left' }}
      >
        <h2
          id="upgrade-modal-title"
          style={{
            fontFamily: 'Archivo, sans-serif',
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--pr-navy)',
            marginBottom: 12,
          }}
        >
          Confirm plan change
        </h2>
        <p style={{ fontSize: 15, color: 'var(--pr-muted)', lineHeight: 1.6, marginBottom: 20 }}>
          Upgrading to <strong style={{ color: 'var(--pr-navy)' }}>{planName}</strong> now
          will charge <strong style={{ color: 'var(--pr-orange)' }}>{amountLabel}</strong>{' '}
          today for the remainder of your billing period (Stripe proration).
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="pr-btn pr-btn-primary"
            onClick={onConfirm}
            disabled={loading}
            style={{ flex: 1, minWidth: 120 }}
          >
            {loading ? 'Opening…' : 'Continue in Stripe'}
          </button>
          <button
            type="button"
            className="pr-btn pr-btn-ghost"
            onClick={onCancel}
            disabled={loading}
            style={{ flex: 1, minWidth: 120 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeConfirmModal;
