import React, { useState } from 'react';

type UserRole = 'landlord' | 'agent';

interface RoleSelectionPopupProps {
  isOpen: boolean;
  onRoleSelected: (role: UserRole) => void;
  onContinue?: (role: UserRole) => void;
}

const RoleSelectionPopup: React.FC<RoleSelectionPopupProps> = ({ isOpen, onRoleSelected, onContinue }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('landlord');

  if (!isOpen) return null;

  const roles = [
    {
      id: 'landlord' as const,
      title: 'Landlord',
      description: 'I own and manage my own properties',
      icon: '🏠',
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
      icon: '👥',
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
        padding: '2rem',
        maxWidth: '56rem',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button style={{
              padding: '0.25rem',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.25rem'
            }}>
              ❓
            </button>
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#374957',
              color: 'white',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              maxWidth: '20rem',
              marginBottom: '0.5rem',
              opacity: 0,
              pointerEvents: 'none',
              transition: 'opacity 0.2s'
            }}>
              <p><strong>Landlord:</strong> Individual property owners managing their own rentals</p>
              <p style={{ marginTop: '0.5rem' }}><strong>Agent:</strong> Professional property managers handling multiple clients</p>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
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
                    backgroundColor: '#FFE5D9',
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
