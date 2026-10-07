import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import bookViewingRequestService from '../../services/bookViewingRequestService';
import { viewingService } from '../../services/viewingService';
import { listViewingsForLandlord } from '../../services/viewingInboxService';
import { firestoreService } from '../../services/firestoreService';
import { referencingService } from '../../landlord_agent/src/services/referencingService';
import { contractService } from '../../landlord_agent/src/services/contractService';
import { buildSignedContractSave, durableDocumentUrl } from '../../services/signedContractHandoff';
import apiService from '../../services/api';
import type { Contract } from '../../landlord_agent/src/components/ContractsPage';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../services/msalAccessToken', () => ({
  getAccessTokenForApiRequest: vi.fn().mockResolvedValue('test-token'),
}));

vi.mock('../../config/apiBaseUrl', () => ({
  getResolvedApiBaseUrl: () => 'http://api.test/api',
}));

vi.mock('../../config/firebaseConfig', () => ({
  auth: { currentUser: { uid: 'tenant-1', email: 'tenant@example.com' } },
  db: null,
  storage: null,
}));

const AGENT_EMAIL = 'agent@landlord.test';
const TENANT_EMAIL = 'tenant@example.com';
const TINY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => body,
  };
}

describe('tenant and landlord flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (referencingService as unknown as { passportLookup: Promise<unknown> | null }).passportLookup = null;
    vi.mocked(apiService.get).mockResolvedValue({ data: [] });
    vi.mocked(apiService.post).mockResolvedValue({ id: 'saved-1', data: { id: 'saved-1' } });
  });

  describe('book viewing', () => {
    it('shows a tenant booking on the landlord side when the agent email matches', async () => {
      vi.mocked(apiService.post).mockResolvedValue({ id: 'viewing-1', data: { id: 'viewing-1' } });

      const saved = await bookViewingRequestService.saveRequest(
        'tenant-1',
        '12 Maple Court',
        {
          street: '12 Maple Court',
          town: 'Manchester',
          postcode: 'M1 4AB',
          agent: {
            id: '',
            name: 'Aisha Agent',
            email: AGENT_EMAIL,
            phone: '07000000000',
            company: 'Proptii',
          },
        },
        { landlordId: null, agentId: null },
        {
          date: '2026-10-20',
          time: '10:00',
          preference: 'In-Person Viewing',
          userDetails: { fullName: 'Tenant One', email: TENANT_EMAIL, phoneNumber: '07000000001' },
        },
      );

      expect(saved.success).toBe(true);
      const posted = vi.mocked(apiService.post).mock.calls[0][1] as { agentEmail?: string; propertyTitle?: string };
      expect(posted.agentEmail).toBe(AGENT_EMAIL);
      expect(posted.propertyTitle).toContain('12 Maple Court');

      const visible = await listViewingsForLandlord({
        uid: 'landlord-1',
        email: AGENT_EMAIL,
        propertyTitles: ['12 Maple Court'],
      });
      const otherAgent = await listViewingsForLandlord({
        uid: 'someone-else',
        email: 'other@agency.test',
      });

      expect(visible.map((row) => row.id)).toContain('viewing-1');
      expect(visible[0].property.agent.email).toBe(AGENT_EMAIL);
      expect(otherAgent.map((row) => row.id)).not.toContain('viewing-1');
    });

    it('sends the viewing to the landlord account instead of the listing id', async () => {
      vi.mocked(apiService.get).mockImplementation(async (path: string) => {
        if (String(path).includes('/landlords/check')) {
          return {
            success: true,
            data: {
              exists: true,
              user: { id: 'landlordAccountId1234567890', email: AGENT_EMAIL, role: 'landlord', name: 'Aisha Agent' },
            },
          };
        }
        return { data: [] };
      });
      vi.mocked(apiService.post).mockResolvedValue({ id: 'viewing-2', data: { id: 'viewing-2' } });

      const saved = await viewingService.saveViewingBooking(
        'tenant-1',
        {
          street: '12 Maple Court',
          town: 'Manchester',
          postcode: 'M1 4AB',
          agent: { id: 'agent-temp', name: 'Aisha Agent', email: AGENT_EMAIL, phone: '', company: '' },
        },
        {
          date: '2026-10-21',
          time: '14:00',
          preference: 'In-Person Viewing',
          userDetails: { fullName: 'Tenant One', email: TENANT_EMAIL, phoneNumber: '07000000001' },
        },
        '12 Maple Court',
        { landlordId: 'agent-temp', agentId: 'agent-temp' },
      );

      expect(saved.success).toBe(true);
      const posted = vi.mocked(apiService.post).mock.calls[0][1] as {
        landlordId: string | null;
        agentEmail: string | null;
        propertyId: string | null;
      };
      expect(posted.landlordId).toBe('landlordAccountId1234567890');
      expect(posted.agentEmail).toBe(AGENT_EMAIL);
      expect(posted.propertyId).toBeNull();
    });
  });

  describe('referencing', () => {
    it('saves the tenant email on the passport and the landlord sees it as started', async () => {
      const posts: unknown[] = [];
      vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
        const path = String(url);
        if (init?.method === 'POST' && path.includes('/referencing/forms/')) {
          posts.push(JSON.parse(String(init.body)));
          return jsonResponse({ success: true });
        }
        if (path.includes('/referencing/status/')) {
          return jsonResponse({ status: 'none' });
        }
        if (path.includes('/referencing/forms/general_tenant-1')) {
          return jsonResponse({
            success: true,
            data: {
              status: 'draft',
              formData: {
                identity: { firstName: 'Tenant', lastName: 'One', email: TENANT_EMAIL },
              },
            },
          });
        }
        if (path.includes('/referencing/received')) {
          return jsonResponse({ success: true, data: [] });
        }
        return jsonResponse({ success: true, data: null }, false, 404);
      }));

      const save = await firestoreService.saveReferencingForm(
        'tenant-1',
        'general_tenant-1',
        { identity: { email: 'Tenant@Example.com', firstName: 'Tenant' } } as never,
        1,
        { 1: 'partial' },
      );
      expect(save.success).toBe(true);
      expect(posts[0]).toMatchObject({ email: TENANT_EMAIL });

      const started = await referencingService.getReferencingStatusByEmail(TENANT_EMAIL);
      expect(started.status).toBe('in-progress');
      expect(started.data?.formData?.identity?.email).toBe(TENANT_EMAIL);
    });

    it('keeps an empty passport as not started', async () => {
      vi.stubGlobal('fetch', vi.fn(async (url: string) => {
        const path = String(url);
        if (path.includes('/referencing/status/')) return jsonResponse({ status: 'none' });
        if (path.includes('/referencing/forms/')) {
          return jsonResponse({ success: true, data: { formData: {}, currentStep: 1 } });
        }
        if (path.includes('/referencing/received')) return jsonResponse({ success: true, data: [] });
        return jsonResponse({}, false, 404);
      }));

      const status = await referencingService.getReferencingStatusByEmail('new.tenant@example.com');
      expect(status.status).toBe('not-started');
    });

    it('shows a completed passport when the status call only says in progress', async () => {
      vi.stubGlobal('fetch', vi.fn(async (url: string) => {
        const path = String(url);
        if (path.includes('/referencing/status/')) {
          return jsonResponse({
            status: 'in-progress',
            submissionId: 'general_tenant-1',
            data: { formData: {}, isSubmitted: false },
          });
        }
        if (path.includes('/referencing/forms/general_tenant-1')) {
          return jsonResponse({
            success: true,
            data: {
              status: 'draft',
              identity: {
                firstName: 'Aisha',
                lastName: 'Daodu',
                email: TENANT_EMAIL,
              },
              employment: { employmentStatus: 'Employed', companyDetails: 'Northwind', jobPosition: 'Analyst' },
              residential: { currentAddress: '12 Maple Court' },
              financial: { monthlyIncome: '3200' },
            },
          });
        }
        if (path.includes('/referencing/received')) return jsonResponse({ success: true, data: [] });
        if (path.includes('/referencing/forms/')) {
          return jsonResponse({ success: true, data: { formData: {}, currentStep: 1 } });
        }
        return jsonResponse({}, false, 404);
      }));

      const status = await referencingService.getReferencingStatusByEmail(TENANT_EMAIL);
      expect(status.status).toBe('complete');
      expect(status.data?.formData?.employment?.companyDetails).toBe('Northwind');
      expect(status.data?.formData?.residential?.currentAddress).toBe('12 Maple Court');
    });
  });

  describe('contracts', () => {
    it('keeps a drawn signature inside the saved PDF', async () => {
      const blank = await PDFDocument.create();
      blank.addPage([600, 800]);
      const blankBytes = await blank.save();

      const signed = await PDFDocument.load(blankBytes);
      const image = await signed.embedPng(TINY_PNG);
      signed.getPage(0).drawImage(image, { x: 72, y: 120, width: 160, height: 50 });
      const signedBytes = await signed.save();

      const raw = Buffer.from(signedBytes).toString('latin1');
      expect(raw.startsWith('%PDF')).toBe(true);
      expect(raw).toContain('/Subtype /Image');
      expect(signedBytes.length).toBeGreaterThan(blankBytes.length);
    });

    it('writes the signed file back onto the contract the landlord already has', () => {
      const stored = buildSignedContractSave({
        source: {
          id: 'contract-original',
          title: 'Maple Court AST',
          propertyAddress: '12 Maple Court, Manchester',
          tenantName: 'Tenant One',
          tenantEmail: TENANT_EMAIL,
          landlordEmail: AGENT_EMAIL,
          landlordId: 'landlord-1',
          contractType: 'tenancy-agreement',
        },
        title: 'Maple Court AST',
        recipientName: 'Aisha Agent',
        recipientEmail: AGENT_EMAIL,
        signerName: 'Tenant One',
        signerEmail: TENANT_EMAIL,
        uploadedUrl: 'https://files.example/signed.pdf',
        dataUrl: 'data:application/pdf;base64,JVBERg==',
        byteLength: 1200,
      });

      expect(stored.id).toBe('contract-original');
      expect(stored.documentUrl).toBe('https://files.example/signed.pdf');
      expect(stored.status).toBe('signed');
      expect(stored.landlordEmail).toBe(AGENT_EMAIL);
      expect(stored.tenantEmail).toBe(TENANT_EMAIL);

      expect(durableDocumentUrl('blob:http://localhost/tmp', 'data:application/pdf;base64,JVBERg=='))
        .toBe('data:application/pdf;base64,JVBERg==');

      const freshSend = buildSignedContractSave({
        title: 'New agreement',
        recipientName: 'Aisha Agent',
        recipientEmail: AGENT_EMAIL,
        signerName: 'Tenant One',
        signerEmail: TENANT_EMAIL,
        uploadedUrl: 'https://files.example/new.pdf',
        dataUrl: 'data:application/pdf;base64,JVBERg==',
        byteLength: 800,
      });
      expect(freshSend.id).toBeUndefined();
      expect(freshSend.status).toBe('sent');
    });

    it('lets the landlord sign without taking the contract away from the tenant', async () => {
      const contract = {
        id: 'contract-original',
        title: 'Maple Court AST',
        propertyAddress: '12 Maple Court',
        tenantName: 'Tenant One',
        tenantEmail: TENANT_EMAIL,
        status: 'sent',
        sentDate: new Date('2026-10-01'),
        contractType: 'tenancy-agreement',
        fileUrl: 'https://files.example/original.pdf',
        fileName: 'Maple-Court.pdf',
      } as Contract;

      await contractService.saveLandlordSignature(
        contract,
        'https://files.example/landlord-signed.pdf',
        'landlord-1',
        AGENT_EMAIL,
      );

      const body = vi.mocked(apiService.post).mock.calls[0][1] as {
        id: string;
        status: string;
        signedBy: string;
        fileUrl: string;
        tenantEmail: string;
      };
      expect(vi.mocked(apiService.post).mock.calls[0][0]).toBe('/contracts');
      expect(body.id).toBe('contract-original');
      expect(body.status).toBe('sent');
      expect(body.signedBy).toBe('landlord');
      expect(body.fileUrl).toBe('https://files.example/landlord-signed.pdf');
      expect(body.tenantEmail).toBe(TENANT_EMAIL);

      vi.mocked(apiService.post).mockClear();
      await contractService.saveLandlordSignature(contract, 'blob:http://localhost/tmp', 'landlord-1', AGENT_EMAIL);
      const fallback = vi.mocked(apiService.post).mock.calls[0][1] as { fileUrl: string };
      expect(fallback.fileUrl).toBe('https://files.example/original.pdf');
    });
  });
});
