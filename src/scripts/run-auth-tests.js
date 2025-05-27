#!/usr/bin/env node

/**
 * Authentication Test Runner
 * This script runs all authentication-related tests and generates a report
 */

console.log('Running Authentication Tests...\n');

const testSuites = [
  'TenantVerification.test.tsx',
  'UserFlows.test.tsx',
  'ApplicationTesting.test.tsx',
  'Authentication.test.tsx'
];

console.log('Test Suites to Run:');
testSuites.forEach((suite, index) => {
  console.log(`${index + 1}. ${suite}`);
});

console.log('\nExecuting Tests...\n');

// Execute tests using Vitest
const { execSync } = require('child_process');

try {
  execSync('npx vitest run src/test/auth/*.test.tsx --reporter=verbose', {
    stdio: 'inherit'
  });

  console.log('\nAll authentication tests completed successfully!');
  console.log('\nTest Coverage Report:');
  execSync('npx vitest run src/test/auth/*.test.tsx --coverage', {
    stdio: 'inherit'
  });
} catch (error) {
  console.error('\nTest execution failed:', error.message);
  process.exit(1);
} 