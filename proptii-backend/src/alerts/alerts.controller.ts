import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AlertsService } from './alerts.service';

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  private getUserId(req: any): string {
    return req.user?.sub || req.user?.oid || req.user?.id;
  }

  @Post()
  async create(@Req() req: any, @Body() createAlertDto: any) {
    const userId = this.getUserId(req);
    return this.alertsService.create(createAlertDto, userId);
  }

  @Get()
  async findAll(@Req() req: any, @Query() query: any) {
    const userId = this.getUserId(req);
    return this.alertsService.findAll(userId, query);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const userId = this.getUserId(req);
    return this.alertsService.findOne(id, userId);
  }

  @Put(':id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: string
  ) {
    const userId = this.getUserId(req);
    return this.alertsService.updateStatus(id, userId, status);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = this.getUserId(req);
    return this.alertsService.remove(id, userId);
  }
}
