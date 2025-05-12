import React, { useState, useEffect } from 'react';

const RedirectUriWarning: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [currentUri, setCurrentUri] = useState('');

  useEffect(() => {
    // Check if there's a redirect_uri_mismatch error in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error === 'redirect_uri_mismatch' || 
        (errorDescription && errorDescription.includes('redirect_uri_mismatch'))) {
      setShowWarning(true);
      setCurrentUri(window.location.origin);
    }
    
    // Also check localStorage for a previously stored error
    const storedError = localStorage.getItem('auth_error');
    if (storedError && storedError.includes('redirect_uri_mismatch')) {
      setShowWarning(true);
      setCurrentUri(window.location.origin);
      // Clear the error after displaying it
      localStorage.removeItem('auth_error');
    }
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-4 z-50">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-lg font-bold mb-2">Redirect URI Configuration Error</h3>
        <p className="mb-2">
          The redirect URI <code className="bg-red-700 px-2 py-1 rounded">{currentUri}</code> is not registered in Azure AD B2C.
        </p>
        <p className="mb-2">
          Please register this URI in your Azure AD B2C tenant or update your application configuration.
        </p>
        <div className="flex justify-end">
          <button 
            onClick={() => setShowWarning(false)}
            className="bg-white text-red-600 px-4 py-2 rounded hover:bg-red-100 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedirectUriWarning; 