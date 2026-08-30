import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req, Logger } from '@nestjs/common';
import { SavedPropertiesService } from '../services/saved-properties.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller()
@UseGuards(FirebaseAuthGuard)
export class SavedPropertiesController {
  private readonly logger = new Logger(SavedPropertiesController.name);

  constructor(private readonly savedPropertiesService: SavedPropertiesService) {}

  @Get(['saved-properties', 'users/me/saved-properties'])
  async getSavedProperties(
    @Req() req: any,
    @Query('limit') limitStr?: string,
    @Query('lastVisible') lastVisible?: string
  ) {
    const userId = req.user.uid;
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    this.logger.log(`[getSavedProperties] uid=${userId} limit=${limit} lastVisible=${lastVisible}`);
    try {
      const result = await this.savedPropertiesService.getSavedProperties(userId, limit, lastVisible);
      this.logger.log(`[getSavedProperties] uid=${userId} → returned ${result.items?.length || 0} item(s)`);
      return result;
    } catch (err: any) {
      this.logger.error(`[getSavedProperties] uid=${userId} FAILED: ${err?.message || err}`);
      throw err;
    }
  }

  @Post(['saved-properties', 'users/me/saved-properties'])
  async saveProperty(@Req() req: any, @Body() body: any) {
    const userId = req.user.uid;
    const propId = body?.propertyId || body?.id || body?.property?.id || body?.property?.propertyId || `prop_${Date.now()}`;
    this.logger.log(`[saveProperty] uid=${userId} propertyId=${propId}`);
    try {
      const result = await this.savedPropertiesService.saveProperty(userId, propId, body);
      this.logger.log(`[saveProperty] uid=${userId} propertyId=${propId} → saved OK`);
      return result;
    } catch (err: any) {
      this.logger.error(`[saveProperty] uid=${userId} propertyId=${propId} FAILED: ${err?.message || err}`);
      throw err;
    }
  }

  @Delete(['saved-properties/:propertyId(*)', 'users/me/saved-properties/:propertyId(*)', 'saved-properties', 'users/me/saved-properties'])
  async unsaveProperty(
    @Req() req: any,
    @Param('propertyId') propertyIdParam?: string,
    @Query('propertyId') propertyIdQuery?: string,
  ) {
    const userId = req.user.uid;
    const rawId = propertyIdParam || propertyIdQuery || '';
    const propertyId = decodeURIComponent(rawId);
    this.logger.log(`[unsaveProperty] uid=${userId} propertyId=${propertyId}`);
    try {
      const result = await this.savedPropertiesService.unsaveProperty(userId, propertyId);
      this.logger.log(`[unsaveProperty] uid=${userId} propertyId=${propertyId} → removed OK`);
      return result;
    } catch (err: any) {
      this.logger.error(`[unsaveProperty] uid=${userId} propertyId=${propertyId} FAILED: ${err?.message || err}`);
      throw err;
    }
  }
}
