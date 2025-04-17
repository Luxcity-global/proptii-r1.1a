import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useReferencing } from '../context/ReferencingContext';
import ResidentialUpload from '../ui/ResidentialUpload';

const ResidentialSection: React.FC = () => {
  const { formData, updateFormData, errors } = useReferencing();

  const handleFileSelect = (file: File) => {
    updateFormData('residential', {
      proofDocument: file
    });
  };

  const handleFileRemove = () => {
    updateFormData('residential', {
      proofDocument: null
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Residential History
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Current Address"
            multiline
            rows={3}
            value={formData.residential.currentAddress}
            onChange={(e) => updateFormData('residential', { currentAddress: e.target.value })}
            error={!!errors.residential?.currentAddress}
            helperText={errors.residential?.currentAddress}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Duration at Current Address"
            value={formData.residential.durationAtCurrentAddress}
            onChange={(e) => updateFormData('residential', { durationAtCurrentAddress: e.target.value })}
            error={!!errors.residential?.durationAtCurrentAddress}
            helperText={errors.residential?.durationAtCurrentAddress}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Proof Type</InputLabel>
            <Select
              value={formData.residential.proofType}
              onChange={(e) => updateFormData('residential', { proofType: e.target.value })}
              error={!!errors.residential?.proofType}
            >
              <MenuItem value="utility_bill">Utility Bill</MenuItem>
              <MenuItem value="bank_statement">Bank Statement</MenuItem>
              <MenuItem value="council_tax">Council Tax Bill</MenuItem>
              <MenuItem value="tenancy_agreement">Tenancy Agreement</MenuItem>
            </Select>
            {errors.residential?.proofType && (
              <Typography color="error" variant="caption">
                {errors.residential.proofType}
              </Typography>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Proof of Current Address
          </Typography>
          <ResidentialUpload
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFile={formData.residential.proofDocument}
            error={errors.residential?.proofDocument}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Previous Address
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Previous Address"
            multiline
            rows={3}
            value={formData.residential.previousAddress}
            onChange={(e) => updateFormData('residential', { previousAddress: e.target.value })}
            error={!!errors.residential?.previousAddress}
            helperText={errors.residential?.previousAddress}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Duration at Previous Address"
            value={formData.residential.durationAtPreviousAddress}
            onChange={(e) => updateFormData('residential', { durationAtPreviousAddress: e.target.value })}
            error={!!errors.residential?.durationAtPreviousAddress}
            helperText={errors.residential?.durationAtPreviousAddress}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Reason for Leaving"
            value={formData.residential.reasonForLeaving}
            onChange={(e) => updateFormData('residential', { reasonForLeaving: e.target.value })}
            error={!!errors.residential?.reasonForLeaving}
            helperText={errors.residential?.reasonForLeaving}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResidentialSection; 