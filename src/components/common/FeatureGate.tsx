import React from 'react';
import { isFeatureEnabled, EXTERNAL_COLLECTIONS_FEATURES, isExternalCollectionsFeatureEnabled } from '../../config/featureFlags';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  externalCollectionsFeature?: keyof typeof EXTERNAL_COLLECTIONS_FEATURES;
}

/**
 * FeatureGate component for conditional rendering based on feature flags
 * Supports both general feature flags and harvesting-specific features
 */
const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  externalCollectionsFeature,
}) => {
  let isEnabled = false;

  // Check if it's a harvesting-specific feature
  if (externalCollectionsFeature) {
    isEnabled = isExternalCollectionsFeatureEnabled(externalCollectionsFeature);
  } else {
    // Check general feature flags
    isEnabled = isFeatureEnabled(feature as any);
  }

  if (!isEnabled) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
};

export default FeatureGate; 