/**
 * Test Script for Referencing Flow
 * 
 * This script provides a way to manually test the complete referencing flow
 * in a development environment. It simulates API calls and user interactions
 * to verify that authentication, file handling, and data storage are working correctly.
 * 
 * Usage:
 * 1. Run this script in a development environment
 * 2. Follow the console logs to see the progress of the test
 * 3. Check for any errors or issues in the console
 */

import { saveSectionData, uploadDocument, submitApplication, getApplicationById } from '../services/api';

// Mock application ID for testing
const APPLICATION_ID = 'test-app-123';

// Mock user data
const USER = {
  givenName: 'John',
  familyName: 'Doe',
  email: 'john.doe@example.com'
};

// Mock form data for each section
const IDENTITY_DATA = {
  firstName: USER.givenName,
  lastName: USER.familyName,
  email: USER.email,
  phoneNumber: '07123456789',
  dateOfBirth: '1990-01-01',
  isBritish: true,
  nationality: 'British'
};

const EMPLOYMENT_DATA = {
  employmentStatus: 'Full-time',
  companyDetails: 'Test Company Ltd',
  lengthOfEmployment: '3 years',
  jobPosition: 'Software Engineer',
  referenceFullName: 'Jane Smith',
  referenceEmail: 'jane.smith@example.com',
  referencePhone: '07987654321',
  proofType: 'Payslip'
};

const RESIDENTIAL_DATA = {
  currentAddress: '123 Test Street, London, SW1 1AA',
  durationAtCurrentAddress: '3-5 years',
  previousAddress: '',
  durationAtPreviousAddress: '',
  reasonForLeaving: '',
  proofType: 'Utility Bill'
};

const FINANCIAL_DATA = {
  proofOfIncomeType: 'Bank Statement',
  useOpenBanking: false,
  isConnectedToOpenBanking: false
};

const GUARANTOR_DATA = {
  firstName: 'Robert',
  lastName: 'Smith',
  email: 'robert.smith@example.com',
  phoneNumber: '07111222333',
  address: '456 Guarantor Street, London, SW2 2BB'
};

const CREDIT_CHECK_DATA = {
  hasAgreedToCheck: true
};

// Create a mock file for testing
const createMockFile = (name: string, type: string, size: number) => {
  const file = new File(['test'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Mock files for each section
const IDENTITY_FILE = createMockFile('passport.pdf', 'application/pdf', 5 * 1024 * 1024);
const EMPLOYMENT_FILE = createMockFile('payslip.pdf', 'application/pdf', 3 * 1024 * 1024);
const RESIDENTIAL_FILE = createMockFile('utility_bill.pdf', 'application/pdf', 2 * 1024 * 1024);
const FINANCIAL_FILE = createMockFile('bank_statement.pdf', 'application/pdf', 4 * 1024 * 1024);

// Test the complete referencing flow
async function testReferencingFlow() {
  console.log('🧪 Starting Referencing Flow Test');
  console.log('--------------------------------');

  try {
    // Step 1: Load application data
    console.log('Step 1: Loading application data');
    const loadResponse = await getApplicationById(APPLICATION_ID);
    if (!loadResponse.success) {
      throw new Error(`Failed to load application: ${loadResponse.error}`);
    }
    console.log('✅ Application data loaded successfully');

    // Step 2: Save and upload identity data
    console.log('\nStep 2: Saving identity data');
    const identitySaveResponse = await saveSectionData(APPLICATION_ID, 'identity', IDENTITY_DATA);
    if (!identitySaveResponse.success) {
      throw new Error(`Failed to save identity data: ${identitySaveResponse.error}`);
    }
    console.log('✅ Identity data saved successfully');

    console.log('\nStep 3: Uploading identity document');
    const identityUploadResponse = await uploadDocument(
      APPLICATION_ID,
      'identity',
      IDENTITY_FILE,
      (progress) => console.log(`Identity upload progress: ${progress}%`)
    );
    if (!identityUploadResponse.success) {
      throw new Error(`Failed to upload identity document: ${identityUploadResponse.error}`);
    }
    console.log('✅ Identity document uploaded successfully');

    // Step 4: Save and upload employment data
    console.log('\nStep 4: Saving employment data');
    const employmentSaveResponse = await saveSectionData(APPLICATION_ID, 'employment', EMPLOYMENT_DATA);
    if (!employmentSaveResponse.success) {
      throw new Error(`Failed to save employment data: ${employmentSaveResponse.error}`);
    }
    console.log('✅ Employment data saved successfully');

    console.log('\nStep 5: Uploading employment document');
    const employmentUploadResponse = await uploadDocument(
      APPLICATION_ID,
      'employment',
      EMPLOYMENT_FILE,
      (progress) => console.log(`Employment upload progress: ${progress}%`)
    );
    if (!employmentUploadResponse.success) {
      throw new Error(`Failed to upload employment document: ${employmentUploadResponse.error}`);
    }
    console.log('✅ Employment document uploaded successfully');

    // Step 6: Save and upload residential data
    console.log('\nStep 6: Saving residential data');
    const residentialSaveResponse = await saveSectionData(APPLICATION_ID, 'residential', RESIDENTIAL_DATA);
    if (!residentialSaveResponse.success) {
      throw new Error(`Failed to save residential data: ${residentialSaveResponse.error}`);
    }
    console.log('✅ Residential data saved successfully');

    console.log('\nStep 7: Uploading residential document');
    const residentialUploadResponse = await uploadDocument(
      APPLICATION_ID,
      'residential',
      RESIDENTIAL_FILE,
      (progress) => console.log(`Residential upload progress: ${progress}%`)
    );
    if (!residentialUploadResponse.success) {
      throw new Error(`Failed to upload residential document: ${residentialUploadResponse.error}`);
    }
    console.log('✅ Residential document uploaded successfully');

    // Step 8: Save and upload financial data
    console.log('\nStep 8: Saving financial data');
    const financialSaveResponse = await saveSectionData(APPLICATION_ID, 'financial', FINANCIAL_DATA);
    if (!financialSaveResponse.success) {
      throw new Error(`Failed to save financial data: ${financialSaveResponse.error}`);
    }
    console.log('✅ Financial data saved successfully');

    console.log('\nStep 9: Uploading financial document');
    const financialUploadResponse = await uploadDocument(
      APPLICATION_ID,
      'financial',
      FINANCIAL_FILE,
      (progress) => console.log(`Financial upload progress: ${progress}%`)
    );
    if (!financialUploadResponse.success) {
      throw new Error(`Failed to upload financial document: ${financialUploadResponse.error}`);
    }
    console.log('✅ Financial document uploaded successfully');

    // Step 10: Save guarantor data
    console.log('\nStep 10: Saving guarantor data');
    const guarantorSaveResponse = await saveSectionData(APPLICATION_ID, 'guarantor', GUARANTOR_DATA);
    if (!guarantorSaveResponse.success) {
      throw new Error(`Failed to save guarantor data: ${guarantorSaveResponse.error}`);
    }
    console.log('✅ Guarantor data saved successfully');

    // Step 11: Save credit check data
    console.log('\nStep 11: Saving credit check data');
    const creditCheckSaveResponse = await saveSectionData(APPLICATION_ID, 'creditCheck', CREDIT_CHECK_DATA);
    if (!creditCheckSaveResponse.success) {
      throw new Error(`Failed to save credit check data: ${creditCheckSaveResponse.error}`);
    }
    console.log('✅ Credit check data saved successfully');

    // Step 12: Submit application
    console.log('\nStep 12: Submitting application');
    const submitResponse = await submitApplication(APPLICATION_ID);
    if (!submitResponse.success) {
      throw new Error(`Failed to submit application: ${submitResponse.error}`);
    }
    console.log('✅ Application submitted successfully');

    console.log('\n--------------------------------');
    console.log('🎉 Referencing Flow Test Completed Successfully!');
    console.log('All steps passed without errors.');

  } catch (error) {
    console.error('\n❌ Test Failed:');
    console.error(error);
  }
}

// Run the test
testReferencingFlow();

export default testReferencingFlow; 