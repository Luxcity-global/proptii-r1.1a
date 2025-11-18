import { Controller, Get, InternalServerErrorException, Query } from '@nestjs/common';
import { AzureUsersService } from '../services/azure-users.service';

@Controller('azure-users')
export class AzureUsersController {
  constructor(private readonly azureUsersService: AzureUsersService) {}

  @Get()
  async getAzureUsers(@Query('search') search?: string) {
    if (!this.azureUsersService.isConfigured()) {
      throw new InternalServerErrorException(
        'Azure AD B2C is not configured. Please set AZURE_AD_B2C_CLIENT_ID, AZURE_AD_B2C_CLIENT_SECRET, and AZURE_AD_B2C_TENANT_ID.',
      );
    }

    const users = await this.azureUsersService.getUsers(search);

    return {
      success: true,
      users,
      count: users.length,
    };
  }
}


