import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, Req, NotFoundException, Sse, MessageEvent, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { CommunicationService } from '../services/communication.service';
import { EventsService } from '../services/events.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

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

  @Sse('events')
  @ApiOperation({ summary: 'Subscribe to real-time communication events stream (SSE)' })
  sendCommunicationEvents(@Req() req: any): Observable<MessageEvent> {
    const userId = req.user.uid;
    const email = req.user.email;
    const role = req.user.role;
    this.logger.log(`[SSE:Communication] Client connected uid=${userId} email=${email}`);
    return this.eventsService.subscribe(userId, email, role);
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
    return await this.communicationService.getOrCreateConversation(dto, userId);
  }

  @Get('conversations/:id/messages')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get messages for a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Array of conversation messages' })
  async getMessages(@Param('id') id: string, @Req() req: any) {
    return await this.communicationService.getMessages(id, req.user);
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
        message: result,
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
