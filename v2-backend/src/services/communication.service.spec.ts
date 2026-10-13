import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommunicationService } from './communication.service';
import { ForbiddenException } from '@nestjs/common';

describe('CommunicationService - getMessages resilience', () => {
  let service: CommunicationService;
  let mockEmailService: any;
  let mockUserProfileService: any;

  beforeEach(() => {
    mockEmailService = {};
    mockUserProfileService = {};
    service = new CommunicationService(mockEmailService, mockUserProfileService);
  });

  it('falls back to in-memory sort and unindexed query when Firestore throws FAILED_PRECONDITION (missing index)', async () => {
    const mockMessages = [
      { id: 'msg-1', conversationId: 'conv-123', body: 'First message', sentAt: '2026-10-13T10:00:00Z', isDeleted: false },
      { id: 'msg-2', conversationId: 'conv-123', body: 'Second message', sentAt: '2026-10-13T10:05:00Z', isDeleted: false },
      { id: 'msg-deleted', conversationId: 'conv-123', body: 'Deleted message', sentAt: '2026-10-13T10:02:00Z', isDeleted: true },
    ];

    // Mock query that fails on orderBy (simulating missing composite index)
    const mockQueryWithOrderBy = {
      limit: vi.fn().mockReturnThis(),
      get: vi.fn().mockRejectedValue(new Error('9 FAILED_PRECONDITION: The query requires an index.')),
    };

    // Mock collection that handles both the failing query and the fallback unindexed get()
    const mockCol: any = {
      where: vi.fn((field: string, op: string, val: any) => {
        return {
          orderBy: vi.fn(() => mockQueryWithOrderBy),
          get: vi.fn().mockResolvedValue({
            docs: mockMessages.map(m => ({ id: m.id, data: () => m })),
          }),
        };
      }),
    };

    // Spy on messagesCol getter
    vi.spyOn(service as any, 'messagesCol', 'get').mockReturnValue(mockCol);

    const result = await service.getMessages('conv-123');

    // Should successfully return messages in chronological order, filtering deleted ones
    expect(result.data).toHaveLength(2);
    expect(result.data[0].id).toBe('msg-1');
    expect(result.data[1].id).toBe('msg-2');
    expect(result.data[0].body).toBe('First message');
    expect(result.data[1].body).toBe('Second message');
  });

  it('enforces participant authorization when user is not admin or participant', async () => {
    const mockConvDoc = {
      exists: true,
      data: () => ({
        tenantId: 'tenant-user',
        landlordId: 'landlord-user',
        tenantEmail: 'tenant@test.com',
        landlordEmail: 'landlord@test.com',
      }),
    };

    const mockConversationsCol = {
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue(mockConvDoc),
      }),
    };

    vi.spyOn(service as any, 'conversationsCol', 'get').mockReturnValue(mockConversationsCol);
    vi.spyOn(service as any, 'messagesCol', 'get').mockReturnValue({});

    await expect(
      service.getMessages('conv-123', { uid: 'stranger-id', email: 'stranger@test.com' })
    ).rejects.toThrow(ForbiddenException);

    // But should succeed for tenant
    const allowed = await service.getMessages('conv-123', { uid: 'tenant-user', email: 'tenant@test.com' });
    expect(allowed).toBeDefined();
  });
});
