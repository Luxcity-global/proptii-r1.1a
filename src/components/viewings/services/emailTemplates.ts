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
        </div>

        <div class="message">
          <p>If the property is available, please review the request and confirm the appointment at your earliest convenience. If the suggested time doesn't work for you, kindly propose an alternative that suits your schedule.</p>
          <p>Please send your response to ${user.email}.</p>
        </div>

        <div class="footer">
          <p>Thanks,<br>- The Proptii Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
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
          <p>Address: ${property.street}, ${property.city}, ${property.postcode}</p>
        </div>

        <div class="message">
          <p>The agent will contact you shortly to confirm the appointment.</p>
        </div>

        <div class="footer">
          <p>Thanks for using Proptii</p>
          <p>— The Proptii Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
}; 