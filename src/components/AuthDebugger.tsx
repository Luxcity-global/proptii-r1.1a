import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthDebugger: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [localStorageState, setLocalStorageState] = useState<any>(null);

  useEffect(() => {
    // Check localStorage state
    const stored = localStorage.getItem('proptii_auth_state');
    if (stored) {
      try {
        setLocalStorageState(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing localStorage:', error);
      }
    }
  }, [user, isAuthenticated, isLoading]);

  if (!isAuthenticated) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        background: '#ff6b6b', 
        color: 'white', 
        padding: '10px', 
        borderRadius: '5px',
        zIndex: 9999,
        fontSize: '12px',
        maxWidth: '300px'
      }}>
        <strong>🔐 Auth Debug - Not Authenticated</strong>
        <br />
        <button 
          onClick={() => window.location.href = '/login'}
          style={{ 
            background: 'white', 
            color: '#ff6b6b', 
            border: 'none', 
            padding: '5px 10px', 
            borderRadius: '3px',
            marginTop: '5px',
            cursor: 'pointer'
          }}
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#51cf66', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      zIndex: 9999,
      fontSize: '12px',
      maxWidth: '300px'
    }}>
      <strong>🔐 Auth Debug - Authenticated</strong>
      <br />
      <strong>User:</strong> {user?.name || user?.email || 'Unknown'}
      <br />
      <strong>Email:</strong> {user?.email || 'Unknown'}
      <br />
      <strong>ID:</strong> {user?.id || 'Unknown'}
      <br />
      <strong>Roles:</strong> {user?.roles?.join(', ') || 'None'}
      <br />
      <details style={{ marginTop: '5px' }}>
        <summary style={{ cursor: 'pointer' }}>LocalStorage State</summary>
        <pre style={{ 
          background: 'rgba(0,0,0,0.1)', 
          padding: '5px', 
          borderRadius: '3px',
          marginTop: '5px',
          fontSize: '10px',
          overflow: 'auto',
          maxHeight: '100px'
        }}>
          {JSON.stringify(localStorageState, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default AuthDebugger;
