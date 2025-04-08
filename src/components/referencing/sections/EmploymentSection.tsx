import React from 'react';
import { useReferencing } from '../context/ReferencingContext';
import EmploymentUpload from '../ui/EmploymentUpload';
import { TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const EmploymentSection: React.FC = () => {
  const { formData, updateFormData, errors } = useReferencing();

  const handleFileSelect = (file: File) => {
    updateFormData('employment', {
      proofDocument: file,
      proofType: file.type
    });
  };

  const handleFileRemove = () => {
    updateFormData('employment', {
      proofDocument: null,
      proofType: ''
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Employment Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormControl fullWidth error={!!errors.employment?.employmentStatus}>
          <InputLabel>Employment Status</InputLabel>
          <Select
            value={formData.employment.employmentStatus}
            onChange={(e) => updateFormData('employment', { employmentStatus: e.target.value })}
            label="Employment Status"
          >
            <MenuItem value="full-time">Full Time</MenuItem>
            <MenuItem value="part-time">Part Time</MenuItem>
            <MenuItem value="self-employed">Self Employed</MenuItem>
            <MenuItem value="contract">Contract</MenuItem>
            <MenuItem value="retired">Retired</MenuItem>
            <MenuItem value="unemployed">Unemployed</MenuItem>
          </Select>
          {errors.employment?.employmentStatus && (
            <p className="text-sm text-red-500 mt-1">{errors.employment.employmentStatus}</p>
          )}
        </FormControl>

        <TextField
          fullWidth
          label="Company Name"
          value={formData.employment.companyDetails}
          onChange={(e) => updateFormData('employment', { companyDetails: e.target.value })}
          error={!!errors.employment?.companyDetails}
          helperText={errors.employment?.companyDetails}
        />

        <TextField
          fullWidth
          label="Length of Employment"
          value={formData.employment.lengthOfEmployment}
          onChange={(e) => updateFormData('employment', { lengthOfEmployment: e.target.value })}
          error={!!errors.employment?.lengthOfEmployment}
          helperText={errors.employment?.lengthOfEmployment}
        />

        <TextField
          fullWidth
          label="Job Position"
          value={formData.employment.jobPosition}
          onChange={(e) => updateFormData('employment', { jobPosition: e.target.value })}
          error={!!errors.employment?.jobPosition}
          helperText={errors.employment?.jobPosition}
        />
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">Employment Reference</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            fullWidth
            label="Reference Full Name"
            value={formData.employment.referenceFullName}
            onChange={(e) => updateFormData('employment', { referenceFullName: e.target.value })}
            error={!!errors.employment?.referenceFullName}
            helperText={errors.employment?.referenceFullName}
          />

          <TextField
            fullWidth
            label="Reference Email"
            type="email"
            value={formData.employment.referenceEmail}
            onChange={(e) => updateFormData('employment', { referenceEmail: e.target.value })}
            error={!!errors.employment?.referenceEmail}
            helperText={errors.employment?.referenceEmail}
          />

          <TextField
            fullWidth
            label="Reference Phone"
            value={formData.employment.referencePhone}
            onChange={(e) => updateFormData('employment', { referencePhone: e.target.value })}
            error={!!errors.employment?.referencePhone}
            helperText={errors.employment?.referencePhone}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">Proof of Employment</h4>
        
        <EmploymentUpload
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          selectedFile={formData.employment.proofDocument}
          error={errors.employment?.proofDocument}
        />
      </div>
    </div>
  );
};

export default EmploymentSection; 