import React, { useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';
import { maskEmail } from '../../../utils/formatters';
import { viewingService, ViewingBooking } from '../../../services/viewingService';
import emailService from '../../../services/emailService';
import { useIsMobile } from '../ui/use-mobile';

function landlordEmailOf(viewing: ViewingBooking): string {
  const extra = viewing as ViewingBooking & { agentEmail?: string; landlordEmail?: string };
  return viewing.property?.agent?.email || extra.agentEmail || extra.landlordEmail || '';
}

interface TenantRescheduleModalProps {
  viewing: ViewingBooking | null;
  onClose: () => void;
  onRescheduled: (viewingId: string, date: string, time: string) => void;
}

const TenantRescheduleModal: React.FC<TenantRescheduleModalProps> = ({ viewing, onClose, onRescheduled }) => {
  const isMobile = useIsMobile();
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [message, setMessage] = useState('');
  const [agentEmail, setAgentEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!viewing) return;
    setNewDate('');
    setNewTime('');
    setMessage('');
    setAgentEmail(landlordEmailOf(viewing));
  }, [viewing]);

  if (!viewing) return null;

  const submit = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }
    if (!newDate || !newTime) {
      alert('Please select the new date and time for the reschedule');
      return;
    }

    setIsSending(true);
    try {
      const recipient = (agentEmail || landlordEmailOf(viewing)).trim();
      if (!recipient.includes('@')) {
        alert('Enter the landlord or agent email so they can receive this reschedule.');
        return;
      }

      const propertyAddress = `${viewing.property.street}, ${viewing.property.town}, ${viewing.property.city}`;

      const result = await emailService.sendEmail({
        to: recipient,
        subject: `Viewing Reschedule Request - ${propertyAddress}`,
        formData: {
          property: {
            street: viewing.property.street,
            town: viewing.property.town,
            city: viewing.property.city,
            postcode: viewing.property.postcode || '',
            agent: {
              name: viewing.property.agent?.name || '',
              email: recipient,
            },
          },
          viewing: {
            date: newDate,
            time: newTime,
            preference: viewing.viewingDetails.preference || 'in-person',
            rescheduleMessage: message,
          },
          user: {
            name: viewing.viewingDetails.userDetails.fullName,
            email: viewing.viewingDetails.userDetails.email,
          },
        },
        attachments: [],
        emailType: 'viewing-reschedule',
      });

      if (!result.success) {
        alert(result.error || 'Failed to send reschedule request. Please try again.');
        return;
      }

      const updated = await viewingService.updateViewingStatus(
        viewing.id,
        'rescheduled',
        `Reschedule requested: ${message}`,
        undefined,
        {
          viewingDetails: {
            ...viewing.viewingDetails,
            date: newDate,
            time: newTime,
          },
        }
      );
      if (!updated.success) {
        alert('The reschedule email was sent, but the viewing time could not be saved. Please try again.');
        return;
      }

      onRescheduled(viewing.id, newDate, newTime);
      alert('Reschedule request sent successfully!');
      onClose();
    } catch (error) {
      console.error('Error sending reschedule email:', error);
      alert('An error occurred while sending the reschedule request. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>Reschedule Viewing</h3>
            <button
              onClick={onClose}
              className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0`}
            >
              <X className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
            </button>
          </div>

          <div className="mb-4">
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-2`}>
              Property: <strong>{viewing.property.street}, {viewing.property.town}</strong>
            </p>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-2`}>
              Current Date: <strong>{viewing.viewingDetails.date}</strong>
            </p>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-4`}>
              Current Time: <strong>{viewing.viewingDetails.time}</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-1`}>
                New Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={newDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setNewDate(e.target.value)}
                className={`w-full ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
            <div>
              <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-1`}>
                New Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className={`w-full ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-1`}>
              Landlord or agent email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={agentEmail}
              onChange={(e) => setAgentEmail(e.target.value)}
              placeholder="agent@agency.com"
              className={`w-full ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

          <div className="mb-4">
            <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>
              Message to Agent/Landlord <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please explain why you need to reschedule and suggest alternative dates/times..."
              rows={isMobile ? 4 : 6}
              className={`w-full ${isMobile ? 'px-2.5 py-2 text-xs' : 'px-3 py-2 text-sm'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
            />
            <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-500 mt-1`}>
              This message will be sent via email to{' '}
              <span className="font-mono tracking-wide">{maskEmail(agentEmail)}</span>
            </p>
          </div>

          <div className={`flex ${isMobile ? 'flex-col-reverse' : 'items-center justify-end'} ${isMobile ? 'gap-2' : 'space-x-3'}`}>
            <button
              onClick={onClose}
              className={`${isMobile ? 'w-full' : ''} ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'} text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors`}
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={isSending || !message.trim()}
              className={`${isMobile ? 'w-full' : ''} ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span>Send Request</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantRescheduleModal;
