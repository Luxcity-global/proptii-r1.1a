import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ArrowLeft, Search, Users, Home, CheckCircle, AlertCircle } from 'lucide-react';
import { Property, Tenant } from '../types';

interface SelectExistingTenantProps {
  properties: Property[];
  existingTenants: Tenant[];
  onBack: () => void;
  onSuccess: () => void;
}

export function SelectExistingTenant({ properties, existingTenants, onBack, onSuccess }: SelectExistingTenantProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Filter tenants based on search and status
  const filteredTenants = useMemo(() => {
    return existingTenants.filter(tenant => {
      const matchesSearch = 
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [existingTenants, searchTerm, statusFilter]);

  const handleAssignTenant = async () => {
    if (!selectedTenantId || !selectedPropertyId) return;
    
    setIsLoading(true);
    
    try {
      // Mock assignment - in real implementation, this would update the database
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const selectedTenant = existingTenants.find(t => t.id === selectedTenantId);
      const selectedProperty = properties.find(p => p.id === selectedPropertyId);
      
      console.log('Assigning tenant to property:', {
        tenant: selectedTenant?.name,
        property: selectedProperty?.address
      });
      
      setIsSuccess(true);
      
      // Auto redirect after 3 seconds
      setTimeout(() => {
        onSuccess();
      }, 3000);
      
    } catch (error) {
      console.error('Failed to assign tenant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTenant = existingTenants.find(t => t.id === selectedTenantId);
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ended':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F7F7F7', fontFamily: 'Archivo, sans-serif' }}>
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#374957' }}>
              Tenant Assigned!
            </h2>
            <p className="text-gray-600 mb-6">
              <strong>{selectedTenant?.name}</strong> has been assigned to <strong>{selectedProperty?.address}</strong>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm text-blue-800">
                    A verification request has been sent to the tenant to confirm they are occupying this property.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Redirecting you back to the tenant list...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-4" style={{ backgroundColor: '#F7F7F7', fontFamily: 'Archivo, sans-serif' }}>
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 px-4 pt-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img 
              src="/src/assets/proptii_logo_large.png" 
              alt="Proptii Logo" 
              className="h-8 w-auto"
            />
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="rounded-full px-4 py-2">
              Questions?
            </Button>
            <Button variant="outline" className="rounded-full px-4 py-2">
              Save & exit
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#DC5F12' }}>
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4" style={{ color: '#374957' }}>
              Select Existing Tenant
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose an existing tenant from your database and assign them to a property
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Search and Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Search & Filter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search Tenants</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="search"
                        placeholder="Name, email, or property address..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status Filter</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="ended">Ended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="property">Assign to Property</Label>
                    <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tenant List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Available Tenants ({filteredTenants.length})</span>
                  {selectedTenant && selectedProperty && (
                    <Button 
                      onClick={handleAssignTenant}
                      disabled={isLoading}
                      className="px-6"
                      style={{ backgroundColor: '#DC5F12', borderColor: '#DC5F12' }}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <Home className="w-4 h-4 mr-2" />
                          Assign to Property
                        </>
                      )}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTenants.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tenants found matching your criteria</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTenants.map((tenant) => (
                      <Card
                        key={tenant.id}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedTenantId === tenant.id 
                            ? 'ring-2 ring-orange-500 shadow-lg' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedTenantId(tenant.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-12 w-12">
                                {tenant.avatar && <AvatarImage src={tenant.avatar} alt={tenant.name} />}
                                <AvatarFallback>
                                  {tenant.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-lg" style={{ color: '#374957' }}>
                                  {tenant.name}
                                </h3>
                                <p className="text-gray-600">{tenant.email}</p>
                                <p className="text-sm text-gray-500">{tenant.propertyAddress}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Badge className={getStatusColor(tenant.status)}>
                                {tenant.status}
                              </Badge>
                              {selectedTenantId === tenant.id && (
                                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignment Preview */}
            {selectedTenant && selectedProperty && (
              <Card className="mt-6 bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-blue-900 mb-2">Assignment Preview</h3>
                      <p className="text-blue-800 text-sm">
                        <strong>{selectedTenant.name}</strong> will be assigned to <strong>{selectedProperty.address}</strong>
                      </p>
                      <p className="text-blue-700 text-xs mt-1">
                        A verification request will be sent to confirm the tenant is occupying this property.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
              {selectedTenant && selectedProperty && (
                <Button 
                  onClick={handleAssignTenant}
                  disabled={isLoading}
                  className="px-8"
                  style={{ backgroundColor: '#DC5F12', borderColor: '#DC5F12' }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Home className="w-4 h-4 mr-2" />
                      Assign Tenant to Property
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelectExistingTenant;
