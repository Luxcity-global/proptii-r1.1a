import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Logger, Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { ViewingRequestService } from '../services/viewing-request.service';
import { EventsService } from '../services/events.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@ApiTags('Viewing Requests')
@ApiBearerAuth('bearer')
@Controller('viewing-requests')
@UseGuards(FirebaseAuthGuard)
export class ViewingRequestController {
  private readonly logger = new Logger(ViewingRequestController.name);

  constructor(
    private readonly viewingRequestService: ViewingRequestService,
    private readonly eventsService: EventsService,
  ) {}

  @Sse('events')
  @ApiOperation({ summary: 'Subscribe to real-time viewing event stream (SSE)' })
  sendViewingEvents(@Req() req: any): Observable<MessageEvent> {
    const userId = req.user.uid;
    const email = req.user.email;
    const role = req.user.role;
    this.logger.log(`[SSE:Viewing] Client connected uid=${userId} email=${email} role=${role}`);
    return this.eventsService.subscribe(userId, email, role);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new viewing booking request' })
  @ApiResponse({ status: 201, description: 'Viewing request created' })
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
  @ApiOperation({ summary: 'Get viewing requests for current user (filtered by tenant/landlord/agent role)' })
  @ApiResponse({ status: 200, description: 'Array of viewing requests' })
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
  @ApiOperation({ summary: 'Get single viewing request by ID' })
  @ApiParam({ name: 'id', description: 'Viewing Request ID' })
  @ApiResponse({ status: 200, description: 'Viewing request object' })
  async getViewingById(@Param('id') id: string, @Req() req: any) {
    this.logger.log(`[getViewingById] id=${id}`);
    try {
      const result = await this.viewingRequestService.getViewingById(id, req.user);
      this.logger.log(`[getViewingById] id=${id} → found=${!!result}`);
      return result;
    } catch (err: any) {
      this.logger.error(`[getViewingById] id=${id} FAILED: ${err?.message || err}`);
      throw err;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update viewing request status (confirmed, cancelled, rescheduled, completed)' })
  @ApiParam({ name: 'id', description: 'Viewing Request ID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateViewingStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: string; notes?: string }) {
    const userId = req.user.uid;
    this.logger.log(`[updateViewingStatus] uid=${userId} id=${id} status=${body.status}`);
    try {
      const result = await this.viewingRequestService.updateViewingStatus(id, userId, body.status, body.notes, req.user);
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
  @ApiOperation({ summary: 'Cancel viewing request' })
  @ApiParam({ name: 'id', description: 'Viewing Request ID' })
  @ApiResponse({ status: 200, description: 'Viewing request cancelled' })
  async cancelViewing(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.uid;
    this.logger.log(`[cancelViewing] uid=${userId} id=${id}`);
    try {
      const result = await this.viewingRequestService.cancelViewing(id, userId, req.user);
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
