import { GhostAccountService } from '../shared/services/GhostAccountService';
import { EnquiryThreadService } from '../shared/services/EnquiryThreadService';
import { GhostAccountModel } from '../shared/models/ghost-account.model';
import { EnquiryThreadModel } from '../shared/models/enquiry-thread.model';
import { ThreadMessageModel } from '../shared/models/thread-message.model';
import { ConversationModel, MessageModel, ConversationParticipantModel, UserModel } from '../shared/models/messaging.models';

const mockGhostAccountFindOne = jest.fn();
const mockGhostAccountCreate = jest.fn();
const mockGhostAccountUpdateOne = jest.fn();
const mockGhostAccountFind = jest.fn();

const mockEnquiryThreadFindOne = jest.fn();
const mockEnquiryThreadCreate = jest.fn();
const mockEnquiryThreadUpdateOne = jest.fn();
const mockEnquiryThreadFind = jest.fn();

const mockThreadMessageFind = jest.fn();
const mockThreadMessageCreate = jest.fn();

const mockConversationCreate = jest.fn();
const mockMessageCreate = jest.fn();
const mockParticipantCreate = jest.fn();
const mockUserFindOneAndUpdate = jest.fn();

jest.mock('../shared/models/ghost-account.model', () => ({
  GhostAccountModel: {
    findOne: () => ({ lean: mockGhostAccountFindOne }),
    create: (x: any) => mockGhostAccountCreate(x),
    updateOne: (q: any, u: any) => mockGhostAccountUpdateOne(q, u),
    find: (q: any) => ({ lean: mockGhostAccountFind }),
  }
}));

jest.mock('../shared/models/enquiry-thread.model', () => ({
  EnquiryThreadModel: {
    findOne: (q: any) => ({ lean: mockEnquiryThreadFindOne }),
    create: (x: any) => mockEnquiryThreadCreate(x),
    updateOne: (q: any, u: any) => mockEnquiryThreadUpdateOne(q, u),
    find: (q: any) => ({ sort: () => ({ lean: mockEnquiryThreadFind }) }),
  }
}));

jest.mock('../shared/models/thread-message.model', () => ({
  ThreadMessageModel: {
    find: (q: any) => ({ sort: () => ({ lean: mockThreadMessageFind }) }),
    create: (x: any) => mockThreadMessageCreate(x),
  }
}));

jest.mock('../shared/models/messaging.models', () => ({
  ConversationModel: {
    create: (x: any) => mockConversationCreate(x),
  },
  MessageModel: {
    create: (x: any) => mockMessageCreate(x),
  },
  ConversationParticipantModel: {
    create: (x: any) => mockParticipantCreate(x),
  },
  UserModel: {
    findOneAndUpdate: (q: any, u: any, o: any) => mockUserFindOneAndUpdate(q, u, o),
  }
}));

describe('GhostAccount & EnquiryThread Services', () => {
  let ghostAccountService: GhostAccountService;
  let enquiryThreadService: EnquiryThreadService;

  beforeEach(() => {
    jest.clearAllMocks();
    ghostAccountService = new GhostAccountService();
    enquiryThreadService = new EnquiryThreadService();
  });

  describe('GhostAccountService', () => {
    it('creates a new ghost tenant account if it does not exist', async () => {
      mockGhostAccountFindOne.mockResolvedValue(null);
      mockGhostAccountCreate.mockImplementation((x) => Promise.resolve(x));

      const result = await ghostAccountService.getOrCreateGhostTenant('tenant@example.com', 'Test Tenant');

      expect(mockGhostAccountFindOne).toHaveBeenCalled();
      expect(mockGhostAccountCreate).toHaveBeenCalled();
      expect(result.account.email).toBe('tenant@example.com');
      expect(result.account.role).toBe('ghost_tenant');
    });

    it('returns the existing ghost tenant account if it exists', async () => {
      const existing = { id: 'existing-id', email: 'tenant@example.com', role: 'ghost_tenant', name: 'Test Tenant' };
      mockGhostAccountFindOne.mockResolvedValue(existing);

      const result = await ghostAccountService.getOrCreateGhostTenant('tenant@example.com', 'Test Tenant');

      expect(mockGhostAccountCreate).not.toHaveBeenCalled();
      expect(result.account.id).toBe('existing-id');
    });
  });

  describe('EnquiryThreadService', () => {
    it('creates an enquiry thread and appends the initial message', async () => {
      mockEnquiryThreadCreate.mockResolvedValue({});
      mockThreadMessageCreate.mockResolvedValue({});

      const result = await enquiryThreadService.createThread({
        listingId: 'listing-123',
        listingSource: 'native',
        listingTitle: 'Nice House',
        ghostTenantId: 'ghost-tenant-123',
        ghostTenantName: 'Test Tenant',
        landlordId: 'landlord-123',
        categories: ['Book Viewing'],
        firstMessage: { body: 'I want to view this property', senderName: 'Test Tenant' }
      });

      expect(mockEnquiryThreadCreate).toHaveBeenCalled();
      expect(mockThreadMessageCreate).toHaveBeenCalled();
      expect(result.thread.listing_id).toBe('listing-123');
      expect(result.messages[0].body).toBe('I want to view this property');
    });

    it('adds a reply message to the thread', async () => {
      const thread = { id: 'thread-123', thread_token: 'tok-123', message_count: 5, status: 'open' };
      mockEnquiryThreadFindOne.mockResolvedValue(thread);
      mockThreadMessageCreate.mockResolvedValue({});
      mockEnquiryThreadUpdateOne.mockResolvedValue({});

      const msg = await enquiryThreadService.addReply({
        threadToken: 'tok-123',
        senderType: 'ghost_tenant',
        senderId: 'ghost-tenant-123',
        senderName: 'Test Tenant',
        body: 'Here is my reply',
        source: 'tokenised_page'
      });

      expect(mockThreadMessageCreate).toHaveBeenCalled();
      expect(mockEnquiryThreadUpdateOne).toHaveBeenCalled();
      expect(msg.body).toBe('Here is my reply');
    });

    it('rejects adding a reply if thread message limit is reached', async () => {
      const thread = { id: 'thread-123', thread_token: 'tok-123', message_count: 20, status: 'open' };
      mockEnquiryThreadFindOne.mockResolvedValue(thread);

      await expect(enquiryThreadService.addReply({
        threadToken: 'tok-123',
        senderType: 'ghost_tenant',
        senderId: 'ghost-tenant-123',
        senderName: 'Test Tenant',
        body: 'Here is my reply',
        source: 'tokenised_page'
      })).rejects.toThrow(/Ghost threads are limited to/);
    });
  });
});
