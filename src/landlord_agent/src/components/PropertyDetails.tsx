import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ArrowLeft, 
  Edit3, 
  MapPin, 
  BedDouble, 
  PoundSterling,
  Calendar,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle,
  Clock,
  Archive,
  MoreHorizontal,
  BarChart3,
  User,
  UserPlus,
  Mail,
  Phone,
  Eye,
  X,
  UserX,
  UserCheck
} from 'lucide-react';
import { Property, Tenant } from '../App';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { ShortletCalendar } from './ShortletCalendar';
import { ProvisioningChecklist } from './ProvisioningChecklist';
import { PricingRules } from './PricingRules';
import { AddGuest } from './AddGuest';
import { Guest } from '../App';

interface PropertyDetailsProps {
  property: Property | null;
  tenants?: Tenant[];
  onBack: () => void;
  onEdit: (property: Property) => void;
  onEditPropertyDetails?: (property: Property) => void;
  onManageDocuments: () => void;
  onManagePhotos: () => void;
  onViewInsights: () => void;
  updateProperty: (propertyId: string, updates: Partial<Property>) => void;
  onViewTenant?: (tenantId: string) => void;
  onAddTenant?: () => void;
  onSelectExistingTenant?: (tenantId: string) => void;
  onRemoveTenant?: (tenantId: string, propertyId: string) => void;
  onChangeTenant?: (propertyId: string, newTenantId: string) => void;
}

export function PropertyDetails({
  property,
  tenants = [],
  onBack,
  onEdit,
  onEditPropertyDetails,
  onManageDocuments,
  onManagePhotos,
  onViewInsights,
  updateProperty,
  onViewTenant,
  onAddTenant,
  onSelectExistingTenant,
  onRemoveTenant,
  onChangeTenant
}: PropertyDetailsProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showChangeTenantDialog, setShowChangeTenantDialog] = useState(false);
  const [selectedNewTenantId, setSelectedNewTenantId] = useState<string>('');
  const isForSale = !!(property as any)?.isForSale;
  const [saleToggleChecked, setSaleToggleChecked] = useState(isForSale);
  const [showSaleOnDialog, setShowSaleOnDialog] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  
  // Property mode (long-term vs shortlet)
  const propertyMode = property?.propertyMode || 'long-term';
  const isShortlet = propertyMode === 'shortlet';

  React.useEffect(() => {
    setSaleToggleChecked(isForSale);
  }, [isForSale, property?.id]);

  // Filter tenants to only show those without a property assigned or with different property
  const availableTenants = useMemo(() => {
    return tenants.filter(tenant => !tenant.propertyId || tenant.propertyId === '' || tenant.propertyId !== property?.id);
  }, [tenants, property?.id]);

  // Include current tenant in available list for swapping
  const allAvailableTenants = useMemo(() => {
    const otherTenants = tenants.filter(tenant => !tenant.propertyId || tenant.propertyId === '' || tenant.propertyId !== property?.id);
    // Also include the current tenant if there is one
    if (property?.tenant) {
      return [property.tenant, ...otherTenants];
    }
    return otherTenants;
  }, [tenants, property?.id, property?.tenant]);

  // Memoize formatted dates to prevent excessive re-renders
  const formattedDates = useMemo(() => {
    if (!property) return {};
    
    try {
      return {
        createdAt: property.createdAt.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        leaseEnd: property.tenant?.leaseEnd ? property.tenant.leaseEnd.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }) : '',
        lastPaymentDate: property.tenant?.lastPaymentDate ? property.tenant.lastPaymentDate.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }) : '',
        documentDates: property.documents.reduce((acc, doc) => {
          try {
            acc[doc.id] = {
              issue: doc.issueDate.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }),
              expiry: doc.expiryDate ? doc.expiryDate.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }) : null
            };
          } catch (error) {
            console.warn('Error formatting document date:', error);
            acc[doc.id] = {
              issue: 'Invalid date',
              expiry: null
            };
          }
          return acc;
        }, {} as Record<string, { issue: string; expiry: string | null }>)
      };
    } catch (error) {
      console.warn('Error formatting dates in PropertyDetails:', error);
      return {
        createdAt: '',
        leaseEnd: '',
        lastPaymentDate: '',
        documentDates: {}
      };
    }
  }, [property]);

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4">Property not found</h2>
          <Button onClick={onBack}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: Property['status']) => {
    switch (status) {
      case 'occupied': return 'bg-green-500';
      case 'vacant': return 'bg-red-500';
      case 'under-renovation': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Property['status']) => {
    switch (status) {
      case 'occupied': return 'Occupied';
      case 'vacant': return 'Vacant';
      case 'under-renovation': return 'Under Renovation';
      default: return status;
    }
  };

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'expiring-soon':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'epc': 'EPC Certificate',
      'gas-cert': 'Gas Safety Certificate',
      'tenancy-agreement': 'Tenancy Agreement',
      'insurance': 'Insurance Policy',
      'other': 'Other Document'
    };
    return labels[type] || type;
  };

  const archiveProperty = () => {
    updateProperty(property.id, { status: 'under-renovation' });
  };

  const getTenureLabel = (value?: string) => {
    const labels: Record<string, string> = {
      'freehold': 'Freehold',
      'leasehold': 'Leasehold',
      'share-of-freehold': 'Share of Freehold',
      'commonhold': 'Commonhold',
      'other': 'Other'
    };
    if (!value) return 'Not provided';
    return labels[value] || value;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="mb-1">{property.address}</h1>
                <div className="flex items-center space-x-3">
                  <Badge className={`${isForSale ? 'bg-blue-600' : getStatusColor(property.status)} text-white border-0`}>
                    {isForSale ? 'For Sale' : getStatusText(property.status)}
                  </Badge>
                  <span className="text-muted-foreground">
                    {property.type} • {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}
                    {typeof (property as any).bathrooms === 'number' && ` • ${(property as any).bathrooms} bath${(property as any).bathrooms !== 1 ? 's' : ''}`}
                    {typeof (property as any).squareFootage === 'number' && ` • ${(property as any).squareFootage} sq ft`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => onEdit(property)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="p-2">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={archiveProperty}>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive Property
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Photos */}
            <Card className="overflow-hidden">
              {property.photos.length > 0 ? (
                <div>
                  <div className="aspect-[16/10] relative overflow-hidden">
                    <img
                      src={property.photos[currentPhotoIndex]?.url}
                      alt="Property"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentPhotoIndex + 1} / {property.photos.length}
                    </div>
                  </div>
                  
                  {property.photos.length > 1 && (
                    <div className="p-4 bg-muted/50">
                      <div className="grid grid-cols-6 gap-2">
                        {property.photos.map((photo, index) => (
                          <button
                            key={photo.id}
                            className={`aspect-video rounded overflow-hidden ${
                              index === currentPhotoIndex ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => setCurrentPhotoIndex(index)}
                          >
                            <img
                              src={photo.url}
                              alt={photo.room || 'Property'}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[16/10] bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No photos uploaded</p>
                    <Button variant="outline" onClick={onManagePhotos}>
                      Add Photos
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Property Information */}
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                {isShortlet && <TabsTrigger value="calendar">Calendar</TabsTrigger>}
                {isShortlet && <TabsTrigger value="provisioning">Provisioning</TabsTrigger>}
                {isShortlet && <TabsTrigger value="pricing">Pricing Rules</TabsTrigger>}
                <TabsTrigger value="documents">
                  Documents
                  {property.documents.some(d => d.status === 'expiring-soon' || d.status === 'expired') && (
                    <Badge variant="destructive" className="ml-2 px-1 text-xs">
                      {property.documents.filter(d => d.status === 'expiring-soon' || d.status === 'expired').length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="photos">Photos ({property.photos.length})</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="mb-2">Basic Information</h3>
                        <div className="space-y-2">
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-2" />
                            {property.address}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <BedDouble className="w-4 h-4 mr-2" />
                            {property.bedrooms} bedroom{property.bedrooms !== 1 ? 's' : ''}
                          </div>
                          {typeof (property as any).bathrooms === 'number' && (
                            <div className="flex items-center text-muted-foreground">
                              <BedDouble className="w-4 h-4 mr-2" />
                              {(property as any).bathrooms} bathroom{(property as any).bathrooms !== 1 ? 's' : ''}
                            </div>
                          )}
                          {typeof (property as any).squareFootage === 'number' && (
                            <div className="flex items-center text-muted-foreground">
                              <BedDouble className="w-4 h-4 mr-2" />
                              {(property as any).squareFootage} sq ft
                            </div>
                          )}
                          <div className="flex items-center text-muted-foreground">
                            <PoundSterling className="w-4 h-4 mr-2" />
                            £{property.rent.toLocaleString()} per month
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-2" />
                            Added {formattedDates.createdAt}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {property.amenities.length > 0 && (
                        <div>
                          <h3 className="mb-2">Amenities</h3>
                          <div className="flex flex-wrap gap-2">
                            {property.amenities.map((amenity) => (
                              <Badge key={amenity} variant="secondary">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {property.notes && (
                        <div>
                          <h3 className="mb-2">Notes</h3>
                          <p className="text-muted-foreground">{property.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3>Property Documents</h3>
                    <Button onClick={onManageDocuments}>
                      <FileText className="w-4 h-4 mr-2" />
                      Manage Documents
                    </Button>
                  </div>

                  {property.documents.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No documents uploaded</p>
                      <Button variant="outline" onClick={onManageDocuments}>
                        Upload Documents
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {property.documents.map((document) => (
                        <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getDocumentStatusIcon(document.status)}
                            <div>
                              <p className="font-medium">{document.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {getDocumentTypeLabel(document.type)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm">
                              Issued: {formattedDates.documentDates[document.id]?.issue || 'Unknown'}
                            </p>
                            {document.expiryDate && (
                              <p className="text-sm text-muted-foreground">
                                Expires: {formattedDates.documentDates[document.id]?.expiry || 'Unknown'}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="photos">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3>Property Photos</h3>
                    <Button onClick={onManagePhotos}>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Manage Photos
                    </Button>
                  </div>

                  {property.photos.length === 0 ? (
                    <div className="text-center py-8">
                      <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No photos uploaded</p>
                      <Button variant="outline" onClick={onManagePhotos}>
                        Add Photos
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {property.photos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <div className="aspect-video rounded-lg overflow-hidden">
                            <img
                              src={photo.url}
                              alt={photo.room || 'Property'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          {photo.room && (
                            <Badge 
                              variant="secondary" 
                              className="absolute bottom-2 left-2 text-xs"
                            >
                              {photo.room}
                            </Badge>
                          )}
                          {photo.isCover && (
                            <Badge 
                              className="absolute top-2 right-2 bg-primary text-xs"
                            >
                              Cover
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="insights">
                <Card className="p-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="mb-2">AI-Powered Property Insights</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Get detailed market analysis, demographic insights, and AI recommendations for this property
                    </p>
                    <Button onClick={onViewInsights} size="lg">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Detailed Insights
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* Shortlet-specific tabs */}
              {isShortlet && (
                <>
                  <TabsContent value="calendar">
                    <ShortletCalendar
                      calendarDates={property.calendarDates || []}
                      onDatesChange={(dates) => updateProperty(property.id, { calendarDates: dates })}
                      basePrice={property.nightlyRate}
                    />
                  </TabsContent>

                  <TabsContent value="provisioning">
                    <ProvisioningChecklist
                      tasks={property.provisioningChecklist || []}
                      onTasksChange={(tasks) => updateProperty(property.id, { provisioningChecklist: tasks })}
                    />
                  </TabsContent>

                  <TabsContent value="pricing">
                    <PricingRules
                      rules={property.pricingRules || []}
                      onRulesChange={(rules) => updateProperty(property.id, { pricingRules: rules })}
                      basePrice={property.nightlyRate || 0}
                    />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => onEdit(property)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Property
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={onManageDocuments}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Manage Documents
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={onManagePhotos}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Manage Photos
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={onViewInsights}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Insights
                </Button>

                <div className="pt-3 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Mark for sale</Label>
                    <Switch
                      checked={saleToggleChecked}
                      onCheckedChange={(checked) => {
                        setSaleToggleChecked(checked);
                        updateProperty(property.id, { isForSale: checked });
                        if (checked && !isForSale) {
                          setShowSaleOnDialog(true);
                        }
                      }}
                      aria-label="Mark property for sale"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Property Mode</Label>
                    <Select
                      value={propertyMode}
                      onValueChange={(value: 'long-term' | 'shortlet') => {
                        updateProperty(property.id, { propertyMode: value });
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="long-term">Long-term</SelectItem>
                        <SelectItem value="shortlet">Shortlet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Shortlet Settings */}
            {isShortlet && (
              <Card className="p-6">
                <h3 className="mb-4">Shortlet Settings</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Nightly Rate</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2">£</span>
                      <Input
                        type="number"
                        value={property.nightlyRate || ''}
                        onChange={(e) => updateProperty(property.id, { nightlyRate: parseFloat(e.target.value) || undefined })}
                        className="pl-8"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Min Stay (nights)</Label>
                      <Input
                        type="number"
                        value={property.minStay || ''}
                        onChange={(e) => updateProperty(property.id, { minStay: parseInt(e.target.value) || undefined })}
                        className="mt-1"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Max Stay (nights)</Label>
                      <Input
                        type="number"
                        value={property.maxStay || ''}
                        onChange={(e) => updateProperty(property.id, { maxStay: parseInt(e.target.value) || undefined })}
                        className="mt-1"
                        placeholder="365"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Current Guest (Shortlet) */}
            {isShortlet && !isForSale && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Current Guest</h3>
                  {property.currentGuest ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingGuest(property.currentGuest!);
                        setShowAddGuest(true);
                      }}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingGuest(null);
                        setShowAddGuest(true);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Guest
                    </Button>
                  )}
                </div>
                
                {property.currentGuest ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {property.currentGuest.name?.split(' ').map(n => n?.[0]).join('') || 'G'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{property.currentGuest.name}</p>
                        {property.currentGuest.numberOfGuests && (
                          <p className="text-sm text-muted-foreground">
                            {property.currentGuest.numberOfGuests} guest{property.currentGuest.numberOfGuests !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {property.currentGuest.email && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="w-4 h-4 mr-2" />
                          <span className="truncate">{property.currentGuest.email}</span>
                        </div>
                      )}
                      {property.currentGuest.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="w-4 h-4 mr-2" />
                          {property.currentGuest.phone}
                        </div>
                      )}
                      {property.currentGuest.checkIn && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          Check-in: {new Date(property.currentGuest.checkIn).toLocaleDateString('en-GB')}
                        </div>
                      )}
                      {property.currentGuest.checkOut && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          Check-out: {new Date(property.currentGuest.checkOut).toLocaleDateString('en-GB')}
                        </div>
                      )}
                      {property.currentGuest.emergencyContact && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-700 mb-1">Emergency Contact</p>
                          <p className="text-sm">{property.currentGuest.emergencyContact.name}</p>
                          <p className="text-xs text-muted-foreground">{property.currentGuest.emergencyContact.phone}</p>
                          {property.currentGuest.emergencyContact.relationship && (
                            <p className="text-xs text-muted-foreground">{property.currentGuest.emergencyContact.relationship}</p>
                          )}
                        </div>
                      )}
                      {property.currentGuest.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <p className="text-gray-700">{property.currentGuest.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                        onClick={() => {
                          if (window.confirm('Remove current guest?')) {
                            updateProperty(property.id, { currentGuest: undefined });
                          }
                        }}
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Remove Guest
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-2">No guest assigned</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add guest information for this stay
                    </p>
                    <Button onClick={() => {
                      setEditingGuest(null);
                      setShowAddGuest(true);
                    }}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Guest
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* Add/Edit Guest Dialog */}
            {property && (
              <AddGuest
                isOpen={showAddGuest}
                propertyAddress={property.address}
                initialGuest={editingGuest}
                onSave={(guest) => {
                  updateProperty(property.id, { currentGuest: guest });
                  setShowAddGuest(false);
                  setEditingGuest(null);
                }}
                onCancel={() => {
                  setShowAddGuest(false);
                  setEditingGuest(null);
                }}
              />
            )}

            <Dialog open={showSaleOnDialog} onOpenChange={setShowSaleOnDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Marking this property for sale</DialogTitle>
                  <DialogDescription>
                    To list this property for sale, you’ll need to update the property details (tenure, ground rent, council tax band, service charge) and upload the required documents (EPC).
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setShowSaleOnDialog(false)}>
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setShowSaleOnDialog(false);
                      onEditPropertyDetails?.(property);
                    }}
                    style={{ backgroundColor: '#DC5F12' }}
                  >
                    Update property details
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Sale Details (replaces tenant section when For Sale) */}
            {isForSale && (
              <Card className="p-6">
                <h3 className="mb-4">Sale Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tenure</span>
                    <span>{getTenureLabel((property as any).tenureType)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Council tax band</span>
                    <span>{((property as any).councilTaxBand as string) || 'Not provided'}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ground rent (annual)</span>
                    <span>
                      {typeof (property as any).annualGroundRent === 'number'
                        ? `£${(property as any).annualGroundRent.toLocaleString()}`
                        : 'Not provided'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service charge (annual)</span>
                    <span>
                      {typeof (property as any).annualServiceCharge === 'number'
                        ? `£${(property as any).annualServiceCharge.toLocaleString()}`
                        : 'Not provided'}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Current Tenant (Long-term only) */}
            {!isForSale && !isShortlet && property.status === 'occupied' && property.tenant && (
              <Card className="p-6">
                <h3 className="mb-4">Current Tenant</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={property.tenant.avatar} />
                      <AvatarFallback>
                        {property.tenant.name?.split(' ').map(n => n?.[0]).join('') || 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{property.tenant.name || 'Unknown Tenant'}</p>
                      <div className="flex items-center space-x-1">
                        <Badge 
                          className={`text-xs ${
                            property.tenant.paymentStatus === 'current' ? 'bg-green-100 text-green-800' : 
                            property.tenant.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' : 
                            'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {property.tenant.paymentStatus === 'current' ? 'Payment Up-to-Date' : 
                           property.tenant.paymentStatus === 'overdue' ? 'Payment Overdue' : 'Payment Plan'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {property.tenant.email && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="truncate">{property.tenant.email}</span>
                      </div>
                    )}
                    {property.tenant.phone && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="w-4 h-4 mr-2" />
                        {property.tenant.phone}
                      </div>
                    )}
                    {property.tenant.rentAmount && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <PoundSterling className="w-4 h-4 mr-2" />
                        £{property.tenant.rentAmount.toLocaleString()} / month
                      </div>
                    )}
                    {formattedDates.leaseEnd && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        Lease until {formattedDates.leaseEnd}
                      </div>
                    )}
                  </div>

                  {property.tenant.paymentStatus === 'overdue' && property.tenant.overdueAmount && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                        <span className="text-sm font-medium text-red-800">
                          £{property.tenant.overdueAmount.toLocaleString()} overdue
                        </span>
                      </div>
                      {formattedDates.lastPaymentDate && (
                        <p className="text-xs text-red-600 mt-1">
                          Last payment: {formattedDates.lastPaymentDate}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    {onViewTenant && property.tenant.id && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => onViewTenant(property.tenant!.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Tenant Details
                      </Button>
                    )}
                    
                    <div className="flex gap-2">
                      {onChangeTenant && property.tenant.id && (
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setShowChangeTenantDialog(true)}
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Change Tenant
                        </Button>
                      )}
                      
                      {onRemoveTenant && property.tenant.id && (
                        <Button 
                          variant="outline" 
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove ${property.tenant?.name} from this property?`)) {
                              onRemoveTenant(property.tenant!.id, property.id);
                            }
                          }}
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {!isForSale && !isShortlet && property.status === 'vacant' && (
              <Card className="p-6">
                <h3 className="mb-4">Property Status</h3>
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">Property is vacant</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ready for new tenant
                  </p>
                  {onAddTenant && (
                    <Button onClick={onAddTenant} className="w-full mb-3">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Tenant
                    </Button>
                  )}
                  {availableTenants.length > 0 && onSelectExistingTenant && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground mb-2">Or select existing tenant</p>
                        <Select onValueChange={onSelectExistingTenant}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select existing tenant" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTenants.map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id}>
                                {tenant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )}

            {!isForSale && !isShortlet && property.status === 'under-renovation' && (
              <Card className="p-6">
                <h3 className="mb-4">Property Status</h3>
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="text-muted-foreground mb-2">Under renovation</p>
                  <p className="text-sm text-muted-foreground">
                    Not available for tenants
                  </p>
                </div>
              </Card>
            )}

            {/* Compliance Status */}
            <Card className="p-6">
              <h3 className="mb-4">Compliance Status</h3>
              <div className="space-y-3">
                {property.documents.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No documents uploaded. Upload compliance documents to track their status.
                  </p>
                ) : (
                  property.documents.map((document) => (
                    <div key={document.id} className="flex items-center justify-between">
                      <span className="text-sm">{getDocumentTypeLabel(document.type)}</span>
                      <div className="flex items-center space-x-2">
                        {getDocumentStatusIcon(document.status)}
                        <span className="text-xs text-muted-foreground capitalize">
                          {document.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Property Stats */}
            <Card className="p-6">
              <h3 className="mb-4">Property Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span>{property.type}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bedrooms</span>
                  <span>{property.bedrooms}</span>
                </div>
                <Separator />
                {typeof (property as any).bathrooms === 'number' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bathrooms</span>
                      <span>{(property as any).bathrooms}</span>
                    </div>
                    <Separator />
                  </>
                )}
                {typeof (property as any).squareFootage === 'number' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Square footage</span>
                      <span>{(property as any).squareFootage} sq ft</span>
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly rent</span>
                  <span>£{property.rent.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Photos</span>
                  <span>{property.photos.length}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Documents</span>
                  <span>{property.documents.length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Change Tenant Dialog */}
      <Dialog open={showChangeTenantDialog} onOpenChange={setShowChangeTenantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Tenant</DialogTitle>
            <DialogDescription>
              Select a new tenant to assign to this property. The current tenant will be removed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Select value={selectedNewTenantId} onValueChange={setSelectedNewTenantId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tenant" />
              </SelectTrigger>
              <SelectContent>
                {allAvailableTenants.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No available tenants
                  </div>
                ) : (
                  allAvailableTenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      <div className="flex items-center space-x-2">
                        <span>{tenant.name}</span>
                        {tenant.propertyId === property?.id && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            {selectedNewTenantId && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Selected Tenant:</p>
                <p className="text-sm text-muted-foreground">
                  {allAvailableTenants.find(t => t.id === selectedNewTenantId)?.name || 'Unknown'}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowChangeTenantDialog(false);
                setSelectedNewTenantId('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedNewTenantId && onChangeTenant) {
                  onChangeTenant(property!.id, selectedNewTenantId);
                  setShowChangeTenantDialog(false);
                  setSelectedNewTenantId('');
                }
              }}
              disabled={!selectedNewTenantId}
            >
              Change Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}