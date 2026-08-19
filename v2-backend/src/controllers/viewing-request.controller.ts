import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Logger, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ViewingRequestService } from '../services/viewing-request.service';
import { EventsService } from '../services/events.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller('viewing-requests')
@UseGuards(FirebaseAuthGuard)
export class ViewingRequestController {
  private readonly logger = new Logger(ViewingRequestController.name);

  constructor(
    private readonly viewingRequestService: ViewingRequestService,
    private readonly eventsService: EventsService,
  ) {}

  @Sse('events')
  sendViewingEvents(@Req() req: any): Observable<MessageEvent> {
    const userId = req.user.uid;
    const email = req.user.email;
    const role = req.user.role;
    this.logger.log(`[SSE:Viewing] Client connected uid=${userId} email=${email} role=${role}`);
    return this.eventsService.subscribe(userId, email, role);
  }

  @Post()
  async createViewing(@Req() req: any, @Body() body: any) {
    const tenantId = req.user.uid;
    const tenantEmail = req.user.email;
    this.logger.log(`[createViewing] uid=${tenantId} email=${tenantEmail} body=${JSON.stringify(body).slice(0, 200)}`);
    try {
      const result = await this.viewingRequestService.createViewing(tenantId, tenantEmail, body);
      const createdId = (result as any)?.id || (result as any)?.requestId || 'unknown';
      this.logger.log(`[createViewing] uid=${tenantId} → created id=${createdId}`);

      // Broadcast SSE event
      this.eventsService.emit({
        type: 'viewing_created',
        userId: tenantId,
        targetEmail: body.agentEmail || body.property?.agent?.email,
        data: {
          id: createdId,
          tenantId,
          tenantEmail,
          propertyId: body.propertyId,
          landlordId: body.landlordId,
          agentId: body.agentId,
          status: 'pending',
        },
      });

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

      // Broadcast SSE update event
      this.eventsService.emit({
        type: 'viewing_updated',
        data: {
          id,
          updatedBy: userId,
          status: body.status,
          notes: body.notes,
        },
      });

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

      // Broadcast SSE delete event
      this.eventsService.emit({
        type: 'viewing_deleted',
        data: {
          id,
          cancelledBy: userId,
        },
      });

      return result;
    } catch (err: any) {
      this.logger.error(`[cancelViewing] uid=${userId} id=${id} FAILED: ${err?.message || err}`);
      throw err;
    }
  }
}
