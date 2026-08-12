import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { LandlordsService } from '../services/landlords.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller()
export class LandlordsController {
  constructor(private readonly landlordsService: LandlordsService) {}

  /** GET /api/landlords — list all landlords/agents */
  @Get('landlords')
  @UseGuards(FirebaseAuthGuard)
  async getAllLandlords() {
    return this.landlordsService.getAllLandlords();
  }

  /** GET /api/landlords/check?email=... — check if email is a landlord/agent */
  @Get('landlords/check')
  async checkLandlord(@Query('email') email: string) {
    if (!email) return { exists: false };
    return this.landlordsService.checkLandlord(email);
  }

  /** POST /api/landlords/register — register a new landlord/agent */
  @Post('landlords/register')
  async registerLandlord(@Body() body: any) {
    return this.landlordsService.registerLandlord(body);
  }

  /** GET /api/tenants — list all tenants */
  @Get('tenants')
  @UseGuards(FirebaseAuthGuard)
  async getAllTenants() {
    return this.landlordsService.getAllTenants();
  }

  /** GET /api/clients/landlords — alias for landlords list used in some frontend calls */
  @Get('clients/landlords')
  @UseGuards(FirebaseAuthGuard)
  async getClientLandlords() {
    return this.landlordsService.getAllLandlords();
  }
}
