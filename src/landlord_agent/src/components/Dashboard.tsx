import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
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
  Home,
  Check,
  User,
  ChevronRight,
  Bath,
  BedDouble,
  CalendarDays,
  PoundSterling,
  MessageSquare,
} from "lucide-react";
import { Property, UserProfile, MarketInsight, Tenant } from "../App";
import { trackEvent } from "../../../utils/analytics";
import { countPortfolio, isUnitOccupied, isPropertyArchived } from "../utils/portfolioStats";
import viewingService from "../../../services/viewingService";
import { listViewingsForLandlord } from "../../../services/viewingInboxService";
import { useMessagingContext } from "../../../contexts/MessagingContext";
import AuthContext from "../../../contexts/AuthContext";
import "../styles/dashboardOverview.css";

interface DashboardProps {
  properties: Property[];
  unassignedDocuments?: any[];
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
  onViewMessages?: () => void;
  onViewAllProperties?: () => void;
  onViewViewings?: () => void;
  onViewClients?: () => void;
  onViewDocuments?: (documentId?: string) => void;
  onViewVacancyAlert?: (alertId: string) => void;
  onViewArrearsAlert?: (alertId: string) => void;
  marketInsights: MarketInsight[];
  vacancyAlerts?: any[];
  arrearsAlerts?: any[];
  onSignIn?: () => void;
}

type PropertyPill = "all" | "latest" | "highest" | "expiring" | "archived";

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

const OPEN_VIEWING_STATUSES = new Set(["pending", "requested", "confirmed", "rescheduled"]);

function viewingWhen(item: { viewingDetails?: { date?: string; time?: string } }): string {
  const date = item.viewingDetails?.date || "";
  const time = item.viewingDetails?.time || "";
  if (!date) return "Date to be confirmed";
  const parsed = new Date(date.includes("T") ? date : `${date}T00:00:00`);
  const label = Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return time ? `${label} · ${time}` : label;
}

function coverUrl(property: Property): string | null {
  const validPhotos = property.photos?.filter((p) => p && p.url && !p.url.startsWith("blob:")) || [];
  const cover = validPhotos.find((p) => p.isCover) || validPhotos[0];
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
    <div className={`empty-state-view ll-empty-view ${className}`.trim()}>
      <div className={`empty-state-icon ll-empty-icon${iconTone !== "default" ? ` ${iconTone}` : ""}`}>
        {icon}
      </div>
      <div className="empty-state-title ll-empty-title">{title}</div>
      <div className="empty-state-desc ll-empty-desc">{description}</div>
      {actionLabel && onAction && (
        <button
          type="button"
          className={`empty-state-btn ll-empty-btn ${actionVariant}`}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
      {footer}
    </div>
  );
}

function OccupancyDonut({
  occupied,
  vacant,
  renovating = 0,
  total,
  hoveredSegment,
  onHoverSegment,
}: {
  occupied: number;
  vacant: number;
  renovating?: number;
  total: number;
  hoveredSegment: "occupied" | "vacant" | "renovating" | null;
  onHoverSegment: (seg: "occupied" | "vacant" | "renovating" | null) => void;
}) {
  const pct = total > 0 ? occupied / total : 0;
  const vacantPct = total > 0 ? vacant / total : 0;
  const renovatingPct = total > 0 ? renovating / total : 0;
  const r = 72;
  const c = 2 * Math.PI * r;
  const occupiedLen = c * pct;
  const vacantLen = c * vacantPct;
  const renovatingLen = c * renovatingPct;

  let tooltipText = `Occupied: ${occupied} units (${Math.round(pct * 100)}%)`;
  if (hoveredSegment === "vacant") {
    tooltipText = `Vacant: ${vacant} units (${Math.round(vacantPct * 100)}%)`;
  } else if (hoveredSegment === "renovating") {
    tooltipText = `Renovating: ${renovating} units (${Math.round(renovatingPct * 100)}%)`;
  }

  return (
    <div
      className="donut-gauge ll-donut-wrap"
      aria-label={`Occupancy ${Math.round(pct * 100)}%`}
      onMouseLeave={() => onHoverSegment(null)}
    >
      <div className={`donut-tooltip-badge${hoveredSegment ? " visible" : ""}`}>
        {tooltipText}
      </div>
      <svg
        className="donut-svg ll-donut-svg"
        viewBox="0 0 200 200"
        aria-hidden="true"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx="100"
          cy="100"
          r={r}
          className={`donut-green-arc${hoveredSegment === "occupied" ? " active-highlight" : ""}`}
          strokeDasharray={`${occupiedLen} ${c}`}
          onMouseEnter={() => onHoverSegment("occupied")}
        >
          <title>{`Occupied: ${occupied} units (${Math.round(pct * 100)}%)`}</title>
        </circle>
        <circle
          cx="100"
          cy="100"
          r={r}
          className={`donut-white-arc${hoveredSegment === "vacant" ? " active-highlight" : ""}`}
          strokeDasharray={`${vacantLen} ${c}`}
          strokeDashoffset={-occupiedLen}
          onMouseEnter={() => onHoverSegment("vacant")}
        >
          <title>{`Vacant: ${vacant} units (${Math.round(vacantPct * 100)}%)`}</title>
        </circle>
        {renovatingLen > 0 && (
          <circle
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="38"
            strokeDasharray={`${renovatingLen} ${c}`}
            strokeDashoffset={-(occupiedLen + vacantLen)}
            strokeLinecap="butt"
            onMouseEnter={() => onHoverSegment("renovating")}
          >
            <title>{`Renovating: ${renovating} units (${Math.round(renovatingPct * 100)}%)`}</title>
          </circle>
        )}
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
  onViewMessages,
  addLabel = "Add Property",
  showInsights = true,
}: {
  userName: string;
  onViewInsights?: () => void;
  onAddProperty?: () => void;
  onRefresh?: () => void;
  onViewSettings?: () => void;
  onViewNotifications?: () => void;
  onViewMessages?: () => void;
  addLabel?: string;
  showInsights?: boolean;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { unreadCount } = useMessagingContext();

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh?.();
    window.setTimeout(() => setIsRefreshing(false), 700);
  };

  return (
    <header className="header-bar ll-header-bar">
      <div className="header-title-row">
        <div className="header-title-group">
          <h1>
            Welcome, <span>{userName}</span>
          </h1>
          <p>Here&apos;s the latest update on your portfolio today.</p>
        </div>
      </div>
      <div className="header-actions ll-header-actions">
        <button
          type="button"
          className={`icon-action-btn ll-header-icon${isRefreshing ? " refreshing" : ""}`}
          title="Refresh Portfolio Data"
          onClick={handleRefresh}
        >
          <RefreshCw size={16} />
        </button>
        <button
          type="button"
          className="icon-action-btn ll-header-icon"
          title="Settings & Preferences"
          aria-label="Settings"
          onClick={onViewSettings}
        >
          <Settings size={18} />
        </button>
        <button
          type="button"
          className="icon-action-btn ll-header-icon"
          title="Messages"
          onClick={onViewMessages || onViewNotifications}
          style={{ position: "relative" }}
        >
          <MessageSquare size={18} />
          {unreadCount > 0 && (
            <span
              aria-label={`${unreadCount} unread messages`}
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                fontSize: "10px",
                fontWeight: 700,
                lineHeight: 1,
                minWidth: "16px",
                height: "16px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 3px",
                pointerEvents: "none",
              }}
            >
              {unreadCount > 99 ? "99+" : String(unreadCount)}
            </span>
          )}
        </button>
        <button
          type="button"
          className="icon-action-btn ll-header-icon"
          title="Notifications"
          onClick={onViewNotifications}
          style={{ position: "relative" }}
        >
          <Bell size={18} />
          <span className="ll-header-dot" />
        </button>
        {showInsights && (
          <button
            type="button"
            className="btn-insights ll-header-insights"
            onClick={onViewInsights}
          >
            <span className="ll-insights-icon">✦</span>
            <span>Portfolio Insights</span>
          </button>
        )}
        {onAddProperty && (
          <button
            type="button"
            className="btn-add-property ll-header-add"
            onClick={onAddProperty}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>{addLabel}</span>
          </button>
        )}
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
    <div className="dashboard-root ll-overview">
      <DashboardOverviewHeader
        userName={userName}
        showInsights={false}
        onRefresh={onRefresh}
        onViewSettings={onViewSettings}
        onViewNotifications={onViewNotifications}
      />
      <div className="ll-overview-inner">
        <section className="top-stat-grid ll-top-stat-grid">
          {/* Card 1 Profile Skeleton */}
          <div className="stat-card-gradient card-profile state-loading">
            <div className="sk-circle sk-shimmer-light" style={{ width: 56, height: 56, margin: "0 auto 8px" }} />
            <div className="sk-line sk-shimmer-light" style={{ width: 110, height: 16, margin: "0 auto 6px" }} />
            <div className="sk-line sk-shimmer-light" style={{ width: 150, height: 12, margin: "0 auto 4px" }} />
            <div className="sk-line sk-shimmer-light" style={{ width: 90, height: 11, margin: "0 auto 12px" }} />
            <div className="profile-pill-stats" style={{ marginTop: "auto", display: "flex", gap: 10, width: "100%", justifyContent: "center" }}>
              <div className="sk-box sk-shimmer-light" style={{ height: 50, flex: 1, maxWidth: 140, borderRadius: 14 }} />
              <div className="sk-box sk-shimmer-light" style={{ height: 50, flex: 1, maxWidth: 140, borderRadius: 14 }} />
            </div>
          </div>
          {/* Card 2 Revenue Skeleton */}
          <div className="stat-card-gradient card-revenue state-loading">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div className="sk-line sk-shimmer-light" style={{ width: 130, height: 11 }} />
              <div className="sk-circle sk-shimmer-light" style={{ width: 24, height: 24 }} />
            </div>
            <div className="sk-line sk-shimmer-light" style={{ width: 100, height: 24, marginBottom: 6 }} />
            <div className="sk-line sk-shimmer-light" style={{ width: 75, height: 10 }} />
            <div className="revenue-chart-wrapper" style={{ marginTop: "auto" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 92 }}>
                {[45, 80, 35, 90, 50, 75].map((h, i) => (
                  <div key={i} className="sk-box sk-shimmer-light" style={{ flex: 1, height: `${h}%`, borderRadius: "6px 6px 0 0" }} />
                ))}
              </div>
            </div>
          </div>
          {/* Card 3 Occupancy Skeleton */}
          <div className="stat-card-gradient card-occupancy state-loading">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div className="sk-line sk-shimmer-light" style={{ width: 90, height: 11 }} />
              <div className="sk-circle sk-shimmer-light" style={{ width: 24, height: 24 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, margin: "auto 0" }}>
              <div className="sk-circle sk-shimmer-light" style={{ width: 105, height: 105 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="sk-line sk-shimmer-light" style={{ width: 80, height: 10 }} />
                <div className="sk-line sk-shimmer-light" style={{ width: 40, height: 22 }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: "auto", justifyContent: "center" }}>
              <div className="sk-line sk-shimmer-light" style={{ width: 75, height: 14, borderRadius: 4 }} />
              <div className="sk-line sk-shimmer-light" style={{ width: 75, height: 14, borderRadius: 4 }} />
            </div>
          </div>
        </section>

        {/* Mid-Grid Skeleton */}
        <div className="dashboard-mid-grid ll-mid-grid">
          <div className="mid-left-col ll-mid-left">
            <div className="content-box ll-content-box">
              <div className="sk-line sk-shimmer" style={{ width: 120, height: 16, marginBottom: 16 }} />
              <div style={{ display: "flex", gap: 12, overflow: "hidden" }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="sk-box sk-shimmer" style={{ width: 135, height: 44, borderRadius: 12, flexShrink: 0 }} />
                ))}
              </div>
            </div>
            <div className="content-box analytics-box ll-content-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="sk-line sk-shimmer" style={{ width: 140, height: 16 }} />
                <div className="sk-line sk-shimmer" style={{ width: 100, height: 12 }} />
              </div>
              <div className="sk-line sk-shimmer" style={{ width: 110, height: 12, marginBottom: 16 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div className="sk-line sk-shimmer" style={{ width: 85, height: 12 }} />
                    <div className="sk-box sk-shimmer" style={{ flex: 1, height: 10, borderRadius: 999 }} />
                    <div className="sk-line sk-shimmer" style={{ width: 30, height: 12 }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 20, borderTop: "1px solid #f1f5f9", paddingTop: 36, marginTop: 36 }}>
                <div>
                  <div className="sk-line sk-shimmer" style={{ width: 130, height: 12, marginBottom: 14 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="sk-box sk-shimmer" style={{ height: 14 }} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="sk-line sk-shimmer" style={{ width: 120, height: 12, marginBottom: 14 }} />
                  <div className="sk-box sk-shimmer" style={{ height: 20, borderRadius: 4, marginBottom: 14 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className="sk-line sk-shimmer" style={{ width: "90%", height: 10 }} />
                    <div className="sk-line sk-shimmer" style={{ width: "80%", height: 10 }} />
                    <div className="sk-line sk-shimmer" style={{ width: "70%", height: 10 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mid-right-col ll-mid-right">
            <div className="content-box ll-content-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="sk-line sk-shimmer" style={{ width: 100, height: 16 }} />
                <div className="sk-line sk-shimmer" style={{ width: 50, height: 12 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[0, 1].map((i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                    <div className="sk-box sk-shimmer" style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="sk-line sk-shimmer" style={{ width: 120, height: 11, marginBottom: 6 }} />
                      <div className="sk-line sk-shimmer" style={{ width: 160, height: 13, marginBottom: 8 }} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <div className="sk-box sk-shimmer" style={{ width: 75, height: 26, borderRadius: 999 }} />
                        <div className="sk-box sk-shimmer" style={{ width: 60, height: 26, borderRadius: 999 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="content-box ll-content-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="sk-line sk-shimmer" style={{ width: 70, height: 16 }} />
                <div className="sk-line sk-shimmer" style={{ width: 50, height: 12 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {["#fff5f5", "#fffbeb", "#f0fdf4"].map((bg, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: bg, borderRadius: 12 }}>
                    <div className="sk-circle sk-shimmer" style={{ width: 34, height: 34, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="sk-line sk-shimmer" style={{ width: 100, height: 13, marginBottom: 6 }} />
                      <div className="sk-line sk-shimmer" style={{ width: 130, height: 12, marginBottom: 4 }} />
                      <div className="sk-line sk-shimmer" style={{ width: 80, height: 10 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Properties Skeleton */}
        <div className="properties-section ll-properties-section">
          <div className="sk-line sk-shimmer" style={{ width: 120, height: 22, marginBottom: 14 }} />
          <div className="property-grid ll-property-grid">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="property-card ll-property-card">
                <div className="sk-box sk-shimmer" style={{ height: 160, borderRadius: 0 }} />
                <div className="prop-card-body ll-prop-body">
                  <div className="sk-line sk-shimmer" style={{ width: "40%", height: 18, marginBottom: 6 }} />
                  <div className="sk-line sk-shimmer" style={{ width: "70%", height: 14, marginBottom: 6 }} />
                  <div className="sk-line sk-shimmer" style={{ width: "90%", height: 12, marginBottom: 12 }} />
                  <div className="sk-box sk-shimmer" style={{ height: 36, borderRadius: 8, marginTop: "auto" }} />
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
    <div className="dashboard-root ll-overview">
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
      <div className="ll-overview-inner">
        <div className="global-empty-state ll-global-empty">
          <div className="global-empty-icon ll-global-empty-icon">
            <Home size={32} />
          </div>
          <div className="global-empty-title ll-global-empty-title">
            Welcome to your Proptii Portfolio!
          </div>
          <div className="global-empty-desc ll-global-empty-desc">
            {isGuest
              ? "Sign in to view and manage your properties, tenants, and contracts."
              : "You don't have any properties or active tenancies yet. Add your first property listing to start tracking monthly revenue, tenant alerts, and occupancy rates."}
          </div>
          <div className="global-empty-actions">
            {isGuest ? (
              <button
                type="button"
                className="empty-state-btn primary"
                onClick={onSignIn || defaultSignIn}
              >
                Sign in
              </button>
            ) : (
              <button
                type="button"
                className="empty-state-btn primary"
                onClick={onAddProperty}
              >
                <Plus size={16} strokeWidth={2.5} style={{ marginRight: 6 }} />
                Add First Property
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Dashboard({
  properties,
  unassignedDocuments = [],
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
  onViewMessages,
  onViewAllProperties,
  onViewViewings,
  onViewClients,
  onViewDocuments,
  onViewVacancyAlert,
  onViewArrearsAlert,
  vacancyAlerts = [],
  arrearsAlerts = [],
  onSignIn,
}: DashboardProps) {
  const isUserAuthenticated = isAuthenticated ?? Boolean(userProfile);
  const [propertyPill, setPropertyPill] = useState<PropertyPill>("all");
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState<"occupied" | "vacant" | "renovating" | null>(null);
  const docsCarouselRef = useRef<HTMLDivElement>(null);

  const authContext = useContext(AuthContext);
  const authUser = authContext?.user;
  const [avatarImgError, setAvatarImgError] = useState(false);

  const profilePhoto =
    userProfile?.photoURL ||
    userProfile?.avatar ||
    userProfile?.avatarUrl ||
    userProfile?.photo ||
    userProfile?.profilePhoto ||
    authUser?.photoURL ||
    userProfile?.logo;

  useEffect(() => {
    setAvatarImgError(false);
  }, [profilePhoto]);

  const userInitials = useMemo(() => {
    const raw = userProfile?.name || authUser?.name || "";
    if (!raw.trim() || raw.trim().toLowerCase() === "there") return "U";
    const parts = raw.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return raw.trim().slice(0, 2).toUpperCase();
  }, [userProfile?.name, authUser?.name]);

  const [overviewViewings, setOverviewViewings] = useState<Array<{
    id: string;
    title: string;
    when: string;
    who: string;
    status: string;
  }>>([]);

  useEffect(() => {
    const email = userProfile?.email?.trim().toLowerCase();
    if (!email) {
      setOverviewViewings([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [bookingsResult, linked] = await Promise.all([
          viewingService.getViewingBookingsByEmail(email),
          listViewingsForLandlord({
            email,
            propertyTitles: properties.filter((p) => !isPropertyArchived(p)).map((property) => property.address).filter(Boolean),
          }),
        ]);
        const byId = new Map<string, any>();
        for (const item of [...(bookingsResult.bookings || []), ...linked]) {
          if (item?.id) byId.set(String(item.id), item);
        }
        const rows = Array.from(byId.values())
          .filter((item) => OPEN_VIEWING_STATUSES.has(String(item.status || "").toLowerCase()))
          .sort((a, b) => String(b.createdAt || b.viewingDetails?.date || "").localeCompare(
            String(a.createdAt || a.viewingDetails?.date || ""),
          ))
          .slice(0, 4)
          .map((item) => ({
            id: String(item.id),
            title: item.property?.street || item.propertyTitle || "Property viewing",
            when: viewingWhen(item),
            who: item.viewingDetails?.userDetails?.fullName
              || item.viewingDetails?.userDetails?.email
              || "Prospective tenant",
            status: String(item.status || "pending").toLowerCase(),
          }));
        if (!cancelled) setOverviewViewings(rows);
      } catch {
        if (!cancelled) setOverviewViewings([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userProfile?.email, properties]);

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
      ...uniqueArrearsAlerts.map((alert) => ({ type: "arrears" as const, alert })),
      ...uniqueVacancyAlerts.map((alert) => ({ type: "vacancy" as const, alert })),
    ],
    [uniqueVacancyAlerts, uniqueArrearsAlerts],
  );

  useEffect(() => {
    trackEvent("landlord_dashboard_view", {
      total_properties: properties.length,
      total_tenants: tenants.length,
    });
  }, [properties.length, tenants.length]);

  const portfolio = useMemo(() => countPortfolio(properties, tenants || []), [properties, tenants]);
  const totalProperties = portfolio.total;
  const occupiedProperties = portfolio.occupied;
  const vacantProperties = portfolio.vacant;
  const renovatingProperties = portfolio.renovating;
  const totalRent = portfolio.monthlyRent;

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
        if (isPropertyArchived(property)) return;
        const propertyAddedDate = property.createdAt || new Date();
        if (propertyAddedDate > monthEnd) return;
        if (property.tenant) {
          const leaseStart = property.tenant.leaseStart instanceof Date
            ? property.tenant.leaseStart
            : new Date(property.tenant.leaseStart as any);
          const leaseEnd = property.tenant.leaseEnd instanceof Date
            ? property.tenant.leaseEnd
            : new Date(property.tenant.leaseEnd as any);
          if (!isNaN(leaseStart.getTime()) && !isNaN(leaseEnd.getTime()) && leaseStart <= monthEnd && leaseEnd >= monthStart) {
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
    return properties
      .filter((p) => !isPropertyArchived(p))
      .slice(0, 5)
      .map((p) => {
        const occupied = isUnitOccupied(p, tenants || []);
        return {
          id: p.id,
          label: (p.address.split(",")[0] || p.address).slice(0, 14),
          pct: occupied ? 100 : p.status === "under-renovation" ? 50 : 0,
        };
      });
  }, [properties, tenants]);

  const topRent = useMemo(() => {
    return properties
      .filter((p) => !isPropertyArchived(p))
      .sort((a, b) => (b.rent || 0) - (a.rent || 0))
      .slice(0, 4)
      .map((p) => ({
        name: (p.address.split(",")[0] || p.address).slice(0, 18),
        rent: p.rent || 0,
      }));
  }, [properties]);

  const maxTopRent = useMemo(() => {
    return Math.max(...topRent.map((r) => r.rent), 1);
  }, [topRent]);

  const rentTicks = useMemo(() => {
    const maxR = topRent.length > 0 ? Math.max(...topRent.map((r) => r.rent), 1000) : 1000;
    const step = maxR / 4;
    return [
      "£0",
      `£${(step / 1000).toFixed(1).replace(/\.0$/, "")}k`,
      `£${((step * 2) / 1000).toFixed(1).replace(/\.0$/, "")}k`,
      `£${((step * 3) / 1000).toFixed(1).replace(/\.0$/, "")}k`,
      `£${(maxR / 1000).toFixed(1).replace(/\.0$/, "")}k`,
    ];
  }, [topRent]);

  const blueShades = ["#136C9E", "#2983B6", "#4FA1D0", "#78BFEC"];

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
    const activeProperties = properties.filter((p) => !isPropertyArchived(p));
    const counts = activeProperties.reduce((acc, p) => {
      const key = normalizeType(p.type);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const colors: Record<string, string> = {
      Apartment: "#136C9E",
      House: "#DC5F12",
      Studio: "#06b6d4",
      Commercial: "#8b5cf6",
      HMO: "#10b981",
      Other: "#f59e0b",
    };
    const total = activeProperties.length || 1;
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      pct: Math.round((value / total) * 100),
      color: colors[name] || colors.Other,
    }));
  }, [properties]);

  const documentChips = useMemo(() => {
    const docs: Array<{ id: string; name: string; type: string; property?: Property }> = [];
    properties
      .filter((p) => !isPropertyArchived(p))
      .forEach((p) => {
        (p.documents || []).forEach((d) => {
          docs.push({ id: d.id, name: d.name, type: d.type, property: p });
        });
      });
    unassignedDocuments.forEach((d) => {
      docs.push({ id: d.id, name: d.name, type: d.type || "other" });
    });
    return docs.slice(0, 8);
  }, [properties, unassignedDocuments]);

  const archivedCount = useMemo(() => properties.filter(isPropertyArchived).length, [properties]);

  const displayProperties = useMemo(() => {
    if (propertyPill === "archived") {
      return properties.filter(isPropertyArchived);
    }
    let list = properties.filter((p) => !isPropertyArchived(p));
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
  const maxRent = Math.max(...properties.filter((p) => !isPropertyArchived(p)).map((p) => p.rent || 0), 0);

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
  const firstProperty = properties.find((p) => !isPropertyArchived(p));

  const handleUploadDocument = () => {
    if (onViewDocuments) onViewDocuments();
    else if (firstProperty) onManageDocuments(firstProperty);
    else onAddProperty?.();
  };

  const handleAssignTenant = () => {
    if (onViewClients) onViewClients();
    else if (firstProperty) onViewProperty(firstProperty);
    else onAddProperty?.();
  };

  const handleScheduleViewing = () => {
    if (onViewViewings) onViewViewings();
    else if (onViewAllProperties) onViewAllProperties();
    else onAddProperty?.();
  };

  const handleRecordRent = () => {
    if (onViewAllProperties) onViewAllProperties();
    else onAddProperty?.();
  };

  const handleDocsScrollNext = () => {
    if (docsCarouselRef.current) {
      docsCarouselRef.current.scrollBy({ left: 160, behavior: "smooth" });
    }
  };

  return (
    <div className="dashboard-root ll-overview">
      <DashboardOverviewHeader
        userName={userName}
        onViewInsights={onViewInsights}
        onAddProperty={onAddProperty}
        onRefresh={onRefresh}
        onViewSettings={onViewSettings}
        onViewNotifications={onViewNotifications}
        onViewMessages={onViewMessages}
      />
      <div className="ll-overview-inner">

        {/* Top 3 Stat Cards */}
        <section className="top-stat-grid ll-top-stat-grid">
          {/* Card 1: User Profile Summary */}
          <div className="stat-card-gradient card-profile ll-card-profile" id="containerProfile">
            <div className="state-normal">
              <div className="profile-info-group">
                <div className="user-avatar-wrap ll-profile-avatar-wrap">
                  <div className="user-avatar ll-profile-avatar">
                    {profilePhoto && !avatarImgError ? (
                      <img
                        src={profilePhoto}
                        alt={userName || "Profile photo"}
                        className="user-avatar-img ll-profile-avatar-img"
                        onError={() => setAvatarImgError(true)}
                      />
                    ) : (
                      <span className="user-avatar-initials ll-profile-avatar-initials">
                        {userInitials}
                      </span>
                    )}
                  </div>
                  <div className="avatar-status-badge ll-avatar-badge" title="Verified Account">
                    <Check size={10} color="#fff" strokeWidth={3.5} />
                  </div>
                </div>
                <h3>{userName}</h3>
                <div className="profile-email ll-profile-email" title={userProfile?.email || ""}>
                  {userProfile?.email || "—"}
                </div>
                <div className="profile-phone ll-profile-phone">
                  {userProfile?.phone || "Phone not provided"}
                </div>
              </div>
              <div className="profile-pill-stats ll-pill-stats">
                <div
                  className="pill-stat ll-pill-stat"
                  onClick={onViewAllProperties}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onViewAllProperties?.();
                    }
                  }}
                  title="View all properties"
                >
                  <span className="pill-stat-icon ll-pill-icon">
                    <Home size={18} />
                  </span>
                  <div className="pill-stat-content">
                    <div className="pill-stat-label ll-pill-label">Properties</div>
                    <div className="pill-stat-val ll-pill-val">{totalProperties}</div>
                  </div>
                </div>
                <div
                  className="pill-stat ll-pill-stat"
                  onClick={onViewNotifications}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onViewNotifications?.();
                    }
                  }}
                  title="View alerts"
                >
                  <span className="pill-stat-icon alert-icon ll-pill-icon alert">
                    <Bell size={18} />
                  </span>
                  <div className="pill-stat-content">
                    <div className="pill-stat-label ll-pill-label">Alerts</div>
                    <div className="pill-stat-val ll-pill-val">{combinedAlerts.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Monthly Rental Revenue */}
          <div className={`stat-card-gradient card-revenue ll-card-revenue${!hasRevenue ? " ll-is-empty" : ""}`} id="containerRevenue">
            <div className="state-normal">
              <div className="card-rev-header ll-card-rev-header">
                <span className="label">MONTHLY RENTAL REVENUE</span>
                <div className="card-rev-badge ll-card-rev-badge">£</div>
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
                    <div className="revenue-amount ll-revenue-amount">£ {totalRent.toLocaleString()}</div>
                    <div className="revenue-sub ll-revenue-sub">LAST 6 MONTHS</div>
                  </div>
                  <div className="revenue-chart-wrapper">
                    <div className="revenue-bar-chart ll-revenue-chart" aria-hidden="true">
                      <div className="chart-baseline" />
                      {revenueSeries.map((row) => (
                        <div key={row.month} className="rev-bar-wrap ll-rev-bar-wrap">
                          <div className="bar-tooltip">
                            <span className="bar-month">{row.month.toUpperCase()}</span>
                            <span className="bar-val">£{row.revenue.toLocaleString()}</span>
                          </div>
                          <div
                            className="rev-bar-col ll-rev-bar"
                            style={{ height: `${Math.max(8, Math.round((row.revenue / maxRevenue) * 100))}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Card 3: Occupancy Rate */}
          <div className={`stat-card-gradient card-occupancy ll-card-occupancy${!hasOccupancy ? " ll-is-empty" : ""}`} id="containerOccupancy">
            <div className="state-normal">
              <div className="card-occ-header ll-card-occ-header">
                <span className="label">OCCUPANCY</span>
                <div className="card-occ-badge ll-card-occ-badge">
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
                  <div className="occupancy-body ll-occupancy-body">
                    <OccupancyDonut
                      occupied={occupiedProperties}
                      vacant={vacantProperties}
                      renovating={renovatingProperties}
                      total={totalProperties}
                      hoveredSegment={hoveredDonutSegment}
                      onHoverSegment={setHoveredDonutSegment}
                    />
                    <div className="occupancy-meta ll-occ-meta">
                      <span className="meta-label ll-meta-label">Total Properties</span>
                      <span className="meta-val ll-meta-val">{totalProperties}</span>
                    </div>
                  </div>
                  <div className="occupancy-legend ll-occ-legend">
                    <div
                      className="legend-item ll-legend-item"
                      onMouseEnter={() => setHoveredDonutSegment("occupied")}
                      onMouseLeave={() => setHoveredDonutSegment(null)}
                      title="Hover to highlight occupied units"
                    >
                      <span className="legend-box occupied ll-legend-box occupied" />
                      <span>Occupied - {occupiedProperties}</span>
                    </div>
                    <div
                      className="legend-item ll-legend-item"
                      onMouseEnter={() => setHoveredDonutSegment("vacant")}
                      onMouseLeave={() => setHoveredDonutSegment(null)}
                      title="Hover to highlight vacant units"
                    >
                      <span className="legend-box vacant ll-legend-box vacant" />
                      <span>Vacant - {vacantProperties}</span>
                    </div>
                    {renovatingProperties > 0 && (
                      <div
                        className="legend-item ll-legend-item"
                        onMouseEnter={() => setHoveredDonutSegment("renovating")}
                        onMouseLeave={() => setHoveredDonutSegment(null)}
                        title="Hover to highlight renovating units"
                      >
                        <span className="legend-box renovating ll-legend-box renovating" />
                        <span>Renovating - {renovatingProperties}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Middle Grid: Documents & Analytics on Left, Viewings & Alerts on Right */}
        <div className="dashboard-mid-grid ll-mid-grid">
          {/* Left Column: Span 2 */}
          <div className="mid-left-col ll-mid-left">
            {/* Documents Carousel Box */}
            <div className={`content-box ll-content-box${documentChips.length === 0 ? " ll-is-empty" : ""}`} id="containerDocuments">
              <div className="box-header ll-box-header">
                <h3 className="box-title ll-box-title">Your Documents</h3>
                {(documentChips.length > 0 || onViewDocuments) && (
                  <button type="button" className="box-action-link ll-box-link" onClick={() => onViewDocuments?.()}>
                    View all documents
                    <ChevronRight size={14} />
                  </button>
                )}
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
                <div className="docs-carousel ll-docs-carousel" ref={docsCarouselRef}>
                  {documentChips.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      className="doc-chip ll-doc-chip"
                      onClick={() => onViewDocuments ? onViewDocuments(doc.id) : (doc.property && onManageDocuments(doc.property))}
                      title={doc.name}
                    >
                      <div className={`doc-chip-icon ll-doc-icon ${docBadgeClass(doc.type)}`}>
                        {docExtLabel(doc.type, doc.name)}
                      </div>
                      <div className="doc-chip-info">
                        <div className="doc-name ll-doc-name">{doc.name}</div>
                        <div className="doc-meta ll-doc-meta">{doc.type}</div>
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="docs-carousel-next"
                    title="Next documents"
                    onClick={handleDocsScrollNext}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Portfolio Analytics Box */}
            <div className={`content-box analytics-box ll-content-box${occupancyBars.length === 0 ? " ll-is-empty" : ""}`} id="containerAnalytics">
              <div className="box-header ll-box-header">
                <h3 className="box-title ll-box-title">Portfolio Analytics</h3>
                {occupancyBars.length > 0 && (
                  <button type="button" className="box-action-link ll-box-link" onClick={onViewInsights}>
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
                  <div className="section-subtitle ll-section-subtitle">Property Occupancy</div>
                  <div className="occupancy-bars-list">
                    {occupancyBars.map((row) => (
                      <div key={row.id} className="bar-row ll-bar-row">
                        <span className="bar-label ll-bar-label" title={row.label}>
                          {row.label}
                        </span>
                        <div className="bar-track ll-bar-track">
                          <div className="bar-fill ll-bar-fill" style={{ width: `${row.pct}%` }} />
                        </div>
                        <span className="bar-pct ll-bar-pct">{row.pct}%</span>
                      </div>
                    ))}
                  </div>

                  <div className="analytics-subcharts ll-analytics-sub">
                    {/* Top Performing Properties Subchart */}
                    <div>
                      <div className="subchart-title ll-subchart-title">Top Performing Properties</div>
                      <div className="subchart-subtitle ll-subchart-sub">Monthly gross rent - GBP</div>
                      <div className="rent-bar-chart">
                        {topRent.map((row, idx) => {
                          const barPct = Math.max(8, Math.min(100, Math.round((row.rent / maxTopRent) * 100)));
                          const fillBg = blueShades[idx % blueShades.length];
                          return (
                            <div key={row.name} className="rent-bar-item">
                              <span className="rent-bar-label" title={row.name}>{row.name}</span>
                              <div className="rent-bar-line">
                                <div
                                  className="rent-bar-fill"
                                  style={{ width: `${barPct}%`, background: fillBg }}
                                />
                              </div>
                              <span className="rent-bar-val">£{row.rent.toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="rent-x-axis">
                        {rentTicks.map((tick, i) => (
                          <span key={i}>{tick}</span>
                        ))}
                      </div>
                    </div>

                    {/* Portfolio Composition Subchart */}
                    <div>
                      <div className="subchart-title ll-subchart-title">Portfolio Composition</div>
                      <div className="subchart-subtitle ll-subchart-sub">Share of portfolio by property type</div>
                      <div className="composition-bar">
                        {composition.map((row) => (
                          <div
                            key={row.name}
                            className="comp-seg"
                            style={{ width: `${row.pct}%`, background: row.color }}
                            title={`${row.name}: ${row.pct}% (${row.value})`}
                          >
                            {row.pct >= 10 ? `${row.pct}%` : ""}
                          </div>
                        ))}
                      </div>
                      <div className="composition-legend">
                        {composition.map((row) => (
                          <div key={row.name} className="comp-legend-row">
                            <span className="comp-dot ll-comp-dot" style={{ background: row.color }} />
                            <span>
                              {row.name} <strong>{row.pct}%</strong> · {row.value} {row.value === 1 ? "property" : "properties"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Span 1 */}
          <div className="mid-right-col ll-mid-right">
            {/* Viewings Box */}
            <div className={`content-box ll-content-box${overviewViewings.length === 0 ? " ll-is-empty" : ""}`} id="containerViewings">
              <div className="box-header ll-box-header">
                <h3 className="box-title ll-box-title">Viewings</h3>
                {overviewViewings.length > 0 && (
                  <button type="button" className="box-action-link ll-box-link" onClick={onViewViewings || handleScheduleViewing}>
                    See all
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
              {overviewViewings.length === 0 ? (
                <ContainerEmpty
                  icon={<CalendarDays size={22} />}
                  iconTone="orange"
                  title="No viewings scheduled"
                  description="Upcoming appointments with prospective buyers and tenants will appear here."
                  actionLabel="+ Schedule Viewing"
                  actionVariant="primary"
                  onAction={handleScheduleViewing}
                />
              ) : (
                <div className="viewings-list">
                  {overviewViewings.map((viewing) => (
                    <div key={viewing.id} className="viewing-card">
                      <div className="viewing-thumb">
                        <CalendarDays size={20} />
                      </div>
                      <div className="viewing-details">
                        <div className="viewing-datetime">{viewing.when}</div>
                        <div className="viewing-address" title={viewing.title}>{viewing.title}</div>
                        <div className="viewing-actions">
                          <button
                            type="button"
                            className="btn-pill-action"
                            onClick={onViewViewings || handleScheduleViewing}
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            className="btn-pill-action cancel"
                            onClick={onViewViewings || handleScheduleViewing}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Alerts Box */}
            <div className={`content-box ll-content-box${combinedAlerts.length === 0 ? " ll-is-empty" : ""}`} id="containerAlerts">
              <div className="box-header ll-box-header">
                <h3 className="box-title ll-box-title">Alerts</h3>
              </div>
              {combinedAlerts.length === 0 ? (
                <ContainerEmpty
                  icon={<Check size={22} strokeWidth={2.5} />}
                  iconTone="green"
                  title="All caught up!"
                  description="You have zero pending arrears, inspections, or lease expirations today."
                  footer={
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "4px 14px", borderRadius: "999px" }}>
                      ✓ All systems clear
                    </div>
                  }
                />
              ) : (
                <div className="alerts-list">
                  {combinedAlerts.slice(0, 5).map(({ type, alert }) => {
                    const isArrears = type === "arrears";
                    const themeClass = isArrears ? "red-theme" : "amber-theme";
                    return (
                      <div key={`${type}-${alert.id}`} className={`alert-card ${themeClass}`}>
                        <div className="alert-icon-wrap">
                          {isArrears ? (
                            <span style={{ fontWeight: 800, fontSize: "14px" }}>£</span>
                          ) : (
                            <AlertTriangle size={16} />
                          )}
                        </div>
                        <div className="alert-content">
                          <div className="alert-title">
                            {isArrears ? "Rent Arrears" : "Vacancy Risk"}
                          </div>
                          <div className="alert-desc">
                            {alert.propertyAddress || alert.tenantName || (isArrears ? "Payment overdue" : "Lease ending soon")}
                          </div>
                          <div className="alert-time">
                            {isArrears
                              ? `${alert.daysPastDue || 0} days past due · £${(alert.overdueAmount || 0).toLocaleString()} overdue`
                              : alert.predictedVacancyDate
                                ? `Expires ${new Date(alert.predictedVacancyDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                                : "Action required"}
                          </div>
                        </div>
                        <div className="alert-actions">
                          <button
                            type="button"
                            className="alert-manage-link"
                            onClick={() => {
                              if (type === "vacancy") onViewVacancyAlert?.(alert.id);
                              else onViewArrearsAlert?.(alert.id);
                            }}
                          >
                            {isArrears ? "Manage" : "View Tenant"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Properties */}
        <section className="properties-section ll-properties-section" id="containerProperties">
          <div className="properties-header ll-properties-header">
            <h2>Properties</h2>
            {onViewAllProperties && displayProperties.length > 0 && (
              <button type="button" className="box-action-link ll-box-link" onClick={onViewAllProperties}>
                View properties page
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          {(totalProperties > 0 || archivedCount > 0) && (
            <div className="filter-pills ll-filter-pills">
              {(
                [
                  ["all", "All Properties"],
                  ["latest", "Latest Property"],
                  ["highest", "Highest Rent"],
                  ["expiring", "Expiring Soon"],
                  ...(archivedCount > 0 || propertyPill === "archived"
                    ? [["archived", `Archived (${archivedCount})`]]
                    : []),
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`filter-pill ll-filter-pill ${propertyPill === id ? "active" : ""}`}
                  onClick={() => setPropertyPill(id as PropertyPill)}
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
            <div className="property-grid ll-property-grid">
              {displayProperties.map((property) => {
                const img = coverUrl(property);
                const showHighest = property.rent === maxRent && maxRent > 0;
                const isArchived = isPropertyArchived(property);
                const isOccupied = isUnitOccupied(property, tenants);
                const isRenovating = property.status === "under-renovation";

                let badgeClass = "";
                let badgeLabel = "Vacant";

                if (isArchived) {
                  badgeLabel = "Archived";
                } else if (propertyPill === "highest" || showHighest) {
                  badgeClass = "badge-highest";
                  badgeLabel = "Highest Rent";
                } else if (propertyPill === "latest") {
                  badgeClass = "badge-latest";
                  badgeLabel = "Latest";
                } else if (isOccupied) {
                  badgeLabel = "Occupied";
                } else if (isRenovating) {
                  badgeLabel = "Renovating";
                }

                return (
                  <article key={property.id} className="property-card ll-property-card">
                    <div className="prop-img-container ll-prop-img">
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
                      <div className={`prop-badge ll-prop-badge ${badgeClass}`.trim()}>
                        <span className="badge-dot" />
                        {badgeLabel}
                      </div>
                    </div>
                    <div className="prop-card-body ll-prop-body">
                      <div className="prop-price-row ll-prop-price-row">
                        <div className="prop-price ll-prop-price">
                          £{(property.rent || 0).toLocaleString()} <span>/ month</span>
                        </div>
                        <div className="prop-time-ago ll-prop-time">{timeAgo(property.createdAt)}</div>
                      </div>
                      <div className="prop-name ll-prop-name">
                        {(property.address.split(",")[0] || property.address).trim()}
                      </div>
                      <div className="prop-address ll-prop-address">{property.address}</div>
                      <div className="prop-specs ll-prop-specs">
                        <span className="spec-item ll-spec-item">
                          <BedDouble size={14} />
                          {property.bedrooms} Bedrooms
                        </span>
                        {typeof property.bathrooms === "number" && (
                          <span className="spec-item ll-spec-item">
                            <Bath size={14} />
                            {property.bathrooms} Bathrooms
                          </span>
                        )}
                      </div>
                      {(property.amenities || []).length > 0 && (
                        <div className="prop-tags ll-prop-tags">
                          {property.amenities.slice(0, 3).map((tag) => (
                            <span key={tag} className="prop-tag ll-prop-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="prop-card-actions ll-prop-actions">
                        <button
                          type="button"
                          className="btn-view-details ll-btn-view"
                          onClick={() => onViewProperty(property)}
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          className="btn-icon-sq ll-btn-icon"
                          title="Photos"
                          onClick={() => onManagePhotos(property)}
                        >
                          <Image size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-sq ll-btn-icon"
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
