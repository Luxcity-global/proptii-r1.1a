import React from 'react';
import React, { useState } from 'react';
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
  const [imgLoaded, setImgLoaded]     = useState(false);
  const [imgErrored, setImgErrored]   = useState(false);
  
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
    <>
    <style>{`@keyframes propImgShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${className}`}>
      {/* Property Image */}
      <div className="aspect-video relative overflow-hidden">
        {(() => {
          const validPhotos = property.photos?.filter((p) => p && p.url && !p.url.startsWith('blob:')) || [];
          const coverPhotoUrl = validPhotos.find((p) => p.isCover)?.url || validPhotos[0]?.url;
          const fallback = '/assets/property-placeholder.jpg';
          const effectiveSrc = imgErrored ? fallback : coverPhotoUrl;

          return effectiveSrc ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {/* Shimmer skeleton — shown until image loads */}
              {!imgLoaded && (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg,#e8eef4 25%,#f3f6f9 50%,#e8eef4 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'propImgShimmer 1.4s ease-in-out infinite',
                  }}
                />
              )}
              <img
                src={effectiveSrc}
                alt={property.address}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
                style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.35s ease' }}
                onLoad={() => setImgLoaded(true)}
                onError={() => {
                  if (!imgErrored) { setImgErrored(true); setImgLoaded(false); }
                  else setImgLoaded(true);
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Image className="w-8 h-8 text-muted-foreground" />
            </div>
          );
        })()}

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
            <h3 className="font-semibold text-lg whitespace-normal break-words" style={{ color: '#374957', wordBreak: 'break-word' }}>
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
                <Badge key={index} variant="secondary" className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border-0">
                  {amenity}
                </Badge>
              ))}
              {property.amenities.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border-0">
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
    </>
  );
}

export default PropertyCard;
