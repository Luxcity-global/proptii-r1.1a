import React, { useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import FormField from '../ui/FormField';
import DocumentUpload from '../ui/DocumentUpload';
import { useReferencing } from '../context/ReferencingContext';
import { countries } from '../../../utils/countries';

/**
 * IdentityForm component for collecting personal identity information
 */
const IdentityForm: React.FC = () => {
  const { state, updateFormData } = useReferencing();
  const identityData = state.formData.identity || {};
  
  // State for file uploads
  const [passportFile, setPassportFile] = useState<File | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData('identity', { [name]: value });
  };
  
  const handlePassportFileChange = (file: File | null) => {
    setPassportFile(file);
    updateFormData('identity', { identityProof: file });
  };
  
  const handleUploadComplete = (url: string, fileName: string, field: string) => {
    updateFormData('identity', { [field]: url });
    console.log(`File uploaded successfully: ${fileName} at ${url}`);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Personal Information
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormField
            id="firstName"
            type="text"
            label="First Name"
            value={identityData.firstName || ''}
            onChange={handleChange}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormField
            id="lastName"
            type="text"
            label="Last Name"
            value={identityData.lastName || ''}
            onChange={handleChange}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormField
            id="email"
            type="email"
            label="Email Address"
            value={identityData.email || ''}
            onChange={handleChange}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormField
            id="phoneNumber"
            type="tel"
            label="Phone Number"
            value={identityData.phoneNumber || ''}
            onChange={handleChange}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormField
            id="nationality"
            type="select"
            label="Nationality"
            value={identityData.nationality || ''}
            onChange={handleChange}
            options={countries}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormField
            id="dateOfBirth"
            type="date"
            label="Date of Birth"
            value={identityData.dateOfBirth || ''}
            onChange={handleChange}
            required
          />
        </Grid>
      </Grid>
      
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Identity Documents
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <DocumentUpload
            id="identityProof"
            label="Passport or ID Card"
            accept="image/*,application/pdf"
            file={passportFile}
            onFileChange={handlePassportFileChange}
            onUploadComplete={(url, fileName) => handleUploadComplete(url, fileName, 'identityProofId')}
            required
            section="identity"
            field="identityProof"
            helperText="Please upload a clear copy of your passport or ID card"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default IdentityForm; 