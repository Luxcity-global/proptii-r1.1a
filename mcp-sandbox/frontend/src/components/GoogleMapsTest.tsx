import React, { useEffect, useState } from 'react';
import googleMapsTestSuite, { type TestSuite, type TestResult } from '../utils/googleMapsTestSuite';
import debugGoogleMaps from '../utils/googleMapsDebug';

const GoogleMapsTest: React.FC = () => {
  const [testSuite, setTestSuite] = useState<TestSuite | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    try {
      setIsRunning(true);
      setError(null);
      console.log('🧪 [GOOGLE-MAPS-TEST] Starting comprehensive Google Maps test suite...');
      
      const results = await googleMapsTestSuite.runAllTests();
      setTestSuite(results);
      
      console.log('✅ [GOOGLE-MAPS-TEST] Test suite completed:', `${results.passedTests}/${results.totalTests} tests passed`);

    } catch (error) {
      console.error('❌ [GOOGLE-MAPS-TEST] Test suite failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  const renderTestResult = (result: TestResult) => (
    <div key={result.testName} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      background: result.passed ? '#dcfce7' : '#fef2f2',
      borderRadius: '6px',
      border: `1px solid ${result.passed ? '#bbf7d0' : '#fecaca'}`
    }}>
      <span style={{ fontSize: '16px' }}>
        {result.passed ? '✅' : '❌'}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontWeight: '500',
          color: result.passed ? '#166534' : '#dc2626',
          fontSize: '14px'
        }}>
          {result.testName}
        </div>
        <div style={{ 
          fontSize: '12px',
          color: '#6b7280',
          marginTop: '2px'
        }}>
          {result.message} • {result.duration}ms
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ 
          margin: '0', 
          color: '#1e40af',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          🧪 Google Maps API Test Suite
        </h3>
        
        {testSuite && (
          <div style={{
            padding: '4px 12px',
            background: testSuite.passedTests === testSuite.totalTests ? '#dcfce7' : '#fef3c7',
            color: testSuite.passedTests === testSuite.totalTests ? '#166534' : '#92400e',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {testSuite.passedTests}/{testSuite.totalTests} PASSED
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isRunning ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            🔄 Running comprehensive test suite...
          </div>
        ) : testSuite ? (
          <>
            {/* Summary */}
            <div style={{
              padding: '12px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              <div style={{ fontWeight: '600', color: '#0369a1', marginBottom: '4px' }}>
                📊 Test Summary
              </div>
              <div style={{ color: '#0c4a6e' }}>
                Total Tests: {testSuite.totalTests} • 
                Passed: {testSuite.passedTests} • 
                Failed: {testSuite.failedTests} • 
                Duration: {testSuite.totalDuration}ms
              </div>
            </div>

            {/* Individual Test Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {testSuite.results.map(renderTestResult)}
            </div>
          </>
        ) : error ? (
          <div style={{
            padding: '12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '14px'
          }}>
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={runTests}
            disabled={isRunning}
            style={{
              padding: '8px 16px',
              background: isRunning ? '#9ca3af' : '#1e40af',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: isRunning ? 0.6 : 1
            }}
          >
            {isRunning ? '🔄 Running...' : '🔄 Run Tests Again'}
          </button>
          
          <button
            onClick={async () => {
              console.log('🔍 [DEBUG] Running diagnostics...');
              await debugGoogleMaps.runDiagnostics('AIzaSyChXxNp1xBJtJB9pC5WxWoZw3__7nT3djU');
            }}
            style={{
              padding: '8px 16px',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🔍 Run Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapsTest;
