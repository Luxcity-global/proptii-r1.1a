import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFormsStorage } from '../contexts/FormsContext';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  currentAddress: string;
  employmentStatus: string;
  incomeLevel: string;
  previousLandlord: string;
  previousAddress: string;
  additionalInfo: string;
}

const ReferencingForm: React.FC = () => {
  const { user } = useAuth();
  const { saveForm, getForm } = useFormsStorage();
  const [formData, setFormData] = useState<FormData>({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    currentAddress: '',
    employmentStatus: '',
    incomeLevel: '',
    previousLandlord: '',
    previousAddress: '',
    additionalInfo: '',
  });

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
    }, 2000);
  };

  const handleSave = async () => {
    try {
      await saveForm('referencing-form', formData);
      // Show success message
    } catch (error) {
      // Handle error
      console.error('Failed to save form:', error);
    }
  };

  useEffect(() => {
    // Load saved form data
    const loadForm = async () => {
      const savedData = await getForm('referencing-form');
      if (savedData) {
        // Update your form state with saved data
        setFormData(savedData);
      }
    };
    loadForm();
  }, []);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold mb-8 text-center">Referencing Application</h2>

      {submitSuccess ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-4">Application Submitted!</h3>
          <p className="text-gray-600 mb-8">
            Thank you for submitting your referencing application. We'll review your information 
            and get back to you within 2-3 business days.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition-all"
          >
            Back to Home
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Current Address</label>
                  <input
                    type="text"
                    name="currentAddress"
                    value={formData.currentAddress}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Employment & Financial Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">Employment Status</label>
                  <select
                    name="employmentStatus"
                    value={formData.employmentStatus}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select status</option>
                    <option value="employed">Employed (Full-time)</option>
                    <option value="part-time">Employed (Part-time)</option>
                    <option value="self-employed">Self-Employed</option>
                    <option value="student">Student</option>
                    <option value="retired">Retired</option>
                    <option value="unemployed">Unemployed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Annual Income Level</label>
                  <select
                    name="incomeLevel"
                    value={formData.incomeLevel}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select income range</option>
                    <option value="under20k">Under £20,000</option>
                    <option value="20k-30k">£20,000 - £30,000</option>
                    <option value="30k-40k">£30,000 - £40,000</option>
                    <option value="40k-50k">£40,000 - £50,000</option>
                    <option value="50k-60k">£50,000 - £60,000</option>
                    <option value="over60k">Over £60,000</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300 transition-all"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Rental History</h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">Previous Landlord/Agency</label>
                  <input
                    type="text"
                    name="previousLandlord"
                    value={formData.previousLandlord}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Previous Address</label>
                  <input
                    type="text"
                    name="previousAddress"
                    value={formData.previousAddress}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Additional Information</label>
                  <textarea
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Please provide any additional information that might be relevant to your application"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300 transition-all"
                >
                  Previous
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition-all flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Submitting</span>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default ReferencingForm;