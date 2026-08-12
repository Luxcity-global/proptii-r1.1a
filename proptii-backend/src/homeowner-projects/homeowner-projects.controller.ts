import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { HomeownerProjectsService } from './homeowner-projects.service';

@ApiTags('homeowner-projects')
@Controller('homeowner-projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HomeownerProjectsController {
  constructor(private readonly homeownerProjectsService: HomeownerProjectsService) {}

  private getUserId(req: any): string {
    return req.user?.sub || req.user?.oid || req.user?.id;
  }

  @Get()
  async findAll(@Req() req: any) {
    const userId = this.getUserId(req);
    const projects = await this.homeownerProjectsService.findAll(userId);
    return { success: true, projects };
  }

  @Post()
  async create(@Req() req: any, @Body() projectData: any) {
    const userId = this.getUserId(req);
    return this.homeownerProjectsService.create(userId, projectData);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() updates: any) {
    const userId = this.getUserId(req);
    return this.homeownerProjectsService.update(id, userId, updates);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = this.getUserId(req);
    return this.homeownerProjectsService.remove(id, userId);
  }
}
