import React from 'react';
import { ReferencingProvider } from './referencing/context/ReferencingContext';
import ReferencingModal from './referencing/ReferencingModal';
import { useAuth } from '../contexts/AuthContext';

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
  propertyId,
  applicationId,
}) => {
  const { user } = useAuth();
  if (!isOpen) return null;

  const effectivePropertyId =
    propertyId && propertyId !== 'default-property'
      ? propertyId
      : user?.id
        ? `general_${user.id}`
        : 'default-property';

  const effectiveApplicationId =
    applicationId ||
    (user?.id ? `general_${user.id}` : effectivePropertyId);

  return (
    <ReferencingProvider
      propertyId={effectivePropertyId}
      initialApplicationId={effectiveApplicationId}
      initialStep={Math.max(0, initialStep - 1)}
    >
      <ReferencingModal
        open={isOpen}
        onClose={onClose}
        propertyId={effectivePropertyId}
        applicationId={effectiveApplicationId}
      />
    </ReferencingProvider>
  );
};

export default ReferencingModalLegacy;