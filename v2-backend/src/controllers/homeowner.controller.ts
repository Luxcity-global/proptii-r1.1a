import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { HomeownerService } from '../services/homeowner.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@ApiTags('Homeowner')
@ApiBearerAuth('bearer')
@Controller()
@UseGuards(FirebaseAuthGuard)
export class HomeownerController {
  constructor(private readonly homeownerService: HomeownerService) {}

  // ── Maintenance ───────────────────────────────────────────────────────────

  @Get('homeowner-maintenance')
  @ApiOperation({ summary: 'List homeowner maintenance tasks' })
  @ApiResponse({ status: 200, description: 'Array of maintenance tasks' })
  async getMaintenanceTasks(@Req() req: any) {
    return this.homeownerService.getMaintenanceTasks(req.user.uid);
  }

  @Post('homeowner-maintenance')
  @ApiOperation({ summary: 'Create homeowner maintenance task' })
  @ApiResponse({ status: 201, description: 'Task created' })
  async createMaintenanceTask(@Req() req: any, @Body() body: any) {
    return this.homeownerService.createMaintenanceTask(req.user.uid, body);
  }

  @Put('homeowner-maintenance/:id')
  @ApiOperation({ summary: 'Update homeowner maintenance task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task updated' })
  async updateMaintenanceTask(@Param('id') id: string, @Body() body: any) {
    return this.homeownerService.updateMaintenanceTask(id, body);
  }

  @Delete('homeowner-maintenance/:id')
  @ApiOperation({ summary: 'Delete homeowner maintenance task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task deleted' })
  async deleteMaintenanceTask(@Param('id') id: string) {
    return this.homeownerService.deleteMaintenanceTask(id);
  }

  // ── Projects ──────────────────────────────────────────────────────────────

  @Get('homeowner-projects')
  @ApiOperation({ summary: 'List homeowner home improvement projects' })
  @ApiResponse({ status: 200, description: 'Array of projects' })
  async getProjects(@Req() req: any) {
    return this.homeownerService.getProjects(req.user.uid);
  }

  @Post('homeowner-projects')
  @ApiOperation({ summary: 'Create homeowner project' })
  @ApiResponse({ status: 201, description: 'Project created' })
  async createProject(@Req() req: any, @Body() body: any) {
    return this.homeownerService.createProject(req.user.uid, body);
  }

  @Put('homeowner-projects/:id')
  @ApiOperation({ summary: 'Update homeowner project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project updated' })
  async updateProject(@Param('id') id: string, @Body() body: any) {
    return this.homeownerService.updateProject(id, body);
  }

  @Delete('homeowner-projects/:id')
  @ApiOperation({ summary: 'Delete homeowner project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project deleted' })
  async deleteProject(@Param('id') id: string) {
    return this.homeownerService.deleteProject(id);
  }
}
