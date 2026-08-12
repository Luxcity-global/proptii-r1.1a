import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PropertySelectionsService } from '../services/property-selections.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller('property-selections')
@UseGuards(FirebaseAuthGuard)
export class PropertySelectionsController {
  constructor(private readonly service: PropertySelectionsService) {}

  /** GET /api/property-selections?status=... */
  @Get()
  async getSelections(@Req() req: any, @Query('status') status?: string) {
    return this.service.getSelections(req.user.uid, status);
  }

  /** GET /api/property-selections/stats */
  @Get('stats')
  async getStats(@Req() req: any) {
    return this.service.getStats(req.user.uid);
  }

  /** POST /api/property-selections */
  @Post()
  async createSelection(@Req() req: any, @Body() body: any) {
    return this.service.createSelection(req.user.uid, body);
  }

  /** PUT /api/property-selections/:id/status */
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.service.updateSelectionStatus(id, body.status, body.notes);
  }

  /** DELETE /api/property-selections/:id */
  @Delete(':id')
  async deleteSelection(@Param('id') id: string) {
    return this.service.deleteSelection(id);
  }
}
