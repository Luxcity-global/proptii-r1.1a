import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  BedSingle,
  Building2,
  Camera,
  FileText,
  User,
  Users,
  AlertTriangle,
  PoundSterling,
  Trash2,
  Download,
  Archive,
  CheckSquare,
  Square,
  Copy,
  Check,
  ChevronDown,
  Calendar,
  Home,
  LayoutGrid,
  List,
  Sparkles,
  Bath,
  RefreshCw,
  Settings,
  Bell,
} from 'lucide-react';
import { ImportPropertiesDialog } from './ImportPropertiesDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Property, Tenant, ArrearsAlert, UserProfile } from '../App';
import { LandlordPageEmptyShell } from './LandlordPageEmptyShell';
import { isNewPortfolioUser } from '../utils/portfolioStatus';
import '../styles/propertiesPage.css';

interface PropertiesPageProps {
  properties: Property[];
  tenants: Tenant[];
  arrearsAlerts: ArrearsAlert[];
  onAddProperty: () => void;
  onViewProperty: (property: Property) => void;
  onEditProperty: (property: Property) => void;
  onManageDocuments: (property: Property) => void;
  onManagePhotos: (property: Property) => void;
  onViewTenant: (tenant: Tenant) => void;
  onDeleteProperty?: (property: Property) => void;
  onArchiveProperty?: (property: Property) => void;
  onDuplicateProperty?: (property: Property) => void;
  onExportProperties?: (properties: Property[], format: string) => void;
  onImportProperties?: (properties: Property[]) => void;
  onViewInsights?: () => void;
  onRefresh?: () => void;
  onViewSettings?: () => void;
  onViewNotifications?: () => void;
  isPortfolioLoading?: boolean;
  userProfile?: UserProfile | null;
}

type FilterTab = 'all' | 'attention' | 'vacant' | 'expiring' | 'drafts';
type ViewMode = 'table' | 'grid';
type DisplayStatus = 'occupied' | 'vacant' | 'expiring' | 'renovation';

const PAGE_SIZE_OPTIONS = [5, 10, 20];

function asDate(value?: Date | string | number | null): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function coverUrl(property: Property): string | null {
  const cover = property.photos?.find((p) => p.isCover) || property.photos?.[0];
  return cover?.url || null;
}

function propertyName(address: string): string {
  return (address.split(',')[0] || address).trim();
}

function cityFromAddress(address: string): string {
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function timeAgo(date?: Date | string | number | null): string {
  const d = asDate(date);
  if (!d) return '';
  const days = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

function formatLeaseDate(value?: Date | string | number | null): string {
  const d = asDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(value?: Date | string | number | null): number | null {
  const d = asDate(value);
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

function statusLabel(status: DisplayStatus): string {
  switch (status) {
    case 'vacant':
      return 'Vacant';
    case 'expiring':
      return 'Lease Expiring';
    case 'renovation':
      return 'Under Renovation';
    default:
      return 'Occupied';
  }
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const selected = options.find((option) => option.value === value);
  const display = value === 'all' ? label : selected?.label ?? label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`ll-props-filter${value !== 'all' ? ' is-active' : ''}`}
        >
          <span>{display}</span>
          <ChevronDown size={14} strokeWidth={2.25} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        sideOffset={8}
        collisionPadding={12}
        className="ll-props-filter-menu rounded-[14px] border-slate-200 bg-white p-1.5 shadow-lg min-w-[200px]"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className={`ll-props-filter-item${value === option.value ? ' is-selected' : ''}`}
            onSelect={() => onChange(option.value)}
          >
            <span>{option.label}</span>
            {value === option.value ? <Check size={14} strokeWidth={2.5} /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PropertiesPage({
  properties,
  tenants,
  arrearsAlerts,
  onAddProperty,
  onViewProperty,
  onEditProperty,
  onManageDocuments,
  onManagePhotos,
  onViewTenant,
  onDeleteProperty,
  onArchiveProperty,
  onDuplicateProperty,
  onExportProperties,
  onImportProperties: handleImportProperties,
  onViewInsights,
  onRefresh,
  onViewSettings,
  onViewNotifications,
  isPortfolioLoading = false,
  userProfile,
}: PropertiesPageProps) {
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [leaseStatusFilter, setLeaseStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const arrearsByTenantId = useMemo(() => {
    const map = new Map<string, ArrearsAlert>();
    (arrearsAlerts || []).forEach((alert) => map.set(alert.tenantId, alert));
    return map;
  }, [arrearsAlerts]);

  const getTenantForProperty = (property: Property): Tenant | undefined => {
    let tenant = (tenants || []).find((t) => t.propertyId === property.id);
    if (!tenant && property.tenantId) {
      tenant = (tenants || []).find((t) => t.id === property.tenantId);
    }
    if (!tenant && property.tenant) {
      tenant = property.tenant;
    }
    return tenant;
  };

  const getArrearsForTenant = (tenantId: string) => arrearsByTenantId.get(tenantId);

  const getComplianceStatus = (property: Property) => {
    const docs = property.documents || [];
    const expiredDocs = docs.filter((doc) => doc.status === 'expired').length;
    const expiringSoonDocs = docs.filter((doc) => doc.status === 'expiring-soon').length;
    if (expiredDocs > 0) return { status: 'expired' as const, count: expiredDocs };
    if (expiringSoonDocs > 0) return { status: 'expiring-soon' as const, count: expiringSoonDocs };
    return { status: 'compliant' as const, count: 0 };
  };

  const isOccupied = (property: Property, tenant?: Tenant) => {
    const hasTenant = Boolean(tenant || property.tenantId || property.tenant);
    return property.status === 'occupied' || hasTenant;
  };

  const isVacant = (property: Property, tenant?: Tenant) => {
    return property.status === 'vacant' && !isOccupied(property, tenant);
  };

  const isLeaseExpiring = (tenant?: Tenant, withinDays = 90) => {
    if (!tenant || tenant.status !== 'active') return false;
    const days = daysUntil(tenant.leaseEnd);
    return days !== null && days >= 0 && days <= withinDays;
  };

  const displayStatus = (property: Property, tenant?: Tenant): DisplayStatus => {
    if (isLeaseExpiring(tenant, 90)) return 'expiring';
    if (isOccupied(property, tenant)) return 'occupied';
    if (property.status === 'under-renovation') return 'renovation';
    return 'vacant';
  };

  const hasOverdueRent = (tenant?: Tenant) => {
    if (!tenant) return false;
    const alert = getArrearsForTenant(tenant.id);
    const alertAmount = alert?.overdueAmount ?? 0;
    const tenantOverdueAmount = tenant.overdueAmount ?? 0;
    return tenant.paymentStatus === 'overdue' || alertAmount > 0 || tenantOverdueAmount > 0;
  };

  const paymentKind = (tenant?: Tenant): 'none' | 'overdue' | 'pending' | 'current' => {
    if (!tenant) return 'none';
    if (hasOverdueRent(tenant)) return 'overdue';
    if (tenant.paymentStatus === 'payment-plan') return 'pending';
    return 'current';
  };

  const needsAttention = (property: Property, tenant?: Tenant) => {
    const compliance = getComplianceStatus(property);
    return (
      isVacant(property, tenant) ||
      isLeaseExpiring(tenant, 90) ||
      hasOverdueRent(tenant) ||
      compliance.status !== 'compliant'
    );
  };

  const locations = useMemo(() => {
    const set = new Set<string>();
    (properties || []).forEach((p) => {
      const city = cityFromAddress(p.address);
      if (city) set.add(city);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [properties]);

  const {
    occupiedCount,
    vacantCount,
    occupancyPct,
    averageRent,
    rentSeries,
    rentTrendPct,
    endingSoonCount,
    ending30,
    ending60,
    ending90,
    overdueCount,
    overdueAmount,
    avgDaysLate,
    latestId,
    highestRent,
  } = useMemo(() => {
    const now = new Date();
    const list = properties || [];
    let occupied = 0;
    let vacant = 0;
    let rentSum = 0;
    const endingSoon = new Set<string>();
    let e30 = 0;
    let e60 = 0;
    let e90 = 0;
    const overdueIds = new Set<string>();
    let overdueAmountTotal = 0;
    let daysLateSum = 0;
    let daysLateN = 0;
    let maxRent = 0;
    let newestId = '';
    let newestTime = -Infinity;

    list.forEach((property) => {
      const tenant = getTenantForProperty(property);
      const occupiedProp = isOccupied(property, tenant);
      if (occupiedProp) occupied += 1;
      if (isVacant(property, tenant)) vacant += 1;
      rentSum += property.rent || 0;
      if ((property.rent || 0) > maxRent) maxRent = property.rent || 0;
      const created = asDate(property.createdAt);
      if (created && created.getTime() > newestTime) {
        newestTime = created.getTime();
        newestId = property.id;
      }

      if (tenant) {
        const leaseEnd = asDate(tenant.leaseEnd);
        if (tenant.status === 'active' && leaseEnd && leaseEnd >= now) {
          const days = daysUntil(leaseEnd) ?? 9999;
          if (days <= 90) endingSoon.add(property.id);
          if (days <= 30) e30 += 1;
          else if (days <= 60) e60 += 1;
          else if (days <= 90) e90 += 1;
        }

        if (hasOverdueRent(tenant)) {
          overdueIds.add(property.id);
          const alert = getArrearsForTenant(tenant.id);
          const amount = alert?.overdueAmount || tenant.overdueAmount || 0;
          overdueAmountTotal += amount;
          const days = alert?.daysPastDue ?? 0;
          if (days > 0) {
            daysLateSum += days;
            daysLateN += 1;
          }
        }
      }
    });

    const monthly: { month: string; value: number }[] = [];
    for (let i = 7; i >= 0; i -= 1) {
      const target = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(target.getFullYear(), target.getMonth(), 1);
      const monthEnd = new Date(target.getFullYear(), target.getMonth() + 1, 0, 23, 59, 59);
      const monthName = monthStart.toLocaleDateString('en-GB', { month: 'short' });
      let sum = 0;
      let count = 0;
      list.forEach((property) => {
        const added = asDate(property.createdAt) || new Date(0);
        if (added > monthEnd) return;
        const tenant = getTenantForProperty(property);
        if (tenant) {
          const leaseStart = asDate(tenant.leaseStart);
          const leaseEnd = asDate(tenant.leaseEnd);
          if (leaseStart && leaseEnd && leaseStart <= monthEnd && leaseEnd >= monthStart) {
            sum += property.rent || 0;
            count += 1;
          }
        } else if (property.status === 'occupied' && added <= monthEnd) {
          sum += property.rent || 0;
          count += 1;
        }
      });
      monthly.push({ month: monthName, value: count > 0 ? Math.round(sum / count) : 0 });
    }

    const firstPositive = monthly.find((m) => m.value > 0)?.value || 0;
    const lastValue = monthly[monthly.length - 1]?.value || 0;
    const trend = firstPositive > 0 ? ((lastValue - firstPositive) / firstPositive) * 100 : 0;

    return {
      occupiedCount: occupied,
      vacantCount: vacant,
      occupancyPct: list.length > 0 ? Math.round((occupied / list.length) * 100) : 0,
      averageRent: list.length > 0 ? Math.round(rentSum / list.length) : 0,
      rentSeries: monthly,
      rentTrendPct: trend,
      endingSoonCount: endingSoon.size,
      ending30: e30,
      ending60: e60,
      ending90: e90,
      overdueCount: overdueIds.size,
      overdueAmount: overdueAmountTotal,
      avgDaysLate: daysLateN > 0 ? Math.round(daysLateSum / daysLateN) : 0,
      latestId: newestId,
      highestRent: maxRent,
    };
    // getTenantForProperty / arrears maps are stable enough via properties/tenants/alerts deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties, tenants, arrearsAlerts]);

  const filteredAndSortedProperties = useMemo(() => {
    let filtered = (properties || []).filter((property) => {
      const tenant = getTenantForProperty(property);
      const occupied = isOccupied(property, tenant);
      const vacant = isVacant(property, tenant);
      const expiring = isLeaseExpiring(tenant, 90);
      const pay = paymentKind(tenant);
      const city = cityFromAddress(property.address);
      const matchesLocation = locationFilter === 'all' || city === locationFilter;

      let matchesTab = true;
      if (filterTab === 'attention') matchesTab = needsAttention(property, tenant);
      else if (filterTab === 'vacant') matchesTab = vacant;
      else if (filterTab === 'expiring') matchesTab = expiring;
      else if (filterTab === 'drafts') matchesTab = false;

      let matchesLease = true;
      if (leaseStatusFilter === 'occupied') matchesLease = occupied && !expiring;
      else if (leaseStatusFilter === 'vacant') matchesLease = vacant;
      else if (leaseStatusFilter === 'expiring') matchesLease = expiring;

      let matchesPayment = true;
      if (paymentFilter === 'overdue') matchesPayment = pay === 'overdue';
      else if (paymentFilter === 'pending') matchesPayment = pay === 'pending';
      else if (paymentFilter === 'current') matchesPayment = pay === 'current';

      return matchesLocation && matchesTab && matchesLease && matchesPayment;
    });

    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    properties,
    tenants,
    arrearsAlerts,
    filterTab,
    locationFilter,
    leaseStatusFilter,
    paymentFilter,
  ]);

  const filteredProperties = filteredAndSortedProperties;

  useEffect(() => {
    setPage(1);
  }, [filterTab, locationFilter, leaseStatusFilter, paymentFilter, pageSize, viewMode]);

  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedProperties =
    viewMode === 'table'
      ? filteredProperties.slice((safePage - 1) * pageSize, safePage * pageSize)
      : filteredProperties;

  const maxRentBar = Math.max(...rentSeries.map((r) => r.value), 1);
  const maxEnding = Math.max(ending30, ending60, ending90, 1);
  const totalMonthlyRent = (properties || []).reduce((sum, p) => sum + (p.rent || 0), 0);
  const overdueBarPct =
    totalMonthlyRent > 0 ? Math.min(100, Math.round((overdueAmount / totalMonthlyRent) * 100)) : overdueCount > 0 ? 40 : 0;
  const healthy = occupancyPct >= 80;

  const togglePropertySelection = (propertyId: string) => {
    const next = new Set(selectedProperties);
    if (next.has(propertyId)) next.delete(propertyId);
    else next.add(propertyId);
    setSelectedProperties(next);
    setShowBulkActions(next.size > 0);
  };

  const selectAllProperties = () => {
    if (selectedProperties.size === filteredProperties.length) {
      setSelectedProperties(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedProperties(new Set(filteredProperties.map((p) => p.id)));
      setShowBulkActions(true);
    }
  };

  const clearSelection = () => {
    setSelectedProperties(new Set());
    setShowBulkActions(false);
  };

  const handleBulkDelete = () => {
    if (onDeleteProperty && selectedProperties.size > 0) {
      properties.filter((p) => selectedProperties.has(p.id)).forEach(onDeleteProperty);
      clearSelection();
    }
  };

  const handleBulkArchive = () => {
    if (onArchiveProperty && selectedProperties.size > 0) {
      properties.filter((p) => selectedProperties.has(p.id)).forEach(onArchiveProperty);
      clearSelection();
    }
  };

  const handleBulkExport = (format: string) => {
    if (onExportProperties && selectedProperties.size > 0) {
      onExportProperties(properties.filter((p) => selectedProperties.has(p.id)), format);
      clearSelection();
    }
  };

  const handleBulkDuplicate = () => {
    if (onDuplicateProperty && selectedProperties.size > 0) {
      properties.filter((p) => selectedProperties.has(p.id)).forEach(onDuplicateProperty);
      clearSelection();
    }
  };

  const handleImportPropertiesSubmit = (importedProperties: Property[]) => {
    if (handleImportProperties) handleImportProperties(importedProperties);
    setShowImportDialog(false);
  };

  const isAllSelected = selectedProperties.size === filteredProperties.length && filteredProperties.length > 0;
  const isPartiallySelected = selectedProperties.size > 0 && selectedProperties.size < filteredProperties.length;

  const resetFilters = () => {
    setFilterTab('all');
    setLocationFilter('all');
    setLeaseStatusFilter('all');
    setPaymentFilter('all');
  };

  const filtersActive =
    filterTab !== 'all' ||
    locationFilter !== 'all' ||
    leaseStatusFilter !== 'all' ||
    paymentFilter !== 'all';

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh?.();
    window.setTimeout(() => setIsRefreshing(false), 700);
  };

  const emptyCopy = (() => {
    if (filterTab === 'drafts') {
      return {
        title: 'No draft properties found',
        description:
          'You have no unpublished property listings saved in progress. Create a new property to add it to your portfolio.',
        tone: 'amber' as const,
      };
    }
    if (filterTab === 'attention') {
      return {
        title: 'No properties need attention',
        description: 'Great job! All leases, rent collections, and compliance documents across your portfolio are currently up to date.',
        tone: 'green' as const,
      };
    }
    if (filterTab === 'vacant') {
      return {
        title: 'No vacant properties',
        description: 'All properties matching your current filter set are currently occupied. Your portfolio occupancy is running smoothly.',
        tone: 'blue' as const,
      };
    }
    return {
      title: filtersActive ? 'No properties match your filters' : 'No properties found',
      description: filtersActive
        ? "We couldn't find any portfolio properties matching your active filter criteria. Try broadening your location or status settings, or clear active filters."
        : 'Get started by adding your first property.',
      tone: 'default' as const,
    };
  })();

  const pageButtons = () => {
    const buttons: number[] = [];
    const start = Math.max(1, safePage - 1);
    const end = Math.min(totalPages, start + 2);
    for (let i = Math.max(1, end - 2); i <= end; i += 1) buttons.push(i);
    return buttons;
  };

  const renderActionsMenu = (property: Property, tenant?: Tenant) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="ll-props-icon-btn" title="More actions" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => onViewProperty(property)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEditProperty(property)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Property
        </DropdownMenuItem>
        {tenant && (
          <DropdownMenuItem onClick={() => onViewTenant(tenant)}>
            <User className="mr-2 h-4 w-4" />
            View Tenant
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onManagePhotos(property)}>
          <Camera className="mr-2 h-4 w-4" />
          Manage Photos
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onManageDocuments(property)}>
          <FileText className="mr-2 h-4 w-4" />
          Manage Documents
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicateProperty?.(property)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate Property
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onArchiveProperty?.(property)}>
          <Archive className="mr-2 h-4 w-4" />
          Archive Property
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDeleteProperty?.(property)} className="text-red-600 focus:text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Property
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const cardBadge = (property: Property, tenant?: Tenant): { label: string; className: string } | null => {
    const status = displayStatus(property, tenant);
    if (property.id === latestId) return { label: '★ Latest', className: 'latest' };
    if (highestRent > 0 && property.rent === highestRent) return { label: '★ Highest Lease', className: 'highest' };
    if (status === 'expiring') return { label: '★ Expiring Soon', className: 'expiring' };
    if (status === 'vacant') return { label: '★ Vacant', className: 'vacant' };
    return null;
  };

  if (!userProfile) {
    return <LandlordPageEmptyShell page="properties" variant="guest" />;
  }

  if (!isPortfolioLoading && isNewPortfolioUser(properties)) {
    return (
      <LandlordPageEmptyShell
        page="properties"
        variant="new-user"
        onAddProperty={onAddProperty}
        userName={userProfile.name}
      />
    );
  }

  return (
    <div className="ll-props">
      <header className="ll-props-header">
        <div className="ll-props-inner ll-props-header-inner">
          <div>
            <h1>Properties</h1>
            <p>
              {isPortfolioLoading ? 'Loading portfolio…' : `${properties.length} ${properties.length === 1 ? 'property' : 'properties'} · Portfolio overview`}
            </p>
          </div>
          <div className="ll-props-header-actions">
            <button
              type="button"
              className={`ll-props-header-icon${isRefreshing ? ' refreshing' : ''}`}
              title="Refresh Portfolio Data"
              onClick={handleRefresh}
            >
              <RefreshCw size={16} />
            </button>
            <button
              type="button"
              className="ll-props-header-icon"
              title="Properties Settings"
              onClick={onViewSettings}
            >
              <Settings size={18} />
            </button>
            <button
              type="button"
              className="ll-props-header-icon"
              title="Notifications"
              onClick={onViewNotifications}
            >
              <Bell size={18} />
              <span className="ll-props-header-dot" />
            </button>
            {onViewInsights && (
              <button type="button" className="ll-props-btn-insights" onClick={onViewInsights}>
                <span className="ll-props-insights-icon">
                  <Sparkles size={12} />
                </span>
                Portfolio Insights
              </button>
            )}
            <button type="button" className="ll-props-btn-add" onClick={onAddProperty}>
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Add Property
            </button>
          </div>
        </div>
      </header>

      <div className="ll-props-inner ll-props-body">
        <section className="ll-props-kpi-grid">
          {isPortfolioLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="ll-props-kpi">
                <div className="ll-props-kpi-top">
                  <div className="ll-props-sk" style={{ width: 110, height: 14 }} />
                  <div className="ll-props-sk" style={{ width: 36, height: 36, borderRadius: 12 }} />
                </div>
                <div className="ll-props-sk" style={{ width: 90, height: 32, marginBottom: 16 }} />
                <div className="ll-props-sk" style={{ width: '100%', height: 10, borderRadius: 999 }} />
              </div>
            ))
          ) : (
            <>
              <article className="ll-props-kpi">
                <div>
                  <div className="ll-props-kpi-top">
                    <span className="ll-props-kpi-label">Occupancy Rate</span>
                    <div className="ll-props-kpi-icon green">
                      <Home size={18} />
                    </div>
                  </div>
                  <div className="ll-props-kpi-value">{occupancyPct}%</div>
                  <div className="ll-props-kpi-meta">
                    <strong>{occupiedCount} Occupied</strong>
                    <span>{vacantCount} Vacant</span>
                  </div>
                  <div className="ll-props-seg-bar">
                    <div className="ll-props-seg-fill occ" style={{ width: `${occupancyPct}%` }} />
                    <div className="ll-props-seg-fill vac" style={{ width: `${Math.max(0, 100 - occupancyPct)}%` }} />
                  </div>
                </div>
                <div className="ll-props-kpi-foot">
                  <span className={`ll-props-health${healthy ? '' : ' warn'}`}>
                    <span className="ll-props-dot" />
                    {healthy ? 'Healthy portfolio' : 'Needs attention'}
                  </span>
                </div>
              </article>

              <article className="ll-props-kpi">
                <div>
                  <div className="ll-props-kpi-top">
                    <span className="ll-props-kpi-label">Average Rent</span>
                    <div className="ll-props-kpi-icon blue">
                      <PoundSterling size={18} />
                    </div>
                  </div>
                  <div className="ll-props-kpi-value">£{averageRent.toLocaleString()}</div>
                  <div className="ll-props-rent-chart">
                    {rentSeries.map((bar) => (
                      <div key={bar.month} className="ll-props-rent-bar-wrap" title={`${bar.month}: £${bar.value.toLocaleString()}`}>
                        <div
                          className="ll-props-rent-bar"
                          style={{
                            height: `${Math.max(8, Math.round((bar.value / maxRentBar) * 100))}%`,
                            background: '#136C9E',
                            opacity: 0.35 + 0.65 * (bar.value / maxRentBar),
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="ll-props-kpi-foot">
                  <span className="ll-props-muted">Last 8 months</span>
                  <span className={`ll-props-trend${rentTrendPct < 0 ? ' down' : ''}`}>
                    {rentTrendPct >= 0 ? '▲' : '▼'} {Math.abs(rentTrendPct).toFixed(1)}%
                  </span>
                </div>
              </article>

              <article className="ll-props-kpi">
                <div>
                  <div className="ll-props-kpi-top">
                    <span className="ll-props-kpi-label">Tenancies Ending</span>
                    <div className="ll-props-kpi-icon orange">
                      <Calendar size={18} />
                    </div>
                  </div>
                  <div className="ll-props-kpi-value">{endingSoonCount}</div>
                  <div className="ll-props-sub">Within 90 days</div>
                  <div className="ll-props-tenancy-rows">
                    {[
                      { lbl: '30d', n: ending30, color: '#f43f5e' },
                      { lbl: '60d', n: ending60, color: '#f59e0b' },
                      { lbl: '90d', n: ending90, color: '#3b82f6' },
                    ].map((row) => (
                      <div key={row.lbl} className="ll-props-tenancy-row">
                        <span className="lbl">{row.lbl}</span>
                        <div className="track">
                          <div className="fill" style={{ width: `${Math.round((row.n / maxEnding) * 100)}%`, background: row.color }} />
                        </div>
                        <span className="n">{row.n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              <article className="ll-props-kpi">
                <div>
                  <div className="ll-props-kpi-top">
                    <span className="ll-props-kpi-label">Overdue Rent</span>
                    <div className="ll-props-kpi-icon rose">
                      <AlertTriangle size={18} />
                    </div>
                  </div>
                  <div className="ll-props-kpi-value rose">£{overdueAmount.toLocaleString()}</div>
                  <div className="ll-props-kpi-meta">
                    <strong>
                      {overdueCount} {overdueCount === 1 ? 'Tenant' : 'Tenants'}
                    </strong>
                    <span className="rose">{avgDaysLate > 0 ? `Avg ${avgDaysLate} days late` : 'No late days'}</span>
                  </div>
                  <div className="ll-props-overdue-bar">
                    <div style={{ width: `${overdueBarPct}%` }} />
                  </div>
                </div>
                <div className="ll-props-kpi-foot">
                  <span className="ll-props-outstanding">Outstanding</span>
                  <button
                    type="button"
                    className="ll-props-link-btn"
                    onClick={() => {
                      setFilterTab('all');
                      setPaymentFilter('overdue');
                    }}
                  >
                    View All
                  </button>
                </div>
              </article>
            </>
          )}
        </section>

        <div className="ll-props-toolbar">
          <div className="ll-props-tabs">
            {(
              [
                ['all', 'All'],
                ['attention', 'Needs Attention'],
                ['vacant', 'Vacant'],
                ['expiring', 'Lease Expiring'],
                ['drafts', 'Drafts'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`ll-props-tab${filterTab === id ? ' active' : ''}`}
                onClick={() => setFilterTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="ll-props-toolbar-right">
            <FilterDropdown
              label="Location"
              value={locationFilter}
              onChange={setLocationFilter}
              options={[
                { value: 'all', label: 'All locations' },
                ...locations.map((city) => ({ value: city, label: city })),
              ]}
            />

            <FilterDropdown
              label="Lease status"
              value={leaseStatusFilter}
              onChange={setLeaseStatusFilter}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'occupied', label: 'Occupied' },
                { value: 'expiring', label: 'Lease Expiring' },
                { value: 'vacant', label: 'Vacant' },
              ]}
            />

            <FilterDropdown
              label="Payment"
              value={paymentFilter}
              onChange={setPaymentFilter}
              options={[
                { value: 'all', label: 'All payments' },
                { value: 'current', label: 'Paid on time' },
                { value: 'pending', label: 'Pending' },
                { value: 'overdue', label: 'Overdue' },
              ]}
            />

            <div className="ll-props-view-switch">
              <button
                type="button"
                className={`ll-props-view-btn${viewMode === 'grid' ? ' active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <LayoutGrid size={14} />
                Grid
              </button>
              <button
                type="button"
                className={`ll-props-view-btn${viewMode === 'table' ? ' active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <List size={14} />
                Table
              </button>
            </div>
          </div>
        </div>

        <div className="ll-props-count-row">
          <div>
            Showing <strong>{filteredProperties.length}</strong> {filteredProperties.length === 1 ? 'property' : 'properties'}
          </div>
          <button type="button" className="ll-props-select-all" onClick={selectAllProperties}>
            {isAllSelected ? <CheckSquare size={14} /> : isPartiallySelected ? <CheckSquare size={14} style={{ opacity: 0.5 }} /> : <Square size={14} />}
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {showBulkActions && (
          <div className="ll-props-bulk">
            <div className="ll-props-bulk-left">
              {selectedProperties.size} selected
              <button type="button" className="ll-props-ghost" onClick={clearSelection}>
                Clear selection
              </button>
            </div>
            <div className="ll-props-bulk-actions">
              <button type="button" className="ll-props-bulk-btn" onClick={handleBulkDuplicate} disabled={!onDuplicateProperty}>
                <Copy size={14} /> Duplicate
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="ll-props-bulk-btn" disabled={!onExportProperties}>
                    <Download size={14} /> Export <ChevronDown size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkExport('json')}>Export as JSON</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkExport('excel')}>Export as Excel</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkExport('csv')}>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkExport('pdf')}>Export as PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button type="button" className="ll-props-bulk-btn" onClick={handleBulkArchive} disabled={!onArchiveProperty}>
                <Archive size={14} /> Archive
              </button>
              <button type="button" className="ll-props-bulk-btn danger" onClick={handleBulkDelete} disabled={!onDeleteProperty}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        )}

        {isPortfolioLoading ? (
          <div className="ll-props-table-wrap">
            <div className="ll-props-table-scroll">
              <table className="ll-props-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Status</th>
                    <th>Tenant</th>
                    <th>Rent/Mo</th>
                    <th>Lease End</th>
                    <th className="right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td>
                        <div className="ll-props-sk" style={{ width: 140, height: 14, marginBottom: 6 }} />
                        <div className="ll-props-sk" style={{ width: 100, height: 10 }} />
                      </td>
                      <td>
                        <div className="ll-props-sk" style={{ width: 80, height: 20, borderRadius: 999 }} />
                      </td>
                      <td>
                        <div className="ll-props-sk" style={{ width: 110, height: 12 }} />
                      </td>
                      <td>
                        <div className="ll-props-sk" style={{ width: 64, height: 14 }} />
                      </td>
                      <td>
                        <div className="ll-props-sk" style={{ width: 80, height: 12 }} />
                      </td>
                      <td className="right">
                        <div className="ll-props-sk" style={{ width: 48, height: 12, marginLeft: 'auto' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="ll-props-empty">
            <div className={`ll-props-empty-icon ${emptyCopy.tone === 'default' ? '' : emptyCopy.tone}`.trim()}>
              {emptyCopy.tone === 'green' ? <Users size={28} /> : <Building2 size={28} />}
            </div>
            <div className="ll-props-empty-title">{emptyCopy.title}</div>
            <div className="ll-props-empty-desc">{emptyCopy.description}</div>
            <div className="ll-props-empty-actions">
              {filtersActive && (
                <button type="button" className="ll-props-btn-secondary" onClick={resetFilters}>
                  Clear All Filters
                </button>
              )}
              <button type="button" className="ll-props-btn-add" onClick={onAddProperty}>
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Add Property
              </button>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="ll-props-table-wrap">
            <div className="ll-props-table-scroll">
              <table className="ll-props-table">
                <thead>
                  <tr>
                    <th className="check">
                      <button type="button" className="ll-props-select-all" onClick={selectAllProperties} aria-label="Select all">
                        {isAllSelected ? <CheckSquare size={16} /> : isPartiallySelected ? <CheckSquare size={16} style={{ opacity: 0.5 }} /> : <Square size={16} />}
                      </button>
                    </th>
                    <th>Property</th>
                    <th>Status</th>
                    <th>Tenant</th>
                    <th>Rent/Mo</th>
                    <th>Lease End</th>
                    <th className="right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedProperties.map((property) => {
                    const tenant = getTenantForProperty(property);
                    const status = displayStatus(property, tenant);
                    const arrears = tenant ? getArrearsForTenant(tenant.id) : undefined;
                    return (
                      <tr key={property.id} onClick={() => onViewProperty(property)}>
                        <td className="check">
                          <button
                            type="button"
                            className="ll-props-select-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePropertySelection(property.id);
                            }}
                            aria-label="Select property"
                          >
                            {selectedProperties.has(property.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </td>
                        <td>
                          <div className="ll-props-pname">{propertyName(property.address)}</div>
                          <div className="ll-props-paddr">{property.address}</div>
                        </td>
                        <td>
                          <span className={`ll-props-status ${status}`}>
                            <span className="dot" />
                            {statusLabel(status)}
                          </span>
                        </td>
                        <td>
                          {tenant ? (
                            <span className="ll-props-tenant">
                              {tenant.name}
                              {arrears ? (
                                <AlertTriangle size={12} style={{ marginLeft: 6, color: '#e11d48', display: 'inline' }} />
                              ) : null}
                            </span>
                          ) : (
                            <span className="ll-props-tenant empty">No tenant</span>
                          )}
                        </td>
                        <td className="ll-props-rent">£{(property.rent || 0).toLocaleString()}</td>
                        <td className={`ll-props-lease${status === 'expiring' ? ' expiring' : ''}`}>
                          {tenant ? formatLeaseDate(tenant.leaseEnd) : '—'}
                        </td>
                        <td className="right">
                          <div className="ll-props-row-actions">
                            <button
                              type="button"
                              className="ll-props-view-link"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewProperty(property);
                              }}
                            >
                              View →
                            </button>
                            {renderActionsMenu(property, tenant)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="ll-props-pager">
              <div className="ll-props-pager-left">
                <span>Show</span>
                <select
                  className="ll-props-select"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ll-props-pages">
                <button
                  type="button"
                  className="ll-props-page"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                {pageButtons().map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`ll-props-page${n === safePage ? ' active' : ''}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  className="ll-props-page"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="ll-props-grid">
            {filteredProperties.map((property) => {
              const tenant = getTenantForProperty(property);
              const status = displayStatus(property, tenant);
              const img = coverUrl(property);
              const badge = cardBadge(property, tenant);
              const arrears = tenant ? getArrearsForTenant(tenant.id) : undefined;
              return (
                <article key={property.id} className="ll-props-card">
                  <div className="ll-props-card-img">
                    {img ? (
                      <img src={img} alt={property.address} />
                    ) : (
                      <div className="ll-props-card-img-empty">
                        <Building2 size={36} />
                      </div>
                    )}
                    {badge && <div className={`ll-props-badge ${badge.className}`}>{badge.label}</div>}
                    {status === 'vacant' && <div className="ll-props-vacant-overlay">Vacant</div>}
                    <button
                      type="button"
                      className={`ll-props-card-check${selectedProperties.has(property.id) ? ' selected' : ''}`}
                      onClick={() => togglePropertySelection(property.id)}
                      aria-label="Select property"
                    >
                      {selectedProperties.has(property.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </div>
                  <div className="ll-props-card-body">
                    <div className="ll-props-card-price-row">
                      <div className="ll-props-card-price">
                        £{(property.rent || 0).toLocaleString()} <span>/ month</span>
                      </div>
                      <span className="ll-props-card-time">{timeAgo(property.createdAt)}</span>
                    </div>
                    <div className="ll-props-card-name">{propertyName(property.address)}</div>
                    <div className="ll-props-card-addr">{property.address}</div>
                    <div className="ll-props-card-specs">
                      <span>
                        <BedSingle size={14} /> {property.bedrooms} Bedrooms
                      </span>
                      {typeof property.bathrooms === 'number' && (
                        <span>
                          <Bath size={14} /> {property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}
                        </span>
                      )}
                    </div>
                    {(property.amenities || []).length > 0 && (
                      <div className="ll-props-card-tags">
                        {property.amenities.slice(0, 3).map((tag) => (
                          <span key={tag} className="ll-props-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className={`ll-props-tenant-box ${status === 'renovation' ? 'vacant' : status}`}>
                      {status === 'vacant' || status === 'renovation' ? (
                        <>
                          <div className="ll-props-tenant-label">
                            <span className="dot" style={{ width: 6, height: 6, borderRadius: 99, background: '#94a3b8', display: 'inline-block' }} />
                            {status === 'renovation' ? 'Under renovation' : 'Vacant'}
                          </div>
                          <div style={{ color: '#64748b', marginTop: 4 }}>
                            {status === 'renovation' ? 'Property is currently being renovated.' : 'No current tenant'}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="ll-props-tenant-box-head">
                            <div className="ll-props-tenant-label">
                              <span className="dot" style={{ width: 6, height: 6, borderRadius: 99, background: status === 'expiring' ? '#f43f5e' : '#10b981', display: 'inline-block' }} />
                              {status === 'expiring' ? 'Lease expiring' : 'Occupied'}
                            </div>
                            {status === 'expiring' && <span className="ll-props-action-needed">Action Needed</span>}
                          </div>
                          <div className="ll-props-tenant-name">
                            <User size={14} />
                            {tenant?.name}
                            {arrears ? <AlertTriangle size={12} color="#e11d48" /> : null}
                          </div>
                          <div className="ll-props-tenant-dates">
                            <span>Since {formatLeaseDate(tenant?.leaseStart)}</span>
                            <span className={status === 'expiring' ? 'end-warn' : ''}>Ends {formatLeaseDate(tenant?.leaseEnd)}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="ll-props-card-actions">
                      <button type="button" className="ll-props-card-view" onClick={() => onViewProperty(property)}>
                        View Details
                      </button>
                      <button type="button" className="ll-props-icon-btn" title="Photos" onClick={() => onManagePhotos(property)}>
                        <Camera size={16} />
                      </button>
                      <button type="button" className="ll-props-icon-btn" title="Documents" onClick={() => onManageDocuments(property)}>
                        <FileText size={16} />
                      </button>
                      {renderActionsMenu(property, tenant)}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Import Properties Dialog - Hidden for now */}
      {/*
      <ImportPropertiesDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImportPropertiesSubmit}
      />
      */}
    </div>
  );
}
