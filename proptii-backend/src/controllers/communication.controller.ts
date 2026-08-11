import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, Req, Logger, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { getFirestore } from '../config/firestore.config';
import { StorageService } from '../services/storage.service';

@ApiTags('communication')
@Controller('communication')
export class CommunicationController {
  private readonly logger = new Logger(CommunicationController.name);

  constructor(private readonly storageService: StorageService) {}

  @Get('conversations')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get conversations for current user' })
  async getConversations(@Req() req: any) {
    const userId = req.user.sub;
    const db = getFirestore();
    if (!db) return { data: [] };

    try {
      // Get conversations where the user is either a tenant or a landlord
      const conversationsRef = db.collection('conversations');
      const [tenantConvs, landlordConvs] = await Promise.all([
        conversationsRef.where('tenantId', '==', userId).get(),
        conversationsRef.where('landlordId', '==', userId).get()
      ]);

      const conversationsMap = new Map();
      tenantConvs.forEach(doc => conversationsMap.set(doc.id, { id: doc.id, ...doc.data() }));
      landlordConvs.forEach(doc => conversationsMap.set(doc.id, { id: doc.id, ...doc.data() }));

      const data = Array.from(conversationsMap.values());

      // Enrich missing fields to fix UI showing 'id' and 'tenant'
      await Promise.all(data.map(async (conv: any) => {
          let updated = false;
          if (!conv.tenantName && conv.tenantId) {
             try {
               const userDoc = await db.collection('users').doc(conv.tenantId).get();
               if (userDoc.exists) {
                   const userData = userDoc.data() || {};
                   conv.tenantName = userData.name || userData.displayName || userData.firstName || 'Tenant';
                   updated = true;
               }
             } catch (e) { this.logger.error(`Failed to enrich tenant name: ${e.message}`); }
          }
          if (!conv.propertyTitle && conv.propertyId) {
             try {
                 const propDoc = await db.collection('native_properties').doc(conv.propertyId).get();
                 if (propDoc.exists) {
                     const propData = propDoc.data() || {};
                     conv.propertyTitle = propData.title || propData.address || conv.propertyId;
                     updated = true;
                 } else {
                     const pDoc = await db.collection('properties').doc(conv.propertyId).get();
                     if (pDoc.exists) {
                         const pData = pDoc.data() || {};
                         conv.propertyTitle = pData.title || pData.address || conv.propertyId;
                         updated = true;
                     }
                 }
             } catch (e) { this.logger.error(`Failed to enrich property title: ${e.message}`); }
          }
          
          if (updated) {
              db.collection('conversations').doc(conv.id).update({
                  tenantName: conv.tenantName,
                  propertyTitle: conv.propertyTitle
              }).catch(() => {});
          }
      }));

      return { data: data.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) };
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
    const db = getFirestore();
    if (!db) return { data: { unreadCount: 0 } };

    try {
      // Just an approximation based on the read tracking which should be fully implemented later
      return { data: { unreadCount: 0 } }; 
    } catch (error) {
      return { data: { unreadCount: 0 } };
    }
  }

  @Post('conversations')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or get conversation' })
  async getOrCreateConversation(@Body() dto: any) {
    const db = getFirestore();
    if (!db) {
       return {
         data: {
           id: `conv_${Date.now()}`,
           propertyId: dto.propertyId || '',
           tenantId: dto.tenantId || '',
           landlordId: dto.landlordId || '',
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString(),
           messages: []
         }
       };
    }

    try {
      const conversationsRef = db.collection('conversations');
      const existing = await conversationsRef
        .where('propertyId', '==', dto.propertyId)
        .where('tenantId', '==', dto.tenantId)
        .where('landlordId', '==', dto.landlordId)
        .get();

      if (!existing.empty) {
        const doc = existing.docs[0];
        return { data: { id: doc.id, ...doc.data() } };
      }

      const newConv = {
        propertyId: dto.propertyId || '',
        tenantId: dto.tenantId || '',
        landlordId: dto.landlordId || '',
        agentEmail: dto.agentEmail || null,
        propertyTitle: dto.propertyTitle || '',
        tenantName: dto.tenantName || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const docRef = await conversationsRef.add(newConv);
      return { data: { id: docRef.id, ...newConv } };
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
    const db = getFirestore();
    if (!db) return { data: [] };

    try {
      const messagesRef = db.collection('conversations').doc(id).collection('messages');
      const snapshot = await messagesRef.orderBy('timestamp', 'asc').get();
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        let sentAt = data.sentAt;
        if (!sentAt) {
           if (data.timestamp) {
             sentAt = typeof data.timestamp.toDate === 'function' 
               ? data.timestamp.toDate().toISOString() 
               : new Date(data.timestamp).toISOString();
           } else {
             sentAt = new Date().toISOString();
           }
        }
        return { id: doc.id, ...data, sentAt };
      });
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
    
    const message = {
      conversationId,
      senderId: userId || '',
      body: dto.body || dto.text || '', // Use body for frontend compatibility
      attachmentIds: dto.attachmentIds || [],
      senderRole: dto.senderRole || 'tenant',
      timestamp: timestamp,
      isRead: false
    };

    const db = getFirestore();
    if (db) {
      try {
        const convRef = db.collection('conversations').doc(conversationId);
        const messagesRef = convRef.collection('messages');
        const docRef = await messagesRef.add(message);
        
        await convRef.update({
          updatedAt: timestamp,
          lastMessageAt: timestamp,
          lastMessageBody: message.body
        });
        
        return { data: { id: docRef.id, ...message } };
      } catch (error) {
        this.logger.error(`Error sending message: ${error.message}`);
      }
    }

    // Fallback if firestore is not initialized
    return {
      data: {
        id: `msg_${Date.now()}`,
        ...message
      }
    };
  }

  @Patch('messages/:id/read')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark message as read' })
  async markRead(@Param('id') messageId: string, @Query('conversationId') conversationId: string) {
    const db = getFirestore();
    if (db && conversationId) {
       try {
         await db.collection('conversations').doc(conversationId)
                 .collection('messages').doc(messageId)
                 .update({ isRead: true });
       } catch (err) {
         this.logger.error(`Error marking read: ${err.message}`);
       }
    }
    return { data: { success: true } };
  }

  @Post('attachments/upload')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload an attachment for a conversation' })
  async uploadAttachment(@Body() body: any, @Query('conversationId') conversationId: string, @Req() req: any) {
    if (!conversationId) throw new BadRequestException('conversationId is required');
    const { file, fileName, mimeType, sizeBytes } = body;
    if (!file) throw new BadRequestException('file base64 data is required');

    // Convert base64 to Buffer
    const buffer = Buffer.from(file, 'base64');
    
    // Create a mock Multer file object for StorageService
    const multerFile = {
      buffer,
      originalname: fileName || 'attachment',
      mimetype: mimeType || 'application/octet-stream',
      size: sizeBytes || buffer.length,
    } as Express.Multer.File;

    // Upload using StorageService
    const uploaded = await this.storageService.uploadFile(multerFile, `conversations/${conversationId}`);
    
    // Now save to Firestore collection message_attachments
    const db = getFirestore();
    const attachmentData = {
      id: '', // Will be set to doc.id
      conversationId,
      messageId: '', // it will be attached to a message later
      uploaderId: req.user?.sub || 'unknown', 
      fileName: fileName || 'attachment',
      mimeType: mimeType || 'application/octet-stream',
      sizeBytes: multerFile.size,
      blobPath: uploaded.url,
      uploadedAt: new Date().toISOString()
    };
    
    if (db) {
       const docRef = await db.collection('message_attachments').add(attachmentData);
       attachmentData.id = docRef.id;
       await docRef.update({ id: docRef.id });
    } else {
       attachmentData.id = `att_${Date.now()}`;
    }
    
    return { data: attachmentData };
  }

  @Get('attachments/:id/url')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a URL for an attachment' })
  async getAttachmentUrl(@Param('id') id: string, @Query('conversationId') conversationId: string) {
    const db = getFirestore();
    if (!db) return { data: { url: '' } };

    try {
      const doc = await db.collection('message_attachments').doc(id).get();
      if (!doc.exists) {
         // Fallback if not in message_attachments collection - some old mock data might just pass the raw URL as ID
         if (id.startsWith('http')) return { data: { url: id } };
         return { data: { url: '' } };
      }
      
      const data = doc.data();
      return { data: { url: data.blobPath || '' } };
    } catch (error) {
      this.logger.error(`Error getting attachment URL: ${error.message}`);
      return { data: { url: '' } };
    }
  }
}
