/// <reference types="google.maps" />
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, MapPin, PoundSterling, Bed, Bath, Home, Upload, FileText, X, Navigation, Map } from 'lucide-react';
import { ProgressTracker } from './ProgressTracker';

interface PropertyDetailsSelectionProps {
  propertyType?: string | null;
  propertyDetails?: {
    address: string;
    monthlyRent: string;
    bedrooms: string;
    bathrooms: string;
    squareFootage: string;
    uploadedDocuments: File[];
    isForSale: boolean;
    tenureType: string;
    annualGroundRent: string;
    councilTaxBand: string;
    annualServiceCharge: string;
    // Shortlet fields
    nightlyRate?: string;
    minStay?: string;
    maxStay?: string;
  };
  onPropertyDetailsChange?: (updates: Partial<{
    address: string;
    monthlyRent: string;
    bedrooms: string;
    bathrooms: string;
    squareFootage: string;
    uploadedDocuments: File[];
    isForSale: boolean;
    tenureType: string;
    annualGroundRent: string;
    councilTaxBand: string;
    annualServiceCharge: string;
    nightlyRate?: string;
    minStay?: string;
    maxStay?: string;
  }>) => void;
  onNext: () => void;
  onBack: () => void;
  onHome: () => void;
  onPropertySetup: () => void;
  onSaveAndExit: () => void;
}

export function PropertyDetailsSelection({ propertyType, propertyDetails: propPropertyDetails, onPropertyDetailsChange, onNext, onBack, onHome, onPropertySetup, onSaveAndExit }: PropertyDetailsSelectionProps) {
  const isShortlet = propertyType === 'shortlet';
  const [propertyDetails, setPropertyDetails] = useState(propPropertyDetails || {
    address: '',
    monthlyRent: '',
    bedrooms: '',
    bathrooms: '',
    squareFootage: '',
    uploadedDocuments: [],
    isForSale: false,
    tenureType: '',
    annualGroundRent: '',
    councilTaxBand: '',
    annualServiceCharge: '',
    nightlyRate: '',
    minStay: '',
    maxStay: ''
  });
  
  // Update local state when prop changes
  useEffect(() => {
    if (propPropertyDetails) {
      setPropertyDetails(propPropertyDetails);
    }
  }, [propPropertyDetails]);
  
  const [showMap, setShowMap] = useState(false);
  const [useLocation, setUseLocation] = useState(false);
  const [mapError, setMapError] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  
  // Progress tracker steps
  const progressSteps = [
    { id: 'type', title: 'Property Type', completed: true, active: false },
    { id: 'details', title: 'Property Details', completed: false, active: true },
    { id: 'amenities', title: 'Amenities', completed: false, active: false },
    { id: 'images', title: 'Images & Notes', completed: false, active: false },
    { id: 'preview', title: 'Preview & Publish', completed: false, active: false }
  ];

  const handleInputChange = (field: string, value: string) => {
    const newPropertyDetails = {
      ...propertyDetails,
      [field]: value
    };
    setPropertyDetails(newPropertyDetails);
    
    // Notify parent component
    if (onPropertyDetailsChange) {
      onPropertyDetailsChange({ [field]: value });
    }

    // If address field is being changed, geocode it when user stops typing
    if (field === 'address' && value.trim()) {
      clearTimeout((window as any).geocodeTimeout);
      (window as any).geocodeTimeout = setTimeout(() => {
        geocodeAddress(value);
      }, 1000); // Wait 1 second after user stops typing
    }
  };

  const handleToggleForSale = (isForSale: boolean) => {
    const newPropertyDetails = {
      ...propertyDetails,
      isForSale,
      ...(isForSale
        ? {}
        : {
            tenureType: '',
            annualGroundRent: '',
            councilTaxBand: '',
            annualServiceCharge: '',
          }),
    };
    setPropertyDetails(newPropertyDetails);

    if (onPropertyDetailsChange) {
      onPropertyDetailsChange({
        isForSale,
        ...(!isForSale
          ? {
              tenureType: '',
              annualGroundRent: '',
              councilTaxBand: '',
              annualServiceCharge: '',
            }
          : {}),
      });
    }
  };

  const geocodeAddress = (address: string) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode(
      { address: address },
      (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          
          // Update map if it's visible
          if (showMap && googleMapRef.current) {
            updateMapLocation(lat, lng);
          }
        }
      }
    );
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newDocuments = Array.from(files);

      const updatedDocuments = [...propertyDetails.uploadedDocuments, ...newDocuments];
      const newPropertyDetails = { ...propertyDetails, uploadedDocuments: updatedDocuments };
      setPropertyDetails(newPropertyDetails);
      
      // Notify parent component
      if (onPropertyDetailsChange) {
        onPropertyDetailsChange({ uploadedDocuments: updatedDocuments });
      }
    }
  };

  const removeDocument = (index: number) => {
    const updatedDocuments = propertyDetails.uploadedDocuments.filter((_, i) => i !== index);
    
    // Update property details with removed documents
    const newPropertyDetails = { ...propertyDetails, uploadedDocuments: updatedDocuments };
    setPropertyDetails(newPropertyDetails);
    
    // Notify parent component
    if (onPropertyDetailsChange) {
      onPropertyDetailsChange({ uploadedDocuments: updatedDocuments });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError('Geolocation is not supported by this browser.');
      return;
    }

    setMapError('');
    setUseLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Update map location if map is visible
        if (showMap && googleMapRef.current) {
          updateMapLocation(latitude, longitude);
        }

        // Use Google Geocoding
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        setMapError('Unable to retrieve your location. Please enter address manually.');
        setUseLocation(false);
      }
    );
  };

  const reverseGeocode = (lat: number, lng: number) => {
    if (!geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
    }

    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const newAddress = results[0].formatted_address;
          const newPropertyDetails = { ...propertyDetails, address: newAddress };
          setPropertyDetails(newPropertyDetails);
          
          // Notify parent component
          if (onPropertyDetailsChange) {
            onPropertyDetailsChange({ address: newAddress });
          }
        } else {
          // Fallback: use coordinates
          const newAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          const newPropertyDetails = { ...propertyDetails, address: newAddress };
          setPropertyDetails(newPropertyDetails);
          
          // Notify parent component
          if (onPropertyDetailsChange) {
            onPropertyDetailsChange({ address: newAddress });
          }
        }
        setUseLocation(false);
      }
    );
  };

  const toggleMap = () => {
    setShowMap(!showMap);
    setMapError('');
    
    if (!showMap && mapLoaded) {
      // Initialize map when showing
      setTimeout(() => {
        initializeMap();
      }, 100);
    } else if (showMap) {
      // Clean up map when hiding
      if (googleMapRef.current) {
        googleMapRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || googleMapRef.current || !mapLoaded) return;

    try {
      // Default center (London)
      const defaultCenter = { lat: 51.505, lng: -0.09 };

      // Create Google Map
      const map = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      googleMapRef.current = map;

      // Create geocoder
      geocoderRef.current = new google.maps.Geocoder();

      // Add initial marker
      const marker = new google.maps.Marker({
        position: defaultCenter,
        map: map,
        draggable: true,
        title: 'Property Location'
      });
      markerRef.current = marker;

      // Handle map clicks to update location
      map.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        // Update marker position
        marker.setPosition(event.latLng);
        
        // Reverse geocode to get address
        reverseGeocode(lat, lng);
      });

      // Handle marker drag
      marker.addListener('dragend', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        // Reverse geocode to get address
        reverseGeocode(lat, lng);
      });

    } catch (error) {
      console.error('Failed to initialize Google Map:', error);
      setMapError('Failed to load map. Please enter address manually.');
    }
  };

  const updateMapLocation = (lat: number, lng: number) => {
    if (googleMapRef.current) {
      const newPosition = { lat, lng };
      
      // Update map center
      googleMapRef.current.setCenter(newPosition);
      
      // Update or create marker
      if (markerRef.current) {
        markerRef.current.setPosition(newPosition);
      } else {
        const marker = new google.maps.Marker({
          position: newPosition,
          map: googleMapRef.current,
          draggable: true,
          title: 'Property Location'
        });
        markerRef.current = marker;
      }
    }
  };

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCreeouNjZpNrF2-RtJNRvPM0mB2CNpU60&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      
      // Set up global callback
      (window as any).initGoogleMaps = () => {
        setMapLoaded(true);
      };

      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
        delete (window as any).initGoogleMaps;
      };
    };

    return loadGoogleMaps();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ((window as any).geocodeTimeout) {
        clearTimeout((window as any).geocodeTimeout);
      }
    };
  }, []);

  const isSaleDocsValid = !propertyDetails.isForSale || propertyDetails.uploadedDocuments.length > 0;
  const isFormValid = isShortlet
    ? propertyDetails.address &&
      propertyDetails.nightlyRate &&
      propertyDetails.bedrooms &&
      propertyDetails.bathrooms &&
      isSaleDocsValid
    : propertyDetails.address &&
      propertyDetails.monthlyRent &&
      propertyDetails.bedrooms &&
      propertyDetails.bathrooms &&
      isSaleDocsValid;

  return (
    <div className="min-h-screen flex flex-col px-4" style={{ backgroundColor: '#F7F7F7', fontFamily: 'Archivo, sans-serif' }} data-demo-add-property-details>
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
              currentStep={2}
              totalSteps={5}
            />
          </div>

          {/* Property Details Section Header */}
          <div className="text-left mb-8 px-4 py-6" style={{ 
            backgroundImage: 'url("./add_prp_slide/property_details background.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            border: '4px solid white',
            borderRadius: '20px'
          }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#374957' }}>Property Details</h2>
            <p style={{ color: '#374957' }}>Tell us about your property's key details</p>
          </div>

          {/* For Sale Toggle (beneath header) */}
          <div className="mb-8 px-4" data-demo-add-property-for-sale>
            <div className="bg-white rounded-xl p-4 flex items-center justify-between border border-gray-200">
              <div className="space-y-1">
                <p className="text-sm font-semibold" style={{ color: '#374957' }}>
                  Is this property for sale?
                </p>
                <p className="text-xs text-gray-600">
                  If yes, you'll need to upload an EPC certificate and provide sale details.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-gray-700">
                  {propertyDetails.isForSale ? 'Yes' : 'No'}
                </Label>
                <Switch
                  checked={propertyDetails.isForSale}
                  onCheckedChange={handleToggleForSale}
                  aria-label="Property is for sale"
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-6xl mx-auto">
            
            {/* Property Details Form */}
            <div className="space-y-6">
              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Property Address
                </label>
                
                {/* Location Options */}
                <div className="flex items-center space-x-3 mb-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={useLocation}
                    className="flex items-center space-x-2"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>{useLocation ? 'Getting Location...' : 'Use My Location'}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleMap}
                    className="flex items-center space-x-2"
                  >
                    <Map className="w-4 h-4" />
                    <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
                  </Button>
                </div>

                {/* Error Message */}
                {mapError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{mapError}</p>
                  </div>
                )}

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter property address"
                    value={propertyDetails.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    style={{ '--tw-ring-color': '#DDE4FF' } as React.CSSProperties & { '--tw-ring-color': string }}
                  />
                </div>

                {/* Interactive Map */}
                {showMap && (
                  <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        <Map className="w-4 h-4 text-gray-600" />
                        <p className="text-sm text-gray-700 font-medium">Interactive Map</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Click anywhere on the map to set the property location
                      </p>
                    </div>
                    <div 
                      ref={mapRef}
                      className="w-full h-64"
                      style={{ minHeight: '256px' }}
                    />
                  </div>
                )}
              </div>

              {/* Monthly Rent (Long-term) or Nightly Rate (Shortlet) */}
              {!isShortlet ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Monthly Rent
                  </label>
                  <div className="relative">
                    <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="0"
                      value={propertyDetails.monthlyRent}
                      onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      style={{ '--tw-ring-color': '#DDE4FF' } as React.CSSProperties & { '--tw-ring-color': string }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Nightly Rate
                    </label>
                    <div className="relative">
                      <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="0"
                        value={propertyDetails.nightlyRate || ''}
                        onChange={(e) => handleInputChange('nightlyRate', e.target.value)}
                        className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        style={{ '--tw-ring-color': '#DDE4FF' } as React.CSSProperties & { '--tw-ring-color': string }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Base price per night</p>
                  </div>
                  
                  {/* Minimum and Maximum Stay */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Minimum Stay (nights)
                      </label>
                      <Input
                        type="number"
                        placeholder="1"
                        value={propertyDetails.minStay || ''}
                        onChange={(e) => handleInputChange('minStay', e.target.value)}
                        className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        style={{ '--tw-ring-color': '#DDE4FF' } as React.CSSProperties & { '--tw-ring-color': string }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Maximum Stay (nights)
                      </label>
                      <Input
                        type="number"
                        placeholder="365"
                        value={propertyDetails.maxStay || ''}
                        onChange={(e) => handleInputChange('maxStay', e.target.value)}
                        className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        style={{ '--tw-ring-color': '#DDE4FF' } as React.CSSProperties & { '--tw-ring-color': string }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Bedrooms and Bathrooms Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Bedrooms
                  </label>
                  <div className="relative">
                    <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="0"
                      value={propertyDetails.bedrooms}
                      onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      style={{ '--tw-ring-color': '#DDE4FF' } as React.CSSProperties & { '--tw-ring-color': string }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Bathrooms
                  </label>
                  <div className="relative">
                    <Bath className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="0"
                      value={propertyDetails.bathrooms}
                      onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      style={{ '--tw-ring-color': '#DDE4FF' } as React.CSSProperties & { '--tw-ring-color': string }}
                    />
                  </div>
                </div>
              </div>

              {/* Square Footage */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Square Footage (Optional)
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="Enter square footage"
                    value={propertyDetails.squareFootage}
                    onChange={(e) => handleInputChange('squareFootage', e.target.value)}
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    style={{ '--tw-ring-color': '#DDE4FF' } as React.CSSProperties & { '--tw-ring-color': string }}
                  />
                </div>
              </div>

              {/* Property Documents */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Property Documents {propertyDetails.isForSale ? '(EPC required)' : '(Optional)'}
                </label>
                <div className="space-y-4">
                  {/* Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      !isSaleDocsValid ? 'border-red-400 bg-red-50/40' : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Upload property documents (lease agreements, certificates, etc.)
                      {propertyDetails.isForSale ? ' Please include the EPC certificate.' : ''}
                    </p>
                    <input
                      type="file"
                      multiple
                      onChange={handleDocumentUpload}
                      className="hidden"
                      id="document-upload"
                    />
                    <label
                      htmlFor="document-upload"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Files
                    </label>
                  </div>

                  {!isSaleDocsValid && (
                    <p className="text-sm text-red-600">
                      Please upload at least 1 document (EPC certificate required for sale properties).
                    </p>
                  )}

                  {/* Uploaded Documents List */}
                  {propertyDetails.uploadedDocuments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-900">Uploaded Documents:</h4>
                      {propertyDetails.uploadedDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                              <p className="text-xs text-gray-500">
                                {(doc.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeDocument(index)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sale Details (conditional) */}
              {propertyDetails.isForSale && (
                <div className="space-y-4 pt-2">
                  <div className="pt-2">
                    <h3 className="text-sm font-semibold text-gray-900">Sale Details</h3>
                    <p className="text-xs text-gray-600">These details help us prepare your property for sale.</p>
                  </div>

                  {/* Tenure Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Tenure Type
                    </label>
                    <Select
                      value={propertyDetails.tenureType}
                      onValueChange={(value) => handleInputChange('tenureType', value)}
                    >
                      <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select tenure type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="freehold">Freehold</SelectItem>
                        <SelectItem value="leasehold">Leasehold</SelectItem>
                        <SelectItem value="share-of-freehold">Share of Freehold</SelectItem>
                        <SelectItem value="commonhold">Commonhold</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ground Rent / Service Charge */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Ground Rent (Annual)
                      </label>
                      <div className="relative">
                        <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="number"
                          placeholder="0"
                          value={propertyDetails.annualGroundRent}
                          onChange={(e) => handleInputChange('annualGroundRent', e.target.value)}
                          className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          style={{ '--tw-ring-color': '#DDE4FF' } as React.CSSProperties & { '--tw-ring-color': string }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Service Charge (Annual)
                      </label>
                      <div className="relative">
                        <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="number"
                          placeholder="0"
                          value={propertyDetails.annualServiceCharge}
                          onChange={(e) => handleInputChange('annualServiceCharge', e.target.value)}
                          className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          style={{ '--tw-ring-color': '#DDE4FF' } as React.CSSProperties & { '--tw-ring-color': string }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Council Tax Band */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Council Tax Band
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., D"
                      value={propertyDetails.councilTaxBand}
                      onChange={(e) => handleInputChange('councilTaxBand', e.target.value)}
                      className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      style={{ '--tw-ring-color': '#DDE4FF' } as React.CSSProperties & { '--tw-ring-color': string }}
                    />
                  </div>
                </div>
              )}
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
            <span>Review Property Type</span>
          </Button>

          <Button 
            onClick={onNext}
            disabled={!isFormValid}
            className={`px-6 py-3 rounded-full transition-all duration-300 ${
              isFormValid 
                ? 'text-white' 
                : 'bg-transparent text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400'
            }`}
            style={isFormValid ? {
              backgroundColor: '#DC5F12',
              background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              height: '48px',
              minHeight: '48px'
            } : {
              height: '48px',
              minHeight: '48px'
            }}
            onMouseEnter={isFormValid ? (e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B1A 0%, #DC5F12 100%)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 95, 18, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            } : undefined}
            onMouseLeave={isFormValid ? (e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(0px)';
            } : undefined}
          >
            Proceed to Amenities
          </Button>
        </div>
      </div>
    </div>
  );
}
