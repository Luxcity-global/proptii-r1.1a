import React from 'react';
import { Grid, Typography, Box, Paper, Link } from '@mui/material';
import { useReferencingForm } from '../hooks/useReferencingForm';
import FormField from '../ui/FormField';
import DocumentUpload from '../ui/DocumentUpload';
import { CreditCheckData } from '../../../types/referencing';

/**
 * CreditCheckForm component for collecting credit check consent
 */
const CreditCheckForm: React.FC = () => {
  const { handleSubmit, handleFieldChange, errors, formData } = useReferencingForm('creditCheck');
  
  // Cast formData to the correct type
  const creditCheckData = formData as CreditCheckData;
  
  // Handle checkbox change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    handleFieldChange(name, checked);
  };
  
  // Handle file upload
  const handleFileUpload = (file: File | null) => {
    handleFieldChange('additionalDocument', file);
  };
  
  // Handle upload complete
  const handleUploadComplete = (url: string, fileName: string) => {
    console.log(`Credit check additional document uploaded successfully: ${fileName} at ${url}`);
    // You can store the URL in your form data if needed
  };

  return (
    <Box component="form" id="credit-check-form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Credit Check Consent
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            As part of the referencing process, we need to perform a credit check to assess your financial reliability.
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Credit Check Information
            </Typography>
            
            <Typography variant="body2" paragraph>
              The credit check will include:
            </Typography>
            
            <ul>
              <li>
                <Typography variant="body2">
                  Verification of your identity
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Check for any County Court Judgments (CCJs)
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Assessment of your credit history
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Verification of your current address
                </Typography>
              </li>
            </ul>
            
            <Typography variant="body2" paragraph>
              This check will leave a "soft footprint" on your credit file, which means it won't affect your credit score.
            </Typography>
            
            <Typography variant="body2">
              For more information, please read our{' '}
              <Link href="#" target="_blank" rel="noopener">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="#" target="_blank" rel="noopener">
                Terms of Service
              </Link>.
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <FormField
            id="hasAgreedToCheck"
            type="checkbox"
            label="I consent to a credit check being performed as part of my referencing application"
            checked={creditCheckData.hasAgreedToCheck || false}
            onChange={handleChange}
            error={errors.hasAgreedToCheck}
            required
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="body2" color="textSecondary" paragraph>
            By checking the box above, you are giving us permission to perform a credit check. This is required to proceed with your application.
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreditCheckForm; 