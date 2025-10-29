import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Wifi, Car, Dog, Dumbbell, Waves, TreePine, Shield, Utensils, WashingMachine, Check } from 'lucide-react';
import { ProgressTracker } from './ProgressTracker';

interface AmenitiesSelectionProps {
  selectedAmenities?: string[];
  onAmenitiesChange?: (amenities: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  onHome: () => void;
  onPropertySetup: () => void;
}

export function AmenitiesSelection({ selectedAmenities: propSelectedAmenities, onAmenitiesChange, onNext, onBack, onHome, onPropertySetup }: AmenitiesSelectionProps) {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(propSelectedAmenities || []);
  
  // Update local state when prop changes
  useEffect(() => {
    if (propSelectedAmenities) {
      setSelectedAmenities(propSelectedAmenities);
    }
  }, [propSelectedAmenities]);
  
  // Progress tracker steps
  const progressSteps = [
    { id: 'type', title: 'Property Type', completed: true, active: false },
    { id: 'details', title: 'Property Details', completed: true, active: false },
    { id: 'amenities', title: 'Amenities', completed: false, active: true },
    { id: 'images', title: 'Images & Notes', completed: false, active: false },
    { id: 'preview', title: 'Preview & Publish', completed: false, active: false }
  ];

  const amenities = [
    { id: 'wifi', name: 'WiFi', icon: Wifi },
    { id: 'parking', name: 'Parking', icon: Car },
    { id: 'pet-friendly', name: 'Pet Friendly', icon: Dog },
    { id: 'gym', name: 'Gym', icon: Dumbbell },
    { id: 'pool', name: 'Swimming Pool', icon: Waves },
    { id: 'garden', name: 'Garden', icon: TreePine },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'kitchen', name: 'Kitchen', icon: Utensils },
    { id: 'washing-machine', name: 'Washing Machine', icon: WashingMachine }
  ];

  const toggleAmenity = (amenityId: string) => {
    const newAmenities = selectedAmenities.includes(amenityId) 
      ? selectedAmenities.filter(id => id !== amenityId)
      : [...selectedAmenities, amenityId];
    
    setSelectedAmenities(newAmenities);
    
    // Notify parent component
    if (onAmenitiesChange) {
      onAmenitiesChange(newAmenities);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-4" style={{ backgroundColor: '#F7F7F7', fontFamily: 'Archivo, sans-serif' }}>
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        {/* Main Content Area */}
        <div className="w-full py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-12 px-4">
            <div className="flex items-center space-x-4">
              <img 
                src="./images/proptii-logo.png" 
                alt="Proptii Logo" 
                className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onHome}
              />
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="rounded-full px-4 py-2">
                Questions?
              </Button>
              <Button variant="outline" className="rounded-full px-4 py-2">
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
              currentStep={3}
              totalSteps={5}
            />
          </div>

          {/* Amenities Section Header */}
          <div className="text-left mb-8 px-4 py-6" style={{ 
            backgroundImage: 'url("./add_prp_slide/property_amenities background.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            border: '4px solid white',
            borderRadius: '20px'
          }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#374957' }}>Amenities</h2>
            <p style={{ color: '#374957' }}>Select the amenities available at your property</p>
          </div>

          {/* Main Content */}
          <div className="max-w-6xl mx-auto">
            
            {/* Amenities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {amenities.map((amenity) => {
              const IconComponent = amenity.icon;
              const isSelected = selectedAmenities.includes(amenity.id);
              
              return (
                <Button
                  key={amenity.id}
                  variant="outline"
                  className={`flex flex-col items-start justify-between space-y-2 border-2 transition-all duration-300 relative ${
                    isSelected 
                      ? '' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{
                    height: '112px',
                    paddingTop: '32px',
                    paddingBottom: '40px',
                    paddingLeft: '32px',
                    paddingRight: '32px',
                    ...(isSelected ? {
                      backgroundColor: '#EEF9FF',
                      borderColor: '#136C9E'
                    } : {})
                  }}
                  onClick={() => toggleAmenity(amenity.id)}
                >
                  <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center`}
                  style={isSelected ? {
                    backgroundColor: '#136C9E'
                  } : {
                    backgroundColor: '#F7F7F7'
                  }}>
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <IconComponent className="w-6 h-6 text-gray-700" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 text-sm">{amenity.name}</div>
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
            <span>Review Property Details</span>
          </Button>

          <Button 
            onClick={onNext}
            className="px-6 py-3 rounded-full text-white transition-all duration-300"
            style={{ 
              backgroundColor: '#DC5F12',
              background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              height: '48px',
              minHeight: '48px'
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
            Proceed to Images & Notes
          </Button>
        </div>
      </div>
    </div>
  );
}
