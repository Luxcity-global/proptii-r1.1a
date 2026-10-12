import { describe, expect, it } from 'vitest';
import { signedContractReviewUrl } from './signedContractLink';

describe('signedContractReviewUrl', () => {
  it('opens the landlord signed-contracts tab instead of the marketing homepage', () => {
    expect(signedContractReviewUrl('https://proptii.co/')).toBe(
      'https://proptii.co/landlord/contracts?tab=signed',
    );
    expect(signedContractReviewUrl()).toContain('/landlord/contracts?tab=signed');
  });
});
