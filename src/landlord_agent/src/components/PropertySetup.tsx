import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { MapPin, Home, BedDouble, PoundSterling, AlertCircle, Save, ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react';
import { Property } from '../App';
import { trackEvent } from '../../../utils/analytics';

interface PropertySetupProps {
  property?: Property | null;
  onPropertyComplete: (property: Omit<Property, 'id' | 'createdAt'>) => Promise<void>;
  onSkip: () => void;
  onBack: () => void;
}

export function PropertySetup({ property, onPropertyComplete, onSkip, onBack }: PropertySetupProps) {
  const [formData, setFormData] = useState({
    address: property?.address || '',
    type: property?.type || '',
    bedrooms: property?.bedrooms || 1,
    rent: property?.rent?.toString() || '',
    status: property?.status || 'vacant' as const,
    amenities: property?.amenities || [] as string[],
    notes: property?.notes || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDraft, setIsDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const propertyTypes = [
    'Flat/Apartment',
    'House',
    'Studio',
    'Room in shared house',
    'Commercial',
    'Other'
  ];

  const availableAmenities = [
    'Parking',
    'Garden',
    'Balcony',
    'Furnished',
    'Pet-friendly',
    'Gym',
    'Swimming Pool',
    'Central Heating',
    'Air Conditioning',
    'Fireplace',
    'Dishwasher',
    'Washing Machine',
    'High-speed Internet'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.address.trim()) {
      newErrors.address = 'Property address is required';
    }

    if (!formData.type) {
      newErrors.type = 'Property type is required';
    }

    if (!formData.rent || Number(formData.rent) <= 0) {
      newErrors.rent = 'Valid rent amount is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        const propertyData = {
          address: formData.address,
          type: formData.type,
          bedrooms: formData.bedrooms,
          rent: Number(formData.rent),
          status: formData.status,
          amenities: formData.amenities,
          notes: formData.notes,
          photos: property?.photos || [],
          documents: property?.documents || []
        };
        await onPropertyComplete(propertyData);
        trackEvent('landlord_property_saved', { is_edit: !!property });
      } catch (error) {
        console.error('Error submitting property:', error);
        setErrors({ submit: 'Failed to save property. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const saveDraft = () => {
    setIsDraft(true);
    // Auto-save logic would go here
    setTimeout(() => setIsDraft(false), 2000);
  };

  return (
    <div className="min-h-screen py-4 md:py-8 px-4" style={{ backgroundColor: '#F7F7F7' }}>
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <div className="mb-4 md:mb-6">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center space-x-1 rounded-full border-gray-300 hover:border-gray-400 transition-colors bg-transparent hover:bg-gray-50 px-4 md:px-8 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
        </div>

        {/* Header with background image - hidden on mobile */}
        <div className="hidden md:block text-left mb-8 p-8 rounded-xl" style={{ 
          backgroundImage: 'url(/src/assets/add_property_background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}>
          <h1 className="mb-2 font-bold text-2xl text-white">{property ? 'Edit Property' : 'Add Your First Property'}</h1>
          <p className="text-white">
            Let's get your property portfolio started with some basic information
          </p>
        </div>

        {/* Mobile header without background image */}
        <div className="md:hidden text-left mb-6">
          <h1 className="mb-2 font-bold text-xl" style={{ color: '#374957' }}>{property ? 'Edit Property' : 'Add Your First Property'}</h1>
          <p className="text-sm text-muted-foreground">
            Let's get your property portfolio started with some basic information
          </p>
        </div>

        <Card className="p-4 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            {/* Property Address */}
            <div className="space-y-2">
              <Label htmlFor="address" style={{ color: '#374957' }}>Property Address *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="address"
                  type="text"
                  placeholder="Enter full property address"
                  className="pl-10"
                  style={{ 
                    '--tw-ring-color': '#DDE4FF',
                    '--tw-border-opacity': '1'
                  } as React.CSSProperties & { '--tw-ring-color': string }}
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
              {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
            </div>

            {/* Property Type & Bedrooms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="type" style={{ color: '#374957' }}>Property Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Home className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Select property type" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bedrooms" style={{ color: '#374957' }}>Bedrooms</Label>
                <Select 
                  value={formData.bedrooms.toString()} 
                  onValueChange={(value) => handleInputChange('bedrooms', Number(value))}
                >
                  <SelectTrigger>
                    <div className="flex items-center">
                      <BedDouble className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num === 0 ? 'Studio' : `${num} bedroom${num > 1 ? 's' : ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rent & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="rent" style={{ color: '#374957' }}>Monthly Rent (£) *</Label>
                <div className="relative">
                  <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="rent"
                    type="number"
                    placeholder="0"
                    className="pl-10"
                    style={{ 
                      '--tw-ring-color': '#DDE4FF',
                      '--tw-border-opacity': '1'
                    } as React.CSSProperties & { '--tw-ring-color': string }}
                    value={formData.rent}
                    onChange={(e) => handleInputChange('rent', e.target.value)}
                  />
                </div>
                {errors.rent && <p className="text-sm text-destructive">{errors.rent}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" style={{ color: '#374957' }}>Occupancy Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacant">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                        Vacant
                      </div>
                    </SelectItem>
                    <SelectItem value="occupied">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        Occupied
                      </div>
                    </SelectItem>
                    <SelectItem value="under-renovation">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                        Under Renovation
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-4">
              <Label style={{ color: '#374957' }}>Amenities (Optional)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {availableAmenities.map(amenity => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={() => handleAmenityToggle(amenity)}
                    />
                    <Label htmlFor={amenity} className="text-sm cursor-pointer" style={{ color: 'rgba(55, 73, 87, 0.8)' }}>
                      {amenity}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {formData.amenities.map(amenity => (
                    <Badge key={amenity} variant="secondary" className="px-3 py-1">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Property Images */}
            <div className="space-y-2">
              <Label style={{ color: '#374957' }}>Property Images (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Click to upload images</p>
                <p className="text-xs text-gray-500">PNG, JPG up to 10MB each</p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ImageIcon className="w-4 h-4" />
                <span>Add photos to showcase your property</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" style={{ color: '#374957' }}>Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information about the property..."
                className="min-h-[100px] resize-none"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span>{errors.submit}</span>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-6 border-t">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveDraft}
                  disabled={isDraft}
                  className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                  <Save className="w-4 h-4" />
                  <span>{isDraft ? 'Saved!' : 'Save Draft'}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onSkip}
                  className="w-full sm:w-auto"
                >
                  Skip for now
                </Button>
              </div>
              
              <Button 
                type="submit" 
                size="lg"
                disabled={isSubmitting}
                className="transition-all duration-300 w-full sm:w-auto"
                style={{ 
                  backgroundColor: '#DC5F12', 
                  borderColor: '#DC5F12',
                  background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B1A 0%, #DC5F12 100%)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 95, 18, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0px)';
                }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  property ? 'Save Changes' : 'Add Property'
                )}
              </Button>
            </div>
          </form>
        </Card>

        <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-xl" style={{ backgroundColor: '#EEF9FF', border: '1px solid #AACBFF' }}>
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 mt-0.5" style={{ color: '#136C9E' }} />
            <div>
              <p className="text-xs md:text-sm" style={{ color: 'rgba(55, 73, 87, 0.8)' }}>
                <strong style={{ color: '#136C9E' }}>Don't worry!</strong><br />
                You can always edit these details later and add photos, documents, and tenant information as you go.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}