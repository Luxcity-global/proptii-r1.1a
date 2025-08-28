import React, { useState, useEffect } from 'react';

const SearchBackendTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing...');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testSearchBackend = async () => {
      try {
        const searchBackendUrl = import.meta.env.VITE_SEARCH_BACKEND_URL || 'http://localhost:3001';
        console.log('Testing search backend at:', searchBackendUrl);
        
        const response = await fetch(`${searchBackendUrl}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setStatus(`✅ Search backend is working! Status: ${data.status}`);
        } else {
          setStatus(`❌ Search backend responded with status: ${response.status}`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`❌ Failed to connect to search backend: ${errorMessage}`);
        console.error('Search backend test failed:', err);
      }
    };

    testSearchBackend();
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      left: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Search Backend Test:</h4>
      <div>{status}</div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

export default SearchBackendTest;
