import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, Sse, MessageEvent, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { SkipThrottle } from '@nestjs/throttler';
import { AlertsService } from '../services/alerts.service';
import { EventsService } from '../services/events.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@ApiTags('Alerts')
@ApiBearerAuth('bearer')
@Controller('alerts')
@UseGuards(FirebaseAuthGuard)
export class AlertsController {
  private readonly logger = new Logger(AlertsController.name);

  constructor(
    private readonly alertsService: AlertsService,
    private readonly eventsService: EventsService,
  ) {}

  @Sse('events')
  @SkipThrottle()
  @ApiOperation({ summary: 'Subscribe to real-time notification alert events stream (SSE)' })
  sendAlertEvents(@Req() req: any): Observable<MessageEvent> {
    const userId = req.user.uid;
    const email = req.user.email;
    const role = req.user.role;
    this.logger.log(`[SSE:Alerts] Client connected uid=${userId} email=${email}`);
    return this.eventsService.subscribe(userId, email, role);
  }

  @Get()
  @ApiOperation({ summary: 'List user alerts and notifications' })
  @ApiResponse({ status: 200, description: 'Array of alerts' })
  async getAlerts(@Req() req: any) {
    return this.alertsService.getAlerts(req.user.uid);
  }

  @Post()
  @ApiOperation({ summary: 'Create user alert' })
  @ApiResponse({ status: 201, description: 'Alert created' })
  async createAlert(@Req() req: any, @Body() body: any) {
    const userId = req.user.uid;
    const result = await this.alertsService.createAlert(userId, body);
    this.eventsService.emit({
      type: 'alert_created',
      userId,
      data: result,
    });
    return result;
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark alert as read' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Alert marked read' })
  async markRead(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.uid;
    const result = await this.alertsService.markAlertRead(id);
    this.eventsService.emit({
      type: 'alert_updated',
      userId,
      data: { id, read: true },
    });
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Dismiss / delete alert' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Alert deleted' })
  async deleteAlert(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.uid;
    const result = await this.alertsService.deleteAlert(id);
    this.eventsService.emit({
      type: 'alert_deleted',
      userId,
      data: { id },
    });
    return result;
  }
}
