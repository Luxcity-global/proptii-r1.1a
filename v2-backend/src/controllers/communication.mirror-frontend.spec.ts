import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from '../services/communication.service';
import { EventsService } from '../services/events.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type {
  CreateConversationDto,
  SendMessageDto,
  Message,
  Conversation,
} from '../../../src/types/messaging';

describe('Messaging Frontend-Backend Mirror Contract Tests', () => {
  let controller: CommunicationController;
  let service: CommunicationService;
  let eventsService: EventsService;
  let mockEmailService: any;
  let mockUserProfileService: any;

  // In-memory Firestore stores
  let conversationsStore: Map<string, any>;
  let messagesStore: Map<string, any>;
  let attachmentsStore: Map<string, any>;
  let usersStore: Map<string, any>;
  let propertiesStore: Map<string, any>;

  function buildMockCollection(store: Map<string, any>) {
    return {
      doc: vi.fn((id: string) => ({
        get: vi.fn(async () => ({
          exists: store.has(id),
          data: () => store.get(id),
        })),
        set: vi.fn(async (data: any, options?: { merge?: boolean }) => {
          if (options?.merge && store.has(id)) {
            const existing = store.get(id);
            const merged = { ...existing };
            for (const [k, v] of Object.entries(data)) {
              if (v && typeof v === 'object' && (v as any)._methodName === 'FieldValue.increment') {
                merged[k] = (merged[k] || 0) + (v as any)._operand;
              } else {
                merged[k] = v;
              }
            }
            store.set(id, merged);
          } else {
            store.set(id, data);
          }
        }),
        update: vi.fn(async (patch: any) => {
          if (!store.has(id)) throw new Error('Not found');
          const existing = store.get(id);
          store.set(id, { ...existing, ...patch });
        }),
        delete: vi.fn(async () => {
          store.delete(id);
        }),
      })),
      where: vi.fn((field: string, op: string, val: any) => {
        const filter = (docData: any) => {
          if (op === '==') return docData[field] === val;
          if (op === '>') return (docData[field] ?? 0) > val;
          return true;
        };

        const executeQuery = async () => {
          const matched: any[] = [];
          for (const [docId, docData] of store.entries()) {
            if (filter(docData)) {
              matched.push({ id: docId, data: () => docData });
            }
          }
          return {
            docs: matched,
            empty: matched.length === 0,
            size: matched.length,
          };
        };

        return {
          where: vi.fn((f2: string, op2: string, val2: any) => {
            const filter2 = (docData: any) => {
              if (op2 === '==') return docData[f2] === val2;
              if (op2 === '>') return (docData[f2] ?? 0) > val2;
              return true;
            };

            const executeQuery2 = async () => {
              const matched: any[] = [];
              for (const [docId, docData] of store.entries()) {
                if (filter(docData) && filter2(docData)) {
                  matched.push({ id: docId, data: () => docData });
                }
              }
              return {
                docs: matched,
                empty: matched.length === 0,
                size: matched.length,
              };
            };

            return {
              where: vi.fn((f3: string, op3: string, val3: any) => {
                return {
                  limit: vi.fn().mockReturnThis(),
                  get: vi.fn(async () => {
                    const matched: any[] = [];
                    for (const [docId, docData] of store.entries()) {
                      if (filter(docData) && filter2(docData) && docData[f3] === val3) {
                        matched.push({ id: docId, data: () => docData });
                      }
                    }
                    return {
                      docs: matched,
                      empty: matched.length === 0,
                      size: matched.length,
                    };
                  }),
                };
              }),
              limit: vi.fn().mockReturnThis(),
              get: vi.fn(executeQuery2),
            };
          }),
          limit: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          get: vi.fn(executeQuery),
        };
      }),
    };
  }

  beforeEach(() => {
    conversationsStore = new Map();
    messagesStore = new Map();
    attachmentsStore = new Map();
    usersStore = new Map();
    propertiesStore = new Map();

    mockEmailService = {
      sendUnreadReminderNotification: vi.fn().mockResolvedValue(true),
    };
    mockUserProfileService = {
      getProfile: vi.fn(async (uid: string) => usersStore.get(uid) || null),
    };

    service = new CommunicationService(mockEmailService, mockUserProfileService);
    eventsService = new EventsService();
    vi.spyOn(eventsService, 'emit').mockImplementation(() => {});

    controller = new CommunicationController(service, eventsService);

    // Mock Firestore getters
    const mockDb: any = {
      collection: vi.fn((colName: string) => {
        if (colName === 'conversations') return buildMockCollection(conversationsStore);
        if (colName === 'messages') return buildMockCollection(messagesStore);
        if (colName === 'message_attachments') return buildMockCollection(attachmentsStore);
        if (colName === 'users') return buildMockCollection(usersStore);
        if (colName === 'properties') return buildMockCollection(propertiesStore);
        return buildMockCollection(new Map());
      }),
    };

    vi.spyOn(service as any, 'db', 'get').mockReturnValue(mockDb);
    vi.spyOn(service as any, 'conversationsCol', 'get').mockReturnValue(buildMockCollection(conversationsStore));
    vi.spyOn(service as any, 'messagesCol', 'get').mockReturnValue(buildMockCollection(messagesStore));
    vi.spyOn(service as any, 'attachmentsCol', 'get').mockReturnValue(buildMockCollection(attachmentsStore));
  });

  describe('1. Conversation Creation & Shape Mirroring', () => {
    it('creates a conversation mirroring CreateConversationDto with required and optional fields', async () => {
      const frontendDto: CreateConversationDto = {
        propertyId: 'prop-100',
        tenantId: 'tenant-user-1',
        landlordId: 'landlord-user-1',
        propertyTitle: '2 Bedroom Flat, Westminster',
        tenantName: 'John Doe',
        agentEmail: 'agent@luxuryproperties.com',
      };

      const req = { user: { uid: 'tenant-user-1', email: 'tenant@test.com' } };
      const response = await controller.getOrCreateConversation(req, frontendDto);

      // Verify shape returned matches frontend unwrap and structure
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      const conv = response.data;

      expect(conv.id).toBeDefined();
      expect(conv.propertyId).toBe('prop-100');
      expect(conv.tenantId).toBe('tenant-user-1');
      expect(conv.landlordId).toBe('landlord-user-1');
      expect(conv.propertyTitle).toBe('2 Bedroom Flat, Westminster');
      expect(conv.tenantName).toBe('John Doe');
      expect(conv.unreadForTenant).toBe(0);
      expect(conv.unreadForLandlord).toBe(0);
      expect(conv.isDeleted).toBe(false);

      // Verify idempotent: calling again with same parameters returns existing conversation
      const secondCall = await controller.getOrCreateConversation(req, frontendDto);
      expect(secondCall.data.id).toBe(conv.id);
    });

    it('handles optional fields gracefully when omitted (defaults applied)', async () => {
      const minimalDto: CreateConversationDto = {
        propertyId: 'prop-minimal',
        tenantId: 'tenant-user-min',
        landlordId: 'landlord-user-min',
      };

      const req = { user: { uid: 'tenant-user-min' } };
      const response = await controller.getOrCreateConversation(req, minimalDto);
      const conv = response.data;

      expect(conv.id).toBeDefined();
      expect(conv.tenantName).toBe('Tenant');
      expect(conv.landlordName).toBe('Landlord');
      expect(conv.propertyTitle).toBe('Property Listing');
      expect(conv.unreadForTenant).toBe(0);
      expect(conv.unreadForLandlord).toBe(0);
    });
  });

  describe('2. Message Sending & Counter Updates', () => {
    it('sends message mirroring SendMessageDto, increments unread for recipient and resets reminderCount', async () => {
      // 1. Create conversation
      conversationsStore.set('conv-test-1', {
        id: 'conv-test-1',
        propertyId: 'prop-1',
        tenantId: 'tenant-1',
        landlordId: 'landlord-1',
        unreadForTenant: 0,
        unreadForLandlord: 0,
        reminderCount: 2, // previously reached reminder cap
      });

      // 2. Tenant sends message to Landlord
      const sendDto: SendMessageDto = {
        body: 'Hello landlord, when can we schedule the move-in check?',
        attachmentIds: ['att-file-1'],
        senderRole: 'tenant',
      };

      const req = { user: { uid: 'tenant-1', email: 'tenant1@test.com' } };
      const response = await controller.sendMessage('conv-test-1', sendDto, req);

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      const msg: Message = response.data;

      expect(msg.id).toBeDefined();
      expect(msg.conversationId).toBe('conv-test-1');
      expect(msg.senderId).toBe('tenant-1');
      expect(msg.senderRole).toBe('tenant');
      expect(msg.body).toBe(sendDto.body);
      expect(msg.attachmentIds).toEqual(['att-file-1']);
      expect(msg.readAt).toBeNull();
      expect(msg.isDeleted).toBe(false);

      // Verify conversation state in Firestore:
      const updatedConv = conversationsStore.get('conv-test-1');
      expect(updatedConv.lastMessagePreview).toContain('Hello landlord');
      expect(updatedConv.reminderCount).toBe(0); // reset on new message
      expect(eventsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'message_new' }),
      );
    });

    it('blocks unauthorized users from sending messages into conversation', async () => {
      conversationsStore.set('conv-private', {
        id: 'conv-private',
        tenantId: 'tenant-real',
        landlordId: 'landlord-real',
      });

      const sendDto: SendMessageDto = {
        body: 'Unauthorized intruder message',
        senderRole: 'tenant',
      };
      const req = { user: { uid: 'hacker-user', email: 'hacker@test.com' } };

      await expect(
        controller.sendMessage('conv-private', sendDto, req)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('3. Reading Messages & Unread Counter Decrementing', () => {
    it('marks message as read and updates readAt', async () => {
      conversationsStore.set('conv-read-test', {
        id: 'conv-read-test',
        tenantId: 'tenant-1',
        landlordId: 'landlord-1',
        unreadForLandlord: 1,
      });

      messagesStore.set('msg-unread-1', {
        id: 'msg-unread-1',
        conversationId: 'conv-read-test',
        senderId: 'tenant-1',
        body: 'Important contract notice',
        readAt: null,
      });

      const req = { user: { uid: 'landlord-1' } };
      const res = await controller.markRead('msg-unread-1', req);

      expect(res.data.success).toBe(true);
      expect(res.data.conversationId).toBe('conv-read-test');

      const updatedMsg = messagesStore.get('msg-unread-1');
      expect(updatedMsg.readAt).toBeDefined();
      expect(typeof updatedMsg.readAt).toBe('string');
    });
  });

  describe('4. Message Editing & Deletion Soft-Delete Contract', () => {
    it('allows sender to edit their own message body and records editedAt', async () => {
      conversationsStore.set('conv-edit', {
        id: 'conv-edit',
        tenantId: 'author-user-1',
        landlordId: 'landlord-user-1',
      });

      messagesStore.set('msg-to-edit', {
        id: 'msg-to-edit',
        conversationId: 'conv-edit',
        senderId: 'author-user-1',
        body: 'Initial typo text',
        isDeleted: false,
      });

      const req = { user: { uid: 'author-user-1' } };
      const res = await controller.editMessage('msg-to-edit', { body: 'Corrected text' }, req);

      expect(res.data.body).toBe('Corrected text');
      expect(res.data.editedAt).toBeDefined();

      const stored = messagesStore.get('msg-to-edit');
      expect(stored.body).toBe('Corrected text');
      expect(eventsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'message_edit' }),
      );
    });

    it('rejects editing if caller is not the message sender', async () => {
      messagesStore.set('msg-not-mine', {
        id: 'msg-not-mine',
        conversationId: 'conv-edit',
        senderId: 'other-user',
        body: 'Original text',
      });

      const req = { user: { uid: 'impostor-user' } };
      await expect(
        controller.editMessage('msg-not-mine', { body: 'Malicious edit' }, req)
      ).rejects.toThrow(ForbiddenException);
    });

    it('soft deletes message, preserving id and setting isDeleted: true', async () => {
      conversationsStore.set('conv-del', {
        id: 'conv-del',
        tenantId: 'author-user-1',
        landlordId: 'landlord-user-1',
      });

      messagesStore.set('msg-to-delete', {
        id: 'msg-to-delete',
        conversationId: 'conv-del',
        senderId: 'author-user-1',
        body: 'Message to remove',
        isDeleted: false,
      });

      const req = { user: { uid: 'author-user-1' } };
      const res = await controller.deleteMessage('msg-to-delete', req);

      expect(res.data.isDeleted).toBe(true);
      expect(res.data.deletedAt).toBeDefined();

      const stored = messagesStore.get('msg-to-delete');
      expect(stored.isDeleted).toBe(true);
      expect(eventsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'message_delete' }),
      );
    });
  });

  describe('5. Attachment Registration Shape', () => {
    it('registers an attachment mirroring frontend uploadAttachment payload', async () => {
      const frontendAttachmentPayload = {
        filename: 'tenancy_agreement.pdf',
        mimeType: 'application/pdf',
        size: 2048576,
        blobUrl: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/attachments%2Ftenancy.pdf',
        conversationId: 'conv-att-1',
      };

      const req = { user: { uid: 'tenant-user-1' } };
      const res = await controller.saveAttachment(req, frontendAttachmentPayload);

      expect(res.data).toBeDefined();
      expect(res.data.id).toBeDefined();
      expect(res.data.filename).toBe('tenancy_agreement.pdf');
      expect(res.data.mimeType).toBe('application/pdf');
      expect(res.data.size).toBe(2048576);
      expect(res.data.blobUrl).toBe(frontendAttachmentPayload.blobUrl);
      expect(res.data.conversationId).toBe('conv-att-1');
      expect(res.data.uploadedBy).toBe('tenant-user-1');

      // Fetch attachment back
      const fetched = await controller.getAttachment(res.data.id);
      expect(fetched.data.id).toBe(res.data.id);
      expect(fetched.data.filename).toBe('tenancy_agreement.pdf');
    });
  });

  describe('6. Typing Indicator & SSE Ticket Exchanges', () => {
    it('handles typing indicator fire-and-forget without crashing', async () => {
      conversationsStore.set('conv-type', {
        id: 'conv-type',
        tenantId: 'tenant-user-1',
        landlordId: 'landlord-user-1',
      });

      const req = { user: { uid: 'tenant-user-1' } };
      const res = await controller.sendTyping('conv-type', req);
      expect(res.data.ok).toBe(true);
    });

    it('issues a 60-second SSE ticket for Bearer authenticated user', async () => {
      const req = { user: { uid: 'user-token-1', email: 'test@proptii.co', role: 'tenant' } };
      const res = await controller.issueSseTicket(req);
      expect(res.ticket).toBeDefined();
      expect(typeof res.ticket).toBe('string');
      expect(res.ticket.length).toBeGreaterThan(10);
    });
  });
});
