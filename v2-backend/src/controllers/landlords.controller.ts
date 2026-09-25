import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LandlordsService } from '../services/landlords.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@ApiTags('Landlords')
@Controller()
export class LandlordsController {
  constructor(private readonly landlordsService: LandlordsService) {}

  /** GET /api/landlords — list all landlords/agents */
  @Get('landlords')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List all registered landlords and agents' })
  @ApiResponse({ status: 200, description: 'Array of landlords' })
  async getAllLandlords() {
    return this.landlordsService.getAllLandlords();
  }

  /** GET /api/landlords/check?email=... — check if email is a landlord/agent */
  @Get('landlords/check')
  @ApiOperation({ summary: 'Check if email belongs to a landlord or agent' })
  @ApiQuery({ name: 'email', description: 'Email address to verify' })
  @ApiResponse({ status: 200, description: 'Check result' })
  async checkLandlord(@Query('email') email: string) {
    if (!email) return { exists: false };
    return this.landlordsService.checkLandlord(email);
  }

  /** POST /api/landlords/register — register a new landlord/agent */
  @Post('landlords/register')
  @ApiOperation({ summary: 'Register a new landlord or agency profile' })
  @ApiResponse({ status: 201, description: 'Landlord profile created' })
  async registerLandlord(@Body() body: any) {
    return this.landlordsService.registerLandlord(body);
  }

  /** GET /api/clients/landlords — alias for landlords list used in some frontend calls */
  @Get('clients/landlords')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List client landlords (frontend compatibility alias)' })
  @ApiResponse({ status: 200, description: 'Array of client landlords' })
  async getClientLandlords() {
    return this.landlordsService.getAllLandlords();
  }

  /** POST /api/clients/landlords — create landlord (frontend compatibility alias for /api/landlords/register) */
  @Post('clients/landlords')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Create a new landlord record (compatibility alias for /api/landlords/register)' })
  @ApiResponse({ status: 201, description: 'Landlord created' })
  async createClientLandlord(@Body() body: any) {
    const result = await this.landlordsService.registerLandlord(body);
    return { ...result, id: result.id };
  }

  /** GET /api/clients/landlords/:id — get single landlord by ID */
  @Get('clients/landlords/:id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get a single landlord record by ID' })
  @ApiResponse({ status: 200, description: 'Landlord record' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getClientLandlordById(@Param('id') id: string) {
    return this.landlordsService.getLandlordById(id);
  }

  /** PUT /api/clients/landlords/:id — update landlord */
  @Put('clients/landlords/:id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update a landlord record by ID' })
  @ApiResponse({ status: 200, description: 'Updated' })
  async updateClientLandlord(@Param('id') id: string, @Body() body: any) {
    return this.landlordsService.updateLandlord(id, body);
  }

  /** DELETE /api/clients/landlords/:id — delete landlord */
  @Delete('clients/landlords/:id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Delete a landlord record by ID' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  async deleteClientLandlord(@Param('id') id: string) {
    return this.landlordsService.deleteLandlord(id);
  }
}
