import React from 'react';

interface AreaMapProps {
  location: string;
  properties?: Array<{
    id: string;
    address: string;
    price: number;
  }>;
}

const AreaMap: React.FC<AreaMapProps> = ({ location, properties = [] }) => {
  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '24px',
      minHeight: '300px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      {/* Map Placeholder */}
      <div style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        borderRadius: '6px',
        position: 'relative',
        minHeight: '260px'
      }}>
        {/* Location Label */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: '#dc2626',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {location}
        </div>

        {/* Property Markers */}
        {properties.slice(0, 8).map((property, index) => (
          <div
            key={property.id}
            style={{
              position: 'absolute',
              left: `${15 + (index * 10)}%`,
              top: `${20 + (index * 8)}%`,
              width: '14px',
              height: '14px',
              background: index % 3 === 0 ? '#8b5cf6' : index % 3 === 1 ? '#f59e0b' : '#10b981',
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              zIndex: 10
            }}
            title={`${property.address} - £${property.price.toLocaleString()}`}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          />
        ))}

        {/* Map Info */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(255,255,255,0.95)',
          padding: '10px 14px',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#374151',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxWidth: '80%'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '2px' }}>
            {properties.length} properties found in {location}
          </div>
          {properties.length > 0 && (
            <div style={{ fontSize: '11px', color: '#6b7280' }}>
              Price range: £{Math.min(...properties.map(p => p.price)).toLocaleString()} - £{Math.max(...properties.map(p => p.price)).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Integration Note */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(59, 130, 246, 0.1)',
        color: '#3b82f6',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '500'
      }}>
        Map Integration Ready
      </div>
    </div>
  );
};

export default AreaMap; 