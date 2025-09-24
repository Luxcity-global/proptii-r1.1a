import React, { useState, useEffect } from 'react';
import { MapIntegrationSectionProps } from './types';
import { useAreaInsights } from './hooks/useAreaInsights';
import { useMapMarkers } from './hooks/useMapMarkers';
import AreaInsightPanel from './AreaInsightPanel';
import PropertyMap from './PropertyMap';
import { MapPin, AlertCircle } from 'lucide-react';

const MapIntegrationSection: React.FC<MapIntegrationSectionProps> = ({
  searchQuery,
  properties,
  searchLocation,
  radiusKm = 5,
  isLoading,
  onMarkerClick
}) => {
  const [mapZoom, setMapZoom] = useState(12);
  const [showRadiusCircle, setShowRadiusCircle] = useState(false);

  // Extract location string from searchLocation object
  const locationString = searchLocation.address || searchQuery;

  // Fetch area insights
  const {
    areaInsights,
    isLoading: insightsLoading,
    error: insightsError
  } = useAreaInsights({
    searchLocation: locationString,
    properties,
    enabled: !!locationString
  });

  // Fetch property coordinates
  const {
    propertyCoordinates,
    isLoading: coordinatesLoading,
    error: coordinatesError
  } = useMapMarkers({
    properties,
    searchLocation: locationString,
    radiusKm,
    enabled: properties.length > 0
  });

  // Update map zoom based on radius
  useEffect(() => {
    if (radiusKm <= 2) setMapZoom(14);
    else if (radiusKm <= 5) setMapZoom(12);
    else if (radiusKm <= 10) setMapZoom(11);
    else setMapZoom(10);
  }, [radiusKm]);

  const handleMarkerClick = (property: any) => {
    console.log('🎯 Map marker clicked:', property);
    onMarkerClick(property);
  };

  const toggleRadiusCircle = () => {
    setShowRadiusCircle(!showRadiusCircle);
  };

  // Show loading state if any data is loading
  if (isLoading || insightsLoading || coordinatesLoading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '24px',
        margin: '32px 0',
        minHeight: '400px'
      }}>
        {/* Loading skeleton for area insights */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
            Loading area insights...
          </p>
        </div>

        {/* Loading skeleton for map */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show error state if there are errors
  if (insightsError || coordinatesError) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        margin: '32px 0',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: '#fee2e2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <AlertCircle style={{ width: '32px', height: '32px', color: '#dc2626' }} />
        </div>
        <h3 style={{ color: '#dc2626', marginBottom: '8px', fontSize: '18px' }}>
          Unable to load map data
        </h3>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
          {insightsError || coordinatesError}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#E65D24',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div 
      className="map-integration-section"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '24px',
        margin: '32px 0',
        minHeight: '400px'
      }}
    >
      {/* Area Insights Panel */}
      <div>
        <AreaInsightPanel
          areaInsights={areaInsights}
          isLoading={insightsLoading}
          error={insightsError}
        />
      </div>

      {/* Property Map */}
      <div style={{ position: 'relative' }}>
        <PropertyMap
          properties={propertyCoordinates}
          center={searchLocation}
          radiusKm={radiusKm}
          zoom={mapZoom}
          onMarkerClick={handleMarkerClick}
          showRadiusCircle={showRadiusCircle}
          isLoading={coordinatesLoading}
          error={coordinatesError}
        />

        {/* Map Controls */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          display: 'flex',
          gap: '8px',
          zIndex: 1000
        }}>
          <button
            onClick={toggleRadiusCircle}
            style={{
              background: showRadiusCircle ? '#E65D24' : '#fff',
              color: showRadiusCircle ? '#fff' : '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <MapPin style={{ width: '14px', height: '14px' }} />
            {showRadiusCircle ? 'Hide' : 'Show'} Radius
          </button>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .map-integration-section {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            margin: 16px 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MapIntegrationSection;
