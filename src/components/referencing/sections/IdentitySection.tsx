import React from 'react';
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
  );
};

export default IdentitySection; 