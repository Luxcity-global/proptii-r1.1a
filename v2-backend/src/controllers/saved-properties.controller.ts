import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SavedPropertiesService } from '../services/saved-properties.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller()
@UseGuards(FirebaseAuthGuard)
export class SavedPropertiesController {
  constructor(private readonly savedPropertiesService: SavedPropertiesService) {}

  @Get(['saved-properties', 'users/me/saved-properties'])
  async getSavedProperties(@Req() req: any) {
    const userId = req.user.uid;
    return await this.savedPropertiesService.getSavedProperties(userId);
  }

  @Post(['saved-properties', 'users/me/saved-properties'])
  async saveProperty(@Req() req: any, @Body() body: { propertyId: string; property?: any }) {
    const userId = req.user.uid;
    return await this.savedPropertiesService.saveProperty(userId, body.propertyId, body.property);
  }

  @Delete(['saved-properties/:propertyId', 'users/me/saved-properties/:propertyId'])
  async unsaveProperty(@Req() req: any, @Param('propertyId') propertyId: string) {
    const userId = req.user.uid;
    return await this.savedPropertiesService.unsaveProperty(userId, propertyId);
  }
}
