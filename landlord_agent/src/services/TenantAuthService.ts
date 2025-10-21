// Service to access tenant authentication data from MSAL
// This service reads the actual MSAL data stored by the tenant application

interface TenantUser {
  name: string;
  email: string;
  id: string;
}

class TenantAuthService {
  private static instance: TenantAuthService;
  private readonly MSAL_ACCOUNT_KEY = 'msal.account.keys';
  private readonly MSAL_ACCESS_TOKEN_KEY = 'msal.access_token';
  private readonly MSAL_ID_TOKEN_KEY = 'msal.id_token';

  private constructor() {}

  public static getInstance(): TenantAuthService {
    if (!TenantAuthService.instance) {
      TenantAuthService.instance = new TenantAuthService();
    }
    return TenantAuthService.instance;
  }

  public getTenantUser(): TenantUser | null {
    try {
      // Check for MSAL account data
      const accountKeys = localStorage.getItem(this.MSAL_ACCOUNT_KEY);
      if (accountKeys) {
        const keys = JSON.parse(accountKeys);
        console.log('MSAL account keys found:', keys);
        
        // Look for the first account
        if (keys && keys.length > 0) {
          const accountKey = keys[0];
          const accountData = localStorage.getItem(accountKey);
          
          if (accountData) {
            const account = JSON.parse(accountData);
            console.log('MSAL account data:', account);
            
            if (account && account.name && account.username) {
              return {
                name: account.name,
                email: account.username,
                id: account.localAccountId || account.homeAccountId || ''
              };
            }
          }
        }
      }

      // Check for other possible MSAL storage keys
      const allKeys = Object.keys(localStorage);
      const msalKeys = allKeys.filter(key => key.startsWith('msal.'));
      
      console.log('All MSAL keys found:', msalKeys);
      
      for (const key of msalKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            console.log(`MSAL key ${key}:`, parsed);
            
            // Look for account information in the data
            if (parsed && typeof parsed === 'object') {
              // Check if this is account data
              if (parsed.name && parsed.username) {
                return {
                  name: parsed.name,
                  email: parsed.username,
                  id: parsed.localAccountId || parsed.homeAccountId || ''
                };
              }
              
              // Check if this contains account data in a nested structure
              if (parsed.account && parsed.account.name && parsed.account.username) {
                return {
                  name: parsed.account.name,
                  email: parsed.account.username,
                  id: parsed.account.localAccountId || parsed.account.homeAccountId || ''
                };
              }
            }
          } catch (e) {
            console.log(`Could not parse MSAL key ${key}:`, e);
          }
        }
      }

      // Check for any stored user data that might be from the tenant app
      const userKeys = ['user', 'auth_user', 'tenant_user', 'current_user'];
      for (const key of userKeys) {
        const userData = localStorage.getItem(key);
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user && user.name) {
              console.log(`Found user data in ${key}:`, user);
              return {
                name: user.name,
                email: user.email || user.username || '',
                id: user.id || user.localAccountId || user.homeAccountId || ''
              };
            }
          } catch (e) {
            console.log(`Could not parse user data from ${key}:`, e);
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting tenant user:', error);
      return null;
    }
  }

  public isTenantAuthenticated(): boolean {
    const user = this.getTenantUser();
    return user !== null;
  }

  public clearTenantData(): void {
    // Clear MSAL data
    const allKeys = Object.keys(localStorage);
    const msalKeys = allKeys.filter(key => key.startsWith('msal.'));
    
    msalKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear other user data
    const userKeys = ['user', 'auth_user', 'tenant_user', 'current_user'];
    userKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

export const tenantAuthService = TenantAuthService.getInstance();
