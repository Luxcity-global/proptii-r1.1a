import { describe, expect, it } from 'vitest';
import {
  generateCancelViewingEmailTemplate,
  generateRescheduleRequestEmailTemplate,
} from '../emailTemplates';

const baseData = {
  property: {
    street: '12 High Street',
    town: 'Leeds',
    city: 'Leeds',
    postcode: 'LS1 1AA',
    agent: {
      id: 'agent-1',
      name: 'Alex Agent',
      email: 'alex@agency.test',
    },
  },
  viewing: {
    date: '2026-08-20',
    time: '14:00',
    preference: 'In-Person Viewing',
  },
  user: {
    name: 'Taylor Tenant',
    email: 'taylor@example.com',
  },
};

describe('viewing action email templates', () => {
  it('includes the renter reschedule message for the agent', () => {
    const html = generateRescheduleRequestEmailTemplate({
      ...baseData,
      message: 'Can we move this to Friday?',
    });

    expect(html).toContain('would like to reschedule');
    expect(html).toContain('Can we move this to Friday?');
    expect(html).toContain('12 High Street');
    expect(html).toContain('/landlord/viewings');
  });

  it('includes the renter cancellation reason for the agent', () => {
    const html = generateCancelViewingEmailTemplate({
      ...baseData,
      message: 'Something came up',
    });

    expect(html).toContain('has cancelled the viewing');
    expect(html).toContain('Something came up');
    expect(html).toContain('12 High Street');
    expect(html).toContain('/landlord/viewings');
  });
});
