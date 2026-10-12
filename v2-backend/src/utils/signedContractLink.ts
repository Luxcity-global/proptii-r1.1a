/** Landlord/agent page that lists contracts the tenant has already signed. */
export function signedContractReviewUrl(frontendUrl = process.env.FRONTEND_URL || 'https://proptii.co'): string {
  const base = String(frontendUrl || 'https://proptii.co').replace(/\/+$/, '');
  return `${base}/landlord/contracts?tab=signed`;
}
