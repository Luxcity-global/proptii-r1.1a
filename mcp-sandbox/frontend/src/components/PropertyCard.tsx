import React from 'react';

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
  source: string; // Added source property
}

interface PropertyCardProps {
  property: Property;
  onCardClick?: (property: Property) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onCardClick }) => {
  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(property);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      style={{
        display: 'flex',
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 2px 12px 0 rgba(44,62,80,0.10)',
        padding: 16,
        margin: 0,
        alignItems: 'flex-start',
        gap: 32,
        maxWidth: 1200,
        width: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 20px 0 rgba(44,62,80,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px 0 rgba(44,62,80,0.10)';
      }}
    >
      {/* Left: Image Gallery */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: 12, height: 240, flex: '0 0 auto', minWidth: 540 }}>
        {/* Main Image */}
        <div style={{ position: 'relative', height: '100%' }}>
          {property.images[0]?.src ? (
            <img
              src={property.images[0].src}
              alt={property.images[0].alt}
              style={{ 
                width: 360, 
                height: '100%', 
                objectFit: 'cover',
                borderRadius: 16
              }}
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.setAttribute('style', 'display: flex');
              }}
            />
          ) : null}
          <div
            style={{ 
              width: 360, 
              height: '100%', 
              backgroundColor: '#f5f5f5', 
              borderRadius: 16,
              display: property.images[0]?.src ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontSize: 14,
              fontWeight: 500
            }}
          >
            Property Image
          </div>
          {/* Badges */}
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ 
              background: property.priceUnit === 'pcm' ? '#2563eb' : '#E65D24', 
              color: '#fff', 
              borderRadius: 12, 
              padding: '2px 12px', 
              fontSize: 12, 
              fontWeight: 600 
            }}>
              {property.priceUnit === 'pcm' ? 'To Rent' : 'To Buy'}
            </span>
            {property.availableNow && (
              <span style={{ background: '#22c55e', color: '#fff', borderRadius: 12, padding: '2px 12px', fontSize: 12, fontWeight: 600 }}>Available Now</span>
            )}
          </div>
          {/* Favorite Icon */}
          <div style={{ position: 'absolute', top: 12, right: 12, background: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px 0 rgba(44,62,80,0.10)' }}>
            {/* Heart icon placeholder */}
            <svg width="18" height="18" fill="none" stroke="#E65D24" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21C12 21 4 13.5 4 8.5C4 5.46243 6.46243 3 9.5 3C11.1566 3 12.5 4.34315 12.5 6C12.5 4.34315 13.8434 3 15.5 3C18.5376 3 21 5.46243 21 8.5C21 13.5 12 21 12 21Z"/></svg>
          </div>
          {/* Main View Label */}
          <span style={{ position: 'absolute', left: 12, bottom: 12, background: '#23272f', color: '#fff', borderRadius: 8, padding: '2px 10px', fontSize: 11 }}>
            {property.images[0]?.label || 'Main View'}
          </span>
        </div>
        {/* Thumbnails */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', justifyContent: 'space-between', flex: 1 }}>
          {property.images.slice(1).map((img) => {
            // Calculate thumbnail height to fill the gallery height with 12px gaps
            const remainingImages = property.images.slice(1);
            const totalGap = 12 * (remainingImages.length - 1);
            const thumbHeight = (240 - totalGap) / remainingImages.length;
            return (
              <div key={img.label} style={{ position: 'relative', flex: 1, minHeight: 0 }}>
                {img.src ? (
                  <img
                    src={img.src}
                    alt={img.alt}
                    style={{ 
                      width: '100%', 
                      height: thumbHeight, 
                      objectFit: 'cover',
                      borderRadius: 8, 
                      border: '2px solid #fff', 
                      boxShadow: '0 1px 4px 0 rgba(44,62,80,0.08)'
                    }}
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.setAttribute('style', 'display: flex');
                    }}
                  />
                ) : null}
                <div
                  style={{ 
                    width: '100%', 
                    height: thumbHeight, 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: 8, 
                    border: '2px solid #fff', 
                    boxShadow: '0 1px 4px 0 rgba(44,62,80,0.08)',
                    display: img.src ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: 12,
                    fontWeight: 500
                  }}
                >
                  {img.label}
                </div>
                <span style={{ position: 'absolute', left: 6, bottom: 4, background: 'rgba(0,0,0,0.7)', color: '#fff', borderRadius: 6, padding: '1px 8px', fontSize: 10 }}>{img.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Right: Details */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Title and Price Row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#23272f', marginBottom: 2 }}>{property.title}</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#E65D24', display: 'inline-block' }}>£{property.price.toLocaleString()}</div>
            <span style={{ fontSize: 14, color: '#888', marginLeft: 4 }}>{property.priceUnit === 'pcm' ? 'pcm' : 'total'}</span>
          </div>
          {/* Document Icon */}
          <div style={{ background: '#f3f4f6', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Document icon placeholder */}
            <svg width="20" height="20" fill="none" stroke="#23272f" strokeWidth="2" viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h2"/></svg>
          </div>
        </div>
        {/* Address */}
        <div style={{ display: 'flex', alignItems: 'center', color: '#888', fontSize: 14, gap: 6 }}>
          {/* Location icon placeholder */}
          <svg width="16" height="16" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="10" r="3"/><path d="M12 2C7 2 4 7 4 12c0 5 8 10 8 10s8-5 8-10c0-5-3-10-8-10z"/></svg>
          {property.address}
        </div>
        {/* Specs Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '8px 0' }}>
          {/* Bed icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#23272f', fontSize: 14 }}>
            <svg width="16" height="16" fill="none" stroke="#23272f" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="10" width="18" height="7" rx="2"/><path d="M3 17V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10"/></svg>
            {property.beds} beds
          </div>
          {/* Bath icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#23272f', fontSize: 14 }}>
            <svg width="16" height="16" fill="none" stroke="#23272f" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="10" width="18" height="7" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></svg>
            {property.baths} baths
          </div>
          {/* Area icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#23272f', fontSize: 14 }}>
            <svg width="16" height="16" fill="none" stroke="#23272f" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            {property.area} {property.areaUnit}
          </div>
        </div>
        {/* Divider line under specs */}
        <div style={{ borderBottom: '1px solid #eee', margin: '8px 0 0 0', width: '100%' }} />
        {/* Agent Info and Actions Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0 0 0', gap: 12 }}>
          <div style={{ color: '#888', fontSize: 14 }}>
            {property.agent.company}<br />
            {property.agent.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Chat Button */}
            <button style={{ background: '#E65D24', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 18px', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 4px 0 rgba(44,62,80,0.08)' }}>
              {/* Chat icon */}
              <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Chat
            </button>
            {/* Call Button */}
            <button style={{ background: '#fff', color: '#23272f', border: '1px solid #eee', borderRadius: 20, padding: '6px 18px', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 4px 0 rgba(44,62,80,0.08)' }}>
              {/* Call icon */}
              <svg width="18" height="18" fill="none" stroke="#23272f" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92V21a2 2 0 0 1-2.18 2A19.72 19.72 0 0 1 3 5.18 2 2 0 0 1 5 3h4.09a2 2 0 0 1 2 1.72c.13 1.13.37 2.23.72 3.28a2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c1.05.35 2.15.59 3.28.72A2 2 0 0 1 21 18.91V21z"/></svg>
              Call
            </button>
            {/* Email Button */}
            <button style={{ background: '#fff', color: '#23272f', border: '1px solid #eee', borderRadius: 20, padding: '6px 18px', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 4px 0 rgba(44,62,80,0.08)' }}>
              {/* Email icon */}
              <svg width="18" height="18" fill="none" stroke="#23272f" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6 12 13 2 6"/></svg>
              Email
            </button>
          </div>
        </div>
      </div>
      {/* Source Badge */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
        <span style={{
          background: '#23272f',
          color: '#fff',
          borderRadius: 8,
          padding: '2px 10px',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}>
          {property.source}
        </span>
      </div>
    </div>
  );
};

export default PropertyCard; 