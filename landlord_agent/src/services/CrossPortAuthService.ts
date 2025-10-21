// Service to access authentication data across different ports
// This service can communicate with the tenant application running on a different port

interface CrossPortUser {
  name: string;
  email: string;
  id: string;
}

class CrossPortAuthService {
  private static instance: CrossPortAuthService;
  private readonly TENANT_PORTS = ['5173', '3000', '3001', '5174', '5175']; // Possible tenant ports
  private readonly LANDLORD_PORT = '3002'; // Current landlord port
  
  private constructor() {
    this.setupMessageListener();
  }

  public static getInstance(): CrossPortAuthService {
    if (!CrossPortAuthService.instance) {
      CrossPortAuthService.instance = new CrossPortAuthService();
    }
    return CrossPortAuthService.instance;
  }

  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      // Accept messages from any localhost origin (tenant application)
      if (event.origin.startsWith('http://localhost:') && event.data.type === 'AUTH_DATA') {
        console.log('Received auth data from tenant:', event.data.payload);
        // Store the received auth data
        if (event.data.payload) {
          localStorage.setItem('cross_port_auth', JSON.stringify(event.data.payload));
          window.dispatchEvent(new CustomEvent('cross-port-auth-changed', { 
            detail: event.data.payload 
          }));
        }
      }
    });
  }

  public async requestAuthFromTenant(): Promise<CrossPortUser | null> {
    try {
      console.log('Requesting auth data from tenant application...');
      
      // Create a hidden iframe to communicate with tenant app
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = `${this.TENANT_URL}/auth-bridge.html`;
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('Timeout waiting for tenant auth data');
          document.body.removeChild(iframe);
          resolve(null);
        }, 5000);

        iframe.onload = () => {
          console.log('Iframe loaded, requesting auth data...');
          iframe.contentWindow?.postMessage({
            type: 'REQUEST_AUTH_DATA'
          }, this.TENANT_URL);
        };

        // Listen for response
        const handleResponse = (event: MessageEvent) => {
          if (event.origin === this.TENANT_URL && event.data.type === 'AUTH_DATA_RESPONSE') {
            clearTimeout(timeout);
            document.body.removeChild(iframe);
            window.removeEventListener('message', handleResponse);
            
            if (event.data.payload) {
              localStorage.setItem('cross_port_auth', JSON.stringify(event.data.payload));
              window.dispatchEvent(new CustomEvent('cross-port-auth-changed', { 
                detail: event.data.payload 
              }));
              resolve(event.data.payload);
            } else {
              resolve(null);
            }
          }
        };

        window.addEventListener('message', handleResponse);
        document.body.appendChild(iframe);
      });
    } catch (error) {
      console.error('Error requesting auth from tenant:', error);
      return null;
    }
  }

  public getStoredAuth(): CrossPortUser | null {
    try {
      const stored = localStorage.getItem('cross_port_auth');
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
    localStorage.removeItem('cross_port_auth');
    window.dispatchEvent(new CustomEvent('cross-port-auth-changed', { detail: null }));
  }

  public async getCurrentUser(): Promise<CrossPortUser | null> {
    // First check if we have stored data
    const stored = this.getStoredAuth();
    if (stored) {
      console.log('Found stored auth data:', stored);
      return stored;
    }

    // If no stored data, try to request from tenant
    console.log('No stored auth data, requesting from tenant...');
    return await this.requestAuthFromTenant();
  }
}

export const crossPortAuthService = CrossPortAuthService.getInstance();
