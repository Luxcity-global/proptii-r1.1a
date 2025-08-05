import { AccountInfo } from '@azure/msal-browser';

interface GraphUser {
  id: string;
  displayName: string;
  givenName: string;
  surname: string;
  userPrincipalName: string;
  mail: string;
  otherMails?: string[];
}

class GraphService {
  private static instance: GraphService;

  private constructor() {}

  public static getInstance(): GraphService {
    if (!GraphService.instance) {
      GraphService.instance = new GraphService();
    }
    return GraphService.instance;
  }

  /**
   * Get user details from Microsoft Graph API
   * This is used as a fallback when B2C token claims don't include email
   */
  async getUserDetails(instance: any, account: AccountInfo): Promise<GraphUser | null> {
    try {
      console.log('GraphService - Getting user details from Microsoft Graph API...');
      console.log('GraphService - Account:', account);

      // Request token for Microsoft Graph
      const graphToken = await instance.acquireTokenSilent({
        scopes: ['https://graph.microsoft.com/User.ReadBasic.All'],
        account: account
      });

      console.log('GraphService - Graph token acquired:', !!graphToken.accessToken);

      if (!graphToken.accessToken) {
        console.log('GraphService - No access token received');
        return null;
      }

      // Call Microsoft Graph API to get user details
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${graphToken.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('GraphService - Graph API response status:', response.status);

      if (!response.ok) {
        console.error('GraphService - Graph API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('GraphService - Error details:', errorText);
        return null;
      }

      const userData: GraphUser = await response.json();
      console.log('GraphService - User data from Graph API:', userData);

      return userData;
    } catch (error) {
      console.error('GraphService - Error getting user details from Graph API:', error);
      console.error('GraphService - Error details:', {
        name: (error as any).name,
        message: (error as any).message,
        stack: (error as any).stack
      });
      return null;
    }
  }

  /**
   * Get user details by user ID (for application permissions)
   */
  async getUserById(instance: any, account: AccountInfo, userId: string): Promise<GraphUser | null> {
    try {
      console.log('GraphService - Getting user details by ID from Microsoft Graph API...');
      console.log('GraphService - User ID:', userId);

      // Request token for Microsoft Graph with application permissions
      const graphToken = await instance.acquireTokenSilent({
        scopes: ['https://graph.microsoft.com/User.ReadBasic.All'],
        account: account
      });

      console.log('GraphService - Graph token acquired:', !!graphToken.accessToken);

      if (!graphToken.accessToken) {
        console.log('GraphService - No access token received');
        return null;
      }

      // Call Microsoft Graph API to get user details by ID
      const response = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${graphToken.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('GraphService - Graph API response status:', response.status);

      if (!response.ok) {
        console.error('GraphService - Graph API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('GraphService - Error details:', errorText);
        return null;
      }

      const userData: GraphUser = await response.json();
      console.log('GraphService - User data from Graph API:', userData);

      return userData;
    } catch (error) {
      console.error('GraphService - Error getting user details by ID from Graph API:', error);
      console.error('GraphService - Error details:', {
        name: (error as any).name,
        message: (error as any).message,
        stack: (error as any).stack
      });
      return null;
    }
  }
}

export default GraphService; 