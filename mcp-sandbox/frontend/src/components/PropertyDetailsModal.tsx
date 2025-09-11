import React, { useEffect, useState } from 'react';

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
}

interface PropertyDetailsModalProps {
  property: Property | null;
  onClose: () => void;
}

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({ property, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    console.log('🎯 [MODAL] Modal opened for property:', property?.id);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('🎯 [MODAL] ESC key pressed, closing modal');
        onClose();
      } else if (e.key === 'ArrowLeft') {
        console.log('🎯 [MODAL] Left arrow pressed, navigating to previous image');
        navigateImages('prev');
      } else if (e.key === 'ArrowRight') {
        console.log('🎯 [MODAL] Right arrow pressed, navigating to next image');
        navigateImages('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      console.log('🎯 [MODAL] Modal closing, removing event listeners');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, property?.id]);

  useEffect(() => {
    // Reset image state when property changes
    setCurrentImageIndex(0);
    setImageLoading(true);
    setImageError(false);
  }, [property?.id]);

  if (!property) {
    console.log('🎯 [MODAL] No property provided, not rendering modal');
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      console.log('🎯 [MODAL] Backdrop clicked, closing modal');
      onClose();
    }
  };

  const handleCloseClick = () => {
    console.log('🎯 [MODAL] Close button clicked');
    onClose();
  };

  const navigateImages = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    } else {
      setCurrentImageIndex((prev) => 
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
    setImageLoading(true);
    setImageError(false);
  };

  const handleImageLoad = () => {
    console.log('🎯 [MODAL] Image loaded successfully:', currentImage?.src);
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    console.log('🎯 [MODAL] Image failed to load, showing placeholder:', currentImage?.src);
    setImageLoading(false);
    setImageError(true);
  };

  const currentImage = property.images[currentImageIndex];

  console.log('🎯 [MODAL] Rendering modal for property:', property.title);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={handleBackdropClick}
    >
      <div 
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleCloseClick}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <svg width="20" height="20" fill="none" stroke="#333" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Image Gallery Section */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          {/* Main Image Container */}
          <div style={{ 
            position: 'relative', 
            height: '400px', 
            backgroundColor: '#f5f5f5',
            borderRadius: '12px 12px 0 0',
            overflow: 'hidden'
          }}>
            {/* Loading State */}
            {imageLoading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                zIndex: 1
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #e5e5e5',
                  borderTop: '4px solid #E65D24',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}

            {/* Main Image */}
            {!imageError ? (
              <img
                src={currentImage?.src || '/images/listings/property-main.jpg'}
                alt={currentImage?.alt || 'Property Image'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: imageLoading ? 'none' : 'block'
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                color: '#999',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <svg width="48" height="48" fill="none" stroke="#999" strokeWidth="2" viewBox="0 0 24 24" style={{ marginBottom: '8px' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                  <div>Image not available</div>
                </div>
              </div>
            )}

            {/* Property Type Badge */}
            <div style={{ 
              position: 'absolute', 
              top: '16px', 
              left: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <span style={{ 
                background: property.priceUnit === 'pcm' ? '#2563eb' : '#E65D24', 
                color: '#fff', 
                borderRadius: '12px', 
                padding: '4px 12px', 
                fontSize: '12px', 
                fontWeight: '600' 
              }}>
                {property.priceUnit === 'pcm' ? 'To Rent' : 'To Buy'}
              </span>
              {property.availableNow && (
                <span style={{ 
                  background: '#22c55e', 
                  color: '#fff', 
                  borderRadius: '12px', 
                  padding: '4px 12px', 
                  fontSize: '12px', 
                  fontWeight: '600' 
                }}>
                  Available Now
                </span>
              )}
            </div>

            {/* Navigation Arrows */}
            {property.images.length > 1 && (
              <>
                <button
                  onClick={() => navigateImages('prev')}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0, 0, 0, 0.5)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 2,
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
                >
                  <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <button
                  onClick={() => navigateImages('next')}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0, 0, 0, 0.5)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 2,
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
                >
                  <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </>
            )}

            {/* Image Counter */}
            {property.images.length > 1 && (
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                background: 'rgba(0, 0, 0, 0.5)',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {currentImageIndex + 1} / {property.images.length}
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {property.images.length > 1 && (
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '0 0 12px 12px',
              overflowX: 'auto'
            }}>
              {property.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    console.log('🎯 [MODAL] Thumbnail clicked, switching to image:', index);
                    setCurrentImageIndex(index);
                    setImageLoading(true);
                    setImageError(false);
                  }}
                  style={{
                    position: 'relative',
                    width: '80px',
                    height: '60px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: currentImageIndex === index ? '2px solid #E65D24' : '2px solid transparent',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                    }}
                  />
                  <div style={{
                    display: 'none',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#f5f5f5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: '10px'
                  }}>
                    {image.label}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div style={{ padding: '0 24px 24px 24px' }}>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: '#23272f', 
              marginBottom: '8px' 
            }}>
              {property.title}
            </h2>
            <div style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#E65D24',
              marginBottom: '4px'
            }}>
              {formatPrice(property.price)}
              <span style={{ 
                fontSize: '16px', 
                color: '#888', 
                marginLeft: '8px' 
              }}>
                {property.priceUnit === 'pcm' ? 'pcm' : 'total'}
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: '#888', 
              fontSize: '16px',
              gap: '8px'
            }}>
              <svg width="18" height="18" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="10" r="3"/>
                <path d="M12 2C7 2 4 7 4 12c0 5 8 10 8 10s8-5 8-10c0-5-3-10-8-10z"/>
              </svg>
              {property.address}
            </div>
          </div>

          {/* Property Details */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <svg width="20" height="20" fill="none" stroke="#23272f" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="10" width="18" height="7" rx="2"/>
                <path d="M3 17V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10"/>
              </svg>
              <span style={{ fontSize: '16px', color: '#23272f' }}>
                {property.beds} Bedrooms
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <svg width="20" height="20" fill="none" stroke="#23272f" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="10" width="18" height="7" rx="2"/>
                <path d="M7 10V7a5 5 0 0 1 10 0v3"/>
              </svg>
              <span style={{ fontSize: '16px', color: '#23272f' }}>
                {property.baths} Bathrooms
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <svg width="20" height="20" fill="none" stroke="#23272f" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
              <span style={{ fontSize: '16px', color: '#23272f' }}>
                {property.area} {property.areaUnit}
              </span>
            </div>
          </div>

          {/* Agent Information */}
          <div style={{ 
            borderTop: '1px solid #eee', 
            paddingTop: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#23272f',
              marginBottom: '16px'
            }}>
              Agent Information
            </h3>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                backgroundColor: '#f3f4f6', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#23272f' }}>
                  {property.agent.name}
                </div>
                <div style={{ fontSize: '14px', color: '#888' }}>
                  {property.agent.company}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '12px'
          }}>
            <button style={{ 
              background: '#E65D24', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px', 
              padding: '12px 16px', 
              fontWeight: '600', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}>
              <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Chat Now
            </button>
            <button style={{ 
              background: '#fff', 
              color: '#23272f', 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '12px 16px', 
              fontWeight: '600', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}>
              <svg width="18" height="18" fill="none" stroke="#23272f" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M22 16.92V21a2 2 0 0 1-2.18 2A19.72 19.72 0 0 1 3 5.18 2 2 0 0 1 5 3h4.09a2 2 0 0 1 2 1.72c.13 1.13.37 2.23.72 3.28a2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c1.05.35 2.15.59 3.28.72A2 2 0 0 1 21 18.91V21z"/>
              </svg>
              Call Agent
            </button>
            <button style={{ 
              background: '#fff', 
              color: '#23272f', 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '12px 16px', 
              fontWeight: '600', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}>
              <svg width="18" height="18" fill="none" stroke="#23272f" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M22 6 12 13 2 6"/>
              </svg>
              Send Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsModal; 