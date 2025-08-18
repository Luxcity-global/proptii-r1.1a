// Test script for SessionManager encryption fix
console.log('Testing SessionManager encryption...');

// Simulate the browser environment
global.crypto = require('crypto').webcrypto;
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

// Mock environment variables
process.env.VITE_APP_INSIGHTS_INSTRUMENTATION_KEY = 'test-key';

// Import the SessionManager
const { SessionManager } = require('./src/services/SessionManager.ts');

async function testSessionManager() {
  try {
    console.log('Creating SessionManager instance...');
    const sessionManager = SessionManager.getInstance();
    
    console.log('Updating activity...');
    sessionManager.updateActivity('interaction', 'Test activity');
    
    console.log('Getting session ID...');
    const sessionId = sessionManager.getSessionId();
    console.log('Session ID:', sessionId);
    
    console.log('✅ SessionManager test completed successfully!');
    console.log('✅ No encryption errors occurred.');
    
  } catch (error) {
    console.error('❌ SessionManager test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testSessionManager(); 