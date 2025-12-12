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
  Eye
} from 'lucide-react';
import { Property } from '../App';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface PropertyPreviewProps {
  property: Property | null;
  onBack: () => void;
  onEdit: (property: Property) => void;
  onManageDocuments: () => void;
  onManagePhotos: () => void;
  updateProperty: (propertyId: string, updates: Partial<Property>) => void;
  onViewTenant?: (tenantId: string) => void;
  onPublishProperty?: () => void;
  onAddTenant?: () => void;
}

export function PropertyPreview({
  property,
  onBack,
  onEdit,
  onManageDocuments,
  onManagePhotos,
  updateProperty,
  onViewTenant,
  onPublishProperty,
  onAddTenant
}: PropertyPreviewProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  console.log('PropertyPreview rendered with property:', property);

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
      console.warn('Error formatting dates in PropertyPreview:', error);
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
                  <Badge className={`${getStatusColor(property.status)} text-white border-0`}>
                    {getStatusText(property.status)}
                  </Badge>
                  <span className="text-muted-foreground">
                    {property.type} • {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}
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
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
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
                
                <Button 
                  onClick={() => {
                    if (onPublishProperty) {
                      onPublishProperty();
                    } else {
                      console.log('Publishing property...');
                    }
                  }}
                  className="px-6 py-2 rounded-full transition-all duration-300" 
                  style={{ 
                    backgroundColor: '#DC5F12', 
                    borderColor: '#DC5F12', 
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
                  Publish Property
                </Button>
              </div>

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
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Detailed market analysis, demographic insights, and AI recommendations will be available soon
                    </p>
                  </div>
                </Card>
              </TabsContent>
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
              </div>
            </Card>


            {property.status === 'vacant' && (
              <Card className="p-6">
                <h3 className="mb-4">Property Status</h3>
                <div className="text-center py-6">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 cursor-pointer transition-all duration-300 hover:scale-110"
                    style={{ backgroundColor: '#DC5F12' }}
                    onClick={onAddTenant}
                    title="Add Tenant"
                  >
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-muted-foreground mb-2">Property is vacant</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ready for new tenant
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={onAddTenant}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Tenant
                  </Button>
                </div>
              </Card>
            )}

            {property.status === 'under-renovation' && (
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
    </div>
  );
}