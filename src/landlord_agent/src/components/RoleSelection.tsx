import React from 'react';
import { trackEvent } from '../../../utils/analytics';
import { UserRole } from '../App';
import proptiiLogo from '../assets/proptii_logo_small.png';

interface RoleSelectionProps {
  selectedRole: UserRole;
  onRoleSelect: (role: UserRole) => void;
  onContinue: () => void;
}

export function RoleSelection({ onRoleSelect, onContinue }: RoleSelectionProps) {
  const handleSelectRole = (role: UserRole) => {
    onRoleSelect(role);
    trackEvent('landlord_role_selected', { role });
    // Small delay to allow visual feedback and state update
    setTimeout(() => {
      onContinue();
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F8FAFC', fontFamily: 'Archivo, sans-serif' }}>
      <div className="max-w-5xl mx-auto w-full flex flex-col items-center">
        {/* Header Section */}
        <div className="text-center mb-10 w-full flex flex-col items-center">
          <img src={proptiiLogo} alt="proptii" className="h-8 mb-6" />
          <h1 className="font-semibold mb-3 text-3xl md:text-4xl lg:text-5xl" style={{ color: '#030712', letterSpacing: '-0.02em' }}>
            Refining the way you<br/>experience property.
          </h1>
          <p className="text-sm md:text-base max-w-lg mt-2" style={{ color: '#364153' }}>
            Select your profile to personalize your dashboard and tools.<br/>This can be updated later in your account settings
          </p>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          
          {/* Tenant Card */}
          <div className="relative rounded-3xl overflow-hidden shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md cursor-pointer group" 
               style={{ backgroundColor: '#CBE6FF', minHeight: '400px' }}
               onClick={() => handleSelectRole('tenant' as any)}>
            <div className="p-8 pb-32 md:pb-8 flex flex-col h-full relative z-10 w-3/4">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider" 
                      style={{ border: '1px solid #8FCDFF', color: '#030712' }}>
                  RESIDENTIAL / EXPLORER
                </span>
              </div>
              
              <h2 className="text-3xl font-semibold mb-4" style={{ color: '#030712' }}>Find a home</h2>
              
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#364153' }}>
                Browse verified listings, schedule seamless viewings, and manage your rental agreements in one unified interface.
              </p>
              
              <div className="flex gap-6 mb-8">
                <div>
                  <div className="font-bold text-lg" style={{ color: '#030712' }}>5k+</div>
                  <div className="text-xs" style={{ color: '#364153' }}>live listings</div>
                </div>
                <div>
                  <div className="font-bold text-lg" style={{ color: '#030712' }}>0%</div>
                  <div className="text-xs" style={{ color: '#364153' }}>platform fees</div>
                </div>
              </div>
              
              <div className="mt-auto">
                <button className="bg-white rounded-full px-5 py-2 text-sm font-medium flex items-center gap-2 transition-colors"
                        style={{ color: '#030712' }}>
                  Tenant Dashboard <span className="text-lg leading-none transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>
            
            <img 
              src="/tenant-role.png" 
              alt="Tenant Homes" 
              className="absolute bottom-0 right-0 w-48 md:w-56 lg:w-64 object-cover rounded-tl-3xl rounded-br-3xl"
              style={{ objectPosition: 'center', height: '65%' }}
            />
          </div>

          {/* Landlord Card */}
          <div className="relative rounded-3xl overflow-hidden shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md cursor-pointer group" 
               style={{ backgroundColor: '#FFEFD4', minHeight: '400px' }}
               onClick={() => handleSelectRole('landlord')}>
            <div className="p-8 pb-32 md:pb-8 flex flex-col h-full relative z-10 w-3/4">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider" 
                      style={{ border: '1px solid #FEDFA0', color: '#030712' }}>
                  MANAGEMENT / SCALE
                </span>
              </div>
              
              <h2 className="text-3xl font-semibold mb-4" style={{ color: '#030712' }}>Manage assets</h2>
              
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#364153' }}>
                List properties, handle tenancy applications, collect references, and manage your portfolio from one dashboard
              </p>
              
              <div className="flex gap-6 mb-8">
                <div>
                  <div className="font-bold text-lg" style={{ color: '#030712' }}>Enterprise</div>
                  <div className="text-xs" style={{ color: '#364153' }}>grade</div>
                </div>
                <div>
                  <div className="font-bold text-lg" style={{ color: '#030712' }}>Real-time</div>
                  <div className="text-xs" style={{ color: '#364153' }}>analytics</div>
                </div>
              </div>
              
              <div className="mt-auto">
                <button className="bg-white rounded-full px-5 py-2 text-sm font-medium flex items-center gap-2 transition-colors"
                        style={{ color: '#030712' }}>
                  Landlord/Agent Dashboard <span className="text-lg leading-none transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>
            
            <img 
              src="/landlord-role.png" 
              alt="Landlord Assets" 
              className="absolute bottom-0 right-0 w-48 md:w-56 lg:w-64 object-cover rounded-tl-3xl rounded-br-3xl"
              style={{ objectPosition: 'center', height: '65%' }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}