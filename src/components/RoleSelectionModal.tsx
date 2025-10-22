import React, { useState } from 'react';
import { X } from 'lucide-react';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: 'landlord' | 'agent') => void;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ isOpen, onClose, onSelectRole }) => {
  const [selectedRole, setSelectedRole] = useState<'landlord' | 'agent'>('landlord');
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] px-24 py-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-8 text-center border-b border-gray-200">
          <div className="flex justify-end mb-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <h2 className="text-3xl font-bold text-[#374957] mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
            What best describes you?
          </h2>
          <p className="text-lg text-[#374957]" style={{ fontFamily: 'Archivo, sans-serif' }}>
            Help us customize your experience by selecting your role
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="p-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Landlord Card */}
            <div 
              className={`border-2 rounded-xl p-6 relative cursor-pointer hover:shadow-lg transition-all ${
                selectedRole === 'landlord' ? 'border-[#136C9E]' : 'border-gray-200'
              }`}
              onClick={() => setSelectedRole('landlord')}
            >
              {selectedRole === 'landlord' && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-[#136C9E] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l2.293 2.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-[#374957]" style={{ fontFamily: 'Archivo, sans-serif' }}>
                      Landlord
                    </h3>
                    <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
                      Popular
                    </span>
                  </div>
                  <p className="text-[#374957] mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
                    I own and manage my own properties
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[#374957] mb-3" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Key features:
                </h4>
                <ul className="space-y-2">
                  {[
                    'Personal property portfolio',
                    'Direct tenant management',
                    'Individual compliance tracking',
                    'Simple financial reporting'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-[#374957]" style={{ fontFamily: 'Archivo, sans-serif' }}>
                       <div className="w-2 h-2 bg-[#374957] rounded-full flex-shrink-0"></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Property Agent Card */}
            <div 
              className={`border-2 rounded-xl p-6 relative cursor-pointer hover:shadow-lg transition-all ${
                selectedRole === 'agent' ? 'border-[#136C9E]' : 'border-gray-200'
              }`}
              onClick={() => setSelectedRole('agent')}
            >
              {selectedRole === 'agent' && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-[#136C9E] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-[#374957]" style={{ fontFamily: 'Archivo, sans-serif' }}>
                      Property Agent
                    </h3>
                    <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
                      Professional
                    </span>
                  </div>
                  <p className="text-[#374957] mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
                    I manage properties for multiple clients
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[#374957] mb-3" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Key features:
                </h4>
                <ul className="space-y-2">
                  {[
                    'Multi-client property management',
                    'Advanced reporting tools',
                    'Team collaboration features',
                    'White-label options'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-[#374957]" style={{ fontFamily: 'Archivo, sans-serif' }}>
                       <div className="w-2 h-2 bg-[#374957] rounded-full flex-shrink-0"></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="p-8 border-t border-gray-200 text-center">
          <button
            onClick={() => onSelectRole(selectedRole)}
            className="bg-[#DC5F12] text-white px-8 py-4 rounded-full hover:bg-gradient-to-r hover:from-[#DC5F12] hover:to-[#C95200] hover:shadow-[0_12px_35px_rgba(220,95,18,0.5)] transition-all font-medium flex items-center justify-center mx-auto"
            style={{ fontFamily: 'Archivo, sans-serif' }}
          >
            Continue as {selectedRole === 'landlord' ? 'Landlord' : 'Property Agent'}
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
