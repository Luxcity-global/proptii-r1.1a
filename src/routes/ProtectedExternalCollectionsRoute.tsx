import React from 'react';
import { Navigate } from 'react-router-dom';
import { isExternalCollectionsFeatureEnabled, EXTERNAL_COLLECTIONS_FEATURES } from '../config/featureFlags';

interface ProtectedExternalCollectionsRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

/**
 * ProtectedExternalCollectionsRoute component for navigation guards
 * Redirects users if external collections features are not enabled
 */
const ProtectedExternalCollectionsRoute: React.FC<ProtectedExternalCollectionsRouteProps> = ({
  children,
  fallbackPath = '/listings',
}) => {
  console.log('EXTERNAL_COLLECTIONS_FEATURES:', EXTERNAL_COLLECTIONS_FEATURES);
  console.log('ENABLE_EXTERNAL_COLLECTIONS:', EXTERNAL_COLLECTIONS_FEATURES.ENABLE_EXTERNAL_COLLECTIONS);
  
  const isEnabled = isExternalCollectionsFeatureEnabled(EXTERNAL_COLLECTIONS_FEATURES.ENABLE_EXTERNAL_COLLECTIONS);
  
  console.log('ProtectedExternalCollectionsRoute:', {
    isEnabled,
    feature: EXTERNAL_COLLECTIONS_FEATURES.ENABLE_EXTERNAL_COLLECTIONS,
    fallbackPath
  });

  if (!isEnabled) {
    console.log('Feature not enabled, redirecting to:', fallbackPath);
    return <Navigate to={fallbackPath} replace />;
  }

  console.log('Feature enabled, rendering children');
  return <>{children}</>;
};

export default ProtectedExternalCollectionsRoute; 