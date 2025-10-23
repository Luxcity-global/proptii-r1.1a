import React, { useState } from 'react';
import { Plus, Search, Filter, Eye, Edit, MoreHorizontal, MapPin, BedSingle, Building2, Camera, FileText, User, Users, AlertTriangle, PoundSterling, Trash2, Download, Upload, Archive, CheckSquare, Square, Copy, Star, StarOff, ChevronDown } from 'lucide-react';
import { ImportPropertiesDialog } from './ImportPropertiesDialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Property, Tenant, ArrearsAlert } from '../App';

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
}: PropertiesPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const filteredProperties = properties.filter((property) => {
    const matchesSearch = property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    const matchesType = typeFilter === 'all' || property.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

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
    return tenants.find(tenant => tenant.propertyId === propertyId);
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
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6" style={{ fontFamily: 'Archivo, sans-serif' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: '#374957', fontFamily: 'Archivo, sans-serif', fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Properties</h1>
          <p className="text-muted-foreground" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '1.125rem', fontWeight: '400' }}>
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
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            color: 'white'
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <Card className="p-6 bg-white" style={{ border: '1px solid #D1D5DB' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 flex-1">
              <div className="text-center">
                <p className="mb-1" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '0.875rem', fontWeight: '500', color: '#374957' }}>
                  Occupied
                </p>
                <p className="text-2xl font-semibold text-green-600" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '1.5rem', fontWeight: '600' }}>
                  {properties.filter(p => p.status === 'occupied').length}
                </p>
              </div>
              
              <div className="w-px h-12 bg-gray-200"></div>
              
              <div className="text-center">
                <p className="mb-1" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '0.875rem', fontWeight: '500', color: '#374957' }}>
                  Vacant
                </p>
                <p className="text-2xl font-semibold text-orange-600" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '1.5rem', fontWeight: '600' }}>
                  {properties.filter(p => p.status === 'vacant').length}
                </p>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white" style={{ border: '1px solid #D1D5DB' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '0.875rem', fontWeight: '500', color: '#374957' }}>
                Average Rent
              </p>
              <p className="text-2xl font-semibold" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '1.5rem', fontWeight: '600' }}>
                £{properties.length > 0 ? Math.round(properties.reduce((sum, p) => sum + p.rent, 0) / properties.length).toLocaleString() : '0'}
              </p>
              <p className="text-xs" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '0.75rem', fontWeight: '400', color: '#374957' }}>
                Per month
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <PoundSterling className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white" style={{ border: '1px solid #D1D5DB' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '0.875rem', fontWeight: '500', color: '#374957' }}>
                Under Renovation
              </p>
              <p className="text-2xl font-semibold text-yellow-600" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '1.5rem', fontWeight: '600' }}>
                {properties.filter(p => p.status === 'under-renovation').length}
              </p>
              <p className="text-xs" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '0.75rem', fontWeight: '400', color: '#374957' }}>
                Properties
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white" style={{ border: '1px solid #D1D5DB' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '0.875rem', fontWeight: '500', color: '#374957' }}>
                Compliance Issues
              </p>
              <p className="text-2xl font-semibold text-red-600" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '1.5rem', fontWeight: '600' }}>
                {properties.reduce((count, p) => 
                  count + p.documents.filter(d => d.status === 'expiring-soon' || d.status === 'expired').length, 0
                )}
              </p>
              <p className="text-xs" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '0.75rem', fontWeight: '400', color: '#374957' }}>
                Documents need attention
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

      {/* Custom Filter Bar */}
      <div className="bg-white rounded-xl p-6 mb-6" style={{ border: '1px solid #E5E7EB' }}>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Select All Checkbox */}
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
            <span className="text-sm" style={{ color: '#374957' }}>
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </span>
        </div>
        
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search properties by address or type..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-[#f3f3f3] placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#8FCDFF] focus:border-[#8FCDFF] text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <div className="relative">
              <button
                type="button"
                className="block w-full px-4 py-2 pr-8 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-[#8FCDFF] focus:border-[#8FCDFF] text-left text-sm text-[#374957]"
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              >
                {statusFilter === 'all' ? 'All Status' : 
                 statusFilter === 'occupied' ? 'Occupied' :
                 statusFilter === 'vacant' ? 'Vacant' : 'Under Renovation'}
              </button>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {statusDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                  <div className="py-1">
                    <button
                      className="block w-full px-4 py-2 text-left text-sm text-[#374957] hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                      onClick={() => { setStatusFilter('all'); setStatusDropdownOpen(false); }}
                    >
                      All Status
                    </button>
                    <button
                      className="block w-full px-4 py-2 text-left text-sm text-[#374957] hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                      onClick={() => { setStatusFilter('occupied'); setStatusDropdownOpen(false); }}
                    >
                      Occupied
                    </button>
                    <button
                      className="block w-full px-4 py-2 text-left text-sm text-[#374957] hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                      onClick={() => { setStatusFilter('vacant'); setStatusDropdownOpen(false); }}
                    >
                      Vacant
                    </button>
                    <button
                      className="block w-full px-4 py-2 text-left text-sm text-[#374957] hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                      onClick={() => { setStatusFilter('under-renovation'); setStatusDropdownOpen(false); }}
                    >
                      Under Renovation
                    </button>
                  </div>
                </div>
              )}
            </div>
        </div>
        
          {/* Type Filter */}
          <div className="lg:w-48">
            <div className="relative">
              <button
                type="button"
                className="block w-full px-4 py-2 pr-8 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-[#8FCDFF] focus:border-[#8FCDFF] text-left text-sm text-[#374957]"
                onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
              >
                {typeFilter === 'all' ? 'All Types' : typeFilter}
              </button>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {typeDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                  <div className="py-1">
                    <button
                      className="block w-full px-4 py-2 text-left text-sm text-[#374957] hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                      onClick={() => { setTypeFilter('all'); setTypeDropdownOpen(false); }}
                    >
                      All Types
                    </button>
              {getPropertyTypes().map((type) => (
                      <button
                        key={type}
                        className="block w-full px-4 py-2 text-left text-sm text-[#374957] hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                        onClick={() => { setTypeFilter(type); setTypeDropdownOpen(false); }}
                      >
                  {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Import Button */}
          <div className="lg:w-auto">
            <button
              type="button"
              className="block w-full px-4 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-[#8FCDFF] focus:border-[#8FCDFF] text-left text-sm text-[#374957] hover:border-[#DC5F12] hover:text-[#DC5F12] transition-all flex items-center justify-center"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
            </button>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
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
            
            return (
              <Card key={property.id} className="overflow-hidden" style={{ borderColor: '#f2f2f2', borderWidth: '1px', backgroundColor: 'white' }}>
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
                        <p className="text-sm" style={{ color: '#374957' }}>{property.type}</p>
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
                    <div className="flex items-center gap-4 text-sm" style={{ color: '#374957' }}>
                      <div className="flex items-center gap-1">
                        <BedSingle className="h-4 w-4" />
                        <span>{property.bedrooms} bed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>£{property.rent.toLocaleString()}/mo</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getStatusColor(property.status)}>
                        {formatStatus(property.status)}
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
                            <span className="text-sm font-medium" style={{ color: '#374957' }}>{tenant.name}</span>
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
                        <div className="mt-1 text-xs" style={{ color: '#374957' }}>
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
                      className="flex-1 border-[#D1D5DB] text-[#374957] hover:border-[#DC5F12] hover:text-[#DC5F12] transition-all"
                      onClick={() => onViewProperty(property)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-[#D1D5DB] text-[#374957] hover:border-[#DC5F12] hover:text-[#DC5F12] transition-all"
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

      {/* Import Properties Dialog */}
      <ImportPropertiesDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImportPropertiesSubmit}
      />
    </div>
  );
}