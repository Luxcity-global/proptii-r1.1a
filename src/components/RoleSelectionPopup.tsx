import React, { useState } from 'react';
import { WelcomePage } from './WelcomePage';

type UserRole = 'landlord' | 'agent';

interface RoleSelectionPopupProps {
  isOpen: boolean;
  onRoleSelected: (role: UserRole) => void;
  onContinue?: (role: UserRole) => void;
}

const RoleSelectionPopup: React.FC<RoleSelectionPopupProps> = ({ isOpen, onRoleSelected, onContinue }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('landlord');
  const [currentPage, setCurrentPage] = useState<'welcome' | 'role-selection'>('welcome');

  if (!isOpen) return null;

  const handleGetStarted = () => {
    setCurrentPage('role-selection');
  };

  const handleBackToWelcome = () => {
    setCurrentPage('welcome');
  };

  const roles = [
    {
      id: 'landlord' as const,
      title: 'Landlord',
      description: 'I own and manage my own properties',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#DC5F12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 22V12H15V22" stroke="#DC5F12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      features: [
        'Personal property portfolio',
        'Direct tenant management',
        'Individual compliance tracking',
        'Simple financial reporting'
      ],
      badge: 'Popular'
    },
    {
      id: 'agent' as const,
      title: 'Property Agent',
      description: 'I manage properties for multiple clients',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#136C9E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="9" cy="7" r="4" stroke="#136C9E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23 21V19C23 18.1645 22.7155 17.3541 22.2094 16.6977C21.7033 16.0413 20.9999 15.5714 20.2 15.36" stroke="#136C9E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#136C9E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      features: [
        'Multi-client property management',
        'Advanced reporting tools',
        'Team collaboration features',
        'White-label options'
      ],
      badge: 'Professional'
    }
  ];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    onRoleSelected(role);
  };

  const handleContinue = () => {
    // Pass the selected role to the parent component
    if (onContinue) {
      onContinue(selectedRole);
    } else {
      // Fallback behavior
      if (selectedRole === 'landlord') {
        window.location.href = '/landlord/index.html';
      } else {
        const actionCardsSection = document.querySelector('.action-cards-section');
        if (actionCardsSection) {
          actionCardsSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.location.href = '/dashboard';
        }
      }
    }
    
    // Close the popup
    onRoleSelected(selectedRole);
  };

  // Render welcome page first
  if (currentPage === 'welcome') {
    return <WelcomePage onGetStarted={handleGetStarted} />;
  }

  // Render role selection page
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
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {/* Back Button */}
          <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
            <button
              onClick={handleBackToWelcome}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#6B7280',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
                e.currentTarget.style.borderColor = '#D1D5DB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
          </div>

          <h2 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#374957',
            marginBottom: '1rem',
            fontFamily: 'Archivo, sans-serif'
          }}>
            What best describes you?
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: '#6B7280',
            marginBottom: '1rem'
          }}>
            Help us customize your experience by selecting your role
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {roles.map((role) => (
            <div
              key={role.id}
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                border: selectedRole === role.id ? '2px solid #136C9E' : '1px solid #E5E7EB',
                boxShadow: selectedRole === role.id ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}
              onClick={() => handleRoleSelect(role.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                if (selectedRole !== role.id) {
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '0.5rem',
                    backgroundColor: role.id === 'landlord' ? '#FFE5D9' : '#E6F3FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    {role.icon}
                  </div>
                  <div>
                    <h3 style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#374957',
                      margin: 0
                    }}>
                      {role.title}
                      <span style={{
                        backgroundColor: '#F3F4F6',
                        color: '#6B7280',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {role.badge}
                      </span>
                    </h3>
                    <p style={{
                      color: '#6B7280',
                      fontSize: '0.875rem',
                      margin: '0.25rem 0 0 0'
                    }}>
                      {role.description}
                    </p>
                  </div>
                </div>
                {selectedRole === role.id && (
                  <div style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '50%',
                    backgroundColor: 'transparent',
                    border: '1px solid #136C9E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#136C9E',
                    fontSize: '0.875rem'
                  }}>
                    ✓
                  </div>
                )}
              </div>

              <div>
                <p style={{
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem',
                  color: '#374957'
                }}>
                  Key features:
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {role.features.map((feature, index) => (
                    <li key={index} style={{
                      fontSize: '0.875rem',
                      color: '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem'
                    }}>
                      <div style={{
                        width: '0.25rem',
                        height: '0.25rem',
                        backgroundColor: '#DC5F12',
                        borderRadius: '50%',
                        flexShrink: 0
                      }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleContinue}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 3rem',
              minHeight: '3.5rem',
              borderRadius: '9999px',
              backgroundColor: '#DC5F12',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              minWidth: '250px',
              background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B1A 0%, #DC5F12 100%)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 95, 18, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
          >
            Continue as {selectedRole === 'landlord' ? 'Landlord' : 'Property Agent'}
          </button>
        </div>
      </div>
    </div>
  );
};

export { RoleSelectionPopup };
