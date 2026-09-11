import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adminDashboardService, {
  parseAdminDate,
  type AdminCustomerDetail,
  type AdminCustomerRow,
  type AdminOverview,
} from '../../services/adminDashboardService';
import { ADMIN_PATH } from './adminAccess';
import { AdminRoute } from './AdminRoute';
import './adminDashboard.css';

function formatDate(value?: string | null) {
  const iso = parseAdminDate(value);
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusClass(label: string) {
  const l = label.toLowerCase();
  if (l.includes('paid') || l === 'current') return 'paid';
  if (l.includes('trial')) return 'trial';
  if (l.includes('fail')) return 'failed';
  if (l.includes('churn') || l.includes('cancel')) return 'churned';
  return '';
}

function daysSince(value?: string | null) {
  const iso = parseAdminDate(value);
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000);
}

function exportCsv(rows: AdminCustomerRow[], filename: string) {
  const headers = [
    'Name',
    'Email',
    'Role',
    'Tier',
    'Signup date',
    'Last active',
    'Reports lifetime',
    'Reports this month',
    'Account status',
    'Billing status',
    'Flags',
  ];
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.name,
        r.email,
        r.role || '',
        r.tier,
        r.signupDate || '',
        r.lastActive || '',
        r.reportsLifetime,
        r.reportsThisMonth,
        r.accountStatus,
        r.billingStatus,
        r.flags.join('; '),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CustomerList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminCustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [tier, setTier] = useState('all');
  const [activity, setActivity] = useState('all');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [trialExpiring, setTrialExpiring] = useState(false);
  const [sortKey, setSortKey] = useState<keyof AdminCustomerRow>('signupDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminDashboardService
      .listCustomers()
      .then((res) => {
        if (!cancelled) setRows(res.customers || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Could not load customers');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tiers = useMemo(() => {
    const set = new Set(rows.map((r) => r.planId).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (tier !== 'all' && r.planId !== tier) return false;
      if (flaggedOnly && !r.flagged) return false;
      if (trialExpiring) {
        if (!r.trialEndsAt) return false;
        const days = (new Date(r.trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
        if (days > 3) return false;
      }
      if (activity === 'dormant' && daysSince(r.lastActive) < 30) return false;
      if (activity === '7d' && daysSince(r.lastActive) > 7) return false;
      if (activity === '30d' && daysSince(r.lastActive) > 30) return false;
      if (!query) return true;
      const hay = `${r.name} ${r.email} ${r.tier} ${r.accountStatus} ${r.flags.join(' ')}`.toLowerCase();
      return hay.includes(query);
    });
  }, [rows, q, tier, activity, flaggedOnly, trialExpiring]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av || '').localeCompare(String(bv || ''))
        : String(bv || '').localeCompare(String(av || ''));
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: keyof AdminCustomerRow) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const paid = rows.filter((r) => r.accountStatus === 'Paid').length;

  return (
    <>
      <div className="pa-header">
        <div>
          <h1>Customers</h1>
          <p>Who has signed up, what they are on, and whether they are buying.</p>
        </div>
        <div className="pa-actions">
          <button type="button" className="pa-btn" onClick={() => exportCsv(sorted, 'proptii-customers.csv')} disabled={!sorted.length}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="pa-stats">
        <div className="pa-stat"><span>Accounts</span><strong>{rows.length}</strong></div>
        <div className="pa-stat"><span>Paid</span><strong>{paid}</strong></div>
        <div className="pa-stat"><span>Flagged</span><strong>{rows.filter((r) => r.flagged).length}</strong></div>
        <div className="pa-stat"><span>Showing</span><strong>{sorted.length}</strong></div>
      </div>

      <div className="pa-filters">
        <input
          type="search"
          placeholder="Search name, email, address flags…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search customers"
        />
        <select value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Filter by tier">
          <option value="all">All tiers</option>
          {tiers.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={activity} onChange={(e) => setActivity(e.target.value)} aria-label="Filter by activity">
          <option value="all">Any activity</option>
          <option value="7d">Active in 7 days</option>
          <option value="30d">Active in 30 days</option>
          <option value="dormant">Dormant (30+ days)</option>
        </select>
        <label className="pa-filter-check">
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} />
          Flagged
        </label>
        <label className="pa-filter-check">
          <input type="checkbox" checked={trialExpiring} onChange={(e) => setTrialExpiring(e.target.checked)} />
          Trial ≤ 3 days
        </label>
      </div>

      {loading && <div className="pa-loading">Loading customers…</div>}
      {error && <div className="pa-error">{error}</div>}
      {!loading && !error && (
        <div className="pa-table-wrap">
          <table className="pa-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('name')}>Name / Email</th>
                <th onClick={() => toggleSort('tier')}>Tier</th>
                <th onClick={() => toggleSort('signupDate')}>Signup</th>
                <th onClick={() => toggleSort('lastActive')}>Last active</th>
                <th onClick={() => toggleSort('reportsLifetime')}>Reports</th>
                <th onClick={() => toggleSort('accountStatus')}>Account</th>
                <th onClick={() => toggleSort('billingStatus')}>Billing</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="pa-empty">No customers match these filters.</td>
                </tr>
              )}
              {sorted.map((row) => (
                <tr key={row.id} onClick={() => navigate(`${ADMIN_PATH}/customers/${row.id}`)}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{row.name}</div>
                    <div style={{ color: '#64748b' }}>{row.email}</div>
                  </td>
                  <td><span className="pa-pill">{row.tier}</span></td>
                  <td>{formatDate(row.signupDate)}</td>
                  <td>{formatDate(row.lastActive)}</td>
                  <td>{row.reportsLifetime} / {row.reportsThisMonth}</td>
                  <td>
                    <span className={`pa-pill ${statusClass(row.accountStatus)}`}>{row.accountStatus}</span>
                    {row.flagged && <span className="pa-pill flagged" style={{ marginLeft: 6 }}>Flagged</span>}
                  </td>
                  <td><span className={`pa-pill ${statusClass(row.billingStatus)}`}>{row.billingStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function CustomerDetail() {
  const { id = '' } = useParams();
  const [data, setData] = useState<AdminCustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [tag, setTag] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    adminDashboardService
      .getCustomer(id)
      .then(setData)
      .catch((err) => setError(err?.message || 'Could not load customer'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const saveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !note.trim()) return;
    setSaving(true);
    try {
      await adminDashboardService.addNote(id, note.trim(), tag.trim() || undefined);
      setNote('');
      setTag('');
      load();
    } catch (err: any) {
      setError(err?.message || 'Could not save note');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pa-loading">Loading customer…</div>;
  if (error) return <div className="pa-error">{error}</div>;
  if (!data) return <div className="pa-empty">Customer not found.</div>;

  const { customer, profile, subscription } = data;

  return (
    <>
      <Link className="pa-back" to={ADMIN_PATH}>← All customers</Link>
      <div className="pa-header">
        <div>
          <h1>{customer.name}</h1>
          <p>{customer.email} · {customer.role || 'no role'}</p>
        </div>
        <div className="pa-actions">
          <span className={`pa-pill ${statusClass(customer.accountStatus)}`}>{customer.accountStatus}</span>
          <span className={`pa-pill ${statusClass(customer.billingStatus)}`}>{customer.billingStatus}</span>
        </div>
      </div>

      <div className="pa-detail-grid">
        <div className="pa-card">
          <h2>Profile</h2>
          <dl className="pa-dl">
            <dt>Name</dt><dd>{profile.name}</dd>
            <dt>Email</dt><dd>{profile.email}</dd>
            <dt>Phone</dt><dd>{profile.phone || '—'}</dd>
            <dt>Role</dt><dd>{profile.role || '—'}</dd>
            <dt>Role source</dt><dd>{profile.roleSource || '—'}</dd>
            <dt>Household</dt><dd>{profile.householdType || '—'}</dd>
            <dt>Risk appetite</dt><dd>{profile.riskAppetite || '—'}</dd>
            <dt>Commute</dt><dd>{profile.commuteTolerance || '—'}</dd>
            <dt>Budget</dt><dd>{profile.budget != null ? String(profile.budget) : '—'}</dd>
            <dt>Professional at onboarding</dt><dd>{profile.professionalAtOnboarding ? 'Yes' : 'No'}</dd>
          </dl>
        </div>
        <div className="pa-card">
          <h2>Subscription</h2>
          <dl className="pa-dl">
            <dt>Tier</dt><dd>{subscription.tier}</dd>
            <dt>Plan ID</dt><dd>{subscription.planId}</dd>
            <dt>Cycle</dt><dd>{subscription.cycle || '—'}</dd>
            <dt>Trial ends</dt><dd>{formatDate(subscription.trialEndsAt)}</dd>
            <dt>Renewal / expiry</dt><dd>{formatDate(subscription.currentPeriodEnd)}</dd>
            <dt>Pending plan</dt><dd>{subscription.pendingPlan || '—'}</dd>
            <dt>Fit checks</dt>
            <dd>
              {subscription.fitChecksUsed != null
                ? `${subscription.fitChecksUsed}${subscription.fitChecksQuota != null ? ` / ${subscription.fitChecksQuota}` : ''}`
                : '—'}
            </dd>
          </dl>
          <p style={{ marginTop: 14, fontSize: 12, color: '#64748b' }}>
            Billing overrides are founder-only and are not available from this observational view.
          </p>
        </div>
        <div className="pa-card">
          <h2>Usage timeline</h2>
          {data.timeline.length === 0 && <p className="pa-empty" style={{ padding: 8 }}>No events recorded yet.</p>}
          <ul className="pa-timeline">
            {data.timeline.map((ev, i) => (
              <li key={`${ev.type}-${i}`}>
                <time>{formatDate(ev.at)}</time>
                {ev.label}
              </li>
            ))}
          </ul>
        </div>
        <div className="pa-card">
          <h2>Flags & notes</h2>
          {customer.flags.length === 0 && <p style={{ color: '#64748b', fontSize: 13 }}>No automated flags.</p>}
          {customer.flags.map((f) => (
            <div key={f} className="pa-pill flagged" style={{ margin: '0 8px 8px 0' }}>{f}</div>
          ))}
          <ul className="pa-timeline">
            {data.notes.map((n) => (
              <li key={n.id}>
                <time>{formatDate(n.createdAt)} · {n.authorEmail}{n.tag ? ` · ${n.tag}` : ''}</time>
                {n.note}
              </li>
            ))}
          </ul>
          <form className="pa-note-form" onSubmit={saveNote}>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note" />
            <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag (outreach)" style={{ maxWidth: 140 }} />
            <button className="pa-btn pa-btn-primary" type="submit" disabled={saving || !note.trim()}>
              {saving ? 'Saving…' : 'Add'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function Overview() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminDashboardService.overview().then(setData).catch((err) => setError(err?.message || 'Could not load overview'));
  }, []);

  if (error) return <div className="pa-error">{error}</div>;
  if (!data) return <div className="pa-loading">Loading overview…</div>;

  return (
    <>
      <div className="pa-header">
        <div>
          <h1>Tier & cohort</h1>
          <p>Distribution, conversion funnel, and signup-month retention.</p>
        </div>
      </div>
      <div className="pa-stats">
        <div className="pa-stat"><span>Accounts</span><strong>{data.totals.accounts}</strong></div>
        <div className="pa-stat"><span>Paid</span><strong>{data.totals.paid}</strong></div>
        <div className="pa-stat"><span>Trial</span><strong>{data.totals.trial}</strong></div>
        <div className="pa-stat"><span>Flagged</span><strong>{data.totals.flagged}</strong></div>
      </div>
      <div className="pa-detail-grid">
        <div className="pa-card">
          <h2>Tier distribution</h2>
          {data.tierDistribution.map((t) => (
            <div key={t.planId} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{t.label}</span>
                <span>{t.count} ({t.pct}%)</span>
              </div>
              <div className="pa-bar"><span style={{ width: `${t.pct}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="pa-card">
          <h2>Conversion funnel</h2>
          <dl className="pa-dl">
            <dt>Anonymous</dt><dd>{data.funnel.anonymous}</dd>
            <dt>Registered</dt><dd>{data.funnel.registered} ({data.funnel.anonymousToRegisteredPct}%)</dd>
            <dt>Paid</dt><dd>{data.funnel.paid} ({data.funnel.registeredToPaidPct}%)</dd>
            <dt>Trial conversion</dt><dd>{data.trialConversion.ratePct}%</dd>
          </dl>
        </div>
      </div>
      <div className="pa-card" style={{ marginTop: 16 }}>
        <h2>Cohort retention by signup month</h2>
        <div className="pa-table-wrap" style={{ border: 0 }}>
          <table className="pa-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Signups</th>
                <th>Now paid</th>
                <th>Paid %</th>
              </tr>
            </thead>
            <tbody>
              {data.cohorts.length === 0 && (
                <tr><td colSpan={4} className="pa-empty">No signup dates on file yet.</td></tr>
              )}
              {data.cohorts.map((c) => (
                <tr key={c.month}>
                  <td>{c.month}</td>
                  <td>{c.signups}</td>
                  <td>{c.paid}</td>
                  <td>{c.retainedPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function AlertsView() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminCustomerRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminDashboardService
      .alerts()
      .then((res) => setRows((res.alerts || []) as AdminCustomerRow[]))
      .catch((err) => setError(err?.message || 'Could not load alerts'));
  }, []);

  return (
    <>
      <div className="pa-header">
        <div>
          <h1>Abuse / ops alerts</h1>
          <p>Rule-based flags for professional use on a consumer tier, failed payments, and trials about to lapse.</p>
        </div>
        <button type="button" className="pa-btn" onClick={() => exportCsv(rows, 'proptii-alerts.csv')} disabled={!rows.length}>
          Export CSV
        </button>
      </div>
      {error && <div className="pa-error">{error}</div>}
      <div className="pa-table-wrap">
        <table className="pa-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Tier</th>
              <th>Reports</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={4} className="pa-empty">No flagged accounts right now.</td></tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} onClick={() => navigate(`${ADMIN_PATH}/customers/${row.id}`)}>
                <td>
                  <div style={{ fontWeight: 700 }}>{row.name}</div>
                  <div style={{ color: '#64748b' }}>{row.email}</div>
                </td>
                <td>{row.tier}</td>
                <td>{row.reportsLifetime}</td>
                <td>{(row.flags || []).join(' · ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PartnersView() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminCustomerRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminDashboardService
      .partners()
      .then((res) => setRows(res.partners || []))
      .catch((err) => setError(err?.message || 'Could not load partners'));
  }, []);

  return (
    <>
      <div className="pa-header">
        <div>
          <h1>B2B / partners</h1>
          <p>Landlords, agents, and API-tier accounts, kept separate from consumer signups.</p>
        </div>
        <button type="button" className="pa-btn" onClick={() => exportCsv(rows, 'proptii-partners.csv')} disabled={!rows.length}>
          Export CSV
        </button>
      </div>
      {error && <div className="pa-error">{error}</div>}
      <div className="pa-table-wrap">
        <table className="pa-table">
          <thead>
            <tr>
              <th>Name / Email</th>
              <th>Role</th>
              <th>Tier</th>
              <th>Billing</th>
              <th>Fit checks</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="pa-empty">No partner accounts yet.</td></tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} onClick={() => navigate(`${ADMIN_PATH}/customers/${row.id}`)}>
                <td>
                  <div style={{ fontWeight: 700 }}>{row.name}</div>
                  <div style={{ color: '#64748b' }}>{row.email}</div>
                </td>
                <td>{row.role || '—'}</td>
                <td>{row.tier}</td>
                <td><span className={`pa-pill ${statusClass(row.billingStatus)}`}>{row.billingStatus}</span></td>
                <td>{row.reportsLifetime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const ProptiiAdminPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <AdminRoute>
    <div className="pa-root">
      <aside className="pa-sidebar">
        <Link to={ADMIN_PATH} className="pa-brand">
          <img src="/images/Logo-only.png" alt="" />
          <span>Proptii Admin</span>
        </Link>
        <nav className="pa-nav">
          <NavLink to={ADMIN_PATH} end className={({ isActive }) => (isActive ? 'active' : '')}>Customers</NavLink>
          <NavLink to={`${ADMIN_PATH}/overview`} className={({ isActive }) => (isActive ? 'active' : '')}>Tier & cohort</NavLink>
          <NavLink to={`${ADMIN_PATH}/alerts`} className={({ isActive }) => (isActive ? 'active' : '')}>Ops alerts</NavLink>
          <NavLink to={`${ADMIN_PATH}/partners`} className={({ isActive }) => (isActive ? 'active' : '')}>B2B / API</NavLink>
        </nav>
        <div className="pa-sidebar-foot">
          Signed in as {user?.email}
          <br />
          Observational ops view · access is logged
        </div>
      </aside>
      <main className="pa-main">
        <Routes location={location}>
          <Route index element={<CustomerList />} />
          <Route path="overview" element={<Overview />} />
          <Route path="alerts" element={<AlertsView />} />
          <Route path="partners" element={<PartnersView />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="*" element={<Navigate to={ADMIN_PATH} replace />} />
        </Routes>
      </main>
    </div>
    </AdminRoute>
  );
};

export default ProptiiAdminPage;
