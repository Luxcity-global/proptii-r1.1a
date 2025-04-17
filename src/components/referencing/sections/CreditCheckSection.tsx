import React from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControlLabel,
  Checkbox,
  Alert,
  Link
} from '@mui/material';
import { useReferencing } from '../context/ReferencingContext';

export const CreditCheckSection: React.FC = () => {
  const { formData, updateFormData, errors } = useReferencing();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Credit Check Consent
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            We need your consent to perform a credit check as part of the referencing process. This helps us verify your financial history and ability to pay rent.
          </Alert>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="body1" paragraph>
            By agreeing to the credit check, you consent to:
          </Typography>
          <ul>
            <li>
              <Typography variant="body2">
                A credit check being performed by our approved credit reference agency
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                The credit reference agency keeping a record of our enquiry
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                The credit reference agency sharing your credit history with us
              </Typography>
            </li>
          </ul>
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.creditCheck.hasAgreedToCheck}
                onChange={(e) => updateFormData('creditCheck', { hasAgreedToCheck: e.target.checked })}
                color="primary"
                error={!!errors.creditCheck?.hasAgreedToCheck}
              />
            }
            label={
              <Typography variant="body2">
                I agree to a credit check being performed and confirm that all information provided is accurate
              </Typography>
            }
          />
          {errors.creditCheck?.hasAgreedToCheck && (
            <Typography color="error" variant="caption" display="block" sx={{ mt: 1 }}>
              {errors.creditCheck.hasAgreedToCheck}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary">
            For more information about how we handle your data, please read our{' '}
            <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </Link>
            {' '}and{' '}
            <Link href="/terms-of-service" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </Link>
            .
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}; 