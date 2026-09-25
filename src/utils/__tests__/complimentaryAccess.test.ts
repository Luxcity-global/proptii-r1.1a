import {
  complimentaryPlanForRole,
  isComplimentaryAccessEmail,
} from '../complimentaryAccess';

describe('isComplimentaryAccessEmail', () => {
  it('grants theluxcity.co.uk addresses', () => {
    expect(isComplimentaryAccessEmail('alex@theluxcity.co.uk')).toBe(true);
    expect(isComplimentaryAccessEmail('Alex@TheLuxCity.co.uk')).toBe(true);
  });

  it('rejects other domains and empty values', () => {
    expect(isComplimentaryAccessEmail('alex@gmail.com')).toBe(false);
    expect(isComplimentaryAccessEmail('')).toBe(false);
    expect(isComplimentaryAccessEmail(null)).toBe(false);
  });
});

describe('complimentaryPlanForRole', () => {
  it('returns the highest plan per role', () => {
    expect(complimentaryPlanForRole('agent')).toBe('enterprise');
    expect(complimentaryPlanForRole('landlord')).toBe('elite');
    expect(complimentaryPlanForRole('renter')).toBe('buyer_pro');
    expect(complimentaryPlanForRole('buyer')).toBe('buyer_pro');
    expect(complimentaryPlanForRole(null)).toBe('buyer_pro');
  });
});
