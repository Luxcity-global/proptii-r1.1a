import React, { useMemo, useState } from 'react';
import { Download, CircleDollarSign, Home, TrendingUp, Users, Building2, Search, MoreVertical, Wallet, Smile, CalendarDays, Wrench, SlidersHorizontal } from 'lucide-react';
import { Property, UserProfile, MarketInsight } from '../App';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { LandlordPageEmptyShell } from './LandlordPageEmptyShell';
import { isNewPortfolioUser } from '../utils/portfolioStatus';
import { useAnalytics, AnalyticsData } from '../hooks/useAnalytics';

interface PortfolioInsightsProps {
  properties: Property[];
  userProfile: UserProfile | null;
  onBack: () => void;
  marketInsights: MarketInsight[];
  onAddProperty?: () => void;
  isAuthenticated?: boolean;
}

export function PortfolioInsights({
  properties,
  userProfile,
  onAddProperty,
  isAuthenticated = false,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-[#1776B6] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[#6B7280] font-medium">Aggregating portfolio analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <PortfolioInsightsContent
      properties={properties}
      userProfile={userProfile}
      onAddProperty={onAddProperty}
      analyticsData={data}
    />
  );
}

function PortfolioInsightsContent({
  properties,
  userProfile,
  analyticsData,
}: Pick<PortfolioInsightsProps, 'properties' | 'userProfile' | 'onAddProperty'> & { analyticsData: AnalyticsData | null }) {
  const [range, setRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const revenue = analyticsData?.revenue;
  const occupancy = analyticsData?.occupancy;
  const tenants = analyticsData?.tenants;

  const yieldRows = useMemo(() => {
    if (properties.length === 0) return [];
    return properties.slice(0, 5).map((p) => {
      // Calculate estimated annual yield percentage based on rent vs typical unit value (~£200k baseline)
      const annualRent = (p.rent || 0) * 12;
      const estimatedValue = (p as any).estimatedValue || 200000;
      const yieldPct = parseFloat(((annualRent / estimatedValue) * 100).toFixed(1));
      return {
        label: p.address.split(',')[0].trim(),
        value: yieldPct > 0 ? yieldPct : 5.0
      };
    });
  }, [properties]);

  const revenueTrendData = revenue?.revenueTrendData || [];
  const months = revenueTrendData.map(d => d.month);
  
  // For the small line chart
  const chartData = revenueTrendData.map(d => ({
    month: d.month,
    revenue: d.collected,
    expenses: Math.round(d.collected * 0.2),
  }));

  const occupiedCount = properties.filter(p => p.status === 'occupied').length;
  const vacantCount = properties.filter(p => p.status === 'vacant').length;
  const renovatingCount = properties.filter(p => p.status === 'under-renovation').length;

  const occupancyData = [
    { name: 'Occupied', value: occupiedCount, color: '#1776B6' },
    { name: 'Vacant', value: vacantCount, color: '#F57B1D' },
    ...(renovatingCount > 0 ? [{ name: 'Renovating', value: renovatingCount, color: '#F59E0B' }] : [])
  ];

  const rawRevenueByProp = revenue?.revenueByProperty || [];
  const revenueByProperty = rawRevenueByProp.length > 0 
    ? rawRevenueByProp 
    : properties.slice(0, 5).map((p) => ({
        label: p.address.split(',')[0].trim(),
        value: p.rent || 0
      }));
  const maxRevenueValue = Math.max(...revenueByProperty.map((row) => row.value), 1);

  const calcRate = properties.length > 0 ? Math.round((occupiedCount / properties.length) * 100) : (occupancy?.rate || 0);

  const payments = tenants?.payments || [];

  const tenantOverviewRows = tenants?.overview || [];

  const avgRentCalc = properties.length > 0 
    ? Math.round(properties.reduce((sum, p) => sum + (p.rent || 0), 0) / properties.length)
    : (revenue?.avgRentPerUnit || 0);

  const avgYieldCalc = yieldRows.length > 0 
    ? parseFloat((yieldRows.reduce((sum, r) => sum + r.value, 0) / yieldRows.length).toFixed(1))
    : 5.0;

  return (
    <div className="min-h-screen bg-[#F2F4F7] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[40px] font-semibold leading-none text-[#D06D22]">Analytics</h1>
            <p className="mt-2 text-base text-[#6B7280]">
              Portfolio performance &amp; insights for {userProfile?.name || 'Testing with Aisha'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            {[
              { id: '7d', label: '7d' },
              { id: '30d', label: '30d' },
              { id: '3m', label: '3m' },
              { id: '6m', label: '6m' },
              { id: '1yr', label: '1yr' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setRange(option.id)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  range === option.id
                    ? 'border-[#1776B6] bg-[#1776B6] text-white'
                    : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB]'
                }`}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              className="ml-1 inline-flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-4 py-1.5 text-sm text-[#374957] hover:bg-[#F9FAFB]"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          {['overview', 'revenue', 'occupancy', 'tenants', 'market'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-5 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-[#1776B6] text-white'
                  : 'bg-white text-[#6B7280] hover:bg-[#F3F4F6]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'revenue' ? (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#E9F5FF]">
                    <CircleDollarSign className="h-4 w-4 text-[#1776B6]" />
                  </div>
                  <span className="rounded-full bg-[#EAFBF0] px-2 py-0.5 text-xs font-semibold text-[#1F9D64]">+12.5%</span>
                </div>
                <p className="mt-5 text-xs font-semibold tracking-[0.12em] text-[#6B7280]">TOTAL REVENUE</p>
                <p className="mt-2 text-3xl sm:text-[40px] font-semibold leading-none text-[#1F2937] break-words">£{(revenue?.totalMonthly || 0).toLocaleString()}</p>
              </article>

              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#FFF3E7]">
                    <Wallet className="h-4 w-4 text-[#D07A2A]" />
                  </div>
                  <span className="rounded-full bg-[#FFF0E6] px-2 py-0.5 text-xs font-semibold text-[#D96A1D]">HIGH ALERT</span>
                </div>
                <p className="mt-5 text-xs font-semibold tracking-[0.12em] text-[#6B7280]">OUTSTANDING RENT</p>
                <p className="mt-2 text-3xl sm:text-[40px] font-semibold leading-none text-[#1F2937] break-words">£{(revenue?.outstandingRent || 0).toLocaleString()}</p>
              </article>

              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#E9F5FF]">
                  <TrendingUp className="h-4 w-4 text-[#1776B6]" />
                </div>
                <p className="mt-5 text-xs font-semibold tracking-[0.12em] text-[#6B7280]">MOM GROWTH</p>
                <p className="mt-2 text-3xl sm:text-[40px] font-semibold leading-none text-[#1F2937] break-words">{revenue?.momGrowth || 0}%</p>
              </article>

              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#E9F5FF]">
                  <Building2 className="h-4 w-4 text-[#1776B6]" />
                </div>
                <p className="mt-5 text-xs font-semibold tracking-[0.12em] text-[#6B7280]">AVG RENT / UNIT</p>
                <p className="mt-2 text-3xl sm:text-[40px] font-semibold leading-none text-[#1F2937] break-words">£{(revenue?.avgRentPerUnit || 0).toLocaleString()}</p>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm min-w-0">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-2xl sm:text-[32px] font-semibold leading-none text-[#1F2937]">Revenue Trends</h3>
                    <p className="mt-1 text-xs sm:text-sm text-[#9CA3AF]">Collected vs Projected Monthly Performance</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs font-semibold text-[#6B7280]">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#1776B6]" />COLLECTED</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#F6B27D]" />PROJECTED</span>
                  </div>
                </div>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueTrendData} margin={{ left: 8, right: 8, top: 8 }}>
                      <CartesianGrid stroke="#EEF1F5" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip />
                      <Bar dataKey="collected" fill="#1776B6" radius={[3, 3, 0, 0]} barSize={10} />
                      <Bar dataKey="projected" fill="#F6B27D" radius={[3, 3, 0, 0]} barSize={10} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm min-w-0">
                <h3 className="text-2xl sm:text-[32px] font-semibold leading-none text-[#1F2937]">Revenue by Property</h3>
                <div className="mt-6 space-y-6">
                  {revenueByProperty.map((row) => (
                    <div key={row.name}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-[#374957]">
                        <span className="truncate">{row.name}</span>
                        <span className="shrink-0 text-[#1776B6]">£{row.value}K</span>
                      </div>
                      <div className="h-3 rounded-full bg-[#EDF2F7]">
                        <div
                          className="h-full rounded-full bg-[#1776B6]"
                          style={{ width: `${(row.value / maxRevenueValue) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-8 w-full rounded-lg border border-[#E7EBF0] bg-white py-3 text-xs font-semibold tracking-[0.14em] text-[#D96A1D]"
                >
                  VIEW ALL ASSETS
                </button>
              </article>
            </section>

            <section className="rounded-2xl border border-[#E7EBF0] bg-white shadow-sm min-w-0">
              <div className="flex flex-col gap-3 border-b border-[#EEF1F5] p-5 md:flex-row md:items-center md:justify-between">
                <h3 className="text-2xl sm:text-[32px] font-semibold leading-none text-[#1F2937]">Rent Payment Status</h3>
                <div className="relative w-full md:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="text"
                    value=""
                    readOnly
                    placeholder="Search tenants..."
                    className="w-full rounded-xl border border-[#E7EBF0] bg-[#F9FAFB] py-2 pl-10 pr-3 text-sm text-[#6B7280]"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-left text-xs font-semibold tracking-[0.08em] text-[#6B7280]">
                      <th className="px-4 py-3">TENANT</th>
                      <th className="px-4 py-3">PROPERTY</th>
                      <th className="px-4 py-3">AMOUNT</th>
                      <th className="px-4 py-3">DUE DATE</th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((row) => (
                      <tr key={`${row.tenant}-${row.amount}`} className="border-t border-[#EEF1F5] text-sm text-[#1F2937]">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#ECFDF3] text-xs font-semibold text-[#6B7280]">
                              {row.initials}
                            </span>
                            <span className="font-semibold">{row.tenant}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[#4B5563]">{row.property}</td>
                        <td className="px-4 py-4 font-semibold">{row.amount}</td>
                        <td className="px-4 py-4 text-[#4B5563]">{row.dueDate}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${row.statusClass}`}>{row.status}</span>
                        </td>
                        <td className="px-4 py-4">
                          <MoreVertical className="h-4 w-4 text-[#6B7280]" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-[#EEF1F5] p-4 text-sm text-[#6B7280]">
                <span>Showing {payments.length} payment records</span>
                <div className="flex items-center gap-2">
                  <button type="button" className="h-7 w-7 rounded border border-[#E7EBF0] text-[#6B7280]">‹</button>
                  <button type="button" className="h-7 w-7 rounded border border-[#E7EBF0] text-[#6B7280]">›</button>
                </div>
              </div>
            </section>
          </>
        ) : activeTab === 'occupancy' ? (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-[#1F2937]">Occupancy Rate</p>
                  <span className="text-xs font-semibold text-[#D14343]">▼ -65.0%</span>
                </div>
                <p className="mt-3 text-[34px] font-semibold leading-none text-[#1F2937]">{occupancy?.rate || 0}%</p>
                <p className="mt-1 text-xs font-semibold text-[#6B7280]">vs 79% market avg</p>
              </article>

              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-[#1F2937]">Vacant Units</p>
                  <span className="text-xs font-semibold text-[#D14343]">▼ -50.0%</span>
                </div>
                <p className="mt-3 text-[34px] font-semibold leading-none text-[#1F2937]">{occupancy?.vacantUnits || 0}</p>
                <p className="mt-1 text-xs font-semibold text-[#6B7280]">Currently empty</p>
              </article>

              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-[#1F2937]">Avg. Days Vacant</p>
                  <span className="text-xs font-semibold text-[#D14343]">▼ -50.0%</span>
                </div>
                <p className="mt-3 text-[34px] font-semibold leading-none text-[#1F2937]">{occupancy?.avgDaysVacant || 0}</p>
                <p className="mt-1 text-xs font-semibold text-[#6B7280]">days vs 28 market avg</p>
              </article>

              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-[#1F2937]">Renewal Rate</p>
                  <span className="text-xs font-semibold text-[#22A06B]">▲ +4.5%</span>
                </div>
                <p className="mt-3 text-[34px] font-semibold leading-none text-[#1F2937]">{occupancy?.renewalRate || 0}%</p>
                <p className="mt-1 text-xs font-semibold text-[#6B7280]">tenants renewing</p>
              </article>
            </section>

            {/* Removed Occupancy Trend & Time To Let mock data cards */}
          </>
        ) : activeTab === 'tenants' ? (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#E9F5FF]">
                    <Users className="h-4 w-4 text-[#1776B6]" />
                  </div>
                  <span className="text-xs font-semibold text-[#9CA3AF]">→</span>
                </div>
                <p className="mt-3 text-sm text-[#6B7280]">Total Tenants</p>
                <p className="mt-1 text-[44px] font-semibold leading-none text-[#1F2937]">{tenants?.totalActive || 0}</p>
                <p className="text-xs text-[#9CA3AF]">Active tenancies</p>
              </article>

              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#FFF3E7]">
                    <Smile className="h-4 w-4 text-[#D07A2A]" />
                  </div>
                  <span className="text-xs font-semibold text-[#22A06B]">▲ +5.0%</span>
                </div>
                <p className="mt-3 text-sm text-[#6B7280]">Satisfaction</p>
                <p className="mt-1 text-[44px] font-semibold leading-none text-[#1F2937]">{tenants?.satisfactionScore || 0} / 5</p>
                <p className="text-xs text-[#9CA3AF]">Avg. rating</p>
              </article>

              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#E9F5FF]">
                    <CalendarDays className="h-4 w-4 text-[#1776B6]" />
                  </div>
                  <span className="text-xs font-semibold text-[#22A06B]">▲ +8.0%</span>
                </div>
                <p className="mt-3 text-sm text-[#6B7280]">Avg. Tenancy</p>
                <p className="mt-1 text-[44px] font-semibold leading-none text-[#1F2937]">{tenants?.avgTenancyMonths || 0} months</p>
                <p className="text-xs text-[#9CA3AF]">Duration</p>
              </article>

              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#FFF1F1]">
                    <Wrench className="h-4 w-4 text-[#D14343]" />
                  </div>
                  <span className="text-xs font-semibold text-[#D14343]">▼ -25.0%</span>
                </div>
                <p className="mt-3 text-sm text-[#6B7280]">Open Requests</p>
                <p className="mt-1 text-[44px] font-semibold leading-none text-[#1F2937]">{tenants?.openRequests || 0}</p>
                <p className="text-xs text-[#9CA3AF]">Maintenance</p>
              </article>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-4">
              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-[18px] font-semibold text-[#1F2937]">Tenant Overview</h3>
                  <button type="button" className="inline-flex items-center gap-2 rounded-md border border-[#E7EBF0] px-3 py-1.5 text-xs font-semibold text-[#6B7280]">
                    <SlidersHorizontal className="h-3 w-3" />
                    Filters
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-[#EEF1F5] text-left text-xs font-semibold tracking-[0.1em] text-[#6B7280]">
                        <th className="px-3 py-3">NAME</th>
                        <th className="px-3 py-3">STATUS</th>
                        <th className="px-3 py-3">PROPERTY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenantOverviewRows.map((row) => (
                        <tr key={row.email} className="border-b border-[#EEF1F5]">
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E8EEF5] text-xs font-semibold text-[#1776B6]">
                                {row.initials}
                              </span>
                              <div>
                                <p className="font-semibold text-[#1F2937]">{row.name}</p>
                                <p className="text-xs text-[#6B7280]">{row.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${row.statusClass}`}>{row.status}</span>
                          </td>
                          <td className="px-3 py-4">
                            <p className="font-semibold text-[#1F2937]">{row.property}</p>
                            <p className="text-xs text-[#6B7280]">{row.sub}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="pt-4 text-center text-sm font-semibold text-[#D96A1D]">
                  View All Portfolio Tenants
                </div>
              </article>
            </section>
          </>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E9F5FF]">
                <CircleDollarSign className="h-4 w-4 text-[#1776B6]" />
              </div>
              <span className="text-sm font-semibold text-[#22A06B]">+3.2%</span>
            </div>
            <p className="mt-3 text-sm text-[#6B7280]">Monthly Revenue</p>
            <p className="mt-2 text-4xl font-semibold text-[#1F2937]">£10,000</p>
            <p className="text-xs text-[#9CA3AF]">Gross rental income</p>
            <div className="mt-5 h-7">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line type="monotone" dataKey="revenue" stroke="#1776B6" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EAFBF0]">
                <Home className="h-4 w-4 text-[#2FB36D]" />
              </div>
              <span className="text-sm font-semibold text-[#D14343]">-66.0%</span>
            </div>
            <p className="mt-3 text-sm text-[#6B7280]">Occupancy Rate</p>
            <p className="mt-2 text-4xl font-semibold text-[#1F2937]">14%</p>
            <p className="text-xs text-[#9CA3AF]">1 / 7 units</p>
            <div className="mt-5 h-7">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line type="monotone" dataKey="expenses" stroke="#2FB36D" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF3E7]">
                <TrendingUp className="h-4 w-4 text-[#D07A2A]" />
              </div>
              <span className="text-sm font-semibold text-[#22A06B]">+1.8%</span>
            </div>
            <p className="mt-3 text-sm text-[#6B7280]">Net Income</p>
            <p className="mt-2 text-4xl font-semibold text-[#1F2937]">£8,700</p>
            <p className="text-xs text-[#9CA3AF]">After expenses</p>
          </article>

          <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EAFBF0]">
                <Users className="h-4 w-4 text-[#39AA3F]" />
              </div>
              <span className="text-sm font-semibold text-[#9CA3AF]">0%</span>
            </div>
            <p className="mt-3 text-sm text-[#6B7280]">Active Tenants</p>
            <p className="mt-2 text-4xl font-semibold text-[#1F2937]">3</p>
            <p className="text-xs text-[#9CA3AF]">6 units vacant</p>
          </article>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
            <h3 className="text-[30px] font-semibold leading-none text-[#1F2937]">Revenue vs Expenses</h3>
            <p className="mt-1 text-sm text-[#9CA3AF]">Last 6 months (£)</p>
            <div className="mt-4 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 6, right: 10, left: 4, bottom: 0 }}>
                  <CartesianGrid stroke="#EEF1F5" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `£${Math.floor(value / 1000)}k`}
                  />
                  <Tooltip formatter={(value: number) => `£${value.toLocaleString()}`} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1776B6"
                    strokeWidth={3}
                    dot={{ fill: '#1776B6', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#E67220"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={{ fill: '#E67220', r: 2.5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-6 text-sm text-[#6B7280]">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-[#1776B6]" />
                Revenue
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-[#E67220]" />
                Expenses
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
            <h3 className="text-[30px] font-semibold leading-none text-[#1F2937]">Portfolio Status</h3>
            <p className="mt-1 text-sm text-[#9CA3AF]">Unit occupancy breakdown</p>
            <div className="mt-4 grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto]">
              <div className="h-[220px]">
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
              <div className="space-y-4 pr-4">
                {occupancyData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-8 text-sm">
                    <div className="flex items-center gap-2 text-[#4B5563]">
                      <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </div>
                    <span className="font-semibold text-[#1F2937]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
            </section>

            <section className="grid grid-cols-1 gap-4">
          <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
            <h3 className="text-[30px] font-semibold leading-none text-[#1F2937]">Yield by Property</h3>
            <p className="mt-1 text-sm text-[#9CA3AF]">Annual gross yield %</p>

            <div className="mt-6 space-y-5">
              {yieldRows.map((row, index) => {
                const normalizedWidth = `${Math.min((row.value / 12) * 100, 100)}%`;
                const barColor = index % 2 === 0 ? '#1776B6' : '#E67220';
                return (
                  <div key={row.label} className="grid grid-cols-[1fr_5fr_auto] items-center gap-4">
                    <span className="truncate text-sm text-[#6B7280]">{row.label}</span>
                    <div className="h-3 rounded-full bg-[#EDF2F7]">
                      <div className="h-full rounded-full" style={{ width: normalizedWidth, backgroundColor: barColor }} />
                    </div>
                    <span className="text-sm font-semibold text-[#1F2937]">{row.value}%</span>
                  </div>
                );
              })}
            </div>
          </article>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[#E7EBF0] bg-white px-6 py-4 shadow-sm">
            <p className="text-4xl font-semibold text-[#1F2937]">3</p>
            <p className="text-sm text-[#6B7280]">Rent payments up to date</p>
          </article>
          <article className="rounded-2xl border border-[#E7EBF0] bg-white px-6 py-4 shadow-sm">
            <p className="text-4xl font-semibold text-[#1F2937]">14 days</p>
            <p className="text-sm text-[#6B7280]">Avg. time-to-let</p>
          </article>
          <article className="rounded-2xl border border-[#E7EBF0] bg-white px-6 py-4 shadow-sm">
            <p className="text-4xl font-semibold text-[#1F2937]">4.7 / 5</p>
            <p className="text-sm text-[#6B7280]">Avg. tenant satisfaction</p>
          </article>
            </section>
          </>
        )}
      </div>
    </div>
  );
}