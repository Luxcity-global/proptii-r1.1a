import React, { useState, useEffect } from 'react';

interface WelcomePageProps {
  onGetStarted: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onGetStarted }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      id: 1,
      image: '/images/feature1.png'
    },
    {
      id: 2,
      image: '/images/feature2.png'
    },
    {
      id: 3,
      image: '/images/feature3.png'
    },
    {
      id: 4,
      image: '/images/feature4.png'
    }
  ];

  // Auto-advance slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '3rem 4rem',
        maxWidth: '72rem',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
         {/* Header Section */}
         <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
           {/* Title */}
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: 'bold',
            color: '#374957',
            marginBottom: '1rem',
            fontFamily: 'Archivo, sans-serif'
          }}>
             Welcome to Proptii
          </h1>

          {/* Description */}
          <p style={{
            fontSize: '1.25rem',
            color: '#6B7280',
            maxWidth: '42rem',
            margin: '0 auto 3rem auto',
            lineHeight: '1.6'
          }}>
            The complete property management solution for modern landlords and agents. 
            Streamline your workflow, stay compliant, and grow your portfolio with confidence.
          </p>
        </div>

         {/* Modern Slideshow */}
         <div style={{
           position: 'relative',
           marginBottom: '3rem',
           borderRadius: '1rem',
           overflow: 'hidden',
           backgroundColor: 'transparent'
         }}>
          {/* Carousel Container */}
          <div style={{
            position: 'relative',
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0',
            padding: '2rem 0',
          }}>
            {/* Left Card (Previous) */}
            <div style={{
              width: '350px',
              height: '260px',
              opacity: 0.5,
              transform: 'scale(0.8)',
              transition: 'all 0.5s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={slides[(currentSlide - 1 + slides.length) % slides.length].image}
                alt={`Feature ${slides[(currentSlide - 1 + slides.length) % slides.length].id}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'blur(1px)'
                }}
              />
            </div>

            {/* Center Card (Current) */}
            <div style={{
              width: '400px',
              height: '300px',
              opacity: 1,
              transform: 'scale(1)',
              transition: 'all 0.5s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2
            }}>
              <img
                src={slides[currentSlide].image}
                alt={`Feature ${slides[currentSlide].id}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  transition: 'transform 0.3s ease',
                  boxShadow: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              />
            </div>

            {/* Right Card (Next) */}
            <div style={{
              width: '350px',
              height: '260px',
              opacity: 0.5,
              transform: 'scale(0.8)',
              transition: 'all 0.5s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={slides[(currentSlide + 1) % slides.length].image}
                alt={`Feature ${slides[(currentSlide + 1) % slides.length].id}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'blur(1px)'
                }}
              />
            </div>
          </div>


        </div>

        {/* Call to Action */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <button
            onClick={onGetStarted}
            style={{
              padding: '0.75rem 3rem',
              minHeight: '3.5rem',
              borderRadius: '9999px',
              backgroundColor: '#DC5F12',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              minWidth: '200px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FF6B1A';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 95, 18, 0.4)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#DC5F12';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
          >
            Get Started
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
        </div>
      </div>
    </div>
  );
};

export { WelcomePage };
