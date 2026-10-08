import { PropertyDetails, ViewingDetails } from '../context/BookViewingContext';
import { proptiiButton, renderProptiiEmail } from '../../../utils/proptiiEmailLayout';

interface EmailTemplateData {
  property: PropertyDetails;
  viewing: ViewingDetails;
  user: {
    name?: string;
    email?: string;
    phoneNumber?: string;
  };
}

// Base URL for Proptii application
// Get base URL for email links - supports both localhost (for local testing) and proptii.co (for production)
const getBaseUrl = (): string => {
  // Priority 1: If VITE_APP_URL is set (for Vite projects), use it explicitly
  const viteAppUrl = (import.meta as any)?.env?.VITE_APP_URL as string | undefined;
  if (viteAppUrl && viteAppUrl.trim()) {
    return viteAppUrl.trim();
  }

  // Priority 2: Use the current browser origin when available
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // Priority 3: Fallback based on Vite mode
  const isDev = (import.meta as any)?.env?.DEV ?? false;
  if (isDev) {
    // Default to localhost:5173 (Vite default) for local development
    return 'http://localhost:5173';
  }

  // Priority 4: Production - use proptii.co
  return 'https://proptii.co';
};

const BASE_URL = getBaseUrl();

// Helper function to format time strings properly
const formatTimeString = (timeString: string): string => {
  // If time is in HH:MM format, convert to 12-hour format
  if (/^\d{2}:\d{2}$/.test(timeString)) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // If it's already a full datetime, parse it normally
  try {
    const date = new Date(timeString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  } catch (error) {
    console.error('Error formatting time:', error);
  }

  return timeString; // Return as-is if can't parse
};

export const generateAgentEmailTemplate = (data: EmailTemplateData): string => {
  const { property, viewing, user } = data;
  const viewingDate = new Date(viewing.date!).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const viewingTime = formatTimeString(viewing.time!);

  return renderProptiiEmail({
    title: 'New viewing request',
    bodyHtml: `
      <p>Hi ${property.agent?.name || 'Agent'},</p>
      <p>You've received a new viewing request for ${property.street}.</p>
      <div class="details">
        <h3>Here are the details</h3>
        <p>Requested by: ${user.name || 'Not provided'}</p>
        <p>Preferred date/time: ${viewingDate} at ${viewingTime}</p>
        <p>Contact email: ${user.email || 'Not provided'}</p>
        <p>Phone number: ${user.phoneNumber || 'Not provided'}</p>
        ${viewing.whatsappNumber ? `<p>WhatsApp number: ${viewing.whatsappNumber}</p>` : ''}
      </div>
      <p>If the property is available, please review the request and confirm the appointment at your earliest convenience. If the suggested time doesn't work for you, kindly propose an alternative that suits your schedule.</p>
      <p>Please send your response to ${user.email}.</p>
      ${proptiiButton('Manage Viewing Requests on Proptii', `${BASE_URL}/landlord/viewings`)}
      <p>New to Proptii? If you don't have an account yet, <a href="${BASE_URL}/landlord/register">register here</a> to manage viewing requests, track confirmed viewings, message tenants, and open your landlord dashboard.</p>
    `,
  });
};

export const generateUserEmailTemplate = (data: EmailTemplateData): string => {
  const { property, viewing, user } = data;
  const viewingDate = new Date(viewing.date!).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const viewingTime = formatTimeString(viewing.time!);

  const userName = user.name?.split(' ')[0] || 'there';

  return renderProptiiEmail({
    title: 'Your viewing request',
    buttonLabel: 'View My Viewing Requests on Proptii',
    buttonHref: `${BASE_URL}/dashboard/viewings`,
    bodyHtml: `
      <p>Hi ${userName},</p>
      <p>Your viewing request for ${property.street} has been sent to the agent.</p>
      <div class="details">
        <h3>Here's a summary of what you submitted</h3>
        <p>Date/time requested: ${viewingDate} at ${viewingTime}</p>
        <p>Agent: ${property.agent?.name || 'Not provided'}</p>
        <p>Address: ${property.street || 'Not provided'}</p>
        ${viewing.whatsappNumber ? `<p>WhatsApp number: ${viewing.whatsappNumber}</p>` : ''}
      </div>
      <p>The agent will contact you shortly to confirm the appointment.</p>
      <p>Thanks for using Proptii.</p>
    `,
  });
}; 