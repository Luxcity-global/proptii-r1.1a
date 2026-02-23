import React, { useMemo, useState } from 'react';
import { Plus, Search, Filter, Eye, Edit, MoreHorizontal, MapPin, BedSingle, Building2, Camera, FileText, User, Users, AlertTriangle, PoundSterling, Trash2, Download, Upload, Archive, CheckSquare, Square, Copy, Star, StarOff, ChevronDown, Calendar } from 'lucide-react';
import { ImportPropertiesDialog } from './ImportPropertiesDialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Property, Tenant, ArrearsAlert, UserProfile } from '../App';
import { LandlordEmptyState } from './LandlordEmptyState';

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
  userProfile?: UserProfile | null;
  onSignIn?: () => void;
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
  userProfile,
  onSignIn,
}: PropertiesPageProps) {
  // Feature flag: keep Import hidden until we're ready to ship it.
  const ENABLE_IMPORT_PROPERTIES = true;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [overdueRentFilter, setOverdueRentFilter] = useState<boolean>(false);
  const [leaseExpiryFilter, setLeaseExpiryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const filteredAndSortedProperties = useMemo(() => {
    const now = new Date();
    const arrearsByTenantId = new Map<string, ArrearsAlert>();
    arrearsAlerts.forEach(alert => arrearsByTenantId.set(alert.tenantId, alert));

    // Filter properties
    let filtered = properties.filter((property) => {
      const matchesSearch = property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
      const matchesType = typeFilter === 'all' || property.type === typeFilter;
      
      // Overdue rent filter
      let matchesOverdue = true;
      if (overdueRentFilter) {
        const tenant = property.tenant || tenants.find(t => t.propertyId === property.id);
        if (tenant) {
          const tenantAlert = arrearsByTenantId.get(tenant.id);
          const alertAmount = tenantAlert?.overdueAmount ?? 0;
          const tenantOverdueAmount = tenant.overdueAmount ?? 0;
          const hasOverdueRent = tenant.paymentStatus === 'overdue' || alertAmount > 0 || tenantOverdueAmount > 0;
          matchesOverdue = hasOverdueRent;
        } else {
          matchesOverdue = false; // No tenant means no overdue rent
        }
      }

      // Lease expiry filter
      let matchesLeaseExpiry = true;
      if (leaseExpiryFilter !== 'all') {
        const tenant = property.tenant || tenants.find(t => t.propertyId === property.id);
        if (!tenant) {
          matchesLeaseExpiry = leaseExpiryFilter === 'no-lease';
        } else {
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
      }
      
      return matchesSearch && matchesStatus && matchesType && matchesOverdue && matchesLeaseExpiry;
    });

    // Sort properties
    if (sortBy !== 'default') {
      filtered = [...filtered].sort((a, b) => {
        const tenantA = a.tenant || tenants.find(t => t.propertyId === a.id);
        const tenantB = b.tenant || tenants.find(t => t.propertyId === b.id);
        const arrearsA = tenantA ? arrearsByTenantId.get(tenantA.id) : null;
        const arrearsB = tenantB ? arrearsByTenantId.get(tenantB.id) : null;

        switch (sortBy) {
          case 'rent-asc':
            return a.rent - b.rent;
          case 'rent-desc':
            return b.rent - a.rent;
          case 'lease-expiry-asc':
            if (!tenantA && !tenantB) return 0;
            if (!tenantA) return 1;
            if (!tenantB) return -1;
            const leaseEndA = tenantA.leaseEnd instanceof Date ? tenantA.leaseEnd : new Date(tenantA.leaseEnd);
            const leaseEndB = tenantB.leaseEnd instanceof Date ? tenantB.leaseEnd : new Date(tenantB.leaseEnd);
            return leaseEndA.getTime() - leaseEndB.getTime();
          case 'lease-expiry-desc':
            if (!tenantA && !tenantB) return 0;
            if (!tenantA) return 1;
            if (!tenantB) return -1;
            const leaseEndA2 = tenantA.leaseEnd instanceof Date ? tenantA.leaseEnd : new Date(tenantA.leaseEnd);
            const leaseEndB2 = tenantB.leaseEnd instanceof Date ? tenantB.leaseEnd : new Date(tenantB.leaseEnd);
            return leaseEndB2.getTime() - leaseEndA2.getTime();
          case 'address-asc':
            return a.address.localeCompare(b.address);
          case 'address-desc':
            return b.address.localeCompare(a.address);
          case 'overdue-asc':
            const overdueA = arrearsA?.overdueAmount ?? tenantA?.overdueAmount ?? 0;
            const overdueB = arrearsB?.overdueAmount ?? tenantB?.overdueAmount ?? 0;
            return overdueA - overdueB;
          case 'overdue-desc':
            const overdueA2 = arrearsA?.overdueAmount ?? tenantA?.overdueAmount ?? 0;
            const overdueB2 = arrearsB?.overdueAmount ?? tenantB?.overdueAmount ?? 0;
            return overdueB2 - overdueA2;
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [properties, tenants, arrearsAlerts, searchTerm, statusFilter, typeFilter, overdueRentFilter, leaseExpiryFilter, sortBy]);

  const filteredProperties = filteredAndSortedProperties;

  const {
    propertiesEndingSoonCount,
    propertiesOverdueRentCount,
    totalOverdueRentAmount
  } = useMemo(() => {
    const now = new Date();
    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() + 90);

    const arrearsByTenantId = new Map<string, ArrearsAlert>();
    arrearsAlerts.forEach(alert => arrearsByTenantId.set(alert.tenantId, alert));

    const endingSoon = new Set<string>();
    const overdue = new Set<string>();
    let overdueAmountTotal = 0;

    properties.forEach(property => {
      const tenant = property.tenant || tenants.find(t => t.propertyId === property.id);
      if (!tenant) return;

      const leaseEnd = tenant.leaseEnd instanceof Date ? tenant.leaseEnd : new Date(tenant.leaseEnd);
      if (tenant.status === 'active' && leaseEnd >= now && leaseEnd <= threshold) {
        endingSoon.add(property.id);
      }

      const tenantAlert = arrearsByTenantId.get(tenant.id);
      const alertAmount = tenantAlert?.overdueAmount ?? 0;
      const tenantOverdueAmount = tenant.overdueAmount ?? 0;
      const hasOverdueRent = tenant.paymentStatus === 'overdue' || alertAmount > 0 || tenantOverdueAmount > 0;

      if (hasOverdueRent) {
        overdue.add(property.id);
        overdueAmountTotal += alertAmount > 0 ? alertAmount : tenantOverdueAmount;
      }
    });

    return {
      propertiesEndingSoonCount: endingSoon.size,
      propertiesOverdueRentCount: overdue.size,
      totalOverdueRentAmount: overdueAmountTotal
    };
  }, [arrearsAlerts, properties, tenants]);

  const getStatusColor = (status: Property['status']) => {
    switch (status) {
      case 'vacant':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'occupied':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'under-renovation':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: Property['status']) => {
    switch (status) {
      case 'vacant':
        return 'Vacant';
      case 'occupied':
        return 'Occupied';
      case 'under-renovation':
        return 'Under Renovation';
      default:
        return status;
    }
  };

  const getPropertyTypes = () => {
    const types = new Set(properties.map(p => p.type));
    return Array.from(types);
  };

  const getComplianceStatus = (property: Property) => {
    const expiredDocs = property.documents.filter(doc => doc.status === 'expired').length;
    const expiringSoonDocs = property.documents.filter(doc => doc.status === 'expiring-soon').length;
    
    if (expiredDocs > 0) return { status: 'expired', count: expiredDocs };
    if (expiringSoonDocs > 0) return { status: 'expiring-soon', count: expiringSoonDocs };
    return { status: 'compliant', count: 0 };
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expiring-soon':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'compliant':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTenantForProperty = (propertyId: string) => {
    // First, try to find tenant by propertyId (tenant has propertyId set)
    let tenant = tenants.find(tenant => tenant.propertyId === propertyId);
    
    // If not found, try to find by property's tenantId (property has tenantId set)
    if (!tenant) {
      const property = properties.find(p => p.id === propertyId);
      if (property?.tenantId) {
        tenant = tenants.find(t => t.id === property.tenantId);
      }
    }
    
    // Also check if property has tenant object directly (for backward compatibility)
    if (!tenant) {
      const property = properties.find(p => p.id === propertyId);
      if (property?.tenant) {
        tenant = property.tenant;
      }
    }
    
    return tenant;
  };

  const getArrearsForTenant = (tenantId: string) => {
    return arrearsAlerts.find(alert => alert.tenantId === tenantId);
  };

  // Selection functions
  const togglePropertySelection = (propertyId: string) => {
    const newSelected = new Set(selectedProperties);
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId);
    } else {
      newSelected.add(propertyId);
    }
    setSelectedProperties(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllProperties = () => {
    if (selectedProperties.size === filteredProperties.length) {
      setSelectedProperties(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedProperties(new Set(filteredProperties.map(p => p.id)));
      setShowBulkActions(true);
    }
  };

  const clearSelection = () => {
    setSelectedProperties(new Set());
    setShowBulkActions(false);
  };

  // Bulk action functions
  const handleBulkDelete = () => {
    if (onDeleteProperty && selectedProperties.size > 0) {
      const propertiesToDelete = properties.filter(p => selectedProperties.has(p.id));
      propertiesToDelete.forEach(onDeleteProperty);
      clearSelection();
    }
  };

  const handleBulkArchive = () => {
    if (onArchiveProperty && selectedProperties.size > 0) {
      const propertiesToArchive = properties.filter(p => selectedProperties.has(p.id));
      propertiesToArchive.forEach(onArchiveProperty);
      clearSelection();
    }
  };

  const handleBulkExport = (format: string) => {
    if (onExportProperties && selectedProperties.size > 0) {
      const propertiesToExport = properties.filter(p => selectedProperties.has(p.id));
      onExportProperties(propertiesToExport, format);
      clearSelection();
    }
  };

  const handleBulkDuplicate = () => {
    if (onDuplicateProperty && selectedProperties.size > 0) {
      const propertiesToDuplicate = properties.filter(p => selectedProperties.has(p.id));
      propertiesToDuplicate.forEach(onDuplicateProperty);
      clearSelection();
    }
  };

  const isAllSelected = selectedProperties.size === filteredProperties.length && filteredProperties.length > 0;
  const isPartiallySelected = selectedProperties.size > 0 && selectedProperties.size < filteredProperties.length;

  const handleImportPropertiesSubmit = (importedProperties: Property[]) => {
    if (handleImportProperties) {
      handleImportProperties(importedProperties);
    }
    setShowImportDialog(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: '#374957' }}>Properties</h1>
          <p className="text-muted-foreground">
            Manage all your properties in one place
          </p>
        </div>
        <Button 
          onClick={onAddProperty} 
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
          <span>Add Property</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 flex-1">
              <div className="text-center">
                <p className="text-muted-foreground mb-1 text-sm">
                  Occupied
                </p>
                <p className="text-2xl font-semibold text-green-600">
                  {properties.filter(p => {
                    // A property is occupied if it has a tenant OR if status is explicitly 'occupied'
                    const hasTenant = !!p.tenantId || !!p.tenant || tenants.some(t => t.propertyId === p.id);
                    return p.status === 'occupied' || hasTenant;
                  }).length}
                </p>
              </div>
              
              <div className="w-px h-12 bg-gray-200"></div>
              
              <div className="text-center">
                <p className="text-muted-foreground mb-1 text-sm">
                  Vacant
                </p>
                <p className="text-2xl font-semibold text-orange-600">
                  {properties.filter(p => {
                    // A property is vacant if status is 'vacant' AND it has no tenant
                    // (properties with status 'under-renovation' won't match this condition)
                    const hasTenant = !!p.tenantId || !!p.tenant || tenants.some(t => t.propertyId === p.id);
                    return p.status === 'vacant' && !hasTenant;
                  }).length}
                </p>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-1">
                Average Rent
              </p>
              <p className="text-2xl font-semibold">
                £{properties.length > 0 ? Math.round(properties.reduce((sum, p) => sum + p.rent, 0) / properties.length).toLocaleString() : '0'}
              </p>
              <p className="text-xs text-muted-foreground">
                Per month
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <PoundSterling className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-1">
                Tenancies Ending Soon
              </p>
              <p className="text-2xl font-semibold text-orange-600">
                {propertiesEndingSoonCount}
              </p>
              <p className="text-xs text-muted-foreground">
                Within 90 days
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-1">
                Overdue Rent
              </p>
              <p className="text-2xl font-semibold text-red-600">
                {propertiesOverdueRentCount}
              </p>
              <p className="text-xs text-muted-foreground">
                £{totalOverdueRentAmount.toLocaleString()} outstanding
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-orange-800">
                {selectedProperties.size} property{selectedProperties.size !== 1 ? 'ies' : ''} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-orange-600 hover:text-orange-800"
              >
                Clear selection
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDuplicate}
                disabled={!onDuplicateProperty}
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!onExportProperties}
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkExport('json')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkExport('excel')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkExport('csv')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkExport('pdf')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {ENABLE_IMPORT_PROPERTIES && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImportDialog(true)}
                  disabled={!handleImportProperties}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkArchive}
                disabled={!onArchiveProperty}
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={!onDeleteProperty}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-white border border-[#f3f3f3] rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAllProperties}
              className="p-2"
            >
              {isAllSelected ? (
                <CheckSquare className="h-4 w-4" />
              ) : isPartiallySelected ? (
                <CheckSquare className="h-4 w-4 opacity-50" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </Button>
            <span className="text-sm text-muted-foreground">
              {isAllSelected ? 'Deselect All' : 'Select All'}
            </span>
          </div>
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none"
              style={{
                '--tw-ring-color': '#8FCDFF',
                '--tw-ring-opacity': '0.5'
              } as React.CSSProperties}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="vacant">Vacant</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="under-renovation">Under Renovation</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {getPropertyTypes().map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Additional Filters Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-white border border-[#f3f3f3] rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Additional Filters:</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="overdue-rent-filter"
              checked={overdueRentFilter}
              onChange={(e) => setOverdueRentFilter(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <label htmlFor="overdue-rent-filter" className="text-sm text-muted-foreground cursor-pointer">
              Overdue Rent Only
            </label>
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
              <SelectItem value="no-lease">No Lease (Vacant)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="rent-asc">Rent: Low to High</SelectItem>
              <SelectItem value="rent-desc">Rent: High to Low</SelectItem>
              <SelectItem value="lease-expiry-asc">Lease Expiry: Soonest First</SelectItem>
              <SelectItem value="lease-expiry-desc">Lease Expiry: Latest First</SelectItem>
              <SelectItem value="address-asc">Address: A to Z</SelectItem>
              <SelectItem value="address-desc">Address: Z to A</SelectItem>
              <SelectItem value="overdue-desc">Overdue Amount: Highest First</SelectItem>
              <SelectItem value="overdue-asc">Overdue Amount: Lowest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Properties Grid */}
      {!userProfile && onSignIn ? (
        <Card>
          <CardContent className="p-0">
            <LandlordEmptyState onSignIn={onSignIn} />
          </CardContent>
        </Card>
      ) : filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2" style={{ color: '#374957' }}>No properties found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'Get started by adding your first property'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
              <Button 
                onClick={onAddProperty} 
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
                <span>Add Property</span>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => {
            const compliance = getComplianceStatus(property);
            const coverPhoto = property.photos.find(photo => photo.isCover);
            const tenant = getTenantForProperty(property.id);
            const arrears = tenant ? getArrearsForTenant(tenant.id) : null;
            const derivedStatus = tenant ? 'occupied' : property.status;
            
            return (
              <Card key={property.id} className="overflow-hidden">
                <CardHeader className="p-0">
                  {coverPhoto ? (
                    <div className="aspect-video bg-muted">
                      <img
                        src={coverPhoto.url}
                        alt={property.address}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePropertySelection(property.id)}
                        className="p-1 h-auto mt-1"
                      >
                        {selectedProperties.has(property.id) ? (
                          <CheckSquare className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate" style={{ color: '#374957' }}>{property.address}</h3>
                        <p className="text-sm text-muted-foreground">{property.type}</p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                        <DropdownMenuItem 
                          onClick={() => onDeleteProperty?.(property)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Property
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BedSingle className="h-4 w-4" />
                        <span>{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
                      </div>
                      {typeof (property as any).bathrooms === 'number' && (
                        <div className="flex items-center gap-1">
                          <span>{(property as any).bathrooms} bath{(property as any).bathrooms !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {typeof (property as any).squareFootage === 'number' && (
                        <div className="flex items-center gap-1">
                          <span>{(property as any).squareFootage} sq ft</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span>£{property.rent.toLocaleString()}/mo</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getStatusColor(derivedStatus as any)}>
                        {formatStatus(derivedStatus as any)}
                      </Badge>
                      
                      <Badge className={getComplianceColor(compliance.status)}>
                        {compliance.status === 'expired' && `${compliance.count} Expired`}
                        {compliance.status === 'expiring-soon' && `${compliance.count} Expiring`}
                        {compliance.status === 'compliant' && 'Compliant'}
                      </Badge>

                      {arrears && (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Arrears
                        </Badge>
                      )}
                    </div>

                    {/* Tenant Information */}
                    {tenant && (
                      <div className="mt-3 p-2 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{tenant.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewTenant(tenant)}
                            className="h-6 px-2 text-xs"
                          >
                            View
                          </Button>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Lease ends: {tenant.leaseEnd.toLocaleDateString('en-GB')}
                        </div>
                        {arrears && (
                          <div className="mt-1 text-xs text-red-600 flex items-center">
                            <PoundSterling className="h-3 w-3 mr-1" />
                            £{arrears.overdueAmount.toLocaleString()} overdue ({arrears.daysPastDue} days)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => onViewProperty(property)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => onEditProperty(property)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {ENABLE_IMPORT_PROPERTIES && (
        <ImportPropertiesDialog
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImport={handleImportPropertiesSubmit}
        />
      )}
    </div>
  );
}