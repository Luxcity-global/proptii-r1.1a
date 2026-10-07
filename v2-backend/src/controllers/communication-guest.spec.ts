import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommunicationController } from './communication.controller';
import { GuestEnquiryController } from './guest-enquiry.controller';
import { of } from 'rxjs';

describe('Section 13 & 14: Communication & Guest Enquiry Endpoints', () => {
  describe('CommunicationController', () => {
    let controller: CommunicationController;
    let commsService: any;
    let eventsService: any;

    beforeEach(() => {
      commsService = {
        getConversations: vi.fn(),
        getOrCreateConversation: vi.fn(),
        getMessages: vi.fn(),
        sendMessage: vi.fn(),
      };
      eventsService = {
        subscribe: vi.fn().mockReturnValue(of({ data: 'comms_ping' })),
        emit: vi.fn(),
      };
      controller = new CommunicationController(commsService, eventsService);
    });

    it('[GET /communication/conversations] lists conversations for authenticated user', async () => {
      commsService.getConversations.mockResolvedValue([{ id: 'conv-1', lastMessage: 'Hi' }]);
      const req = { user: { uid: 'user-1' } };

      const res = await controller.getConversations(req);
      expect(commsService.getConversations).toHaveBeenCalledWith('user-1');
      expect(res).toHaveLength(1);
    });

    it('[POST /communication/conversations] gets or creates conversation between participants', async () => {
      commsService.getOrCreateConversation.mockResolvedValue({ id: 'conv-new' });
      const req = { user: { uid: 'user-1' } };
      const dto = { recipientId: 'user-2', propertyId: 'prop-1' };

      const res = await controller.getOrCreateConversation(req, dto);
      expect(commsService.getOrCreateConversation).toHaveBeenCalledWith(dto, 'user-1');
      expect(res.id).toBe('conv-new');
    });

    it('[GET /communication/conversations/:id/messages] retrieves messages in a conversation', async () => {
      commsService.getMessages.mockResolvedValue([{ id: 'msg-1', text: 'Hello' }]);
      const req = { user: { uid: 'user-1' } };

      const res = await controller.getMessages('conv-1', req);
      expect(commsService.getMessages).toHaveBeenCalledWith('conv-1', req.user);
      expect(res).toHaveLength(1);
    });

    it('[POST /communication/conversations/:id/messages] sends message and broadcasts new message SSE event', async () => {
      commsService.sendMessage.mockResolvedValue({ id: 'msg-2', text: 'Viewing on Monday' });
      const req = { user: { uid: 'user-1' } };
      const dto = { text: 'Viewing on Monday' };

      const res = await controller.sendMessage('conv-1', dto, req);
      expect(commsService.sendMessage).toHaveBeenCalledWith('conv-1', dto, 'user-1', req.user);
      expect(eventsService.emit).toHaveBeenCalledWith({
        type: 'message_new',
        data: {
          conversationId: 'conv-1',
          senderId: 'user-1',
          message: { id: 'msg-2', text: 'Viewing on Monday' },
        },
      });
      expect(res.id).toBe('msg-2');
    });
  });

  describe('GuestEnquiryController', () => {
    let controller: GuestEnquiryController;
    let service: any;

    beforeEach(() => {
      service = {
        submitEnquiry: vi.fn(),
        getThreadByToken: vi.fn(),
        addReply: vi.fn(),
        autoMerge: vi.fn(),
        validateClaimToken: vi.fn(),
        resendClaimToken: vi.fn(),
        confirmClaim: vi.fn(),
      };
      controller = new GuestEnquiryController(service);
    });

    it('[POST /guest/enquiry] submits guest property enquiry without requiring account', async () => {
      service.submitEnquiry.mockResolvedValue({
        success: true,
        enquiryId: 'enq-1',
        token: 'guest-magic-token',
      });
      const body = {
        name: 'Guest Prospect',
        email: 'prospect@gmail.com',
        propertyId: 'prop-99',
        message: 'Is this flat pet friendly?',
      };

      const res = await controller.submitEnquiry(body);
      expect(service.submitEnquiry).toHaveBeenCalledWith(body);
      expect(res.success).toBe(true);
      expect(res.token).toBe('guest-magic-token');
    });
  });
});
