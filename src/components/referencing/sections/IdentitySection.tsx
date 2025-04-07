import React from 'react';
import { IdentityData } from '../../../types/referencing';
import FormField from '../ui/FormField';
import FileUpload from '../ui/FileUpload';

interface IdentitySectionProps {
  data: IdentityData;
  onChange: (data: Partial<IdentityData>) => void;
  onFileUpload: (file: File) => void;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

/**
 * Identity section of the referencing form
 */
const IdentitySection: React.FC<IdentitySectionProps> = ({
  data,
  onChange,
  onFileUpload,
  errors,
  isSubmitting
}) => {
  return (
    <div className="relative">
      <h3 className="text-xl font-semibold mb-6">Fill in your personal details below</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <FormField
          label="First Name"
          error={errors.firstName}
          required
        >
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField
          label="Last Name"
          error={errors.lastName}
          required
        >
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField
          label="Email Address"
          error={errors.email}
          required
        >
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField
          label="Phone Number"
          error={errors.phoneNumber}
          required
        >
          <input
            type="tel"
            value={data.phoneNumber}
            onChange={(e) => onChange({ phoneNumber: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField
          label="Date of Birth"
          error={errors.dateOfBirth}
          required
        >
          <div className="relative">
            <input
              type="date"
              value={data.dateOfBirth}
              onChange={(e) => onChange({ dateOfBirth: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isSubmitting}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </FormField>
        
        <FormField
          label="Are you British"
          error={errors.isBritish}
        >
          <select
            value={data.isBritish ? "true" : "false"}
            onChange={(e) => onChange({ isBritish: e.target.value === "true" })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            disabled={isSubmitting}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </FormField>
        
        <FormField
          label="Proof of Identity"
          error={errors.identityProof}
        >
          <input
            type="text"
            placeholder="e.g. Passport, Driving License"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField
          label="Nationality, if you're not British"
          error={errors.nationality}
          required={!data.isBritish}
        >
          <select
            value={data.nationality}
            onChange={(e) => onChange({ nationality: e.target.value })}
            disabled={data.isBritish || isSubmitting}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">Select nationality</option>
            <option value="Irish">Irish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Italian">Italian</option>
            <option value="Spanish">Spanish</option>
            <option value="Polish">Polish</option>
            <option value="Romanian">Romanian</option>
            <option value="Indian">Indian</option>
            <option value="Pakistani">Pakistani</option>
            <option value="Chinese">Chinese</option>
            <option value="Other">Other</option>
          </select>
        </FormField>
      </div>
      
      <div className="mt-8">
        <FormField
          label="Upload Proof of Identity"
          error={errors.identityProof}
          required
        >
          <FileUpload
            label="Upload Proof of Identity"
            onFileSelect={(file) => {
              onChange({ identityProof: file });
              onFileUpload(file);
            }}
            selectedFile={data.identityProof}
          />
        </FormField>
      </div>
    </div>
  );
};

export default IdentitySection; 