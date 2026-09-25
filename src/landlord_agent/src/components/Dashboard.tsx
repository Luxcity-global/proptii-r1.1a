import React, { useMemo, useState } from "react";
import {
  Plus,
  Building2,
  Users,
  AlertTriangle,
  FileText,
  Image,
  BarChart3,
  Bell,
  RefreshCw,
  Settings,
  Sparkles,
  Home,
  Check,
  User,
  ChevronRight,
  Bath,
  BedDouble,
  CalendarDays,
  PoundSterling,
} from "lucide-react";
import { Property, UserProfile, MarketInsight, Tenant } from "../App";
import { trackEvent } from "../../../utils/analytics";
import "../styles/dashboardOverview.css";

interface DashboardProps {
  properties: Property[];
  tenants?: Tenant[];
  userProfile: UserProfile | null;
  isAuthenticated?: boolean;
  isPortfolioLoading?: boolean;
  onAddProperty: () => void;
  onViewProperty: (property: Property) => void;
  onManageDocuments: (property: Property) => void;
  onManagePhotos: (property: Property) => void;
  onViewInsights: () => void;
  onRefresh?: () => void;
  onViewSettings?: () => void;
  onViewNotifications?: () => void;
  onViewAllProperties?: () => void;
  onViewViewings?: () => void;
  onViewClients?: () => void;
  onViewVacancyAlert?: (alertId: string) => void;
  onViewArrearsAlert?: (alertId: string) => void;
  marketInsights: MarketInsight[];
  vacancyAlerts?: any[];
  arrearsAlerts?: any[];
  onSignIn?: () => void;
}

type PropertyPill = "all" | "latest" | "highest" | "expiring";

const defaultSignIn = () => {
  if (window.self !== window.top) {
    window.parent.postMessage({ type: "REQUIRE_AUTH", payload: {} }, "*");
  } else {
    sessionStorage.setItem("redirectAfterLogin", "/landlord");
    window.location.href = "/landlord?signin=1";
  }
};

function docBadgeClass(type: string): string {
  const t = (type || "").toLowerCase();
  if (t.includes("epc") || t.includes("gas")) return "blue";
  if (t.includes("tenancy") || t.includes("agreement")) return "orange";
  if (t.includes("insurance")) return "green";
  return "red";
}

function docExtLabel(type: string, name: string): string {
  const lower = `${type} ${name}`.toLowerCase();
  if (lower.includes("pdf")) return "PDF";
  if (lower.includes("xls") || lower.includes("csv")) return "XLS";
  if (lower.includes("txt") || lower.includes("note")) return "TXT";
  return "DOC";
}

function coverUrl(property: Property): string | null {
  const cover = property.photos?.find((p) => p.isCover) || property.photos?.[0];
  return cover?.url || null;
}

function timeAgo(date?: Date): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

function ContainerEmpty({
  icon,
  iconTone = "blue",
  title,
  description,
  actionLabel,
  actionVariant = "primary",
  onAction,
  footer,
  className = "",
}: {
  icon: React.ReactNode;
  iconTone?: "blue" | "orange" | "green" | "white" | "default";
  title: string;
  description: string;
  actionLabel?: string;
  actionVariant?: "primary" | "secondary";
  onAction?: () => void;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`ll-empty-view ${className}`.trim()}>
      <div className={`ll-empty-icon${iconTone !== "default" ? ` ${iconTone}` : ""}`}>{icon}</div>
      <div className="ll-empty-title">{title}</div>
      <div className="ll-empty-desc">{description}</div>
      {actionLabel && onAction && (
        <button type="button" className={`ll-empty-btn ${actionVariant}`} onClick={onAction}>
          {actionLabel}
        </button>
      )}
      {footer}
    </div>
  );
}

function OccupancyDonut({
  occupied,
  total,
}: {
  occupied: number;
  vacant: number;
  total: number;
}) {
  const pct = total > 0 ? occupied / total : 0;
  const r = 72;
  const c = 2 * Math.PI * r;
  const occupiedLen = c * pct;
  const vacantLen = Math.max(0, c - occupiedLen);

  return (
    <div className="ll-donut-wrap" aria-label={`Occupancy ${Math.round(pct * 100)}%`}>
      <svg className="ll-donut-svg" viewBox="0 0 200 200" width="155" height="155" aria-hidden="true">
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="#165c40"
          strokeWidth="38"
          strokeDasharray={`${occupiedLen} ${c}`}
          strokeLinecap={pct > 0 && pct < 1 ? "round" : "butt"}
        />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="#f2fbf7"
          strokeWidth="38"
          strokeDasharray={`${vacantLen} ${c}`}
          strokeDashoffset={-occupiedLen}
          strokeLinecap={pct > 0 && pct < 1 ? "round" : "butt"}
        />
      </svg>
    </div>
  );
}

function DashboardOverviewHeader({
  userName,
  onViewInsights,
  onAddProperty,
  onRefresh,
  onViewSettings,
  onViewNotifications,
  addLabel = "Add Property",
  showInsights = true,
}: {
  userName: string;
  onViewInsights?: () => void;
  onAddProperty?: () => void;
  onRefresh?: () => void;
  onViewSettings?: () => void;
  onViewNotifications?: () => void;
  addLabel?: string;
  showInsights?: boolean;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh?.();
    window.setTimeout(() => setIsRefreshing(false), 700);
  };

  return (
    <header className="ll-header-bar">
      <div className="ll-overview-inner ll-header-inner">
        <div>
          <h1>
            Welcome, <span>{userName}</span>
          </h1>
          <p>Here&apos;s the latest update on your portfolio today.</p>
        </div>
        <div className="ll-header-actions">
          <button
            type="button"
            className={`ll-header-icon${isRefreshing ? " refreshing" : ""}`}
            title="Refresh Portfolio Data"
            onClick={handleRefresh}
          >
            <RefreshCw size={16} />
          </button>
          <button
            type="button"
            className="ll-header-icon"
            title="Settings"
            onClick={onViewSettings}
          >
            <Settings size={18} />
          </button>
          <button
            type="button"
            className="ll-header-icon"
            title="Notifications"
            onClick={onViewNotifications}
          >
            <Bell size={18} />
            <span className="ll-header-dot" />
          </button>
          {showInsights && (
            <button type="button" className="ll-header-insights" onClick={onViewInsights}>
              <span className="ll-insights-icon">
                <Sparkles size={12} />
              </span>
              Portfolio Insights
            </button>
          )}
          {onAddProperty && (
            <button type="button" className="ll-header-add" onClick={onAddProperty}>
              <Plus size={16} strokeWidth={2.5} />
              {addLabel}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function DashboardSkeleton({
  userName,
  onRefresh,
  onViewSettings,
  onViewNotifications,
}: {
  userName: string;
  onRefresh?: () => void;
  onViewSettings?: () => void;
  onViewNotifications?: () => void;
}) {
  return (
    <div className="ll-overview">
      <DashboardOverviewHeader
        userName={userName}
        showInsights={false}
        onRefresh={onRefresh}
        onViewSettings={onViewSettings}
        onViewNotifications={onViewNotifications}
      />
      <div className="ll-overview-inner ll-overview-body">

        <div className="ll-top-stat-grid">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`ll-stat-card ${i === 0 ? "ll-card-profile" : i === 1 ? "ll-card-revenue" : "ll-card-occupancy"}`}
            >
              <div className="ll-sk-light" style={{ width: 44, height: 44, borderRadius: "50%", margin: "0 auto 10px" }} />
              <div className="ll-sk-light" style={{ width: "55%", height: 16, margin: "0 auto 8px" }} />
              <div className="ll-sk-light" style={{ width: "70%", height: 12, margin: "0 auto 16px" }} />
              <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                <div className="ll-sk-light" style={{ flex: 1, height: 52, borderRadius: 14 }} />
                <div className="ll-sk-light" style={{ flex: 1, height: 52, borderRadius: 14 }} />
              </div>
            </div>
          ))}
        </div>

        <div className="ll-mid-grid">
          <div className="ll-mid-left">
            <div className="ll-content-box">
              <div className="ll-sk" style={{ width: 140, height: 16, marginBottom: 16 }} />
              <div style={{ display: "flex", gap: 12 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="ll-sk" style={{ width: 140, height: 52, borderRadius: 12 }} />
                ))}
              </div>
            </div>
            <div className="ll-content-box">
              <div className="ll-sk" style={{ width: 160, height: 16, marginBottom: 16 }} />
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                  <div className="ll-sk" style={{ width: 80, height: 12 }} />
                  <div className="ll-sk" style={{ flex: 1, height: 8, borderRadius: 999 }} />
                  <div className="ll-sk" style={{ width: 28, height: 12 }} />
                </div>
              ))}
            </div>
          </div>
          <div className="ll-mid-right">
            <div className="ll-content-box">
              <div className="ll-sk" style={{ width: 100, height: 16, marginBottom: 16 }} />
              <div className="ll-sk" style={{ width: "100%", height: 72, borderRadius: 12 }} />
            </div>
            <div className="ll-content-box">
              <div className="ll-sk" style={{ width: 80, height: 16, marginBottom: 16 }} />
              <div className="ll-sk" style={{ width: "100%", height: 64, borderRadius: 12, marginBottom: 10 }} />
              <div className="ll-sk" style={{ width: "100%", height: 64, borderRadius: 12 }} />
            </div>
          </div>
        </div>

        <div className="ll-properties-section">
          <div className="ll-sk" style={{ width: 120, height: 22, marginBottom: 14 }} />
          <div className="ll-property-grid">
            {[0, 1].map((i) => (
              <div key={i} className="ll-property-card">
                <div className="ll-sk" style={{ height: 160, borderRadius: 0 }} />
                <div className="ll-prop-body">
                  <div className="ll-sk" style={{ width: "40%", height: 18 }} />
                  <div className="ll-sk" style={{ width: "70%", height: 14 }} />
                  <div className="ll-sk" style={{ width: "90%", height: 12 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardGlobalEmpty({
  variant,
  userName,
  onAddProperty,
  onSignIn,
  onViewInsights,
  onRefresh,
  onViewSettings,
  onViewNotifications,
}: {
  variant: "guest" | "new-user";
  userName: string;
  onAddProperty?: () => void;
  onSignIn?: () => void;
  onViewInsights?: () => void;
  onRefresh?: () => void;
  onViewSettings?: () => void;
  onViewNotifications?: () => void;
}) {
  const isGuest = variant === "guest";
  return (
    <div className="ll-overview">
      {!isGuest && (
        <DashboardOverviewHeader
          userName={userName}
          onViewInsights={onViewInsights}
          onAddProperty={onAddProperty}
          onRefresh={onRefresh}
          onViewSettings={onViewSettings}
          onViewNotifications={onViewNotifications}
          addLabel="Add Property"
        />
      )}
      <div className="ll-overview-inner ll-overview-body">
        <div className="ll-global-empty">
          <div className="ll-global-empty-icon">
            <Home size={32} />
          </div>
          <div className="ll-global-empty-title">Welcome to your Proptii Portfolio!</div>
          <div className="ll-global-empty-desc">
            {isGuest
              ? "Sign in to view and manage your properties, tenants, and contracts."
              : "You don't have any properties or active tenancies yet. Add your first property listing to start tracking monthly revenue, tenant alerts, and occupancy rates."}
          </div>
          {isGuest ? (
            <button type="button" className="ll-btn-add" onClick={onSignIn || defaultSignIn}>
              Sign in
            </button>
          ) : (
            <button type="button" className="ll-btn-add" onClick={onAddProperty}>
              <Plus size={16} strokeWidth={2.5} />
              Add First Property
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Dashboard({
  properties,
  tenants = [],
  userProfile,
  isAuthenticated,
  isPortfolioLoading = false,
  onAddProperty,
  onViewProperty,
  onManageDocuments,
  onManagePhotos,
  onViewInsights,
  onRefresh,
  onViewSettings,
  onViewNotifications,
  onViewAllProperties,
  onViewViewings,
  onViewClients,
  onViewVacancyAlert,
  onViewArrearsAlert,
  vacancyAlerts = [],
  arrearsAlerts = [],
  onSignIn,
}: DashboardProps) {
  const isUserAuthenticated = isAuthenticated ?? Boolean(userProfile);
  const [propertyPill, setPropertyPill] = useState<PropertyPill>("all");

  const uniqueVacancyAlerts = useMemo(() => {
    if (!vacancyAlerts) return [];
    const seen = new Set<string>();
    return vacancyAlerts.filter((alert) => {
      if (!alert) return false;
      const key =
        alert.id ||
        alert.propertyId ||
        `${alert.propertyAddress || "unknown"}-${alert.predictedVacancyDate || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [vacancyAlerts]);

  const uniqueArrearsAlerts = useMemo(() => {
    if (!arrearsAlerts) return [];
    const byTenantOrAddress = new Map<string, (typeof arrearsAlerts)[number]>();
    arrearsAlerts.forEach((alert) => {
      if (!alert) return;
      const key =
        (alert.tenantId && alert.tenantId.toString()) ||
        (alert.propertyAddress && alert.propertyAddress.trim().toLowerCase()) ||
        alert.id;
      if (!key) return;
      const existing = byTenantOrAddress.get(key);
      if (!existing) {
        byTenantOrAddress.set(key, alert);
        return;
      }
      const existingAmount = existing.overdueAmount ?? 0;
      const currentAmount = alert.overdueAmount ?? 0;
      const existingDays = existing.daysPastDue ?? 0;
      const currentDays = alert.daysPastDue ?? 0;
      if (
        currentAmount > existingAmount ||
        (currentAmount === existingAmount && currentDays > existingDays)
      ) {
        byTenantOrAddress.set(key, alert);
      }
    });
    return Array.from(byTenantOrAddress.values());
  }, [arrearsAlerts]);

  const combinedAlerts = useMemo(
    () => [
      ...uniqueVacancyAlerts.map((alert) => ({ type: "vacancy" as const, alert })),
      ...uniqueArrearsAlerts.map((alert) => ({ type: "arrears" as const, alert })),
    ],
    [uniqueVacancyAlerts, uniqueArrearsAlerts],
  );

  React.useEffect(() => {
    trackEvent("landlord_dashboard_view", {
      total_properties: properties.length,
      total_tenants: tenants.length,
    });
  }, [properties.length, tenants.length]);

  const tenantOccupiedIds = useMemo(
    () => new Set((tenants || []).map((t) => t.propertyId)),
    [tenants],
  );

  const totalProperties = properties.length;
  const occupiedProperties = properties.filter((p) => {
    const hasTenant = tenantOccupiedIds.has(p.id);
    return p.status === "occupied" || hasTenant;
  }).length;
  const vacantProperties = properties.filter((p) => {
    const hasTenant = tenantOccupiedIds.has(p.id);
    return p.status === "vacant" && !hasTenant;
  }).length;

  const totalRent = properties
    .filter((p) => p.status === "occupied" || tenantOccupiedIds.has(p.id))
    .reduce((sum, p) => sum + (p.rent || 0), 0);

  const revenueSeries = useMemo(() => {
    const monthlyData: { month: string; revenue: number }[] = [];
    const currentDate = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59);
      const monthName = monthStart.toLocaleDateString("en-GB", { month: "short" });
      let monthlyRevenue = 0;
      properties.forEach((property) => {
        const propertyAddedDate = property.createdAt || new Date();
        if (propertyAddedDate > monthEnd) return;
        if (property.tenant) {
          const leaseStart = property.tenant.leaseStart;
          const leaseEnd = property.tenant.leaseEnd;
          if (leaseStart <= monthEnd && leaseEnd >= monthStart) {
            const revenueStartDate = leaseStart > propertyAddedDate ? leaseStart : propertyAddedDate;
            if (revenueStartDate <= monthEnd) monthlyRevenue += property.rent;
          }
        } else if (property.status === "occupied" && propertyAddedDate <= monthEnd) {
          monthlyRevenue += property.rent;
        }
      });
      monthlyData.push({ month: monthName, revenue: monthlyRevenue });
    }
    return monthlyData;
  }, [properties]);

  const maxRevenue = Math.max(...revenueSeries.map((r) => r.revenue), 1);

  const occupancyBars = useMemo(() => {
    return properties.slice(0, 5).map((p) => {
      const occupied = p.status === "occupied" || tenantOccupiedIds.has(p.id);
      return {
        id: p.id,
        label: (p.address.split(",")[0] || p.address).slice(0, 14),
        pct: occupied ? 100 : p.status === "under-renovation" ? 50 : 0,
      };
    });
  }, [properties, tenantOccupiedIds]);

  const topRent = useMemo(() => {
    return [...properties]
      .sort((a, b) => (b.rent || 0) - (a.rent || 0))
      .slice(0, 4)
      .map((p) => ({
        name: (p.address.split(",")[0] || p.address).slice(0, 18),
        rent: p.rent || 0,
      }));
  }, [properties]);

  const composition = useMemo(() => {
    const normalizeType = (raw: string) => {
      const t = (raw || "").toLowerCase();
      if (t.includes("apartment") || t.includes("flat")) return "Apartment";
      if (t.includes("house")) return "House";
      if (t.includes("studio")) return "Studio";
      if (t.includes("commercial")) return "Commercial";
      if (t.includes("hmo") || t.includes("shared")) return "HMO";
      return "Other";
    };
    const counts = properties.reduce((acc, p) => {
      const key = normalizeType(p.type);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const colors: Record<string, string> = {
      Apartment: "#8b5cf6",
      House: "#3b82f6",
      Studio: "#06b6d4",
      Commercial: "#f97316",
      HMO: "#16a34a",
      Other: "#f59e0b",
    };
    const total = properties.length || 1;
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      pct: Math.round((value / total) * 100),
      color: colors[name] || colors.Other,
    }));
  }, [properties]);

  const documentChips = useMemo(() => {
    const docs: Array<{ id: string; name: string; type: string; property: Property }> = [];
    properties.forEach((p) => {
      (p.documents || []).forEach((d) => {
        docs.push({ id: d.id, name: d.name, type: d.type, property: p });
      });
    });
    return docs.slice(0, 8);
  }, [properties]);

  const displayProperties = useMemo(() => {
    let list = [...properties];
    if (propertyPill === "latest") {
      list.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
      return list.slice(0, 4);
    }
    if (propertyPill === "highest") {
      list.sort((a, b) => (b.rent || 0) - (a.rent || 0));
      return list.slice(0, 4);
    }
    if (propertyPill === "expiring") {
      list = list.filter((p) =>
        (p.documents || []).some((d) => d.status === "expiring-soon" || d.status === "expired"),
      );
      return list.slice(0, 8);
    }
    return list.slice(0, 8);
  }, [properties, propertyPill]);

  const userName = userProfile?.name || "there";
  const maxRent = Math.max(...properties.map((p) => p.rent || 0), 0);

  if (!isUserAuthenticated) {
    return <DashboardGlobalEmpty variant="guest" userName={userName} onSignIn={onSignIn} />;
  }

  if (isPortfolioLoading) {
    return (
      <DashboardSkeleton
        userName={userName}
        onRefresh={onRefresh}
        onViewSettings={onViewSettings}
        onViewNotifications={onViewNotifications}
      />
    );
  }

  const hasRevenue = totalRent > 0 || revenueSeries.some((r) => r.revenue > 0);
  const hasOccupancy = occupiedProperties > 0;
  const firstProperty = properties[0];
  const handleUploadDocument = () => {
    if (firstProperty) onManageDocuments(firstProperty);
    else onAddProperty();
  };
  const handleAssignTenant = () => {
    if (onViewClients) onViewClients();
    else if (firstProperty) onViewProperty(firstProperty);
    else onAddProperty();
  };
  const handleScheduleViewing = () => {
    if (onViewViewings) onViewViewings();
    else if (onViewAllProperties) onViewAllProperties();
    else onAddProperty();
  };
  const handleRecordRent = () => {
    if (onViewAllProperties) onViewAllProperties();
    else onAddProperty();
  };

  return (
    <div className="ll-overview">
      <DashboardOverviewHeader
        userName={userName}
        onViewInsights={onViewInsights}
        onAddProperty={onAddProperty}
        onRefresh={onRefresh}
        onViewSettings={onViewSettings}
        onViewNotifications={onViewNotifications}
      />
      <div className="ll-overview-inner ll-overview-body">

        <section className="ll-top-stat-grid">
          <div className="ll-stat-card ll-card-profile">
            <div>
              <div className="ll-profile-avatar-wrap">
                <div className="ll-profile-avatar">
                  <User size={22} />
                </div>
                <div className="ll-avatar-badge">
                  <Check size={8} color="#fff" strokeWidth={3} />
                </div>
              </div>
              <h3>{userName}</h3>
              <div className="ll-profile-email">{userProfile?.email || "—"}</div>
              <div className="ll-profile-phone">{userProfile?.phone || "Phone not provided"}</div>
            </div>
            <div className="ll-pill-stats">
              <div className="ll-pill-stat">
                <span className="ll-pill-icon">
                  <Home size={16} />
                </span>
                <div>
                  <div className="ll-pill-label">Properties</div>
                  <div className="ll-pill-val">{totalProperties}</div>
                </div>
              </div>
              <div className="ll-pill-stat">
                <span className="ll-pill-icon alert">
                  <Bell size={16} />
                </span>
                <div>
                  <div className="ll-pill-label">Alerts</div>
                  <div className="ll-pill-val">{combinedAlerts.length}</div>
                </div>
              </div>
            </div>
          </div>

          <div className={`ll-stat-card ll-card-revenue${!hasRevenue ? " ll-is-empty" : ""}`}>
            <div className="ll-card-rev-header">
              <span className="label">Monthly Rental Revenue</span>
              <div className="ll-card-rev-badge">£</div>
            </div>
            {!hasRevenue ? (
              <ContainerEmpty
                icon={<PoundSterling size={22} />}
                iconTone="white"
                title="No Revenue Logged"
                description="Transactions will appear once rental disbursements are processed."
                actionLabel="+ Record Rent"
                actionVariant="secondary"
                onAction={handleRecordRent}
              />
            ) : (
              <>
                <div>
                  <div className="ll-revenue-amount">£ {totalRent.toLocaleString()}</div>
                  <div className="ll-revenue-sub">Last 6 months</div>
                </div>
                <div className="ll-revenue-chart" aria-hidden="true">
                  {revenueSeries.map((row) => (
                    <div key={row.month} className="ll-rev-bar-wrap" title={`${row.month}: £${row.revenue}`}>
                      <div
                        className="ll-rev-bar"
                        style={{ height: `${Math.max(8, Math.round((row.revenue / maxRevenue) * 100))}%` }}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className={`ll-stat-card ll-card-occupancy${!hasOccupancy ? " ll-is-empty" : ""}`}>
            <div className="ll-card-occ-header">
              <span className="label">Occupancy</span>
              <div className="ll-card-occ-badge">
                <Check size={14} strokeWidth={3} />
              </div>
            </div>
            {!hasOccupancy ? (
              <ContainerEmpty
                icon={<Home size={22} />}
                iconTone="white"
                title="0% Occupancy"
                description="No active units leased out. Add tenant records to see occupancy breakdown."
                actionLabel="+ Assign Tenant"
                actionVariant="secondary"
                onAction={handleAssignTenant}
              />
            ) : (
              <>
                <div className="ll-occupancy-body">
                  <OccupancyDonut
                    occupied={occupiedProperties}
                    vacant={vacantProperties}
                    total={totalProperties}
                  />
                  <div className="ll-occ-meta">
                    <span className="ll-meta-label">Total Properties</span>
                    <span className="ll-meta-val">{totalProperties}</span>
                  </div>
                </div>
                <div className="ll-occ-legend">
                  <div className="ll-legend-item">
                    <span className="ll-legend-box occupied" />
                    <span>Occupied - {occupiedProperties}</span>
                  </div>
                  <div className="ll-legend-item">
                    <span className="ll-legend-box vacant" />
                    <span>Vacant - {vacantProperties}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <div className="ll-mid-grid">
          <div className="ll-mid-left">
            <div className={`ll-content-box${documentChips.length === 0 ? " ll-is-empty" : ""}`}>
              <div className="ll-box-header">
                <h3 className="ll-box-title ll-heading">Your Documents</h3>
              </div>
              {documentChips.length === 0 ? (
                <ContainerEmpty
                  icon={<FileText size={22} />}
                  iconTone="blue"
                  title="No documents stored"
                  description="Upload tenancy agreements, inventories, and compliance records for quick access."
                  actionLabel="+ Upload Document"
                  actionVariant="primary"
                  onAction={handleUploadDocument}
                />
              ) : (
                <div className="ll-docs-carousel">
                  {documentChips.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      className="ll-doc-chip"
                      onClick={() => onManageDocuments(doc.property)}
                      title={doc.name}
                    >
                      <div className={`ll-doc-icon ${docBadgeClass(doc.type)}`}>
                        {docExtLabel(doc.type, doc.name)}
                      </div>
                      <div>
                        <div className="ll-doc-name">{doc.name}</div>
                        <div className="ll-doc-meta">{doc.type}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={`ll-content-box${occupancyBars.length === 0 ? " ll-is-empty" : ""}`}>
              <div className="ll-box-header">
                <h3 className="ll-box-title ll-heading">Portfolio Analytics</h3>
                {occupancyBars.length > 0 && (
                  <button type="button" className="ll-box-link" onClick={onViewInsights}>
                    View analytics page
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
              {occupancyBars.length === 0 ? (
                <ContainerEmpty
                  icon={<BarChart3 size={24} />}
                  iconTone="blue"
                  title="No Analytics Available"
                  description="Performance graphs, property occupancy rankings, and portfolio breakdown will appear once tenancies begin."
                  actionLabel="+ Add Property Listing"
                  actionVariant="primary"
                  onAction={onAddProperty}
                />
              ) : (
                <>
                  <div className="ll-section-subtitle">Property Occupancy</div>
                  {occupancyBars.map((row) => (
                    <div key={row.id} className="ll-bar-row">
                      <span className="ll-bar-label" title={row.label}>
                        {row.label}
                      </span>
                      <div className="ll-bar-track">
                        <div className="ll-bar-fill" style={{ width: `${row.pct}%` }} />
                      </div>
                      <span className="ll-bar-pct">{row.pct}%</span>
                    </div>
                  ))}
                  <div className="ll-analytics-sub">
                    <div>
                      <div className="ll-subchart-title ll-heading">Top Performing Properties</div>
                      <div className="ll-subchart-sub">Monthly gross rent - GBP</div>
                      {topRent.map((row) => (
                        <div key={row.name} className="ll-rent-row">
                          <span>{row.name}</span>
                          <strong>£{row.rent.toLocaleString()}</strong>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="ll-subchart-title ll-heading">Portfolio Composition</div>
                      <div className="ll-subchart-sub">By property type</div>
                      {composition.map((row) => (
                        <div key={row.name} className="ll-comp-row">
                          <span className="ll-comp-dot" style={{ background: row.color }} />
                          <span>
                            {row.name} <strong>{row.pct}%</strong> · {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="ll-mid-right">
            <div className="ll-content-box ll-is-empty">
              <div className="ll-box-header">
                <h3 className="ll-box-title ll-heading">Viewings</h3>
              </div>
              <ContainerEmpty
                icon={<CalendarDays size={22} />}
                iconTone="orange"
                title="No viewings scheduled"
                description="Upcoming appointments with prospective buyers and tenants will appear here."
                actionLabel="+ Schedule Viewing"
                actionVariant="primary"
                onAction={handleScheduleViewing}
              />
            </div>

            <div className={`ll-content-box${combinedAlerts.length === 0 ? " ll-is-empty" : ""}`}>
              <div className="ll-box-header">
                <h3 className="ll-box-title ll-heading">Priority Alerts</h3>
              </div>
              {combinedAlerts.length === 0 ? (
                <ContainerEmpty
                  icon={<Check size={22} strokeWidth={2.5} />}
                  iconTone="green"
                  title="All caught up!"
                  description="You have zero pending arrears, inspections, or lease expirations today."
                  footer={<div className="ll-empty-badge">✓ All systems clear</div>}
                />
              ) : (
                <div className="ll-alert-list">
                  {combinedAlerts.slice(0, 5).map(({ type, alert }) => (
                    <button
                      key={`${type}-${alert.id}`}
                      type="button"
                      className="ll-alert-item"
                      onClick={() => {
                        if (type === "vacancy") onViewVacancyAlert?.(alert.id);
                        else onViewArrearsAlert?.(alert.id);
                      }}
                    >
                      <div className={`ll-alert-icon ${type}`}>
                        {type === "vacancy" ? <AlertTriangle size={16} /> : <Users size={16} />}
                      </div>
                      <div>
                        <div className="ll-alert-title">
                          {type === "vacancy" ? "Vacancy risk" : "Rent arrears"}
                        </div>
                        <div className="ll-alert-desc">
                          {alert.propertyAddress ||
                            alert.tenantName ||
                            (type === "vacancy" ? "Lease ending soon" : "Payment overdue")}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="ll-properties-section">
          <div className="ll-properties-header">
            <h2 className="ll-heading">Properties</h2>
            {onViewAllProperties && displayProperties.length > 0 && (
              <button type="button" className="ll-box-link" onClick={onViewAllProperties}>
                View properties page
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          {totalProperties > 0 && (
            <div className="ll-filter-pills">
              {(
                [
                  ["all", "All Properties"],
                  ["latest", "Latest Property"],
                  ["highest", "Highest Lease"],
                  ["expiring", "Expiring Soon"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`ll-filter-pill ${propertyPill === id ? "active" : ""}`}
                  onClick={() => setPropertyPill(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {displayProperties.length === 0 ? (
            <div className="ll-properties-empty">
              <ContainerEmpty
                icon={<Building2 size={28} />}
                iconTone="blue"
                title="No properties found"
                description="No properties match your current filter or you haven't added any listings yet."
                actionLabel="Add Property"
                actionVariant="primary"
                onAction={onAddProperty}
              />
            </div>
          ) : (
            <div className="ll-property-grid">
              {displayProperties.map((property) => {
                const img = coverUrl(property);
                const showHighest = property.rent === maxRent && maxRent > 0;
                return (
                  <article key={property.id} className="ll-property-card">
                    <div className="ll-prop-img">
                      {img ? (
                        <img src={img} alt={property.address} />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#94a3b8",
                            background: "#e2e8f0",
                          }}
                        >
                          <Building2 size={36} />
                        </div>
                      )}
                      <div className="ll-prop-badge">
                        {propertyPill === "highest" || showHighest
                          ? "Highest Lease"
                          : property.status === "occupied"
                            ? "Occupied"
                            : property.status === "vacant"
                              ? "Vacant"
                              : "Renovating"}
                      </div>
                    </div>
                    <div className="ll-prop-body">
                      <div className="ll-prop-price-row">
                        <div className="ll-prop-price">
                          £{(property.rent || 0).toLocaleString()} <span>/ month</span>
                        </div>
                        <div className="ll-prop-time">{timeAgo(property.createdAt)}</div>
                      </div>
                      <div className="ll-prop-name">
                        {(property.address.split(",")[0] || property.address).trim()}
                      </div>
                      <div className="ll-prop-address">{property.address}</div>
                      <div className="ll-prop-specs">
                        <span className="ll-spec-item">
                          <BedDouble size={14} />
                          {property.bedrooms} Bedrooms
                        </span>
                        {typeof property.bathrooms === "number" && (
                          <span className="ll-spec-item">
                            <Bath size={14} />
                            {property.bathrooms} Bathrooms
                          </span>
                        )}
                      </div>
                      {(property.amenities || []).length > 0 && (
                        <div className="ll-prop-tags">
                          {property.amenities.slice(0, 3).map((tag) => (
                            <span key={tag} className="ll-prop-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="ll-prop-actions">
                        <button
                          type="button"
                          className="ll-btn-view"
                          onClick={() => onViewProperty(property)}
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          className="ll-btn-icon"
                          title="Photos"
                          onClick={() => onManagePhotos(property)}
                        >
                          <Image size={16} />
                        </button>
                        <button
                          type="button"
                          className="ll-btn-icon"
                          title="Documents"
                          onClick={() => onManageDocuments(property)}
                        >
                          <FileText size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
