// Simple test authentication service for development
// This allows us to set a user name manually for testing

interface TestUser {
  name: string;
  email: string;
}

class TestAuthService {
  private static instance: TestAuthService;
  private currentUser: TestUser | null = null;

  private constructor() {}

  public static getInstance(): TestAuthService {
    if (!TestAuthService.instance) {
      TestAuthService.instance = new TestAuthService();
    }
    return TestAuthService.instance;
  }

  public setUser(user: TestUser): void {
    this.currentUser = user;
    // Store in localStorage for persistence
    localStorage.setItem('test_auth_user', JSON.stringify(user));
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('test-auth-changed', { detail: user }));
  }

  public getUser(): TestUser | null {
    if (this.currentUser) {
      return this.currentUser;
    }
    
    // Try to get from localStorage
    const stored = localStorage.getItem('test_auth_user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      } catch (e) {
        console.error('Error parsing stored test user:', e);
      }
    }
    
    return null;
  }

  public clearUser(): void {
    this.currentUser = null;
    localStorage.removeItem('test_auth_user');
    window.dispatchEvent(new CustomEvent('test-auth-changed', { detail: null }));
  }
}

export const testAuthService = TestAuthService.getInstance();
