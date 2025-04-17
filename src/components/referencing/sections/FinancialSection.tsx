import React from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Alert
} from '@mui/material';
import { useReferencing } from '../context/ReferencingContext';
import FinancialUpload from '../ui/FinancialUpload';

const FinancialSection: React.FC = () => {
  const { formData, updateFormData, errors } = useReferencing();

  const handleFileSelect = (file: File) => {
    updateFormData('financial', {
      proofOfIncomeDocument: file
    });
  };

  const handleFileRemove = () => {
    updateFormData('financial', {
      proofOfIncomeDocument: null
    });
  };

  const handleOpenBankingConnect = () => {
    // TODO: Implement Open Banking connection
    updateFormData('financial', {
      isConnectedToOpenBanking: true
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Financial Information
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Proof of Income Type</InputLabel>
            <Select
              value={formData.financial.proofOfIncomeType}
              onChange={(e) => updateFormData('financial', { proofOfIncomeType: e.target.value })}
              error={!!errors.financial?.proofOfIncomeType}
            >
              <MenuItem value="payslip">Payslip</MenuItem>
              <MenuItem value="bank_statement">Bank Statement</MenuItem>
              <MenuItem value="tax_return">Tax Return</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
            {errors.financial?.proofOfIncomeType && (
              <Typography color="error" variant="caption">
                {errors.financial.proofOfIncomeType}
              </Typography>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Upload Proof of Income
          </Typography>
          <FinancialUpload
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFile={formData.financial.proofOfIncomeDocument}
            error={errors.financial?.proofOfIncomeDocument}
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.financial.useOpenBanking}
                onChange={(e) => updateFormData('financial', { useOpenBanking: e.target.checked })}
                color="primary"
              />
            }
            label="Use Open Banking for faster verification"
          />
        </Grid>
        
        {formData.financial.useOpenBanking && (
          <>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Open Banking allows us to securely access your bank account information to verify your income and financial status.
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenBankingConnect}
                disabled={formData.financial.isConnectedToOpenBanking}
              >
                {formData.financial.isConnectedToOpenBanking
                  ? 'Connected to Open Banking'
                  : 'Connect to Open Banking'}
              </Button>
            </Grid>
            
            {formData.financial.isConnectedToOpenBanking && (
              <Grid item xs={12}>
                <Alert severity="success">
                  Successfully connected to Open Banking. Your financial information will be automatically verified.
                </Alert>
              </Grid>
            )}
          </>
        )}
      </Grid>
    </Box>
  );
};

export default FinancialSection; 