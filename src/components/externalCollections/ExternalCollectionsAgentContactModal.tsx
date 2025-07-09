import React, { useState } from 'react';
import { X, Phone, Mail, User, MessageSquare, Clock } from 'lucide-react';
import { ExternalCollectedProperty, ExternalCollectionsAgentContactRequest } from '../../types/externalCollections';
import FeatureGate from '../common/FeatureGate';
import { EXTERNAL_COLLECTIONS_FEATURES } from '../../config/featureFlags';

interface ExternalCollectionsAgentContactModalProps {
  property: ExternalCollectedProperty | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ExternalCollectionsAgentContactRequest) => void;
}

const ExternalCollectionsAgentContactModal: React.FC<ExternalCollectionsAgentContactModalProps> = ({
  property,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    preferredContactMethod: 'email' as 'email' | 'phone' | 'both'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!property) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const request: ExternalCollectionsAgentContactRequest = {
        propertyId: property.id,
        agentId: property.agent.name, // Using name as agent ID for mock
        contactInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          message: formData.message || undefined,
        },
        preferredContactMethod: formData.preferredContactMethod,
      };

      await onSubmit(request);
      setSubmitStatus('success');
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: '',
          preferredContactMethod: 'email'
        });
        setSubmitStatus('idle');
        onClose();
      }, 2000);

    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        preferredContactMethod: 'email'
      });
      setSubmitStatus('idle');
      onClose();
    }
  };

  if (!isOpen || !property) return null;

  return (
    <FeatureGate externalCollectionsFeature={EXTERNAL_COLLECTIONS_FEATURES.ENABLE_CONTACT}>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Contact Agent</h2>
              <p className="text-sm text-gray-600 mt-1">
                {property.agent.name} • {property.agent.company}
              </p>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              aria-label="Close"
              onClick={handleClose}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Property Info */}
          <div className="p-6 border-b bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-2">{property.title}</h3>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{property.location.address}, {property.location.city}</span>
              <span className="font-semibold text-primary">{property.price.display}</span>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  id="contact-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  id="contact-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your email address"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  id="contact-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your phone number"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Preferred Contact Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Contact Method
              </label>
              <div className="space-y-2">
                {[
                  { value: 'email', label: 'Email', icon: Mail },
                  { value: 'phone', label: 'Phone', icon: Phone },
                  { value: 'both', label: 'Both', icon: MessageSquare }
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="preferredContactMethod"
                      value={option.value}
                      checked={formData.preferredContactMethod === option.value}
                      onChange={(e) => handleInputChange('preferredContactMethod', e.target.value)}
                      disabled={isSubmitting}
                      className="mr-2"
                    />
                    <option.icon className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
                Message *
              </label>
              <textarea
                id="contact-message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Tell the agent about your interest in this property..."
                disabled={isSubmitting}
              />
            </div>

            {/* Agent Contact Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{property.agent.name}</h4>
                  <p className="text-sm text-gray-600">{property.agent.company}</p>
                  {property.agent.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" />
                      {property.agent.phone}
                    </p>
                  )}
                  {property.agent.email && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {property.agent.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Response Time Info */}
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
              <Clock className="w-4 h-4" />
              <span>Agents typically respond within 24 hours</span>
            </div>

            {/* Submit Status */}
            {submitStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <span className="font-medium">Message sent successfully!</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  The agent will contact you soon.
                </p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <span className="font-medium">Failed to send message</span>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  Please try again or contact the agent directly.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.name || !formData.email}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </FeatureGate>
  );
};

export default ExternalCollectionsAgentContactModal; 