export interface SignedReturnSource {
  id: string;
  title?: string;
  propertyAddress?: string;
  tenantName?: string;
  tenantEmail?: string;
  landlordEmail?: string;
  landlordId?: string;
  contractType?: string;
}

/** A browser blob link only exists for the person who signed. Store a real file instead. */
export function durableDocumentUrl(uploadedUrl: string, dataUrl: string): string {
  return /^https?:\/\//i.test(uploadedUrl) ? uploadedUrl : dataUrl;
}

/**
 * The record saved when a contract is signed and sent.
 * A contract the tenant is returning keeps the original id so the landlord opens the signed PDF.
 */
export function buildSignedContractSave(input: {
  source?: SignedReturnSource | null;
  title?: string;
  propertyAddress?: string;
  recipientName: string;
  recipientEmail: string;
  signerName?: string;
  signerEmail?: string;
  uploadedUrl: string;
  dataUrl: string;
  byteLength: number;
}) {
  const source = input.source;
  const documentUrl = durableDocumentUrl(input.uploadedUrl, input.dataUrl);
  const title = input.title || source?.title || 'Contract Document';
  const propertyAddress = source?.propertyAddress || input.propertyAddress || '';
  return {
    ...(source?.id ? { id: source.id, contractId: source.id, sourceContractId: source.id } : {}),
    templateId: source?.id || 'template-id',
    templateName: title,
    landlordEmail: source?.landlordEmail || input.recipientEmail,
    landlordId: source?.landlordId || undefined,
    propertyName: propertyAddress.split(',')[0] || 'Contract Property',
    propertyAddress,
    contractType: source?.contractType || 'tenancy-agreement',
    agentName: input.recipientName || 'Agent',
    agentEmail: input.recipientEmail,
    tenantName: source?.tenantName || input.signerName || 'Tenant',
    tenantEmail: source?.tenantEmail || input.signerEmail || input.recipientEmail,
    signedBy: source?.id ? 'tenant' as const : undefined,
    documentUrl,
    documentName: `${(input.title || 'contract').replace(/[^a-zA-Z0-9]/g, '_')}_signed.pdf`,
    documentSize: input.byteLength,
    documentType: 'application/pdf' as const,
    status: (source?.id ? 'signed' : 'sent') as 'signed' | 'sent',
    emailSent: true,
  };
}
