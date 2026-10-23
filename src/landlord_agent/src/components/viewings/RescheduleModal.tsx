import React from 'react';
import { Clock, X } from 'lucide-react';
import type { ViewingBooking } from '../../../../services/viewingService';

export interface RescheduleFormState {
  date: string;
  time: string;
  message: string;
}

export const VIEWING_TIME_SLOTS = [
  { value: '10:00', label: '10:00 AM – 10:45 AM' },
  { value: '11:30', label: '11:30 AM – 12:15 PM' },
  { value: '14:00', label: '02:00 PM – 02:45 PM' },
  { value: '16:00', label: '04:00 PM – 04:45 PM' },
  { value: '18:00', label: '06:00 PM – 06:45 PM (Evening)' },
];

export interface RescheduleModalProps {
  isOpen: boolean;
  viewing: ViewingBooking | null;
  form: RescheduleFormState;
  onFormChange: React.Dispatch<React.SetStateAction<RescheduleFormState>>;
  onSubmit: () => void;
  onClose: () => void;
  isProcessing: boolean;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  viewing,
  form,
  onFormChange,
  onSubmit,
  onClose,
  isProcessing,
}) => {
  if (!isOpen || !viewing) return null;

  return (
    <div className="ll-vw-modal-backdrop" role="dialog" aria-modal="true">
      <div className="ll-vw-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ll-vw-modal-head is-amber">
          <div className="ll-vw-modal-head-copy">
            <div className="ll-vw-modal-icon is-amber">
              <Clock size={16} />
            </div>
            <div>
              <h3>Propose Alternative Time</h3>
              <p>Suggest a revised slot for this viewing request</p>
            </div>
          </div>
          <button
            type="button"
            className="ll-vw-modal-close"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        <div className="ll-vw-modal-body">
          <div className="ll-vw-modal-info">
            <span>Applicant & Property</span>
            <strong>
              {viewing.viewingDetails?.userDetails?.fullName || 'Applicant'} ·{' '}
              {viewing.property.street}
            </strong>
          </div>
          <label className="ll-vw-field">
            <span>Proposed New Date</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => onFormChange((prev) => ({ ...prev, date: e.target.value }))}
            />
          </label>
          <label className="ll-vw-field">
            <span>Proposed Time Slot</span>
            <select
              value={form.time}
              onChange={(e) => onFormChange((prev) => ({ ...prev, time: e.target.value }))}
            >
              <option value="">Select a time</option>
              {VIEWING_TIME_SLOTS.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
              {form.time && !VIEWING_TIME_SLOTS.some((slot) => slot.value === form.time) && (
                <option value={form.time}>{form.time}</option>
              )}
            </select>
          </label>
          <label className="ll-vw-field">
            <span>Message to Applicant</span>
            <textarea
              rows={2}
              placeholder="I have another viewing booked then, would this alternative work for you?"
              value={form.message}
              onChange={(e) => onFormChange((prev) => ({ ...prev, message: e.target.value }))}
            />
          </label>
        </div>
        <div className="ll-vw-modal-footer is-split">
          <button
            type="button"
            className="ll-vw-modal-secondary"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ll-vw-modal-cta"
            onClick={onSubmit}
            disabled={isProcessing}
          >
            {isProcessing ? 'Sending…' : 'Send Proposal'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;
