import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { NativePropertiesService } from '../services/native-properties.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('native-properties')
export class NativePropertiesController {
  constructor(private readonly propertiesService: NativePropertiesService) {}

  @Get()
  async list(@Query('userId') userId: string) {
    return await this.propertiesService.findAllByUserId(userId);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const property = await this.propertiesService.findById(id);
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return property;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('landlord', 'agent')
  @ApiBearerAuth()
  async create(@Req() req: any) {
    const body = req.body;
    const email = req.user?.emails?.[0] || req.user?.email || req.user?.preferred_username || '';
    const userId = req.user?.sub;
    return await this.propertiesService.create({
      ...body,
      userId: userId,
      ownerEmail: email.toLowerCase().trim(),
      landlordId: userId,
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('landlord', 'agent')
  @ApiBearerAuth()
  async update(@Req() req: any, @Param('id') id: string) {
    const body = req.body;
    const userId = req.user?.sub;
    return await this.propertiesService.update(id, userId, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('landlord', 'agent')
  @ApiBearerAuth()
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.sub;
    await this.propertiesService.remove(id, userId);
    return { message: 'Property deleted' };
  }
}
