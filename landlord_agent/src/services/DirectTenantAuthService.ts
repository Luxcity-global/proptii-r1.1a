// Direct service to access tenant authentication data
// This service opens a new window to the tenant application and extracts auth data

interface DirectTenantUser {
  name: string;
  email: string;
  id: string;
}

class DirectTenantAuthService {
  private static instance: DirectTenantAuthService;
  private readonly TENANT_PORTS = ['5173', '3000', '3001', '5174', '5175']; // Possible tenant ports
  
  private constructor() {}

  public static getInstance(): DirectTenantAuthService {
    if (!DirectTenantAuthService.instance) {
      DirectTenantAuthService.instance = new DirectTenantAuthService();
    }
    return DirectTenantAuthService.instance;
  }

  public async getTenantAuthData(): Promise<DirectTenantUser | null> {
    try {
      console.log('Attempting to get tenant auth data...');
      
      // Try to find the tenant application by checking different ports
      for (const port of this.TENANT_PORTS) {
        try {
          const tenantUrl = `http://localhost:${port}`;
          console.log(`Trying tenant URL: ${tenantUrl}`);
          
          // Open a new window to the tenant application
          const tenantWindow = window.open(tenantUrl, '_blank', 'width=1,height=1,left=-1000,top=-1000');
          
          if (tenantWindow) {
            // Wait for the window to load
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            try {
              // Try to access the tenant window's localStorage
              const tenantStorage = tenantWindow.localStorage;
              
              // Check for MSAL account data
              const accountKeys = tenantStorage.getItem('msal.account.keys');
              if (accountKeys) {
                const keys = JSON.parse(accountKeys);
                console.log('Found MSAL account keys in tenant:', keys);
                
                if (keys && keys.length > 0) {
                  const accountKey = keys[0];
                  const accountData = tenantStorage.getItem(accountKey);
                  
                  if (accountData) {
                    const account = JSON.parse(accountData);
                    console.log('Found MSAL account data in tenant:', account);
                    
                    if (account && account.name && account.username) {
                      const user: DirectTenantUser = {
                        name: account.name,
                        email: account.username,
                        id: account.localAccountId || account.homeAccountId || ''
                      };
                      
                      // Store in our localStorage
                      localStorage.setItem('direct_tenant_auth', JSON.stringify(user));
                      window.dispatchEvent(new CustomEvent('direct-tenant-auth-changed', { detail: user }));
                      
                      // Close the tenant window
                      tenantWindow.close();
                      
                      return user;
                    }
                  }
                }
              }
              
              // Check for other MSAL keys
              const allKeys = Object.keys(tenantStorage);
              const msalKeys = allKeys.filter(key => key.startsWith('msal.'));
              
              console.log('MSAL keys found in tenant:', msalKeys);
              
              for (const key of msalKeys) {
                const data = tenantStorage.getItem(key);
                if (data) {
                  try {
                    const parsed = JSON.parse(data);
                    console.log(`MSAL key ${key} in tenant:`, parsed);
                    
                    if (parsed && typeof parsed === 'object') {
                      if (parsed.name && parsed.username) {
                        const user: DirectTenantUser = {
                          name: parsed.name,
                          email: parsed.username,
                          id: parsed.localAccountId || parsed.homeAccountId || ''
                        };
                        
                        localStorage.setItem('direct_tenant_auth', JSON.stringify(user));
                        window.dispatchEvent(new CustomEvent('direct-tenant-auth-changed', { detail: user }));
                        
                        tenantWindow.close();
                        return user;
                      }
                    }
                  } catch (e) {
                    console.log(`Could not parse MSAL key ${key} in tenant:`, e);
                  }
                }
              }
              
              tenantWindow.close();
            } catch (error) {
              console.log(`Could not access tenant window on port ${port}:`, error);
              tenantWindow.close();
            }
          }
        } catch (error) {
          console.log(`Error trying port ${port}:`, error);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting tenant auth data:', error);
      return null;
    }
  }

  public getStoredAuth(): DirectTenantUser | null {
    try {
      const stored = localStorage.getItem('direct_tenant_auth');
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Error getting stored auth:', error);
      return null;
    }
  }

  public clearStoredAuth(): void {
    localStorage.removeItem('direct_tenant_auth');
    window.dispatchEvent(new CustomEvent('direct-tenant-auth-changed', { detail: null }));
  }
}

export const directTenantAuthService = DirectTenantAuthService.getInstance();
