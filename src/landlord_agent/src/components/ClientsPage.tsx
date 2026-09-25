import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Users,
  AlertTriangle,
  PoundSterling,
  Eye,
  Clock,
  Trash2,
  Download,
  Archive,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Settings,
  Bell,
  Briefcase,
  Building2,
  LayoutGrid,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tenant, Property, ArrearsAlert, UserRole, UserProfile } from '../App';
import { referencingService } from '../services/referencingService';
import { LandlordPageEmptyShell } from './LandlordPageEmptyShell';
import { isNewPortfolioUser } from '../utils/portfolioStatus';
import { useLandlords, Landlord } from '../hooks/useLandlords';
import '../styles/clientsPage.css';

interface ClientsPageProps {
  tenants: Tenant[];
  properties: Property[];
  arrearsAlerts: ArrearsAlert[];
  userRole: UserRole;
  onViewTenant: (tenant: Tenant, options?: { tab?: string }) => void;
  onViewProperty: (property: Property) => void;
  onAddTenant: () => void;
  onAddLandlord: () => void;
  onViewLandlord: (landlord: Landlord) => void;
  onDeleteTenant?: (tenantId: string) => void;
  onArchiveTenant?: (tenantId: string) => void;
  onExportTenants?: (format: 'json' | 'csv' | 'excel' | 'pdf') => void;
  onDeleteLandlord?: (landlordId: string) => void;
  onArchiveLandlord?: (landlordId: string) => void;
  userProfile?: UserProfile | null;
  onExportLandlords?: (format: 'json' | 'csv' | 'excel' | 'pdf') => void;
  onAddProperty?: () => void;
  onViewInsights?: () => void;
  onViewSettings?: () => void;
  onViewNotifications?: () => void;
}

const AVATAR_TONES = ['blue', 'teal', 'violet', 'amber', 'rose'] as const;
const PAGE_SIZE_OPTIONS = [5, 10, 20];

function getReferencingStatusColor(status: 'not-started' | 'in-progress' | 'complete') {
  switch (status) {
    case 'complete':
      return 'complete';
    case 'in-progress':
      return 'progress';
    default:
      return 'idle';
  }
}

function getReferencingStatusLabel(status: 'not-started' | 'in-progress' | 'complete') {
  switch (status) {
    case 'complete':
      return 'Complete';
    case 'in-progress':
      return 'In progress';
    default:
      return 'Not yet started';
  }
}

function clientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return ((parts[0][0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

function avatarTone(name: string): (typeof AVATAR_TONES)[number] {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_TONES[sum % AVATAR_TONES.length];
}

function asDate(value?: Date | string | number | null): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value?: Date | string | number | null): string {
  const d = asDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return `£${(amount || 0).toLocaleString()}`;
}

function propertyParts(address: string): { property: string; unit: string } {
  const parts = (address || '').split(',').map((p) => p.trim()).filter(Boolean);
  return {
    property: parts[0] || address || '—',
    unit: parts.slice(1).join(', ') || '—',
  };
}

function daysUntil(value?: Date | string | number | null): number | null {
  const d = asDate(value);
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

function paymentChip(status: Tenant['paymentStatus']): { key: 'paid' | 'due' | 'overdue'; label: string } {
  if (status === 'overdue') return { key: 'overdue', label: 'Overdue' };
  if (status === 'payment-plan') return { key: 'due', label: 'Payment Plan' };
  return { key: 'paid', label: 'Paid' };
}

function rentCycleLabel(tenant: Tenant): string {
  if (tenant.paymentFrequency === 'yearly') return 'PER YR';
  if (tenant.paymentFrequency === 'fixed-time') return 'FIXED';
  return 'PER MO';
}

function parseMoney(value: string): number {
  const n = parseFloat((value || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
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
  const display = value === 'all' || value === 'default' ? label : selected?.label ?? label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`ll-cl-filter${value !== 'all' && value !== 'default' ? ' is-active' : ''}`}
        >
          <span>{display}</span>
          <ChevronDown size={14} strokeWidth={2.25} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="ll-cl-filter-menu rounded-[14px] border-slate-200 bg-white p-1.5 min-w-[200px]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className={`ll-cl-filter-item${value === option.value ? ' is-selected' : ''}`}
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

function mailClient(email: string | undefined, subject: string, body: string) {
  if (!email) return;
  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function pageButtons(current: number, total: number): (number | 'ellipsis')[] {
  const items: (number | 'ellipsis')[] = [];
  for (let page = 1; page <= total; page += 1) {
    if (page === 1 || page === total || (page >= current - 1 && page <= current + 1)) {
      items.push(page);
    } else if (page === current - 2 || page === current + 2) {
      items.push('ellipsis');
    }
  }
  return items;
}

export function ClientsPage({
  tenants,
  properties,
  arrearsAlerts,
  userRole,
  onViewTenant,
  onViewProperty,
  onAddTenant,
  onAddLandlord,
  onViewLandlord,
  onDeleteTenant,
  onArchiveTenant,
  onExportTenants,
  onDeleteLandlord,
  onArchiveLandlord,
  onExportLandlords,
  userProfile,
  onAddProperty,
  onViewInsights,
  onViewSettings,
  onViewNotifications,
}: ClientsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('tenants');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [landlordFilter, setLandlordFilter] = useState('all');
  const [leaseExpiryFilter, setLeaseExpiryFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [tenantSortBy, setTenantSortBy] = useState<string>('default');
  const [landlordSortBy, setLandlordSortBy] = useState<string>('default');
  const [currentTenantPage, setCurrentTenantPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [selectedLandlords, setSelectedLandlords] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [referencingStatuses, setReferencingStatuses] = useState<Map<string, 'not-started' | 'in-progress' | 'complete'>>(new Map());
  const [isLoadingReferencingStatuses, setIsLoadingReferencingStatuses] = useState(false);

  const { landlords: liveLandlords, isLoading: isLandlordsLoading, refresh: refreshLandlords } = useLandlords();
  const showLandlordTab = userRole === 'agent';

  useEffect(() => {
    const fetchReferencingStatuses = async () => {
      if (!userProfile) {
        setReferencingStatuses(new Map());
        return;
      }
      if (tenants.length === 0) return;

      setIsLoadingReferencingStatuses(true);
      const emails = tenants.filter((t) => t.email && t.email.trim()).map((t) => t.email);
      const statuses = await referencingService.getReferencingStatusForTenants(emails);
      setReferencingStatuses(statuses);
      setIsLoadingReferencingStatuses(false);
    };

    fetchReferencingStatuses();
  }, [tenants, userProfile]);

  const toggleTenantSelection = (tenantId: string) => {
    setSelectedTenants((prev) =>
      prev.includes(tenantId) ? prev.filter((id) => id !== tenantId) : [...prev, tenantId]
    );
  };

  const toggleLandlordSelection = (landlordId: string) => {
    setSelectedLandlords((prev) =>
      prev.includes(landlordId) ? prev.filter((id) => id !== landlordId) : [...prev, landlordId]
    );
  };

  const clearSelection = () => {
    setSelectedTenants([]);
    setSelectedLandlords([]);
    setShowBulkActions(false);
  };

  const handleBulkDeleteTenants = () => {
    if (onDeleteTenant) {
      selectedTenants.forEach((tenantId) => onDeleteTenant(tenantId));
      clearSelection();
    }
  };

  const handleBulkArchiveTenants = () => {
    if (onArchiveTenant) {
      selectedTenants.forEach((tenantId) => onArchiveTenant(tenantId));
      clearSelection();
    }
  };

  const handleBulkExportTenants = (format: 'json' | 'csv' | 'excel' | 'pdf') => {
    if (onExportTenants) {
      onExportTenants(format);
    }
  };

  const handleBulkDeleteLandlords = () => {
    if (onDeleteLandlord) {
      selectedLandlords.forEach((landlordId) => onDeleteLandlord(landlordId));
      clearSelection();
      // Re-fetch after deletions resolve
      setTimeout(refreshLandlords, 500);
    }
  };

  const handleBulkArchiveLandlords = () => {
    if (onArchiveLandlord) {
      selectedLandlords.forEach((landlordId) => onArchiveLandlord(landlordId));
      clearSelection();
      setTimeout(refreshLandlords, 500);
    }
  };

  const handleBulkExportLandlords = (format: 'json' | 'csv' | 'excel' | 'pdf') => {
    if (onExportLandlords) {
      onExportLandlords(format);
    }
  };

  React.useEffect(() => {
    setShowBulkActions(selectedTenants.length > 0 || selectedLandlords.length > 0);
  }, [selectedTenants, selectedLandlords]);

  const propertyOptions = useMemo(() => {
    const names = new Set<string>();
    (properties || []).forEach((p) => {
      const name = propertyParts(p.address || '').property;
      if (name && name !== '—') names.add(name);
    });
    (tenants || []).forEach((t) => {
      const name = propertyParts(t.propertyAddress || '').property;
      if (name && name !== '—') names.add(name);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [properties, tenants]);

  const filteredAndSortedTenants = useMemo(() => {
    const now = new Date();
    const arrearsByTenantId = new Map<string, ArrearsAlert>();
    arrearsAlerts.forEach((alert) => arrearsByTenantId.set(alert.tenantId, alert));
    const query = searchTerm.toLowerCase();

    let filtered = (tenants || []).filter((tenant) => {
      const matchesSearch =
        tenant.name.toLowerCase().includes(query) ||
        tenant.email.toLowerCase().includes(query) ||
        (tenant.phone || '').toLowerCase().includes(query) ||
        tenant.propertyAddress.toLowerCase().includes(query);
      const matchesFilter = tenantFilter === 'all' || tenant.status === tenantFilter;

      let matchesOverdue = true;
      if (tenantSortBy === 'overdue-rent-only') {
        const tenantAlert = arrearsByTenantId.get(tenant.id);
        const alertAmount = tenantAlert?.overdueAmount ?? 0;
        const tenantOverdueAmount = tenant.overdueAmount ?? 0;
        const hasOverdueRent = tenant.paymentStatus === 'overdue' || alertAmount > 0 || tenantOverdueAmount > 0;
        matchesOverdue = hasOverdueRent;
      }

      let matchesLeaseExpiry = true;
      if (leaseExpiryFilter !== 'all') {
        const leaseEnd = tenant.leaseEnd instanceof Date ? tenant.leaseEnd : new Date(tenant.leaseEnd);
        const daysUntilExpiry = Math.ceil((leaseEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        switch (leaseExpiryFilter) {
          case 'expired':
            matchesLeaseExpiry = daysUntilExpiry < 0;
            break;
          case '30-days':
            matchesLeaseExpiry = daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
            break;
          case '60-days':
            matchesLeaseExpiry = daysUntilExpiry >= 0 && daysUntilExpiry <= 60;
            break;
          case '90-days':
            matchesLeaseExpiry = daysUntilExpiry >= 0 && daysUntilExpiry <= 90;
            break;
          default:
            matchesLeaseExpiry = true;
        }
      }

      const { property } = propertyParts(tenant.propertyAddress || '');
      const matchesProperty = propertyFilter === 'all' || property === propertyFilter;

      return matchesSearch && matchesFilter && matchesOverdue && matchesLeaseExpiry && matchesProperty;
    });

    if (tenantSortBy !== 'default' && tenantSortBy !== 'overdue-rent-only') {
      filtered = [...filtered].sort((a, b) => {
        const arrearsA = arrearsByTenantId.get(a.id);
        const arrearsB = arrearsByTenantId.get(b.id);

        switch (tenantSortBy) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'rent-asc':
            return a.rentAmount - b.rentAmount;
          case 'rent-desc':
            return b.rentAmount - a.rentAmount;
          case 'lease-expiry-asc': {
            const leaseEndA = a.leaseEnd instanceof Date ? a.leaseEnd : new Date(a.leaseEnd);
            const leaseEndB = b.leaseEnd instanceof Date ? b.leaseEnd : new Date(b.leaseEnd);
            return leaseEndA.getTime() - leaseEndB.getTime();
          }
          case 'lease-expiry-desc': {
            const leaseEndA2 = a.leaseEnd instanceof Date ? a.leaseEnd : new Date(a.leaseEnd);
            const leaseEndB2 = b.leaseEnd instanceof Date ? b.leaseEnd : new Date(b.leaseEnd);
            return leaseEndB2.getTime() - leaseEndA2.getTime();
          }
          case 'overdue-desc': {
            const overdueA = arrearsA?.overdueAmount ?? a.overdueAmount ?? 0;
            const overdueB = arrearsB?.overdueAmount ?? b.overdueAmount ?? 0;
            return overdueB - overdueA;
          }
          case 'overdue-asc': {
            const overdueA2 = arrearsA?.overdueAmount ?? a.overdueAmount ?? 0;
            const overdueB2 = arrearsB?.overdueAmount ?? b.overdueAmount ?? 0;
            return overdueA2 - overdueB2;
          }
          default:
            return 0;
        }
      });
    } else if (tenantSortBy === 'overdue-rent-only') {
      filtered = [...filtered].sort((a, b) => {
        const arrearsA = arrearsByTenantId.get(a.id);
        const arrearsB = arrearsByTenantId.get(b.id);
        const overdueA = arrearsA?.overdueAmount ?? a.overdueAmount ?? 0;
        const overdueB = arrearsB?.overdueAmount ?? b.overdueAmount ?? 0;
        return overdueB - overdueA;
      });
    }

    return filtered;
  }, [tenants, arrearsAlerts, searchTerm, tenantFilter, leaseExpiryFilter, tenantSortBy, propertyFilter]);

  const filteredTenants = filteredAndSortedTenants;

  const filteredAndSortedLandlords = useMemo(() => {
    const query = searchTerm.toLowerCase();
    let filtered = (liveLandlords || []).filter((landlord) => {
      const matchesSearch =
        landlord.name?.toLowerCase().includes(query) ||
        landlord.email?.toLowerCase().includes(query) ||
        (landlord.phone || '').toLowerCase().includes(query);
      const matchesFilter = landlordFilter === 'all' || landlord.status.toLowerCase() === landlordFilter.toLowerCase();
      return matchesSearch && matchesFilter;
    });

    if (landlordSortBy !== 'default') {
      filtered = [...filtered].sort((a, b) => {
        switch (landlordSortBy) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'properties-asc':
            return a.propertyCount - b.propertyCount;
          case 'properties-desc':
            return b.propertyCount - a.propertyCount;
          case 'income-asc':
            return a.activeTenants - b.activeTenants;
          case 'income-desc':
            return b.activeTenants - a.activeTenants;
          case 'portfolio-asc':
            return parseMoney(a.totalValue) - parseMoney(b.totalValue);
          case 'portfolio-desc':
            return parseMoney(b.totalValue) - parseMoney(a.totalValue);
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [liveLandlords, searchTerm, landlordFilter, landlordSortBy]);

  const filteredLandlords = filteredAndSortedLandlords;

  const selectAllTenants = () => {
    if (selectedTenants.length === filteredTenants.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(filteredTenants.map((tenant) => tenant.id));
    }
  };

  const selectAllLandlords = () => {
    if (selectedLandlords.length === filteredLandlords.length) {
      setSelectedLandlords([]);
    } else {
      setSelectedLandlords(filteredLandlords.map((landlord) => landlord.id));
    }
  };

  const totalTenantPages = Math.ceil((filteredTenants || []).length / pageSize) || 1;

  const paginatedTenants = useMemo(() => {
    const start = (currentTenantPage - 1) * pageSize;
    return (filteredTenants || []).slice(start, start + pageSize);
  }, [filteredTenants, currentTenantPage, pageSize]);

  useEffect(() => {
    setCurrentTenantPage(1);
  }, [searchTerm, tenantFilter, leaseExpiryFilter, tenantSortBy, propertyFilter, pageSize]);

  const getArrearsForTenant = (tenantId: string) =>
    (arrearsAlerts || []).find((alert) => alert.tenantId === tenantId);

  const tenantKpis = useMemo(() => {
    const list = tenants || [];
    const props = properties || [];
    const activeTenants = list.filter((t) => t.status === 'active').length;
    const occupiedCount = props.filter((p) => p.status === 'occupied').length || activeTenants;
    const vacantCount = props.filter((p) => p.status === 'vacant').length;
    const occupancyBase = occupiedCount + vacantCount;
    const occupancyPct = occupancyBase > 0 ? Math.round((occupiedCount / occupancyBase) * 100) : list.length > 0 ? 100 : 0;

    const collected = list.filter((t) => t.paymentStatus === 'current').reduce((sum, t) => sum + (t.rentAmount || 0), 0);
    const due = list.reduce((sum, t) => sum + (t.rentAmount || 0), 0);
    const collectedPct = due > 0 ? Math.round((collected / due) * 100) : 0;

    const ending = (days: number) =>
      list.filter((t) => {
        const d = daysUntil(t.leaseEnd);
        return d !== null && d >= 0 && d <= days && t.status === 'active';
      }).length;
    const ending30 = ending(30);
    const ending60 = ending(60);
    const ending90 = ending(90);

    const overdueCount = list.filter((t) => t.paymentStatus === 'overdue').length;
    const overdueAmount = (arrearsAlerts || []).reduce((sum, alert) => sum + (alert.overdueAmount || 0), 0);
    const overdueBarPct = due > 0 ? Math.min(100, Math.round((overdueAmount / due) * 100)) : overdueCount > 0 ? 28 : 0;
    const avgDaysLate = (() => {
      const overdueAlerts = (arrearsAlerts || []).filter((a) => (a.overdueAmount || 0) > 0 && a.daysPastDue);
      if (!overdueAlerts.length) return 0;
      return Math.round(overdueAlerts.reduce((sum, a) => sum + (a.daysPastDue || 0), 0) / overdueAlerts.length);
    })();

    return {
      activeTenants,
      occupiedCount,
      vacantCount,
      occupancyPct,
      collected,
      due,
      collectedPct,
      ending30,
      ending60,
      ending90,
      overdueCount,
      overdueAmount,
      overdueBarPct,
      avgDaysLate,
    };
  }, [tenants, properties, arrearsAlerts]);

  const landlordKpis = useMemo(() => {
    const list = liveLandlords || [];
    const active = list.filter((l) => l.status.toLowerCase() === 'active').length;
    const inactive = list.length - active;
    const units = list.reduce((sum, l) => sum + (l.propertyCount || 0), 0);
    const buildings = list.length;
    const avgUnits = buildings > 0 ? Math.round(units / buildings) : 0;
    const portfolioValue = list.reduce((sum, l) => sum + parseMoney(l.totalValue), 0);
    const pending = list.filter((l) => {
      const s = l.status.toLowerCase();
      return s === 'pending' || s === 'inactive';
    }).length;
    return { total: list.length, active, inactive, units, buildings, avgUnits, portfolioValue, pending };
  }, [liveLandlords]);

  const resetTenantFilters = () => {
    setSearchTerm('');
    setTenantFilter('all');
    setLeaseExpiryFilter('all');
    setPropertyFilter('all');
    setTenantSortBy('default');
  };

  const resetLandlordFilters = () => {
    setSearchTerm('');
    setLandlordFilter('all');
    setLandlordSortBy('default');
  };

  const tenantStart = filteredTenants.length === 0 ? 0 : (currentTenantPage - 1) * pageSize + 1;
  const tenantEnd = Math.min(currentTenantPage * pageSize, filteredTenants.length);

  if (!userProfile) {
    return <LandlordPageEmptyShell page="clients" variant="guest" />;
  }

  if (isNewPortfolioUser(properties)) {
    return (
      <LandlordPageEmptyShell
        page="clients"
        variant="new-user"
        onAddProperty={onAddProperty}
        userName={userProfile.name}
      />
    );
  }

  const showingLandlords = showLandlordTab && activeTab === 'landlords';

  return (
    <div className="ll-cl">
      <header className="ll-cl-header">
        <div className="ll-cl-inner ll-cl-header-inner">
          <div>
            <h1>Clients</h1>
            <p>Manage your tenants, portfolio relationships, agreements, and real-time ledger records.</p>
          </div>
          <div className="ll-cl-header-actions">
            {onViewSettings && (
              <button type="button" className="ll-cl-header-icon" title="Client Settings" onClick={onViewSettings}>
                <Settings size={18} />
              </button>
            )}
            {onViewNotifications && (
              <button type="button" className="ll-cl-header-icon" title="Notifications" onClick={onViewNotifications}>
                <Bell size={18} />
                <span className="ll-cl-header-dot" />
              </button>
            )}
            {onViewInsights && (
              <button type="button" className="ll-cl-btn-insights" onClick={onViewInsights}>
                <span className="ll-cl-insights-icon">
                  <Sparkles size={12} />
                </span>
                Portfolio Insights
              </button>
            )}
            <button
              type="button"
              className="ll-cl-btn-add"
              onClick={showingLandlords ? onAddLandlord : onAddTenant}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              {showingLandlords ? 'Add Landlord' : 'Add Tenant'}
            </button>
          </div>
        </div>
      </header>

      <div className="ll-cl-inner ll-cl-body">
        <div className="ll-cl-switcher-row">
          <div className="ll-cl-switcher">
            <button
              type="button"
              className={`ll-cl-switcher-btn${activeTab === 'tenants' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('tenants')}
            >
              <Users size={16} />
              <span>Tenants</span>
              <span className="ll-cl-switcher-count">{(tenants || []).length}</span>
            </button>
            {showLandlordTab && (
              <button
                type="button"
                className={`ll-cl-switcher-btn${activeTab === 'landlords' ? ' is-active' : ''}`}
                onClick={() => setActiveTab('landlords')}
              >
                <Briefcase size={16} />
                <span>Landlords</span>
                <span className="ll-cl-switcher-count">{(liveLandlords || []).length}</span>
              </button>
            )}
          </div>
        </div>

        {!showingLandlords ? (
          <section className="ll-cl-kpi-grid">
            <article className="ll-cl-kpi is-clickable accent-green" onClick={resetTenantFilters}>
              <div>
                <div className="ll-cl-kpi-top">
                  <span className="ll-cl-kpi-label">Active Tenants</span>
                  <div className="ll-cl-kpi-icon green">
                    <Users size={18} />
                  </div>
                </div>
                <div className="ll-cl-kpi-value">{tenantKpis.activeTenants}</div>
                <div className="ll-cl-kpi-meta">
                  <strong>{tenantKpis.occupiedCount} Occupied</strong>
                  <span>{tenantKpis.vacantCount} Vacant</span>
                </div>
                <div className="ll-cl-seg-bar">
                  <div className="ll-cl-seg-fill occ" style={{ width: `${tenantKpis.occupancyPct}%` }} />
                  <div className="ll-cl-seg-fill vac" style={{ width: `${Math.max(0, 100 - tenantKpis.occupancyPct)}%` }} />
                </div>
              </div>
              <div className="ll-cl-kpi-foot">
                <span className={`ll-cl-health${tenantKpis.occupancyPct >= 70 ? '' : ' warn'}`}>
                  <span className="ll-cl-dot" />
                  {tenantKpis.occupancyPct}% OCCUPANCY
                </span>
                <span className="ll-cl-muted">{tenantKpis.activeTenants === 0 ? 'No tenants recorded' : 'Live directory'}</span>
              </div>
            </article>

            <article className="ll-cl-kpi accent-blue">
              <div>
                <div className="ll-cl-kpi-top">
                  <span className="ll-cl-kpi-label">Rent Collected / Due</span>
                  <div className="ll-cl-kpi-icon blue">
                    <PoundSterling size={18} />
                  </div>
                </div>
                <div className="ll-cl-kpi-value">{formatCurrency(tenantKpis.collected)}</div>
                <div className="ll-cl-kpi-meta">
                  <strong>{formatCurrency(tenantKpis.collected)} collected</strong>
                  <span>of {formatCurrency(tenantKpis.due)} target</span>
                </div>
                <div className="ll-cl-bar">
                  <span style={{ width: `${tenantKpis.collectedPct}%` }} />
                </div>
              </div>
              <div className="ll-cl-kpi-foot">
                <span className="ll-cl-muted">Current cycle</span>
                <span className="ll-cl-link blue">{tenantKpis.collectedPct}% Collected</span>
              </div>
            </article>

            <article
              className="ll-cl-kpi is-clickable accent-amber"
              onClick={() => setLeaseExpiryFilter('90-days')}
            >
              <div>
                <div className="ll-cl-kpi-top">
                  <span className="ll-cl-kpi-label">Expiring Tenancies</span>
                  <div className="ll-cl-kpi-icon orange">
                    <Clock size={18} />
                  </div>
                </div>
                <div className="ll-cl-kpi-value">{tenantKpis.ending90}</div>
                <div className="ll-cl-sub">Within 90 days</div>
                <div className="ll-cl-tenancy-rows">
                  {[
                    { lbl: '30d', n: tenantKpis.ending30, color: '#f43f5e' },
                    { lbl: '60d', n: tenantKpis.ending60, color: '#f59e0b' },
                    { lbl: '90d', n: tenantKpis.ending90, color: '#3b82f6' },
                  ].map((row) => (
                    <div key={row.lbl} className="ll-cl-tenancy-row">
                      <span className="lbl">{row.lbl}</span>
                      <div className="track">
                        <div
                          className="fill"
                          style={{
                            width: `${tenantKpis.ending90 ? Math.round((row.n / Math.max(tenantKpis.ending90, 1)) * 100) : 0}%`,
                            background: row.color,
                          }}
                        />
                      </div>
                      <span className="n">{row.n}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ll-cl-kpi-foot">
                <span className="ll-cl-muted">{tenantKpis.ending90 ? 'Immediate action' : 'All tenancies current'}</span>
                <span className="ll-cl-link">View list →</span>
              </div>
            </article>

            <article
              className="ll-cl-kpi is-clickable accent-rose"
              onClick={() => setTenantSortBy('overdue-rent-only')}
            >
              <div>
                <div className="ll-cl-kpi-top">
                  <span className="ll-cl-kpi-label">Overdue Payments</span>
                  <div className="ll-cl-kpi-icon rose">
                    <AlertTriangle size={18} />
                  </div>
                </div>
                <div className="ll-cl-kpi-value rose">{formatCurrency(tenantKpis.overdueAmount)}</div>
                <div className="ll-cl-kpi-meta">
                  <strong>{tenantKpis.overdueCount} in Arrears</strong>
                  <span className="rose">
                    {tenantKpis.avgDaysLate > 0 ? `Avg ${tenantKpis.avgDaysLate} days late` : 'All accounts clear'}
                  </span>
                </div>
                <div className="ll-cl-bar rose">
                  <span style={{ width: `${tenantKpis.overdueBarPct}%` }} />
                </div>
              </div>
              <div className="ll-cl-kpi-foot">
                <span className={`ll-cl-health ${tenantKpis.overdueCount ? 'rose' : ''}`}>
                  <span className="ll-cl-dot" />
                  {tenantKpis.overdueCount ? 'ACTION REQUIRED' : 'NO ARREARS'}
                </span>
                <span className="ll-cl-link rose">View overdue →</span>
              </div>
            </article>
          </section>
        ) : (
          <section className="ll-cl-kpi-grid">
            <article className="ll-cl-kpi is-clickable accent-green" onClick={resetLandlordFilters}>
              <div>
                <div className="ll-cl-kpi-top">
                  <span className="ll-cl-kpi-label">Active Landlords</span>
                  <div className="ll-cl-kpi-icon green">
                    <Briefcase size={18} />
                  </div>
                </div>
                <div className="ll-cl-kpi-value">{landlordKpis.active}</div>
                <div className="ll-cl-kpi-meta">
                  <strong>{landlordKpis.active} Represented</strong>
                  <span>{landlordKpis.inactive} Inactive</span>
                </div>
                <div className="ll-cl-bar">
                  <span
                    style={{
                      width: `${landlordKpis.total ? Math.round((landlordKpis.active / landlordKpis.total) * 100) : 0}%`,
                      background: '#10b981',
                    }}
                  />
                </div>
              </div>
              <div className="ll-cl-kpi-foot">
                <span className="ll-cl-health">
                  <span className="ll-cl-dot" />
                  {landlordKpis.total} ON FILE
                </span>
                <span className="ll-cl-muted">{isLandlordsLoading ? 'Loading…' : 'Client directory'}</span>
              </div>
            </article>

            <article className="ll-cl-kpi accent-blue">
              <div>
                <div className="ll-cl-kpi-top">
                  <span className="ll-cl-kpi-label">Represented Portfolio</span>
                  <div className="ll-cl-kpi-icon blue">
                    <Building2 size={18} />
                  </div>
                </div>
                <div className="ll-cl-kpi-value">{landlordKpis.units}</div>
                <div className="ll-cl-kpi-meta">
                  <strong>{landlordKpis.buildings} Buildings</strong>
                  <span>Avg {landlordKpis.avgUnits} units/client</span>
                </div>
                <div className="ll-cl-bar">
                  <span style={{ width: landlordKpis.units ? '76%' : '0%' }} />
                </div>
              </div>
              <div className="ll-cl-kpi-foot">
                <span className="ll-cl-muted">Managed units</span>
                <span className="ll-cl-link blue">{landlordKpis.units} Units Active</span>
              </div>
            </article>

            <article className="ll-cl-kpi accent-green">
              <div>
                <div className="ll-cl-kpi-top">
                  <span className="ll-cl-kpi-label">Portfolio Value</span>
                  <div className="ll-cl-kpi-icon green">
                    <PoundSterling size={18} />
                  </div>
                </div>
                <div className="ll-cl-kpi-value">{formatCurrency(landlordKpis.portfolioValue)}</div>
                <div className="ll-cl-kpi-meta">
                  <strong>{landlordKpis.total} landlords</strong>
                  <span>{landlordKpis.units} properties</span>
                </div>
                <div className="ll-cl-bar">
                  <span style={{ width: landlordKpis.portfolioValue ? '70%' : '0%', background: '#10b981' }} />
                </div>
              </div>
              <div className="ll-cl-kpi-foot">
                <span className="ll-cl-muted">Reported portfolio</span>
                <span className="ll-cl-muted">Live totals</span>
              </div>
            </article>

            <article className="ll-cl-kpi accent-amber">
              <div>
                <div className="ll-cl-kpi-top">
                  <span className="ll-cl-kpi-label">Mandates Pending Renewal</span>
                  <div className="ll-cl-kpi-icon orange">
                    <Clock size={18} />
                  </div>
                </div>
                <div className="ll-cl-kpi-value">{landlordKpis.pending}</div>
                <div className="ll-cl-sub">{landlordKpis.pending ? 'Pending or inactive mandates' : 'No mandates awaiting renewal'}</div>
              </div>
              <div className="ll-cl-kpi-foot">
                <span className="ll-cl-muted">{landlordKpis.pending ? 'Needs review' : 'All mandates active'}</span>
                <span className={landlordKpis.pending ? 'll-cl-link' : 'll-cl-health'}>
                  {landlordKpis.pending ? 'View list →' : '✓ Up to date'}
                </span>
              </div>
            </article>
          </section>
        )}

        <div className="ll-cl-filters">
          <div className="ll-cl-search">
            <Search size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                showingLandlords
                  ? 'Search by name, email or phone...'
                  : 'Search by name, email, phone, property or unit...'
              }
            />
          </div>
          <div className="ll-cl-filter-group">
            <button type="button" className="ll-cl-select-all" onClick={showingLandlords ? selectAllLandlords : selectAllTenants}>
              {showingLandlords
                ? selectedLandlords.length === filteredLandlords.length && filteredLandlords.length > 0
                  ? 'Deselect all'
                  : 'Select all'
                : selectedTenants.length === filteredTenants.length && filteredTenants.length > 0
                  ? 'Deselect all'
                  : 'Select all'}
            </button>
            {!showingLandlords ? (
              <>
                <FilterDropdown
                  label="Status"
                  value={tenantFilter}
                  onChange={setTenantFilter}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'ended', label: 'Ended' },
                  ]}
                />
                <FilterDropdown
                  label="All Properties"
                  value={propertyFilter}
                  onChange={setPropertyFilter}
                  options={[
                    { value: 'all', label: 'All Properties' },
                    ...propertyOptions.map((name) => ({ value: name, label: name })),
                  ]}
                />
                <FilterDropdown
                  label="Expiry: All Time"
                  value={leaseExpiryFilter}
                  onChange={setLeaseExpiryFilter}
                  options={[
                    { value: 'all', label: 'Expiry: All Time' },
                    { value: 'expired', label: 'Expired' },
                    { value: '30-days', label: 'Within 30 Days' },
                    { value: '60-days', label: 'Within 60 Days' },
                    { value: '90-days', label: 'Within 90 Days' },
                  ]}
                />
                <FilterDropdown
                  label="Sort by"
                  value={tenantSortBy}
                  onChange={setTenantSortBy}
                  options={[
                    { value: 'default', label: 'Default' },
                    { value: 'overdue-rent-only', label: 'Overdue Rent Only' },
                    { value: 'name-asc', label: 'Name: A to Z' },
                    { value: 'name-desc', label: 'Name: Z to A' },
                    { value: 'rent-asc', label: 'Rent: Low to High' },
                    { value: 'rent-desc', label: 'Rent: High to Low' },
                    { value: 'lease-expiry-asc', label: 'Lease Expiry: Soonest First' },
                    { value: 'lease-expiry-desc', label: 'Lease Expiry: Latest First' },
                    { value: 'overdue-desc', label: 'Overdue Amount: Highest First' },
                    { value: 'overdue-asc', label: 'Overdue Amount: Lowest First' },
                  ]}
                />
              </>
            ) : (
              <>
                <FilterDropdown
                  label="Status"
                  value={landlordFilter}
                  onChange={setLandlordFilter}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'premium', label: 'Premium' },
                    { value: 'new', label: 'New' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'suspended', label: 'Suspended' },
                  ]}
                />
                <FilterDropdown
                  label="Sort by"
                  value={landlordSortBy}
                  onChange={setLandlordSortBy}
                  options={[
                    { value: 'default', label: 'Default' },
                    { value: 'name-asc', label: 'Name: A to Z' },
                    { value: 'name-desc', label: 'Name: Z to A' },
                    { value: 'properties-asc', label: 'Properties: Low to High' },
                    { value: 'properties-desc', label: 'Properties: High to Low' },
                    { value: 'income-asc', label: 'Monthly Income: Low to High' },
                    { value: 'income-desc', label: 'Monthly Income: High to Low' },
                    { value: 'portfolio-asc', label: 'Portfolio Value: Low to High' },
                    { value: 'portfolio-desc', label: 'Portfolio Value: High to Low' },
                  ]}
                />
              </>
            )}
          </div>
        </div>

        {showBulkActions && !showingLandlords && selectedTenants.length > 0 && (
          <div className="ll-cl-bulk">
            <span className="ll-cl-bulk-label">
              {selectedTenants.length} tenant{selectedTenants.length > 1 ? 's' : ''} selected
            </span>
            <div className="ll-cl-bulk-actions">
              <button type="button" className="ll-cl-bulk-btn" onClick={clearSelection}>
                Clear Selection
              </button>
              <button type="button" className="ll-cl-bulk-btn" onClick={handleBulkArchiveTenants}>
                <Archive size={14} /> Archive
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="ll-cl-bulk-btn">
                    <Download size={14} /> Export <ChevronDown size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkExportTenants('json')}>Export as JSON</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkExportTenants('csv')}>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkExportTenants('excel')}>Export as Excel</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkExportTenants('pdf')}>Export as PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button type="button" className="ll-cl-bulk-btn danger" onClick={handleBulkDeleteTenants}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        )}

        {showBulkActions && showingLandlords && selectedLandlords.length > 0 && (
          <div className="ll-cl-bulk">
            <span className="ll-cl-bulk-label">
              {selectedLandlords.length} landlord{selectedLandlords.length > 1 ? 's' : ''} selected
            </span>
            <div className="ll-cl-bulk-actions">
              <button type="button" className="ll-cl-bulk-btn" onClick={clearSelection}>
                Clear Selection
              </button>
              <button type="button" className="ll-cl-bulk-btn" onClick={handleBulkArchiveLandlords}>
                <Archive size={14} /> Archive
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="ll-cl-bulk-btn">
                    <Download size={14} /> Export <ChevronDown size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkExportLandlords('json')}>Export as JSON</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkExportLandlords('csv')}>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkExportLandlords('excel')}>Export as Excel</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkExportLandlords('pdf')}>Export as PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button type="button" className="ll-cl-bulk-btn danger" onClick={handleBulkDeleteLandlords}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        )}

        <div className="ll-cl-table-wrap">
          <div className="ll-cl-table-scroll">
            {!showingLandlords ? (
              <table className="ll-cl-table">
                <thead>
                  <tr>
                    <th className="check" />
                    <th>Client Name & Contact</th>
                    <th>Property & Unit</th>
                    <th>Tenancy Period</th>
                    <th>Rent & Cycle</th>
                    <th>Payment Status</th>
                    <th className="right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTenants.length === 0 ? (
                    <tr className="ll-cl-empty-row">
                      <td colSpan={7}>
                        <div className="ll-cl-empty">
                          <div className="ll-cl-empty-icon">
                            <Users size={28} />
                          </div>
                          <div className="ll-cl-empty-title">No matching clients found</div>
                          <p className="ll-cl-empty-desc">
                            We couldn&apos;t find any tenants matching your search or filters. Try adjusting your query or reset all filters.
                          </p>
                          <div className="ll-cl-empty-actions">
                            <button type="button" className="ll-cl-btn-secondary" onClick={resetTenantFilters}>
                              Clear All Filters
                            </button>
                            <button type="button" className="ll-cl-btn-add" onClick={onAddTenant}>
                              + Add Tenant
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTenants.map((tenant) => {
                      const arrears = getArrearsForTenant(tenant.id);
                      const { property: propertyName, unit } = propertyParts(tenant.propertyAddress);
                      const remaining = daysUntil(tenant.leaseEnd);
                      const chip = paymentChip(tenant.paymentStatus);
                      const refStatus = referencingStatuses.get(tenant.email) || 'not-started';
                      return (
                        <tr
                          key={tenant.id}
                          className={selectedTenants.includes(tenant.id) ? 'is-selected' : ''}
                          onClick={() => onViewTenant(tenant)}
                        >
                          <td className="check" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="ll-cl-check"
                              checked={selectedTenants.includes(tenant.id)}
                              onChange={() => toggleTenantSelection(tenant.id)}
                            />
                          </td>
                          <td>
                            <div className="ll-cl-client">
                              <span className={`ll-cl-avatar ${avatarTone(tenant.name)}`}>{clientInitials(tenant.name)}</span>
                              <div>
                                <div className="ll-cl-name">
                                  {tenant.name}
                                  {arrears ? (
                                    <span className="ll-cl-days">Arrears</span>
                                  ) : null}
                                  {isLoadingReferencingStatuses ? (
                                    <span className="ll-cl-ref-badge idle">Loading…</span>
                                  ) : (
                                    <span className={`ll-cl-ref-badge ${getReferencingStatusColor(refStatus)}`}>
                                      {getReferencingStatusLabel(refStatus)}
                                    </span>
                                  )}
                                </div>
                                <div className="ll-cl-contact">
                                  {tenant.email} • {tenant.phone || 'No phone'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="ll-cl-prop">{propertyName}</div>
                            <span className="ll-cl-unit">{unit}</span>
                          </td>
                          <td>
                            <div className="ll-cl-period">
                              {formatDate(tenant.leaseStart)} – {formatDate(tenant.leaseEnd)}
                            </div>
                            {remaining !== null && remaining >= 0 && remaining <= 90 ? (
                              <span className="ll-cl-days">{remaining} days remaining</span>
                            ) : null}
                          </td>
                          <td>
                            <div className="ll-cl-rent">{formatCurrency(tenant.rentAmount)}</div>
                            <div className="ll-cl-cycle">{rentCycleLabel(tenant)}</div>
                          </td>
                          <td>
                            <span className={`ll-cl-status is-${chip.key}`}>
                              <span className="dot" />
                              {chip.label}
                            </span>
                          </td>
                          <td className="right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button type="button" className="ll-cl-icon-btn" aria-label="Actions">
                                  •••
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" sideOffset={8} className="ll-cl-actions-menu">
                                <DropdownMenuItem className="ll-cl-actions-item" onSelect={() => onViewTenant(tenant)}>
                                  <Eye className="is-muted" />
                                  <span>View Details</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="ll-cl-actions-item" onSelect={() => onViewTenant(tenant, { tab: 'payment' })}>
                                  <PoundSterling className="is-green" />
                                  <span>Log Payment</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="ll-cl-actions-item"
                                  onSelect={() => mailClient(
                                    tenant.email,
                                    `Rent reminder — ${tenant.propertyAddress || tenant.name}`,
                                    `Hi ${tenant.name.split(' ')[0] || tenant.name},\n\nThis is a reminder about your rent for ${tenant.propertyAddress}.\n\nThank you.`
                                  )}
                                >
                                  <Bell className="is-amber" />
                                  <span>Send Reminder</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              <table className="ll-cl-table">
                <thead>
                  <tr>
                    <th className="check" />
                    <th>Landlord / Entity Name</th>
                    <th>Portfolio Size</th>
                    <th>Portfolio Value</th>
                    <th>Mandate Status</th>
                    <th>Last Activity</th>
                    <th className="right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLandlords.length === 0 ? (
                    <tr className="ll-cl-empty-row">
                      <td colSpan={7}>
                        <div className="ll-cl-empty">
                          <div className="ll-cl-empty-icon">
                            <Briefcase size={28} />
                          </div>
                          <div className="ll-cl-empty-title">No matching clients found</div>
                          <p className="ll-cl-empty-desc">
                            We couldn&apos;t find any landlords matching your search or filters.
                          </p>
                          <div className="ll-cl-empty-actions">
                            <button type="button" className="ll-cl-btn-secondary" onClick={resetLandlordFilters}>
                              Clear All Filters
                            </button>
                            <button type="button" className="ll-cl-btn-add" onClick={onAddLandlord}>
                              + Add Landlord
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLandlords.map((landlord) => {
                      const statusKey = landlord.status.toLowerCase();
                      return (
                        <tr
                          key={landlord.id}
                          className={selectedLandlords.includes(landlord.id) ? 'is-selected' : ''}
                          onClick={() => onViewLandlord(landlord)}
                        >
                          <td className="check" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="ll-cl-check"
                              checked={selectedLandlords.includes(landlord.id)}
                              onChange={() => toggleLandlordSelection(landlord.id)}
                            />
                          </td>
                          <td>
                            <div className="ll-cl-client">
                              <span className="ll-cl-avatar orange">{landlord.initials || clientInitials(landlord.name)}</span>
                              <div>
                                <div className="ll-cl-name">{landlord.name}</div>
                                <div className="ll-cl-contact">
                                  {landlord.email} • {landlord.phone || 'No phone'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="ll-cl-prop">{landlord.propertyCount} properties</div>
                            <span className="ll-cl-unit">{landlord.activeTenants} active tenants</span>
                          </td>
                          <td>
                            <div className="ll-cl-rent">{landlord.totalValue}</div>
                          </td>
                          <td>
                            <span className={`ll-cl-status is-${statusKey === 'active' ? 'active' : statusKey === 'pending' ? 'pending' : 'inactive'}`}>
                              <span className="dot" />
                              {landlord.status}
                            </span>
                          </td>
                          <td>
                            <div className="ll-cl-period">{landlord.lastActive}</div>
                            <div className="ll-cl-cycle">Joined {landlord.joinDate}</div>
                          </td>
                          <td className="right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button type="button" className="ll-cl-icon-btn" aria-label="Actions">
                                  •••
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" sideOffset={8} className="ll-cl-actions-menu">
                                <DropdownMenuItem className="ll-cl-actions-item" onSelect={() => onViewLandlord(landlord)}>
                                  <LayoutGrid className="is-muted" />
                                  <span>View Portfolio</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="ll-cl-actions-item"
                                  onSelect={() => mailClient(
                                    landlord.email,
                                    `Owner statement — ${landlord.name}`,
                                    `Hi ${landlord.name.split(' ')[0] || landlord.name},\n\nPlease find your owner remittance statement attached.\n\nThank you.`
                                  )}
                                >
                                  <PoundSterling className="is-green" />
                                  <span>Send Statement</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="ll-cl-pager">
            <div className="ll-cl-pager-left">
              <span>
                {showingLandlords
                  ? `Showing ${filteredLandlords.length} of ${filteredLandlords.length} clients`
                  : `Showing ${tenantStart}-${tenantEnd} of ${filteredTenants.length} clients`}
              </span>
              {!showingLandlords ? (
                <>
                  <span>|</span>
                  <span>Per page:</span>
                  <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </>
              ) : null}
            </div>
            <div className="ll-cl-pages">
              {showingLandlords ? null : (
                <>
                  <button
                    type="button"
                    className="ll-cl-page"
                    disabled={currentTenantPage === 1}
                    onClick={() => setCurrentTenantPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {pageButtons(currentTenantPage, totalTenantPages).map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span key={`e-${idx}`}>…</span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        className={`ll-cl-page${currentTenantPage === item ? ' active' : ''}`}
                        onClick={() => setCurrentTenantPage(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    className="ll-cl-page"
                    disabled={currentTenantPage === totalTenantPages}
                    onClick={() => setCurrentTenantPage((p) => Math.min(totalTenantPages, p + 1))}
                  >
                    <ChevronRight size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
