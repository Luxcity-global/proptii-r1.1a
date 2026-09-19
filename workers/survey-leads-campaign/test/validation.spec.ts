import { describe, expect, it } from 'vitest';
import { generateToken, verifyToken } from '../src/crypto';
import { LeadValidationError, parseCreateLead } from '../src/validation';

const valid = {
  role: 'Independent landlord',
  propertyCount: '6–20',
  timeSinks: ['Contracts and paperwork', 'Other'],
  timeSinksOther: 'Chasing insurance renewals',
  adminHours: '5–10 hours',
  biggestGains: ['Contracts in one place', 'Something else'],
  biggestGainOther: 'Portfolio reporting',
  frustration: 'Too many tools',
  email: 'alex@propertyuk.co.uk',
  fullName: 'Alex Morgan',
  phone: '07700 900123',
  website: '',
};

describe('parseCreateLead', () => {
  it('accepts the campaign payload including name, phone, other notes and multi gains', () => {
    const parsed = parseCreateLead(valid);
    expect(parsed.fullName).toBe('Alex Morgan');
    expect(parsed.phone).toBe('07700 900123');
    expect(parsed.biggestGains).toHaveLength(2);
    expect(parsed.timeSinksOther).toBe('Chasing insurance renewals');
  });

  it('rejects honeypot submissions', () => {
    expect(() => parseCreateLead({ ...valid, website: 'http://spam.test' })).toThrow(LeadValidationError);
  });

  it('rejects more than three gains', () => {
    expect(() => parseCreateLead({
      ...valid,
      biggestGains: [
        'Contracts in one place',
        'Compliance',
        'Maintenance tracking',
        'Routine communication',
      ],
    })).toThrow(/1–3/);
  });
});

describe('session tokens', () => {
  it('round-trips a signed lead token', async () => {
    const token = await generateToken('lead-1', Date.now() + 60_000, 'test-secret-value-1234');
    const verified = await verifyToken(token, 'test-secret-value-1234');
    expect(verified.leadId).toBe('lead-1');
  });
});
