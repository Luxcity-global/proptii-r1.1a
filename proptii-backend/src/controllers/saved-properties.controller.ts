import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, HttpCode } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SavedPropertiesService } from '../services/saved-properties.service';

@Controller('users/me/saved-properties')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SavedPropertiesController {
  constructor(private readonly savedPropertiesService: SavedPropertiesService) {}

  @Get()
  async getSavedProperties(@Req() req: any) {
    const userId = req.user?.sub;
    return await this.savedPropertiesService.getSavedProperties(userId);
  }

  @Post()
  @HttpCode(201)
  async saveProperty(@Req() req: any, @Body() propertyData: any) {
    const userId = req.user?.sub;
    return await this.savedPropertiesService.saveProperty(userId, propertyData);
  }

  @Delete(':propertyId')
  @HttpCode(204)
  async removeSavedProperty(@Req() req: any, @Param('propertyId') propertyId: string) {
    const userId = req.user?.sub;
    await this.savedPropertiesService.removeSavedProperty(userId, propertyId);
  }
}
