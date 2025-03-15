import React from 'react';
import { Grid, Typography, Box, Link, Button } from '@mui/material';
import { useReferencingForm } from '../hooks/useReferencingForm';
import FormField from '../ui/FormField';
import DocumentUpload from '../ui/DocumentUpload';
import { FinancialData } from '../../../types/referencing';

/**
 * FinancialForm component for collecting financial information
 */
const FinancialForm: React.FC = () => {
  const { handleSubmit, handleFieldChange, errors, formData } = useReferencingForm('financial');
  
  // Cast formData to the correct type
  const financialData = formData as FinancialData;
  
  // Handle text field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    // For checkbox fields, use the checked property
    const fieldValue = type === 'checkbox' ? checked : value;
    handleFieldChange(name, fieldValue);
  };
  
  // Handle file upload
  const handleFileUpload = (file: File | null) => {
    handleFieldChange('proofOfIncomeDocument', file);
  };
  
  // Handle upload complete
  const handleUploadComplete = (url: string, fileName: string) => {
    console.log(`Financial proof document uploaded successfully: ${fileName} at ${url}`);
    // You can store the URL in your form data if needed
  };
  
  // Handle Open Banking connection
  const handleConnectOpenBanking = () => {
    // In a real implementation, this would open the Open Banking connection flow
    // For now, we'll just simulate a successful connection
    handleFieldChange('isConnectedToOpenBanking', true);
  };

  return (
    <Box component="form" id="financial-form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Financial Information
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Please provide information about your income and financial situation.
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <FormField
            id="useOpenBanking"
            type="checkbox"
            label="Use Open Banking for income verification (faster processing)"
            checked={financialData.useOpenBanking || false}
            onChange={handleChange}
            error={errors.useOpenBanking}
          />
        </Grid>
        
        {financialData.useOpenBanking ? (
          <Grid item xs={12}>
            <Box sx={{ 
              p: 3, 
              border: '1px solid #e0e0e0', 
              borderRadius: 1,
              bgcolor: 'background.paper',
              mb: 2
            }}>
              <Typography variant="subtitle1" gutterBottom>
                Open Banking Connection
              </Typography>
              
              <Typography variant="body2" paragraph>
                Connect your bank account securely to verify your income. This is a secure process that complies with financial regulations.
              </Typography>
              
              {financialData.isConnectedToOpenBanking ? (
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'success.light', 
                  color: 'success.contrastText',
                  borderRadius: 1
                }}>
                  <Typography variant="body2">
                    ✓ Successfully connected to Open Banking
                  </Typography>
                </Box>
              ) : (
                <>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleConnectOpenBanking}
                    sx={{ mt: 1 }}
                  >
                    Connect Bank Account
                  </Button>
                  
                  {errors.isConnectedToOpenBanking && (
                    <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
                      {errors.isConnectedToOpenBanking}
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Grid>
        ) : (
          <>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Income Verification
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormField
                id="monthlyIncome"
                type="text"
                label="Your Monthly Income"
                value={financialData.monthlyIncome || ''}
                onChange={handleChange}
                error={errors.monthlyIncome}
                required
                placeholder="e.g. £2,500"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormField
                id="proofOfIncomeType"
                type="select"
                label="Proof of Income"
                value={financialData.proofOfIncomeType || ''}
                onChange={handleChange}
                error={errors.proofOfIncomeType}
                required
                options={[
                  { value: 'bank_statements', label: 'Bank Statements (last 3 months)' },
                  { value: 'payslips', label: 'Payslips (last 3 months)' },
                  { value: 'tax_return', label: 'Tax Return' },
                  { value: 'accountant_letter', label: 'Accountant Letter (self-employed)' },
                  { value: 'other', label: 'Other' }
                ]}
              />
            </Grid>
            
            <Grid item xs={12}>
              <DocumentUpload
                id="proofOfIncomeDocument"
                label="Upload Proof of Income"
                accept="image/*, application/pdf"
                file={financialData.proofOfIncomeDocument}
                onFileChange={handleFileUpload}
                onUploadComplete={handleUploadComplete}
                error={errors.proofOfIncomeDocument}
                required
                section="financial"
                field="proofOfIncomeDocument"
                autoUpload={true}
                helperText="Please upload bank statements, payslips, or other proof of income"
              />
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default FinancialForm; 