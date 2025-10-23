// Cross-application authentication bridge
// This service allows authentication data to be shared between tenant and landlord applications

interface CrossAppAuthData {
  userId: string;
  userName: string;
  userEmail: string;
  isAuthenticated: boolean;
  timestamp: number;
}

class CrossAppAuthBridge {
  private static instance: CrossAppAuthBridge;
  private readonly STORAGE_KEY = 'cross_app_auth_data';
  private readonly TENANT_ORIGIN = 'http://localhost:5173'; // Tenant app origin
  private readonly LANDLORD_ORIGIN = 'http://localhost:3000'; // Landlord app origin

  private constructor() {
    this.setupMessageListener();
  }

  public static getInstance(): CrossAppAuthBridge {
    if (!CrossAppAuthBridge.instance) {
      CrossAppAuthBridge.instance = new CrossAppAuthBridge();
    }
    return CrossAppAuthBridge.instance;
  }

  // Setup message listener for cross-origin communication
  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      // Verify origin for security
      if (event.origin !== this.TENANT_ORIGIN && event.origin !== this.LANDLORD_ORIGIN) {
        return;
      }

      if (event.data.type === 'AUTH_STATE_CHANGE') {
        this.handleAuthStateChange(event.data.payload);
      }
    });
  }

  // Handle authentication state changes from other applications
  private handleAuthStateChange(authData: CrossAppAuthData): void {
    // Store authentication data in session storage
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
    
    // Dispatch local auth state change event
    window.dispatchEvent(new CustomEvent('cross-app-auth-changed', {
      detail: authData
    }));
  }

  // Share authentication data with other applications
  public shareAuthData(authData: CrossAppAuthData): void {
    // Store locally
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
    
    // Send to other applications via postMessage
    const targetOrigins = [this.TENANT_ORIGIN, this.LANDLORD_ORIGIN];
    
    targetOrigins.forEach(origin => {
      if (origin !== window.location.origin) {
        // Create a hidden iframe to communicate with other applications
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = `${origin}/auth-bridge.html`;
        
        iframe.onload = () => {
          iframe.contentWindow?.postMessage({
            type: 'AUTH_STATE_CHANGE',
            payload: authData
          }, origin);
          
          // Remove iframe after sending message
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        };
        
        document.body.appendChild(iframe);
      }
    });
  }

  // Get shared authentication data
  public getSharedAuthData(): CrossAppAuthData | null {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const authData = JSON.parse(stored);
        // Check if data is not too old (5 minutes)
        if (Date.now() - authData.timestamp < 5 * 60 * 1000) {
          return authData;
        }
      }
    } catch (error) {
      console.error('Error getting shared auth data:', error);
    }
    return null;
  }

  // Clear shared authentication data
  public clearSharedAuthData(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
    
    // Notify other applications
    this.shareAuthData({
      userId: '',
      userName: '',
      userEmail: '',
      isAuthenticated: false,
      timestamp: Date.now()
    });
  }

  // Check if user is authenticated in any application
  public isAuthenticatedAnywhere(): boolean {
    const authData = this.getSharedAuthData();
    return authData?.isAuthenticated || false;
  }

  // Get current user from any application
  public getCurrentUserFromAnywhere(): { name: string; email: string } | null {
    const authData = this.getSharedAuthData();
    if (authData?.isAuthenticated) {
      return {
        name: authData.userName,
        email: authData.userEmail
      };
    }
    return null;
  }
}

// Export singleton instance
export const crossAppAuthBridge = CrossAppAuthBridge.getInstance();

// Export types
export type { CrossAppAuthData };
