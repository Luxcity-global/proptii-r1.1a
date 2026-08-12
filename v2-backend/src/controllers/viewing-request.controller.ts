import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Logger } from '@nestjs/common';
import { ViewingRequestService } from '../services/viewing-request.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller('viewing-requests')
@UseGuards(FirebaseAuthGuard)
export class ViewingRequestController {
  private readonly logger = new Logger(ViewingRequestController.name);

  constructor(private readonly viewingRequestService: ViewingRequestService) {}

  @Post()
  async createViewing(@Req() req: any, @Body() body: any) {
    const tenantId = req.user.uid;
    const tenantEmail = req.user.email;
    this.logger.log(`[createViewing] uid=${tenantId} email=${tenantEmail} body=${JSON.stringify(body).slice(0, 200)}`);
    try {
      const result = await this.viewingRequestService.createViewing(tenantId, tenantEmail, body);
      this.logger.log(`[createViewing] uid=${tenantId} → created id=${(result as any)?.id ?? 'unknown'}`);
      return result;
    } catch (err: any) {
      this.logger.error(`[createViewing] uid=${tenantId} FAILED: ${err?.message || err}`);
      throw err;
    }
  }

  @Get()
  async getViewings(@Req() req: any) {
    const userId = req.user.uid;
    const role = req.user.role || 'tenant';
    this.logger.log(`[getViewings] uid=${userId} role=${role}`);
    try {
      const result = await this.viewingRequestService.getViewingRequests(userId, role);
      this.logger.log(`[getViewings] uid=${userId} → returned ${Array.isArray(result) ? result.length : '?'} item(s)`);
      return result;
    } catch (err: any) {
      this.logger.error(`[getViewings] uid=${userId} FAILED: ${err?.message || err}`);
      throw err;
    }
  }

  @Get(':id')
  async getViewingById(@Param('id') id: string) {
    this.logger.log(`[getViewingById] id=${id}`);
    try {
      const result = await this.viewingRequestService.getViewingById(id);
      this.logger.log(`[getViewingById] id=${id} → found=${!!result}`);
      return result;
    } catch (err: any) {
      this.logger.error(`[getViewingById] id=${id} FAILED: ${err?.message || err}`);
      throw err;
    }
  }

  @Put(':id')
  async updateViewingStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: string; notes?: string }) {
    const userId = req.user.uid;
    this.logger.log(`[updateViewingStatus] uid=${userId} id=${id} status=${body.status}`);
    try {
      const result = await this.viewingRequestService.updateViewingStatus(id, userId, body.status, body.notes);
      this.logger.log(`[updateViewingStatus] uid=${userId} id=${id} → updated OK`);
      return result;
    } catch (err: any) {
      this.logger.error(`[updateViewingStatus] uid=${userId} id=${id} FAILED: ${err?.message || err}`);
      throw err;
    }
  }

  @Delete(':id')
  async cancelViewing(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.uid;
    this.logger.log(`[cancelViewing] uid=${userId} id=${id}`);
    try {
      const result = await this.viewingRequestService.cancelViewing(id, userId);
      this.logger.log(`[cancelViewing] uid=${userId} id=${id} → cancelled OK`);
      return result;
    } catch (err: any) {
      this.logger.error(`[cancelViewing] uid=${userId} id=${id} FAILED: ${err?.message || err}`);
      throw err;
    }
  }
}
