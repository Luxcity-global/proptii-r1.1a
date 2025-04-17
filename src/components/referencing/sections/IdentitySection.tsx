import React from 'react';
<<<<<<< HEAD
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
=======
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useReferencing } from '../context/ReferencingContext';
import FileUpload from '../ui/FileUpload';

const IdentitySection: React.FC = () => {
  const { formData, updateFormData, errors } = useReferencing();

  const handleFileSelect = (file: File) => {
    updateFormData('identity', {
      identityProof: file
    });
  };

  const handleFileRemove = () => {
    updateFormData('identity', {
      identityProof: null
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Identity Verification
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First Name"
            value={formData.identity.firstName}
            onChange={(e) => updateFormData('identity', { firstName: e.target.value })}
            error={!!errors.identity?.firstName}
            helperText={errors.identity?.firstName}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Name"
            value={formData.identity.lastName}
            onChange={(e) => updateFormData('identity', { lastName: e.target.value })}
            error={!!errors.identity?.lastName}
            helperText={errors.identity?.lastName}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.identity.email}
            onChange={(e) => updateFormData('identity', { email: e.target.value })}
            error={!!errors.identity?.email}
            helperText={errors.identity?.email}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.identity.phoneNumber}
            onChange={(e) => updateFormData('identity', { phoneNumber: e.target.value })}
            error={!!errors.identity?.phoneNumber}
            helperText={errors.identity?.phoneNumber}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            value={formData.identity.dateOfBirth}
            onChange={(e) => updateFormData('identity', { dateOfBirth: e.target.value })}
            error={!!errors.identity?.dateOfBirth}
            helperText={errors.identity?.dateOfBirth}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Nationality</InputLabel>
            <Select
              value={formData.identity.nationality}
              onChange={(e) => updateFormData('identity', { nationality: e.target.value })}
              error={!!errors.identity?.nationality}
            >
              <MenuItem value="British">British</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
            {errors.identity?.nationality && (
              <Typography color="error" variant="caption">
                {errors.identity.nationality}
              </Typography>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.identity.isBritish}
                onChange={(e) => updateFormData('identity', { isBritish: e.target.checked })}
                color="primary"
              />
            }
            label="I confirm I am a British citizen"
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Identity Proof
          </Typography>
          <FileUpload
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFile={formData.identity.identityProof}
            error={errors.identity?.identityProof}
            acceptedFileTypes={['application/pdf', 'image/png', 'image/jpeg']}
            maxFileSize={5 * 1024 * 1024} // 5MB
          />
        </Grid>
      </Grid>
    </Box>
>>>>>>> upstream/feature/ai-search-listings-agents
  );
};

export default IdentitySection; 