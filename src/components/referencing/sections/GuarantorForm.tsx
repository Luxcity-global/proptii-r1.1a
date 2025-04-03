import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { useReferencingForm } from '../hooks/useReferencingForm';
import FormField from '../ui/FormField';
import DocumentUpload from '../ui/DocumentUpload';
import { GuarantorData } from '../../../types/referencing';

/**
 * GuarantorForm component for collecting guarantor information
 */
const GuarantorForm: React.FC = () => {
  const { handleSubmit, handleFieldChange, errors, formData } = useReferencingForm('guarantor');
  
  // Cast formData to the correct type
  const guarantorData = formData as GuarantorData;
  
  // Handle text field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleFieldChange(name, value);
  };
  
  // Handle file upload
  const handleFileUpload = (file: File | null) => {
    handleFieldChange('identityDocument', file);
  };
  
  // Handle upload complete
  const handleUploadComplete = (url: string, fileName: string) => {
    console.log(`Guarantor identity document uploaded successfully: ${fileName} at ${url}`);
    // You can store the URL in your form data if needed
  };

  return (
    <Box component="form" id="guarantor-form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Guarantor Information
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Please provide details of your guarantor. A guarantor is someone who agrees to pay your rent if you're unable to do so.
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormField
            id="fullName"
            type="text"
            label="Guarantor's Full Name"
            value={guarantorData.fullName || ''}
            onChange={handleChange}
            error={errors.fullName}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormField
            id="email"
            type="email"
            label="Email Address"
            value={guarantorData.email || ''}
            onChange={handleChange}
            error={errors.email}
            required
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormField
            id="address"
            type="textarea"
            label="Address"
            value={guarantorData.address || ''}
            onChange={handleChange}
            error={errors.address}
            required
            rows={3}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Guarantor Identity Verification
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Please upload a document to verify your guarantor's identity. This could be a copy of their passport, driving license, or other government-issued ID.
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <DocumentUpload
            id="identityDocument"
            label="Upload Guarantor ID"
            accept="image/*, application/pdf"
            file={guarantorData.identityDocument}
            onFileChange={handleFileUpload}
            onUploadComplete={handleUploadComplete}
            error={errors.identityDocument}
            required
            section="guarantor"
            field="identityDocument"
            autoUpload={true}
            helperText="This document will be used to verify your guarantor's identity."
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Note: Your guarantor will be contacted to verify their details and consent to act as your guarantor.
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GuarantorForm; 