import React from 'react';
import { AreaInsightPanelProps } from './types';
import { MapPin, TrendingUp, Shield, GraduationCap, Bus, Utensils } from 'lucide-react';

const AreaInsightPanel: React.FC<AreaInsightPanelProps> = ({
  areaInsights,
  isLoading,
  error
}) => {
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
          Loading area insights...
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
          <MapPin style={{ width: '24px', height: '24px', color: '#dc2626' }} />
        </div>
        <h3 style={{ color: '#dc2626', marginBottom: '8px', fontSize: '16px' }}>
          Unable to load area insights
        </h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          {error}
        </p>
      </div>
    );
  }

  if (!areaInsights) {
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
          background: '#f3f4f6',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <MapPin style={{ width: '24px', height: '24px', color: '#6b7280' }} />
        </div>
        <h3 style={{ color: '#374151', marginBottom: '8px', fontSize: '16px' }}>
          No area insights available
        </h3>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          Area insights will appear here when you search for properties
        </p>
      </div>
    );
  }

  const formatPrice = (price: number) => `£${price.toLocaleString()}`;

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      height: 'fit-content'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #f3f4f6'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: 'linear-gradient(135deg, #E65D24 0%, #FF6B35 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px'
        }}>
          <MapPin style={{ width: '20px', height: '20px', color: '#fff' }} />
        </div>
        <div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0,
            marginBottom: '4px'
          }}>
            {areaInsights.areaName}
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0
          }}>
            Area Intelligence
          </p>
        </div>
      </div>

      {/* Average Rent */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <TrendingUp style={{ width: '16px', height: '16px', color: '#E65D24', marginRight: '8px' }} />
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0
          }}>
            Average Rent
          </h3>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px'
        }}>
          <div style={{
            background: '#f8fafc',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>1 Bed</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              {formatPrice(areaInsights.averageRent.oneBedroom)}
            </div>
          </div>
          <div style={{
            background: '#f8fafc',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>2 Bed</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              {formatPrice(areaInsights.averageRent.twoBedroom)}
            </div>
          </div>
          <div style={{
            background: '#f8fafc',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>3 Bed</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              {formatPrice(areaInsights.averageRent.threeBedroom)}
            </div>
          </div>
        </div>
      </div>

      {/* Local Amenities */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <Utensils style={{ width: '16px', height: '16px', color: '#E65D24', marginRight: '8px' }} />
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0
          }}>
            Local Amenities
          </h3>
        </div>
        <p style={{
          fontSize: '14px',
          color: '#4b5563',
          lineHeight: '1.5',
          margin: 0
        }}>
          {areaInsights.localAmenities.join(', ')}
        </p>
      </div>

      {/* Transport Links */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <Bus style={{ width: '16px', height: '16px', color: '#E65D24', marginRight: '8px' }} />
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0
          }}>
            Transport Links
          </h3>
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {areaInsights.transportLinks.map((link, index) => (
            <span
              key={index}
              style={{
                background: '#f1f5f9',
                color: '#475569',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              {link}
            </span>
          ))}
        </div>
      </div>

      {/* Scores */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px'
          }}>
            <Shield style={{ width: '16px', height: '16px', color: '#10b981', marginRight: '4px' }} />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
              Safety
            </span>
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1f2937'
          }}>
            {areaInsights.safetyScore}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px'
          }}>
            <GraduationCap style={{ width: '16px', height: '16px', color: '#3b82f6', marginRight: '4px' }} />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
              Schools
            </span>
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1f2937'
          }}>
            {areaInsights.schoolScore}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px'
          }}>
            <MapPin style={{ width: '16px', height: '16px', color: '#f59e0b', marginRight: '4px' }} />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
              Walkability
            </span>
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1f2937'
          }}>
            {areaInsights.walkabilityScore}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaInsightPanel;
