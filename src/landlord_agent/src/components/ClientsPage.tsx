import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus,
  Search,
  Users,
  User,
  CheckCircle2,
  Clock,
  PoundSterling,
  DollarSign,
  AlertTriangle,
  Eye,
  Trash2,
  Download,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  FileText,
  Mail,
  Phone,
  MessageSquare,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Building2,
  Bell,
  Settings,
  Menu,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Tenant, Property, ArrearsAlert, UserRole, UserProfile } from '../App';
import { referencingService, ReferencingDocument } from '../services/referencingService';
import { paymentScheduleService, RentPaymentPeriod } from '../services/paymentScheduleService';
import { invitationService, PendingInvitation } from '../services/invitationService';
import { contractService } from '../services/contractService';
import { tenantService } from '../services/tenantService';
import { useTenants } from '../hooks/useTenants';
import { clientListingKey, clientListings } from '../services/clientListings';
import { isPropertyArchived } from '../utils/portfolioStats';
import { LandlordPageEmptyShell } from './LandlordPageEmptyShell';
import '../styles/clientsPage.css';

interface ClientsPageProps {
  userId: string | null;
  propertyIds?: string[];
  properties: Property[];
  arrearsAlerts: ArrearsAlert[];
  userRole: UserRole;
  onViewTenant?: (tenant: Tenant, options?: { tab?: string }) => void;
  onViewProperty?: (property: Property) => void;
  onAddTenant: () => void;
  onBulkImportTenant?: () => void;
  onAddLandlord?: () => void;
  onViewLandlord?: (landlord: any) => void;
  onDeleteTenant?: (tenantId: string, tenantObj?: Tenant) => Promise<void> | void;
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
  onOpenSidebar?: () => void;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20];

function clientInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return ((parts[0][0] || '') + (parts[1]?.[0] || '')).toUpperCase();
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
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function rentCycleLabel(tenant: Tenant): string {
  if (tenant.paymentFrequency === 'yearly') return 'PER YR';
  if (tenant.paymentFrequency === 'fixed-time') return 'FIXED';
  return 'PER MO';
}

function getTenantPaymentStatus(
  tenant: Tenant,
  arrearsAlert?: ArrearsAlert
): { status: 'Paid' | 'Due Soon' | 'Overdue'; badgeClass: string; dotClass: string } {
  if (tenant.paymentStatus === 'overdue' || (arrearsAlert && arrearsAlert.overdueAmount > 0)) {
    return {
      status: 'Overdue',
      badgeClass: 'bg-rose-50 text-rose-600 border-rose-200',
      dotClass: 'bg-rose-500',
    };
  }
  if (tenant.paymentStatus === 'payment-plan' || tenant.status === 'pending') {
    return {
      status: 'Due Soon',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500',
    };
  }
  return {
    status: 'Paid',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  };
}

export function ClientsPage({
  userId,
  propertyIds = [],
  properties = [],
  arrearsAlerts = [],
  onViewTenant,
  onAddTenant,
  onBulkImportTenant,
  onDeleteTenant,
  onExportTenants,
  userProfile,
  onViewSettings,
  onViewNotifications,
  onOpenSidebar,
}: ClientsPageProps) {
  // Mobile Header & Sidebar handler
  const handleOpenSidebar = useCallback(() => {
    if (onOpenSidebar) {
      onOpenSidebar();
    }
    window.dispatchEvent(new CustomEvent('open-mobile-sidebar'));
  }, [onOpenSidebar]);

  const userName = userProfile?.name || 'Mr Flash';

  // Simulation controls state (Matches screenshot and Agent clients baseline)
  const [isSimStatesOpen, setIsSimStatesOpen] = useState(false);
  const [isSimLoading, setIsSimLoading] = useState(false);
  const [isSimEmpty, setIsSimEmpty] = useState(false);
  const simMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (simMenuRef.current && !simMenuRef.current.contains(e.target as Node)) {
        setIsSimStatesOpen(false);
      }
    };
    if (isSimStatesOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isSimStatesOpen]);

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilterPill, setActiveFilterPill] = useState<'all' | 'Paid' | 'Due Soon' | 'Overdue' | 'expiring'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProperty, setFilterProperty] = useState<string>('all');
  const [filterExpiry, setFilterExpiry] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'rent'>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Drawer & Modals state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [choiceOption, setChoiceOption] = useState<'single' | 'multiple'>('single');
  const [activeDrawerTenant, setActiveDrawerTenant] = useState<Tenant | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'agreement' | 'payment' | 'referencing' | 'notes'>('overview');
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [isDeletingTenant, setIsDeletingTenant] = useState(false);

  // Log Payment modal
  const [isLogPaymentModalOpen, setIsLogPaymentModalOpen] = useState(false);
  const [logPaymentTenant, setLogPaymentTenant] = useState<Tenant | null>(null);
  const [payRef, setPayRef] = useState('INV-' + new Date().toISOString().slice(0, 7));
  const [payDesc, setPayDesc] = useState('Monthly Rent');
  const [payAmount, setPayAmount] = useState<number>(2000);
  const [payStatus, setPayStatus] = useState<'Paid' | 'Due Soon' | 'Overdue'>('Paid');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Drawer Live Data state
  const [drawerPayments, setDrawerPayments] = useState<RentPaymentPeriod[]>([]);
  const [isLoadingDrawerPayments, setIsLoadingDrawerPayments] = useState(false);
  const [drawerReferencingDoc, setDrawerReferencingDoc] = useState<ReferencingDocument | null>(null);
  const [isLoadingDrawerRef, setIsLoadingDrawerRef] = useState(false);

  // Mobile Accordion open state
  const [expandedMobileIds, setExpandedMobileIds] = useState<Set<string>>(new Set());

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live Tenants hook
  const { tenants, isLoading: isTenantsLoading, invalidate: invalidateTenants } = useTenants({
    userId,
    propertyIds,
  });

  // Live Invitations
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [activeMainTab, setActiveMainTab] = useState<'tenants' | 'invitations'>('tenants');

  // Live Referencing statuses map
  const [referencingStatuses, setReferencingStatuses] = useState<Map<string, 'not-started' | 'in-progress' | 'complete'>>(new Map());

  // Active Properties
  const activeProperties = useMemo(
    () => (properties || []).filter((p) => !isPropertyArchived(p)),
    [properties]
  );

  // Mapped client listings
  const clientRows = useMemo(
    () => clientListings(tenants || [], activeProperties),
    [tenants, activeProperties]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load referencing statuses for tenants
  useEffect(() => {
    if (!userProfile || tenants.length === 0) return;
    const emails = tenants.filter((t) => t.email && t.email.trim()).map((t) => t.email);
    referencingService.getReferencingStatusForTenants(emails).then(setReferencingStatuses).catch(() => {});
  }, [tenants, userProfile]);

  // Load invitations
  useEffect(() => {
    if (!userId) return;
    invitationService.getInvitations(userId).then(setInvitations).catch(() => {});
  }, [userId]);

  // Load payments and referencing when drawer opens
  useEffect(() => {
    if (!activeDrawerTenant) {
      setDrawerPayments([]);
      setDrawerReferencingDoc(null);
      return;
    }

    // Load live payments
    setIsLoadingDrawerPayments(true);
    paymentScheduleService
      .getTenantPeriods(activeDrawerTenant.id)
      .then((periods) => {
        setDrawerPayments(periods || []);
      })
      .catch(() => setDrawerPayments([]))
      .finally(() => setIsLoadingDrawerPayments(false));

    // Load live referencing document
    if (activeDrawerTenant.email) {
      setIsLoadingDrawerRef(true);
      referencingService
        .getReferencingDocumentByTenantEmail(activeDrawerTenant.email)
        .then((doc) => setDrawerReferencingDoc(doc))
        .catch(() => setDrawerReferencingDoc(null))
        .finally(() => setIsLoadingDrawerRef(false));
    }
  }, [activeDrawerTenant]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSimLoading = () => {
    setIsSimStatesOpen(false);
    setIsSimLoading(true);
    setTimeout(() => {
      setIsSimLoading(false);
      showToast('Live state restored', 'info');
    }, 2000);
  };

  const handleToggleSimEmpty = () => {
    setIsSimStatesOpen(false);
    setIsSimEmpty((prev) => !prev);
    showToast(!isSimEmpty ? 'Empty state preview active' : 'Live state restored', 'info');
  };

  const handleResetSimStates = () => {
    setIsSimStatesOpen(false);
    setIsSimLoading(false);
    setIsSimEmpty(false);
    showToast('All simulated states reset to live', 'info');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    invalidateTenants();
    if (userId) {
      try {
        const invs = await invitationService.getInvitations(userId);
        setInvitations(invs);
      } catch {
        // non-fatal
      }
    }
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Client records refreshed', 'success');
    }, 500);
  };

  // Property list for filter dropdown
  const propertyOptions = useMemo(() => {
    const set = new Set<string>();
    activeProperties.forEach((p) => {
      const name = propertyParts(p.address || '').property;
      if (name && name !== '—') set.add(name);
    });
    (tenants || []).forEach((t) => {
      const name = propertyParts(t.propertyAddress || '').property;
      if (name && name !== '—') set.add(name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [activeProperties, tenants]);

  // Arrears alert lookup map
  const arrearsByTenantId = useMemo(() => {
    const map = new Map<string, ArrearsAlert>();
    (arrearsAlerts || []).forEach((alert) => map.set(alert.tenantId, alert));
    return map;
  }, [arrearsAlerts]);

  // Top 4 KPI calculations
  const kpiStats = useMemo(() => {
    const list = clientRows;
    const total = list.length;
    const activeCount = list.filter((t) => t.status === 'active').length;
    const pendingCount = list.filter((t) => t.status === 'pending').length;

    // Active contracts
    const activeContracts = activeCount;

    // Pending checks: tenants with referencing in progress or pending onboarding
    const pendingChecks = list.filter((t) => {
      const refStatus = referencingStatuses.get(t.email) || referencingStatuses.get(t.email.toLowerCase());
      return refStatus === 'in-progress' || t.status === 'pending';
    }).length;

    // Payment Health & Overdue
    const overdueTenants = list.filter((t) => {
      const alert = arrearsByTenantId.get(t.id);
      return t.paymentStatus === 'overdue' || (alert && alert.overdueAmount > 0);
    });
    const overdueCount = overdueTenants.length;
    const paymentHealthPct = total > 0 ? Math.round(((total - overdueCount) / total) * 100) : 100;

    return {
      total,
      activeCount,
      pendingCount,
      activeContracts,
      pendingChecks,
      paymentHealthPct,
      overdueCount,
    };
  }, [clientRows, referencingStatuses, arrearsByTenantId]);

  // Filter Pills counts
  const pillCounts = useMemo(() => {
    const list = clientRows;
    const total = list.length;
    let paid = 0;
    let dueSoon = 0;
    let overdue = 0;
    let expiring = 0;

    list.forEach((t) => {
      const alert = arrearsByTenantId.get(t.id);
      const statusInfo = getTenantPaymentStatus(t, alert);
      if (statusInfo.status === 'Paid') paid += 1;
      else if (statusInfo.status === 'Due Soon') dueSoon += 1;
      else if (statusInfo.status === 'Overdue') overdue += 1;

      const remaining = daysUntil(t.leaseEnd);
      if (remaining !== null && remaining >= 0 && remaining <= 60) {
        expiring += 1;
      }
    });

    return { total, paid, dueSoon, overdue, expiring };
  }, [clientRows, arrearsByTenantId]);

  // Filtered & Sorted Tenants
  const filteredTenants = useMemo(() => {
    if (isSimEmpty) return [];
    const query = debouncedSearch.toLowerCase().trim();

    const result = clientRows.filter((tenant) => {
      const alert = arrearsByTenantId.get(tenant.id);
      const { status } = getTenantPaymentStatus(tenant, alert);
      const { property } = propertyParts(tenant.propertyAddress);
      const remainingDays = daysUntil(tenant.leaseEnd);

      // Search match
      if (query) {
        const matchesName = (tenant.name || '').toLowerCase().includes(query);
        const matchesEmail = (tenant.email || '').toLowerCase().includes(query);
        const matchesPhone = (tenant.phone || '').toLowerCase().includes(query);
        const matchesProperty = (tenant.propertyAddress || '').toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesProperty) return false;
      }

      // Filter Pill / Status match
      if (activeFilterPill === 'Paid' && status !== 'Paid') return false;
      if (activeFilterPill === 'Due Soon' && status !== 'Due Soon') return false;
      if (activeFilterPill === 'Overdue' && status !== 'Overdue') return false;
      if (activeFilterPill === 'expiring') {
        if (remainingDays === null || remainingDays < 0 || remainingDays > 60) return false;
      }

      // Filter Drawer: Status
      if (filterStatus !== 'all' && status !== filterStatus) return false;

      // Filter Drawer: Property
      if (filterProperty !== 'all' && property !== filterProperty) return false;

      // Filter Drawer: Expiry
      if (filterExpiry !== 'all') {
        const daysLimit = parseInt(filterExpiry, 10);
        if (remainingDays === null || remainingDays < 0 || remainingDays > daysLimit) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortField === 'name') {
        const comp = (a.name || '').localeCompare(b.name || '');
        return sortAsc ? comp : -comp;
      }
      if (sortField === 'rent') {
        const diff = (a.rentAmount || 0) - (b.rentAmount || 0);
        return sortAsc ? diff : -diff;
      }
      return 0;
    });

    return result;
  }, [
    clientRows,
    debouncedSearch,
    activeFilterPill,
    filterStatus,
    filterProperty,
    filterExpiry,
    sortField,
    sortAsc,
    arrearsByTenantId,
    isSimEmpty,
  ]);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeFilterPill, filterStatus, filterProperty, filterExpiry, pageSize, isSimEmpty]);

  // Pagination calculation
  const totalItems = filteredTenants.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTenants = filteredTenants.slice(startIndex, startIndex + pageSize);
  const displayStart = totalItems === 0 ? 0 : startIndex + 1;
  const displayEnd = Math.min(startIndex + pageSize, totalItems);

  // Active filters count for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterStatus !== 'all') count += 1;
    if (filterProperty !== 'all') count += 1;
    if (filterExpiry !== 'all') count += 1;
    return count;
  }, [filterStatus, filterProperty, filterExpiry]);

  const resetAllFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setActiveFilterPill('all');
    setFilterStatus('all');
    setFilterProperty('all');
    setFilterExpiry('all');
    showToast('Filters cleared', 'info');
  };

  const handleOpenLogPayment = (tenant: Tenant) => {
    setLogPaymentTenant(tenant);
    setPayRef(`INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
    setPayDesc(`${new Date().toLocaleString('en-GB', { month: 'long' })} Rent`);
    setPayAmount(tenant.rentAmount || 2000);
    setPayStatus('Paid');
    setIsLogPaymentModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logPaymentTenant) return;
    setIsSubmittingPayment(true);
    try {
      // Find or generate period and mark paid
      const periods = await paymentScheduleService.getTenantPeriods(logPaymentTenant.id);
      const targetPeriod = periods.find((p) => p.status !== 'paid') || periods[0];
      if (targetPeriod) {
        await paymentScheduleService.markPeriodPaid(targetPeriod.id, new Date());
      } else {
        await tenantService.updateTenant(logPaymentTenant.id, {
          paymentStatus: payStatus === 'Paid' ? 'current' : payStatus === 'Overdue' ? 'overdue' : 'payment-plan',
        });
      }
      invalidateTenants();
      setIsLogPaymentModalOpen(false);
      showToast(`Payment of £${payAmount.toLocaleString()} recorded to ledger`, 'success');

      // Refresh drawer payments if this tenant is currently open in drawer
      if (activeDrawerTenant?.id === logPaymentTenant.id) {
        const updated = await paymentScheduleService.getTenantPeriods(logPaymentTenant.id);
        setDrawerPayments(updated);
      }
    } catch (err) {
      console.error('Failed to log payment:', err);
      showToast('Error recording payment. Please try again.', 'error');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const toggleMobileExpand = (id: string) => {
    setExpandedMobileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!userProfile) {
    return <LandlordPageEmptyShell page="clients" variant="guest" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#1e293b] antialiased">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[120] px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg flex items-center gap-2 fade-slide-up">
          <span
            className={`w-2 h-2 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-400' : toast.type === 'error' ? 'bg-rose-400' : 'bg-sky-400'
            }`}
          />
          <span>{toast.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP HEADER BAR (WHITE BACKGROUND, STICKY)                                  */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-subtle">
        <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-3 sm:py-5 flex flex-col justify-between gap-3 sm:gap-4">
          {/* Option 2 Mobile Top Bar: Profile Container + Notification & Settings on same line */}
          <div id="headerMobileTopBar" className="flex items-center justify-between w-full lg:hidden pb-3 mb-1 border-b border-slate-100">
            {/* Profile Avatar Hub Button */}
            <button
              id="mobileHeaderAvatarHub"
              type="button"
              onClick={handleOpenSidebar}
              className="flex items-center gap-2 p-1 pl-1 pr-2.5 rounded-full bg-white border border-slate-200/90 shadow-xs hover:bg-slate-50 transition-all cursor-pointer min-h-[40px]"
              title="Open Agent Profile Hub"
              aria-label="Open Agent Profile Hub"
            >
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userName}
                  className="w-7 h-7 rounded-full object-cover shadow-xs border border-slate-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#136C9E] to-[#0f766e] flex items-center justify-center text-white font-bold text-[11px] shadow-xs">
                  {clientInitials(userName)}
                </div>
              )}
              <span className="text-xs font-heading font-bold text-slate-800">{userName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Top Header Settings & Notification Icons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => (onViewSettings ? onViewSettings() : window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'settings' })))}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80 shadow-subtle transition-all cursor-pointer active:scale-95 min-w-[36px] min-h-[36px]"
                title="Settings"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4 text-slate-600" />
              </button>
              <button
                type="button"
                onClick={() => (onViewNotifications ? onViewNotifications() : window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'messages' })))}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80 shadow-subtle transition-all cursor-pointer active:scale-95 min-w-[36px] min-h-[36px]"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 text-slate-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleOpenSidebar}
                className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden flex items-center justify-center shrink-0 cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="font-heading text-xl sm:text-2xl lg:text-[28px] font-bold text-slate-900 tracking-tight leading-none">
                  Clients
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-1 font-normal">
                  Manage your tenants, portfolio relationships, agreements, and real-time ledger records.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <button
                id="btnRefresh"
                type="button"
                onClick={handleRefresh}
                title="Refresh Client Records"
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 flex items-center justify-center transition-all shadow-subtle group hover:bg-slate-50 min-w-[40px] min-h-[40px] cursor-pointer"
              >
                <RotateCw
                  className={`w-4 h-4 text-slate-500 group-hover:text-slate-800 transition-transform ${
                    isRefreshing ? 'animate-spin text-[#DC5F12]' : ''
                  }`}
                />
              </button>

              <button
                id="btnAddClientModal"
                type="button"
                onClick={() => setIsChoiceModalOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 bg-[#DC5F12] hover:bg-[#ba4e0b] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95 min-h-[44px] cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span id="btnAddClientText">Add Tenant</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTENT DASHBOARD BODY                                               */}
      {/* ========================================================================= */}
      <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-[1720px] mx-auto w-full pb-24 lg:pb-8">
        {/* SEGMENTED SWITCHER: STRICTLY NO LANDLORD TAB AS REQUESTED */}
        <div className="mb-5 sm:mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 gap-1.5 shadow-subtle self-start">
            {/* Tenants Tab Button */}
            <button
              id="btnTabTenants"
              type="button"
              onClick={() => setActiveMainTab('tenants')}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold font-heading transition-all ${
                activeMainTab === 'tenants'
                  ? 'bg-white border border-[#DC5F12] text-[#DC5F12] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Tenants</span>
              <span id="tabCountTenants" className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                {isTenantsLoading ? '…' : isSimEmpty ? 0 : kpiStats.total}
              </span>
            </button>

            {/* Invitations Tab (Available when invitations exist or to manage pending invites) */}
            {invitations.length > 0 && !isSimEmpty && (
              <button
                type="button"
                onClick={() => setActiveMainTab('invitations')}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold font-heading transition-all ${
                  activeMainTab === 'invitations'
                    ? 'bg-white border border-[#DC5F12] text-[#DC5F12] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Invitations</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                  {invitations.filter((i) => i.status === 'pending').length}
                </span>
              </button>
            )}
          </div>

          {/* Secondary Compact State Simulation Dropdown (Matches Screenshot & Agent Clients baseline) */}
          <div ref={simMenuRef} className="relative inline-block self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setIsSimStatesOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all font-heading shadow-xs active:scale-95 cursor-pointer min-h-[40px]"
              title="Open simulated state controls"
            >
              <span className="w-2 h-2 rounded-full bg-[#DC5F12] animate-pulse" />
              <span>Simulate State</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {isSimStatesOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-dropdown border border-slate-200/90 py-1.5 z-30 text-xs font-normal">
                <button
                  type="button"
                  onClick={handleSimLoading}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center justify-between cursor-pointer"
                >
                  <span>Loading (2s)</span>
                  <span className="text-[9px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-bold">Shimmer</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleSimEmpty}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-rose-50 hover:text-rose-700 flex items-center justify-between cursor-pointer"
                >
                  <span>{isSimEmpty ? 'Disable Empty' : 'Empty State'}</span>
                  <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">Empty</span>
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  type="button"
                  onClick={handleResetSimStates}
                  className="w-full px-3 py-2 text-left text-slate-500 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  <span>Reset All States</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOP 4 KPI CARDS (MATCHING AGENT CLIENTS.HTML ANATOMY & LIVE METRICS)       */}
        {/* ========================================================================= */}
        <section id="kpiCardsContainer" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {isSimLoading || isTenantsLoading ? (
            Array(4)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl skeleton-box shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-20 skeleton-box rounded" />
                    <div className="h-6 w-14 skeleton-box rounded" />
                    <div className="h-2.5 w-24 skeleton-box rounded" />
                  </div>
                </div>
              ))
          ) : isSimEmpty ? (
            <>
              <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 opacity-60">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-bold text-slate-400 font-heading">Total Tenants</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-400 font-heading mt-0.5">0</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">No records found</div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 opacity-60">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-bold text-slate-400 font-heading">Active Contracts</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-400 font-heading mt-0.5">0</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">None active</div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 opacity-60">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-bold text-slate-400 font-heading">Pending Checks</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-400 font-heading mt-0.5">0</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">No checks pending</div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 opacity-60">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-bold text-slate-400 font-heading">Payment Status</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-400 font-heading mt-0.5">0%</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">No transactions</div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* CARD 1: TOTAL TENANTS */}
              <div
                onClick={() => {
                  setActiveFilterPill('all');
                  setFilterStatus('all');
                }}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 hover:border-slate-300 hover:shadow-subtle transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-bold text-slate-500 font-heading truncate">Total Tenants</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 font-heading mt-0.5">
                    {kpiStats.total}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                    {kpiStats.activeCount} Active · {kpiStats.pendingCount} Onboarding
                  </div>
                </div>
              </div>

              {/* CARD 2: ACTIVE CONTRACTS */}
              <div
                onClick={() => {
                  setActiveFilterPill('Paid');
                  setFilterStatus('Paid');
                }}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 hover:border-slate-300 hover:shadow-subtle transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-bold text-slate-500 font-heading truncate">Active Contracts</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 font-heading mt-0.5">
                    {kpiStats.activeContracts}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold truncate">In good standing</div>
                </div>
              </div>

              {/* CARD 3: PENDING CHECKS */}
              <div
                onClick={() => {
                  setActiveFilterPill('Due Soon');
                  setFilterStatus('Due Soon');
                }}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 hover:border-slate-300 hover:shadow-subtle transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-bold text-slate-500 font-heading truncate">Pending Checks</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 font-heading mt-0.5">
                    {kpiStats.pendingChecks}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-amber-600 font-semibold truncate">
                    Referencing in progress
                  </div>
                </div>
              </div>

              {/* CARD 4: PAYMENT STATUS */}
              <div
                onClick={() => {
                  setActiveFilterPill('Overdue');
                  setFilterStatus('Overdue');
                }}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 hover:border-slate-300 hover:shadow-subtle transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-bold text-slate-500 font-heading truncate">Payment Status</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 font-heading mt-0.5">
                    {`${kpiStats.paymentHealthPct}%`}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                    {kpiStats.overdueCount > 0
                      ? `${kpiStats.overdueCount} overdue invoice${kpiStats.overdueCount === 1 ? '' : 's'}`
                      : 'All accounts clear'}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* INVITATIONS PANEL VIEW (IF ACTIVE) */}
        {activeMainTab === 'invitations' && !isSimEmpty && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-lg text-slate-900">Tenant Invitations</h3>
                <p className="text-xs text-slate-500 mt-0.5">Track invitations sent to prospective tenants</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveMainTab('tenants')}
                className="text-xs font-bold text-[#DC5F12] hover:underline font-heading"
              >
                ← Back to Tenants
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase font-heading">
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Property</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Sent Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">{inv.email}</td>
                      <td className="py-3 px-4 text-slate-600">{inv.propertyAddress || '—'}</td>
                      <td className="py-3 px-4 capitalize">{(inv.inviteType || '').replace('-', ' ')}</td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(inv.sentAt)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                            inv.status === 'accepted'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : inv.status === 'expired'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FILTER & CONTROLS BAR (SEARCH + FILTER BUTTON + FILTER PILLS)             */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card space-y-3.5 mb-6">
          {/* Top Row: Search Input + Filter Drawer Button (Stacked full-width on mobile) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
            <div className="relative flex-1 min-w-0 w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="clientSearchInput"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, phone, property or unit..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/90 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20 focus:border-[#136C9E] transition-all bg-white shadow-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              id="openClientsFilterDrawerBtn"
              onClick={() => setIsFilterDrawerOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center sm:justify-start gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all shrink-0 active:scale-95 hover:border-slate-300 cursor-pointer min-h-[44px]"
              title="Open Client Filters (Status, Property, Lease Expiry)"
            >
              <Filter className="w-4 h-4 text-[#136C9E]" />
              <span className="font-heading">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#DC5F12] text-white text-[10px] font-bold leading-none">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Bottom Row: Filter Pills */}
          <div id="clientsFilterPillsContainer" className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
            {[
              { key: 'all' as const, label: 'All', count: isSimEmpty ? 0 : pillCounts.total },
              { key: 'Paid' as const, label: 'Paid', count: isSimEmpty ? 0 : pillCounts.paid },
              { key: 'Due Soon' as const, label: 'Due Soon', count: isSimEmpty ? 0 : pillCounts.dueSoon },
              { key: 'Overdue' as const, label: 'Overdue', count: isSimEmpty ? 0 : pillCounts.overdue },
              { key: 'expiring' as const, label: 'Expiring Soon', count: isSimEmpty ? 0 : pillCounts.expiring },
            ].map((pill) => {
              const isActive = activeFilterPill === pill.key;
              return (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => {
                    setActiveFilterPill(pill.key);
                    if (pill.key === 'all') {
                      setFilterStatus('all');
                      setFilterExpiry('all');
                    } else if (pill.key === 'expiring') {
                      setFilterExpiry('60');
                      setFilterStatus('all');
                    } else {
                      setFilterStatus(pill.key);
                      setFilterExpiry('all');
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-heading transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#DC5F12] text-white font-bold shadow-sm'
                      : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200 font-semibold'
                  }`}
                >
                  <span>{pill.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CLIENTS DATA TABLE CONTAINER                                              */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          {/* MOBILE ACCORDION VIEW (< md) */}
          <div id="clientsMobileAccordion" className="md:hidden divide-y divide-slate-100">
            {isTenantsLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <div className="w-6 h-6 border-2 border-[#136C9E] border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading clients…</p>
              </div>
            ) : paginatedTenants.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No matching tenants found.
              </div>
            ) : (
              paginatedTenants.map((tenant) => {
                const alert = arrearsByTenantId.get(tenant.id);
                const statusInfo = getTenantPaymentStatus(tenant, alert);
                const { property, unit } = propertyParts(tenant.propertyAddress);
                const isExpanded = expandedMobileIds.has(tenant.id);

                return (
                  <div key={clientListingKey(tenant)} className="bg-white transition-colors">
                    <div
                      onClick={() => toggleMobileExpand(tenant.id)}
                      className="px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 text-white ${
                            isExpanded ? 'rotate-180 bg-[#DC5F12]' : 'bg-[#136C9E]'
                          }`}
                        >
                          <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-[#136C9E] font-heading truncate">
                            {tenant.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {property} · {unit}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.badgeClass} font-heading shrink-0`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                        {statusInfo.status}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 bg-slate-50/60 border-t border-slate-100 space-y-3 fade-slide-up">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                            <div className="text-[10px] text-slate-400 font-bold uppercase font-heading">
                              Monthly Rent
                            </div>
                            <div className="font-bold text-[#DC5F12] text-xs mt-0.5">
                              {formatCurrency(tenant.rentAmount)}
                            </div>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                            <div className="text-[10px] text-slate-400 font-bold uppercase font-heading">Cycle</div>
                            <div className="font-semibold text-slate-700 text-xs mt-0.5">
                              {rentCycleLabel(tenant)}
                            </div>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                            <div className="text-[10px] text-slate-400 font-bold uppercase font-heading">Phone</div>
                            <div className="font-semibold text-slate-700 text-xs mt-0.5 truncate">
                              {tenant.phone || '—'}
                            </div>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                            <div className="text-[10px] text-slate-400 font-bold uppercase font-heading">
                              Lease Period
                            </div>
                            <div className="font-semibold text-slate-700 text-xs mt-0.5 truncate">
                              {formatDate(tenant.leaseStart)} – {formatDate(tenant.leaseEnd)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDrawerTenant(tenant);
                              setActiveDrawerTab('overview');
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-[#DC5F12] text-white text-xs font-bold font-heading hover:bg-[#ba4e0b] shadow-xs active:scale-95 transition-all"
                          >
                            View Client Profile →
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenLogPayment(tenant)}
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 shadow-xs"
                          >
                            Log Payment
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* DESKTOP TABLE VIEW (md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">
                  <th
                    className="py-4 px-6 cursor-pointer hover:text-slate-600 select-none"
                    onClick={() => {
                      setSortField('name');
                      setSortAsc(!sortAsc);
                    }}
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>CLIENT NAME & CONTACT</span>
                      <span>{sortField === 'name' ? (sortAsc ? '↑' : '↓') : ''}</span>
                    </div>
                  </th>
                  <th className="py-4 px-6">PROPERTY & UNIT</th>
                  <th className="py-4 px-6">TENANCY PERIOD</th>
                  <th
                    className="py-4 px-6 cursor-pointer hover:text-slate-600 select-none"
                    onClick={() => {
                      setSortField('rent');
                      setSortAsc(!sortAsc);
                    }}
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>RENT & CYCLE</span>
                      <span>{sortField === 'rent' ? (sortAsc ? '↑' : '↓') : ''}</span>
                    </div>
                  </th>
                  <th className="py-4 px-6">PAYMENT STATUS</th>
                  <th className="py-4 px-6 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isTenantsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-16 px-6 text-center text-slate-400">
                      <div className="w-8 h-8 border-2 border-[#136C9E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span>Loading client records…</span>
                    </td>
                  </tr>
                ) : paginatedTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 px-6 text-center">
                      <div className="max-w-md mx-auto flex flex-col items-center fade-slide-up">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mb-4 shadow-subtle">
                          <Users className="w-8 h-8" />
                        </div>
                        <h3 className="font-heading font-bold text-lg text-slate-900 mb-1">
                          No matching clients found
                        </h3>
                        <p className="text-sm text-slate-500 mb-6 text-center leading-relaxed">
                          We couldn&apos;t find any tenants matching your search or filters. Try adjusting your query or reset all filters.
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={resetAllFilters}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-subtle transition-all"
                          >
                            Clear All Filters
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsChoiceModalOpen(true)}
                            className="px-4 py-2.5 rounded-xl bg-[#DC5F12] hover:bg-[#ba4e0b] text-white font-semibold text-xs transition-all shadow-sm"
                          >
                            + Add Tenant
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTenants.map((tenant) => {
                    const alert = arrearsByTenantId.get(tenant.id);
                    const statusInfo = getTenantPaymentStatus(tenant, alert);
                    const { property, unit } = propertyParts(tenant.propertyAddress);
                    const remainingDays = daysUntil(tenant.leaseEnd);
                    const isExpiring = remainingDays !== null && remainingDays >= 0 && remainingDays <= 60;

                    return (
                      <tr
                        key={clientListingKey(tenant)}
                        onClick={() => {
                          setActiveDrawerTenant(tenant);
                          setActiveDrawerTab('overview');
                        }}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer fade-slide-up relative"
                      >
                        {/* Name & Contact */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-heading font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                              {clientInitials(tenant.name)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-heading font-bold text-slate-900 group-hover:text-[#DC5F12] transition-colors">
                                  {tenant.name}
                                </span>
                                {isExpiring && (
                                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded font-heading">
                                    Expiring
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {tenant.email} • {tenant.phone || 'No phone'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Property & Unit */}
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800 text-xs">{property}</div>
                          <div className="inline-block px-2 py-0.5 mt-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-[11px] text-slate-600 font-medium">
                            {unit}
                          </div>
                        </td>

                        {/* Tenancy Period */}
                        <td className="py-4 px-6">
                          <div className="text-xs text-slate-600 font-medium">
                            {formatDate(tenant.leaseStart)} – {formatDate(tenant.leaseEnd)}
                          </div>
                          {remainingDays !== null && remainingDays >= 0 && remainingDays <= 90 && (
                            <div className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold mt-1 font-heading">
                              🕒 {remainingDays} days remaining
                            </div>
                          )}
                        </td>

                        {/* Rent & Cycle */}
                        <td className="py-4 px-6">
                          <div className="font-heading font-bold text-slate-900 text-sm">
                            {formatCurrency(tenant.rentAmount)}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-heading">
                            {rentCycleLabel(tenant)}
                          </div>
                        </td>

                        {/* Payment Status */}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                            {statusInfo.status}
                          </span>
                        </td>

                        {/* Actions Dropdown */}
                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 inline-flex items-center justify-center font-bold text-base transition-colors"
                              >
                                •••
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 bg-white rounded-2xl shadow-dropdown border border-slate-200/80 py-1.5 text-xs">
                              <DropdownMenuItem
                                onClick={() => {
                                  setActiveDrawerTenant(tenant);
                                  setActiveDrawerTab('overview');
                                }}
                                className="px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>View Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenLogPayment(tenant)}
                                className="px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                              >
                                <PoundSterling className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Log Payment</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  window.location.href = `mailto:${tenant.email}?subject=Rent Reminder&body=Hi ${tenant.name}, this is a reminder regarding your rent for ${property}.`;
                                }}
                                className="px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                              >
                                <Mail className="w-3.5 h-3.5 text-amber-500" />
                                <span>Send Reminder</span>
                              </DropdownMenuItem>
                              {onDeleteTenant && (
                                <DropdownMenuItem
                                  onClick={() => setTenantToDelete(tenant)}
                                  className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Delete Tenant</span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>
                Showing {displayStart}-{displayEnd} of {totalItems} clients
              </span>
              <span className="text-slate-300">|</span>
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center transition-colors ${
                  currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg font-heading text-xs font-bold transition-all ${
                    currentPage === page
                      ? 'bg-sky-100 text-[#136C9E] border border-sky-200 shadow-sm'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages || totalItems === 0}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={`w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center transition-colors ${
                  currentPage === totalPages || totalItems === 0
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* SLIDE-OVER DETAIL DRAWER (EXACT REPLICA FROM AGENT CLIENTS.HTML)          */}
      {/* ========================================================================= */}
      {activeDrawerTenant && (
        <div
          id="clientDrawer"
          className="fixed inset-0 z-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setActiveDrawerTenant(null)}
          />

          <div className="fixed inset-y-0 right-0 pl-0 sm:pl-10 max-w-full flex w-full justify-end">
            <div className="w-full sm:w-screen sm:max-w-2xl bg-white max-h-screen shadow-drawer flex flex-col fade-slide-up">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-heading font-bold text-base flex items-center justify-center shadow-subtle">
                      {clientInitials(activeDrawerTenant.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-heading font-bold text-xl text-slate-900">
                          {activeDrawerTenant.name}
                        </h2>
                        {(() => {
                          const alert = arrearsByTenantId.get(activeDrawerTenant.id);
                          const st = getTenantPaymentStatus(activeDrawerTenant, alert);
                          return (
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${st.badgeClass}`}>
                              {st.status}
                            </span>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {propertyParts(activeDrawerTenant.propertyAddress).property} — {propertyParts(activeDrawerTenant.propertyAddress).unit}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveDrawerTenant(null)}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Comms Action Pills */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                  {activeDrawerTenant.phone ? (
                    <a
                      href={`tel:${activeDrawerTenant.phone}`}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                      <span>Call: {activeDrawerTenant.phone}</span>
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 font-semibold text-xs cursor-not-allowed">
                      <Phone className="w-3.5 h-3.5" />
                      <span>No Phone</span>
                    </span>
                  )}

                  {activeDrawerTenant.email ? (
                    <a
                      href={`mailto:${activeDrawerTenant.email}`}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Email Client</span>
                    </a>
                  ) : null}
                </div>

                {/* Drawer Navigation Tabs */}
                <div className="flex items-center gap-5 mt-4 border-b border-slate-200 -mb-6 overflow-x-auto scrollbar-none">
                  {[
                    { id: 'overview' as const, label: 'Overview' },
                    { id: 'agreement' as const, label: 'Tenancy Agreement' },
                    { id: 'payment' as const, label: 'Payment History' },
                    { id: 'referencing' as const, label: 'Referencing' },
                    { id: 'notes' as const, label: 'Notes & Activity' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveDrawerTab(tab.id)}
                      className={`pb-3 text-xs whitespace-nowrap font-heading transition-colors cursor-pointer ${
                        activeDrawerTab === tab.id
                          ? 'font-bold border-b-2 border-[#DC5F12] text-[#DC5F12]'
                          : 'font-semibold text-slate-500 hover:text-slate-800 border-b-2 border-transparent hover:border-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drawer Tab Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. OVERVIEW TAB */}
                {activeDrawerTab === 'overview' && (
                  <div className="space-y-4 fade-slide-up">
                    {/* Primary Contact Info */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading mb-3">
                        PRIMARY CONTACT INFORMATION
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Email Address</span>
                          <span className="font-bold text-slate-800 font-mono">{activeDrawerTenant.email || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Direct Phone</span>
                          <span className="font-bold text-slate-800 font-mono">{activeDrawerTenant.phone || '—'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-xs mb-1">Right to Rent / KYC Verification</span>
                        {(() => {
                          const refStatus =
                            referencingStatuses.get(activeDrawerTenant.email) ||
                            referencingStatuses.get(activeDrawerTenant.email.toLowerCase());
                          return refStatus === 'complete' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-heading">
                              ✓ Verified
                            </span>
                          ) : refStatus === 'in-progress' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 font-heading">
                              ⏳ In Progress
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 font-heading">
                              Not Started
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Emergency & Legal Contact */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading mb-3">
                        EMERGENCY & LEGAL CONTACT
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Contact Name</span>
                          <span className="font-bold text-slate-800">
                            {activeDrawerTenant.emergencyContact?.name ||
                              activeDrawerTenant.guarantorName ||
                              'None on file'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Relationship</span>
                          <span className="font-bold text-slate-800">
                            {activeDrawerTenant.emergencyContact?.relationship ||
                              (activeDrawerTenant.guarantorName ? 'Guarantor' : '—')}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-400 block mb-0.5">Emergency Phone</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {activeDrawerTenant.emergencyContact?.phone ||
                            activeDrawerTenant.guarantorPhone ||
                            '—'}
                        </span>
                      </div>
                    </div>

                    {/* Occupancy Schedule */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading mb-3">
                        OCCUPANCY SCHEDULE
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Move-In Date</span>
                          <span className="font-bold text-slate-800">
                            {formatDate(activeDrawerTenant.leaseStart)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Tenancy Duration</span>
                          <span className="font-bold text-slate-800">
                            {formatDate(activeDrawerTenant.leaseStart)} – {formatDate(activeDrawerTenant.leaseEnd)}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Security Deposit</span>
                          <span className="font-heading font-bold text-emerald-600 text-sm">
                            {activeDrawerTenant.depositAmount
                              ? formatCurrency(activeDrawerTenant.depositAmount)
                              : formatCurrency((activeDrawerTenant.rentAmount || 0) * 2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Protection Scheme</span>
                          <span className="font-medium text-slate-700">Deposit Protection Service (DPS)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. TENANCY AGREEMENT TAB (COMING SOON IN PLACE OF MOCK DATA) */}
                {activeDrawerTab === 'agreement' && (
                  <div className="space-y-4 fade-slide-up">
                    <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-card text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#DC5F12] flex items-center justify-center mx-auto shadow-xs">
                        <FileText className="w-6 h-6" />
                      </div>
                      <h4 className="font-heading font-bold text-base text-slate-900">
                        Tenancy Agreement Management
                      </h4>
                      <span className="inline-block px-3 py-1 rounded-full bg-orange-50 text-[#DC5F12] border border-[#fed7aa] text-xs font-bold font-heading">
                        Coming Soon
                      </span>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        Digital Assured Shorthold Tenancy (AST) agreement generation, DocuSign e-signature tracking, and automated UK statutory compliance checks are coming soon.
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. PAYMENT HISTORY TAB (LIVE PAYMENT SCHEDULE DATA) */}
                {activeDrawerTab === 'payment' && (
                  <div className="space-y-5 fade-slide-up">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-bold text-base text-slate-900">
                        Financial Ledger & Invoices
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleOpenLogPayment(activeDrawerTenant)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#DC5F12] hover:bg-[#ba4e0b] text-white text-xs font-bold font-heading rounded-xl shadow-sm transition-all"
                      >
                        <span>+ Log New Payment</span>
                      </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
                      {isLoadingDrawerPayments ? (
                        <div className="py-12 text-center text-slate-400 text-xs">
                          <div className="w-6 h-6 border-2 border-[#136C9E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <span>Loading ledger records…</span>
                        </div>
                      ) : drawerPayments.length === 0 ? (
                        <div className="py-12 px-6 text-center text-slate-500 text-xs space-y-2">
                          <p className="font-semibold text-slate-700">No payment records found yet.</p>
                          <p className="text-slate-400">Click &quot;+ Log New Payment&quot; to record rent payment directly to this tenant&apos;s ledger.</p>
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-heading">
                              <th className="py-3 px-4">REF #</th>
                              <th className="py-3 px-4">DUE DATE</th>
                              <th className="py-3 px-4">PERIOD</th>
                              <th className="py-3 px-4">AMOUNT</th>
                              <th className="py-3 px-4">STATUS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {drawerPayments.map((p, idx) => (
                              <tr key={p.id || idx} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                                  INV-{asDate(p.dueDate)?.getFullYear() || 2026}-{String((asDate(p.dueDate)?.getMonth() || 0) + 1).padStart(2, '0')}
                                </td>
                                <td className="py-3.5 px-4 text-slate-500">{formatDate(p.dueDate)}</td>
                                <td className="py-3.5 px-4 text-slate-700">
                                  {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
                                </td>
                                <td className="py-3.5 px-4 font-heading font-bold text-slate-900">
                                  {formatCurrency(p.amountDue)}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                      p.status === 'paid'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : p.status === 'overdue'
                                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                  >
                                    {p.status === 'paid' ? 'Paid' : p.status === 'overdue' ? 'Overdue' : 'Due Soon'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. REFERENCING TAB (LIVE REFERENCING STATUS) */}
                {activeDrawerTab === 'referencing' && (
                  <div className="space-y-4 fade-slide-up">
                    {isLoadingDrawerRef ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        <div className="w-6 h-6 border-2 border-[#136C9E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span>Checking referencing records…</span>
                      </div>
                    ) : drawerReferencingDoc ? (
                      <div className="space-y-4">
                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading mb-3">
                            PRIMARY IDENTITY & RIGHT TO RENT
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                            <div>
                              <span className="text-slate-400 block mb-0.5">Verification Status</span>
                              <span className="font-bold text-slate-800 capitalize">
                                {drawerReferencingDoc.status || 'Verified'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">Submitted Date</span>
                              <span className="font-bold text-slate-800 font-mono">
                                {formatDate(drawerReferencingDoc.submittedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-card text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#136C9E] flex items-center justify-center mx-auto shadow-xs">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h4 className="font-heading font-bold text-base text-slate-900">
                          Tenant Referencing Status
                        </h4>
                        <div>
                          {(() => {
                            const refStatus =
                              referencingStatuses.get(activeDrawerTenant.email) ||
                              referencingStatuses.get(activeDrawerTenant.email.toLowerCase());
                            return (
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-heading ${
                                  refStatus === 'complete'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : refStatus === 'in-progress'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                {refStatus === 'complete'
                                  ? 'Verified'
                                  : refStatus === 'in-progress'
                                  ? 'Referencing In Progress'
                                  : 'Not Yet Started'}
                              </span>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                          Automated credit scores, Right to Rent validation, and verified employment affordability checks will appear here when completed.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. NOTES & ACTIVITY TAB (COMING SOON FOR REALTIME COMMS) */}
                {activeDrawerTab === 'notes' && (
                  <div className="space-y-4 fade-slide-up">
                    {/* Live Notes on record */}
                    {activeDrawerTenant.notes ? (
                      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading mb-2">
                          ADMINISTRATIVE NOTES
                        </h4>
                        <p className="text-xs text-slate-700 leading-relaxed">{activeDrawerTenant.notes}</p>
                      </div>
                    ) : null}

                    {/* Direct Comms (Coming Soon) */}
                    <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-card text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#136C9E] flex items-center justify-center mx-auto shadow-xs">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <h4 className="font-heading font-bold text-base text-slate-900">
                        Direct Messages & Comms
                      </h4>
                      <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-[#136C9E] border border-blue-200 text-xs font-bold font-heading">
                        Coming Soon
                      </span>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        Direct two-way SMS messaging and in-app communications with {activeDrawerTenant.name} are currently in development.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD TENANT MODE SELECTION (SINGLE VS MULTIPLE BULK IMPORT)          */}
      {/* ========================================================================= */}
      {isChoiceModalOpen && (
        <div
          id="tenantChoiceModal"
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsChoiceModalOpen(false)}
            />

            <div className="inline-block bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full z-10 border border-slate-200 p-6 sm:p-8 fade-slide-up">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#136C9E] flex items-center justify-center">
                  <Users className="w-6 h-6 stroke-[2.5]" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsChoiceModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <h3 className="font-heading font-bold text-xl text-slate-900 mb-1">
                How would you like to add tenants?
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Choose whether to add an individual tenant or import in bulk.
              </p>

              <div className="space-y-3 mb-6">
                {/* Option 1: Single Tenant */}
                <div
                  onClick={() => setChoiceOption('single')}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    choiceOption === 'single'
                      ? 'border-[#136C9E] bg-blue-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0284c7] flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-heading font-bold text-sm text-slate-900">Single Tenant</h4>
                    <p className="text-xs text-slate-500">Step-by-step guided flow for personal and lease details.</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold ${
                      choiceOption === 'single' ? 'border-[#136C9E] bg-[#136C9E]' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {choiceOption === 'single' ? '✓' : ''}
                  </div>
                </div>

                {/* Option 2: Multiple Tenants (Bulk Import) */}
                <div
                  onClick={() => setChoiceOption('multiple')}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    choiceOption === 'multiple'
                      ? 'border-[#DC5F12] bg-orange-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#DC5F12] flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-heading font-bold text-sm text-slate-900">Multiple Tenants (Bulk Import)</h4>
                    <p className="text-xs text-slate-500">Import multiple tenants from a CSV spreadsheet.</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold ${
                      choiceOption === 'multiple' ? 'border-[#DC5F12] bg-[#DC5F12]' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {choiceOption === 'multiple' ? '✓' : ''}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsChoiceModalOpen(false);
                  if (choiceOption === 'single') {
                    onAddTenant();
                  } else {
                    if (onBulkImportTenant) onBulkImportTenant();
                    else onAddTenant();
                  }
                }}
                className="w-full py-3 bg-[#136C9E] hover:bg-[#0e557d] text-white font-heading font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FILTER DRAWER (EXACT REPLICA FROM AGENT CLIENTS.HTML)                      */}
      {/* ========================================================================= */}
      {isFilterDrawerOpen && (
        <div id="clientsFilterDrawer" className="fixed inset-0 z-[100] overflow-hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsFilterDrawerOpen(false)}
          />

          <div className="fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto w-full sm:max-w-md z-[101] flex flex-col justify-end sm:justify-start">
            <div className="w-full bg-white shadow-2xl rounded-t-3xl sm:rounded-none flex flex-col h-[85vh] sm:h-full transition-transform duration-300 ease-out overflow-hidden fade-slide-up">
              {/* Drawer Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#DC5F12] flex items-center justify-center shrink-0 shadow-xs">
                    <Filter className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900 leading-tight">Filter Clients</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Filter by client status, property & lease expiry</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                {/* 1. Client Status */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-heading">
                    Client Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20 focus:border-[#136C9E] cursor-pointer shadow-xs min-h-[46px]"
                  >
                    <option value="all">Status: All</option>
                    <option value="Paid">Paid</option>
                    <option value="Due Soon">Due Soon</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                {/* 2. Property */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-heading">
                    Property
                  </label>
                  <select
                    value={filterProperty}
                    onChange={(e) => setFilterProperty(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20 focus:border-[#136C9E] cursor-pointer shadow-xs min-h-[46px]"
                  >
                    <option value="all">Property: All</option>
                    {propertyOptions.map((prop) => (
                      <option key={prop} value={prop}>
                        {prop}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Lease Expiry */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-heading">
                    Lease Expiry Timeline
                  </label>
                  <select
                    value={filterExpiry}
                    onChange={(e) => setFilterExpiry(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20 focus:border-[#136C9E] cursor-pointer shadow-xs min-h-[46px]"
                  >
                    <option value="all">Expiry: All Time</option>
                    <option value="30">Within 30 Days</option>
                    <option value="60">Within 60 Days</option>
                    <option value="90">Within 90 Days</option>
                  </select>
                </div>

                {/* Summary Card */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                  <div className="font-bold text-slate-700 font-heading">Applied Filters:</div>
                  <div className="text-slate-500 font-medium leading-relaxed">
                    {activeFiltersCount === 0
                      ? 'Showing all clients (no filters applied).'
                      : `Filters applied: ${filterStatus !== 'all' ? `Status: ${filterStatus}; ` : ''}${
                          filterProperty !== 'all' ? `Property: ${filterProperty}; ` : ''
                        }${filterExpiry !== 'all' ? `Expiry: Within ${filterExpiry} days; ` : ''}`}
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/90 shrink-0 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterProperty('all');
                    setFilterExpiry('all');
                  }}
                  className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold font-heading transition-all shadow-xs cursor-pointer"
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-[#DC5F12] hover:bg-[#ba4e0b] text-white text-xs font-bold font-heading transition-all shadow-md cursor-pointer"
                >
                  Apply & View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOG NEW PAYMENT (EXACT REPLICA FROM AGENT CLIENTS.HTML)             */}
      {/* ========================================================================= */}
      {isLogPaymentModalOpen && logPaymentTenant && (
        <div id="logPaymentModal" className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsLogPaymentModalOpen(false)}
            />

            <div className="inline-block bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:max-w-md sm:w-full z-10 border border-slate-200 fade-slide-up">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-lg text-slate-900">Log New Payment</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Record ledger credit for <strong className="text-slate-700">{logPaymentTenant.name}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLogPaymentModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSavePayment} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 font-heading">
                    Payment Reference
                  </label>
                  <input
                    type="text"
                    required
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 font-heading">
                    Description
                  </label>
                  <input
                    type="text"
                    required
                    value={payDesc}
                    onChange={(e) => setPayDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 font-heading">
                      Amount (£)
                    </label>
                    <input
                      type="number"
                      required
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 font-heading">
                      Status
                    </label>
                    <select
                      value={payStatus}
                      onChange={(e) => setPayStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none cursor-pointer"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Due Soon">Due Soon</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsLogPaymentModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="px-5 py-2.5 rounded-xl bg-[#DC5F12] hover:bg-[#ba4e0b] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    {isSubmittingPayment ? 'Posting…' : 'Post to Ledger'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE TENANT CONFIRMATION DIALOG                                   */}
      {/* ========================================================================= */}
      <Dialog open={!!tenantToDelete} onOpenChange={(open: boolean) => !open && setTenantToDelete(null)}>
        <DialogContent className="rounded-[20px] max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle style={{ fontFamily: 'Archivo,sans-serif' }}>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete tenant <strong>{tenantToDelete?.name}</strong>? This will remove the tenant profile, tenancy record, and referencing history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <button
              type="button"
              disabled={isDeletingTenant}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setTenantToDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeletingTenant}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-2"
              onClick={async () => {
                if (!tenantToDelete || !onDeleteTenant) return;
                try {
                  setIsDeletingTenant(true);
                  await onDeleteTenant(tenantToDelete.id, tenantToDelete);
                  setTenantToDelete(null);
                  if (activeDrawerTenant?.id === tenantToDelete.id) {
                    setActiveDrawerTenant(null);
                  }
                  invalidateTenants();
                  showToast('Tenant deleted successfully', 'success');
                } catch (err) {
                  console.error('Failed to delete tenant:', err);
                  showToast('Failed to delete tenant', 'error');
                } finally {
                  setIsDeletingTenant(false);
                }
              }}
            >
              {isDeletingTenant ? 'Deleting...' : 'Delete Tenant'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ClientsPage;
