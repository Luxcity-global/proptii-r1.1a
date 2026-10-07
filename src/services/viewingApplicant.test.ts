import { applyRememberedApplicant, rememberApplicant } from './viewingInboxService';

describe('landlord request viewing applicant', () => {
  it('shows the typed applicant when the saved viewing comes back as the landlord email', () => {
    rememberApplicant(
      'viewing_1',
      { fullName: 'Jane Tenant', email: 'jane@tenant.test', phoneNumber: '07000000000' },
      'aishadaodu@gmail.com',
    );

    const row = applyRememberedApplicant({
      id: 'viewing_1',
      tenantEmail: 'aishadaodu@gmail.com',
      viewingDetails: {
        userDetails: { fullName: '', email: 'aishadaodu@gmail.com', phoneNumber: '' },
      },
    });

    expect(row.viewingDetails.userDetails.email).toBe('jane@tenant.test');
    expect(row.viewingDetails.userDetails.fullName).toBe('Jane Tenant');
  });
});
