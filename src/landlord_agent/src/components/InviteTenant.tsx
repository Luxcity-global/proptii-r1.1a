import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Property } from '../App';

interface InviteTenantProps {
  properties: Property[];
  onBack: () => void;
  onSuccess: () => void;
}

interface InvitationData {
  email: string;
  propertyId: string;
  customMessage: string;
  inviteType: 'new-tenant' | 'existing-tenant';
}

export function InviteTenant({ properties, onBack, onSuccess }: InviteTenantProps) {
  const [formData, setFormData] = useState<InvitationData>({
    email: '',
    propertyId: '',
    customMessage: '',
    inviteType: 'new-tenant'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof InvitationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.propertyId) {
      newErrors.propertyId = 'Please select a property';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendInvitation = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Mock email sending - in real implementation, this would call your email service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success
      console.log('Sending invitation email:', {
        to: formData.email,
        property: properties.find(p => p.id === formData.propertyId)?.address,
        message: formData.customMessage,
        type: formData.inviteType
      });
      
      setIsSuccess(true);
      
      // Auto redirect after 3 seconds
      setTimeout(() => {
        onSuccess();
      }, 3000);
      
    } catch (error) {
      console.error('Failed to send invitation:', error);
      setErrors({ general: 'Failed to send invitation. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProperty = properties.find(p => p.id === formData.propertyId);

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F7F7F7', fontFamily: 'Archivo, sans-serif' }}>
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#374957' }}>
              Invitation Sent!
            </h2>
            <p className="text-gray-600 mb-6">
              An invitation email has been sent to <strong>{formData.email}</strong>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm text-blue-800">
                    The tenant will receive a verification request to confirm they are occupying 
                    <strong> {selectedProperty?.address}</strong>
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Redirecting you back to the tenant list...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-4" style={{ backgroundColor: '#F7F7F7', fontFamily: 'Archivo, sans-serif' }}>
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 px-4 pt-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img 
              src="./images/proptii-logo.png" 
              alt="Proptii Logo" 
              className="h-8 w-auto"
            />
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="rounded-full px-4 py-2">
              Questions?
            </Button>
            <Button variant="outline" className="rounded-full px-4 py-2">
              Save & exit
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#DC5F12' }}>
                <Mail className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4" style={{ color: '#374957' }}>
              Invite Tenant via Email
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Send an invitation email to the tenant to complete their profile
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Invitation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{errors.general}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tenant@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="property">Assign to Property *</Label>
                  <Select value={formData.propertyId} onValueChange={(value) => handleInputChange('propertyId', value)}>
                    <SelectTrigger className={errors.propertyId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.propertyId && <p className="text-red-500 text-sm">{errors.propertyId}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inviteType">Invitation Type</Label>
                  <Select value={formData.inviteType} onValueChange={(value: 'new-tenant' | 'existing-tenant') => handleInputChange('inviteType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new-tenant">New Tenant Registration</SelectItem>
                      <SelectItem value="existing-tenant">Existing Tenant Assignment</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    {formData.inviteType === 'new-tenant' 
                      ? 'For tenants who need to create a new account'
                      : 'For tenants who already have an account on the platform'
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Custom Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Add a personal message to the invitation..."
                    value={formData.customMessage}
                    onChange={(e) => handleInputChange('customMessage', e.target.value)}
                    rows={4}
                  />
                  <p className="text-sm text-gray-500">
                    This message will be included in the invitation email
                  </p>
                </div>

                {/* Preview */}
                {selectedProperty && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Email Preview:</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>To:</strong> {formData.email}</p>
                      <p><strong>Subject:</strong> Invitation to join as tenant for {selectedProperty.address}</p>
                      <p><strong>Property:</strong> {selectedProperty.address}</p>
                      {formData.customMessage && (
                        <p><strong>Message:</strong> {formData.customMessage}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button 
                onClick={handleSendInvitation}
                disabled={isLoading}
                className="px-8"
                style={{ backgroundColor: '#DC5F12', borderColor: '#DC5F12' }}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InviteTenant;
