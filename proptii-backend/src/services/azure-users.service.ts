import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfidentialClientApplication } from '@azure/msal-node';
import fetch from 'node-fetch';

interface GraphUserIdentity {
  signInType?: string;
  issuer?: string;
  issuerAssignedId?: string;
}

interface GraphUser {
  id: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
  givenName?: string;
  surname?: string;
  mobilePhone?: string;
  createdDateTime?: string;
  identities?: GraphUserIdentity[];
}

export interface AzureDirectoryUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  givenName: string;
  surname: string;
  createdAt?: string;
  azureObjectId: string;
  userPrincipalName?: string;
}

@Injectable()
export class AzureUsersService {
  private readonly logger = new Logger(AzureUsersService.name);
  private readonly graphEndpoint = 'https://graph.microsoft.com/v1.0';
  private readonly clientApp?: ConfidentialClientApplication;
  private readonly configured: boolean;

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get<string>('AZURE_AD_B2C_CLIENT_ID');
    const clientSecret = this.configService.get<string>('AZURE_AD_B2C_CLIENT_SECRET');
    const tenantId = this.configService.get<string>('AZURE_AD_B2C_TENANT_ID');

    this.logger.debug('Azure AD B2C configuration check');
    this.logger.debug(`  CLIENT_ID: ${clientId ? `${clientId.substring(0, 8)}...` : 'MISSING'}`);
    this.logger.debug(`  CLIENT_SECRET: ${clientSecret ? '***SET***' : 'MISSING'}`);
    this.logger.debug(`  TENANT_ID: ${tenantId ? `${tenantId.substring(0, 8)}...` : 'MISSING'}`);

    if (!clientId || !clientSecret || !tenantId) {
      this.logger.warn('Azure AD B2C configuration missing. Azure user lookup will be disabled.');
      this.configured = false;
      return;
    }

    this.configured = true;
    this.clientApp = new ConfidentialClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientSecret,
      },
    });
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async getUsers(search?: string): Promise<AzureDirectoryUser[]> {
    if (!this.isConfigured()) {
      throw new InternalServerErrorException('Azure AD B2C is not configured');
    }

    return search ? this.searchUsers(search) : this.getAllUsers();
  }

  private async getAllUsers(): Promise<AzureDirectoryUser[]> {
    const accessToken = await this.getAccessToken();
    const users: AzureDirectoryUser[] = [];
    let nextLink = `${this.graphEndpoint}/users?$select=id,displayName,mail,userPrincipalName,givenName,surname,mobilePhone,createdDateTime,identities`;

    while (nextLink) {
      const data = await this.fetchGraphData(nextLink, accessToken);
      const mapped = (data.value as GraphUser[] | undefined)?.map((user) => this.mapUser(user)) ?? [];
      users.push(...mapped);
      nextLink = (data['@odata.nextLink'] as string) || '';
    }

    return users;
  }

  private async searchUsers(searchTerm: string): Promise<AzureDirectoryUser[]> {
    const accessToken = await this.getAccessToken();
    const sanitized = encodeURIComponent(searchTerm.replace(/'/g, "''"));
    const filter = `$filter=startswith(displayName,'${sanitized}') or startswith(mail,'${sanitized}') or startswith(userPrincipalName,'${sanitized}')`;
    const url = `${this.graphEndpoint}/users?$select=id,displayName,mail,userPrincipalName,givenName,surname,mobilePhone,createdDateTime,identities&${filter}`;
    const data = await this.fetchGraphData(url, accessToken);
    return (data.value as GraphUser[] | undefined)?.map((user) => this.mapUser(user)) ?? [];
  }

  private async getAccessToken(): Promise<string> {
    if (!this.clientApp) {
      throw new InternalServerErrorException('Azure AD B2C client is not initialized');
    }

    try {
      this.logger.log('Attempting to acquire Microsoft Graph access token...');
      const response = await this.clientApp.acquireTokenByClientCredential({
        scopes: ['https://graph.microsoft.com/.default'],
      });

      if (!response?.accessToken) {
        throw new Error('Access token not returned by Microsoft identity platform');
      }

      this.logger.log('Successfully acquired Microsoft Graph access token');
      return response.accessToken;
    } catch (error) {
      this.logger.error('Failed to acquire access token', error instanceof Error ? error.stack : '');
      throw new InternalServerErrorException(
        `Failed to acquire access token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async fetchGraphData(url: string, accessToken: string): Promise<any> {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Microsoft Graph API error ${response.status}: ${errorText}`);
      throw new InternalServerErrorException(`Microsoft Graph API error ${response.status}`);
    }

    return response.json();
  }

  private mapUser(user: GraphUser): AzureDirectoryUser {
    const name =
      user.displayName ||
      `${user.givenName ?? ''} ${user.surname ?? ''}`.trim() ||
      user.userPrincipalName ||
      'Unknown user';

    // Extract email from identities first (for B2C local accounts)
    // Then fall back to mail, then userPrincipalName
    let email = '';
    if (user.identities && Array.isArray(user.identities)) {
      const emailIdentity = user.identities.find(
        (identity) => identity.signInType === 'emailAddress' && identity.issuerAssignedId
      );
      if (emailIdentity?.issuerAssignedId) {
        email = emailIdentity.issuerAssignedId;
      }
    }
    
    // Fallback to mail or userPrincipalName if no email found in identities
    if (!email) {
      email = user.mail || user.userPrincipalName || '';
    }

    return {
      id: user.id,
      name,
      email,
      phone: user.mobilePhone || '',
      givenName: user.givenName || '',
      surname: user.surname || '',
      createdAt: user.createdDateTime,
      azureObjectId: user.id,
      userPrincipalName: user.userPrincipalName,
    };
  }
}


