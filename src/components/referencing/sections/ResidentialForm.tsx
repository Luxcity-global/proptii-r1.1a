import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { useReferencingForm } from '../hooks/useReferencingForm';
import FormField from '../ui/FormField';
import DocumentUpload from '../ui/DocumentUpload';
import { ResidentialData } from '../../../types/referencing';

/**
 * ResidentialForm component for collecting residential information
 */
const ResidentialForm: React.FC = () => {
  const { handleSubmit, handleFieldChange, errors, formData } = useReferencingForm('residential');
  
  // Cast formData to the correct type
  const residentialData = formData as ResidentialData;
  
  // Handle text field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleFieldChange(name, value);
  };
  
  // Handle file upload
  const handleFileUpload = (file: File | null) => {
    handleFieldChange('proofDocument', file);
  };
  
  // Handle upload complete
  const handleUploadComplete = (url: string, fileName: string) => {
    console.log(`Residential proof document uploaded successfully: ${fileName} at ${url}`);
    // You can store the URL in your form data if needed
  };

  // Check if duration at current address is less than 3 years
  const needsPreviousAddress = () => {
    if (!residentialData.durationAtCurrentAddress) return false;
    
    const match = residentialData.durationAtCurrentAddress.match(/(\d+)/);
    if (!match) return false;
    
    const years = parseInt(match[0], 10);
    return years < 3;
  };

  return (
    <Box component="form" id="residential-form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Residential Information
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormField
            id="currentAddress"
            type="textarea"
            label="Current Address"
            value={residentialData.currentAddress || ''}
            onChange={handleChange}
            error={errors.currentAddress}
            required
            rows={3}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormField
            id="durationAtCurrentAddress"
            type="text"
            label="Duration at Current Address"
            value={residentialData.durationAtCurrentAddress || ''}
            onChange={handleChange}
            error={errors.durationAtCurrentAddress}
            required
            placeholder="e.g. 2 years, 6 months"
          />
        </Grid>
        
        {needsPreviousAddress() && (
          <>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Previous Address Information
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Since you've been at your current address for less than 3 years, please provide your previous address.
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormField
                id="previousAddress"
                type="textarea"
                label="Previous Address"
                value={residentialData.previousAddress || ''}
                onChange={handleChange}
                error={errors.previousAddress}
                required
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormField
                    id="durationAtPreviousAddress"
                    type="text"
                    label="Duration at Previous Address"
                    value={residentialData.durationAtPreviousAddress || ''}
                    onChange={handleChange}
                    error={errors.durationAtPreviousAddress}
                    required
                    placeholder="e.g. 1 year, 3 months"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormField
                    id="reasonForLeaving"
                    type="text"
                    label="Reason for Leaving"
                    value={residentialData.reasonForLeaving || ''}
                    onChange={handleChange}
                    error={errors.reasonForLeaving}
                    required
                  />
                </Grid>
              </Grid>
            </Grid>
          </>
        )}
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Proof of Address
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Please provide documentation to verify your current address.
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormField
            id="proofType"
            type="select"
            label="Proof Type"
            value={residentialData.proofType || ''}
            onChange={handleChange}
            error={errors.proofType}
            required
            options={[
              { value: 'utility_bill', label: 'Utility Bill' },
              { value: 'bank_statement', label: 'Bank Statement' },
              { value: 'council_tax', label: 'Council Tax Bill' },
              { value: 'tenancy_agreement', label: 'Tenancy Agreement' },
              { value: 'other', label: 'Other' }
            ]}
          />
        </Grid>
        
        <Grid item xs={12}>
          <DocumentUpload
            id="proofDocument"
            label="Upload Proof Document"
            accept="image/*, application/pdf"
            file={residentialData.proofDocument}
            onFileChange={handleFileUpload}
            onUploadComplete={handleUploadComplete}
            error={errors.proofDocument}
            required
            section="residential"
            field="proofDocument"
            autoUpload={true}
            helperText="Please upload a recent utility bill, bank statement, or council tax bill"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResidentialForm; 