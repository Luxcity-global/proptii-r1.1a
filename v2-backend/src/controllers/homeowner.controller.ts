import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { HomeownerService } from '../services/homeowner.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller()
@UseGuards(FirebaseAuthGuard)
export class HomeownerController {
  constructor(private readonly homeownerService: HomeownerService) {}

  // ── Maintenance ───────────────────────────────────────────────────────────

  @Get('homeowner-maintenance')
  async getMaintenanceTasks(@Req() req: any) {
    return this.homeownerService.getMaintenanceTasks(req.user.uid);
  }

  @Post('homeowner-maintenance')
  async createMaintenanceTask(@Req() req: any, @Body() body: any) {
    return this.homeownerService.createMaintenanceTask(req.user.uid, body);
  }

  @Put('homeowner-maintenance/:id')
  async updateMaintenanceTask(@Param('id') id: string, @Body() body: any) {
    return this.homeownerService.updateMaintenanceTask(id, body);
  }

  @Delete('homeowner-maintenance/:id')
  async deleteMaintenanceTask(@Param('id') id: string) {
    return this.homeownerService.deleteMaintenanceTask(id);
  }

  // ── Projects ──────────────────────────────────────────────────────────────

  @Get('homeowner-projects')
  async getProjects(@Req() req: any) {
    return this.homeownerService.getProjects(req.user.uid);
  }

  @Post('homeowner-projects')
  async createProject(@Req() req: any, @Body() body: any) {
    return this.homeownerService.createProject(req.user.uid, body);
  }

  @Put('homeowner-projects/:id')
  async updateProject(@Param('id') id: string, @Body() body: any) {
    return this.homeownerService.updateProject(id, body);
  }

  @Delete('homeowner-projects/:id')
  async deleteProject(@Param('id') id: string) {
    return this.homeownerService.deleteProject(id);
  }
}
