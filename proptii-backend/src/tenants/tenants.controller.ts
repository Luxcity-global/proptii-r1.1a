import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TenantsService } from './tenants.service';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  private getUserId(req: any): string {
    return req.user?.sub || req.user?.oid || req.user?.id;
  }

  @Get()
  async findAll(@Req() req: any, @Query('ownedPropertyIds') ownedPropertyIds?: string) {
    const userId = this.getUserId(req);
    const idsArray = ownedPropertyIds ? ownedPropertyIds.split(',') : [];
    const tenants = await this.tenantsService.findAll(userId, idsArray);
    return { success: true, tenants };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const tenant = await this.tenantsService.findOne(id);
    return { success: true, tenant };
  }

  @Post()
  async create(@Req() req: any, @Body() tenantData: any) {
    const userId = this.getUserId(req);
    return this.tenantsService.create(userId, tenantData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updates: any) {
    return this.tenantsService.update(id, updates);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
