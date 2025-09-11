import React, { useEffect, useRef, useState } from 'react';

export interface PropertyMarkerData {
  id: string;
  address: string;
  price: number;
  priceUnit: string;
  beds?: number;
  baths?: number;
  area?: number;
  areaUnit?: string;
  status?: string;
  availableNow?: boolean;
  images?: Array<{ src: string; alt: string }>;
}

interface PropertyMarkerProps {
  property: PropertyMarkerData;
  position: google.maps.LatLngLiteral;
  map: google.maps.Map;
  onClick?: (property: PropertyMarkerData) => void;
  isSelected?: boolean;
}

const PropertyMarker: React.FC<PropertyMarkerProps> = ({
  property,
  position,
  map,
  onClick,
  isSelected = false
}) => {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isInfoWindowOpen, setIsInfoWindowOpen] = useState(false);

  // Create custom marker icon based on property characteristics
  const createMarkerIcon = (): google.maps.Symbol => {
    const price = property.price;
    let color = '#10b981'; // Default green

    // Color coding based on price range
    if (price > 3000) color = '#dc2626'; // Red for expensive
    else if (price > 2000) color = '#f59e0b'; // Orange for mid-range
    else if (price > 1000) color = '#8b5cf6'; // Purple for affordable

    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: isSelected ? 12 : 10,
      fillColor: color,
      fillOpacity: 0.9,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    };
  };

  // Create info window content
  const createInfoWindowContent = (): string => {
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    };

    const imageUrl = property.images?.[0]?.src || '';
    const hasImage = imageUrl && imageUrl !== '';

    return `
      <div style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 280px;
        padding: 0;
        margin: 0;
      ">
        ${hasImage ? `
          <div style="
            width: 100%;
            height: 120px;
            background-image: url('${imageUrl}');
            background-size: cover;
            background-position: center;
            border-radius: 8px 8px 0 0;
            margin-bottom: 8px;
          "></div>
        ` : ''}
        
        <div style="padding: ${hasImage ? '0 8px 8px 8px' : '8px'}">
          <div style="
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
            line-height: 1.3;
          ">
            ${formatPrice(property.price)}/${property.priceUnit}
          </div>
          
          <div style="
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 6px;
            line-height: 1.4;
          ">
            ${property.address}
          </div>
          
          <div style="
            display: flex;
            gap: 12px;
            font-size: 12px;
            color: #374151;
          ">
            ${property.beds ? `<span>🛏️ ${property.beds} bed${property.beds > 1 ? 's' : ''}</span>` : ''}
            ${property.baths ? `<span>🚿 ${property.baths} bath${property.baths > 1 ? 's' : ''}</span>` : ''}
            ${property.area ? `<span>📐 ${property.area} ${property.areaUnit || 'sq ft'}</span>` : ''}
          </div>
          
          ${property.status ? `
            <div style="
              margin-top: 6px;
              padding: 2px 6px;
              background: ${property.availableNow ? '#dcfce7' : '#fef3c7'};
              color: ${property.availableNow ? '#166534' : '#92400e'};
              border-radius: 4px;
              font-size: 11px;
              font-weight: 500;
              display: inline-block;
            ">
              ${property.status}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  };

  useEffect(() => {
    if (!map || !position) return;

    // Create marker
    markerRef.current = new google.maps.Marker({
      position,
      map,
      icon: createMarkerIcon(),
      title: `${property.address} - £${property.price.toLocaleString()}`,
      animation: isSelected ? google.maps.Animation.BOUNCE : undefined,
      zIndex: isSelected ? 1000 : 1
    });

    // Create info window
    infoWindowRef.current = new google.maps.InfoWindow({
      content: createInfoWindowContent(),
      maxWidth: 300,
      pixelOffset: new google.maps.Size(0, -10)
    });

    // Add click listeners
    markerRef.current.addListener('click', () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.open(map, markerRef.current);
        setIsInfoWindowOpen(true);
      }
      onClick?.(property);
    });

    // Add hover effects
    markerRef.current.addListener('mouseover', () => {
      if (markerRef.current) {
        markerRef.current.setIcon(createMarkerIcon());
      }
    });

    markerRef.current.addListener('mouseout', () => {
      if (markerRef.current) {
        markerRef.current.setIcon(createMarkerIcon());
      }
    });

    // Cleanup function
    return () => {
      if (markerRef.current) {
        google.maps.event.clearInstanceListeners(markerRef.current);
        markerRef.current.setMap(null);
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [map, position, property, isSelected]);

  // Update marker when selection changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setIcon(createMarkerIcon());
      if (isSelected) {
        markerRef.current.setAnimation(google.maps.Animation.BOUNCE);
        markerRef.current.setZIndex(1000);
      } else {
        markerRef.current.setAnimation(null);
        markerRef.current.setZIndex(1);
      }
    }
  }, [isSelected]);

  // Update info window content when property data changes
  useEffect(() => {
    if (infoWindowRef.current && isInfoWindowOpen) {
      infoWindowRef.current.setContent(createInfoWindowContent());
    }
  }, [property, isInfoWindowOpen]);

  return null; // This component doesn't render anything visible
};

export default PropertyMarker;
