import React, { useState } from 'react';
import { FileText, Trash2, Loader2 } from 'lucide-react';
import type { Landlord } from '../hooks/useLandlords';
import { ClientDetailsDrawer, clientInitials, type ClientStatusTone } from './ClientDetailsDrawer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface LandlordDetailsProps {
  landlord: Landlord | null;
  onBack: () => void;
  onEdit?: (landlord: Landlord) => void;
  onDeleteLandlord?: (landlordId: string) => Promise<void> | void;
}

const statusTone = (status?: string): ClientStatusTone => {
  const value = (status || '').toLowerCase();
  if (value === 'active') return 'active';
  if (value === 'pending') return 'pending';
  return 'inactive';
};

export function LandlordDetails({ landlord, onBack, onEdit, onDeleteLandlord }: LandlordDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!landlord) {
    return (
      <ClientDetailsDrawer
        initials="?"
        name="Landlord not found"
        statusLabel="—"
        statusTone="idle"
        subtitle="This record is no longer available"
        tabs={[{ id: 'overview', label: 'Overview' }]}
        activeTab="overview"
        onTabChange={() => undefined}
        onClose={onBack}
      >
        <div className="ll-cd-empty">
          <p className="ll-cd-empty-title">Landlord not found</p>
          <p>Go back to Clients to pick another record.</p>
        </div>
      </ClientDetailsDrawer>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'agreement', label: 'Management Agreement' },
    { id: 'payment', label: 'Payment History' },
    { id: 'referencing', label: 'Referencing' },
    { id: 'notes', label: 'Notes & Activity' },
  ];

  const portfolioLine = [
    landlord.propertyCount ? `${landlord.propertyCount} managed ${landlord.propertyCount === 1 ? 'unit' : 'units'}` : null,
    landlord.totalValue || null,
  ].filter(Boolean).join(' · ') || 'Managed landlord';

  const extra = landlord as Landlord & { notes?: string; company?: string };

  return (
    <ClientDetailsDrawer
      initials={landlord.initials || clientInitials(landlord.name)}
      name={landlord.name}
      statusLabel={landlord.status}
      statusTone={statusTone(landlord.status)}
      subtitle={portfolioLine}
      phone={landlord.phone}
      email={landlord.email}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onClose={onBack}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onEdit ? (
            <button type="button" className="ll-cd-comm" onClick={() => onEdit(landlord)}>
              Edit
            </button>
          ) : null}
          {onDeleteLandlord ? (
            <button
              type="button"
              className="ll-cd-comm"
              style={{ color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2' }}
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={13} style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline-block' }} />
              Delete Client
            </button>
          ) : null}
        </div>
      }
    >
      {activeTab === 'overview' && (
        <>
          <section className="ll-cd-card">
            <h4 className="ll-cd-card-title">Primary contact information</h4>
            <div className="ll-cd-grid">
              <div className="ll-cd-field">
                <span>Email Address</span>
                <strong className="is-mono">{landlord.email || '—'}</strong>
              </div>
              <div className="ll-cd-field">
                <span>Direct Phone (UK)</span>
                <strong className="is-mono">{landlord.phone || '—'}</strong>
              </div>
            </div>
            {extra.company && (
              <div className="ll-cd-field">
                <span>Company</span>
                <strong>{extra.company}</strong>
              </div>
            )}
          </section>

          <section className="ll-cd-card">
            <h4 className="ll-cd-card-title">Mandate portfolio schedule</h4>
            <div className="ll-cd-grid">
              <div className="ll-cd-field">
                <span>Inception Date</span>
                <strong>{landlord.joinDate || '—'}</strong>
              </div>
              <div className="ll-cd-field">
                <span>Last active</span>
                <strong>{landlord.lastActive || '—'}</strong>
              </div>
            </div>
            <div className="ll-cd-grid">
              <div className="ll-cd-field">
                <span>Managed Entities</span>
                <strong className="is-green">
                  {landlord.propertyCount} Managed Unit{landlord.propertyCount === 1 ? '' : 's'}
                </strong>
              </div>
              <div className="ll-cd-field">
                <span>Portfolio value</span>
                <strong>{landlord.totalValue || '—'}</strong>
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === 'agreement' && (
        <section className="ll-cd-navy">
          <div className="ll-cd-navy-top">
            <div className="ll-cd-navy-doc">
              <div className="ll-cd-navy-icon">
                <FileText size={20} />
              </div>
              <div>
                <h3>Full Portfolio Property Management Mandate</h3>
                <p className="ll-cd-doc-ref">No management agreement uploaded</p>
              </div>
            </div>
          </div>
          <div className="ll-cd-navy-metrics">
            <div>
              <span>Start Date</span>
              <strong>{landlord.joinDate || '—'}</strong>
            </div>
            <div>
              <span>Managed units</span>
              <strong>{landlord.propertyCount}</strong>
            </div>
            <div>
              <span>Active tenants</span>
              <strong>{landlord.activeTenants}</strong>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'payment' && (
        <section className="ll-cd-card">
          <h4 className="ll-cd-card-title">Financial ledger</h4>
          <div className="ll-cd-empty" style={{ padding: '12px 0' }}>
            <p className="ll-cd-empty-title">No settlement invoices on file</p>
            <p>Disbursement history will appear here when payments are recorded.</p>
          </div>
        </section>
      )}

      {activeTab === 'referencing' && (
        <section className="ll-cd-card">
          <h4 className="ll-cd-card-title">Landlord due diligence</h4>
          <div className="ll-cd-empty" style={{ padding: '12px 0', textAlign: 'left' }}>
            <p className="ll-cd-empty-title">No AML or ownership records on file</p>
            <p>Checks completed during onboarding will show here.</p>
          </div>
        </section>
      )}

      {activeTab === 'notes' && (
        <section className="ll-cd-card">
          <h4 className="ll-cd-card-title">Internal management notes</h4>
          {extra.notes ? (
            <div className="ll-cd-note">{extra.notes}</div>
          ) : (
            <p className="ll-cd-empty" style={{ padding: 0, textAlign: 'left' }}>No notes on file for this landlord.</p>
          )}
        </section>
      )}

      {/* ── Delete Landlord Confirmation Dialog ─────────────────────────────── */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="rounded-[20px] max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <Trash2 size={24} />
            </div>
            <DialogTitle style={{ fontFamily: "Archivo,sans-serif" }}>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete landlord <strong>{landlord.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <button
              type="button"
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-2"
              onClick={async () => {
                if (!landlord || !onDeleteLandlord) return;
                try {
                  setIsDeleting(true);
                  await onDeleteLandlord(landlord.id);
                  setShowDeleteModal(false);
                  onBack();
                } catch (err) {
                  console.error("Failed to delete landlord:", err);
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              {isDeleting ? "Deleting..." : "Delete Client"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ClientDetailsDrawer>
  );
}
