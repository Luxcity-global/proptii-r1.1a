import React from 'react';
import BookViewingModal, { BookViewingModalProps } from './BookViewingModal';

export type ViewingScheduleModalProps = BookViewingModalProps;

export const ViewingScheduleModal: React.FC<ViewingScheduleModalProps> = (props) => {
  return <BookViewingModal {...props} />;
};

export default ViewingScheduleModal;
