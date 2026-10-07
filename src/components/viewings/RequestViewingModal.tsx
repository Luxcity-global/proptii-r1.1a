import React, { useEffect, useMemo, useState } from 'react';
import { Eye, X } from 'lucide-react';
import { viewingService, ViewingBooking } from '../../services/viewingService';
import { viewingEmailService } from './services/viewingEmailService';
import { generateAgentEmailTemplate, generateUserEmailTemplate } from './services/emailTemplates';

const TIME_SLOTS = [
  { value: '10:00', label: '10:00 AM – 10:45 AM' },
  { value: '11:30', label: '11:30 AM – 12:15 PM' },
  { value: '14:00', label: '02:00 PM – 02:45 PM' },
  { value: '16:00', label: '04:00 PM – 04:45 PM' },
  { value: '18:00', label: '06:00 PM – 06:45 PM (Evening)' },
];

export interface RequestViewingProperty {
  id?: string;
  street: string;
  town?: string;
  city?: string;
  postcode?: string;
  agent?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
  };
}

interface RequestViewingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
  userId?: string;
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  properties?: RequestViewingProperty[];
  prefilledProperty?: RequestViewingProperty | null;
}

function propertyLabel(property: RequestViewingProperty): string {
  return [property.street, property.town, property.city, property.postcode].filter(Boolean).join(', ');
}

function propertyKey(property: RequestViewingProperty, index: number): string {
  return property.id || `${property.street}-${index}`;
}

const RequestViewingModal: React.FC<RequestViewingModalProps> = ({
  open,
  onClose,
  onSubmitted,
  userId,
  applicantName,
  applicantEmail,
  applicantPhone,
  properties = [],
  prefilledProperty,
}) => {
  const choices = useMemo(() => {
    const list = [...properties];
    if (prefilledProperty?.street && !list.some((item) => item.id && item.id === prefilledProperty.id && item.street === prefilledProperty.street)) {
      const already = list.some((item) => propertyLabel(item) === propertyLabel(prefilledProperty));
      if (!already) list.unshift(prefilledProperty);
    }
    return list.filter((item) => item.street);
  }, [properties, prefilledProperty]);

  const [propertyId, setPropertyId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [preference, setPreference] = useState<'In-Person Viewing' | 'Virtual Viewing'>('In-Person Viewing');
  const [notes, setNotes] = useState('');
  const [manualStreet, setManualStreet] = useState('');
  const [manualAgentEmail, setManualAgentEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestSaved, setRequestSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const initial = prefilledProperty?.street
      ? choices.find((item) => propertyLabel(item) === propertyLabel(prefilledProperty)) || choices[0]
      : choices[0];
    setPropertyId(initial ? propertyKey(initial, choices.indexOf(initial)) : '');
    setDate(new Date().toISOString().slice(0, 10));
    setTime('14:00');
    setPreference('In-Person Viewing');
    setNotes('');
    setManualStreet('');
    setManualAgentEmail(prefilledProperty?.agent?.email || '');
    setRequestSaved(false);
    setError('');
  }, [open, prefilledProperty, choices]);

  if (!open) return null;

  const selected = choices.find((item, index) => propertyKey(item, index) === propertyId) || choices[0];
  const propertyToSend: RequestViewingProperty | undefined = selected?.street
    ? selected
    : manualStreet.trim()
      ? { street: manualStreet.trim(), agent: { email: manualAgentEmail.trim() } }
      : undefined;

  const handleSubmit = async () => {
    if (!propertyToSend?.street) {
      setError('Choose a property for this viewing.');
      return;
    }
    if (!date || !time) {
      setError('Choose a preferred date and time.');
      return;
    }
    if (!userId) {
      setError('Sign in again to request this viewing.');
      return;
    }

    const agentEmail = (propertyToSend.agent?.email || manualAgentEmail).trim();
    if (!agentEmail.includes('@')) {
      setError('Add the landlord or agent email so they receive this request.');
      return;
    }
    const agent = {
      id: propertyToSend.agent?.id || '',
      name: propertyToSend.agent?.name || '',
      email: agentEmail,
      phone: propertyToSend.agent?.phone || '',
      company: propertyToSend.agent?.company || '',
    };
    const property: ViewingBooking['property'] = {
      street: propertyToSend.street,
      town: propertyToSend.town,
      city: propertyToSend.city,
      postcode: propertyToSend.postcode,
      agent,
    };
    const viewingDetails = {
      date,
      time,
      preference,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      userDetails: {
        fullName: applicantName || 'Prospective Tenant',
        email: applicantEmail || '',
        phoneNumber: applicantPhone || '',
      },
    } as ViewingBooking['viewingDetails'];

    setSubmitting(true);
    setError('');
    try {
      if (!requestSaved) {
        const saved = await viewingService.saveViewingBooking(
          userId,
          property,
          viewingDetails,
          propertyToSend.id,
          { agentId: agent.id || null, landlordId: agent.id || null },
        );
        if (!saved.success) throw new Error(saved.error || 'Could not send this viewing request.');
        setRequestSaved(true);
      }

      const mailUser = {
        name: viewingDetails.userDetails.fullName,
        email: viewingDetails.userDetails.email,
        phoneNumber: viewingDetails.userDetails.phoneNumber,
      };
      const emailResult = await viewingEmailService.sendViewingEmails({
        property,
        viewing: viewingDetails,
        user: mailUser,
        agentHtml: generateAgentEmailTemplate({ property, viewing: viewingDetails, user: mailUser }),
        userHtml: generateUserEmailTemplate({ property, viewing: viewingDetails, user: mailUser }),
      });
      if (!emailResult.agent) {
        setError('The request was saved, but the email to the landlord did not send. It will still appear on their viewings list.');
        return;
      }
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send this viewing request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tn-modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="tn-modal tn-modal-lg" onClick={(event) => event.stopPropagation()}>
        <div className="tn-modal-head">
          <span className="tn-modal-ico orange"><Eye size={16} /></span>
          <div>
            <h3>Request a Property Viewing</h3>
            <p>Ask the agent for an in-person or virtual walkthrough</p>
          </div>
          <button type="button" className="tn-modal-x" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="tn-modal-body">
          <label className="tn-modal-label">
            <span>Property</span>
            {choices.length > 0 ? (
              <select value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>
                {choices.map((property, index) => (
                  <option key={propertyKey(property, index)} value={propertyKey(property, index)}>
                    {propertyLabel(property)}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={manualStreet}
                placeholder="Street and postcode"
                onChange={(event) => setManualStreet(event.target.value)}
              />
            )}
          </label>
          {choices.length === 0 || !selected?.agent?.email ? (
            <label className="tn-modal-label">
              <span>Landlord or agent email</span>
              <input
                type="email"
                value={manualAgentEmail}
                placeholder="agent@agency.com"
                onChange={(event) => setManualAgentEmail(event.target.value)}
              />
            </label>
          ) : null}
          <div className="tn-modal-grid2">
            <label className="tn-modal-label">
              <span>Preferred date</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label className="tn-modal-label">
              <span>Time slot</span>
              <select value={time} onChange={(event) => setTime(event.target.value)}>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot.value} value={slot.value}>{slot.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="tn-modal-label">
            <span>Viewing type</span>
            <div className="tn-modal-party">
              <label className={preference === 'In-Person Viewing' ? 'is-on' : ''}>
                <input
                  type="radio"
                  name="requestViewingType"
                  checked={preference === 'In-Person Viewing'}
                  onChange={() => setPreference('In-Person Viewing')}
                />
                In-person
              </label>
              <label className={preference === 'Virtual Viewing' ? 'is-on' : ''}>
                <input
                  type="radio"
                  name="requestViewingType"
                  checked={preference === 'Virtual Viewing'}
                  onChange={() => setPreference('Virtual Viewing')}
                />
                Virtual tour
              </label>
            </div>
          </div>
          <div className="tn-modal-grid2">
            <label className="tn-modal-label">
              <span>Your name</span>
              <input value={applicantName || ''} readOnly />
            </label>
            <label className="tn-modal-label">
              <span>Your email</span>
              <input value={applicantEmail || ''} readOnly />
            </label>
          </div>
          <label className="tn-modal-label">
            <span>Notes for the agent</span>
            <textarea
              rows={2}
              placeholder="Anything the agent should know before the viewing"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          {error ? <p className="tn-modal-errors">{error}</p> : null}
        </div>
        <div className="tn-modal-foot">
          <button type="button" className="tn-modal-cancel" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="tn-modal-primary" onClick={handleSubmit} disabled={submitting || !propertyToSend}>
            {submitting ? 'Submitting…' : requestSaved ? 'Resend landlord email' : 'Submit Viewing Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestViewingModal;
