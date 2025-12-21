import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { X, User } from 'lucide-react';
import { Guest } from '../App';

interface AddGuestProps {
  propertyAddress?: string;
  onSave: (guest: Guest) => void;
  onCancel: () => void;
  initialGuest?: Guest | null;
  isOpen: boolean;
}

export function AddGuest({ propertyAddress, onSave, onCancel, initialGuest, isOpen }: AddGuestProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    numberOfGuests: '1',
    notes: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    hasEmergencyContact: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialGuest) {
      const formatDate = (date: Date | undefined): string => {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      setFormData({
        name: initialGuest.name || '',
        email: initialGuest.email || '',
        phone: initialGuest.phone || '',
        checkIn: formatDate(initialGuest.checkIn),
        checkOut: formatDate(initialGuest.checkOut),
        numberOfGuests: initialGuest.numberOfGuests?.toString() || '1',
        notes: initialGuest.notes || '',
        emergencyContactName: initialGuest.emergencyContact?.name || '',
        emergencyContactPhone: initialGuest.emergencyContact?.phone || '',
        emergencyContactRelationship: initialGuest.emergencyContact?.relationship || '',
        hasEmergencyContact: !!initialGuest.emergencyContact?.name
      });
    } else {
      // Reset form when opening for new guest
      setFormData({
        name: '',
        email: '',
        phone: '',
        checkIn: '',
        checkOut: '',
        numberOfGuests: '1',
        notes: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: '',
        hasEmergencyContact: false
      });
    }
    setErrors({});
  }, [initialGuest, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Guest name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.checkIn && formData.checkOut) {
      const checkIn = new Date(formData.checkIn);
      const checkOut = new Date(formData.checkOut);
      if (checkOut <= checkIn) {
        newErrors.checkOut = 'Check-out date must be after check-in date';
      }
    }

    if (formData.numberOfGuests && parseInt(formData.numberOfGuests) < 1) {
      newErrors.numberOfGuests = 'Number of guests must be at least 1';
    }

    if (formData.hasEmergencyContact) {
      if (!formData.emergencyContactName.trim()) {
        newErrors.emergencyContactName = 'Emergency contact name is required';
      }
      if (!formData.emergencyContactPhone.trim()) {
        newErrors.emergencyContactPhone = 'Emergency contact phone is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const guestData: Guest = {
      id: initialGuest?.id || `guest-${Date.now()}`,
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      checkIn: formData.checkIn ? new Date(formData.checkIn) : undefined,
      checkOut: formData.checkOut ? new Date(formData.checkOut) : undefined,
      numberOfGuests: formData.numberOfGuests ? parseInt(formData.numberOfGuests) : undefined,
      notes: formData.notes || undefined,
      emergencyContact: formData.hasEmergencyContact && formData.emergencyContactName
        ? {
            name: formData.emergencyContactName,
            phone: formData.emergencyContactPhone,
            relationship: formData.emergencyContactRelationship || undefined
          }
        : undefined
    };

    onSave(guestData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ top: '90%', transform: 'translate(-50%, -50%)' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {initialGuest ? 'Edit Guest' : 'Add Guest'}
          </DialogTitle>
          {propertyAddress && (
            <p className="text-sm text-gray-600 mt-1">Property: {propertyAddress}</p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Guest Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Guest Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
              placeholder="Enter full name"
              required
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={errors.email ? 'border-red-500' : ''}
              placeholder="guest@example.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+44 7911 123456"
            />
          </div>

          {/* Check-in and Check-out Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkIn">Check-in Date</Label>
              <Input
                id="checkIn"
                type="date"
                value={formData.checkIn}
                onChange={(e) => handleInputChange('checkIn', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkOut">Check-out Date</Label>
              <Input
                id="checkOut"
                type="date"
                value={formData.checkOut}
                onChange={(e) => handleInputChange('checkOut', e.target.value)}
                min={formData.checkIn || undefined}
                className={errors.checkOut ? 'border-red-500' : ''}
              />
              {errors.checkOut && (
                <p className="text-sm text-red-500">{errors.checkOut}</p>
              )}
            </div>
          </div>

          {/* Number of Guests */}
          <div className="space-y-2">
            <Label htmlFor="numberOfGuests">Number of Guests</Label>
            <Input
              id="numberOfGuests"
              type="number"
              min="1"
              value={formData.numberOfGuests}
              onChange={(e) => handleInputChange('numberOfGuests', e.target.value)}
              className={errors.numberOfGuests ? 'border-red-500' : ''}
            />
            {errors.numberOfGuests && (
              <p className="text-sm text-red-500">{errors.numberOfGuests}</p>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasEmergencyContact"
                checked={formData.hasEmergencyContact}
                onChange={(e) => handleInputChange('hasEmergencyContact', e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="hasEmergencyContact" className="cursor-pointer">
                Add Emergency Contact
              </Label>
            </div>

            {formData.hasEmergencyContact && (
              <div className="ml-6 space-y-3 pt-2 border-l-2 border-gray-200 pl-4">
                <div>
                  <Label htmlFor="emergencyContactName">Contact Name</Label>
                  <Input
                    id="emergencyContactName"
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                    className={errors.emergencyContactName ? 'border-red-500' : ''}
                    placeholder="Contact name"
                  />
                  {errors.emergencyContactName && (
                    <p className="text-sm text-red-500">{errors.emergencyContactName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                  <Input
                    id="emergencyContactPhone"
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                    className={errors.emergencyContactPhone ? 'border-red-500' : ''}
                    placeholder="Phone number"
                  />
                  {errors.emergencyContactPhone && (
                    <p className="text-sm text-red-500">{errors.emergencyContactPhone}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                  <Input
                    id="emergencyContactRelationship"
                    type="text"
                    value={formData.emergencyContactRelationship}
                    onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                    placeholder="e.g., Spouse, Friend"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional information about the guest..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {initialGuest ? 'Update Guest' : 'Add Guest'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
