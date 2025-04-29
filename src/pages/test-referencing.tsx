import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ReferencingModal from '../components/ReferencingModal';
import { 
  mockSaveSectionData as saveSectionData, 
  mockUploadDocument as uploadDocument, 
  mockSubmitApplication as submitApplication, 
  mockGetApplicationById as getApplicationById,
  initializeMockApplication
} from '../mocks/api';

// Create a mock file for testing
const createMockFile = (name: string, type: string, size: number) => {
  const file = new File(['test'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const TestReferencingPage: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applicationId, setApplicationId] = useState('test-app-123');
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // Initialize the mock application when the component mounts
  useEffect(() => {
    if (applicationId) {
      initializeMockApplication(applicationId);
    }
  }, [applicationId]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const runAutomatedTest = async () => {
    clearLogs();
    setIsRunningTest(true);
    addLog('🧪 Starting Automated Referencing Flow Test');
    addLog('--------------------------------');

    try {
      // Mock form data for each section
      const IDENTITY_DATA = {
        firstName: user?.givenName || 'John',
        lastName: user?.familyName || 'Doe',
        email: user?.email || 'john.doe@example.com',
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

      // Mock files for each section
      const IDENTITY_FILE = createMockFile('passport.pdf', 'application/pdf', 5 * 1024 * 1024);
      const EMPLOYMENT_FILE = createMockFile('payslip.pdf', 'application/pdf', 3 * 1024 * 1024);
      const RESIDENTIAL_FILE = createMockFile('utility_bill.pdf', 'application/pdf', 2 * 1024 * 1024);
      const FINANCIAL_FILE = createMockFile('bank_statement.pdf', 'application/pdf', 4 * 1024 * 1024);

      // Step 1: Load application data
      addLog('Step 1: Loading application data');
      const loadResponse = await getApplicationById(applicationId);
      if (!loadResponse.success) {
        throw new Error(`Failed to load application: ${loadResponse.error}`);
      }
      addLog('✅ Application data loaded successfully');

      // Step 2: Save and upload identity data
      addLog('\nStep 2: Saving identity data');
      const identitySaveResponse = await saveSectionData(applicationId, 'identity', IDENTITY_DATA);
      if (!identitySaveResponse.success) {
        throw new Error(`Failed to save identity data: ${identitySaveResponse.error}`);
      }
      addLog('✅ Identity data saved successfully');

      addLog('\nStep 3: Uploading identity document');
      const identityUploadResponse = await uploadDocument(
        applicationId,
        'identity',
        IDENTITY_FILE,
        (progress) => addLog(`Identity upload progress: ${progress}%`)
      );
      if (!identityUploadResponse.success) {
        throw new Error(`Failed to upload identity document: ${identityUploadResponse.error}`);
      }
      addLog('✅ Identity document uploaded successfully');

      // Step 4: Save and upload employment data
      addLog('\nStep 4: Saving employment data');
      const employmentSaveResponse = await saveSectionData(applicationId, 'employment', EMPLOYMENT_DATA);
      if (!employmentSaveResponse.success) {
        throw new Error(`Failed to save employment data: ${employmentSaveResponse.error}`);
      }
      addLog('✅ Employment data saved successfully');

      addLog('\nStep 5: Uploading employment document');
      const employmentUploadResponse = await uploadDocument(
        applicationId,
        'employment',
        EMPLOYMENT_FILE,
        (progress) => addLog(`Employment upload progress: ${progress}%`)
      );
      if (!employmentUploadResponse.success) {
        throw new Error(`Failed to upload employment document: ${employmentUploadResponse.error}`);
      }
      addLog('✅ Employment document uploaded successfully');

      // Step 6: Save and upload residential data
      addLog('\nStep 6: Saving residential data');
      const residentialSaveResponse = await saveSectionData(applicationId, 'residential', RESIDENTIAL_DATA);
      if (!residentialSaveResponse.success) {
        throw new Error(`Failed to save residential data: ${residentialSaveResponse.error}`);
      }
      addLog('✅ Residential data saved successfully');

      addLog('\nStep 7: Uploading residential document');
      const residentialUploadResponse = await uploadDocument(
        applicationId,
        'residential',
        RESIDENTIAL_FILE,
        (progress) => addLog(`Residential upload progress: ${progress}%`)
      );
      if (!residentialUploadResponse.success) {
        throw new Error(`Failed to upload residential document: ${residentialUploadResponse.error}`);
      }
      addLog('✅ Residential document uploaded successfully');

      // Step 8: Save and upload financial data
      addLog('\nStep 8: Saving financial data');
      const financialSaveResponse = await saveSectionData(applicationId, 'financial', FINANCIAL_DATA);
      if (!financialSaveResponse.success) {
        throw new Error(`Failed to save financial data: ${financialSaveResponse.error}`);
      }
      addLog('✅ Financial data saved successfully');

      addLog('\nStep 9: Uploading financial document');
      const financialUploadResponse = await uploadDocument(
        applicationId,
        'financial',
        FINANCIAL_FILE,
        (progress) => addLog(`Financial upload progress: ${progress}%`)
      );
      if (!financialUploadResponse.success) {
        throw new Error(`Failed to upload financial document: ${financialUploadResponse.error}`);
      }
      addLog('✅ Financial document uploaded successfully');

      // Step 10: Save guarantor data
      addLog('\nStep 10: Saving guarantor data');
      const guarantorSaveResponse = await saveSectionData(applicationId, 'guarantor', GUARANTOR_DATA);
      if (!guarantorSaveResponse.success) {
        throw new Error(`Failed to save guarantor data: ${guarantorSaveResponse.error}`);
      }
      addLog('✅ Guarantor data saved successfully');

      // Step 11: Save credit check data
      addLog('\nStep 11: Saving credit check data');
      const creditCheckSaveResponse = await saveSectionData(applicationId, 'creditCheck', CREDIT_CHECK_DATA);
      if (!creditCheckSaveResponse.success) {
        throw new Error(`Failed to save credit check data: ${creditCheckSaveResponse.error}`);
      }
      addLog('✅ Credit check data saved successfully');

      // Step 12: Submit application
      addLog('\nStep 12: Submitting application');
      const submitResponse = await submitApplication(applicationId);
      if (!submitResponse.success) {
        throw new Error(`Failed to submit application: ${submitResponse.error}`);
      }
      addLog('✅ Application submitted successfully');

      addLog('\n--------------------------------');
      addLog('🎉 Referencing Flow Test Completed Successfully!');
      addLog('All steps passed without errors.');

    } catch (error: any) {
      addLog('\n❌ Test Failed:');
      addLog(error.message || 'Unknown error occurred');
    } finally {
      setIsRunningTest(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Referencing Flow Test</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
        <div className="flex items-end gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-gray-700 mb-2">Application ID</label>
            <input
              type="text"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Open Referencing Modal
          </button>
        </div>
      </div>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Automated Test</h2>
          <div className="space-x-3">
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isRunningTest}
            >
              Clear Logs
            </button>
            <button
              onClick={runAutomatedTest}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              disabled={isRunningTest}
            >
              {isRunningTest ? 'Running Test...' : 'Run Automated Test'}
            </button>
          </div>
        </div>
        
        <div className="bg-gray-900 text-green-400 p-4 rounded-md h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Run the test to see results here.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`mb-1 ${log.includes('❌') ? 'text-red-400' : ''}`}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
      
      {isModalOpen && (
        <ReferencingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          applicationId={applicationId}
          propertyAddress="123 Test Street, London, SW1 1AA"
        />
      )}
    </div>
  );
};

export default TestReferencingPage; 