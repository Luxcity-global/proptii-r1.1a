import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  AlertTriangle, 
  Eye, 
  Edit3, 
  FileText, 
  Image, 
  MoreHorizontal,
  MapPin,
  PoundSterling,
  Calendar
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';

export interface PropertyCardProps {
  property: {
    id: string;
    address: string;
    type: string;
    bedrooms: number;
    bathrooms: number;
    rent: number;
    status: 'available' | 'occupied' | 'maintenance' | 'archived';
    photos: Array<{ url: string; isCover?: boolean }>;
    documents: Array<{ status: string }>;
    amenities?: string[];
    notes?: string;
  };
  onView?: (property: any) => void;
  onEdit?: (property: any) => void;
  onManageDocuments?: (property: any) => void;
  onManagePhotos?: (property: any) => void;
  className?: string;
  showActions?: boolean;
}

export function PropertyCard({ 
  property, 
  onView, 
  onEdit, 
  onManageDocuments, 
  onManagePhotos,
  className = "",
  showActions = true 
}: PropertyCardProps) {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'Occupied';
      case 'maintenance':
        return 'Maintenance';
      case 'archived':
        return 'Archived';
      default:
        return status;
    }
  };

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${className}`}>
      {/* Property Image */}
      <div className="aspect-video relative overflow-hidden">
        {property.photos.length > 0 ? (
          <img
            src={
              property.photos.find((p) => p.isCover)?.url || property.photos[0].url
            }
            alt={property.address}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Image className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={`${getStatusColor(property.status)} text-white border-0`}>
            {getStatusText(property.status)}
          </Badge>
        </div>

        {/* Document Alert */}
        {property.documents.some(
          (d) => d.status === "expiring-soon" || d.status === "expired"
        ) && (
          <div className="absolute top-3 right-3">
            <Badge variant="destructive">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Alert
            </Badge>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-6">
        <div className="space-y-3">
          {/* Address */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg line-clamp-1" style={{ color: '#374957' }}>
              {property.address}
            </h3>
          </div>

          {/* Property Type */}
          <p className="text-sm text-muted-foreground capitalize">
            {property.type} • {property.bedrooms} bed • {property.bathrooms} bath
          </p>

          {/* Rent */}
          <div className="flex items-center gap-2">
            <PoundSterling className="w-4 h-4 text-muted-foreground" />
            <span className="text-xl font-bold" style={{ color: '#374957' }}>
              £{property.rent.toLocaleString()}/month
            </span>
          </div>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {property.amenities.slice(0, 3).map((amenity, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {property.amenities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{property.amenities.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView?.(property)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(property)}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Property
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onManageDocuments?.(property)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Manage Documents
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onManagePhotos?.(property)}>
                    <Image className="w-4 h-4 mr-2" />
                    Manage Photos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default PropertyCard;
