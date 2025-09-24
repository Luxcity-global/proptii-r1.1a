import React from 'react';
import type { AreaInsight } from '../types/areaInsight';
import { MapPin, Info } from 'lucide-react';

interface AreaInsightPanelProps {
  areaInsight: AreaInsight | null;
  loading?: boolean;
  error?: string | null;
}

const AreaInsightPanel: React.FC<AreaInsightPanelProps> = ({
  areaInsight,
  loading = false,
  error = null
}) => {
  if (loading) {
    return (
      <div style={{
        background: '#f0f8ff',
        borderLeft: '4px solid #136C9E',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#6b7280', fontSize: '16px' }}>
          Loading area information...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: '#fefdf8',
        borderLeft: '4px solid #f59e0b',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <Info style={{ width: 24, height: 24, color: '#f59e0b', marginBottom: 8 }} />
        <div style={{ color: '#92400e', fontSize: '16px', fontWeight: 500, textAlign: 'center', marginBottom: 8 }}>
          Area insights temporarily unavailable
        </div>
        <div style={{ color: '#a16207', fontSize: '14px', textAlign: 'center' }}>
          The app continues to work normally. Try refreshing in a moment.
        </div>
      </div>
    );
  }

  if (!areaInsight) {
    return null;
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAmenitiesText = (amenities: AreaInsight['amenities']) => {
    if (!amenities || amenities.length === 0) {
      return 'excellent local amenities including shops, restaurants, parks, and recreational facilities';
    }
    
    try {
      const allItems = amenities.flatMap(category => 
        category?.items ? category.items : []
      ).filter(Boolean);
      
      if (allItems.length === 0) {
        return 'excellent local amenities including shops, restaurants, parks, and recreational facilities';
      }
      
      return allItems.slice(0, 4).join(', ') + (allItems.length > 4 ? ', and more' : '');
    } catch (error) {
      console.warn('Error processing amenities:', error);
      return 'excellent local amenities including shops, restaurants, parks, and recreational facilities';
    }
  };

  const getTransportText = (transport: AreaInsight['transport']) => {
    if (!transport || transport.length === 0) {
      return 'Good transport links with access to buses, trains, and major road networks';
    }
    
    try {
      const transportDetails = transport
        .map(t => t?.details)
        .filter(Boolean);
      
      if (transportDetails.length === 0) {
        return 'Good transport links with access to buses, trains, and major road networks';
      }
      
      return transportDetails.join(', ');
    } catch (error) {
      console.warn('Error processing transport:', error);
      return 'Good transport links with access to buses, trains, and major road networks';
    }
  };

  return (
    <div style={{
      background: '#f0f8ff',
      borderLeft: '4px solid #136C9E',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <MapPin size={20} color="#136C9E" />
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#136C9E',
          margin: 0
        }}>
          Area Insight: {areaInsight.location}
        </h3>
        <Info size={16} color="#136C9E" />
      </div>

      {/* Average Rent Information */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{
          fontSize: '14px',
          color: '#374151',
          margin: 0,
          lineHeight: '1.5'
        }}>
          <strong>Average Rent ({areaInsight.averageRent.propertyType}):</strong> Around{' '}
          {formatCurrency(areaInsight.averageRent.amount, areaInsight.averageRent.currency)}/{areaInsight.averageRent.period}.{' '}
          Prices vary by neighborhood and amenities.
        </p>
      </div>

      {/* Local Amenities Information */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{
          fontSize: '14px',
          color: '#374151',
          margin: 0,
          lineHeight: '1.5'
        }}>
          <strong>Local Amenities:</strong> Known for its {getAmenitiesText(areaInsight.amenities)}.
        </p>
      </div>

      {/* Transport Information */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{
          fontSize: '14px',
          color: '#374151',
          margin: 0,
          lineHeight: '1.5'
        }}>
          <strong>Transport:</strong> {getTransportText(areaInsight.transport)}.
        </p>
      </div>

      {/* Market Trends (if available) */}
      {areaInsight.marketTrends && (
        <div style={{ marginBottom: '12px' }}>
          <p style={{
            fontSize: '14px',
            color: '#374151',
            margin: 0,
            lineHeight: '1.5'
          }}>
            <strong>Market Trend:</strong> {areaInsight.marketTrends.description}
          </p>
        </div>
      )}

      {/* Neighborhood Info (if available) */}
      {areaInsight.neighborhoodInfo && (
        <div>
          <p style={{
            fontSize: '14px',
            color: '#374151',
            margin: 0,
            lineHeight: '1.5'
          }}>
            <strong>Neighborhood:</strong> {areaInsight.neighborhoodInfo.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default AreaInsightPanel;
