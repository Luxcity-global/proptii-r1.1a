import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Mail, Send, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { Property } from '../App';
import axios from 'axios';

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

  const generateInvitationEmailHTML = (property: Property | undefined) => {
    const propertyAddress = property?.address || 'the property';
    const invitationTypeText = formData.inviteType === 'new-tenant' 
      ? 'create a new account and complete your tenant profile'
      : 'complete your tenant profile';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap');
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #E6F2F8;
          }
          .header {
            background-color: #E6F2F8;
            color: #136C9E;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-family: 'Archivo', sans-serif;
            color: #136C9E;
            font-weight: 600;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .property-info {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #136C9E;
          }
          .property-info h3 {
            margin-top: 0;
            color: #374957;
          }
          .custom-message {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            font-style: italic;
            border-left: 3px solid #136C9E;
          }
          .cta-button {
            display: inline-block;
            background-color: #DC5F12;
            color: white !important;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 50px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 0.9em;
            color: #666;
            text-align: center;
          }
          .footer-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 16px;
          }
          .footer-logo img {
            height: 40px;
            margin-right: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Tenant Invitation</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          
          <p>You have been invited to ${invitationTypeText} on Proptii.</p>
          
          <div class="property-info">
            <h3>Property Details</h3>
            <p><strong>Address:</strong> ${propertyAddress}</p>
          </div>
          
          ${formData.customMessage ? `
            <div class="custom-message">
              <strong>Personal Message:</strong><br>
              ${formData.customMessage}
            </div>
          ` : ''}
          
          <p>Please click the button below to ${formData.inviteType === 'new-tenant' ? 'create your account and' : ''} complete your tenant profile:</p>
          
          <div style="text-align: center;">
            <a href="https://proptii-frontend.onrender.com/" class="cta-button">
              ${formData.inviteType === 'new-tenant' ? 'Create Account & Complete Profile' : 'Complete Your Profile'}
            </a>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>The Proptii Team</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from Proptii</p>
          <div class="footer-logo">
            <img src="https://framerusercontent.com/images/tjOUqAPA6VZNlXVDj9tqwYJ7BE.png" alt="Proptii Logo" />
          </div>
          <p style="margin-top: 10px;">
            <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions.</em>
          </p>
        </div>
      </body>
      </html>
    `;
  };

  const handleSendInvitation = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const selectedProperty = properties.find(p => p.id === formData.propertyId);
      
      if (!selectedProperty) {
        throw new Error('Selected property not found');
      }

      // Determine API base URL
      const API_BASE_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'
        : 'https://proptii-r1-1a-new-backend.onrender.com/api';

      // Generate email HTML
      const emailHTML = generateInvitationEmailHTML(selectedProperty);
      const emailSubject = `Invitation to join as tenant for ${selectedProperty.address}`;

      // Send email via API
      const response = await axios.post(
        `${API_BASE_URL}/email/send`,
        {
          to: formData.email,
          subject: emailSubject,
          html: emailHTML
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to send email');
      }

      console.log('Invitation email sent successfully:', response.data.messageId);
      
      setIsSuccess(true);
      
      // Auto redirect after 3 seconds
      setTimeout(() => {
        onSuccess();
      }, 3000);
      
    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      
      let errorMessage = 'Failed to send invitation. Please try again.';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          errorMessage = 'Cannot connect to email server. Please ensure the backend is running.';
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setErrors({ general: errorMessage });
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
              src="/images/proptii-logo.png" 
              alt="Proptii Logo" 
              className="h-8 w-auto"
            />
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

                {/* Invitation Type field hidden per user request */}
                {/* <div className="space-y-2">
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
                </div> */}

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
                className="flex items-center space-x-0 px-12 py-3 min-h-[3.5rem] rounded-full transition-all duration-300 flex-shrink-0 w-auto"
                style={{ 
                  backgroundColor: '#DC5F12', 
                  borderColor: '#DC5F12', 
                  minWidth: '180px',
                  background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B1A 0%, #DC5F12 100%)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 95, 18, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0px)';
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" strokeWidth={2.5} />
                    <span>Send Invitation</span>
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
