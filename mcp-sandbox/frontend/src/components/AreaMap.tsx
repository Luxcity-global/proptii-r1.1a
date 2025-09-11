import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MarkerClusterer, GridAlgorithm } from '@googlemaps/markerclusterer';
import PropertyMarker, { type PropertyMarkerData } from './PropertyMarker';
import geocodingService from '../services/geocodingService';
import googleMapsLoader from '../utils/googleMapsLoader';

interface AreaMapProps {
  location: string;
  properties?: Array<{
    id: string;
    address: string;
    price: number;
    priceUnit?: string;
    beds?: number;
    baths?: number;
    area?: number;
    areaUnit?: string;
    status?: string;
    availableNow?: boolean;
    images?: Array<{ src: string; alt: string }>;
  }>;
  onPropertyClick?: (property: PropertyMarkerData) => void;
  selectedPropertyId?: string;
}

interface GeocodedProperty {
  property: PropertyMarkerData;
  position: google.maps.LatLngLiteral;
  confidence: number;
}

const AreaMap: React.FC<AreaMapProps> = ({
  location,
  properties = [],
  onPropertyClick,
  selectedPropertyId
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geocodedProperties, setGeocodedProperties] = useState<GeocodedProperty[]>([]);

  // Initialize Google Maps
  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load Google Maps API and wait for all libraries
      await googleMapsLoader.loadGoogleMaps();
      
      // Additional check to ensure all libraries are available
      if (!googleMapsLoader.isGoogleMapsLoaded()) {
        throw new Error('Google Maps API not fully loaded');
      }
      
      const maps = googleMapsLoader.getGoogleMaps();
      if (!maps) {
        throw new Error('Google Maps API not available');
      }

      // Create map instance
      const map = new maps.Map(mapRef.current, {
        center: { lat: 51.5074, lng: -0.1278 }, // Default to London
        zoom: 12,
        mapTypeId: maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: 'cooperative',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Add map event listeners
      map.addListener('bounds_changed', () => {
        // Map bounds changed - could be used for future features
      });

      // Create marker clusterer
      clustererRef.current = new MarkerClusterer({
        map,
        markers: [],
        algorithm: new GridAlgorithm({
          maxZoom: 15,
          gridSize: 50
        }),
        renderer: {
          render: ({ count, position }) => {
            const marker = new google.maps.Marker({
              position,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: Math.min(8 + count * 2, 20),
                fillColor: '#1e40af',
                fillOpacity: 0.8,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
              label: {
                text: count.toString(),
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 'bold'
              }
            });

            // Add click listener to cluster
            marker.addListener('click', () => {
              const currentZoom = map.getZoom();
              if (currentZoom !== undefined) {
                map.setZoom(Math.min(currentZoom + 2, 18));
              }
              map.setCenter(position);
            });

            return marker;
          }
        }
      });

      console.log('✅ [AREA-MAP] Map initialized successfully');
      setIsLoading(false);

    } catch (err) {
      console.error('❌ [AREA-MAP] Failed to initialize map:', err);
      setError('Failed to load map. Please try again.');
      setIsLoading(false);
    }
  }, []);

  // Geocode properties
  const geocodeProperties = useCallback(async () => {
    if (!properties.length) {
      setGeocodedProperties([]);
      return;
    }

    try {
      console.log(`🗺️ [AREA-MAP] Geocoding ${properties.length} properties`);

      // Extract addresses
      const addresses = properties.map(p => p.address).filter(Boolean);
      
      // Batch geocode addresses
      const geocodingResults = await geocodingService.geocodeAddresses(addresses);
      
      // Create geocoded properties
      const geocoded: GeocodedProperty[] = [];
      
      properties.forEach(property => {
        const geocodingResult = geocodingResults.get(property.address);
        if (geocodingResult && geocodingResult.confidence > 0.3) {
          geocoded.push({
            property: {
              id: property.id,
              address: property.address,
              price: property.price,
              priceUnit: property.priceUnit || 'pcm',
              beds: property.beds,
              baths: property.baths,
              area: property.area,
              areaUnit: property.areaUnit,
              status: property.status,
              availableNow: property.availableNow,
              images: property.images
            },
            position: {
              lat: geocodingResult.lat,
              lng: geocodingResult.lng
            },
            confidence: geocodingResult.confidence
          });
        }
      });

      setGeocodedProperties(geocoded);
      console.log(`✅ [AREA-MAP] Successfully geocoded ${geocoded.length}/${properties.length} properties`);

    } catch (err) {
      console.error('❌ [AREA-MAP] Failed to geocode properties:', err);
      setGeocodedProperties([]);
    }
  }, [properties]);

  // Update map bounds to fit all properties
  const fitMapToProperties = useCallback(() => {
    if (!mapInstanceRef.current || !geocodedProperties.length) return;

    const bounds = new google.maps.LatLngBounds();
    
    geocodedProperties.forEach(({ position }) => {
      bounds.extend(position);
    });

          // Fit the map to show all properties
      mapInstanceRef.current.fitBounds(bounds);

    // Ensure minimum zoom level
    google.maps.event.addListenerOnce(mapInstanceRef.current, 'bounds_changed', () => {
      const currentZoom = mapInstanceRef.current?.getZoom();
      if (mapInstanceRef.current && currentZoom !== undefined && currentZoom > 16) {
        mapInstanceRef.current.setZoom(16);
      }
    });
  }, [geocodedProperties]);

  // Initialize map on mount
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // Geocode properties when they change
  useEffect(() => {
    geocodeProperties();
  }, [geocodeProperties]);

  // Fit map to properties when geocoded data changes
  useEffect(() => {
    if (geocodedProperties.length > 0) {
      fitMapToProperties();
    }
  }, [geocodedProperties, fitMapToProperties]);

  // Handle property click
  const handlePropertyClick = useCallback((property: PropertyMarkerData) => {
    onPropertyClick?.(property);
  }, [onPropertyClick]);

  if (isLoading) {
    return (
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#6b7280', fontSize: '16px' }}>
          Loading interactive map...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#dc2626', fontSize: '16px', textAlign: 'center' }}>
          <div style={{ marginBottom: '8px' }}>🗺️ Map Error</div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '24px',
      position: 'relative'
    }}>
      {/* Map Container */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '400px',
          borderRadius: '6px',
          overflow: 'hidden'
        }}
      />

      {/* Map Info Panel */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: '30px',
        background: 'rgba(255,255,255,0.95)',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#374151',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(8px)',
        maxWidth: '300px',
        zIndex: 1000
      }}>
        <div style={{ fontWeight: '600', marginBottom: '4px', color: '#1e40af' }}>
          📍 {location}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
          {geocodedProperties.length} properties mapped
        </div>
        {geocodedProperties.length > 0 && (
          <div style={{ fontSize: '11px', color: '#6b7280' }}>
            Price range: £{Math.min(...geocodedProperties.map(p => p.property.price)).toLocaleString()} - £{Math.max(...geocodedProperties.map(p => p.property.price)).toLocaleString()}
          </div>
        )}
      </div>

      {/* Property Markers */}
      {mapInstanceRef.current && geocodedProperties.map(({ property, position }) => (
        <PropertyMarker
          key={property.id}
          property={property}
          position={position}
          map={mapInstanceRef.current!}
          onClick={handlePropertyClick}
          isSelected={selectedPropertyId === property.id}
        />
      ))}

      {/* Map Controls Info */}
      <div style={{
        position: 'absolute',
        top: '30px',
        right: '30px',
        background: 'rgba(255,255,255,0.95)',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#6b7280',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000
      }}>
        <div style={{ fontWeight: '500', marginBottom: '2px' }}>🗺️ Interactive Map</div>
        <div style={{ fontSize: '10px' }}>
          Click markers for details • Clusters show property counts
        </div>
      </div>
    </div>
  );
};

export default AreaMap; 