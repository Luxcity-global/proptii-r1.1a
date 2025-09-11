import React from 'react';
import PropertyCard from './PropertyCard';

interface Property {
  id: string;
  status: string;
  availableNow: boolean;
  title: string;
  price: number;
  priceUnit: string;
  address: string;
  beds: number;
  baths: number;
  area: number;
  areaUnit: string;
  images: Array<{
    src: string;
    alt: string;
    label: string;
  }>;
  isFavorited: boolean;
  agent: {
    company: string;
    name: string;
  };
  actions: Array<{ type: string; label: string }>;
  source: string;
}

interface PropertyGridProps {
  properties: Property[];
  currentPage: number;
  onPageChange: (page: number) => void;
  onPropertyClick?: (property: Property) => void;
}

const PAGE_SIZE = 20;

const PropertyGrid: React.FC<PropertyGridProps> = ({ properties, currentPage, onPageChange, onPropertyClick }) => {
  const totalPages = Math.ceil(properties.length / PAGE_SIZE);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const pageProperties = properties.slice(startIdx, endIdx);

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 24,
        margin: '32px 0',
      }}>
        {pageProperties.map((property: Property) => (
          <PropertyCard 
            key={property.id} 
            property={property} 
            onCardClick={onPropertyClick}
          />
        ))}
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0 0 0', gap: 8 }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i + 1)}
              style={{
                background: currentPage === i + 1 ? '#E65D24' : '#fff',
                color: currentPage === i + 1 ? '#fff' : '#23272f',
                border: '1px solid #eee',
                borderRadius: 8,
                padding: '6px 16px',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
                boxShadow: currentPage === i + 1 ? '0 1px 4px 0 rgba(44,62,80,0.08)' : 'none',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyGrid; 