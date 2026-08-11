import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, Req, Logger, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StorageService } from '../services/storage.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { Conversation, ConversationDocument } from '../schemas/conversation.schema';
import { Message, MessageDocument } from '../schemas/message.schema';
import { MongoUser, MongoUserDocument } from '../schemas/mongo-user.schema';
import { NativeProperty } from '../schemas/native-property.schema';
import { GhostAccount, GhostAccountDocument } from '../schemas/ghost-account.schema';
import { EnquiryThread, EnquiryThreadDocument } from '../schemas/enquiry-thread.schema';
import { ThreadMessage, ThreadMessageDocument } from '../schemas/thread-message.schema';
import { EnquiryThreadService } from '../services/enquiry-thread.service';

@ApiTags('communication')
@Controller('communication')
export class CommunicationController {
  private readonly logger = new Logger(CommunicationController.name);

  constructor(
    private readonly storageService: StorageService,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(MongoUser.name) private mongoUserModel: Model<MongoUserDocument>,
    @InjectModel(NativeProperty.name) private nativePropertyModel: Model<NativeProperty>,
    @InjectModel(GhostAccount.name) private ghostAccountModel: Model<GhostAccountDocument>,
    @InjectModel(EnquiryThread.name) private enquiryThreadModel: Model<EnquiryThreadDocument>,
    @InjectModel(ThreadMessage.name) private threadMessageModel: Model<ThreadMessageDocument>,
    private readonly enquiryThreadService: EnquiryThreadService
  ) {}

  @Get('conversations')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get conversations for current user' })
  async getConversations(@Req() req: any) {
    const userId = req.user.sub;
    try {
      const conversations = await this.conversationModel.find({
        $or: [{ tenantId: userId }, { landlordId: userId }],
        isDeleted: false
      }).lean();

      // Enrich missing fields
      await Promise.all(conversations.map(async (conv: any) => {
        let updated = false;
        
        if (!conv.tenantName && conv.tenantId) {
          const userDoc = await this.mongoUserModel.findOne({ id: conv.tenantId }).lean();
          if (userDoc) {
            conv.tenantName = [userDoc.firstName, userDoc.lastName].filter(Boolean).join(' ') || userDoc.email || 'Tenant';
            updated = true;
          }
        }
        
        if (!conv.propertyTitle && conv.propertyId) {
          const nativeProp = await this.nativePropertyModel.findOne({ id: conv.propertyId }).lean() as any;
          if (nativeProp) {
            conv.propertyTitle = nativeProp.title || nativeProp.address || conv.propertyId;
            updated = true;
          }
        }
        
        if (updated) {
          await this.conversationModel.updateOne(
            { id: conv.id },
            { $set: { tenantName: conv.tenantName, propertyTitle: conv.propertyTitle } }
          ).catch(() => {});
        }
      }));

      // Fetch ghost account for user to find active ghost threads
      const userDoc = await this.mongoUserModel.findOne({ id: userId }).lean();
      const userEmail = req.user.email || userDoc?.email;
      
      let ghostAccount = null;
      if (userEmail) {
        ghostAccount = await this.ghostAccountModel.findOne({ email: userEmail }).lean();
      }

      const threadQuery: any = {
        $or: [{ landlord_id: userId }],
        status: { $nin: ['archived', 'closed'] }
      };

      if (ghostAccount) {
        threadQuery.$or.push({ ghost_tenant_id: ghostAccount.id });
      }

      const threads = await this.enquiryThreadModel.find(threadQuery).lean();
      
      const ghostThreads = threads.map((t: any) => {
        const isUserTheTenant = ghostAccount && t.ghost_tenant_id === ghostAccount.id;
        return {
          id: t.thread_token,
          propertyId: t.listing_id,
          tenantId: isUserTheTenant ? userId : t.ghost_tenant_id,
          landlordId: t.landlord_id,
          propertyTitle: t.listing_title,
          tenantName: isUserTheTenant ? (ghostAccount.name || userDoc?.firstName || 'Tenant') : (t.ghost_tenant_name || 'Guest Tenant'),
          createdAt: t.created_at,
          updatedAt: t.last_reply_at || t.created_at,
          lastMessageAt: t.last_reply_at || t.created_at,
          isDeleted: false,
          isGhostThread: true,
          messages: []
        };
      });

      // Sort by updatedAt desc
      const combined = [...conversations, ...ghostThreads];
      const sorted = combined.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      
      // Ensure 'messages' array is present for UI compatibility
      const data = sorted.map(c => ({ ...c, messages: [] }));

      return { data };
    } catch (error) {
      this.logger.error(`Error getting conversations: ${error.message}`);
      return { data: [] };
    }
  }

  @Get('conversations/unread-count')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread message count' })
  async getUnreadCount(@Req() req: any) {
    const userId = req.user.sub;
    try {
      // Find all conversations for the user
      const convs = await this.conversationModel.find({
        $or: [{ tenantId: userId }, { landlordId: userId }],
        isDeleted: false
      }).select('id').lean();
      
      if (!convs.length) return { data: { unreadCount: 0 } };
      
      // Count unread messages where the user is NOT the sender
      const unreadCount = await this.messageModel.countDocuments({
        conversationId: { $in: convs.map(c => c.id) },
        senderId: { $ne: userId },
        readAt: null,
        isDeleted: false
      });
      
      // Count unread ghost messages
      let unreadGhostCount = 0;
      const userDoc = await this.mongoUserModel.findOne({ id: userId }).lean();
      const userEmail = req.user.email || userDoc?.email;
      
      let ghostAccount = null;
      if (userEmail) {
        ghostAccount = await this.ghostAccountModel.findOne({ email: userEmail }).lean();
      }

      const threadQuery: any = {
        $or: [{ landlord_id: userId }],
        status: { $nin: ['archived', 'closed'] }
      };

      if (ghostAccount) {
        threadQuery.$or.push({ ghost_tenant_id: ghostAccount.id });
      }

      const ghostThreads = await this.enquiryThreadModel.find(threadQuery).lean();
      const threadIds = ghostThreads.map((t: any) => t.id);
      
      if (threadIds.length > 0) {
        // We want to count messages where the sender is NOT the current user
        // The current user could be acting as the ghost tenant OR the registered landlord
        const userSenderIds = [userId];
        if (ghostAccount) userSenderIds.push(ghostAccount.id);

        unreadGhostCount = await this.threadMessageModel.countDocuments({
          thread_id: { $in: threadIds },
          sender_id: { $nin: userSenderIds },
          read_at: null
        });
      }
      
      return { data: { unreadCount: unreadCount + unreadGhostCount } }; 
    } catch (error) {
      this.logger.error(`Error getting unread count: ${error.message}`);
      return { data: { unreadCount: 0 } };
    }
  }

  @Post('conversations')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or get conversation' })
  async getOrCreateConversation(@Body() dto: any) {
    try {
      const existing = await this.conversationModel.findOne({
        propertyId: dto.propertyId,
        tenantId: dto.tenantId,
        landlordId: dto.landlordId,
        isDeleted: false
      }).lean();

      if (existing) {
        return { data: existing };
      }

      const now = new Date().toISOString();
      const newConv = {
        id: randomUUID(),
        propertyId: dto.propertyId || '',
        tenantId: dto.tenantId || '',
        landlordId: dto.landlordId || '',
        propertyTitle: dto.propertyTitle || '',
        tenantName: dto.tenantName || '',
        createdAt: now,
        updatedAt: now,
        lastMessageAt: null,
        isDeleted: false,
        deletedAt: null
      };
      
      await this.conversationModel.create(newConv);
      return { data: { ...newConv, messages: [] } };
    } catch (error) {
      this.logger.error(`Error creating conversation: ${error.message}`);
      throw error;
    }
  }

  @Get('conversations/:id/messages')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get messages for conversation' })
  async getMessages(@Param('id') id: string) {
    try {
      // Check if this is a ghost thread
      const thread = await this.enquiryThreadModel.findOne({ thread_token: id }).lean();
      if (thread) {
        const threadMessages = await this.threadMessageModel.find({
          thread_id: thread.id
        }).sort({ sent_at: 1 }).lean();
        
        const mappedMessages = threadMessages.map((tm: any) => ({
          id: tm.id,
          conversationId: id,
          senderId: tm.sender_id,
          senderRole: tm.sender_type.includes('tenant') ? 'tenant' : 'landlord',
          body: tm.body,
          attachmentIds: [],
          sentAt: tm.sent_at,
          readAt: tm.read_at,
          isDeleted: false,
          deletedAt: null
        }));
        return { data: mappedMessages };
      }

      // Standard conversation messages
      const messages = await this.messageModel.find({
        conversationId: id,
        isDeleted: false
      }).sort({ sentAt: 1 }).lean();
      
      return { data: messages };
    } catch (error) {
      this.logger.error(`Error getting messages: ${error.message}`);
      return { data: [] };
    }
  }

  @Post('conversations/:id/messages')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send message in conversation' })
  async sendMessage(@Param('id') conversationId: string, @Body() dto: any, @Req() req: any) {
    const userId = req.user?.sub || dto.senderId;
    const timestamp = new Date().toISOString();
    
    try {
      // Check if this is a ghost thread
      const thread = await this.enquiryThreadModel.findOne({ thread_token: conversationId }).lean();
      if (thread) {
        const userDoc = await this.mongoUserModel.findOne({ id: userId }).lean();
        const userEmail = req.user.email || userDoc?.email;
        
        let ghostAccount = null;
        if (userEmail) {
          ghostAccount = await this.ghostAccountModel.findOne({ email: userEmail }).lean();
        }

        const isUserTheLandlord = thread.landlord_id === userId;
        
        let senderName = userDoc?.firstName || (isUserTheLandlord ? 'Landlord' : 'Tenant');
        let ghostSenderId = userId;
        let senderType: 'platform_landlord' | 'ghost_tenant' = isUserTheLandlord ? 'platform_landlord' : 'ghost_tenant';
        
        if (!isUserTheLandlord && ghostAccount) {
          senderName = ghostAccount.name || senderName;
          ghostSenderId = ghostAccount.id;
        }

        const reply = await this.enquiryThreadService.addReply({
          threadToken: conversationId,
          senderType,
          senderId: ghostSenderId,
          senderName,
          body: dto.body || dto.text || '',
          source: 'web_form'
        });

        const mappedMessage = {
          id: reply.id,
          conversationId,
          senderId: ghostSenderId,
          body: reply.body,
          attachmentIds: [],
          senderRole: isUserTheLandlord ? 'landlord' : 'tenant',
          sentAt: reply.sent_at,
          readAt: reply.read_at,
          isDeleted: false,
          deletedAt: null
        };
        return { data: mappedMessage };
      }

      // Standard conversation message
      const message = {
        id: randomUUID(),
        conversationId,
        senderId: userId || '',
        body: dto.body || dto.text || '', // Use body for frontend compatibility
        attachmentIds: dto.attachmentIds || [],
        senderRole: dto.senderRole || 'tenant',
        sentAt: timestamp,
        readAt: null,
        isDeleted: false,
        deletedAt: null
      };

      await this.messageModel.create(message);
      
      await this.conversationModel.updateOne(
        { id: conversationId },
        {
          $set: {
            updatedAt: timestamp,
            lastMessageAt: timestamp
          }
        }
      );
      
      return { data: message };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      throw error;
    }
  }

  @Patch('messages/:id/read')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark message as read' })
  async markRead(@Param('id') messageId: string, @Query('conversationId') conversationId: string) {
    if (!messageId) return { data: { success: false } };
    
    try {
      await this.messageModel.updateOne(
        { id: messageId },
        { $set: { readAt: new Date().toISOString() } }
      );
      return { data: { success: true } };
    } catch (err) {
      this.logger.error(`Error marking read: ${err.message}`);
      return { data: { success: false } };
    }
  }

  // NOTE: Attachments currently unsupported in MongoDB refactor for brevity, 
  // returning dummy URLs to prevent breaking changes in UI.
  @Post('attachments/upload')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload an attachment for a conversation' })
  async uploadAttachment(@Body() body: any, @Query('conversationId') conversationId: string, @Req() req: any) {
    if (!conversationId) throw new BadRequestException('conversationId is required');
    const { file, fileName, mimeType, sizeBytes } = body;
    if (!file) throw new BadRequestException('file base64 data is required');

    const buffer = Buffer.from(file, 'base64');
    
    const multerFile = {
      buffer,
      originalname: fileName || 'attachment',
      mimetype: mimeType || 'application/octet-stream',
      size: sizeBytes || buffer.length,
    } as Express.Multer.File;

    const uploaded = await this.storageService.uploadFile(multerFile, `conversations/${conversationId}`);
    
    const attachmentData = {
      id: randomUUID(),
      conversationId,
      messageId: '',
      uploaderId: req.user?.sub || 'unknown', 
      fileName: fileName || 'attachment',
      mimeType: mimeType || 'application/octet-stream',
      sizeBytes: multerFile.size,
      blobPath: uploaded.url,
      uploadedAt: new Date().toISOString()
    };
    
    return { data: attachmentData };
  }

  @Get('attachments/:id/url')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a URL for an attachment' })
  async getAttachmentUrl(@Param('id') id: string, @Query('conversationId') conversationId: string) {
    return { data: { url: id.startsWith('http') ? id : '' } };
  }
}
