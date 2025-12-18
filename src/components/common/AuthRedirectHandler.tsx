import React from 'react';

/**
 * Component to handle global redirects for protected routes.
 * DISABLED: All protected routes now use ProtectedRoute component directly.
 * This component is kept for backwards compatibility but does nothing.
 */
export const AuthRedirectHandler: React.FC = () => {
  // Disabled - ProtectedRoute component handles all auth redirects now
  // Keeping this component to avoid breaking imports in App.tsx
  return null;
};











