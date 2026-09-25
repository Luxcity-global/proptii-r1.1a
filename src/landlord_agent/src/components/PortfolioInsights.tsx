import React, { useMemo, useState } from 'react';
import {
  Bell,
  Building2,
  CalendarDays,
  Check,
  CircleDollarSign,
  Download,
  Home,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import { MarketInsight, Property, UserProfile } from '../App';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { LandlordPageEmptyShell } from './LandlordPageEmptyShell';
import { isNewPortfolioUser } from '../utils/portfolioStatus';
import { useAnalytics, AnalyticsData } from '../hooks/useAnalytics';
import '../styles/analyticsPage.css';

interface PortfolioInsightsProps {
  properties: Property[];
  userProfile: UserProfile | null;
  onBack: () => void;
  marketInsights: MarketInsight[];
  onAddProperty?: () => void;
  isAuthenticated?: boolean;
  onViewSettings?: () => void;
  onViewNotifications?: () => void;
  onAddTenant?: () => void;
  onViewClients?: () => void;
  onViewProperties?: () => void;
}

const TABS = ['overview', 'revenue', 'occupancy', 'tenants', 'market'] as const;
type TabId = (typeof TABS)[number];
const RANGES = ['7d', '30d', '3m', '6m', '1yr'] as const;

function money(value: number): string {
  return `£${Math.round(value).toLocaleString('en-GB')}`;
}

function trendLabel(value?: number | null): string | null {
  if (value == null || Number.isNaN(value)) return null;
  const arrow = value > 0 ? '↑' : value < 0 ? '↓' : '→';
  return `${arrow} ${value > 0 ? '+' : ''}${value}%`;
}

export function PortfolioInsights({
  properties,
  userProfile,
  onAddProperty,
  isAuthenticated = false,
  marketInsights,
  onViewSettings,
  onViewNotifications,
  onAddTenant,
  onViewClients,
  onViewProperties,
}: PortfolioInsightsProps) {
  const isUserAuthenticated = isAuthenticated || Boolean(userProfile);
  const { data, isLoading } = useAnalytics();

  if (!isUserAuthenticated) {
    return <LandlordPageEmptyShell page="insights" variant="guest" />;
  }

  if (isNewPortfolioUser(properties)) {
    return (
      <LandlordPageEmptyShell
        page="insights"
        variant="new-user"
        onAddProperty={onAddProperty}
        userName={userProfile?.name}
      />
    );
  }

  return (
    <PortfolioInsightsContent
      properties={properties}
      userProfile={userProfile}
      analyticsData={data}
      isLoading={isLoading}
      marketInsights={marketInsights}
      onViewSettings={onViewSettings}
      onViewNotifications={onViewNotifications}
      onAddTenant={onAddTenant}
      onViewClients={onViewClients}
      onViewProperties={onViewProperties}
    />
  );
}

function PortfolioInsightsContent({
  properties,
  userProfile,
  analyticsData,
  isLoading,
  marketInsights,
  onViewSettings,
  onViewNotifications,
  onAddTenant,
  onViewClients,
  onViewProperties,
}: {
  properties: Property[];
  userProfile: UserProfile | null;
  analyticsData: AnalyticsData | null;
  isLoading: boolean;
  marketInsights: MarketInsight[];
  onViewSettings?: () => void;
  onViewNotifications?: () => void;
  onAddTenant?: () => void;
  onViewClients?: () => void;
  onViewProperties?: () => void;
}) {
  const [range, setRange] = useState<(typeof RANGES)[number]>('30d');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [paymentSearch, setPaymentSearch] = useState('');

  /** Number of months of chart data to show for the selected range */
  const rangeToMonths: Record<typeof RANGES[number], number> = {
    '7d': 1, '30d': 1, '3m': 3, '6m': 6, '1yr': 12
  };

  const revenue = analyticsData?.revenue;
  const occupancy = analyticsData?.occupancy;
  const tenants = analyticsData?.tenants;

  const occupiedCount = properties.filter((p) => p.status === 'occupied').length;
  const vacantCount = properties.filter((p) => p.status === 'vacant').length;
  const renovatingCount = properties.filter((p) => p.status === 'under-renovation').length;
  const propertyRentTotal = properties.reduce((sum, p) => sum + (p.rent || 0), 0);
  const occupiedRentTotal = properties
    .filter((p) => p.status === 'occupied')
    .reduce((sum, p) => sum + (p.rent || 0), 0);

  const monthlyRevenue = revenue?.totalMonthly || occupiedRentTotal || propertyRentTotal;
  const occupancyRate =
    properties.length > 0 ? Math.round((occupiedCount / properties.length) * 100) : occupancy?.rate || 0;
  const activeTenants = tenants?.totalActive || occupiedCount;
  const netIncome = monthlyRevenue - Math.round(monthlyRevenue * 0.2);
  const outstandingRent = revenue?.outstandingRent || 0;
  const avgRent =
    properties.length > 0
      ? Math.round(propertyRentTotal / properties.length)
      : revenue?.avgRentPerUnit || 0;

  const yieldRows = useMemo(() => {
    if (properties.length === 0) return [];
    return properties.slice(0, 5).map((p) => {
      const annualRent = (p.rent || 0) * 12;
      const estimatedValue = (p as { estimatedValue?: number }).estimatedValue || 200000;
      const yieldPct = estimatedValue > 0 ? parseFloat(((annualRent / estimatedValue) * 100).toFixed(1)) : 0;
      return {
        label: p.address.split(',')[0].trim(),
        value: yieldPct,
      };
    });
  }, [properties]);

  const revenueTrendData = revenue?.revenueTrendData || [];
  const chartData = useMemo(() => {
    const monthsToShow = rangeToMonths[range];
    let rawData: { month: string; revenue: number; expenses: number }[];
    if (revenueTrendData.length > 0) {
      rawData = revenueTrendData.map((d) => ({
        month: d.month,
        revenue: d.collected,
        expenses: Math.round(d.collected * 0.2),
      }));
    } else if (!monthlyRevenue) {
      return [];
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      rawData = Array.from({ length: 12 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
        return {
          month: months[date.getMonth()],
          revenue: monthlyRevenue,
          expenses: Math.round(monthlyRevenue * 0.2),
        };
      });
    }
    // Slice to the number of months the range represents
    return rawData.slice(-Math.min(monthsToShow, rawData.length));
  }, [revenueTrendData, monthlyRevenue, range]);
  const chartCeiling = Math.max(...chartData.map((row) => Math.max(row.revenue || 0, row.expenses || 0)), 1);

  const occupancyData = [
    { name: 'Occupied', value: occupiedCount, color: '#136C9E' },
    { name: 'Vacant', value: vacantCount, color: '#DC5F12' },
    ...(renovatingCount > 0 ? [{ name: 'Renovating', value: renovatingCount, color: '#F59E0B' }] : []),
  ];

  const rawRevenueByProp = revenue?.revenueByProperty || [];
  const revenueByProperty =
    rawRevenueByProp.length > 0
      ? rawRevenueByProp
      : properties.slice(0, 5).map((p) => ({
          name: p.address.split(',')[0].trim(),
          label: p.address.split(',')[0].trim(),
          value: p.rent || 0,
        }));
  const maxRevenueValue = Math.max(...revenueByProperty.map((row: { value: number }) => row.value), 1);

  const payments = (tenants?.payments || []).filter((row: { tenant?: string; property?: string }) => {
    const q = paymentSearch.trim().toLowerCase();
    if (!q) return true;
    return `${row.tenant || ''} ${row.property || ''}`.toLowerCase().includes(q);
  });
  const tenantOverviewRows = tenants?.overview || [];
  const paymentsOnTime = (tenants?.payments || []).filter((row: { status?: string }) =>
    String(row.status || '').toLowerCase().includes('paid'),
  ).length;

  const exportReport = () => {
    const rows = [
      ['Metric', 'Value', 'Range'],
      ['Monthly revenue', String(monthlyRevenue), range],
      ['Occupancy rate', `${occupancyRate}%`, range],
      ['Net income', String(netIncome), range],
      ['Active tenants', String(activeTenants), range],
      ['Outstanding rent', String(outstandingRent), range],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `proptii-analytics-${range}.csv`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ll-an">
      <header className="ll-an-header">
        <div className="ll-an-inner ll-an-header-inner">
          <div>
            <h1>Analytics</h1>
            <p>
              Portfolio performance & insights for <strong>{userProfile?.name || 'your portfolio'}</strong>
            </p>
          </div>
          <div className="ll-an-header-actions">
            {onViewSettings ? (
              <button type="button" className="ll-an-header-icon" title="Analytics settings" onClick={onViewSettings}>
                <Settings size={18} />
              </button>
            ) : null}
            {onViewNotifications ? (
              <button type="button" className="ll-an-header-icon" title="Notifications" onClick={onViewNotifications}>
                <Bell size={18} />
                <span className="ll-an-header-dot" />
              </button>
            ) : null}
            <button type="button" className="ll-an-btn-insights" disabled>
              <span className="ll-an-insights-icon">
                <Sparkles size={12} />
              </span>
              Portfolio Insights
            </button>
            {onAddTenant ? (
              <button type="button" className="ll-an-btn-add" onClick={onAddTenant}>
                <Plus size={16} strokeWidth={2.5} />
                Add Tenant
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="ll-an-inner ll-an-body">
        <div className="ll-an-toolbar">
          <div className="ll-an-tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`ll-an-tab${activeTab === tab ? ' is-active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="ll-an-toolbar-right">
            <div className="ll-an-range">
              {RANGES.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={range === option ? 'is-active' : undefined}
                  onClick={() => setRange(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <button type="button" className="ll-an-export" onClick={exportReport}>
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="ll-an-kpis">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="ll-an-card" style={{ minHeight: 145 }}>
                <div className="ll-an-sk" style={{ width: 28, height: 28, borderRadius: 999, marginBottom: 24 }} />
                <div className="ll-an-sk" style={{ width: 90, height: 10, marginBottom: 10 }} />
                <div className="ll-an-sk" style={{ width: 120, height: 28 }} />
              </div>
            ))}
          </div>
        ) : activeTab === 'revenue' ? (
          <>
            <section className="ll-an-stat-grid">
              <article className="ll-an-stat">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#E9F5FF]">
                  <CircleDollarSign className="h-4 w-4 text-[#136C9E]" />
                </div>
                <p className="ll-an-stat-label" style={{ marginTop: 12 }}>Total revenue</p>
                <p className="ll-an-stat-value">{money(monthlyRevenue)}</p>
              </article>
              <article className="ll-an-stat">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#FFF3E7]">
                  <Wallet className="h-4 w-4 text-[#D07A2A]" />
                </div>
                <p className="ll-an-stat-label" style={{ marginTop: 12 }}>Outstanding rent</p>
                <p className="ll-an-stat-value">{money(outstandingRent)}</p>
              </article>
              <article className="ll-an-stat">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#E9F5FF]">
                  <TrendingUp className="h-4 w-4 text-[#136C9E]" />
                </div>
                <p className="ll-an-stat-label" style={{ marginTop: 12 }}>MoM growth</p>
                <p className="ll-an-stat-value">{revenue?.momGrowth ?? 0}%</p>
              </article>
              <article className="ll-an-stat">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#E9F5FF]">
                  <Building2 className="h-4 w-4 text-[#136C9E]" />
                </div>
                <p className="ll-an-stat-label" style={{ marginTop: 12 }}>Avg rent / unit</p>
                <p className="ll-an-stat-value">{money(avgRent)}</p>
              </article>
            </section>

            <section className="ll-an-grid-8-4" style={{ marginTop: 20 }}>
              <article className="ll-an-card">
                <h3>Revenue Trends</h3>
                <p className="ll-an-card-sub">Collected vs projected monthly performance</p>
                <div className="ll-an-chart">
                  {revenueTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueTrendData} margin={{ left: 8, right: 8, top: 8 }}>
                        <CartesianGrid stroke="#EEF1F5" vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip />
                        <Bar dataKey="collected" fill="#136C9E" radius={[3, 3, 0, 0]} barSize={10} />
                        <Bar dataKey="projected" fill="#F6B27D" radius={[3, 3, 0, 0]} barSize={10} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="ll-an-card-sub">Revenue charts appear once rental transactions are logged.</p>
                  )}
                </div>
              </article>
              <article className="ll-an-card">
                <h3>Revenue by Property</h3>
                <div style={{ marginTop: 16 }}>
                  {revenueByProperty.map((row: { name?: string; label?: string; value: number }) => (
                    <div key={row.name || row.label} style={{ marginBottom: 16 }}>
                      <div className="ll-an-yield-row" style={{ marginTop: 0 }}>
                        <span className="truncate">{row.name || row.label}</span>
                        <div className="ll-an-yield-track">
                          <div
                            className="ll-an-yield-fill"
                            style={{ width: `${(row.value / maxRevenueValue) * 100}%`, background: '#136C9E' }}
                          />
                        </div>
                        <span>{money(row.value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {onViewProperties ? (
                  <button type="button" className="ll-an-link" onClick={onViewProperties}>
                    VIEW ALL ASSETS
                  </button>
                ) : null}
              </article>
            </section>

            <section className="ll-an-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                <h3>Rent Payment Status</h3>
                <div style={{ position: 'relative', width: 256 }}>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="text"
                    value={paymentSearch}
                    onChange={(event) => setPaymentSearch(event.target.value)}
                    placeholder="Search tenants..."
                    className="w-full rounded-xl border border-[#E7EBF0] bg-[#F9FAFB] py-2 pl-10 pr-3 text-sm"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="ll-an-table">
                  <thead>
                    <tr>
                      <th>TENANT</th>
                      <th>PROPERTY</th>
                      <th>AMOUNT</th>
                      <th>DUE DATE</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((row: any) => (
                      <tr key={`${row.tenant}-${row.amount}-${row.dueDate}`}>
                        <td>{row.tenant}</td>
                        <td>{row.property}</td>
                        <td>{row.amount}</td>
                        <td>{row.dueDate}</td>
                        <td>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="ll-an-card-sub" style={{ marginTop: 12 }}>
                Showing {payments.length} payment records
              </p>
            </section>
          </>
        ) : activeTab === 'occupancy' ? (
          <section className="ll-an-stat-grid">
            <article className="ll-an-stat">
              <p className="ll-an-stat-label">Occupancy rate</p>
              <p className="ll-an-stat-value">{occupancyRate}%</p>
              <p className="ll-an-stat-sub">{occupiedCount} / {properties.length} units</p>
            </article>
            <article className="ll-an-stat">
              <p className="ll-an-stat-label">Vacant units</p>
              <p className="ll-an-stat-value">{occupancy?.vacantUnits ?? vacantCount}</p>
              <p className="ll-an-stat-sub">Currently empty</p>
            </article>
            <article className="ll-an-stat">
              <p className="ll-an-stat-label">Avg. days vacant</p>
              <p className="ll-an-stat-value">{occupancy?.avgDaysVacant ?? '—'}</p>
            </article>
            <article className="ll-an-stat">
              <p className="ll-an-stat-label">Renewal rate</p>
              <p className="ll-an-stat-value">{occupancy?.renewalRate ?? 0}%</p>
              <p className="ll-an-stat-sub">Tenants renewing</p>
            </article>
          </section>
        ) : activeTab === 'tenants' ? (
          <>
            <section className="ll-an-stat-grid">
              <article className="ll-an-stat">
                <Users className="h-4 w-4 text-[#136C9E]" />
                <p className="ll-an-stat-label" style={{ marginTop: 8 }}>Total tenants</p>
                <p className="ll-an-stat-value">{activeTenants}</p>
                <p className="ll-an-stat-sub">Active tenancies</p>
              </article>
              <article className="ll-an-stat">
                <Smile className="h-4 w-4 text-[#D07A2A]" />
                <p className="ll-an-stat-label" style={{ marginTop: 8 }}>Satisfaction</p>
                <p className="ll-an-stat-value">{tenants?.satisfactionScore ? `${tenants.satisfactionScore} / 5` : '—'}</p>
              </article>
              <article className="ll-an-stat">
                <CalendarDays className="h-4 w-4 text-[#136C9E]" />
                <p className="ll-an-stat-label" style={{ marginTop: 8 }}>Avg. tenancy</p>
                <p className="ll-an-stat-value">{tenants?.avgTenancyMonths ? `${tenants.avgTenancyMonths} months` : '—'}</p>
              </article>
              <article className="ll-an-stat">
                <Wrench className="h-4 w-4 text-[#D14343]" />
                <p className="ll-an-stat-label" style={{ marginTop: 8 }}>Open requests</p>
                <p className="ll-an-stat-value">{tenants?.openRequests ?? 0}</p>
                <p className="ll-an-stat-sub">Maintenance</p>
              </article>
            </section>
            <section className="ll-an-card" style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3>Tenant Overview</h3>
                <span className="inline-flex items-center gap-2 rounded-md border border-[#E7EBF0] px-3 py-1.5 text-xs font-semibold text-[#6B7280]">
                  <SlidersHorizontal className="h-3 w-3" />
                  Filters
                </span>
              </div>
              <table className="ll-an-table">
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>STATUS</th>
                    <th>PROPERTY</th>
                  </tr>
                </thead>
                <tbody>
                  {tenantOverviewRows.map((row: any) => (
                    <tr key={row.email || row.name}>
                      <td>
                        <p className="font-semibold">{row.name}</p>
                        <p className="ll-an-card-sub">{row.email}</p>
                      </td>
                      <td>{row.status}</td>
                      <td>{row.property}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {onViewClients ? (
                <button type="button" className="ll-an-link" onClick={onViewClients}>
                  View All Portfolio Tenants
                </button>
              ) : null}
            </section>
          </>
        ) : activeTab === 'market' ? (
          <section className="ll-an-market">
            {marketInsights.length === 0 ? (
              <article className="ll-an-card">
                <h3>Market</h3>
                <p className="ll-an-card-sub">Market insights for this portfolio will appear here when available.</p>
              </article>
            ) : (
              marketInsights.map((insight) => (
                <article key={insight.id} className="ll-an-market-item">
                  <h4>{insight.title}</h4>
                  <p>{insight.description}</p>
                </article>
              ))
            )}
          </section>
        ) : (
          <>
            <section className="ll-an-kpis">
              <article className="ll-an-kpi is-blue">
                <div className="ll-an-kpi-top">
                  <span className="ll-an-kpi-icon">£</span>
                  {trendLabel(revenue?.momGrowth) ? <span className="ll-an-kpi-chip">{trendLabel(revenue?.momGrowth)}</span> : null}
                </div>
                <div>
                  <div className="ll-an-kpi-label">Monthly revenue</div>
                  <div className="ll-an-kpi-value">{money(monthlyRevenue)}</div>
                  <div className="ll-an-kpi-sub">Gross rental income</div>
                </div>
              </article>
              <article className="ll-an-kpi is-orange">
                <div className="ll-an-kpi-top">
                  <span className="ll-an-kpi-icon">
                    <Home size={14} />
                  </span>
                </div>
                <div>
                  <div className="ll-an-kpi-label">Occupancy rate</div>
                  <div className="ll-an-kpi-value">{occupancyRate}%</div>
                  <div className="ll-an-kpi-sub">
                    {occupiedCount}/{properties.length} units active
                  </div>
                </div>
              </article>
              <article className="ll-an-kpi is-green">
                <div className="ll-an-kpi-top">
                  <span className="ll-an-kpi-icon">
                    <TrendingUp size={14} />
                  </span>
                </div>
                <div>
                  <div className="ll-an-kpi-label">Net income</div>
                  <div className="ll-an-kpi-value">{money(netIncome)}</div>
                  <div className="ll-an-kpi-sub">After operational expenses</div>
                </div>
              </article>
              <article className="ll-an-kpi is-violet">
                <div className="ll-an-kpi-top">
                  <span className="ll-an-kpi-icon">
                    <Users size={14} />
                  </span>
                </div>
                <div>
                  <div className="ll-an-kpi-label">Active tenants</div>
                  <div className="ll-an-kpi-value">{activeTenants}</div>
                  <div className="ll-an-kpi-sub">{vacantCount} units currently vacant</div>
                </div>
              </article>
            </section>

            <section className="ll-an-grid-8-4">
              <article className="ll-an-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h3>Revenue vs Expenses</h3>
                    <p className="ll-an-card-sub">Financial performance for last 6 months (£)</p>
                  </div>
                  <div className="ll-an-legend">
                    <span>
                      <i className="ll-an-dot blue" /> Revenue
                    </span>
                    <span>
                      <i className="ll-an-dot orange" /> Expenses
                    </span>
                  </div>
                </div>
                <div className="ll-an-chart">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="llAnRevFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#136C9E" stopOpacity={0.18} />
                            <stop offset="100%" stopColor="#136C9E" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#EEF1F5" vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis
                          domain={[0, Math.ceil((chartCeiling * 1.25) / 1000) * 1000 || 1000]}
                          tick={{ fill: '#9CA3AF', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => `£${Math.round(Number(value) / 1000)}k`}
                          width={42}
                        />
                        <Tooltip formatter={(value: number) => money(Number(value))} />
                        <Area type="monotone" dataKey="revenue" stroke="#136C9E" strokeWidth={2.5} fill="url(#llAnRevFill)" dot={{ fill: '#136C9E', r: 3 }} />
                        <Line type="monotone" dataKey="expenses" stroke="#DC5F12" strokeWidth={2} strokeDasharray="4 3" dot={{ fill: '#DC5F12', r: 2.5 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="ll-an-card-sub">Revenue curves appear as rental transactions are logged.</p>
                  )}
                </div>
              </article>

              <article className="ll-an-card">
                <h3>Portfolio Status</h3>
                <p className="ll-an-card-sub">Unit occupancy breakdown</p>
                <div className="ll-an-donut-wrap" style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={occupancyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {occupancyData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {occupancyData.map((item) => (
                  <div key={item.name} className="ll-an-status-row">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <i className="ll-an-dot" style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </article>
            </section>

            <section className="ll-an-grid-8-4">
              <article className="ll-an-card">
                <h3>Yield by Property</h3>
                <p className="ll-an-card-sub">Annual gross yield %</p>
                {yieldRows.map((row, index) => (
                  <div key={row.label} className="ll-an-yield-row">
                    <span className="truncate">{row.label}</span>
                    <div className="ll-an-yield-track">
                      <div
                        className="ll-an-yield-fill"
                        style={{
                          width: `${Math.min((row.value / 12) * 100, 100)}%`,
                          background: index % 2 === 0 ? '#136C9E' : '#DC5F12',
                        }}
                      />
                    </div>
                    <span>{row.value}%</span>
                  </div>
                ))}
              </article>
              <div className="ll-an-mini-stack">
                <article className="ll-an-mini">
                  <div>
                    <strong>{paymentsOnTime || occupiedCount}</strong>
                    <p>Rent payments up to date</p>
                  </div>
                  <span className="ll-an-mini-icon is-green">
                    <Check size={20} strokeWidth={2.5} />
                  </span>
                </article>
                <article className="ll-an-mini">
                  <div>
                    <strong>{occupancy?.avgDaysVacant != null ? `${occupancy.avgDaysVacant} days` : '—'}</strong>
                    <p>Avg. time-to-let</p>
                  </div>
                  <span className="ll-an-mini-icon is-blue">
                    <CalendarDays size={20} />
                  </span>
                </article>
                <article className="ll-an-mini">
                  <div>
                    <strong>
                      {tenants?.satisfactionScore ? (
                        <>
                          {tenants.satisfactionScore} <span style={{ fontSize: 14, fontWeight: 500, color: '#94a3b8' }}>/5</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </strong>
                    <p>Avg. tenant satisfaction</p>
                  </div>
                  <span className="ll-an-mini-icon is-amber">
                    <Star size={20} fill="currentColor" />
                  </span>
                </article>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
