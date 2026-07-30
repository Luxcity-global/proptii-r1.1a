import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('communication')
@Controller('communication')
export class CommunicationController {

  @Get('conversations')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get conversations for current user' })
  async getConversations() {
    return { data: [] };
  }

  @Get('conversations/unread-count')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread message count' })
  async getUnreadCount() {
    return { data: { unreadCount: 0 } };
  }

  @Post('conversations')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or get conversation' })
  async getOrCreateConversation(@Body() dto: any) {
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

  @Get('conversations/:id/messages')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get messages for conversation' })
  async getMessages(@Param('id') id: string) {
    return { data: [] };
  }

  @Post('conversations/:id/messages')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send message in conversation' })
  async sendMessage(@Param('id') conversationId: string, @Body() dto: any) {
    return {
      data: {
        id: `msg_${Date.now()}`,
        conversationId,
        senderId: dto.senderId || '',
        text: dto.text || '',
        timestamp: new Date().toISOString(),
        isRead: false
      }
    };
  }

  @Patch('messages/:id/read')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark message as read' })
  async markRead(@Param('id') messageId: string, @Query('conversationId') conversationId: string) {
    return { data: { success: true } };
  }
}
