import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  Check,
  CreditCard,
  Briefcase,
  Home,
  Users,
  User,
} from 'lucide-react';
import type { PassportStep, PassportStepStatus } from '../data/agentTestPersona';

export interface PassportShareView {
  tenantName?: string;
  tenantEmail?: string;
  propertyAddress?: string;
  notes?: string;
  status?: 'sent' | 'viewed' | 'claimed';
  expiresAt?: string;
}

interface PassportModalProps {
  share: PassportShareView;
  steps: PassportStep[];
  loading?: boolean;
  onClose: () => void;
}

function quoteNote(notes?: string): string {
  const text = (notes || '').trim();
  if (!text) return 'No note provided.';
  return text.startsWith('"') ? text : `"${text}"`;
}

function stepIcon(title: string) {
  const props = { size: 16, className: 'll-pass-step-icon' };
  if (title === 'Identity') return <User {...props} />;
  if (title === 'Employment') return <Briefcase {...props} />;
  if (title === 'Residential History') return <Home {...props} />;
  if (title === 'Income & Financials') return <CreditCard {...props} />;
  return <Users {...props} />;
}

function StatusPill({ status }: { status: PassportStepStatus }) {
  const tone = status === 'Filled' ? 'filled' : status === 'Progress Saved' ? 'saved' : 'idle';
  return (
    <span className={`ll-pass-pill is-${tone}`}>
      <span className="ll-pass-pill-dot" />
      {status}
    </span>
  );
}

function downloadFile(url: string, name: string) {
  const link = window.document.createElement('a');
  link.href = url;
  link.download = name || 'document';
  link.rel = 'noopener';
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
}

export function PassportModal({ share, steps, loading, onClose }: PassportModalProps) {
  const expired = Boolean(share.expiresAt && new Date(share.expiresAt) <= new Date());
  const verified = !expired && (share.status === 'viewed' || share.status === 'claimed');
  const downloadable = steps.filter((step) => step.downloadUrl);

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

  const handleDownloadAll = () => {
    downloadable.forEach((step) => downloadFile(step.downloadUrl as string, `${step.title}.pdf`));
  };

  return createPortal(
    <div className="ll-pass" role="dialog" aria-modal="true" aria-labelledby="ll-pass-email">
      <button type="button" className="ll-pass-overlay" aria-label="Close passport" onClick={onClose} />
      <div className="ll-pass-panel">
        <button type="button" className="ll-pass-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <div className="ll-pass-banner">
          <span className="ll-pass-tag">Referencing passport</span>
          <h2 id="ll-pass-email">{share.tenantEmail || 'Tenant'}</h2>
          <p>
            Applying for <strong>{share.propertyAddress || 'A property'}</strong>
          </p>
          <div className="ll-pass-quote">{quoteNote(share.notes)}</div>
          {verified ? (
            <span className="ll-pass-verified">
              <Check size={12} strokeWidth={3} />
              Verified via Proptii
            </span>
          ) : (
            <span className={`ll-pass-verified is-${expired ? 'expired' : 'pending'}`}>
              {expired ? 'Share expired' : 'Pending verification'}
            </span>
          )}
        </div>

        <div className="ll-pass-steps">
          {loading ? (
            <div className="ll-pass-loading">Loading passport steps…</div>
          ) : (
            steps.map((step) => (
              <div key={step.title} className="ll-pass-step">
                <div className="ll-pass-step-main">
                  <div className="ll-pass-step-icon-wrap">{stepIcon(step.title)}</div>
                  <div>
                    <h4>{step.title}</h4>
                    <p>{step.step}</p>
                  </div>
                </div>
                <div className="ll-pass-step-actions">
                  {step.downloadUrl ? (
                    <button
                      type="button"
                      className="ll-pass-download"
                      onClick={() => downloadFile(step.downloadUrl as string, `${step.title}.pdf`)}
                    >
                      <Download size={14} />
                      Download documents
                    </button>
                  ) : null}
                  <StatusPill status={step.status} />
                </div>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          className="ll-pass-download-all"
          disabled={downloadable.length === 0}
          onClick={handleDownloadAll}
        >
          <Download size={16} />
          Download all documents
        </button>
      </div>
    </div>,
    document.body,
  );
}

export function derivePassportSteps(
  formData?: {
    identity?: { identityProof?: { dataUrl?: string; url?: string } };
    employment?: { proofDocument?: { dataUrl?: string; url?: string } };
    residential?: { proofDocument?: { dataUrl?: string; url?: string } };
    financial?: { proofOfIncomeDocument?: { dataUrl?: string; url?: string } };
    guarantor?: { identityDocument?: { dataUrl?: string; url?: string } };
  },
  status?: 'not-started' | 'in-progress' | 'complete',
): PassportStep[] {
  const fileUrl = (file?: { dataUrl?: string; url?: string }) => file?.dataUrl || file?.url;
  const entries: { title: string; url?: string }[] = [
    { title: 'Identity', url: fileUrl(formData?.identity?.identityProof) },
    { title: 'Employment', url: fileUrl(formData?.employment?.proofDocument) },
    { title: 'Residential History', url: fileUrl(formData?.residential?.proofDocument) },
    { title: 'Income & Financials', url: fileUrl(formData?.financial?.proofOfIncomeDocument) },
    { title: 'Guarantor', url: fileUrl(formData?.guarantor?.identityDocument) },
  ];
  return entries.map((entry, index) => {
    let stepStatus: PassportStepStatus = 'Not Started';
    if (entry.url) stepStatus = 'Filled';
    else if (status === 'in-progress' || status === 'complete') stepStatus = 'Progress Saved';
    return {
      step: `Step ${index + 1} of 5`,
      title: entry.title,
      status: stepStatus,
      downloadUrl: entry.url,
    };
  });
}
