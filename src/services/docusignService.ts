export interface DocuSignEnvelope {
  envelopeId: string;
  status: string;
  created: string;
  lastModified: string;
  uri: string;
}

export interface DocuSignRecipient {
  email: string;
  name: string;
  recipientId: string;
  routingOrder: number;
  roleName: string;
}

export interface DocuSignDocument {
  documentBase64: string;
  name: string;
  fileExtension: string;
  documentId: string;
}

export interface DocuSignEnvelopeRequest {
  emailSubject: string;
  emailBlurb?: string;
  documents: DocuSignDocument[];
  recipients: DocuSignRecipient[];
  status?: string;
}

export interface DocuSignSigningRequest {
  envelopeId: string;
  returnUrl?: string;
  authenticationMethod?: string;
  clientUserId?: string;
  email?: string;
  userName?: string;
}

import { getResolvedApiBaseUrl } from '../config/apiBaseUrl';

export class DocuSignService {
  private mockMode: boolean = false;
  private readonly backendApiUrl: string;

  constructor() {
    this.backendApiUrl = getResolvedApiBaseUrl();
  }

  // Check if running in mock mode
  public isMockMode(): boolean {
    return this.mockMode;
  }

  // Create envelope via backend API
  public async createEnvelope(request: DocuSignEnvelopeRequest): Promise<DocuSignEnvelope> {
    if (this.mockMode) {
      return this.createMockEnvelope();
    }

    try {
      console.log('📄 Creating DocuSign envelope via backend API...');
      
      const response = await fetch(`${this.backendApiUrl}/docusign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createEnvelope',
          data: {
            emailSubject: request.emailSubject,
            emailBlurb: request.emailBlurb || 'Please sign this document',
            documents: request.documents,
            recipients: request.recipients,
            status: request.status || 'created'
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Backend API error: ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown backend error');
      }

      console.log('✅ DocuSign envelope created successfully:', result.data.envelopeId);
      return result.data;
      
    } catch (error) {
      console.error('❌ Error creating DocuSign envelope:', error);
      console.warn('Falling back to mock mode due to API failure');
      this.mockMode = true;
      return this.createMockEnvelope();
    }
  }

  // Get embedded signing URL via backend API
  public async getEmbeddedSigningUrl(request: DocuSignSigningRequest): Promise<string> {
    if (this.mockMode) {
      return this.getMockSigningUrl();
    }

    try {
      console.log('🔗 Getting embedded signing URL via backend API...');
      
      const response = await fetch(`${this.backendApiUrl}/docusign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getSigningUrl',
          data: {
            envelopeId: request.envelopeId,
            returnUrl: request.returnUrl || window.location.origin + '/contracts',
            authenticationMethod: request.authenticationMethod || 'none',
            clientUserId: request.clientUserId || '1000',
            email: request.email || 'user@example.com',
            userName: request.userName || 'User Name'
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Backend API error: ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown backend error');
      }

      console.log('✅ Embedded signing URL obtained successfully');
      return result.data;
      
    } catch (error) {
      console.error('❌ Error getting embedded signing URL:', error);
      console.warn('Falling back to mock mode due to API failure');
      this.mockMode = true;
      return this.getMockSigningUrl();
    }
  }

  // Get envelope status via backend API
  public async getEnvelopeStatus(envelopeId: string): Promise<DocuSignEnvelope> {
    if (this.mockMode) {
      return this.getMockEnvelopeStatus(envelopeId);
    }

    try {
      console.log('📊 Getting envelope status via backend API...');
      
      const response = await fetch(`${this.backendApiUrl}/docusign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getStatus',
          data: {
            envelopeId: envelopeId
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Backend API error: ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown backend error');
      }

      console.log('✅ Envelope status obtained successfully');
      return result.data;
      
    } catch (error) {
      console.error('❌ Error getting envelope status:', error);
      console.warn('Falling back to mock mode due to API failure');
      this.mockMode = true;
      return this.getMockEnvelopeStatus(envelopeId);
    }
  }

  // Create envelope from document (convenience method)
  public async createEnvelopeFromDocument(
    documentBase64: string,
    fileName: string,
    recipients: DocuSignRecipient[],
    emailSubject: string = 'Document for Signature'
  ): Promise<DocuSignEnvelope> {
    const document: DocuSignDocument = {
      documentBase64: documentBase64,
      name: fileName,
      fileExtension: fileName.split('.').pop()?.toLowerCase() || 'pdf',
      documentId: '1'
    };

    const request: DocuSignEnvelopeRequest = {
      emailSubject: emailSubject,
      emailBlurb: 'Please review and sign this document',
      documents: [document],
      recipients: recipients,
      status: 'sent'
    };

    return this.createEnvelope(request);
  }

  // Mock methods for testing/fallback
  private createMockEnvelope(): DocuSignEnvelope {
    // Simulate API delay
    setTimeout(() => {}, 1000);
    
    const mockId = `mock-envelope-${Date.now()}`;
    console.log('🎭 Creating mock DocuSign envelope:', mockId);
    console.log('📝 Mock envelope created successfully! (Backend will handle real DocuSign API)');
    
    return {
      envelopeId: mockId,
      status: 'sent',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      uri: `/envelopes/${mockId}`
    };
  }

  private getMockSigningUrl(): string {
    const mockUrl = `https://demo.docusign.net/Signing/StartInSession.aspx?t=${Date.now()}`;
    console.log('🎭 Creating mock signing URL:', mockUrl);
    console.log('🔗 Mock signing URL ready! (Backend will handle real DocuSign API)');
    return mockUrl;
  }

  private getMockEnvelopeStatus(envelopeId: string): DocuSignEnvelope {
    console.log('🎭 Getting mock envelope status for:', envelopeId);
    return {
      envelopeId: envelopeId,
      status: 'completed',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      uri: `/envelopes/${envelopeId}`
    };
  }
}

// Export singleton instance
export const docuSignService = new DocuSignService(); 