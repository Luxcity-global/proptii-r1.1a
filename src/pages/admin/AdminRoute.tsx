import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isStaffEmail } from './adminAccess';
import './adminDashboard.css';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="pa-gate">
        <div className="pa-gate-card">
          <p>Checking staff access…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const fullPath = location.pathname + location.search;
    sessionStorage.setItem('redirectAfterLogin', fullPath);
    return <Navigate to={`/login?redirect=${encodeURIComponent(fullPath)}`} replace />;
  }

  if (!isStaffEmail(user?.email)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
