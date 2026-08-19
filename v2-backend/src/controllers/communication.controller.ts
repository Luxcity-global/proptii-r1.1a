import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, Req, NotFoundException, Sse, MessageEvent, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CommunicationService } from '../services/communication.service';
import { EventsService } from '../services/events.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller('communication')
@UseGuards(FirebaseAuthGuard)
export class CommunicationController {
  private readonly logger = new Logger(CommunicationController.name);

  constructor(
    private readonly communicationService: CommunicationService,
    private readonly eventsService: EventsService,
  ) {}

  @Sse('events')
  sendCommunicationEvents(@Req() req: any): Observable<MessageEvent> {
    const userId = req.user.uid;
    const email = req.user.email;
    const role = req.user.role;
    this.logger.log(`[SSE:Communication] Client connected uid=${userId} email=${email}`);
    return this.eventsService.subscribe(userId, email, role);
  }

  @Get('conversations')
  @HttpCode(200)
  async getConversations(@Req() req: any) {
    const userId = req.user.uid;
    return await this.communicationService.getConversations(userId);
  }

  @Get('conversations/unread-count')
  @HttpCode(200)
  async getUnreadCount(@Req() req: any) {
    const userId = req.user.uid;
    return await this.communicationService.getUnreadCount(userId);
  }

  @Post('conversations')
  @HttpCode(201)
  async getOrCreateConversation(@Req() req: any, @Body() dto: any) {
    const userId = req.user.uid;
    return await this.communicationService.getOrCreateConversation(dto, userId);
  }

  @Get('conversations/:id/messages')
  @HttpCode(200)
  async getMessages(@Param('id') id: string) {
    return await this.communicationService.getMessages(id);
  }

  @Post('conversations/:id/messages')
  @HttpCode(201)
  async sendMessage(@Param('id') conversationId: string, @Body() dto: any, @Req() req: any) {
    const userId = req.user.uid;
    const result = await this.communicationService.sendMessage(conversationId, dto, userId);

    // Broadcast new message event to conversation participants
    this.eventsService.emit({
      type: 'message_new',
      data: {
        conversationId,
        senderId: userId,
        message: result,
      },
    });

    return result;
  }

  @Patch('messages/:id/read')
  @HttpCode(200)
  async markRead(@Param('id') messageId: string, @Req() req: any) {
    const userId = req?.user?.uid;
    const result = await this.communicationService.markRead(messageId);

    this.eventsService.emit({
      type: 'message_read',
      userId,
      data: {
        messageId,
      },
    });

    return result;
  }

  // ── Attachments ───────────────────────────────────────────────────────────
  // The frontend communicationService references /communication/attachments/*
  // These routes persist attachment metadata in Firestore; actual file bytes
  // are stored in Azure Blob Storage directly from the frontend using a SAS token.

  @Get('attachments/:id')
  @HttpCode(200)
  async getAttachment(@Param('id') attachmentId: string) {
    return await this.communicationService.getAttachment(attachmentId);
  }

  @Post('attachments')
  @HttpCode(201)
  async saveAttachment(@Req() req: any, @Body() dto: any) {
    const userId = req.user.uid;
    return await this.communicationService.saveAttachment(userId, dto);
  }

  @Delete('attachments/:id')
  @HttpCode(200)
  async deleteAttachment(@Param('id') attachmentId: string) {
    return await this.communicationService.deleteAttachment(attachmentId);
  }
}
