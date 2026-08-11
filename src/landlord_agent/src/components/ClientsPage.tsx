import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Mail, Phone, Calendar, Home, DollarSign, User, MapPin, Filter, AlertTriangle, PoundSterling, Eye, Users, TrendingUp, Shield, Clock, Trash2, Download, Upload, Archive, CheckSquare, Square, Copy, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tenant, Property, ArrearsAlert, UserRole, UserProfile } from '../App';
import { referencingService } from '../services/referencingService';
import { LandlordPageEmptyShell } from './LandlordPageEmptyShell';
import { isNewPortfolioUser } from '../utils/portfolioStatus';
import { useLandlords, Landlord } from '../hooks/useLandlords';




// Interface is now imported from the hook


interface ClientsPageProps {
  tenants: Tenant[];
  properties: Property[];
  arrearsAlerts: ArrearsAlert[];
  userRole: UserRole;
  onViewTenant: (tenant: Tenant) => void;
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
}

export function ClientsPage({ tenants, properties, arrearsAlerts, userRole, onViewTenant, onViewProperty, onAddTenant, onAddLandlord, onViewLandlord, onDeleteTenant, onArchiveTenant, onExportTenants, onDeleteLandlord, onArchiveLandlord, onExportLandlords, userProfile, onAddProperty }: ClientsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('tenants');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [landlordFilter, setLandlordFilter] = useState('all');
  const [leaseExpiryFilter, setLeaseExpiryFilter] = useState<string>('all');
  const [tenantSortBy, setTenantSortBy] = useState<string>('default');
  const [landlordSortBy, setLandlordSortBy] = useState<string>('default');
  const [currentTenantPage, setCurrentTenantPage] = useState<number>(1);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [selectedLandlords, setSelectedLandlords] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [referencingStatuses, setReferencingStatuses] = useState<Map<string, 'not-started' | 'in-progress' | 'complete'>>(new Map());
  const [isLoadingReferencingStatuses, setIsLoadingReferencingStatuses] = useState(false);

  const { landlords: liveLandlords, isLoading: isLandlordsLoading } = useLandlords();
  const TENANTS_PER_PAGE = 10;

  // Fetch referencing statuses for all tenants
  useEffect(() => {
    const fetchReferencingStatuses = async () => {
      if (!userProfile) {
        setReferencingStatuses(new Map());
        return;
      }
      if (tenants.length === 0) return;
      
      setIsLoadingReferencingStatuses(true);
      console.log('[ClientsPage] Fetching referencing statuses for', tenants.length, 'tenants');
      
      const emails = tenants
        .filter(t => t.email && t.email.trim())
        .map(t => t.email);
      
      const statuses = await referencingService.getReferencingStatusForTenants(emails);
      
      console.log('[ClientsPage] Fetched referencing statuses:', statuses.size);
      setReferencingStatuses(statuses);
      setIsLoadingReferencingStatuses(false);
    };

    fetchReferencingStatuses();
  }, [tenants, userProfile]);

  // Selection functions
  const toggleTenantSelection = (tenantId: string) => {
    setSelectedTenants(prev => 
      prev.includes(tenantId) 
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const toggleLandlordSelection = (landlordId: string) => {
    setSelectedLandlords(prev => 
      prev.includes(landlordId) 
        ? prev.filter(id => id !== landlordId)
        : [...prev, landlordId]
    );
  };

  const selectAllTenants = () => {
    if (selectedTenants.length === filteredTenants.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(filteredTenants.map(tenant => tenant.id));
    }
  };

  const selectAllLandlords = () => {
    if (selectedLandlords.length === filteredLandlords.length) {
      setSelectedLandlords([]);
    } else {
      setSelectedLandlords(filteredLandlords.map(landlord => landlord.id));
    }
  };

  const clearSelection = () => {
    setSelectedTenants([]);
    setSelectedLandlords([]);
    setShowBulkActions(false);
  };

  // Bulk action handlers
  const handleBulkDeleteTenants = () => {
    if (onDeleteTenant) {
      selectedTenants.forEach(tenantId => onDeleteTenant(tenantId));
      clearSelection();
    }
  };

  const handleBulkArchiveTenants = () => {
    if (onArchiveTenant) {
      selectedTenants.forEach(tenantId => onArchiveTenant(tenantId));
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
      selectedLandlords.forEach(landlordId => onDeleteLandlord(landlordId));
      clearSelection();
    }
  };

  const handleBulkArchiveLandlords = () => {
    if (onArchiveLandlord) {
      selectedLandlords.forEach(landlordId => onArchiveLandlord(landlordId));
      clearSelection();
    }
  };

  const handleBulkExportLandlords = (format: 'json' | 'csv' | 'excel' | 'pdf') => {
    if (onExportLandlords) {
      onExportLandlords(format);
    }
  };

  // Update showBulkActions based on selection
  React.useEffect(() => {
    setShowBulkActions(selectedTenants.length > 0 || selectedLandlords.length > 0);
  }, [selectedTenants, selectedLandlords]);

  // Replaced mockLandlords with liveLandlords from useLandlords hook

  const filteredAndSortedTenants = useMemo(() => {
    const now = new Date();
    const arrearsByTenantId = new Map<string, ArrearsAlert>();
    arrearsAlerts.forEach(alert => arrearsByTenantId.set(alert.tenantId, alert));

    let filtered = (tenants || []).filter(tenant => {
      const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tenant.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase());
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
      
      return matchesSearch && matchesFilter && matchesOverdue && matchesLeaseExpiry;
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
          case 'lease-expiry-asc':
            const leaseEndA = a.leaseEnd instanceof Date ? a.leaseEnd : new Date(a.leaseEnd);
            const leaseEndB = b.leaseEnd instanceof Date ? b.leaseEnd : new Date(b.leaseEnd);
            return leaseEndA.getTime() - leaseEndB.getTime();
          case 'lease-expiry-desc':
            const leaseEndA2 = a.leaseEnd instanceof Date ? a.leaseEnd : new Date(a.leaseEnd);
            const leaseEndB2 = b.leaseEnd instanceof Date ? b.leaseEnd : new Date(b.leaseEnd);
            return leaseEndB2.getTime() - leaseEndA2.getTime();
          case 'overdue-desc':
            const overdueA = arrearsA?.overdueAmount ?? a.overdueAmount ?? 0;
            const overdueB = arrearsB?.overdueAmount ?? b.overdueAmount ?? 0;
            return overdueB - overdueA;
          case 'overdue-asc':
            const overdueA2 = arrearsA?.overdueAmount ?? a.overdueAmount ?? 0;
            const overdueB2 = arrearsB?.overdueAmount ?? b.overdueAmount ?? 0;
            return overdueA2 - overdueB2;
          default:
            return 0;
        }
      });
    }
    else if (tenantSortBy === 'overdue-rent-only') {
      filtered = [...filtered].sort((a, b) => {
        const arrearsA = arrearsByTenantId.get(a.id);
        const arrearsB = arrearsByTenantId.get(b.id);
        const overdueA = arrearsA?.overdueAmount ?? a.overdueAmount ?? 0;
        const overdueB = arrearsB?.overdueAmount ?? b.overdueAmount ?? 0;
        return overdueB - overdueA;
      });
    }

    return filtered;
  }, [tenants, arrearsAlerts, searchTerm, tenantFilter, leaseExpiryFilter, tenantSortBy]);

  const filteredTenants = filteredAndSortedTenants;

  const totalTenantPages = Math.ceil((filteredTenants || []).length / TENANTS_PER_PAGE) || 1;

  const paginatedTenants = useMemo(() => {
    const start = (currentTenantPage - 1) * TENANTS_PER_PAGE;
    return (filteredTenants || []).slice(start, start + TENANTS_PER_PAGE);
  }, [filteredTenants, currentTenantPage]);

  useEffect(() => {
    setCurrentTenantPage(1);
  }, [searchTerm, tenantFilter, leaseExpiryFilter, tenantSortBy]);

  const filteredAndSortedLandlords = useMemo(() => {
    let filtered = (liveLandlords || []).filter(landlord => {
      const matchesSearch = landlord.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           landlord.email?.toLowerCase().includes(searchTerm.toLowerCase());
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
            return parseFloat(a.totalValue.replace(/[^0-9.]/g, '')) - parseFloat(b.totalValue.replace(/[^0-9.]/g, ''));
          case 'portfolio-desc':
            return parseFloat(b.totalValue.replace(/[^0-9.]/g, '')) - parseFloat(a.totalValue.replace(/[^0-9.]/g, ''));
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [liveLandlords, searchTerm, landlordFilter, landlordSortBy]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalTenants = (tenants || []).length;
    const overdueCount = (tenants || []).filter(t => t.paymentStatus === 'overdue').length;
    const currentCount = (tenants || []).filter(t => t.paymentStatus === 'current').length;
    const totalOverdueAmount = (arrearsAlerts || []).reduce((sum, alert) => sum + alert.overdueAmount, 0);
    
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    const leasesExpiringSoon = (tenants || []).filter(t => 
      t.leaseEnd <= threeMonthsFromNow && t.status === 'active'
    ).length;
    
    const tenantsWithRisk = (tenants || []).filter(t => t.defaultRiskScore !== undefined);
    const avgRiskScore = tenantsWithRisk.length > 0 
      ? Math.round(tenantsWithRisk.reduce((sum, t) => sum + (t.defaultRiskScore || 0), 0) / tenantsWithRisk.length)
      : 0;
    
    return {
      totalTenants,
      overdueCount,
      currentCount,
      totalOverdueAmount,
      leasesExpiringSoon,
      avgRiskScore
    };
  }, [tenants, arrearsAlerts]);

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

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl md:text-3xl" style={{ color: '#374957', fontFamily: 'Archivo, sans-serif' }}>Your Tenants</h1>
          <p className="text-xs sm:text-sm text-muted-foreground" style={{ fontFamily: 'Archivo, sans-serif' }}>
            Manage your tenants and landlords
          </p>
        </div>
        <Button 
          onClick={onAddTenant} 
          className="flex items-center space-x-0 px-5 sm:px-8 md:px-12 py-2.5 sm:py-3 md:py-3.5 min-h-[2.75rem] sm:min-h-[3.25rem] md:min-h-[3.5rem] rounded-full transition-all duration-300 flex-shrink-0 text-sm sm:text-base" 
          style={{ 
            backgroundColor: '#DC5F12', 
            borderColor: '#DC5F12', 
            minWidth: 'auto',
            width: 'auto',
            background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B1A 0%, #DC5F12 100%)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 95, 18, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'translateY(0px)';
          }}
        >
          <Plus className="w-4 h-4 sm:w-4 sm:h-4" strokeWidth={2.5} />
          <span className="ml-1.5 sm:ml-2">Add Tenant</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-1">
                Total Tenants
              </p>
              <p className="text-2xl font-semibold">
                {summary.totalTenants}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.currentCount} current, {summary.overdueCount} overdue
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-1">
                Rent Arrears
              </p>
              <p className="text-2xl font-semibold text-red-600">
                £{summary.totalOverdueAmount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.overdueCount} tenant{summary.overdueCount !== 1 ? 's' : ''} behind
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-1">
                Leases Expiring
              </p>
              <p className="text-2xl font-semibold text-orange-600">
                {summary.leasesExpiringSoon}
              </p>
              <p className="text-xs text-muted-foreground">
                Next 3 months
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-1">
                Avg Risk Score
              </p>
              <p className={`text-2xl font-semibold ${
                summary.avgRiskScore >= 70 ? 'text-red-600' : 
                summary.avgRiskScore >= 40 ? 'text-orange-600' : 'text-green-600'
              }`}>
                {summary.avgRiskScore}%
              </p>
              <p className="text-xs text-muted-foreground">
                Default risk level
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              summary.avgRiskScore >= 70 ? 'bg-red-100' : 
              summary.avgRiskScore >= 40 ? 'bg-orange-100' : 'bg-green-100'
            }`}>
              <Shield className={`w-6 h-6 ${
                summary.avgRiskScore >= 70 ? 'text-red-600' : 
                summary.avgRiskScore >= 40 ? 'text-orange-600' : 'text-green-600'
              }`} />
            </div>
          </div>
        </Card>
      </div>

      {userRole !== 'landlord' ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${userRole === 'agent' ? 'grid-cols-2' : 'grid-cols-1'} h-16 bg-transparent`}>
            <TabsTrigger 
              value="tenants"
              style={activeTab === 'tenants' ? { backgroundColor: 'white', color: '#374957' } : { backgroundColor: 'transparent', color: '#6B7280' }}
              className="transition-colors duration-200 h-16"
            >
              Tenants
            </TabsTrigger>
            {userRole === 'agent' && (
              <TabsTrigger 
                value="landlords"
                style={activeTab === 'landlords' ? { backgroundColor: 'white', color: '#374957' } : { backgroundColor: 'transparent', color: '#6B7280' }}
                className="transition-colors duration-200 h-16"
              >
                Landlords
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="tenants" className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-white border border-[#f3f3f3] rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllTenants}
                className="p-2"
              >
                {selectedTenants.length === filteredTenants.length && filteredTenants.length > 0 ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedTenants.length === filteredTenants.length && filteredTenants.length > 0 ? 'Deselect All' : 'Select All'}
              </span>
            </div>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={tenantFilter} onValueChange={setTenantFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={leaseExpiryFilter} onValueChange={setLeaseExpiryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lease Expiry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leases</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="30-days">Expiring within 30 days</SelectItem>
                <SelectItem value="60-days">Expiring within 60 days</SelectItem>
                <SelectItem value="90-days">Expiring within 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tenantSortBy} onValueChange={setTenantSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
                <SelectItem value="rent-asc">Rent: Low to High</SelectItem>
                <SelectItem value="rent-desc">Rent: High to Low</SelectItem>
                <SelectItem value="lease-expiry-asc">Lease Expiry: Soonest First</SelectItem>
                <SelectItem value="lease-expiry-desc">Lease Expiry: Latest First</SelectItem>
                <SelectItem value="overdue-desc">Overdue Amount: Highest First</SelectItem>
                <SelectItem value="overdue-asc">Overdue Amount: Lowest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions Bar */}
          {showBulkActions && selectedTenants.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 overflow-x-hidden">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center flex-wrap gap-2 sm:space-x-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedTenants.length} tenant{selectedTenants.length > 1 ? 's' : ''} selected
                  </span>
                  <Button variant="outline" size="sm" onClick={clearSelection} className="flex-shrink-0">
                    Clear Selection
                  </Button>
                </div>
                <div className="flex items-center flex-wrap gap-2 sm:space-x-2">
                  <Button variant="outline" size="sm" onClick={handleBulkArchiveTenants} className="flex-shrink-0">
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-shrink-0">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkExportTenants('json')}>
                        Export as JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkExportTenants('csv')}>
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkExportTenants('excel')}>
                        Export as Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkExportTenants('pdf')}>
                        Export as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="destructive" size="sm" onClick={handleBulkDeleteTenants} className="flex-shrink-0">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedTenants.map((tenant) => {
              const property = getPropertyForTenant(tenant.id);
              const arrears = getArrearsForTenant(tenant.id);
              
              return (
                <Card 
                  key={tenant.id} 
                  className={`hover:shadow-md transition-shadow ${
                    arrears ? 'border-red-200 bg-red-50/50' : ''
                  } ${selectedTenants.includes(tenant.id) ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <CardContent className="p-6 cursor-pointer" onClick={() => onViewTenant(tenant)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex items-center pt-1">
                          <input
                            type="checkbox"
                            checked={selectedTenants.includes(tenant.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleTenantSelection(tenant.id);
                            }}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <Avatar className="h-12 w-12">
                          {tenant.avatar && <AvatarImage src={tenant.avatar} alt={tenant.name} />}
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium" style={{ color: '#374957' }}>{tenant.name}</h3>
                            <Badge className={getStatusColor(tenant.status)}>
                              {tenant.status}
                            </Badge>
                            {isLoadingReferencingStatuses ? (
                              <Badge className="bg-gray-100 text-gray-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Loading...
                              </Badge>
                            ) : (
                              <Badge className={getReferencingStatusColor(referencingStatuses.get(tenant.email) || 'not-started')}>
                                Referencing: {getReferencingStatusLabel(referencingStatuses.get(tenant.email) || 'not-started')}
                              </Badge>
                            )}
                            {arrears && (
                              <Badge className="bg-red-100 text-red-800 border-red-200">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Arrears
                              </Badge>
                            )}
                          </div>
                          
                          {/* Property Information */}
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              {tenant.propertyAddress}
                            </div>
                            {property && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewProperty(property);
                                }}
                                className="h-6 px-2 text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Property
                              </Button>
                            )}
                          </div>
                          
                          {/* Arrears Alert */}
                          {arrears && (
                            <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center text-red-800">
                                  <PoundSterling className="h-4 w-4 mr-2" />
                                  <span className="font-medium">
                                    £{arrears.overdueAmount.toLocaleString()} overdue
                                  </span>
                                </div>
                                <span className="text-sm text-red-600">
                                  {arrears.daysPastDue} days past due
                                </span>
                              </div>
                              <div className="mt-1 text-sm text-red-700">
                                Default Risk Score: {arrears.defaultRiskScore}%
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                              {tenant.email}
                            </div>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                              {tenant.phone}
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                              {formatCurrency(tenant.rentAmount)}/month
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-2" />
                            Lease: {formatDate(tenant.leaseStart)} - {formatDate(tenant.leaseEnd)}
                          </div>
                          {tenant.emergencyContact && (
                            <div className="text-sm text-muted-foreground">
                              Emergency: {tenant.emergencyContact.name} ({tenant.emergencyContact.relationship}) - {tenant.emergencyContact.phone}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewTenant(tenant);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalTenantPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-[#f3f3f3] rounded-lg p-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredTenants.length)} of {filteredTenants.length} tenants
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentTenantPage(prev => Math.max(1, prev - 1))}
                  disabled={currentTenantPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalTenantPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalTenantPages ||
                      (page >= currentTenantPage - 1 && page <= currentTenantPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={currentTenantPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentTenantPage(page)}
                          className="min-w-[40px]"
                        >
                          {page}
                        </Button>
                      );
                    } else if (
                      page === currentTenantPage - 2 ||
                      page === currentTenantPage + 2
                    ) {
                      return (
                        <span key={page} className="text-muted-foreground px-2">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentTenantPage(prev => Math.min(totalTenantPages, prev + 1))}
                  disabled={currentTenantPage === totalTenantPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {userRole === 'agent' && (
          <TabsContent value="landlords" className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-white border border-[#f3f3f3] rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllLandlords}
                  className="p-2"
                >
                  {selectedLandlords.length === filteredLandlords.length && filteredLandlords.length > 0 ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedLandlords.length === filteredLandlords.length && filteredLandlords.length > 0 ? 'Deselect All' : 'Select All'}
                </span>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search landlords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={landlordFilter} onValueChange={setLandlordFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={onAddLandlord}
                  className="flex items-center space-x-0 px-12 py-3 min-h-[3.5rem] rounded-full hover:shadow-md transition-shadow flex-shrink-0 w-auto" 
                  style={{ backgroundColor: '#DC5F12', borderColor: '#DC5F12', minWidth: '180px' }}
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  <span>Add Landlord</span>
                </Button>
              </div>
            </div>

            {/* Additional Filters Row for Landlords */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-white border border-[#f3f3f3] rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
              </div>

              <Select value={landlordSortBy} onValueChange={setLandlordSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  <SelectItem value="name-desc">Name: Z to A</SelectItem>
                  <SelectItem value="properties-asc">Properties: Low to High</SelectItem>
                  <SelectItem value="properties-desc">Properties: High to Low</SelectItem>
                  <SelectItem value="income-asc">Monthly Income: Low to High</SelectItem>
                  <SelectItem value="income-desc">Monthly Income: High to Low</SelectItem>
                  <SelectItem value="portfolio-asc">Portfolio Value: Low to High</SelectItem>
                  <SelectItem value="portfolio-desc">Portfolio Value: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions Bar for Landlords */}
          {showBulkActions && selectedLandlords.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 overflow-x-hidden">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center flex-wrap gap-2 sm:space-x-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedLandlords.length} landlord{selectedLandlords.length > 1 ? 's' : ''} selected
                  </span>
                  <Button variant="outline" size="sm" onClick={clearSelection} className="flex-shrink-0">
                    Clear Selection
                  </Button>
                </div>
                <div className="flex items-center flex-wrap gap-2 sm:space-x-2">
                  <Button variant="outline" size="sm" onClick={handleBulkArchiveLandlords} className="flex-shrink-0">
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-shrink-0">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkExportLandlords('json')}>
                        Export as JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkExportLandlords('csv')}>
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkExportLandlords('excel')}>
                        Export as Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkExportLandlords('pdf')}>
                        Export as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="destructive" size="sm" onClick={handleBulkDeleteLandlords} className="flex-shrink-0">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {filteredLandlords.map((landlord) => (
              <Card key={landlord.id} className={`hover:shadow-md transition-shadow ${selectedLandlords.includes(landlord.id) ? 'ring-2 ring-blue-500' : ''}`}>
                <CardContent className="p-6 cursor-pointer" onClick={() => onViewLandlord(landlord)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center pt-1">
                        <input
                          type="checkbox"
                          checked={selectedLandlords.includes(landlord.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleLandlordSelection(landlord.id);
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <Avatar className="h-12 w-12">
                        {landlord.avatar && <AvatarImage src={landlord.avatar} alt={landlord.name} />}
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium" style={{ color: '#374957' }}>{landlord.name}</h3>
                          <Badge className={getStatusColor(landlord.status)}>
                            {landlord.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            {landlord.email}
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                            {landlord.phone}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Home className="h-4 w-4 mr-1.5 text-blue-500" />
                            {landlord.propertyCount} properties
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="h-4 w-4 mr-1.5 text-green-500" />
                            {landlord.activeTenants} active tenants
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4 mr-1.5 text-purple-500" />
                            {landlord.totalValue} portfolio value
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            Joined: {landlord.joinDate} • Last active: {landlord.lastActive}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewLandlord(landlord);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        )}
      </Tabs>
      ) : (
        // For landlord users, show tenant list directly without tabs
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-white border border-[#f3f3f3] rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllTenants}
                className="p-2"
              >
                {selectedTenants.length === filteredTenants.length && filteredTenants.length > 0 ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedTenants.length === filteredTenants.length && filteredTenants.length > 0 ? 'Deselect All' : 'Select All'}
              </span>
            </div>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={tenantFilter} onValueChange={setTenantFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={leaseExpiryFilter} onValueChange={setLeaseExpiryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lease Expiry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leases</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="30-days">Expiring within 30 days</SelectItem>
                <SelectItem value="60-days">Expiring within 60 days</SelectItem>
                <SelectItem value="90-days">Expiring within 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tenantSortBy} onValueChange={setTenantSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="overdue-rent-only">Overdue Rent Only</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
                <SelectItem value="rent-asc">Rent: Low to High</SelectItem>
                <SelectItem value="rent-desc">Rent: High to Low</SelectItem>
                <SelectItem value="lease-expiry-asc">Lease Expiry: Soonest First</SelectItem>
                <SelectItem value="lease-expiry-desc">Lease Expiry: Latest First</SelectItem>
                <SelectItem value="overdue-desc">Overdue Amount: Highest First</SelectItem>
                <SelectItem value="overdue-asc">Overdue Amount: Lowest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions Bar */}
          {showBulkActions && selectedTenants.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 overflow-x-hidden">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center flex-wrap gap-2 sm:space-x-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedTenants.length} tenant{selectedTenants.length > 1 ? 's' : ''} selected
                  </span>
                  <Button variant="outline" size="sm" onClick={clearSelection} className="flex-shrink-0">
                    Clear Selection
                  </Button>
                </div>
                <div className="flex items-center flex-wrap gap-2 sm:space-x-2">
                  <Button variant="outline" size="sm" onClick={handleBulkArchiveTenants} className="flex-shrink-0">
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-shrink-0">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkExportTenants('json')}>
                        Export as JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkExportTenants('csv')}>
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkExportTenants('excel')}>
                        Export as Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkExportTenants('pdf')}>
                        Export as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="destructive" size="sm" onClick={handleBulkDeleteTenants} className="flex-shrink-0">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedTenants.map((tenant) => {
              const property = getPropertyForTenant(tenant.id);
              const arrears = getArrearsForTenant(tenant.id);
              
              return (
                <Card 
                  key={tenant.id} 
                  className={`hover:shadow-md transition-shadow ${
                    arrears ? 'border-red-200 bg-red-50/50' : ''
                  } ${selectedTenants.includes(tenant.id) ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <CardContent className="p-6 cursor-pointer" onClick={() => onViewTenant(tenant)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedTenants.includes(tenant.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleTenantSelection(tenant.id);
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{tenant.name}</h3>
                            <Badge className={tenant.paymentStatus === 'current' ? 'bg-green-100 text-green-800' : 
                                             tenant.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' : 
                                             'bg-orange-100 text-orange-800'}>
                              {tenant.paymentStatus === 'current' ? 'Payment Up-to-Date' : 
                               tenant.paymentStatus === 'overdue' ? 'Payment Overdue' : 
                               'Payment Plan'}
                            </Badge>
                            {arrears && (
                              <Badge variant="destructive" className="bg-red-100 text-red-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{tenant.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{tenant.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              <span>{tenant.propertyAddress}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <PoundSterling className="h-4 w-4" />
                              <span>£{tenant.rentAmount}/month</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Lease: {formatDate(tenant.leaseStart)} - {formatDate(tenant.leaseEnd)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>Emergency: {tenant.emergencyContactName} ({tenant.emergencyContactPhone})</span>
                            </div>
                          </div>

                          {arrears && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-2 text-red-800 font-medium">
                                <AlertTriangle className="h-4 w-4" />
                                Overdue Amount: £{arrears.overdueAmount}
                              </div>
                              <p className="text-red-700 text-sm mt-1">
                                Last payment: {formatDate(arrears.lastPaymentDate)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalTenantPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-[#f3f3f3] rounded-lg p-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredTenants.length)} of {filteredTenants.length} tenants
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentTenantPage(prev => Math.max(1, prev - 1))}
                  disabled={currentTenantPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalTenantPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalTenantPages ||
                      (page >= currentTenantPage - 1 && page <= currentTenantPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={currentTenantPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentTenantPage(page)}
                          className="min-w-[40px]"
                        >
                          {page}
                        </Button>
                      );
                    } else if (
                      page === currentTenantPage - 2 ||
                      page === currentTenantPage + 2
                    ) {
                      return (
                        <span key={page} className="text-muted-foreground px-2">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentTenantPage(prev => Math.min(totalTenantPages, prev + 1))}
                  disabled={currentTenantPage === totalTenantPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}