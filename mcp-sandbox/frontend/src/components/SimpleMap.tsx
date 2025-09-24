import React, { useEffect, useRef, useState } from 'react';
import googleMapsLoader from '../utils/googleMapsLoader';

interface SimpleMapProps {
  location: string;
  properties?: Array<{
    id: string;
    address: string;
    price: number;
    beds?: number;
    baths?: number;
  }>;
}

const SimpleMap: React.FC<SimpleMapProps> = ({ location, properties = [] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  // Removed unused mapInstance state variable
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let mapInstance: google.maps.Map | null = null;
    let marker: google.maps.Marker | null = null;
    let mapContainer: HTMLDivElement | null = null;
    let observer: IntersectionObserver | null = null;

    const initializeMap = async () => {
      try {
        console.log('🚀 [SIMPLE-MAP] Starting map initialization...');
        console.log('🔍 [SIMPLE-MAP] Map ref available:', !!mapRef.current);
        
        // Ensure DOM is ready and component is mounted
        if (!mapRef.current || !isMounted) {
          console.log('⚠️ [SIMPLE-MAP] Map container not ready or component unmounted');
          if (isMounted) {
            setError('Map container not available');
            setIsLoading(false);
          }
          return;
        }

        // Store reference to the container
        mapContainer = mapRef.current;

        // Load Google Maps API
        console.log('📦 [SIMPLE-MAP] Loading Google Maps API...');
        await googleMapsLoader.loadGoogleMaps();
        
        // Check if still mounted after async operation
        if (!isMounted || !mapContainer) return;
        
        const maps = googleMapsLoader.getGoogleMaps();
        console.log('🔍 [SIMPLE-MAP] Google Maps API available:', !!maps);
        
        if (!maps) {
          throw new Error('Google Maps API not available');
        }

        // Final check for DOM element and mounted state
        if (!mapContainer || !isMounted) {
          console.log('⚠️ [SIMPLE-MAP] Component unmounted or DOM removed during initialization');
          return;
        }

        console.log('🗺️ [SIMPLE-MAP] Creating map instance...');
        mapInstance = new maps.Map(mapContainer, {
          center: { lat: 51.5074, lng: -0.1278 }, // London
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          // Performance optimizations
          gestureHandling: 'cooperative',
          backgroundColor: '#f0f0f0',
          clickableIcons: false,
          keyboardShortcuts: false,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }] // Reduce visual clutter for better performance
            }
          ]
        });

        console.log('📍 [SIMPLE-MAP] Adding marker...');
        // Add a basic marker
        marker = new maps.Marker({
          position: { lat: 51.5074, lng: -0.1278 },
          map: mapInstance,
          title: location || 'Map Location',
        });

        if (isMounted) {
          setIsLoading(false);
          setError(null);
          console.log('✅ [SIMPLE-MAP] Map initialized successfully');
        }

      } catch (err) {
        console.error('❌ [SIMPLE-MAP] Failed to initialize map:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load map');
          setIsLoading(false);
        }
      }
    };

    console.log('🔄 [SIMPLE-MAP] useEffect triggered for location:', location);
    // Lazy loading with intersection observer for better performance
    if (mapRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && isMounted) {
              console.log('🔍 [SIMPLE-MAP] Map container is visible, initializing...');
              observer?.disconnect(); // Only initialize once
              setTimeout(initializeMap, 100);
            }
          });
        },
        { threshold: 0.1 } // Initialize when 10% visible
      );
      observer.observe(mapRef.current);
    } else {
      // Fallback if ref not available immediately - use a small delay
      setTimeout(() => {
        if (isMounted && mapRef.current) {
          initializeMap();
        }
      }, 100);
    }
    
    return () => {
      console.log('🧹 [SIMPLE-MAP] Starting cleanup...');
      isMounted = false;
      
      // Cleanup intersection observer
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      
      // Clean up Google Maps objects safely to prevent React DOM conflicts
      try {
        if (marker) {
          console.log('🧹 [SIMPLE-MAP] Removing marker...');
          marker.setMap(null);
          marker = null;
        }
        
        if (mapInstance && mapContainer) {
          console.log('🧹 [SIMPLE-MAP] Clearing map container...');
          // Clear the map container's content to prevent React DOM conflicts
          mapContainer.innerHTML = '';
        }
        
        mapInstance = null;
        mapContainer = null;
        console.log('✅ [SIMPLE-MAP] Cleanup completed successfully');
      } catch (error) {
        console.log('⚠️ [SIMPLE-MAP] Error during cleanup (non-critical):', error);
      }
    };
  }, [location]);

  if (error) {
    return (
      <div style={{
        background: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <div style={{ color: '#dc2626', fontSize: '16px', marginBottom: '8px' }}>
          🗺️ Map Error
        </div>
        <div style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>
          {error}
        </div>
        <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '8px' }}>
          Check console for more details
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
      <div style={{ marginBottom: '12px', fontWeight: '600', color: '#1e40af' }}>
        📍 {location} - Simple Map {isLoading ? '⏳' : '✅'}
      </div>
      
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '400px',
          borderRadius: '6px',
          overflow: 'hidden',
          backgroundColor: isLoading ? '#e5e5e5' : '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative' // Ensure proper positioning for Google Maps
        }}
        data-testid="simple-map-container"
      >
        {isLoading && (
          <div style={{ 
            color: '#6b7280', 
            fontSize: '14px',
            position: 'absolute',
            zIndex: 1000
          }}>
            Loading map...
          </div>
        )}
      </div>
      
      <div style={{ 
        marginTop: '8px', 
        fontSize: '12px', 
        color: '#6b7280' 
      }}>
        Properties found: {properties.length} | Status: {isLoading ? 'Loading...' : 'Ready'}
      </div>
    </div>
  );
};

export default SimpleMap;