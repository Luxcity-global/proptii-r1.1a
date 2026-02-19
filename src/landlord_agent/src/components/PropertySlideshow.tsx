import React, { useState, useEffect } from 'react';

const PropertySlideshow: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      id: 1,
      image: '/assets/add_prp_slide/chalcot-square-london-uk-march-people-enjoy-sun-gardens-surrounded-colorful-italianate-terraced-houses-greater-area-214905146.png'
    },
    {
      id: 2,
      image: '/assets/add_prp_slide/fyGslLi6kqhgzXxdxn7fQYSSReDgNPDwHpPeYYsP_1200.png'
    },
    {
      id: 3,
      image: '/assets/add_prp_slide/i.png'
    },
    {
      id: 4,
      image: '/assets/add_prp_slide/viewSourceImage-39-1-scaled.png'
    },
    {
      id: 5,
      image: '/assets/add_prp_slide/pexels-heyho-6077368.png'
    },
    {
      id: 6,
      image: '/assets/add_prp_slide/iStock-1974859701-1-scaled.png'
    },
    {
      id: 7,
      image: '/assets/add_prp_slide/pexels-lebele-11935244.png'
    },
    {
      id: 8,
      image: '/assets/add_prp_slide/pexels-naimbic-2030037.png'
    }
  ];

  // Auto-advance slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '600px',
      borderRadius: '1rem',
      overflow: 'hidden',
      backgroundColor: '#F9FAFB'
    }}>
      {/* Slideshow Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: index === currentSlide ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out'
            }}
          >
            <img
              src={slide.image}
              alt={`Property ${slide.id}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
          </div>
        ))}
      </div>

      {/* Dots Indicator */}
      <div style={{
        position: 'absolute',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '0.5rem',
        zIndex: 10
      }}>
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            style={{
              width: '0.75rem',
              height: '0.75rem',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: index === currentSlide ? '#DC5F12' : 'rgba(255, 255, 255, 0.5)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (index !== currentSlide) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
              }
            }}
            onMouseLeave={(e) => {
              if (index !== currentSlide) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

export { PropertySlideshow };

