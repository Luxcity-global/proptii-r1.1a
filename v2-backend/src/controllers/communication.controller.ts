import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, Req, NotFoundException } from '@nestjs/common';
import { CommunicationService } from '../services/communication.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller('communication')
@UseGuards(FirebaseAuthGuard)
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

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
    return await this.communicationService.sendMessage(conversationId, dto, userId);
  }

  @Patch('messages/:id/read')
  @HttpCode(200)
  async markRead(@Param('id') messageId: string) {
    return await this.communicationService.markRead(messageId);
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
