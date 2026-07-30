import axios, { AxiosInstance } from 'axios';
import { getMsalInstance } from '../contexts/AuthContext';
import { PRIMARY_API_BASE_URL } from '../utils/apiEndpoints';

const API_BASE_URL = PRIMARY_API_BASE_URL;

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserServiceResponse {
  success: boolean;
  users?: User[];
  user?: User;
  error?: string;
}

class UserService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });

    // Request interceptor for adding auth token
    this.api.interceptors.request.use(
      async (config) => {
        // Try to get token from MSAL first
        const msalInstance = getMsalInstance();
        if (msalInstance) {
          try {
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length > 0) {
              const silentRequest = {
                scopes: ['openid', 'profile', 'email'],
                account: accounts[0]
              };
              
              const response = await msalInstance.acquireTokenSilent(silentRequest);
              if (response && response.accessToken && config.headers) {
                config.headers.Authorization = `Bearer ${response.accessToken}`;
                return config;
              }
            }
          } catch (error) {
            console.error('Error getting token from MSAL:', error);
          }
        }
        
        // Fallback to localStorage token if MSAL fails
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Get all users from the authentication table
   */
  async getAllUsers(): Promise<UserServiceResponse> {
    try {
      console.log('🔄 UserService - Fetching all users from API...');
      
      const response = await this.api.get('/users');
      
      if (response.status === 200) {
        const users = response.data as User[];
        console.log('✅ UserService - Successfully loaded users:', users.length);
        
        return {
          success: true,
          users: users
        };
      } else {
        console.error('❌ UserService - API returned non-200 status:', response.status);
        return {
          success: false,
          error: `API returned status ${response.status}`
        };
      }
    } catch (error) {
      console.error('❌ UserService - Error fetching users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get a specific user by ID
   */
  async getUserById(userId: string): Promise<UserServiceResponse> {
    try {
      console.log('🔄 UserService - Fetching user by ID:', userId);
      
      const response = await this.api.get(`/users/${userId}`);
      
      if (response.status === 200) {
        const user = response.data as User;
        console.log('✅ UserService - Successfully loaded user:', user.name);
        
        return {
          success: true,
          user: user
        };
      } else if (response.status === 404) {
        console.log('⚠️ UserService - User not found:', userId);
        return {
          success: false,
          error: 'User not found'
        };
      } else {
        console.error('❌ UserService - API returned non-200 status:', response.status);
        return {
          success: false,
          error: `API returned status ${response.status}`
        };
      }
    } catch (error) {
      console.error('❌ UserService - Error fetching user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get a user by email address
   */
  async getUserByEmail(email: string): Promise<UserServiceResponse> {
    try {
      console.log('🔄 UserService - Searching for user by email:', email);
      
      // First get all users, then filter by email
      // This is not optimal but works with the current API structure
      const allUsersResponse = await this.getAllUsers();
      
      if (allUsersResponse.success && allUsersResponse.users) {
        const user = allUsersResponse.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
          console.log('✅ UserService - Found user by email:', user.name);
          return {
            success: true,
            user: user
          };
        } else {
          console.log('⚠️ UserService - No user found with email:', email);
          return {
            success: false,
            error: 'User not found'
          };
        }
      } else {
        return {
          success: false,
          error: allUsersResponse.error || 'Failed to fetch users'
        };
      }
    } catch (error) {
      console.error('❌ UserService - Error searching user by email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserServiceResponse> {
    try {
      console.log('🔄 UserService - Creating new user:', userData.email);
      
      const response = await this.api.post('/users', userData);
      
      if (response.status === 201) {
        const user = response.data as User;
        console.log('✅ UserService - Successfully created user:', user.name);
        
        return {
          success: true,
          user: user
        };
      } else {
        console.error('❌ UserService - API returned non-201 status:', response.status);
        return {
          success: false,
          error: `API returned status ${response.status}`
        };
      }
    } catch (error) {
      console.error('❌ UserService - Error creating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update an existing user
   */
  async updateUser(userId: string, userData: Partial<User>): Promise<UserServiceResponse> {
    try {
      console.log('🔄 UserService - Updating user:', userId);
      
      const response = await this.api.put(`/users/${userId}`, userData);
      
      if (response.status === 200) {
        const user = response.data as User;
        console.log('✅ UserService - Successfully updated user:', user.name);
        
        return {
          success: true,
          user: user
        };
      } else {
        console.error('❌ UserService - API returned non-200 status:', response.status);
        return {
          success: false,
          error: `API returned status ${response.status}`
        };
      }
    } catch (error) {
      console.error('❌ UserService - Error updating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<UserServiceResponse> {
    try {
      console.log('🔄 UserService - Deleting user:', userId);
      
      const response = await this.api.delete(`/users/${userId}`);
      
      if (response.status === 204) {
        console.log('✅ UserService - Successfully deleted user:', userId);
        
        return {
          success: true
        };
      } else {
        console.error('❌ UserService - API returned non-204 status:', response.status);
        return {
          success: false,
          error: `API returned status ${response.status}`
        };
      }
    } catch (error) {
      console.error('❌ UserService - Error deleting user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export singleton instance
export default new UserService();
