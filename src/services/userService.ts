import apiService from './api';
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

  /**
   * Get all users from the authentication table
   */
  async getAllUsers(): Promise<UserServiceResponse> {
    try {
      console.log('🔄 UserService - Fetching all users from API...');
      
      const response = await apiService.get('/users');
      const users = response.data as User[];
      console.log('✅ UserService - Successfully loaded users:', users.length);
      
      return {
        success: true,
        users: users
      };
    } catch (error: any) {
      console.error('❌ UserService - Error fetching users:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Get a specific user by ID
   */
  async getUserById(userId: string): Promise<UserServiceResponse> {
    try {
      console.log('🔄 UserService - Fetching user by ID:', userId);
      
      const response = await apiService.get(`/users/${userId}`);
      const user = response.data as User;
      console.log('✅ UserService - Successfully loaded user:', user.name);
      
      return {
        success: true,
        user: user
      };
    } catch (error: any) {
      if (error.status === 404) {
        console.log('⚠️ UserService - User not found:', userId);
        return {
          success: false,
          error: 'User not found'
        };
      }
      console.error('❌ UserService - Error fetching user:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
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
    } catch (error: any) {
      console.error('❌ UserService - Error searching user by email:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserServiceResponse> {
    try {
      console.log('🔄 UserService - Creating new user:', userData.email);
      
      const response = await apiService.post('/users', userData);
      const user = response.data as User;
      console.log('✅ UserService - Successfully created user:', user.name);
      
      return {
        success: true,
        user: user
      };
    } catch (error: any) {
      console.error('❌ UserService - Error creating user:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Update an existing user
   */
  async updateUser(userId: string, userData: Partial<User>): Promise<UserServiceResponse> {
    try {
      console.log('🔄 UserService - Updating user:', userId);
      
      const response = await apiService.put(`/users/${userId}`, userData);
      const user = response.data as User;
      console.log('✅ UserService - Successfully updated user:', user.name);
      
      return {
        success: true,
        user: user
      };
    } catch (error: any) {
      console.error('❌ UserService - Error updating user:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<UserServiceResponse> {
    try {
      console.log('🔄 UserService - Deleting user:', userId);
      
      await apiService.delete(`/users/${userId}`);
      console.log('✅ UserService - Successfully deleted user:', userId);
      
      return {
        success: true
      };
    } catch (error: any) {
      console.error('❌ UserService - Error deleting user:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }
}

// Export singleton instance
export default new UserService();
