import { CosmosDBService, CosmosConfig } from './CosmosDBService';

export interface User {
  id: string;
  email: string;
  givenName?: string;
  familyName?: string;
  name?: string;
  phoneNumber?: string;
  role: 'tenant' | 'agent' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin: string;
  preferences: {
    savedProperties: string[];
    searchHistory: {
      query: string;
      timestamp: string;
      filters?: Record<string, any>;
    }[];
  };
  metadata: {
    lastUpdated: string;
    version: number;
  };
}

export class UserService extends CosmosDBService {
  constructor(config: CosmosConfig) {
    super(config);
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'metadata'>): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: now,
      lastLogin: now,
      metadata: {
        lastUpdated: now,
        version: 1
      }
    };

    return this.create(this.getUsersContainer(), user);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.read<User>(this.getUsersContainer(), id, id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const query = "SELECT * FROM c WHERE c.email = @email";
    const parameters = [{ name: "@email", value: email }];
    
    const users = await this.query<User>(
      this.getUsersContainer(),
      query,
      parameters
    );
    
    return users[0];
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'metadata'>>): Promise<User> {
    const now = new Date().toISOString();
    const user = await this.getUserById(id);
    
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    const updatedUser: User = {
      ...user,
      ...updates,
      metadata: {
        lastUpdated: now,
        version: user.metadata.version + 1
      }
    };

    return this.update<User>(this.getUsersContainer(), id, id, updatedUser);
  }

  async deleteUser(id: string): Promise<void> {
    return this.delete(this.getUsersContainer(), id, id);
  }

  async getUsersByRole(role: User['role']): Promise<User[]> {
    const query = "SELECT * FROM c WHERE c.role = @role";
    const parameters = [{ name: "@role", value: role }];
    
    return this.query<User>(
      this.getUsersContainer(),
      query,
      parameters
    );
  }

  async updateUserPreferences(
    id: string,
    savedProperties?: string[],
    searchHistory?: User['preferences']['searchHistory']
  ): Promise<User> {
    const user = await this.getUserById(id);
    
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    const updates: Partial<User> = {
      preferences: {
        savedProperties: savedProperties ?? user.preferences.savedProperties,
        searchHistory: searchHistory ?? user.preferences.searchHistory
      }
    };

    return this.updateUser(id, updates);
  }

  async addSearchHistory(
    id: string,
    query: string,
    filters?: Record<string, any>
  ): Promise<User> {
    const user = await this.getUserById(id);
    
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    const searchEntry = {
      query,
      timestamp: new Date().toISOString(),
      filters
    };

    const searchHistory = [
      searchEntry,
      ...user.preferences.searchHistory.slice(0, 9) // Keep last 10 searches
    ];

    return this.updateUserPreferences(id, undefined, searchHistory);
  }
} 