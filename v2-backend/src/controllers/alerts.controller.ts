import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AlertsService } from '../services/alerts.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller('alerts')
@UseGuards(FirebaseAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async getAlerts(@Req() req: any) {
    return this.alertsService.getAlerts(req.user.uid);
  }

  @Post()
  async createAlert(@Req() req: any, @Body() body: any) {
    return this.alertsService.createAlert(req.user.uid, body);
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string) {
    return this.alertsService.markAlertRead(id);
  }

  @Delete(':id')
  async deleteAlert(@Param('id') id: string) {
    return this.alertsService.deleteAlert(id);
  }
}
