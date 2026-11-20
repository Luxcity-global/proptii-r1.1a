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
            We are not running a credit search yet. No credit reference agency is contracted. Ticking the box means you agree that, when we name an agency and explain whether it is a soft or hard search, we may run that search as part of referencing. We will not run a search until then.
          </Alert>
          <Typography variant="body1" paragraph>
            By ticking below you confirm that the information you have given is accurate, and you consent to a future credit search only after we have named the agency in this form and in our Privacy Policy.
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.creditCheck.hasAgreedToCheck}
                onChange={(e) => updateFormData('creditCheck', { hasAgreedToCheck: e.target.checked })}
                color="primary"
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