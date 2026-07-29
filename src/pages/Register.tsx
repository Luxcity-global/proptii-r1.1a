import React from 'react';
import { Navigate } from 'react-router-dom';

/** S5-05 — Legacy /register redirects to the pricing signup flow. */
export const RegisterPage: React.FC = () => (
  <Navigate to="/pricing" replace />
);
