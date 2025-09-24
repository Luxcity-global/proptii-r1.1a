import React, { useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { PropertyMapProps } from './types';
import { MapPin, AlertCircle } from 'lucide-react';

const PropertyMap: React.FC<PropertyMapProps> = ({
  properties,
  center,
  radiusKm,
  zoom,
  onMarkerClick,
  showRadiusCircle = false,
  isLoading,
  error
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const mapOptions = useMemo(() => ({
    mapId: 'DEMO_MAP_ID',
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    mapTypeControl: true,
    gestureHandling: 'greedy' as const,
  }), []);

  if (isLoading) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #E65D24',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>
          Loading map...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: '#fee2e2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <AlertCircle style={{ width: '24px', height: '24px', color: '#dc2626' }} />
        </div>
        <h3 style={{ color: '#dc2626', marginBottom: '8px', fontSize: '16px' }}>
          Unable to load map
        </h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          {error}
        </p>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: '#fef3c7',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <MapPin style={{ width: '24px', height: '24px', color: '#d97706' }} />
        </div>
        <h3 style={{ color: '#d97706', marginBottom: '8px', fontSize: '16px' }}>
          Google Maps API Key Required
        </h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Please configure the Google Maps API key to display the map
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      height: '400px',
      position: 'relative'
    }}>
      <APIProvider apiKey={apiKey}>
        <Map
          center={center}
          zoom={zoom}
          {...mapOptions}
          style={{ width: '100%', height: '100%' }}
        >
          {properties.map((property) => (
            <AdvancedMarker
              key={property.id}
              position={property.coordinates}
              onClick={() => onMarkerClick(property)}
              title={`${property.title} - £${property.price.toLocaleString()}`}
            >
              <div 
                style={{
                  background: 'linear-gradient(135deg, #E65D24 0%, #FF6B35 100%)',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  border: '2px solid #fff',
                  minWidth: '60px',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  transform: 'translateY(-50%)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                }}
              >
                £{property.price.toLocaleString()}
              </div>
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>

      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px',
        fontWeight: '500',
        color: '#374151',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <MapPin style={{ width: '14px', height: '14px', color: '#E65D24' }} />
        <span>
          {properties.length} properties within {radiusKm}km
        </span>
      </div>

      {showRadiusCircle && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          fontWeight: '500',
          color: '#374151',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#E65D24',
            opacity: 0.6
          }} />
          <span>Search radius</span>
        </div>
      )}
    </div>
  );
};

export default PropertyMap;