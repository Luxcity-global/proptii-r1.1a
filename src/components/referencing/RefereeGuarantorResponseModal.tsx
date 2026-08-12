import React, { useState } from 'react';
import { X } from 'lucide-react';
import apiService from '../../services/api';

interface RefereeGuarantorResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  responseType: 'referee' | 'guarantor';
  applicantName?: string;
  prefilledEmail?: string;
  tenantEmail?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  consent: 'agree' | 'disagree' | '';
  reason: string;
}

const RefereeGuarantorResponseModal: React.FC<RefereeGuarantorResponseModalProps> = ({
  isOpen,
  onClose,
  responseType,
  applicantName = '',
  prefilledEmail = '',
  tenantEmail = '',
}) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: prefilledEmail,
    consent: '',
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.consent || !formData.reason) {
      setSubmitError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const responseData = {
        id: `${responseType}_response_${formData.email}_${Date.now()}`,
        responseType,
        type: `${responseType}_response`,
        applicantName,
        applicantEmail: tenantEmail,
        tenantEmail: tenantEmail,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        consent: formData.consent,
        reason: formData.reason
      };

      await apiService.post('/referee-guarantor-responses', responseData);
      
      console.log('✅ Response saved to Firestore:', responseData.id);

      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: prefilledEmail,
          consent: '',
          reason: '',
        });
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting response:', error);
      setSubmitError('Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const title = responseType === 'referee' ? 'Reference Response' : 'Guarantor Response';
  const description = responseType === 'referee'
    ? `Please provide your reference for ${applicantName}'s rental application.`
    : `Please confirm your willingness to act as guarantor for ${applicantName}'s rental application.`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
          <div>
            <h2 className="text-2xl font-bold text-[#136C9E]">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              ✅ Thank you! Your response has been submitted successfully.
            </p>
          </div>
        )}

        {/* Error Message */}
        {submitError && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{submitError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#136C9E] focus:border-transparent transition-all"
                required
                disabled={isSubmitting || submitSuccess}
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#136C9E] focus:border-transparent transition-all"
                required
                disabled={isSubmitting || submitSuccess}
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#136C9E] focus:border-transparent transition-all"
              required
              disabled={isSubmitting || submitSuccess}
            />
          </div>

          {/* Consent Field */}
          <div>
            <label htmlFor="consent" className="block text-sm font-semibold text-gray-700 mb-2">
              Do you agree to provide {responseType === 'referee' ? 'a reference' : 'guarantor support'}? <span className="text-red-500">*</span>
            </label>
            <select
              id="consent"
              name="consent"
              value={formData.consent}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#136C9E] focus:border-transparent transition-all bg-white"
              required
              disabled={isSubmitting || submitSuccess}
            >
              <option value="">Select an option</option>
              <option value="agree">Yes, I agree</option>
              <option value="disagree">No, I disagree</option>
            </select>
          </div>

          {/* Reason Field */}
          <div>
            <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-2">
              {formData.consent === 'agree' 
                ? 'Please provide additional comments or details (optional but recommended)' 
                : formData.consent === 'disagree'
                ? 'Please explain why you disagree'
                : 'Reason'} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#136C9E] focus:border-transparent transition-all resize-none"
              placeholder={
                formData.consent === 'agree'
                  ? `Please share your experience with ${applicantName}...`
                  : formData.consent === 'disagree'
                  ? 'Please explain your reasons for declining...'
                  : 'Enter your comments here...'
              }
              required
              disabled={isSubmitting || submitSuccess}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your response will be sent to the agent managing this application. 
              All information provided will be kept confidential and used solely for tenancy verification purposes.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-all font-semibold"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#DC5F12] to-[#FF6B1A] text-white rounded-full hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || submitSuccess}
            >
              {isSubmitting ? 'Submitting...' : submitSuccess ? 'Submitted!' : 'Submit Response'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RefereeGuarantorResponseModal;

