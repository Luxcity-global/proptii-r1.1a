import React from 'react';

const EnvironmentDebug: React.FC = () => {
  const envVars = {
    VITE_SEARCH_BACKEND_URL: import.meta.env.VITE_SEARCH_BACKEND_URL,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
    NODE_ENV: import.meta.env.NODE_ENV,
    DEV: import.meta.env.DEV,
    MODE: import.meta.env.MODE
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Environment Variables:</h4>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(envVars, null, 2)}
      </pre>
    </div>
  );
};

export default EnvironmentDebug;
