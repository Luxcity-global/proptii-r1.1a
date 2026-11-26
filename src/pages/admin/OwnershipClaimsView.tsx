/**
 * H4 — staff view for duplicate ownership claim cases.
 * Functional (not polished). Does not expose claimant-to-claimant PII beyond case ids.
 */
import React, { useEffect, useState } from 'react';
import { getResolvedApiBaseUrl } from '../../config/apiBaseUrl';
import { getAccessTokenForApiRequest } from '../../services/msalAccessToken';
import { DEEPER_CHECK_DOC_TYPES } from './ownershipClaimConstants';

type ClaimCase = {
  id: string;
  addressDisplay?: string;
  postcode?: string;
  status?: string;
  requestedDocs?: string[];
  incumbentPropertyId?: string;
  claimantPropertyId?: string;
  createdAt?: string | null;
};

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessTokenForApiRequest().catch(() => null);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function apiRoot(): string {
  return getResolvedApiBaseUrl().replace(/\/api$/, '');
}

export default function OwnershipClaimsView() {
  const [cases, setCases] = useState<ClaimCase[]>([]);
  const [allowed, setAllowed] = useState<string[]>([...DEEPER_CHECK_DOC_TYPES]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<Record<string, string[]>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiRoot()}/api/admin/ownership-claims`, {
        headers: await authHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to load claims (${res.status})`);
      const data = await res.json();
      setCases(Array.isArray(data.cases) ? data.cases : []);
      if (Array.isArray(data.allowedDocTypes)) setAllowed(data.allowedDocTypes);
    } catch (err: any) {
      setError(err?.message || 'Could not load ownership claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const toggleDoc = (caseId: string, doc: string) => {
    setSelectedDocs((prev) => {
      const cur = new Set(prev[caseId] || []);
      if (cur.has(doc)) cur.delete(doc);
      else cur.add(doc);
      return { ...prev, [caseId]: [...cur] };
    });
  };

  const requestDocs = async (caseId: string) => {
    setBusyId(caseId);
    try {
      const res = await fetch(`${apiRoot()}/api/admin/ownership-claims/${caseId}/request-docs`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ docs: selectedDocs[caseId] || [] }),
      });
      if (!res.ok) throw new Error(await res.text());
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Request failed');
    } finally {
      setBusyId(null);
    }
  };

  const closeCase = async (
    caseId: string,
    outcome: 'accepted_claimant' | 'accepted_incumbent' | 'closed',
  ) => {
    setBusyId(caseId);
    try {
      const res = await fetch(`${apiRoot()}/api/admin/ownership-claims/${caseId}/close`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ outcome }),
      });
      if (!res.ok) throw new Error(await res.text());
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Close failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="pa-panel">
      <header className="pa-panel-head">
        <h1>Ownership claims</h1>
        <p>Duplicate address cases. Incumbent live listings stay live while a claim is reviewed.</p>
      </header>
      {error && <p className="pa-error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : cases.length === 0 ? (
        <p>No open ownership claim cases.</p>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <article key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {c.addressDisplay || 'Address on file'} {c.postcode ? `· ${c.postcode}` : ''}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Case {c.id} · status <strong>{c.status}</strong>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Incumbent property {c.incumbentPropertyId} · Claimant property {c.claimantPropertyId}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Request deeper-check documents</p>
                <div className="flex flex-wrap gap-2">
                  {allowed.map((doc) => {
                    const on = (selectedDocs[c.id] || []).includes(doc);
                    return (
                      <button
                        key={doc}
                        type="button"
                        onClick={() => toggleDoc(c.id, doc)}
                        className={`text-[11px] px-2 py-1 rounded-full border ${
                          on ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        {doc}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={busyId === c.id || !(selectedDocs[c.id] || []).length}
                  onClick={() => void requestDocs(c.id)}
                  className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#136C9E] text-white disabled:opacity-50"
                >
                  Send document request
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={busyId === c.id}
                  onClick={() => void closeCase(c.id, 'accepted_claimant')}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-700 text-white disabled:opacity-50"
                >
                  Accept claimant (clear hold)
                </button>
                <button
                  type="button"
                  disabled={busyId === c.id}
                  onClick={() => void closeCase(c.id, 'accepted_incumbent')}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 text-white disabled:opacity-50"
                >
                  Accept incumbent (keep hold)
                </button>
                <button
                  type="button"
                  disabled={busyId === c.id}
                  onClick={() => void closeCase(c.id, 'closed')}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-50"
                >
                  Close case
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
