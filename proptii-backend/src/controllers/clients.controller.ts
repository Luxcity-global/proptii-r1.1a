import { Controller, Get, UseGuards, Req, Logger, HttpCode, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from '../services/clients.service';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  private readonly logger = new Logger(ClientsController.name);

  constructor(private readonly clientsService: ClientsService) {}

  @Get('landlords')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all landlords for the directory' })
  async getAllLandlords() {
    return await this.clientsService.getLandlords();
  }

  @Get('tenant/:id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed information for a specific tenant' })
  async getTenantDetails(@Param('id') tenantId: string) {
    return await this.clientsService.getTenantDetails(tenantId);
  }
}
