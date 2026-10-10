import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, Req, NotFoundException, Sse, MessageEvent, Logger, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { SkipThrottle } from '@nestjs/throttler';
import { CommunicationService } from '../services/communication.service';
import { EventsService } from '../services/events.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { randomUUID } from 'crypto';
import { setSseTicket, getSseTicketInfo, deleteSseTicket } from '../utils/sse-tickets';


@ApiTags('Communication')
@ApiBearerAuth('bearer')
@Controller('communication')
@UseGuards(FirebaseAuthGuard)
export class CommunicationController {
  private readonly logger = new Logger(CommunicationController.name);

  constructor(
    private readonly communicationService: CommunicationService,
    private readonly eventsService: EventsService,
  ) {}

  // ── SSE ticket exchange — call with Bearer token, get back a 60s opaque ticket
  @Post('sse-ticket')
  @HttpCode(200)
  @SkipThrottle()
  @ApiOperation({ summary: 'Exchange Bearer token for a short-lived SSE ticket' })
  @ApiResponse({ status: 200, description: 'One-time SSE ticket valid for 60 seconds' })
  issueSseTicket(@Req() req: any) {
    const ticket = randomUUID();
    setSseTicket(ticket, {
      uid:       req.user.uid,
      email:     req.user.email || '',
      role:      req.user.role  || '',
      expiresAt: Date.now() + 60_000,
    });
    return { ticket };
  }

  @Sse('events')
  @SkipThrottle()
  @ApiOperation({ summary: 'Subscribe to real-time communication events stream (SSE)' })
  sendCommunicationEvents(@Req() req: any, @Query('ticket') ticket?: string): Observable<MessageEvent> {
    // Accept either ticket-based auth (preferred — token never in URL) or fall
    // back to the legacy req.user populated by FirebaseAuthGuard for backwards compat.
    let uid: string;
    let email: string;
    let role: string;

    if (ticket) {
      const info = getSseTicketInfo(ticket);
      if (!info || info.expiresAt < Date.now()) {
        throw new UnauthorizedException('SSE ticket is invalid or has expired');
      }
      deleteSseTicket(ticket); // one-time use
      uid   = info.uid;
      email = info.email;
      role  = info.role;
    } else {
      uid   = req.user?.uid   || '';
      email = req.user?.email || '';
      role  = req.user?.role  || '';
    }

    this.logger.log(`[SSE:Communication] Client connected uid=${uid} email=${email}`);
    return this.eventsService.subscribe(uid, email, role);
  }

  @Get('conversations')
  @HttpCode(200)
  @ApiOperation({ summary: 'List user conversations' })
  @ApiResponse({ status: 200, description: 'Array of user conversations' })
  async getConversations(@Req() req: any) {
    const userId = req.user.uid;
    return await this.communicationService.getConversations(userId);
  }

  @Get('conversations/unread-count')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get total unread message count for user' })
  @ApiResponse({ status: 200, description: 'Unread message count' })
  async getUnreadCount(@Req() req: any) {
    const userId = req.user.uid;
    return await this.communicationService.getUnreadCount(userId);
  }

  @Post('conversations')
  @HttpCode(201)
  @ApiOperation({ summary: 'Get or create conversation between participants' })
  @ApiResponse({ status: 201, description: 'Conversation record' })
  async getOrCreateConversation(@Req() req: any, @Body() dto: any) {
    const userId = req.user.uid;
    const result = await this.communicationService.getOrCreateConversation(dto, userId);
    
    if (result.isNew) {
      this.eventsService.emit({
        type: 'conversation_new',
        data: result.data,
      });
    }
    
    return { data: result.data };
  }

  @Post('conversations/:id/typing')
  @HttpCode(200)
  @SkipThrottle()
  @ApiOperation({ summary: 'Broadcast a typing indicator to conversation participants' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async sendTyping(@Param('id') conversationId: string, @Req() req: any) {
    const userId = req.user.uid;
    this.eventsService.emit({
      type: 'typing_start',
      userId,
      data: { conversationId, senderId: userId },
    });
    return { data: { ok: true } };
  }

  @Get('conversations/:id/messages')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get messages for a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Array of conversation messages' })
  async getMessages(
    @Param('id') id: string,
    @Req() req: any,
    @Query('before') before?: string,
    @Query('limit') limitStr?: string,
  ) {
    const limit = limitStr ? Math.min(parseInt(limitStr, 10) || 50, 100) : 50;
    return await this.communicationService.getMessages(id, req.user, before, limit);
  }

  @Post('conversations/:id/messages')
  @HttpCode(201)
  @ApiOperation({ summary: 'Send message in conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 201, description: 'Created message item' })
  async sendMessage(@Param('id') conversationId: string, @Body() dto: any, @Req() req: any) {
    const userId = req.user.uid;
    const result = await this.communicationService.sendMessage(conversationId, dto, userId, req.user);

    // Broadcast new message event to conversation participants
    this.eventsService.emit({
      type: 'message_new',
      data: {
        conversationId,
        senderId: userId,
        message: result.data,
      },
    });

    return result;
  }

  @Patch('messages/:id/read')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message marked read' })
  async markRead(@Param('id') messageId: string, @Req() req: any) {
    const userId = req?.user?.uid;
    const result = await this.communicationService.markRead(messageId, userId);

    this.eventsService.emit({
      type: 'message_read',
      userId,
      data: { messageId },
    });

    return result;
  }

  @Patch('messages/:id/body')
  @HttpCode(200)
  @ApiOperation({ summary: 'Edit message body' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message updated' })
  async editMessage(@Param('id') messageId: string, @Body() dto: { body: string }, @Req() req: any) {
    const userId = req.user.uid;
    const result = await this.communicationService.editMessage(messageId, dto.body, userId);

    this.eventsService.emit({
      type: 'message_edit',
      data: {
        messageId,
        body: dto.body,
        editedAt: new Date().toISOString(),
      },
    });

    return result;
  }

  @Delete('messages/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message deleted' })
  async deleteMessage(@Param('id') messageId: string, @Req() req: any) {
    const userId = req.user.uid;
    const result = await this.communicationService.deleteMessage(messageId, userId);

    this.eventsService.emit({
      type: 'message_delete',
      data: {
        messageId,
        deletedAt: new Date().toISOString(),
      },
    });

    return result;
  }

  // ── Attachments ───────────────────────────────────────────────────────────

  @Get('attachments/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get attachment metadata' })
  @ApiParam({ name: 'id', description: 'Attachment ID' })
  @ApiResponse({ status: 200, description: 'Attachment metadata' })
  async getAttachment(@Param('id') attachmentId: string) {
    return await this.communicationService.getAttachment(attachmentId);
  }

  @Post('attachments')
  @HttpCode(201)
  @ApiOperation({ summary: 'Save attachment metadata' })
  @ApiResponse({ status: 201, description: 'Saved attachment' })
  async saveAttachment(@Req() req: any, @Body() dto: any) {
    const userId = req.user.uid;
    return await this.communicationService.saveAttachment(userId, dto);
  }

  @Delete('attachments/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete attachment metadata' })
  @ApiParam({ name: 'id', description: 'Attachment ID' })
  @ApiResponse({ status: 200, description: 'Attachment deleted' })
  async deleteAttachment(@Param('id') attachmentId: string) {
    return await this.communicationService.deleteAttachment(attachmentId);
  }
}
