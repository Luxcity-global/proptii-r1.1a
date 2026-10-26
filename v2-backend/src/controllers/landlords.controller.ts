import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LandlordsService } from '../services/landlords.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@ApiTags('Landlords')
@Controller()
export class LandlordsController {
  constructor(private readonly landlordsService: LandlordsService) {}

  /** GET /api/landlords — list landlords scoped to agency/caller */
  @Get('landlords')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('landlord', 'agent')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List registered landlords for agency or caller' })
  @ApiResponse({ status: 200, description: 'Array of landlords' })
  async getAllLandlords(@Req() req?: any) {
    const role = req?.user?.role;
    if (role === 'agent') {
      return this.landlordsService.getAllLandlords(req.user.uid);
    }
    if (role === 'landlord') {
      return this.landlordsService.getAllLandlords(undefined, req.user.uid);
    }
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

  /** POST /api/landlords/register — register a new landlord/agent (authenticated) */
  @Post('landlords/register')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Register a new landlord or agency profile' })
  @ApiResponse({ status: 201, description: 'Landlord profile created' })
  async registerLandlord(@Body() body: any, @Req() req?: any) {
    const payload = req?.user?.uid
      ? { ...body, uid: req.user.uid, userId: req.user.uid, email: req.user.email || body.email }
      : body;
    return this.landlordsService.registerLandlord(payload);
  }

  /** GET /api/clients/landlords — alias for landlords list used in frontend calls */
  @Get('clients/landlords')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('landlord', 'agent')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List client landlords (scoped to agency)' })
  @ApiResponse({ status: 200, description: 'Array of client landlords' })
  async getClientLandlords(@Req() req?: any) {
    const role = req?.user?.role;
    if (role === 'agent') {
      return this.landlordsService.getAllLandlords(req.user.uid);
    }
    if (role === 'landlord') {
      return this.landlordsService.getAllLandlords(undefined, req.user.uid);
    }
    return this.landlordsService.getAllLandlords();
  }

  /** POST /api/clients/landlords — create client landlord record */
  @Post('clients/landlords')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('agent')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Create a new landlord record under agency management' })
  @ApiResponse({ status: 201, description: 'Landlord created' })
  async createClientLandlord(@Body() body: any, @Req() req?: any) {
    const payload = req?.user?.uid
      ? { ...body, agencyId: req.user.uid, createdBy: req.user.uid }
      : body;
    const result = await this.landlordsService.registerLandlord(payload);
    return { ...result, id: result.id };
  }

  /** GET /api/clients/landlords/:id — get single landlord by ID */
  @Get('clients/landlords/:id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get a single landlord record by ID' })
  @ApiResponse({ status: 200, description: 'Landlord record' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getClientLandlordById(@Param('id') id: string, @Req() req?: any) {
    const callerId = req?.user?.uid;
    const role = req?.user?.role;
    const isAdmin = role === 'admin' || req?.user?.admin === true;
    if (callerId && role === 'landlord' && callerId !== id && !isAdmin) {
      throw new ForbiddenException('Access denied to landlord record');
    }
    return this.landlordsService.getLandlordById(id);
  }

  /** PUT /api/clients/landlords/:id — update landlord */
  @Put('clients/landlords/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('landlord', 'agent')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update a landlord record by ID' })
  @ApiResponse({ status: 200, description: 'Updated' })
  async updateClientLandlord(@Param('id') id: string, @Body() body: any, @Req() req?: any) {
    if (req?.user?.uid) {
      return this.landlordsService.updateLandlord(id, req.user.uid, body);
    }
    return this.landlordsService.updateLandlord(id, body);
  }

  /** DELETE /api/clients/landlords/:id — delete landlord */
  @Delete('clients/landlords/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('landlord', 'agent')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Delete a landlord record by ID' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  async deleteClientLandlord(@Param('id') id: string, @Req() req?: any) {
    if (req?.user?.uid) {
      return this.landlordsService.deleteLandlord(id, req.user.uid);
    }
    return this.landlordsService.deleteLandlord(id);
  }
}
