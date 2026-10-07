import { describe, it, expect, vi, beforeEach } from 'vitest';
import { documentService } from '../../landlord_agent/src/services/documentService';

// Mock msalAccessToken and apiBaseUrl
vi.mock('../../services/msalAccessToken', () => ({
  getAccessTokenForApiRequest: vi.fn().mockResolvedValue('mock-token-abc'),
}));

vi.mock('../../config/apiBaseUrl', () => ({
  getResolvedApiBaseUrl: vi.fn().mockReturnValue('https://api.proptii.com/api'),
}));

describe('Frontend documentService (Landlord Vault)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('createDocument posts metadata to /api/documents and parses returned dates', async () => {
    const mockCreatedRaw = {
      id: 'doc_vault_01',
      landlordId: 'll_123',
      propertyId: null,
      name: 'Gas Safety CP12',
      type: 'application/pdf',
      url: 'https://storage/gas_cp12.pdf',
      issueDate: '2026-01-10T00:00:00.000Z',
      expiryDate: '2027-01-10T00:00:00.000Z',
      status: 'valid',
      createdAt: '2026-01-10T12:00:00.000Z',
      updatedAt: '2026-01-10T12:00:00.000Z',
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockCreatedRaw),
    });

    const result = await documentService.createDocument({
      name: 'Gas Safety CP12',
      type: 'application/pdf',
      url: 'https://storage/gas_cp12.pdf',
      issueDate: new Date('2026-01-10T00:00:00.000Z'),
      expiryDate: new Date('2027-01-10T00:00:00.000Z'),
      propertyId: null,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.proptii.com/api/documents',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token-abc',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          name: 'Gas Safety CP12',
          type: 'application/pdf',
          url: 'https://storage/gas_cp12.pdf',
          issueDate: '2026-01-10T00:00:00.000Z',
          expiryDate: '2027-01-10T00:00:00.000Z',
          propertyId: null,
        }),
      })
    );

    expect(result.id).toBe('doc_vault_01');
    expect(result.issueDate).toBeInstanceOf(Date);
    expect(result.expiryDate).toBeInstanceOf(Date);
    expect(result.status).toBe('valid');
  });

  it('getDocuments with "unassigned" parameter targets unassigned vault documents', async () => {
    const mockList = [
      {
        id: 'doc_unassigned_1',
        landlordId: 'll_123',
        propertyId: null,
        name: 'Unassigned EICR',
        type: 'application/pdf',
        url: 'https://storage/eicr.pdf',
        issueDate: '2026-02-01T00:00:00.000Z',
        expiryDate: null,
        status: 'valid',
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      },
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ documents: mockList }),
    });

    const docs = await documentService.getUnassignedDocuments();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.proptii.com/api/documents?propertyId=unassigned',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token-abc',
        }),
      })
    );

    expect(docs).toHaveLength(1);
    expect(docs[0].propertyId).toBeNull();
    expect(docs[0].expiryDate).toBeNull();
  });

  it('assignToProperty sends PATCH to assign document to a property', async () => {
    const mockUpdated = {
      id: 'doc_vault_01',
      landlordId: 'll_123',
      propertyId: 'prop_penthouse',
      name: 'Gas Safety CP12',
      type: 'application/pdf',
      url: 'https://storage/gas_cp12.pdf',
      issueDate: '2026-01-10T00:00:00.000Z',
      status: 'valid',
      createdAt: '2026-01-10T12:00:00.000Z',
      updatedAt: '2026-01-11T12:00:00.000Z',
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ document: mockUpdated }),
    });

    const updated = await documentService.assignToProperty('doc_vault_01', 'prop_penthouse');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.proptii.com/api/documents/doc_vault_01/assign',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ propertyId: 'prop_penthouse' }),
      })
    );

    expect(updated.propertyId).toBe('prop_penthouse');
  });

  it('deleteDocument sends DELETE to remove document from vault', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
    });

    await expect(documentService.deleteDocument('doc_to_delete_55')).resolves.not.toThrow();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.proptii.com/api/documents/doc_to_delete_55',
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });

  it('throws descriptive error on HTTP failure', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 403,
      text: vi.fn().mockResolvedValue('Forbidden: Not owner'),
    });

    await expect(
      documentService.assignToProperty('doc_forbidden', 'prop_123')
    ).rejects.toThrow('Failed to assign document (403)');
  });
});
