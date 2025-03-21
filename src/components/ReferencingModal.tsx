import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ReferencingModalComponent from './referencing/ReferencingModal';

interface ReferencingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ReferencingModal component that wraps the new ReferencingModal component
 * from the referencing directory.
 */
const ReferencingModal: React.FC<ReferencingModalProps> = ({ isOpen, onClose }) => {
  // Get a mock property ID for testing
  const [propertyId] = useState('property-123');

  return (
    <ReferencingModalComponent
      open={isOpen}
      onClose={onClose}
      propertyId={propertyId}
    />
  );
};

export default ReferencingModal; 