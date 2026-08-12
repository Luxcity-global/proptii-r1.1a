import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ViewingRequestService } from '../services/viewing-request.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller('viewing-requests')
@UseGuards(FirebaseAuthGuard)
export class ViewingRequestController {
  constructor(private readonly viewingRequestService: ViewingRequestService) {}

  @Post()
  async createViewing(@Req() req: any, @Body() body: any) {
    const tenantId = req.user.uid;
    const tenantEmail = req.user.email;
    return await this.viewingRequestService.createViewing(tenantId, tenantEmail, body);
  }

  @Get()
  async getViewings(@Req() req: any) {
    const userId = req.user.uid;
    const role = req.user.role || 'tenant';
    return await this.viewingRequestService.getViewingRequests(userId, role);
  }

  @Get(':id')
  async getViewingById(@Param('id') id: string) {
    return await this.viewingRequestService.getViewingById(id);
  }

  @Put(':id')
  async updateViewingStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: string; notes?: string }) {
    const userId = req.user.uid;
    return await this.viewingRequestService.updateViewingStatus(id, userId, body.status, body.notes);
  }

  @Delete(':id')
  async cancelViewing(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.uid;
    return await this.viewingRequestService.cancelViewing(id, userId);
  }
}
