/**
 * C1 — minimal "Verify your account" panel for landlord-level photo ID + proof of address.
 * Full checklist UX is owned by UI/UX; this ships a functional upload path only.
 */
import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';
import {
  getAccountVerification,
  uploadAccountVerificationFile,
  type VerificationKind,
} from '../services/verificationService';

export function AccountVerificationPanel({ onUpdated }: { onUpdated?: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<VerificationKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<{
    photoId: any;
    proofOfAddress: any;
  }>({ photoId: null, proofOfAddress: null });

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAccountVerification();
      setState({ photoId: data.photoId, proofOfAddress: data.proofOfAddress });
      onUpdated?.();
    } catch (err: any) {
      setError(err?.message || 'Could not load verification status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onPick = async (kind: VerificationKind, file: File | null) => {
    if (!file) return;
    setSaving(kind);
    setError(null);
    try {
      await uploadAccountVerificationFile(kind, file);
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card className="p-4 border border-slate-200 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900" style={{ fontFamily: 'Archivo, sans-serif' }}>
          Verify your account
        </h3>
        <p className="text-xs text-slate-600 mt-1">
          Photo ID and proof of address are asked once and reused for every property before publishing.
        </p>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500">Loading…</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {(
            [
              ['photo_id', 'Photo ID', state.photoId],
              ['proof_of_address', 'Proof of address', state.proofOfAddress],
            ] as const
          ).map(([kind, label, item]) => (
            <div
              key={kind}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
            >
              <div className="min-w-0">
                <span className="text-sm font-medium text-slate-800">
                  {label}
                  {!item?.storagePath && (
                    <span className="text-red-600 ml-0.5" aria-hidden="true">*</span>
                  )}
                </span>
                {item?.storagePath && (
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Submitted
                    {item?.submittedAt
                      ? ` ${new Date(item.submittedAt).toLocaleDateString('en-GB')}`
                      : ''}
                  </p>
                )}
              </div>
              <label className="inline-flex cursor-pointer shrink-0">
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="sr-only"
                  disabled={saving === kind}
                  onChange={(e) => onPick(kind, e.target.files?.[0] || null)}
                />
                <span className="inline-flex h-8 items-center rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  {saving === kind ? 'Uploading…' : item?.storagePath ? 'Replace' : 'Upload'}
                </span>
              </label>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </Card>
  );
}
