import React from 'react';
import { AnimatedList } from './magic-ui/animated-list';

interface WelcomePageProps {
  onGetStarted: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onGetStarted }) => {
  const images = [
    '/images/magli1.png',
    '/images/magli2.png'
  ];

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
            margin: '0 auto 1.5rem auto',
            lineHeight: '1.6'
          }}>
            The complete property management solution for modern landlords and agents. 
            Streamline your workflow, stay compliant, and grow your portfolio with confidence.
          </p>
        </div>

         {/* Magic UI Animated List */}
         <div style={{
           position: 'relative',
           marginBottom: '1.5rem',
           borderRadius: '1rem',
           overflow: 'hidden',
           backgroundColor: 'transparent',
           display: 'flex',
           justifyContent: 'center',
           alignItems: 'center',
           minHeight: '400px'
         }}>
          <AnimatedList delay={1500} className="w-full max-w-2xl gap-8">
            {images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Feature ${index + 1}`}
                style={{
                  width: '100%',
                  maxWidth: '600px',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto'
                }}
              />
            ))}
          </AnimatedList>
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
