import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SavedPropertiesProvider } from '../context/SavedPropertiesContext';

interface AppWrapperProps {
  children: React.ReactNode;
}

export const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // For development/testing, use a default user ID if not authenticated
  const userId = user?.id || (isAuthenticated ? 'default-user' : 'test-user-123');
  
  console.log('AppWrapper - User:', user, 'isAuthenticated:', isAuthenticated, 'userId:', userId);
  
  return (
    <SavedPropertiesProvider userId={userId}>
      {children}
    </SavedPropertiesProvider>
  );
}; 