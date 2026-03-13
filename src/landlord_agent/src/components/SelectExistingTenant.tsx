import React, { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ArrowLeft, Search, Users, Home, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';
import { Property, Tenant } from '../App';
import { tenantService } from '../services/tenantService';
import { trackEvent } from '../../../utils/analytics';
import axios from 'axios';

interface AzureUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  givenName: string;
  surname: string;
  createdAt?: string;
  azureObjectId: string;
  userPrincipalName: string;
}

interface SelectExistingTenantProps {
  properties: Property[];
  existingTenants: Tenant[];
  onBack: () => void;
  onSuccess: () => void;
  userId?: string;
}

export function SelectExistingTenant({ properties, existingTenants, onBack, onSuccess, userId }: SelectExistingTenantProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [azureUsers, setAzureUsers] = useState<AzureUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Azure AD B2C users
  useEffect(() => {
    const fetchAzureUsers = async () => {
      setIsLoadingUsers(true);
      setError(null);
      try {
        // Determine API base URL - same pattern as InviteTenant for consistency
        const getApiBaseUrl = () => {
          if (import.meta.env.VITE_API_URL) {
            return import.meta.env.VITE_API_URL;
          }
          const hostname = window.location.hostname;
          if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000';
          }
          return 'https://proptii-r11a-production-0c93.up.railway.app';
        };

        const API_BASE_URL = getApiBaseUrl();
        const endpoint = `${API_BASE_URL}/api/azure-users`;
        
        console.log('🔍 Fetching Azure AD B2C users from:', endpoint);
        if (searchTerm) {
          console.log('🔎 Search term:', searchTerm);
        }
        
        const response = await axios.get(endpoint, {
          params: searchTerm ? { search: searchTerm } : {},
          timeout: 30000 // 30 second timeout
        });

        console.log('📋 Response received:', response.data);

        if (response.data.success) {
          setAzureUsers(response.data.users || []);
          console.log(`✅ Successfully loaded ${response.data.users?.length || 0} users`);
        } else {
          throw new Error(response.data.error || 'Failed to fetch users');
        }
      } catch (err: any) {
        console.error('❌ Error fetching Azure AD B2C users:', err);
        
        let errorMessage = 'Failed to load users from Azure AD B2C';
        
        if (axios.isAxiosError(err)) {
          if (err.code === 'ECONNREFUSED') {
            errorMessage = 'Cannot connect to backend server. Please ensure the backend is running on port 3000.';
          } else if (err.code === 'ETIMEDOUT') {
            errorMessage = 'Request timed out. Please check your connection and try again.';
          } else if (err.response?.status === 500) {
            const errorData = err.response?.data;
            if (errorData?.error?.includes('not configured')) {
              errorMessage = 'Azure AD B2C is not configured on the backend. Please check the backend environment variables.';
            } else {
              errorMessage = errorData?.error || 'Server error while fetching users. Check backend logs.';
            }
          } else if (err.response?.data?.error) {
            errorMessage = err.response.data.error;
          } else if (err.message) {
            errorMessage = err.message;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        console.error('💡 Error details:', {
          message: errorMessage,
          code: err.code,
          status: err.response?.status,
          data: err.response?.data
        });
        
        setError(errorMessage);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchAzureUsers();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Get current user ID
  const getCurrentUserId = (): string => {
    try {
      if (userId) return userId;
      
      // Try to get from localStorage
      const cached = localStorage.getItem('proptii_auth_state');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed?.user?.id || parsed?.user?.localAccountId || parsed?.user?.homeAccountId || '';
      }
      
      return '';
    } catch (e) {
      console.error('Error extracting userId:', e);
      return '';
    }
  };

  const handleAssignTenant = async () => {
    if (!selectedUserId || !selectedPropertyId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const selectedUser = azureUsers.find(u => u.id === selectedUserId);
      const selectedProperty = properties.find(p => p.id === selectedPropertyId);
      
      if (!selectedUser || !selectedProperty) {
        throw new Error('Selected user or property not found');
      }

      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        throw new Error('User ID not found. Please log in again.');
      }

      // Create tenant in Firestore from Azure AD B2C user
      const tenantData: Omit<Tenant, 'id'> = {
        name: selectedUser.name,
        email: selectedUser.email,
        phone: selectedUser.phone || '',
        propertyId: selectedProperty.id,
        propertyAddress: selectedProperty.address,
        rentAmount: 0, // Will be set later
        paymentFrequency: 'monthly',
        firstPaymentDate: new Date(),
        leaseStart: new Date(),
        leaseEnd: new Date(),
        status: 'active',
        referencingStatus: 'not-started',
        paymentStatus: 'up-to-date',
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        defaultRiskScore: 75,
        // Store Azure AD B2C reference
        azureObjectId: selectedUser.azureObjectId,
        userPrincipalName: selectedUser.userPrincipalName
      };

      // Create tenant in Firestore
      const tenantId = await tenantService.createTenant(tenantData, currentUserId);
      trackEvent('landlord_tenant_assigned', { property_address: selectedProperty.address });
      console.log('✅ Tenant created in Firestore:', tenantId);
      
      setIsSuccess(true);
      
      // Auto redirect after 3 seconds
      setTimeout(() => {
        onSuccess();
      }, 3000);
      
    } catch (error: any) {
      console.error('Failed to assign tenant:', error);
      setError(error.message || 'Failed to assign tenant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedUser = azureUsers.find(u => u.id === selectedUserId);
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

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
              <strong>{selectedUser?.name}</strong> has been created as a tenant and assigned to <strong>{selectedProperty?.address}</strong>
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
              src="/images/proptii-logo.png" 
              alt="Proptii Logo" 
              className="h-8 w-auto"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#D1FAE5' }}>
                <Users className="w-8 h-8" style={{ color: '#10B981' }} />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4" style={{ color: '#374957' }}>
              Select a tenant from our existing users
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose a user from our directory and assign them as a tenant to a property
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Information Note */}
            <Card className="mb-6 bg-blue-50 rounded-xl border border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#136C9E' }}>
                      <Info className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
                      Additional Details Required
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
                      After assigning a tenant to a property, you'll need to add other relevant details like phone number, lease duration, and payment information later. This step only creates the basic tenant assignment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search and Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Search & Filter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search Tenants</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="search"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none"
                        style={{
                          '--tw-ring-color': '#8FCDFF',
                          '--tw-ring-opacity': '0.5'
                        } as React.CSSProperties}
                      />
                      {isLoadingUsers && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                      )}
                    </div>
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

            {/* Error Message */}
            {error && (
              <Card className="mb-6 bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 mb-1">Error Loading Users</h3>
                      <p className="text-red-800 text-sm mb-2">{error}</p>
                      {error.includes('not configured') && (
                        <div className="mt-3 p-3 bg-red-100 rounded border border-red-300">
                          <p className="text-red-900 text-xs font-semibold mb-2">💡 Backend Configuration Required:</p>
                          <ol className="text-red-800 text-xs list-decimal list-inside space-y-1">
                            <li>Add to <code className="bg-red-200 px-1 rounded">proptii-backend/.env</code>:</li>
                          </ol>
                          <pre className="mt-2 text-xs bg-red-200 p-2 rounded overflow-x-auto">
AZURE_AD_B2C_CLIENT_ID=your-client-id
AZURE_AD_B2C_CLIENT_SECRET=your-client-secret
AZURE_AD_B2C_TENANT_ID=your-tenant.onmicrosoft.com</pre>
                          <p className="text-red-800 text-xs mt-2">Then restart the backend server.</p>
                        </div>
                      )}
                      {error.includes('backend') && (
                        <p className="text-red-600 text-xs mt-2">
                          💡 <strong>Troubleshooting:</strong> Ensure the backend server is running on the correct port and is accessible.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Azure AD B2C Users List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Available Users ({azureUsers.length})</span>
                  {selectedUser && selectedProperty && (
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
                {isLoadingUsers && azureUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-500">Loading users from Azure AD B2C...</p>
                  </div>
                ) : azureUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No users found in Azure AD B2C</p>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting your search</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {azureUsers.map((user) => (
                      <Card
                        key={user.id}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedUserId === user.id 
                            ? 'ring-2 ring-orange-500 shadow-lg' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start space-x-4 flex-1 min-w-0">
                              <Avatar className="h-12 w-12 flex-shrink-0">
                                <AvatarFallback>
                                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg mb-2" style={{ color: '#374957' }}>
                                  {user.name}
                                </h3>
                                <p 
                                  className="text-gray-600 text-sm" 
                                  title={user.email}
                                  style={{ 
                                    wordBreak: 'break-word', 
                                    overflowWrap: 'anywhere',
                                    whiteSpace: 'normal',
                                    lineHeight: '1.5',
                                    maxWidth: '100%'
                                  }}
                                >
                                  <span className="font-medium">Email:</span> <span style={{ wordBreak: 'break-all' }}>{user.email}</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 flex-shrink-0">
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                Azure AD B2C
                              </Badge>
                              {selectedUserId === user.id && (
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
            {selectedUser && selectedProperty && (
              <Card className="mt-6 bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-blue-900 mb-2">Assignment Preview</h3>
                      <p className="text-blue-800 text-sm">
                        <strong>{selectedUser.name}</strong> will be created as a tenant and assigned to <strong>{selectedProperty.address}</strong>
                      </p>
                      <p className="text-blue-700 text-xs mt-1">
                        A tenant record will be created in Firestore and linked to this property.
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
              {selectedUser && selectedProperty && (
                <Button 
                  onClick={handleAssignTenant}
                  disabled={isLoading}
                  className="px-8"
                  style={{ backgroundColor: '#DC5F12', borderColor: '#DC5F12' }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating Tenant...
                    </>
                  ) : (
                    <>
                      <Home className="w-4 h-4 mr-2" />
                      Create Tenant & Assign to Property
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
