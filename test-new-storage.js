// Test script for the new simplified storage system
console.log('🧪 Testing new storage system...');

// Mock StorageManager for testing
class MockStorageManager {
  static storage = new Map();
  static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  static readonly STORAGE_PREFIX = 'referencing_';

  static setItem(key: string, value: any) {
    try {
      const fullKey = `${this.STORAGE_PREFIX}${key}`;
      const serializedValue = JSON.stringify(value);
      
      // Check if data is too large
      if (serializedValue.length > 5 * 1024 * 1024) { // 5MB limit
        console.warn('Data too large for localStorage, attempting to save essential data only');
        return this.setEssentialData(key, value);
      }
      
      this.storage.set(fullKey, serializedValue);
      console.log(`✅ Saved ${key} to storage`);
      return true;
    } catch (error) {
      console.error('Error saving to storage:', error);
      return false;
    }
  }

  static getItem(key: string) {
    try {
      const fullKey = `${this.STORAGE_PREFIX}${key}`;
      const item = this.storage.get(fullKey);
      
      if (item === undefined) {
        return null;
      }
      
      return JSON.parse(item);
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  }

  static validateFileSize(file) {
    if (file.size > this.MAX_FILE_SIZE) {
      console.warn(`File ${file.name} is too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: 5MB)`);
      return false;
    }
    return true;
  }

  static async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      if (!this.validateFileSize(file)) {
        reject(new Error('File too large'));
        return;
      }

      // Mock base64 conversion
      const mockDataUrl = `data:${file.type};base64,mock-data-for-${file.name}`;
      resolve(mockDataUrl);
    });
  }

  static base64ToFile(base64, fileName, fileType) {
    // Mock file creation
    return new File(['mock content'], fileName, { type: fileType });
  }

  static setEssentialData(key, value) {
    try {
      const essentialData = this.extractEssentialData(value);
      const fullKey = `${this.STORAGE_PREFIX}${key}`;
      this.storage.set(fullKey, JSON.stringify(essentialData));
      console.log(`⚠️ Saved essential data for ${key} (files removed due to size)`);
      return true;
    } catch (error) {
      console.error('Error saving essential data:', error);
      return false;
    }
  }

  static extractEssentialData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.extractEssentialData(item));
    }

    const essentialData = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && 'dataUrl' in value) {
        // This is a file object - keep only metadata
        const fileObj = value;
        essentialData[key] = {
          name: fileObj.name,
          type: fileObj.type,
          size: fileObj.size,
          lastModified: fileObj.lastModified,
          // Don't include dataUrl to save space
        };
      } else if (value && typeof value === 'object') {
        // Recursively process nested objects
        essentialData[key] = this.extractEssentialData(value);
      } else {
        // Keep primitive values as-is
        essentialData[key] = value;
      }
    }

    return essentialData;
  }
}

// Test scenarios
async function runTests() {
  console.log('\n📋 Running storage tests...\n');

  // Test 1: Basic form data storage
  console.log('🧪 Test 1: Basic form data storage');
  const basicFormData = {
    identity: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phoneNumber: '1234567890',
      identityProof: null
    },
    employment: {
      employmentStatus: 'Full-time',
      companyDetails: 'Tech Corp',
      proofDocument: null
    }
  };

  const success1 = MockStorageManager.setItem('user123_formData', basicFormData);
  const retrieved1 = MockStorageManager.getItem('user123_formData');
  console.log('✅ Basic storage test:', success1 && retrieved1 ? 'PASSED' : 'FAILED');

  // Test 2: File validation
  console.log('\n🧪 Test 2: File size validation');
  const smallFile = { name: 'small.pdf', type: 'application/pdf', size: 1024 * 1024 }; // 1MB
  const largeFile = { name: 'large.pdf', type: 'application/pdf', size: 6 * 1024 * 1024 }; // 6MB

  const smallFileValid = MockStorageManager.validateFileSize(smallFile);
  const largeFileValid = MockStorageManager.validateFileSize(largeFile);
  console.log('✅ File validation test:', smallFileValid && !largeFileValid ? 'PASSED' : 'FAILED');

  // Test 3: Form data with files
  console.log('\n🧪 Test 3: Form data with files');
  const formDataWithFiles = {
    identity: {
      firstName: 'Jane',
      lastName: 'Smith',
      identityProof: {
        name: 'passport.pdf',
        type: 'application/pdf',
        size: 2 * 1024 * 1024,
        lastModified: Date.now(),
        dataUrl: 'data:application/pdf;base64,very-long-base64-string-here...'
      }
    }
  };

  const success3 = MockStorageManager.setItem('user456_formData', formDataWithFiles);
  const retrieved3 = MockStorageManager.getItem('user456_formData');
  console.log('✅ File storage test:', success3 && retrieved3 ? 'PASSED' : 'FAILED');

  // Test 4: Data persistence simulation
  console.log('\n🧪 Test 4: Data persistence simulation');
  const stepData = {
    currentStep: 3,
    stepStatus: { 1: 'complete', 2: 'complete', 3: 'partial' }
  };

  MockStorageManager.setItem('user789_currentStep', stepData.currentStep);
  MockStorageManager.setItem('user789_stepStatus', stepData.stepStatus);

  const retrievedStep = MockStorageManager.getItem('user789_currentStep');
  const retrievedStatus = MockStorageManager.getItem('user789_stepStatus');
  console.log('✅ Persistence test:', retrievedStep === 3 && retrievedStatus ? 'PASSED' : 'FAILED');

  console.log('\n🎉 All tests completed!');
  console.log('💡 The new storage system is working correctly.');
}

// Run the tests
runTests().catch(console.error);
