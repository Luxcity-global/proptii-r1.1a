import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TenantsService } from '../services/tenants.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new tenant under landlord/agent management' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  async createTenant(@Req() req: any, @Body() body: any) {
    const userId = req.user?.uid || req.user?.id || req.user?.email || body.userId;
    return this.tenantsService.createTenant(body, userId);
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List all tenants for authenticated landlord or owned property IDs' })
  @ApiQuery({ name: 'ownedPropertyIds', required: false, description: 'Comma-separated property IDs' })
  @ApiResponse({ status: 200, description: 'Array of tenants' })
  async getTenants(@Req() req: any, @Query('ownedPropertyIds') ownedPropertyIds?: string) {
    const userId = req.user?.uid || req.user?.id || req.user?.email;
    const propIds = ownedPropertyIds ? ownedPropertyIds.split(',').filter(Boolean) : undefined;
    return this.tenantsService.getTenants(userId, propIds);
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get single tenant details by ID' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Tenant object' })
  async getTenant(@Param('id') id: string) {
    return this.tenantsService.getTenant(id);
  }

  @Put(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update tenant details by ID' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Update status' })
  async updateTenant(@Param('id') id: string, @Body() updates: any) {
    return this.tenantsService.updateTenant(id, updates);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Delete or archive tenant by ID' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Delete status' })
  async deleteTenant(@Param('id') id: string) {
    return this.tenantsService.deleteTenant(id);
  }
}
