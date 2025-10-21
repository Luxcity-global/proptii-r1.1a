import { PublicClientApplication, Configuration, PopupRequest } from '@azure/msal-browser';

// Shared authentication configuration
const sharedMsalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '00000000-0000-0000-0000-000000000000',
    authority: import.meta.env.VITE_AZURE_AUTHORITY || 'https://login.microsoftonline.com/common',
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: import.meta.env.VITE_AZURE_POST_LOGOUT_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case 'Error': console.error(message); break;
          case 'Info': console.info(message); break;
          case 'Verbose': console.debug(message); break;
          case 'Warning': console.warn(message); break;
        }
      },
    },
  },
};

// Shared login request configuration
export const sharedLoginRequest: PopupRequest = {
  scopes: ['User.Read'],
  prompt: 'select_account',
};

// Singleton MSAL instance for shared authentication
let sharedMsalInstance: PublicClientApplication | null = null;

export const getSharedMsalInstance = (): PublicClientApplication => {
  if (!sharedMsalInstance) {
    sharedMsalInstance = new PublicClientApplication(sharedMsalConfig);
    sharedMsalInstance.initialize().catch(error => {
      console.error("Error initializing shared MSAL:", error);
    });
  }
  return sharedMsalInstance;
};

// Shared authentication service
export class SharedAuthService {
  private static instance: SharedAuthService;
  private msalInstance: PublicClientApplication;

  private constructor() {
    this.msalInstance = getSharedMsalInstance();
  }

  public static getInstance(): SharedAuthService {
    if (!SharedAuthService.instance) {
      SharedAuthService.instance = new SharedAuthService();
    }
    return SharedAuthService.instance;
  }

  // Get current user from session storage or MSAL
  public async getCurrentUser(): Promise<any> {
    try {
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        const account = accounts[0];
        return {
          id: account.localAccountId || account.homeAccountId,
          name: account.name,
          email: account.username,
          givenName: account.name?.split(' ')[0],
          familyName: account.name?.split(' ').slice(1).join(' '),
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  public async isAuthenticated(): Promise<boolean> {
    try {
      const accounts = this.msalInstance.getAllAccounts();
      return accounts.length > 0;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  // Login method
  public async login(): Promise<any> {
    try {
      const result = await this.msalInstance.loginPopup(sharedLoginRequest);
      return result.account;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout method
  public async logout(): Promise<void> {
    try {
      await this.msalInstance.logoutPopup({
        postLogoutRedirectUri: window.location.origin,
      });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Get access token
  public async getAccessToken(): Promise<string | null> {
    try {
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        const result = await this.msalInstance.acquireTokenSilent({
          ...sharedLoginRequest,
          account: accounts[0],
        });
        return result.accessToken;
      }
      return null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  // Handle redirect promise (for redirect flow)
  public async handleRedirectPromise(): Promise<any> {
    try {
      return await this.msalInstance.handleRedirectPromise();
    } catch (error) {
      console.error('Error handling redirect promise:', error);
      return null;
    }
  }
}

// Export singleton instance
export const sharedAuthService = SharedAuthService.getInstance();
