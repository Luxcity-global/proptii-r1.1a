import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PropertySelectionsService } from '../services/property-selections.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@ApiTags('Property Selections')
@ApiBearerAuth('bearer')
@Controller('property-selections')
@UseGuards(FirebaseAuthGuard)
export class PropertySelectionsController {
  constructor(private readonly service: PropertySelectionsService) {}

  /** GET /api/property-selections?status=... */
  @Get()
  @ApiOperation({ summary: 'List property selections for user' })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'List of selections' })
  async getSelections(@Req() req: any, @Query('status') status?: string) {
    return this.service.getSelections(req.user.uid, status);
  }

  /** GET /api/property-selections/stats */
  @Get('stats')
  @ApiOperation({ summary: 'Get summary statistics of property selections' })
  @ApiResponse({ status: 200, description: 'Selection stats' })
  async getStats(@Req() req: any) {
    return this.service.getStats(req.user.uid);
  }

  /** POST /api/property-selections */
  @Post()
  @ApiOperation({ summary: 'Add property selection' })
  @ApiResponse({ status: 201, description: 'Selection created' })
  async createSelection(@Req() req: any, @Body() body: any) {
    return this.service.createSelection(req.user.uid, body);
  }

  /** PUT /api/property-selections/:id/status */
  @Put(':id/status')
  @ApiOperation({ summary: 'Update property selection status' })
  @ApiParam({ name: 'id', description: 'Selection ID' })
  @ApiResponse({ status: 200, description: 'Selection status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.service.updateSelectionStatus(id, body.status, body.notes);
  }

  /** DELETE /api/property-selections/:id */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete property selection' })
  @ApiParam({ name: 'id', description: 'Selection ID' })
  @ApiResponse({ status: 200, description: 'Selection deleted' })
  async deleteSelection(@Param('id') id: string) {
    return this.service.deleteSelection(id);
  }
}
