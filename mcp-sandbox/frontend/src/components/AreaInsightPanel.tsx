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
        background: '#fef2f2',
        borderLeft: '4px solid #136C9E',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#dc2626', fontSize: '16px' }}>
          {error}
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
    const allItems = amenities.flatMap(category => category.items);
    return allItems.slice(0, 4).join(', ') + (allItems.length > 4 ? '...' : '');
  };

  const getTransportText = (transport: AreaInsight['transport']) => {
    return transport.map(t => t.details).join(', ');
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