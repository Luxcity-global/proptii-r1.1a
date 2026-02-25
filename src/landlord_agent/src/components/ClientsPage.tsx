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
import { LandlordEmptyState } from './LandlordEmptyState';
import { referencingService } from '../services/referencingService';



interface Landlord {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'new' | 'premium' | 'suspended';
  portfolio: {
    totalProperties: number;
    totalValue: number;
    monthlyIncome: number;
  };
  properties: string[];
  notes: string;
  avatar?: string;
  lastContact: Date;
  joinDate: Date;
  location: string;
  company?: string;
}

interface ClientsPageProps {
  tenants: Tenant[];
  properties: Property[];
  arrearsAlerts: ArrearsAlert[];
  userRole: UserRole;
  userProfile?: UserProfile | null;
  onSignIn?: () => void;
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
  onExportLandlords?: (format: 'json' | 'csv' | 'excel' | 'pdf') => void;
}

export function ClientsPage({ tenants, properties, arrearsAlerts, userRole, userProfile, onSignIn, onViewTenant, onViewProperty, onAddTenant, onAddLandlord, onViewLandlord, onDeleteTenant, onArchiveTenant, onExportTenants, onDeleteLandlord, onArchiveLandlord, onExportLandlords }: ClientsPageProps) {
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

  const TENANTS_PER_PAGE = 10;

  // Fetch referencing statuses for all tenants
  useEffect(() => {
    const fetchReferencingStatuses = async () => {
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
  }, [tenants]);

  const getPropertyForTenant = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? properties.find(p => p.id === tenant.propertyId) : null;
  };

  const getArrearsForTenant = (tenantId: string) => {
    return arrearsAlerts.find(alert => alert.tenantId === tenantId);
  };

  // Calculate summary statistics
  const getTenantSummary = () => {
    const totalTenants = tenants.length;
    const overdueCount = tenants.filter(t => t.paymentStatus === 'overdue').length;
    const currentCount = tenants.filter(t => t.paymentStatus === 'current').length;
    const totalOverdueAmount = arrearsAlerts.reduce((sum, alert) => sum + alert.overdueAmount, 0);
    
    // Calculate leases expiring in next 3 months
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    const leasesExpiringSoon = tenants.filter(t => 
      t.leaseEnd <= threeMonthsFromNow && t.status === 'active'
    ).length;
    
    // Calculate average risk score
    const tenantsWithRisk = tenants.filter(t => t.defaultRiskScore !== undefined);
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
  };

  const summary = getTenantSummary();

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

  const mockLandlords: Landlord[] = [
    {
      id: '1',
      name: 'Margaret Williams',
      email: 'margaret.williams@email.com',
      phone: '+44 7700 900127',
      status: 'premium',
      portfolio: { 
        totalProperties: 12, 
        totalValue: 4200000, 
        monthlyIncome: 18500 
      },
      properties: ['prop1', 'prop3', 'prop4', 'prop5', 'prop6'],
      notes: 'Experienced landlord with portfolio across London. Interested in expanding to new areas.',
      lastContact: new Date('2024-12-15'),
      joinDate: new Date('2020-03-15'),
      location: 'London',
      company: 'Williams Property Group'
    },
    {
      id: '2',
      name: 'Robert Chen',
      email: 'robert.chen@email.com',
      phone: '+44 7700 900128',
      status: 'active',
      portfolio: { 
        totalProperties: 6, 
        totalValue: 2100000, 
        monthlyIncome: 9200 
      },
      properties: ['prop2', 'prop7'],
      notes: 'Tech professional turned landlord. Looking for modern properties with good yields.',
      lastContact: new Date('2024-12-12'),
      joinDate: new Date('2022-08-20'),
      location: 'Manchester',
      company: 'Chen Investments'
    },
    {
      id: '3',
      name: 'Sarah Mitchell',
      email: 'sarah.mitchell@email.com',
      phone: '+44 7700 900129',
      status: 'new',
      portfolio: { 
        totalProperties: 2, 
        totalValue: 850000, 
        monthlyIncome: 3800 
      },
      properties: ['prop8', 'prop9'],
      notes: 'New to property investment. Seeking guidance on portfolio management and tenant relations.',
      lastContact: new Date('2024-12-10'),
      joinDate: new Date('2024-09-01'),
      location: 'Birmingham',
      company: undefined
    },
    {
      id: '4',
      name: 'David Thompson',
      email: 'david.thompson@email.com',
      phone: '+44 7700 900130',
      status: 'inactive',
      portfolio: { 
        totalProperties: 8, 
        totalValue: 3200000, 
        monthlyIncome: 14200 
      },
      properties: ['prop10', 'prop11', 'prop12'],
      notes: 'Seasoned investor taking a break from new acquisitions. Focus on existing portfolio optimization.',
      lastContact: new Date('2024-11-28'),
      joinDate: new Date('2019-01-10'),
      location: 'Edinburgh',
      company: 'Thompson Estates'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'premium':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'new':
        return 'bg-yellow-100 text-yellow-800';
      case 'negotiating':
        return 'bg-blue-100 text-blue-800';
      case 'ended':
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReferencingStatusColor = (status: 'not-started' | 'in-progress' | 'complete') => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'not-started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReferencingStatusLabel = (status: 'not-started' | 'in-progress' | 'complete') => {
    switch (status) {
      case 'not-started':
        return 'Not yet started';
      case 'in-progress':
        return 'In progress';
      case 'complete':
        return 'Complete';
      default:
        return 'Unknown';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const filteredAndSortedTenants = useMemo(() => {
    const now = new Date();
    const arrearsByTenantId = new Map<string, ArrearsAlert>();
    arrearsAlerts.forEach(alert => arrearsByTenantId.set(alert.tenantId, alert));

    // Filter tenants
    let filtered = tenants.filter(tenant => {
      const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tenant.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = tenantFilter === 'all' || tenant.status === tenantFilter;
      
      // Overdue rent filter (when selected from Sort By dropdown)
      let matchesOverdue = true;
      if (tenantSortBy === 'overdue-rent-only') {
        const tenantAlert = arrearsByTenantId.get(tenant.id);
        const alertAmount = tenantAlert?.overdueAmount ?? 0;
        const tenantOverdueAmount = tenant.overdueAmount ?? 0;
        const hasOverdueRent = tenant.paymentStatus === 'overdue' || alertAmount > 0 || tenantOverdueAmount > 0;
        matchesOverdue = hasOverdueRent;
      }

      // Lease expiry filter
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

    // Sort tenants
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
    // When "Overdue Rent Only" is selected, sort by overdue amount descending
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

  // Pagination for tenants
  const totalTenantPages = Math.ceil(filteredTenants.length / TENANTS_PER_PAGE);
  const startIndex = (currentTenantPage - 1) * TENANTS_PER_PAGE;
  const endIndex = startIndex + TENANTS_PER_PAGE;
  const paginatedTenants = filteredTenants.slice(startIndex, endIndex);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentTenantPage(1);
  }, [searchTerm, tenantFilter, leaseExpiryFilter, tenantSortBy]);

  const filteredAndSortedLandlords = useMemo(() => {
    // Filter landlords
    let filtered = mockLandlords.filter(landlord => {
      const matchesSearch = landlord.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           landlord.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           landlord.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           landlord.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (landlord.company && landlord.company.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter = landlordFilter === 'all' || landlord.status === landlordFilter;
      return matchesSearch && matchesFilter;
    });

    // Sort landlords
    if (landlordSortBy !== 'default') {
      filtered = [...filtered].sort((a, b) => {
        switch (landlordSortBy) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'properties-asc':
            return a.portfolio.totalProperties - b.portfolio.totalProperties;
          case 'properties-desc':
            return b.portfolio.totalProperties - a.portfolio.totalProperties;
          case 'income-asc':
            return a.portfolio.monthlyIncome - b.portfolio.monthlyIncome;
          case 'income-desc':
            return b.portfolio.monthlyIncome - a.portfolio.monthlyIncome;
          case 'portfolio-asc':
            return a.portfolio.totalValue - b.portfolio.totalValue;
          case 'portfolio-desc':
            return b.portfolio.totalValue - a.portfolio.totalValue;
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [searchTerm, landlordFilter, landlordSortBy]);

  const filteredLandlords = filteredAndSortedLandlords;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: '#374957', fontFamily: 'Archivo, sans-serif' }}>Your Tenants</h1>
          <p className="text-muted-foreground" style={{ fontFamily: 'Archivo, sans-serif' }}>
            Manage your tenants and landlords
          </p>
        </div>
        <Button 
          onClick={activeTab === 'landlords' ? onAddLandlord : onAddTenant}
          data-demo-add-tenant-cta={activeTab === 'tenants' ? '1' : undefined}
          className="flex items-center space-x-0 px-12 py-3 min-h-[3.5rem] rounded-full transition-all duration-300 flex-shrink-0 w-auto" 
          style={{ 
            backgroundColor: '#DC5F12', 
            borderColor: '#DC5F12', 
            minWidth: '180px',
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
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span>{activeTab === 'landlords' ? 'Add Landlord' : 'Add Tenant'}</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {!userProfile && onSignIn ? (
        <Card className="p-12">
          <LandlordEmptyState onSignIn={onSignIn} />
        </Card>
      ) : userRole !== 'landlord' ? (
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedTenants.length} tenant{selectedTenants.length > 1 ? 's' : ''} selected
                  </span>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleBulkArchiveTenants}>
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
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
                  <Button variant="destructive" size="sm" onClick={handleBulkDeleteTenants}>
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedLandlords.length} landlord{selectedLandlords.length > 1 ? 's' : ''} selected
                  </span>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleBulkArchiveLandlords}>
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
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
                  <Button variant="destructive" size="sm" onClick={handleBulkDeleteLandlords}>
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
                          {landlord.company && (
                            <Badge variant="outline" className="text-xs">
                              {landlord.company}
                            </Badge>
                          )}
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
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center">
                            <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                            {landlord.portfolio.totalProperties} properties
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                            {formatCurrency(landlord.portfolio.monthlyIncome)}/month
                          </div>
                          <div className="flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                            {formatCurrency(landlord.portfolio.totalValue)} portfolio
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2" />
                          {landlord.location}
                        </div>
                        
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          Joined: {formatDate(landlord.joinDate)} • Last contact: {formatDate(landlord.lastContact)}
                        </div>
                        
                        {landlord.notes && (
                          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                            <strong>Notes:</strong> {landlord.notes}
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedTenants.length} tenant{selectedTenants.length > 1 ? 's' : ''} selected
                  </span>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleBulkArchiveTenants}>
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
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
                  <Button variant="destructive" size="sm" onClick={handleBulkDeleteTenants}>
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