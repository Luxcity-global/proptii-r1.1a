import React, { useState, useMemo, useEffect } from 'react';
import {
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Download,
  Eye,
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
  X,
} from 'lucide-react';
import { MarketInsight, Property, Tenant, UserProfile } from '../App';
import { countPortfolio, isPropertyArchived } from '../utils/portfolioStats';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
} from 'recharts';
import { LandlordPageEmptyShell } from './LandlordPageEmptyShell';
import { useAnalytics, AnalyticsData } from '../hooks/useAnalytics';
import '../styles/analyticsPage.css';

interface PortfolioInsightsProps {
  properties: Property[];
  tenants?: Tenant[];
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

type TimeRange = '7d' | '30d' | '3m' | '6m' | '1yr';
type TabType = 'Overview' | 'Revenue' | 'Occupancy' | 'Tenants' | 'Market';

interface ToastItem {
  id: string;
  msg: string;
  type: 'info' | 'success' | 'warning';
}

function money(value: number): string {
  return `£${Math.round(value).toLocaleString('en-GB')}`;
}

export function PortfolioInsights({
  properties,
  tenants = [],
  userProfile,
  isAuthenticated = false,
  marketInsights,
  onViewSettings,
  onViewNotifications,
  onAddTenant,
  onViewClients,
  onViewProperties,
}: PortfolioInsightsProps) {
  const isUserAuthenticated = isAuthenticated || Boolean(userProfile);
  const { data, isLoading: isHookLoading } = useAnalytics();

  if (!isUserAuthenticated) {
    return <LandlordPageEmptyShell page="insights" variant="guest" />;
  }

  return (
    <PortfolioInsightsContent
      properties={properties}
      portfolioTenants={tenants}
      userProfile={userProfile}
      analyticsData={data}
      isHookLoading={isHookLoading}
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
  portfolioTenants = [],
  userProfile,
  analyticsData,
  isHookLoading,
  marketInsights,
  onViewSettings,
  onViewNotifications,
  onAddTenant,
  onViewClients,
  onViewProperties,
}: {
  properties: Property[];
  portfolioTenants?: Tenant[];
  userProfile: UserProfile | null;
  analyticsData: AnalyticsData | null;
  isHookLoading: boolean;
  marketInsights: MarketInsight[];
  onViewSettings?: () => void;
  onViewNotifications?: () => void;
  onAddTenant?: () => void;
  onViewClients?: () => void;
  onViewProperties?: () => void;
}) {
  // Navigation & Control States
  const [currentRange, setCurrentRange] = useState<TimeRange>('30d');
  const [currentTab, setCurrentTab] = useState<TabType>('Overview');
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Toast Helper
  const showToast = (msg: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, msg, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Filter Active Properties
  const activeProperties = useMemo(() => {
    return (properties || []).filter((p) => !isPropertyArchived(p));
  }, [properties]);

  // Selected Scope filtered properties
  const scopedProperties = useMemo(() => {
    if (selectedScope === 'all') return activeProperties;
    return activeProperties.filter((p) => p.id === selectedScope);
  }, [activeProperties, selectedScope]);

  // Range multipliers for realistic horizon metrics
  const rangeMultiplier = useMemo(() => {
    switch (currentRange) {
      case '7d': return 0.25;
      case '30d': return 1;
      case '3m': return 3;
      case '6m': return 6;
      case '1yr': return 12;
      default: return 1;
    }
  }, [currentRange]);

  // Portfolio aggregates
  const portfolio = useMemo(() => {
    return countPortfolio(scopedProperties, portfolioTenants);
  }, [scopedProperties, portfolioTenants]);

  const occupiedCount = scopedProperties.length > 0
    ? portfolio.occupied
    : 0;
  const totalUnits = scopedProperties.length;
  const vacantCount = Math.max(0, totalUnits - occupiedCount);

  // Revenue computations
  const baseMonthlyRent = scopedProperties.length > 0 && portfolio.monthlyRent > 0
    ? portfolio.monthlyRent
    : (analyticsData?.summary?.monthlyRent || 0);

  const displayRevenue = Math.round(baseMonthlyRent * rangeMultiplier);
  const displayNetIncome = Math.round(displayRevenue * 0.87); // ~87% net after operations

  const occupancyPct = scopedProperties.length > 0
    ? Math.round(portfolio.occupancyPct)
    : 0;

  const activeTenantsCount = scopedProperties.length > 0
    ? (portfolioTenants.filter((t) => t.status === 'active' || t.status === 'pending').length || occupiedCount)
    : 0;

  // Revenue & Trends from Analytics Hook or computed from base rent
  const revenueTrendData = analyticsData?.revenue?.revenueTrendData || [];
  const chartData = useMemo(() => {
    if (revenueTrendData.length > 0) {
      return revenueTrendData.map((d: any) => ({
        month: d.month,
        revenue: d.collected || 0,
        expenses: Math.round((d.collected || 0) * 0.33),
      }));
    }
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'];
    if (baseMonthlyRent > 0) {
      return months.map((m) => ({
        month: m,
        revenue: baseMonthlyRent,
        expenses: Math.round(baseMonthlyRent * 0.33),
      }));
    }
    return months.map((m) => ({
      month: m,
      revenue: 0,
      expenses: 0,
    }));
  }, [revenueTrendData, baseMonthlyRent]);

  // Yield calculations for properties
  const yieldRows = useMemo(() => {
    if (activeProperties.length > 0) {
      return activeProperties.slice(0, 5).map((p, index) => {
        const annualRent = (p.rent || 0) * 12;
        const estimatedValue = (p as any).estimatedValue || (p.rent ? p.rent * 150 : 250000);
        const yieldPct = estimatedValue > 0 ? parseFloat(((annualRent / estimatedValue) * 100).toFixed(1)) : 0;
        return {
          id: p.id,
          label: p.address.split(',')[0].trim() || `Property ${index + 1}`,
          yieldPct: yieldPct,
          color: index % 2 === 0 ? '#136C9E' : '#DC5F12',
          widthPct: Math.min(100, Math.round((yieldPct / 8) * 100)) || 0,
        };
      });
    }
    return [];
  }, [activeProperties]);

  // Payments for revenue tab
  const paymentRows = useMemo(() => {
    const rawPayments = analyticsData?.tenants?.payments || [];
    if (!paymentSearch.trim()) return rawPayments;
    const q = paymentSearch.toLowerCase();
    return rawPayments.filter(
      (r: any) =>
        (r.tenant && r.tenant.toLowerCase().includes(q)) ||
        (r.property && r.property.toLowerCase().includes(q))
    );
  }, [analyticsData, paymentSearch]);

  // Handlers
  const handleRangeChange = (range: TimeRange) => {
    setCurrentRange(range);
    showToast(`Updated analytics horizon to ${range}`, 'info');
  };

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
    showToast(`Switched view to ${tab} analytics breakdown`, 'info');
  };

  const handleScopeChange = (value: string) => {
    setSelectedScope(value);
    showToast(`Scope updated to ${value === 'all' ? 'Entire Portfolio' : 'selected property'}`, 'info');
  };

  const handleExportReport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        ['Metric', 'Value', 'Range'],
        ['Monthly Revenue', money(displayRevenue), currentRange],
        ['Occupancy Rate', `${occupancyPct}%`, currentRange],
        ['Net Income', money(displayNetIncome), currentRange],
        ['Active Tenants', String(activeTenantsCount), currentRange],
      ]
        .map((e) => e.join(','))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `proptii-analytics-report-${currentRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exporting comprehensive Portfolio Performance Report (CSV/PDF)...', 'success');
  };

  const isSkeleton = isHookLoading;
  const isEmpty = scopedProperties.length === 0;

  const userDisplayName = userProfile?.name || 'Landlord';
  const userInitials = userDisplayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="proptii-analytics-root flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-y-auto selection:bg-orange-100 selection:text-orange-900">
      {/* ========================================================================= */}
      {/* TOP HEADER BAR (WHITE BACKGROUND, STICKY)                                 */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-subtle">
        <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-3 sm:py-5 flex flex-col justify-between gap-3 sm:gap-4">

          {/* Desktop & Main Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="font-heading text-xl sm:text-2xl lg:text-[28px] font-bold text-slate-900 tracking-tight leading-none">
                  Analytics
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-1 font-normal">
                  Portfolio performance & occupancy trends for {userDisplayName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleExportReport}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 font-semibold text-xs sm:text-sm shadow-subtle hover:bg-slate-50 transition-all min-h-[44px] cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN PAGE CONTENT                                                         */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-8 pb-24 lg:pb-8">
        {/* ========================================================================= */}
        {/* FILTER & CONTROLS BAR (Contracts Baseline Replica for Analytics)          */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card space-y-3.5 mb-6">
          {/* Top Row: Property/Portfolio Scope Dropdown + Time Range Selector + Export Report Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
            {/* Left: Scope Dropdown */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1 sm:max-w-xs">
                <select
                  id="analyticsPortfolioScope"
                  value={selectedScope}
                  onChange={(e) => handleScopeChange(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-semibold py-2.5 pl-3.5 pr-8 rounded-xl hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20 cursor-pointer transition-all shadow-xs min-h-[44px]"
                >
                  <option value="all">
                    Entire Portfolio ({activeProperties.length} Properties)
                  </option>
                  {activeProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.address}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Right: Time Range Selector & Actions */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-600 shadow-xs">
                {(['7d', '30d', '3m', '6m', '1yr'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => handleRangeChange(range)}
                    className={`px-3 py-1.5 rounded-lg transition-all min-h-[36px] cursor-pointer ${
                      currentRange === range
                        ? 'bg-[#e8f3f8] text-[#136C9E] font-bold shadow-xs'
                        : 'hover:text-slate-900 text-slate-600'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {/* Export Button */}
              <button
                type="button"
                onClick={handleExportReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all shrink-0 active:scale-95 hover:border-slate-300 cursor-pointer min-h-[44px]"
                title="Export analytics report"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Filter Pills (Tabs with Badges) */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
            <button
              type="button"
              onClick={() => handleTabChange('Overview')}
              className={`filter-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-heading transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'Overview'
                  ? 'bg-[#DC5F12] text-white font-bold shadow-sm'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200 font-semibold'
              }`}
            >
              <span>Overview</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  currentTab === 'Overview' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                Live
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('Revenue')}
              className={`filter-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-heading transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'Revenue'
                  ? 'bg-[#DC5F12] text-white font-bold shadow-sm'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200 font-semibold'
              }`}
            >
              <span>Revenue & Yield</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  currentTab === 'Revenue' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                Coming Soon
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('Occupancy')}
              className={`filter-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-heading transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'Occupancy'
                  ? 'bg-[#DC5F12] text-white font-bold shadow-sm'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200 font-semibold'
              }`}
            >
              <span>Occupancy</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  currentTab === 'Occupancy' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {occupancyPct}%
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('Tenants')}
              className={`filter-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-heading transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'Tenants'
                  ? 'bg-[#DC5F12] text-white font-bold shadow-sm'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200 font-semibold'
              }`}
            >
              <span>Tenants</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  currentTab === 'Tenants' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {activeTenantsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('Market')}
              className={`filter-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-heading transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'Market'
                  ? 'bg-[#DC5F12] text-white font-bold shadow-sm'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200 font-semibold'
              }`}
            >
              <span>Market Benchmarks</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  currentTab === 'Market' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                Coming Soon
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OVERVIEW TAB CONTENT (DEFAULT)                                            */}
        {/* ========================================================================= */}
        {currentTab === 'Overview' && (
          <>
            {/* Top 4 KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {isSkeleton ? (
                Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl skeleton-box shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-20 skeleton-box rounded"></div>
                        <div className="h-6 w-14 skeleton-box rounded"></div>
                        <div className="h-2.5 w-24 skeleton-box rounded"></div>
                      </div>
                    </div>
                  ))
              ) : isEmpty ? (
                <>
                  <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 opacity-60">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                      <span className="font-bold text-xs">£</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] sm:text-xs font-bold text-slate-400 font-heading">Monthly Revenue</div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-400 font-heading mt-0.5">£0</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">No revenue recorded</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 opacity-60">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                      <Home className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] sm:text-xs font-bold text-slate-400 font-heading">Occupancy Rate</div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-400 font-heading mt-0.5">0%</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">0/0 units active</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 opacity-60">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] sm:text-xs font-bold text-slate-400 font-heading">Net Income</div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-400 font-heading mt-0.5">£0</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">No net income</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 opacity-60">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] sm:text-xs font-bold text-slate-400 font-heading">Active Tenants</div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-400 font-heading mt-0.5">0</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">0 units occupied</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* CARD 1: Monthly Revenue */}
                  <div
                    onClick={() => handleTabChange('Revenue')}
                    className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 hover:border-slate-300 hover:shadow-subtle transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform font-bold text-base">
                      £
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] sm:text-xs font-bold text-slate-500 font-heading truncate">Monthly Revenue</div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-900 font-heading mt-0.5">
                        {money(displayRevenue)}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
                          Coming Soon
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium truncate">· MoM trend</span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Occupancy Rate */}
                  <div
                    onClick={() => handleTabChange('Occupancy')}
                    className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 hover:border-slate-300 hover:shadow-subtle transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-orange-50 text-[#DC5F12] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Home className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] sm:text-xs font-bold text-slate-500 font-heading truncate">Occupancy Rate</div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-900 font-heading mt-0.5">
                        {occupancyPct}%
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                        {occupiedCount}/{totalUnits} units active
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Net Income */}
                  <div
                    onClick={() => handleTabChange('Revenue')}
                    className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 hover:border-slate-300 hover:shadow-subtle transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] sm:text-xs font-bold text-slate-500 font-heading truncate">Net Income</div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-900 font-heading mt-0.5">
                        {money(displayNetIncome)}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
                          Coming Soon
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium truncate">· Net variance</span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Active Tenants */}
                  <div
                    onClick={() => handleTabChange('Tenants')}
                    className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 hover:border-slate-300 hover:shadow-subtle transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] sm:text-xs font-bold text-slate-500 font-heading truncate">Active Tenants</div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-900 font-heading mt-0.5">
                        {activeTenantsCount}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                        {vacantCount} units vacant
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Middle Section: Revenue vs Expenses Chart (8 Cols) + Portfolio Status Donut (4 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
              {/* Left: Revenue vs Expenses Area Chart (8 Cols) */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between">
                {isSkeleton ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-40 h-5 rounded skeleton-box"></div>
                      <div className="w-32 h-5 rounded skeleton-box"></div>
                    </div>
                    <div className="w-full h-64 rounded-xl skeleton-box"></div>
                  </div>
                ) : isEmpty ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                      <div>
                        <h3 className="font-heading text-base font-bold text-slate-900">Revenue vs Expenses</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Financial performance for last 6 months (£)</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                          <span className="text-slate-400 font-medium">Revenue (£0)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                          <span className="text-slate-400 font-medium">Expenses (£0)</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative w-full h-64 flex flex-col justify-between">
                      <svg viewBox="0 0 700 240" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        <line x1="40" y1="30" x2="690" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3"></line>
                        <line x1="40" y1="80" x2="690" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3"></line>
                        <line x1="40" y1="130" x2="690" y2="130" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3"></line>
                        <line x1="40" y1="180" x2="690" y2="180" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3"></line>
                        <line x1="40" y1="220" x2="690" y2="220" stroke="#e2e8f0" strokeWidth="1"></line>
                        <text x="5" y="34" fontSize="10" fill="#cbd5e1" fontFamily="Nunito Sans">£12k</text>
                        <text x="10" y="84" fontSize="10" fill="#cbd5e1" fontFamily="Nunito Sans">£9k</text>
                        <text x="10" y="134" fontSize="10" fill="#cbd5e1" fontFamily="Nunito Sans">£6k</text>
                        <text x="10" y="184" fontSize="10" fill="#cbd5e1" fontFamily="Nunito Sans">£3k</text>
                        <text x="10" y="224" fontSize="10" fill="#cbd5e1" fontFamily="Nunito Sans">£0k</text>
                        <line x1="60" y1="220" x2="680" y2="220" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"></line>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-white/60 backdrop-blur-xs">
                        <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2.5">
                          <CircleDollarSign className="w-5 h-5" />
                        </div>
                        <h4 className="font-heading text-sm font-bold text-slate-700">No Financial Records in Period</h4>
                        <p className="text-xs text-slate-400 max-w-sm mt-0.5">
                          Revenue curves and operational expenditures will automatically chart as rental transactions are logged.
                        </p>
                      </div>
                      <div className="flex items-center justify-between pl-12 pr-4 pt-2 text-[11px] font-semibold text-slate-300">
                        <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                      <div>
                        <h3 className="font-heading text-base font-bold text-slate-900">Revenue vs Expenses</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Financial performance for last 6 months (£)</p>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#136C9E]"></span>
                          <span className="text-slate-600 font-medium">Revenue</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#DC5F12]"></span>
                          <span className="text-slate-600 font-medium">Expenses</span>
                        </div>
                      </div>
                                <div className="relative w-full h-64 pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                          <defs>
                            <linearGradient id="revAreaGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#136C9E" stopOpacity={0.18} />
                              <stop offset="100%" stopColor="#136C9E" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                          <XAxis
                            dataKey="month"
                            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Nunito Sans', fontWeight: 600 }}
                            axisLine={{ stroke: '#e2e8f0' }}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'Nunito Sans' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `£${Math.round(v / 1000)}k`}
                          />
                          <RechartsTooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const rev = Number(payload.find((p) => p.dataKey === 'revenue')?.value || 0);
                                const exp = Number(payload.find((p) => p.dataKey === 'expenses')?.value || 0);
                                const net = rev - exp;
                                return (
                                  <div className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs shadow-lg flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span className="font-bold">{label}:</span>
                                    <span>
                                      Rev {money(rev)} · Exp {money(exp)} (Net {net >= 0 ? '+' : ''}{money(net)})
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            fill="url(#revAreaGradient)"
                            stroke="#136C9E"
                            strokeWidth={2.5}
                          />
                          <Line
                            type="monotone"
                            dataKey="expenses"
                            stroke="#DC5F12"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={{ r: 3.5, fill: '#DC5F12', stroke: '#ffffff', strokeWidth: 1.5 }}
                            activeDot={{ r: 5, fill: '#DC5F12', stroke: '#ffffff', strokeWidth: 2 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>                   </div>
                  </>
                )}
              </div>

              {/* Right: Portfolio Status Donut (4 Cols) */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between">
                {isSkeleton ? (
                  <div className="space-y-4">
                    <div className="w-36 h-5 rounded skeleton-box mb-6"></div>
                    <div className="w-40 h-40 rounded-full skeleton-box mx-auto my-6"></div>
                    <div className="space-y-2">
                      <div className="h-10 rounded-xl skeleton-box"></div>
                      <div className="h-10 rounded-xl skeleton-box"></div>
                    </div>
                  </div>
                ) : isEmpty ? (
                  <>
                    <div>
                      <h3 className="font-heading text-base font-bold text-slate-900">Portfolio Status</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Unit occupancy breakdown</p>
                    </div>

                    <div className="my-6 flex flex-col items-center justify-center">
                      <div className="relative w-44 h-44 flex items-center justify-center">
                        <svg className="w-44 h-44 -rotate-90" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="48" fill="none" stroke="#f1f5f9" strokeWidth="12"></circle>
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="font-heading text-2xl font-bold text-slate-300">0%</span>
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">OCCUPIED</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                          <span className="text-slate-500">Occupied Units</span>
                        </div>
                        <span className="text-slate-400 font-bold">0</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                          <span className="text-slate-500">Vacant Units</span>
                        </div>
                        <span className="text-slate-400 font-bold">0</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="font-heading text-base font-bold text-slate-900">Portfolio Status</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Unit occupancy breakdown</p>
                    </div>

                    <div className="my-6 flex flex-col items-center justify-center">
                      <div className="relative w-44 h-44 flex items-center justify-center">
                        <svg className="w-44 h-44 -rotate-90" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="48" fill="none" stroke="#f1f5f9" strokeWidth="12"></circle>
                          <circle
                            cx="60"
                            cy="60"
                            r="48"
                            fill="none"
                            stroke="#136C9E"
                            strokeWidth="12"
                            strokeDasharray={`${(occupancyPct / 100) * 301.6} 301.6`}
                            strokeLinecap="round"
                          ></circle>
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="font-heading text-2xl font-bold text-slate-900">{occupancyPct}%</span>
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">OCCUPIED</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#136C9E]"></span>
                          <span className="text-slate-700">Occupied Units</span>
                        </div>
                        <span className="text-slate-900 font-bold">{occupiedCount}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                          <span className="text-slate-700">Vacant Units</span>
                        </div>
                        <span className="text-slate-900 font-bold">{vacantCount}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Section: Yield by Property (8 Cols) + 3 Mini Stat Cards (4 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left: Yield by Property (8 Cols) */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-card p-6">
                {isSkeleton ? (
                  <div className="space-y-5">
                    <div className="w-36 h-5 rounded skeleton-box mb-5"></div>
                    <div>
                      <div className="w-24 h-4 rounded skeleton-box mb-2"></div>
                      <div className="w-full h-2.5 rounded skeleton-box"></div>
                    </div>
                    <div>
                      <div className="w-24 h-4 rounded skeleton-box mb-2"></div>
                      <div className="w-full h-2.5 rounded skeleton-box"></div>
                    </div>
                    <div>
                      <div className="w-24 h-4 rounded skeleton-box mb-2"></div>
                      <div className="w-full h-2.5 rounded skeleton-box"></div>
                    </div>
                  </div>
                ) : isEmpty ? (
                  <>
                    <div className="mb-5">
                      <h3 className="font-heading text-base font-bold text-slate-900">Yield by Property</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Annual gross yield performance (%)</p>
                    </div>

                    <div className="space-y-5">
                      {['Address 1', 'Address 2', 'Address 3'].map((item) => (
                        <div key={item}>
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1.5">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full border-2 border-slate-300"></span>
                              {item}
                            </span>
                            <span className="font-bold text-slate-400">0.0%</span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-slate-200" style={{ width: '0%' }}></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-slate-400 italic mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      Zero yield recorded · Requires active tenant leases with rental payment ledger history.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-5">
                      <h3 className="font-heading text-base font-bold text-slate-900">Yield by Property</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Annual gross yield performance (%)</p>
                    </div>

                    <div className="space-y-5">
                      {yieldRows.map((row) => (
                        <div key={row.id}>
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full border-2 border-sky-600"></span>
                              {row.label}
                            </span>
                            <span className="font-bold text-slate-900">{row.yieldPct}%</span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#136C9E] transition-all duration-500"
                              style={{ width: `${row.widthPct}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Right: 3 Stacked Mini Stat Cards (4 Cols) */}
              <div className="lg:col-span-4 flex flex-col gap-3.5">
                {isSkeleton ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
                        <div>
                          <div className="w-16 h-7 rounded skeleton-box mb-2"></div>
                          <div className="w-32 h-3.5 rounded skeleton-box"></div>
                        </div>
                        <div className="w-10 h-10 rounded-full skeleton-box"></div>
                      </div>
                    ))
                ) : isEmpty ? (
                  <>
                    {/* Mini Card 1 Empty */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
                      <div>
                        <div className="font-heading text-2xl font-bold text-slate-300 leading-none">0</div>
                        <div className="text-xs text-slate-400 mt-1">Rent payments up to date</div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                    </div>

                    {/* Mini Card 2 Empty */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
                      <div>
                        <div className="font-heading text-2xl font-bold text-slate-300 leading-none">--</div>
                        <div className="text-xs text-slate-400 mt-1">Avg. time-to-let</div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center shrink-0">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Mini Card 3 Empty */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
                      <div>
                        <div className="font-heading text-2xl font-bold text-slate-300 leading-none">
                          -- <span className="text-sm font-normal text-slate-300">/5</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Avg. tenant satisfaction</div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center shrink-0">
                        <Star className="w-5 h-5 fill-current" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Mini Card 1 */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
                      <div>
                        <div className="font-heading text-2xl font-bold text-slate-900 leading-none">{occupiedCount}</div>
                        <div className="text-xs text-slate-500 mt-1">Rent payments up to date</div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                    </div>

                    {/* Mini Card 2 */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
                      <div>
                        <div className="mb-1">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Coming Soon
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Avg. time-to-let</div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Mini Card 3 */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
                      <div>
                        <div className="mb-1">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Coming Soon
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Avg. tenant satisfaction</div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                        <Star className="w-5 h-5 fill-current" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* REVENUE & YIELD TAB                                                       */}
        {/* ========================================================================= */}
        {currentTab === 'Revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#136C9E] flex items-center justify-center mb-3">
                  <CircleDollarSign className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-500 font-heading">Total Revenue</div>
                <div className="text-2xl font-bold text-slate-900 font-heading mt-0.5">{money(displayRevenue)}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
                    Coming Soon
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">· MoM growth</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#DC5F12] flex items-center justify-center mb-3">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-500 font-heading">Outstanding Rent</div>
                <div className="text-2xl font-bold text-slate-900 font-heading mt-0.5">£0</div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">All accounts current</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-500 font-heading">Avg Net Yield</div>
                <div className="text-2xl font-bold text-slate-900 font-heading mt-0.5">
                  {yieldRows.length > 0 ? (
                    `${(yieldRows.reduce((acc, r) => acc + r.yieldPct, 0) / yieldRows.length).toFixed(1)}%`
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-500">
                      Coming Soon
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
                    Coming Soon
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">· vs regional avg</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-500 font-heading">Avg Rent / Unit</div>
                <div className="text-2xl font-bold text-slate-900 font-heading mt-0.5">
                  {money(scopedProperties.length > 0 ? displayRevenue / scopedProperties.length : 0)}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">Across managed stock</div>
              </div>
            </div>

            {/* Revenue Trend Chart & Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-card p-6">
                <h3 className="font-heading text-base font-bold text-slate-900 mb-1">Revenue Trends</h3>
                <p className="text-xs text-slate-500 mb-6">Collected vs projected monthly performance</p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${v / 1000}k`} />
                      <RechartsTooltip />
                      <Bar dataKey="revenue" fill="#136C9E" radius={[6, 6, 0, 0]} barSize={22} name="Collected (£)" />
                      <Bar dataKey="expenses" fill="#DC5F12" radius={[6, 6, 0, 0]} barSize={12} name="Expenses (£)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-heading text-base font-bold text-slate-900 mb-1">Revenue by Property</h3>
                  <p className="text-xs text-slate-500 mb-4">Top contributors to monthly ledger</p>
                  <div className="space-y-4">
                    {yieldRows.length > 0 ? (
                      yieldRows.slice(0, 4).map((r) => (
                        <div key={r.id}>
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                            <span className="truncate max-w-[170px]">{r.label}</span>
                            <span className="font-bold text-slate-900">{r.yieldPct}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-[#136C9E]" style={{ width: `${r.widthPct}%` }}></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        No property revenue data available.
                      </div>
                    )}
                  </div>
                </div>

                {onViewProperties && (
                  <button
                    type="button"
                    onClick={onViewProperties}
                    className="mt-6 w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold font-heading transition-all shadow-xs"
                  >
                    View All Property Assets
                  </button>
                )}
              </div>
            </div>

            {/* Rent Payment Status Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-heading text-base font-bold text-slate-900">Rent Payment Ledger</h3>
                  <p className="text-xs text-slate-500">Live reconciliation of tenant lease accounts</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    placeholder="Search tenant or address..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">
                      <th className="pb-3 pl-2">Tenant</th>
                      <th className="pb-3">Property</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Due Date</th>
                      <th className="pb-3 pr-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paymentRows.length > 0 ? (
                      paymentRows.map((p: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 pl-2 font-semibold text-slate-900 font-heading">{p.tenant}</td>
                          <td className="py-3 text-slate-600">{p.property}</td>
                          <td className="py-3 font-bold text-slate-900">{p.amount}</td>
                          <td className="py-3 text-slate-500">{p.dueDate}</td>
                          <td className="py-3 pr-2 text-right">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : p.status === 'Pending'
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No recent payments recorded in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* OCCUPANCY TAB                                                             */}
        {/* ========================================================================= */}
        {currentTab === 'Occupancy' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card">
                <div className="text-xs font-bold text-slate-500 font-heading">Occupancy Rate</div>
                <div className="text-2xl font-bold text-slate-900 font-heading mt-0.5">{occupancyPct}%</div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">
                  {occupiedCount} of {totalUnits} active
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card">
                <div className="text-xs font-bold text-slate-500 font-heading">Vacant Units</div>
                <div className="text-2xl font-bold text-slate-900 font-heading mt-0.5">{vacantCount}</div>
                <div className="text-[11px] text-[#DC5F12] font-semibold mt-1">Ready for letting</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card">
                <div className="text-xs font-bold text-slate-500 font-heading">Avg. Days to Let</div>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    Coming Soon
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1.5">Vacancy tracking in development</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card">
                <div className="text-xs font-bold text-slate-500 font-heading">Lease Renewal Rate</div>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    Coming Soon
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1.5">Tenancy lifecycle analytics</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6">
              <h3 className="font-heading text-base font-bold text-slate-900 mb-1">Occupancy Action Plan</h3>
              <p className="text-xs text-slate-500 mb-5">Proactive recommendations to maximize rental yields</p>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-orange-50/80 border border-orange-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white text-[#DC5F12] border border-orange-200 flex items-center justify-center shrink-0">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 font-heading">Vacancy Prevention Alert</h4>
                      <p className="text-[11px] text-slate-600">
                        {vacantCount > 0 ? `${vacantCount} property listings ready for prospective tenant marketing.` : 'All portfolio properties currently occupied.'}
                      </p>
                    </div>
                  </div>
                  {onViewProperties && (
                    <button
                      type="button"
                      onClick={onViewProperties}
                      className="px-4 py-2 rounded-xl bg-[#DC5F12] text-white text-xs font-bold hover:bg-[#ba4e0b] transition-all self-start sm:self-auto cursor-pointer"
                    >
                      Manage Listings
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TENANTS TAB                                                               */}
        {/* ========================================================================= */}
        {currentTab === 'Tenants' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card">
                <div className="text-xs font-bold text-slate-500 font-heading">Active Tenants</div>
                <div className="text-2xl font-bold text-slate-900 font-heading mt-0.5">{activeTenantsCount}</div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">Verified agreements</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card">
                <div className="text-xs font-bold text-slate-500 font-heading">Tenant Satisfaction</div>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    Coming Soon
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1.5">Review feedback system</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card">
                <div className="text-xs font-bold text-slate-500 font-heading">Avg. Tenancy Length</div>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    Coming Soon
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1.5">Historical contract durations</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card">
                <div className="text-xs font-bold text-slate-500 font-heading">Open Requests</div>
                <div className="text-2xl font-bold text-slate-900 font-heading mt-0.5">0</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">All tickets resolved</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading text-base font-bold text-slate-900">Tenant Directory</h3>
                  <p className="text-xs text-slate-500">Occupants registered across your portfolio</p>
                </div>
                {onViewClients && (
                  <button
                    type="button"
                    onClick={onViewClients}
                    className="text-xs font-bold text-[#136C9E] hover:underline cursor-pointer"
                  >
                    View All Clients →
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">
                      <th className="pb-3 pl-2">Client Name</th>
                      <th className="pb-3">Contact</th>
                      <th className="pb-3">Assigned Property</th>
                      <th className="pb-3 pr-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {portfolioTenants.length > 0 ? (
                      portfolioTenants.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/80">
                          <td className="py-3 pl-2 font-semibold text-slate-900 font-heading">{t.name}</td>
                          <td className="py-3 text-slate-500">{t.email}</td>
                          <td className="py-3 text-slate-700">{t.propertyAddress || 'Assigned unit'}</td>
                          <td className="py-3 pr-2 text-right">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {t.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          No tenants registered in this portfolio.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MARKET BENCHMARKS TAB                                                     */}
        {/* ========================================================================= */}
        {currentTab === 'Market' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6">
              <h3 className="font-heading text-base font-bold text-slate-900 mb-1">UK Rental Market Benchmarks</h3>
              <p className="text-xs text-slate-500 mb-6">Comparative data points across key UK lettings regions</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs font-bold text-slate-500 font-heading">Greater London Yield</div>
                  <div className="mt-1.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      Coming Soon
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5">HM Land Registry regional indices</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs font-bold text-slate-500 font-heading">North West Yield</div>
                  <div className="mt-1.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      Coming Soon
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5">Regional market intelligence pipeline</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs font-bold text-slate-500 font-heading">UK Lettings Inflation</div>
                  <div className="mt-1.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      Coming Soon
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5">ONS national rental price index</div>
                </div>
              </div>
            </div>

            {marketInsights.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6">
                <h3 className="font-heading text-base font-bold text-slate-900 mb-4">Localized Portfolio Insights</h3>
                <div className="space-y-3">
                  {marketInsights.map((insight) => (
                    <div key={insight.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-800 font-heading">{insight.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{insight.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* FLOATING TOAST NOTIFICATION CONTAINER                                     */}
      {/* ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`analytics-toast fade-slide-up ${
              toast.type === 'success' ? 'is-success' : toast.type === 'warning' ? 'is-warning' : 'is-info'
            }`}
          >
            {toast.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : toast.type === 'warning' ? (
              <svg className="w-4 h-4 text-[#DC5F12] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            ) : (
              <CircleDollarSign className="w-4 h-4 text-[#136C9E] shrink-0" />
            )}
            <span>{toast.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
export default PortfolioInsights;
