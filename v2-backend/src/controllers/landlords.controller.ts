import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
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

  /** GET /api/tenants — list all tenants */
  @Get('tenants')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List all tenant profiles' })
  @ApiResponse({ status: 200, description: 'Array of tenants' })
  async getAllTenants() {
    return this.landlordsService.getAllTenants();
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
}
