import { useCallback, useEffect, useMemo, useState } from 'react';
import adminDashboardService, { type AdminSignupReport } from '../../services/adminDashboardService';
import { downloadXlsx } from './exportExcel';

const WEEK_OPTIONS = [4, 12, 26];

function formatDay(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatWeek(weekStart: string) {
  return new Date(`${weekStart}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function changeLabel(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 'no change' : `+${current} vs prior 7 days`;
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);
  return `${diff >= 0 ? '+' : ''}${diff} (${pct >= 0 ? '+' : ''}${pct}%) vs prior 7 days`;
}

function downloadSignupsExcel(report: AdminSignupReport) {
  const channelHeaders = ['Channel', 'Sign-ups', 'Share %', 'Last 7 days', 'Landlords', 'Tenants', 'Agents', 'Other'];
  const codeHeaders = ['Code', 'Channel', 'Partner', 'Known code', 'Sign-ups', 'Last 7 days', 'Last sign-up'];
  const weekHeaders = ['Week of', 'Total', ...report.channels.map((c) => c.label)];

  void downloadXlsx(`proptii-signups-by-channel-${report.generatedAt.slice(0, 10)}.xlsx`, [
    {
      name: 'By channel',
      rows: [
        channelHeaders,
        ...report.channels.map((c) => [
          c.label,
          c.count,
          c.pct,
          c.last7Days,
          c.roles.landlord,
          c.roles.tenant,
          c.roles.agent,
          c.roles.other,
        ]),
      ],
    },
    {
      name: 'By code',
      rows: [
        codeHeaders,
        ...report.codes.map((c) => [
          c.code,
          c.channelLabel,
          c.partner || '',
          c.known ? 'yes' : 'no',
          c.count,
          c.last7Days,
          c.lastSignupAt || '',
        ]),
      ],
    },
    {
      name: 'By week',
      rows: [
        weekHeaders,
        ...report.weekly.map((w) => [
          w.weekStart,
          w.total,
          ...report.channels.map((c) => w.byChannel[c.channel] || 0),
        ]),
      ],
    },
  ]);
}

export function SignupsByChannelView() {
  const [weeks, setWeeks] = useState(12);
  const [data, setData] = useState<AdminSignupReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminDashboardService
      .signupsByChannel(weeks)
      .then(setData)
      .catch((err) => setError(err?.message || 'Could not load sign-ups by channel'))
      .finally(() => setLoading(false));
  }, [weeks]);

  useEffect(() => {
    load();
  }, [load]);

  // Weekly table shows only channels with at least one sign-up in the window.
  const weeklyChannels = useMemo(
    () => (data ? data.channels.filter((c) => data.weekly.some((w) => (w.byChannel[c.channel] || 0) > 0)) : []),
    [data],
  );
  const maxWeek = useMemo(() => Math.max(1, ...(data?.weekly.map((w) => w.total) || [0])), [data]);

  return (
    <>
      <div className="pa-header">
        <div>
          <h1>Sign-ups by channel</h1>
          <p>
            New accounts by the /join link they arrived through. Accounts created before tracking started, and test accounts
            marked <code>excludeFromReports</code>, are not counted.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="pa-select"
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            aria-label="Weeks shown"
          >
            {WEEK_OPTIONS.map((w) => (
              <option key={w} value={w}>Last {w} weeks</option>
            ))}
          </select>
          <button type="button" className="pa-btn" onClick={load} disabled={loading}>Refresh</button>
          <button type="button" className="pa-btn" onClick={() => data && downloadSignupsExcel(data)} disabled={!data}>
            Export Excel
          </button>
        </div>
      </div>

      {error && <div className="pa-error">{error}</div>}
      {!data && !error && <div className="pa-loading">Loading sign-ups…</div>}

      {data && (
        <>
          <div className="pa-stats">
            <div className="pa-stat"><span>Sign-ups, all time</span><strong>{data.totals.allTime}</strong></div>
            <div className="pa-stat">
              <span>Last 7 days</span>
              <strong>{data.totals.last7Days}</strong>
              <small style={{ color: '#64748b' }}>{changeLabel(data.totals.last7Days, data.totals.previous7Days)}</small>
            </div>
            <div className="pa-stat">
              <span>Unknown codes</span>
              <strong>{data.channels.find((c) => c.channel === 'unknown')?.count ?? 0}</strong>
              <small style={{ color: '#64748b' }}>mistyped or retired links</small>
            </div>
            <div className="pa-stat"><span>Excluded (tests)</span><strong>{data.totals.excluded}</strong></div>
          </div>

          <div className="pa-card">
            <h2>By channel</h2>
            <div className="pa-table-wrap" style={{ border: 0 }}>
              <table className="pa-table pa-table-static">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Sign-ups</th>
                    <th style={{ minWidth: 160 }}>Share</th>
                    <th>Last 7 days</th>
                    <th>Landlords</th>
                    <th>Tenants</th>
                    <th>Agents</th>
                    <th>Other</th>
                  </tr>
                </thead>
                <tbody>
                  {data.channels.map((c) => (
                    <tr key={c.channel}>
                      <td style={{ fontWeight: 700 }}>{c.label}</td>
                      <td>{c.count}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="pa-bar" style={{ flex: 1 }}><span style={{ width: `${c.pct}%` }} /></div>
                          <span style={{ width: 36, textAlign: 'right' }}>{c.pct}%</span>
                        </div>
                      </td>
                      <td>{c.last7Days}</td>
                      <td>{c.roles.landlord}</td>
                      <td>{c.roles.tenant}</td>
                      <td>{c.roles.agent}</td>
                      <td>{c.roles.other}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pa-card" style={{ marginTop: 16 }}>
            <h2>By week</h2>
            <div className="pa-table-wrap" style={{ border: 0 }}>
              <table className="pa-table pa-table-static">
                <thead>
                  <tr>
                    <th>Week of</th>
                    <th style={{ minWidth: 160 }}>Total</th>
                    {weeklyChannels.map((c) => <th key={c.channel}>{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[...data.weekly].reverse().map((w) => (
                    <tr key={w.weekStart}>
                      <td>{formatWeek(w.weekStart)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="pa-bar" style={{ flex: 1 }}>
                            <span style={{ width: `${Math.round((w.total / maxWeek) * 100)}%` }} />
                          </div>
                          <span style={{ width: 28, textAlign: 'right' }}>{w.total}</span>
                        </div>
                      </td>
                      {weeklyChannels.map((c) => <td key={c.channel}>{w.byChannel[c.channel] || 0}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pa-card" style={{ marginTop: 16 }}>
            <h2>By link code</h2>
            <div className="pa-table-wrap" style={{ border: 0 }}>
              <table className="pa-table pa-table-static">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Channel</th>
                    <th>Partner</th>
                    <th>Sign-ups</th>
                    <th>Last 7 days</th>
                    <th>Last sign-up</th>
                  </tr>
                </thead>
                <tbody>
                  {data.codes.length === 0 && (
                    <tr><td colSpan={6} className="pa-empty">No tracked sign-ups yet.</td></tr>
                  )}
                  {data.codes.map((c) => (
                    <tr key={c.code}>
                      <td>
                        <code>{c.code}</code>
                        {!c.known && c.channel !== 'inbound' && (
                          <span className="pa-pill flagged" style={{ marginLeft: 8 }}>not in link list</span>
                        )}
                      </td>
                      <td>{c.channelLabel}</td>
                      <td>{c.partner || '—'}</td>
                      <td>{c.count}</td>
                      <td>{c.last7Days}</td>
                      <td>{formatDay(c.lastSignupAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p style={{ color: '#64748b', fontSize: 12, marginTop: 12 }}>
            Updated {formatDay(data.generatedAt)}, {new Date(data.generatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.
            Weeks start on Monday (UTC). Roles are each account's current role.
          </p>
        </>
      )}
    </>
  );
}

export default SignupsByChannelView;
