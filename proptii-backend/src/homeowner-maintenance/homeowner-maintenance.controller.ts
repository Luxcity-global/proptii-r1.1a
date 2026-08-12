import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { HomeownerMaintenanceService } from './homeowner-maintenance.service';

@ApiTags('homeowner-maintenance')
@Controller('homeowner-maintenance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HomeownerMaintenanceController {
  constructor(private readonly homeownerMaintenanceService: HomeownerMaintenanceService) {}

  private getUserId(req: any): string {
    return req.user?.sub || req.user?.oid || req.user?.id;
  }

  @Get()
  async findAll(@Req() req: any) {
    const userId = this.getUserId(req);
    const tasks = await this.homeownerMaintenanceService.findAll(userId);
    return { success: true, tasks };
  }

  @Post()
  async create(@Req() req: any, @Body() taskData: any) {
    const userId = this.getUserId(req);
    return this.homeownerMaintenanceService.create(userId, taskData);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() updates: any) {
    const userId = this.getUserId(req);
    return this.homeownerMaintenanceService.update(id, userId, updates);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = this.getUserId(req);
    return this.homeownerMaintenanceService.remove(id, userId);
  }
}
