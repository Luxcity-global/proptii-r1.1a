import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  FormControlLabel,
  Checkbox,
  Alert
} from '@mui/material';
import { useReferencing } from '../context/ReferencingContext';
import GuarantorUpload from '../ui/GuarantorUpload';

const GuarantorSection: React.FC = () => {
  const { formData, updateFormData, errors } = useReferencing();

  const handleFileSelect = (file: File) => {
    updateFormData('guarantor', {
      identityDocument: file
    });
  };

  const handleFileRemove = () => {
    updateFormData('guarantor', {
      identityDocument: null
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Guarantor Information
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            A guarantor is someone who agrees to pay your rent if you are unable to do so. They must be a UK resident and have a good credit history.
          </Alert>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Guarantor's First Name"
            value={formData.guarantor.firstName}
            onChange={(e) => updateFormData('guarantor', { firstName: e.target.value })}
            error={!!errors.guarantor?.firstName}
            helperText={errors.guarantor?.firstName}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Guarantor's Last Name"
            value={formData.guarantor.lastName}
            onChange={(e) => updateFormData('guarantor', { lastName: e.target.value })}
            error={!!errors.guarantor?.lastName}
            helperText={errors.guarantor?.lastName}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Guarantor's Email"
            type="email"
            value={formData.guarantor.email}
            onChange={(e) => updateFormData('guarantor', { email: e.target.value })}
            error={!!errors.guarantor?.email}
            helperText={errors.guarantor?.email}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Guarantor's Phone Number"
            value={formData.guarantor.phoneNumber}
            onChange={(e) => updateFormData('guarantor', { phoneNumber: e.target.value })}
            error={!!errors.guarantor?.phoneNumber}
            helperText={errors.guarantor?.phoneNumber}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Guarantor's Address"
            multiline
            rows={3}
            value={formData.guarantor.address}
            onChange={(e) => updateFormData('guarantor', { address: e.target.value })}
            error={!!errors.guarantor?.address}
            helperText={errors.guarantor?.address}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Guarantor ID Document
          </Typography>
          <GuarantorUpload
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFile={formData.guarantor.identityDocument}
            error={errors.guarantor?.identityDocument}
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.guarantor.isUKResident}
                onChange={(e) => updateFormData('guarantor', { isUKResident: e.target.checked })}
                color="primary"
              />
            }
            label="I confirm that the guarantor is a UK resident"
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.guarantor.hasGoodCredit}
                onChange={(e) => updateFormData('guarantor', { hasGoodCredit: e.target.checked })}
                color="primary"
              />
            }
            label="I confirm that the guarantor has a good credit history"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default GuarantorSection; 