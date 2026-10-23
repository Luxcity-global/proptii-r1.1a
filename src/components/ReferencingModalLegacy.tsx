import React from 'react';
import { ReferencingProvider } from './referencing/context/ReferencingContext';
import ReferencingModal from './referencing/ReferencingModal';

export interface ReferencingModalLegacyProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmissionComplete?: () => void;
  initialStep?: number;
  singleSectionOnly?: boolean;
  propertyId?: string;
  applicationId?: string;
}

/**
 * ReferencingModalLegacy:
 * Replaced legacy monolithic modal with the modern, modular referencing workflow
 * from src/components/referencing/ReferencingModal.tsx.
 */
export const ReferencingModalLegacy: React.FC<ReferencingModalLegacyProps> = ({
  isOpen,
  onClose,
  initialStep = 1,
  propertyId = 'default-property',
  applicationId,
}) => {
  if (!isOpen) return null;

  return (
    <ReferencingProvider
      propertyId={propertyId}
      initialApplicationId={applicationId}
      initialStep={Math.max(0, initialStep - 1)}
    >
      <ReferencingModal
        open={isOpen}
        onClose={onClose}
        propertyId={propertyId}
        applicationId={applicationId}
      />
    </ReferencingProvider>
  );
};

export default ReferencingModalLegacy;