import { PropertyDetails, ViewingDetails } from '../context/BookViewingContext';
import emailService from '../../../services/emailService';

interface ViewingEmailData {
    property: PropertyDetails;
    viewing: ViewingDetails;
    user: {
        name?: string;
        email?: string;
    };
}

class ViewingEmailService {
    async sendViewingEmails(data: ViewingEmailData) {
        try {
            const results = await emailService.sendViewingEmails(data);
            return results;
        } catch (error) {
            console.error('Error sending viewing emails:', error);
            return {
                agent: false,
                user: false,
                error: error instanceof Error ? error.message : 'Failed to send emails'
            };
        }
    }
}

export const viewingEmailService = new ViewingEmailService(); 