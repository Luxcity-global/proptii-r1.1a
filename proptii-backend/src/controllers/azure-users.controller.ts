import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AzureUsersService } from '../services/azure-users.service';

@Controller('azure-users')
export class AzureUsersController {
  constructor(private readonly azureUsersService: AzureUsersService) {}

  @Get()
  async getAzureUsers(@Query('search') search?: string) {
    try {
      // Check if service is configured
      if (!this.azureUsersService.getIsConfigured()) {
        throw new HttpException(
          {
            success: false,
            error: 'Azure AD B2C is not configured',
            details: 'Please check environment variables: AZURE_AD_B2C_CLIENT_ID, AZURE_AD_B2C_CLIENT_SECRET, AZURE_AD_B2C_TENANT_ID',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      let users;
      if (search) {
        users = await this.azureUsersService.searchUsers(search);
      } else {
        users = await this.azureUsersService.getAllUsers();
      }

      return {
        success: true,
        users: users,
        count: users.length,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Failed to fetch users from Azure AD B2C',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

