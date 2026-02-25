import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Home, Building2, Users, Briefcase, HelpCircle, Check, Info } from 'lucide-react';
import { ProgressTracker } from './ProgressTracker';

interface PropertyTypeSelectionProps {
  selectedType?: string | null;
  onTypeSelect?: (type: string) => void;
  onNext: () => void;
  onBack: () => void;
  onHome: () => void;
  onPropertySetup: () => void;
  onSaveAndExit: () => void;
}

export function PropertyTypeSelection({ selectedType: propSelectedType, onTypeSelect, onNext, onBack, onHome, onPropertySetup, onSaveAndExit }: PropertyTypeSelectionProps) {
  const [selectedType, setSelectedType] = useState<string | null>(propSelectedType || null);
  
  // Update local state when prop changes
  useEffect(() => {
    setSelectedType(propSelectedType || null);
  }, [propSelectedType]);
  
  // Progress tracker steps
  const progressSteps = [
    { id: 'type', title: 'Property Type', completed: false, active: true },
    { id: 'details', title: 'Property Details', completed: false, active: false },
    { id: 'amenities', title: 'Amenities', completed: false, active: false },
    { id: 'images', title: 'Images & Notes', completed: false, active: false },
    { id: 'preview', title: 'Preview & Publish', completed: false, active: false }
  ];

  const propertyTypes = [
    { id: 'flat', name: 'Flat/Apartment', icon: Building2, description: 'Self-contained residential unit' },
    { id: 'studio', name: 'Studio', icon: Home, description: 'Single room with kitchen and bathroom' },
    { id: 'shared', name: 'Room in shared house', icon: Users, description: 'Private room in shared accommodation' },
    { id: 'shortlet', name: 'Shortlet', icon: Home, description: 'Short-term rental property' },
    { id: 'commercial', name: 'Commercial', icon: Briefcase, description: 'Business or retail property' },
    { id: 'other', name: 'Other', icon: HelpCircle, description: 'Other property type not listed' }
  ];

  return (
    <div className="min-h-screen flex flex-col px-4" style={{ backgroundColor: '#F7F7F7', fontFamily: 'Archivo, sans-serif' }}>
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-12 px-4">
            <div className="flex items-center space-x-4">
              <img 
                src="/images/proptii-logo.png" 
                alt="Proptii Logo" 
                className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onHome}
              />
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="rounded-full px-4 py-2">
                Questions?
              </Button>
              <Button variant="outline" className="rounded-full px-4 py-2" onClick={onSaveAndExit}>
                Save & exit
              </Button>
              <Button 
                variant="outline"
                onClick={onPropertySetup}
                className="rounded-full px-4 py-2 transition-all duration-300"
                style={{ 
                  borderColor: '#DC5F12',
                  color: '#DC5F12'
                }}
              >
                Property Setup
              </Button>
            </div>
          </div>

          {/* Horizontal Progress Tracker */}
          <div className="mb-6 w-full" style={{ marginTop: '80px' }}>
            <ProgressTracker 
              steps={progressSteps}
              currentStep={1}
              totalSteps={5}
            />
          </div>

          {/* Property Type Section Header */}
          <div className="text-left mb-8 px-4 py-6" data-demo-add-property-type style={{ 
            backgroundImage: 'url("./add_prp_slide/property_type background.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            border: '4px solid white',
            borderRadius: '20px'
          }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#374957' }}>Property Type</h2>
            <p style={{ color: '#374957' }}>Choose the type of property you're adding to your portfolio</p>
          </div>


          {/* Main Content */}
          <div className="max-w-6xl mx-auto">
            
            {/* Guidance Text */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#EEF9FF' }}>
                  <Info className="w-4 h-4" style={{ color: '#136C9E' }} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#136C9E' }}>Selection Guidance</p>
                  <p className="text-sm" style={{ color: '#374957' }}>
                    You can only select <strong>one</strong> property type. Choose the option that best describes your property.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Property Type Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {propertyTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <Button
                    key={type.id}
                    variant="outline"
                    className={`flex flex-col items-start justify-center space-y-2 border-2 transition-all duration-300 relative ${
                      selectedType === type.id 
                        ? '' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{
                      height: '112px',
                      padding: '16px',
                      ...(selectedType === type.id ? {
                        backgroundColor: '#EEF9FF',
                        borderColor: '#136C9E'
                      } : {})
                    }}
                    onClick={() => {
                      setSelectedType(type.id);
                      if (onTypeSelect) {
                        onTypeSelect(type.id);
                      }
                    }}
                  >
                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center`}
                    style={selectedType === type.id ? {
                      backgroundColor: '#136C9E'
                    } : {
                      backgroundColor: '#F7F7F7'
                    }}>
                      <Check className={`w-4 h-4 ${
                        selectedType === type.id 
                          ? 'text-white' 
                          : 'text-white'
                      }`} />
                    </div>
                    <IconComponent className="w-6 h-6 text-gray-700" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 text-sm">{type.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Fixed to Bottom */}
      <div className="max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between" style={{ minHeight: '60px' }}>
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            style={{ height: '48px', minHeight: '48px' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Review Property Setup</span>
          </Button>

          <Button 
            onClick={onNext}
            disabled={!selectedType}
            className={`px-6 py-3 rounded-full transition-all duration-300 ${
              selectedType 
                ? 'text-white' 
                : 'bg-transparent text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400'
            }`}
            style={selectedType ? {
              backgroundColor: '#DC5F12',
              background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              height: '48px',
              minHeight: '48px'
            } : {
              height: '48px',
              minHeight: '48px'
            }}
            onMouseEnter={selectedType ? (e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B1A 0%, #DC5F12 100%)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 95, 18, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            } : undefined}
            onMouseLeave={selectedType ? (e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(0px)';
            } : undefined}
          >
            Proceed to Property Details
          </Button>
        </div>
      </div>
    </div>
  );
}
