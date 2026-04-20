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

interface PortfolioInsightsProps {
  properties: Property[];
  userProfile: UserProfile | null;
  onBack: () => void;
  marketInsights: MarketInsight[];
}

export function PortfolioInsights({ properties, userProfile }: PortfolioInsightsProps) {
  const [range, setRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const revenueSeries = [5000, 5100, 4950, 5150, 5100, 7000];
  const expensesSeries = [900, 920, 1200, 800, 950, 980];

  const chartData = months.map((month, index) => ({
    month,
    revenue: revenueSeries[index],
    expenses: expensesSeries[index],
  }));

  const occupancyData = [
    { name: 'Occupied', value: 1, color: '#1776B6' },
    { name: 'Vacant', value: 6, color: '#F57B1D' },
  ];

  const enquiriesData = [
    { week: 'W1', enquiries: 4, viewings: 1, offers: 0.4 },
    { week: 'W2', enquiries: 6, viewings: 2, offers: 0.8 },
    { week: 'W3', enquiries: 3, viewings: 0.8, offers: 0.3 },
    { week: 'W4', enquiries: 7, viewings: 3, offers: 1.2 },
  ];

  const yieldRows = useMemo(() => {
    const seedRows = ['Testing with', 'Cliffside', 'A testing', 'Leeds'];
    const propertyNames = properties.slice(0, 4).map((p) => p.address.split(',')[0].trim());
    const labels = propertyNames.length > 0 ? [...propertyNames, ...seedRows].slice(0, 4) : seedRows;
    const values = [9.6, 7.2, 12, 9.6];

    return labels.map((label, index) => ({ label, value: values[index] ?? 0 }));
  }, [properties]);

  const revenueTrendData = [
    { month: 'JAN', collected: 96, projected: 122 },
    { month: 'FEB', collected: 130, projected: 142 },
    { month: 'MAR', collected: 160, projected: 172 },
    { month: 'APR', collected: 146, projected: 152 },
    { month: 'MAY', collected: 176, projected: 182 },
    { month: 'JUN', collected: 182, projected: 188 },
    { month: 'JUL', collected: 156, projected: 160 },
    { month: 'AUG', collected: 116, projected: 172 },
    { month: 'SEP', collected: 170, projected: 184 },
  ];

  const revenueByProperty = [
    { name: 'THE HEIGHTS LUXURY LOFTS', value: 182 },
    { name: 'SUNSET GARDEN ESTATES', value: 124 },
    { name: 'OPAL PLAZA RETAIL', value: 98 },
    { name: 'RIVERSIDE CORPORATE HUB', value: 78 },
  ];

  const maxRevenueValue = Math.max(...revenueByProperty.map((row) => row.value));

  const occupancyTrendData = [
    { month: 'JAN', portfolio: 18, market: 12 },
    { month: 'FEB', portfolio: 22, market: 14 },
    { month: 'MAR', portfolio: 28, market: 16 },
    { month: 'APR', portfolio: 40, market: 18 },
    { month: 'MAY', portfolio: 52, market: 20 },
    { month: 'JUN', portfolio: 56, market: 23 },
    { month: 'JUL', portfolio: 61, market: 25 },
    { month: 'AUG', portfolio: 65, market: 26 },
    { month: 'SEP', portfolio: 68, market: 27 },
    { month: 'OCT', portfolio: 72, market: 28 },
    { month: 'NOV', portfolio: 74, market: 29 },
    { month: 'DEC', portfolio: 76, market: 30 },
  ];

  const timeToLetRows = [
    { prop: 'Prop 1', days: 12, tier: 'good' as const },
    { prop: 'Prop 2', days: 18, tier: 'mid' as const },
    { prop: 'Prop 3', days: 24, tier: 'bad' as const },
    { prop: 'Prop 4', days: 8, tier: 'good' as const },
    { prop: 'Prop 5', days: 31, tier: 'bad' as const },
    { prop: 'Prop 6', days: 16, tier: 'mid' as const },
  ];

  const timeToLetColor = (tier: 'good' | 'mid' | 'bad') => {
    switch (tier) {
      case 'good':
        return '#2FB36D';
      case 'mid':
        return '#E67220';
      case 'bad':
        return '#D14343';
      default:
        return '#2FB36D';
    }
  };

  const payments = [
    {
      initials: 'JD',
      tenant: 'Aisha Daodu',
      property: 'The Heights Luxury Lofts, #402',
      amount: '£2,850.00',
      dueDate: 'Oct 01, 2023',
      status: 'PAID',
      statusClass: 'bg-[#DFF7ED] text-[#1F9D64]',
    },
    {
      initials: 'MS',
      tenant: 'Marcus Smith',
      property: 'Sunset Garden Estates, #12B',
      amount: '£1,420.00',
      dueDate: 'Oct 03, 2023',
      status: 'LATE (2D)',
      statusClass: 'bg-[#FFF0E6] text-[#D96A1D]',
    },
    {
      initials: 'RL',
      tenant: 'Robert Lewis',
      property: 'The Heights Luxury Lofts, #108',
      amount: '£3,100.00',
      dueDate: 'Sep 28, 2023',
      status: 'IN PROGRESS',
      statusClass: 'bg-[#FCE9ED] text-[#D04D67]',
    },
  ];

  const tenantSatisfactionData = [
    { subject: 'Maintenance', value: 4.9, fullMark: 5 },
    { subject: 'Communication', value: 4.1, fullMark: 5 },
    { subject: 'Value', value: 3.9, fullMark: 5 },
    { subject: 'Safety', value: 3.8, fullMark: 5 },
    { subject: 'Cleanliness', value: 4.3, fullMark: 5 },
  ];

  const tenantOverviewRows = [
    {
      initials: 'AD',
      name: 'Aisha Daodu',
      email: 'aishadaodu@gmail.com',
      status: 'ACTIVE',
      statusClass: 'bg-[#DFF7ED] text-[#1F9D64]',
      property: 'Skyline Apts #402',
      sub: 'Lease: Oct 2025',
    },
    {
      initials: 'GU',
      name: 'Godwin Udu',
      email: 'godwin.udu@gmail.com',
      status: 'ACTIVE',
      statusClass: 'bg-[#DFF7ED] text-[#1F9D64]',
      property: 'Oak Terrace #12',
      sub: 'Lease: Jan 2024',
    },
    {
      initials: 'SL',
      name: 'Sandra Lee',
      email: 'sandra.lee@gmail.com',
      status: 'PENDING',
      statusClass: 'bg-[#E7F2FF] text-[#1776B6]',
      property: 'The Pinnacle #1008',
      sub: 'Move in: July 2024',
    },
  ];

  const marketCompareData = [
    { metric: 'AVG YIELD', portfolio: 4.8, market: 4.1 },
    { metric: 'OCCUPANCY %', portfolio: 14, market: 79 },
    { metric: 'AVG RENT (£)', portfolio: 1150, market: 980 },
    { metric: 'DAYS VACANT', portfolio: 14, market: 13 },
  ];

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
                <p className="mt-2 text-[40px] font-semibold leading-none text-[#1F2937]">£482,950</p>
              </article>

              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#FFF3E7]">
                    <Wallet className="h-4 w-4 text-[#D07A2A]" />
                  </div>
                  <span className="rounded-full bg-[#FFF0E6] px-2 py-0.5 text-xs font-semibold text-[#D96A1D]">HIGH ALERT</span>
                </div>
                <p className="mt-5 text-xs font-semibold tracking-[0.12em] text-[#6B7280]">OUTSTANDING RENT</p>
                <p className="mt-2 text-[40px] font-semibold leading-none text-[#1F2937]">£14,200</p>
              </article>

              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#E9F5FF]">
                  <TrendingUp className="h-4 w-4 text-[#1776B6]" />
                </div>
                <p className="mt-5 text-xs font-semibold tracking-[0.12em] text-[#6B7280]">MOM GROWTH</p>
                <p className="mt-2 text-[40px] font-semibold leading-none text-[#1F2937]">4.8%</p>
              </article>

              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#E9F5FF]">
                  <Building2 className="h-4 w-4 text-[#1776B6]" />
                </div>
                <p className="mt-5 text-xs font-semibold tracking-[0.12em] text-[#6B7280]">AVG RENT / UNIT</p>
                <p className="mt-2 text-[40px] font-semibold leading-none text-[#1F2937]">£2,450</p>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-[32px] font-semibold leading-none text-[#1F2937]">Revenue Trends</h3>
                    <p className="mt-1 text-sm text-[#9CA3AF]">Collected vs Projected Monthly Performance</p>
                  </div>
                  <div className="flex items-center gap-5 text-xs font-semibold text-[#6B7280]">
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

              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <h3 className="text-[32px] font-semibold leading-none text-[#1F2937]">Revenue by Property</h3>
                <div className="mt-6 space-y-6">
                  {revenueByProperty.map((row) => (
                    <div key={row.name}>
                      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-[#374957]">
                        <span>{row.name}</span>
                        <span className="text-[#1776B6]">£{row.value}K</span>
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

            <section className="rounded-2xl border border-[#E7EBF0] bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-[#EEF1F5] p-5 md:flex-row md:items-center md:justify-between">
                <h3 className="text-[32px] font-semibold leading-none text-[#1F2937]">Rent Payment Status</h3>
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
                <span>Showing 3 of 142 payment records</span>
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
                <p className="mt-3 text-[34px] font-semibold leading-none text-[#1F2937]">14%</p>
                <p className="mt-1 text-xs font-semibold text-[#6B7280]">vs 79% market avg</p>
              </article>

              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-[#1F2937]">Vacant Units</p>
                  <span className="text-xs font-semibold text-[#D14343]">▼ -50.0%</span>
                </div>
                <p className="mt-3 text-[34px] font-semibold leading-none text-[#1F2937]">6</p>
                <p className="mt-1 text-xs font-semibold text-[#6B7280]">Currently empty</p>
              </article>

              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-[#1F2937]">Avg. Days Vacant</p>
                  <span className="text-xs font-semibold text-[#D14343]">▼ -50.0%</span>
                </div>
                <p className="mt-3 text-[34px] font-semibold leading-none text-[#1F2937]">14</p>
                <p className="mt-1 text-xs font-semibold text-[#6B7280]">days vs 28 market avg</p>
              </article>

              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-[#1F2937]">Renewal Rate</p>
                  <span className="text-xs font-semibold text-[#22A06B]">▲ +4.5%</span>
                </div>
                <p className="mt-3 text-[34px] font-semibold leading-none text-[#1F2937]">78%</p>
                <p className="mt-1 text-xs font-semibold text-[#6B7280]">tenants renewing</p>
              </article>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <h3 className="text-[18px] font-semibold text-[#1F2937]">Occupancy Trend</h3>
                  <div className="flex items-center gap-6 text-xs font-semibold text-[#6B7280]">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#2FB36D]" />
                      Your Portfolio
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#9CA3AF]" />
                      Market Average
                    </span>
                  </div>
                </div>

                <div className="mt-4 h-[310px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={occupancyTrendData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="transparent" vertical={false} horizontal={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="portfolio"
                        stroke="#2FB36D"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="market"
                        stroke="#9CA3AF"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <h3 className="text-[18px] font-semibold text-[#1F2937]">Time To Let</h3>
                  <div className="text-xs font-semibold text-[#9CA3AF]">Avg Days</div>
                </div>

                <div className="mt-4 space-y-4">
                  {timeToLetRows.map((row) => {
                    const widthPct = Math.max(12, Math.min(100, (row.days / 35) * 100));
                    return (
                      <div key={row.prop} className="flex items-center gap-4">
                        <div className="w-[56px] text-sm font-semibold text-[#1F2937]">{row.prop}</div>
                        <div className="flex-1 h-4 rounded-full bg-[#EDF2F7] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${widthPct}%`,
                              backgroundColor: timeToLetColor(row.tier),
                            }}
                          />
                        </div>
                        <div className="w-[72px] text-right text-sm font-semibold text-[#1F2937]">
                          {row.days} days
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center gap-6 text-xs font-semibold text-[#6B7280]">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#2FB36D]" />
                    &lt;= 14 days
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#E67220]" />
                    15-20 days
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#D14343]" />
                    &gt;= 21 days
                  </span>
                </div>
              </article>
            </section>
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
                <p className="mt-1 text-[44px] font-semibold leading-none text-[#1F2937]">3</p>
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
                <p className="mt-1 text-[44px] font-semibold leading-none text-[#1F2937]">4.7 / 5</p>
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
                <p className="mt-1 text-[44px] font-semibold leading-none text-[#1F2937]">22 months</p>
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
                <p className="mt-1 text-[44px] font-semibold leading-none text-[#1F2937]">3</p>
                <p className="text-xs text-[#9CA3AF]">Maintenance</p>
              </article>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="text-[18px] font-semibold text-[#1F2937]">Tenant Satisfaction</h3>
                  <MoreVertical className="h-4 w-4 text-[#6B7280]" />
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={tenantSatisfactionData}>
                      <PolarGrid stroke="#E6EBF0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                      <Radar dataKey="value" stroke="#D96A1D" fill="#D96A1D" fillOpacity={0.18} strokeWidth={3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Top performing</span>
                    <span className="font-semibold text-[#22A06B]">Maintenance (4.9)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Focus area</span>
                    <span className="font-semibold text-[#D96A1D]">Safety (3.8)</span>
                  </div>
                </div>
              </article>

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
        ) : activeTab === 'market' ? (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-semibold tracking-[0.12em] text-[#6B7280]">YOUR AVG YIELD</p>
                  <span className="text-xs font-semibold text-[#22A06B]">+0.7%</span>
                </div>
                <p className="mt-2 text-[44px] font-semibold leading-none text-[#1F2937]">4.8%</p>
                <p className="text-xs text-[#9CA3AF]">vs 4.1% market</p>
              </article>
              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-semibold tracking-[0.12em] text-[#6B7280]">MARKET OCCUPANCY</p>
                  <span className="text-xs font-semibold text-[#9CA3AF]">-0%</span>
                </div>
                <p className="mt-2 text-[44px] font-semibold leading-none text-[#1F2937]">79%</p>
                <p className="text-xs text-[#9CA3AF]">Local avg</p>
              </article>
              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-semibold tracking-[0.12em] text-[#6B7280]">AVG MARKET RENT</p>
                  <span className="text-xs font-semibold text-[#22A06B]">+2.3%</span>
                </div>
                <p className="mt-2 text-[44px] font-semibold leading-none text-[#1F2937]">£1,150</p>
                <p className="text-xs text-[#9CA3AF]">Per month, local</p>
              </article>
              <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-semibold tracking-[0.12em] text-[#6B7280]">SUPPLY INDEX</p>
                  <span className="text-xs font-semibold text-[#9CA3AF]">-0%</span>
                </div>
                <p className="mt-2 text-[44px] font-semibold leading-none text-[#1F2937]">LOW</p>
                <p className="text-xs text-[#9CA3AF]">High demand area</p>
              </article>
            </section>

            <section className="mt-6 rounded-2xl border border-[#E7EBF0] bg-white p-6 shadow-sm">
              <button type="button" className="rounded-full bg-[#1776B6] px-5 py-2 text-sm font-semibold text-white">Market</button>
              <div className="mt-6 flex items-center justify-between">
                <h3 className="text-[36px] font-semibold leading-none text-[#1F2937]">You vs Market</h3>
                <div className="flex items-center gap-6 text-sm font-semibold text-[#6B7280]">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1776B6]" />
                    Your Portfolio
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#C9D6E4]" />
                    Market Average
                  </span>
                </div>
              </div>

              <div className="mt-6 h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={marketCompareData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#EEF1F5" vertical={false} />
                    <XAxis dataKey="metric" tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="portfolio" fill="#1776B6" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="market" fill="#F4A261" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
            <h3 className="text-[30px] font-semibold leading-none text-[#1F2937]">Enquiries &amp; Viewings</h3>
            <p className="mt-1 text-sm text-[#9CA3AF]">Weekly activity (past month)</p>
            <div className="mt-4 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enquiriesData}>
                  <CartesianGrid stroke="#EEF1F5" vertical={false} />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="enquiries" fill="#1776B6" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="viewings" fill="#E67220" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="offers" fill="#39AA3F" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-6 text-sm text-[#6B7280]">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-[#1776B6]" />
                Enquiries
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-[#E67220]" />
                Viewings
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-[#39AA3F]" />
                Offers
              </div>
            </div>
          </article>

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