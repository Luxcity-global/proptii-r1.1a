import { ConfidentialClientApplication } from '@azure/msal-node';
import fetch from 'node-fetch';

/**
 * Service to interact with Microsoft Graph API to fetch Azure AD B2C users
 */
class AzureGraphService {
  constructor() {
    const clientId = process.env.AZURE_AD_B2C_CLIENT_ID;
    const clientSecret = process.env.AZURE_AD_B2C_CLIENT_SECRET;
    const tenantId = process.env.AZURE_AD_B2C_TENANT_ID;

    // Debug logging
    console.log('🔍 Azure AD B2C Configuration Check:');
    console.log('  CLIENT_ID:', clientId ? `${clientId.substring(0, 8)}...` : 'MISSING');
    console.log('  CLIENT_SECRET:', clientSecret ? '***SET***' : 'MISSING');
    console.log('  TENANT_ID:', tenantId ? `${tenantId.substring(0, 8)}...` : 'MISSING');

    if (!clientId || !clientSecret || !tenantId) {
      console.warn('⚠️ Azure AD B2C configuration missing. Some features may not work.');
      console.warn('   Make sure environment variables are set and server is restarted.');
      this.isConfigured = false;
      return;
    }

    this.isConfigured = true;
    this.msalConfig = {
      auth: {
        clientId: clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientSecret: clientSecret,
      },
    };

    this.clientApp = new ConfidentialClientApplication(this.msalConfig);
    this.graphEndpoint = 'https://graph.microsoft.com/v1.0';
  }

  /**
   * Get access token using client credentials flow
   */
  async getAccessToken() {
    if (!this.isConfigured) {
      throw new Error('Azure AD B2C is not configured');
    }

    try {
      console.log('🔑 Attempting to acquire access token...');
      console.log('   Authority:', this.msalConfig.auth.authority);
      console.log('   Client ID:', this.msalConfig.auth.clientId.substring(0, 8) + '...');
      
      const clientCredentialRequest = {
        scopes: ['https://graph.microsoft.com/.default'],
      };

      const response = await this.clientApp.acquireTokenByClientCredential(clientCredentialRequest);
      console.log('✅ Successfully acquired access token');
      return response.accessToken;
    } catch (error) {
      console.error('❌ Error acquiring token:', error);
      console.error('   Error code:', error.errorCode);
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
      throw new Error(`Failed to acquire access token: ${error.message || error.errorCode || 'Unknown error'}`);
    }
  }

  /**
   * Fetch all users from Azure AD B2C
   */
  async getAllUsers() {
    if (!this.isConfigured) {
      throw new Error('Azure AD B2C is not configured');
    }

    try {
      const accessToken = await this.getAccessToken();
      const users = [];
      let nextLink = `${this.graphEndpoint}/users?$select=id,displayName,mail,userPrincipalName,givenName,surname,mobilePhone,createdDateTime`;

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
          console.error(`❌ Microsoft Graph API error: ${response.status}`);
          console.error('   Response:', errorText);
          throw new Error(`Microsoft Graph API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // Map Azure AD B2C users to our format
        const mappedUsers = (data.value || []).map((user) => ({
          id: user.id,
          name: user.displayName || `${user.givenName || ''} ${user.surname || ''}`.trim() || user.userPrincipalName,
          email: user.mail || user.userPrincipalName,
          phone: user.mobilePhone || '',
          givenName: user.givenName || '',
          surname: user.surname || '',
          createdAt: user.createdDateTime,
          // Azure AD B2C specific fields
          azureObjectId: user.id,
          userPrincipalName: user.userPrincipalName,
        }));

        users.push(...mappedUsers);

        // Check for next page
        nextLink = data['@odata.nextLink'] || null;
      }

      return users;
    } catch (error) {
      console.error('Error fetching users from Azure AD B2C:', error);
      throw error;
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(searchTerm) {
    if (!this.isConfigured) {
      throw new Error('Azure AD B2C is not configured');
    }

    try {
      const accessToken = await this.getAccessToken();
      const encodedSearch = encodeURIComponent(searchTerm);
      const filter = `$filter=startswith(displayName,'${encodedSearch}') or startswith(mail,'${encodedSearch}') or startswith(userPrincipalName,'${encodedSearch}')`;
      const url = `${this.graphEndpoint}/users?$select=id,displayName,mail,userPrincipalName,givenName,surname,mobilePhone,createdDateTime&${filter}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Microsoft Graph API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      return (data.value || []).map((user) => ({
        id: user.id,
        name: user.displayName || `${user.givenName || ''} ${user.surname || ''}`.trim() || user.userPrincipalName,
        email: user.mail || user.userPrincipalName,
        phone: user.mobilePhone || '',
        givenName: user.givenName || '',
        surname: user.surname || '',
        createdAt: user.createdDateTime,
        azureObjectId: user.id,
        userPrincipalName: user.userPrincipalName,
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
}

// Export a function that creates a new instance (allows lazy initialization after env vars are loaded)
export default new AzureGraphService();
export function createAzureGraphService() {
  return new AzureGraphService();
}

