import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfidentialClientApplication } from '@azure/msal-node';

interface AzureUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  givenName: string;
  surname: string;
  createdAt?: string;
  azureObjectId: string;
  userPrincipalName: string;
}

@Injectable()
export class AzureUsersService {
  private readonly logger = new Logger(AzureUsersService.name);
  private isConfigured: boolean = false;
  private clientApp: ConfidentialClientApplication | null = null;
  private readonly graphEndpoint = 'https://graph.microsoft.com/v1.0';

  constructor(private configService: ConfigService) {
    this.initialize();
  }

  private initialize() {
    const clientId = this.configService.get<string>('AZURE_AD_B2C_CLIENT_ID');
    const clientSecret = this.configService.get<string>('AZURE_AD_B2C_CLIENT_SECRET');
    const tenantId = this.configService.get<string>('AZURE_AD_B2C_TENANT_ID');

    // Debug logging
    this.logger.log('🔍 Azure AD B2C Configuration Check:');
    this.logger.log(`  CLIENT_ID: ${clientId ? `${clientId.substring(0, 8)}...` : 'MISSING'}`);
    this.logger.log(`  CLIENT_SECRET: ${clientSecret ? '***SET***' : 'MISSING'}`);
    this.logger.log(`  TENANT_ID: ${tenantId ? `${tenantId.substring(0, 8)}...` : 'MISSING'}`);

    if (!clientId || !clientSecret || !tenantId) {
      this.logger.warn('⚠️ Azure AD B2C configuration missing. Some features may not work.');
      this.logger.warn('   Make sure environment variables are set and server is restarted.');
      this.isConfigured = false;
      return;
    }

    try {
      const msalConfig = {
        auth: {
          clientId: clientId,
          authority: `https://login.microsoftonline.com/${tenantId}`,
          clientSecret: clientSecret,
        },
      };

      this.clientApp = new ConfidentialClientApplication(msalConfig);
      this.isConfigured = true;
      this.logger.log('✅ Azure AD B2C service initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Azure AD B2C service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Get access token using client credentials flow
   */
  private async getAccessToken(): Promise<string> {
    if (!this.isConfigured || !this.clientApp) {
      throw new Error('Azure AD B2C is not configured');
    }

    try {
      this.logger.log('🔑 Attempting to acquire access token...');
      
      const clientCredentialRequest = {
        scopes: ['https://graph.microsoft.com/.default'],
      };

      const response = await this.clientApp.acquireTokenByClientCredential(clientCredentialRequest);
      this.logger.log('✅ Successfully acquired access token');
      return response.accessToken;
    } catch (error: any) {
      this.logger.error('❌ Error acquiring token:', error);
      this.logger.error(`   Error code: ${error.errorCode || 'N/A'}`);
      this.logger.error(`   Error message: ${error.message || 'Unknown error'}`);
      throw new Error(`Failed to acquire access token: ${error.message || error.errorCode || 'Unknown error'}`);
    }
  }

  /**
   * Fetch all users from Azure AD B2C
   */
  async getAllUsers(): Promise<AzureUser[]> {
    if (!this.isConfigured) {
      throw new Error('Azure AD B2C is not configured');
    }

    try {
      const accessToken = await this.getAccessToken();
      const users: AzureUser[] = [];
      let nextLink: string | null = `${this.graphEndpoint}/users?$select=id,displayName,mail,otherMails,userPrincipalName,givenName,surname,mobilePhone,businessPhones,telephoneNumber,createdDateTime,identities`;

      // Handle pagination
      while (nextLink) {
        const response = await fetch(nextLink, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(`❌ Microsoft Graph API error: ${response.status}`);
          this.logger.error(`   Response: ${errorText}`);
          throw new Error(`Microsoft Graph API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // Map Azure AD B2C users to our format
        const mappedUsers: AzureUser[] = (data.value || []).map((user: any) => {
          // Extract phone number from identities first (for B2C local accounts)
          // Priority: identities[phoneNumber] > mobilePhone > businessPhones[0] > telephoneNumber
          let phone = '';
          
          // Check identities array for phoneNumber signInType (B2C local accounts)
          if (user.identities && Array.isArray(user.identities)) {
            const phoneIdentity = user.identities.find(
              (identity: any) => identity.signInType === 'phoneNumber' && identity.issuerAssignedId
            );
            if (phoneIdentity?.issuerAssignedId) {
              phone = phoneIdentity.issuerAssignedId;
            }
          }
          
          // Fallback to mobilePhone field
          if (!phone) {
            phone = user.mobilePhone || '';
          }
          
          // Fallback to businessPhones
          if (!phone && user.businessPhones && user.businessPhones.length > 0) {
            phone = user.businessPhones[0];
          }
          
          // Last resort: telephoneNumber
          if (!phone && user.telephoneNumber) {
            phone = user.telephoneNumber;
          }
          
          // Extract email from identities first (for B2C local accounts)
          // Priority: identities[emailAddress] > mail > otherMails[0] > UPN (if email-like) > UPN
          let email = '';
          
          // Check identities array for emailAddress signInType (B2C local accounts)
          if (user.identities && Array.isArray(user.identities)) {
            const emailIdentity = user.identities.find(
              (identity: any) => identity.signInType === 'emailAddress' && identity.issuerAssignedId
            );
            if (emailIdentity?.issuerAssignedId) {
              email = emailIdentity.issuerAssignedId;
            }
          }
          
          // Fallback to mail field (for social accounts and Azure AD users)
          if (!email) {
            email = user.mail || '';
          }
          
          // Fallback to otherMails
          if (!email && user.otherMails && user.otherMails.length > 0) {
            email = user.otherMails[0];
          }
          
          // Last resort: use UPN (but skip if it's a GUID-based email)
          if (!email) {
            const upn = user.userPrincipalName || '';
            // Only use UPN if it looks like a real email (not a GUID)
            if (upn && !upn.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}@/i)) {
              email = upn;
            } else if (upn) {
              // If UPN is GUID-based, still use it but log for debugging
              this.logger.warn(`User ${user.id} has GUID-based UPN: ${upn}`);
              email = upn;
            }
          }
          
          return {
            id: user.id,
            name: user.displayName || `${user.givenName || ''} ${user.surname || ''}`.trim() || user.userPrincipalName,
            email: email,
            phone: phone,
            givenName: user.givenName || '',
            surname: user.surname || '',
            createdAt: user.createdDateTime,
            azureObjectId: user.id,
            userPrincipalName: user.userPrincipalName,
          };
        });

        users.push(...mappedUsers);

        // Check for next page
        nextLink = data['@odata.nextLink'] || null;
      }

      this.logger.log(`✅ Successfully fetched ${users.length} users from Azure AD B2C`);
      return users;
    } catch (error) {
      this.logger.error('Error fetching users from Azure AD B2C:', error);
      throw error;
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(searchTerm: string): Promise<AzureUser[]> {
    if (!this.isConfigured) {
      throw new Error('Azure AD B2C is not configured');
    }

    try {
      const accessToken = await this.getAccessToken();
      const encodedSearch = encodeURIComponent(searchTerm);
      const filter = `$filter=startswith(displayName,'${encodedSearch}') or startswith(mail,'${encodedSearch}') or startswith(userPrincipalName,'${encodedSearch}')`;
      const url = `${this.graphEndpoint}/users?$select=id,displayName,mail,otherMails,userPrincipalName,givenName,surname,mobilePhone,businessPhones,telephoneNumber,createdDateTime,identities&${filter}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`❌ Microsoft Graph API error: ${response.status} - ${errorText}`);
        throw new Error(`Microsoft Graph API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      const users: AzureUser[] = (data.value || []).map((user: any) => {
        // Extract phone number from identities first (for B2C local accounts)
        // Priority: identities[phoneNumber] > mobilePhone > businessPhones[0] > telephoneNumber
        let phone = '';
        
        // Check identities array for phoneNumber signInType (B2C local accounts)
        if (user.identities && Array.isArray(user.identities)) {
          const phoneIdentity = user.identities.find(
            (identity: any) => identity.signInType === 'phoneNumber' && identity.issuerAssignedId
          );
          if (phoneIdentity?.issuerAssignedId) {
            phone = phoneIdentity.issuerAssignedId;
          }
        }
        
        // Fallback to mobilePhone field
        if (!phone) {
          phone = user.mobilePhone || '';
        }
        
        // Fallback to businessPhones
        if (!phone && user.businessPhones && user.businessPhones.length > 0) {
          phone = user.businessPhones[0];
        }
        
        // Last resort: telephoneNumber
        if (!phone && user.telephoneNumber) {
          phone = user.telephoneNumber;
        }
        
        // Extract email from identities first (for B2C local accounts)
        // Priority: identities[emailAddress] > mail > otherMails[0] > UPN (if email-like) > UPN
        let email = '';
        
        // Check identities array for emailAddress signInType (B2C local accounts)
        if (user.identities && Array.isArray(user.identities)) {
          const emailIdentity = user.identities.find(
            (identity: any) => identity.signInType === 'emailAddress' && identity.issuerAssignedId
          );
          if (emailIdentity?.issuerAssignedId) {
            email = emailIdentity.issuerAssignedId;
          }
        }
        
        // Fallback to mail field (for social accounts and Azure AD users)
        if (!email) {
          email = user.mail || '';
        }
        
        // Fallback to otherMails
        if (!email && user.otherMails && user.otherMails.length > 0) {
          email = user.otherMails[0];
        }
        
        // Last resort: use UPN (but skip if it's a GUID-based email)
        if (!email) {
          const upn = user.userPrincipalName || '';
          // Only use UPN if it looks like a real email (not a GUID)
          if (upn && !upn.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}@/i)) {
            email = upn;
          } else if (upn) {
            // If UPN is GUID-based, still use it but log for debugging
            this.logger.warn(`User ${user.id} has GUID-based UPN: ${upn}`);
            email = upn;
          }
        }
        
        return {
          id: user.id,
          name: user.displayName || `${user.givenName || ''} ${user.surname || ''}`.trim() || user.userPrincipalName,
          email: email,
          phone: phone,
          givenName: user.givenName || '',
          surname: user.surname || '',
          createdAt: user.createdDateTime,
          azureObjectId: user.id,
          userPrincipalName: user.userPrincipalName,
        };
      });

      this.logger.log(`✅ Successfully searched and found ${users.length} users`);
      return users;
    } catch (error) {
      this.logger.error('Error searching users:', error);
      throw error;
    }
  }

  getIsConfigured(): boolean {
    return this.isConfigured;
  }
}
