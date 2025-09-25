import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { useReferencingForm } from '../hooks/useReferencingForm';
import FormField from '../ui/FormField';
import DocumentUpload from '../ui/DocumentUpload';
import { EmploymentData } from '../../../types/referencing';

/**
 * EmploymentForm component for collecting employment information
 */
const EmploymentForm: React.FC = () => {
  const { handleSubmit, handleFieldChange, errors, formData } = useReferencingForm('employment');
  
  // Cast formData to the correct type
  const employmentData = formData as EmploymentData;
  
  // Handle text field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    // For checkbox fields, use the checked property
    const fieldValue = type === 'checkbox' ? checked : value;
    handleFieldChange(name, fieldValue);
  };
  
  // Handle file upload
  const handleFileUpload = (file: File | null) => {
    handleFieldChange('proofDocument', file);
  };
  
  // Handle upload complete
  const handleUploadComplete = (url: string, fileName: string) => {
    console.log(`Employment proof document uploaded successfully: ${fileName} at ${url}`);
    // You can store the URL in your form data if needed
  };

  return (
    <Box component="form" id="employment-form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        {(employmentData.employmentStatus === 'employed' || employmentData.employmentStatus === 'self-employed' || !employmentData.employmentStatus) && (
          <>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Employment Details
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormField
                id="employmentStatus"
                type="select"
                label="Employment Status"
                value={employmentData.employmentStatus || ''}
                onChange={handleChange}
                error={errors.employmentStatus}
                required
                options={[
                  { value: 'employed', label: 'Employed' },
                  { value: 'self-employed', label: 'Self-employed' },
                  { value: 'unemployed', label: 'Unemployed' },
                  { value: 'retired', label: 'Retired' },
                  { value: 'student', label: 'Student' }
                ]}
              />
            </Grid>
            
            {(employmentData.employmentStatus === 'employed' || employmentData.employmentStatus === 'self-employed') && (
              <Grid item xs={12} sm={6}>
                <FormField
                  id="companyDetails"
                  type="text"
                  label="Company Details"
                  value={employmentData.companyDetails || ''}
                  onChange={handleChange}
                  error={errors.companyDetails}
                  required
                />
              </Grid>
            )}
            
            {(employmentData.employmentStatus === 'employed' || employmentData.employmentStatus === 'self-employed') && (
              <Grid item xs={12} sm={6}>
                <FormField
                  id="lengthOfEmployment"
                  type="text"
                  label="Length of Employment"
                  value={employmentData.lengthOfEmployment || ''}
                  onChange={handleChange}
                  error={errors.lengthOfEmployment}
                  required
                />
              </Grid>
            )}
            
            {employmentData.employmentStatus === 'employed' && (
              <Grid item xs={12} sm={6}>
                <FormField
                  id="jobPosition"
                  type="text"
                  label="Job Position"
                  value={employmentData.jobPosition || ''}
                  onChange={handleChange}
                  error={errors.jobPosition}
                  required
                />
              </Grid>
            )}
            
            {(employmentData.employmentStatus === 'employed' || employmentData.employmentStatus === 'self-employed') && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Employment Reference
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormField
                    id="referenceFullName"
                    type="text"
                    label="Referee's Full Name"
                    value={employmentData.referenceFullName || ''}
                    onChange={handleChange}
                    error={errors.referenceFullName}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormField
                    id="referenceEmail"
                    type="email"
                    label="Referee's Email"
                    value={employmentData.referenceEmail || ''}
                    onChange={handleChange}
                    error={errors.referenceEmail}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Proof of Employment
                  </Typography>
                  
                  <FormField
                    id="proofType"
                    type="select"
                    label="Proof Type"
                    value={employmentData.proofType || ''}
                    onChange={handleChange}
                    error={errors.proofType}
                    required
                    options={[
                      { value: 'contract', label: 'Employment Contract' },
                      { value: 'payslip', label: 'Recent Payslip' },
                      { value: 'letter', label: 'Employer Letter' },
                      { value: 'other', label: 'Other' }
                    ]}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <DocumentUpload
                    id="proofDocument"
                    label="Upload Proof Document"
                    accept="image/*, application/pdf"
                    file={employmentData.proofDocument}
                    onFileChange={handleFileUpload}
                    onUploadComplete={handleUploadComplete}
                    error={errors.proofDocument}
                    required
                    section="employment"
                    field="proofDocument"
                    autoUpload={true}
                    helperText="Please upload your employment contract, recent payslip, or employer letter"
                  />
                </Grid>
              </>
            )}
          </>
        )}
      </Grid>
    </Box>
  );
};

export default EmploymentForm; 