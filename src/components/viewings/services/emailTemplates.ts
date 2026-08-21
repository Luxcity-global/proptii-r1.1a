import { PropertyDetails, ViewingDetails } from '../context/BookViewingContext';

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

// CTA Button component - matches emailClient.js style
const getCtaButton = (text: string, url: string): string => {
  return `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${url}" 
         style="display: inline-block; 
                padding: 14px 32px; 
                background: linear-gradient(135deg, #DC5F12 0%, #FF6B1A 100%);
                color: #ffffff;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 600;
                font-size: 16px;
                box-shadow: 0 4px 12px rgba(220, 95, 18, 0.3);">
        ${text}
      </a>
    </div>
  `;
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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { margin-bottom: 20px; }
        .details { margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <p>Hi ${property.agent?.name || 'Agent'},</p>
          <p>You've received a new viewing request for ${property.street}.</p>
        </div>

        <div class="details">
          <p><strong>Here are the details:</strong></p>
          <p>Requested by: ${user.name || 'Not provided'}</p>
          <p>Preferred date/time: ${viewingDate} at ${viewingTime}</p>
          <p>Contact email: ${user.email || 'Not provided'}</p>
          <p>Phone number: ${user.phoneNumber || 'Not provided'}</p>
          ${viewing.whatsappNumber ? `<p>WhatsApp number: ${viewing.whatsappNumber}</p>` : ''}
        </div>

        <div class="message">
          <p>If the property is available, please review the request and confirm the appointment at your earliest convenience. If the suggested time doesn't work for you, kindly propose an alternative that suits your schedule.</p>
          <p>Please send your response to ${user.email}.</p>
        </div>

        ${getCtaButton('👉 Manage Viewing Requests on Proptii', `${BASE_URL}/landlord/viewings`)}

        <div style="margin-top: 24px; padding: 16px; background-color: #f0f9ff; border-left: 4px solid #136C9E; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #136C9E;">📱 New to Proptii?</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;">If you don't have a Proptii account yet, register now to:</p>
          <ul style="margin: 0 0 8px 0; padding-left: 20px; font-size: 14px;">
            <li>Manage all viewing requests in one place</li>
            <li>Track confirmed viewings</li>
            <li>Communicate with tenants efficiently</li>
            <li>Access your landlord dashboard</li>
          </ul>
          <div style="text-align: center; margin-top: 12px;">
            <a href="${BASE_URL}/landlord/register" 
               style="display: inline-block; 
                      padding: 10px 24px; 
                      background-color: #136C9E;
                      color: #ffffff;
                      text-decoration: none;
                      border-radius: 6px;
                      font-weight: 600;
                      font-size: 14px;">
              Register Now
            </a>
          </div>
        </div>

        <div class="footer">
          <p>Thanks,<br>- The Proptii Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const formatViewingDateLabel = (dateString?: string): string => {
  if (!dateString) return 'TBD';
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return parsed.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const wrapViewingEmail = (body: string): string => `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { margin-bottom: 20px; }
      .details { margin: 20px 0; }
      .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
    </style>
  </head>
  <body>
    <div class="container">
      ${body}
    </div>
  </body>
  </html>
`;

export const generateRescheduleRequestEmailTemplate = (
  data: EmailTemplateData & { message: string }
): string => {
  const { property, viewing, user, message } = data;
  const viewingDate = formatViewingDateLabel(viewing.date);
  const viewingTime = viewing.time ? formatTimeString(viewing.time) : 'TBD';
  const formattedMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />');

  return wrapViewingEmail(`
    <div class="header">
      <p>Hi ${property.agent?.name || 'there'},</p>
      <p>${user.name || 'An applicant'} would like to reschedule the viewing for <strong>${property.street || 'the property'}</strong>.</p>
    </div>
    <div class="details">
      <p><strong>Current appointment</strong></p>
      <p>Date: ${viewingDate}</p>
      <p>Time: ${viewingTime}</p>
      <p>Address: ${[property.street, property.town, property.city, property.postcode].filter(Boolean).join(', ') || 'Not provided'}</p>
      <p>Requested by: ${user.name || 'Not provided'} (${user.email || 'No email provided'})</p>
    </div>
    <div class="details">
      <p><strong>Message</strong></p>
      <p>${formattedMessage}</p>
    </div>
    ${getCtaButton('👉 Manage Viewing on Proptii', `${BASE_URL}/landlord/viewings`)}
    <div class="footer">
      <p>Thanks,<br>- The Proptii Team</p>
    </div>
  `);
};

export const generateCancelViewingEmailTemplate = (
  data: EmailTemplateData & { message?: string }
): string => {
  const { property, viewing, user, message } = data;
  const viewingDate = formatViewingDateLabel(viewing.date);
  const viewingTime = viewing.time ? formatTimeString(viewing.time) : 'TBD';
  const formattedMessage = (message || 'No additional message was provided.')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />');

  return wrapViewingEmail(`
    <div class="header">
      <p>Hi ${property.agent?.name || 'there'},</p>
      <p>${user.name || 'An applicant'} has cancelled the viewing for <strong>${property.street || 'the property'}</strong>.</p>
    </div>
    <div class="details">
      <p><strong>Cancelled appointment</strong></p>
      <p>Date: ${viewingDate}</p>
      <p>Time: ${viewingTime}</p>
      <p>Address: ${[property.street, property.town, property.city, property.postcode].filter(Boolean).join(', ') || 'Not provided'}</p>
      <p>Requested by: ${user.name || 'Not provided'} (${user.email || 'No email provided'})</p>
    </div>
    <div class="details">
      <p><strong>Reason for cancellation</strong></p>
      <p>${formattedMessage}</p>
    </div>
    ${getCtaButton('👉 Manage Viewing on Proptii', `${BASE_URL}/landlord/viewings`)}
    <div class="footer">
      <p>Thanks,<br>- The Proptii Team</p>
    </div>
  `);
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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { margin-bottom: 20px; }
        .details { margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <p>Hi ${userName},</p>
          <p>Your viewing request for ${property.street} has been sent to the agent.</p>
        </div>

        <div class="details">
          <p><strong>Here's a summary of what you submitted:</strong></p>
          <p>Date/time requested: ${viewingDate} at ${viewingTime}</p>
          <p>Agent: ${property.agent?.name || 'Not provided'}</p>
          <p>Address: ${property.street || 'Not provided'}</p>
          ${viewing.whatsappNumber ? `<p>WhatsApp number: ${viewing.whatsappNumber}</p>` : ''}
        </div>

        <div class="message">
          <p>The agent will contact you shortly to confirm the appointment.</p>
        </div>

        ${getCtaButton('👉 View My Viewing Requests on Proptii', `${BASE_URL}/dashboard/viewings`)}

        <div class="footer">
          <p>Thanks for using Proptii</p>
          <p>— The Proptii Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateTenantViewingUpdateEmailTemplate = (data: {
  tenantName?: string;
  propertyStreet?: string;
  date?: string;
  time?: string;
  intro: string;
  extra?: string;
}): string => {
  const viewingDate = data.date ? formatViewingDateLabel(data.date) : 'TBD';
  const viewingTime = data.time ? formatTimeString(data.time) : 'TBD';
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <p>Hi ${data.tenantName || 'there'},</p>
        <p>${data.intro}</p>
        <p><strong>Property:</strong> ${data.propertyStreet || 'Not provided'}</p>
        <p><strong>Date/time:</strong> ${viewingDate} at ${viewingTime}</p>
        ${data.extra ? `<p>${data.extra}</p>` : ''}
        ${getCtaButton('View your viewings', `${BASE_URL}/dashboard/viewings`)}
        <p>Thanks for using Proptii<br>— The Proptii Team</p>
      </div>
    </body>
    </html>
  `;
};
 