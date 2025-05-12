import { CosmosDBService, CosmosConfig } from './CosmosDBService';

export interface DashboardItem {
  id: string;
  userId: string;
  type: 'property' | 'viewing' | 'contract' | 'notification' | 'task';
  status: 'active' | 'completed' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  data: {
    title: string;
    description?: string;
    dueDate?: string;
    completedDate?: string;
    relatedIds?: {
      propertyId?: string;
      viewingId?: string;
      contractId?: string;
    };
    customFields?: Record<string, any>;
  };
  notifications: {
    id: string;
    type: 'reminder' | 'alert' | 'update';
    message: string;
    timestamp: string;
    read: boolean;
    action?: {
      type: string;
      url?: string;
      data?: Record<string, any>;
    };
  }[];
  analytics?: {
    viewCount?: number;
    responseTime?: number;
    conversionRate?: number;
    customMetrics?: Record<string, number>;
  };
  metadata: {
    createdAt: string;
    lastUpdated: string;
    version: number;
    tags?: string[];
  };
}

export class DashboardService extends CosmosDBService {
  constructor(config: CosmosConfig) {
    super(config);
  }

  async createDashboardItem(itemData: Omit<DashboardItem, 'id' | 'metadata'>): Promise<DashboardItem> {
    const now = new Date().toISOString();
    const item: DashboardItem = {
      ...itemData,
      id: crypto.randomUUID(),
      metadata: {
        createdAt: now,
        lastUpdated: now,
        version: 1
      }
    };

    return this.create(this.getDashboardContainer(), item);
  }

  async getDashboardItemById(id: string, userId: string): Promise<DashboardItem | undefined> {
    return this.read<DashboardItem>(this.getDashboardContainer(), id, userId);
  }

  async updateDashboardItem(
    id: string,
    userId: string,
    updates: Partial<Omit<DashboardItem, 'id' | 'metadata'>>
  ): Promise<DashboardItem> {
    const now = new Date().toISOString();
    const item = await this.getDashboardItemById(id, userId);
    
    if (!item) {
      throw new Error(`Dashboard item with id ${id} not found`);
    }

    const updatedItem: DashboardItem = {
      ...item,
      ...updates,
      metadata: {
        ...item.metadata,
        lastUpdated: now,
        version: item.metadata.version + 1
      }
    };

    return this.update<DashboardItem>(
      this.getDashboardContainer(),
      id,
      userId,
      updatedItem
    );
  }

  async deleteDashboardItem(id: string, userId: string): Promise<void> {
    return this.delete(this.getDashboardContainer(), id, userId);
  }

  async getUserDashboard(
    userId: string,
    filters?: {
      type?: DashboardItem['type'][];
      status?: DashboardItem['status'];
      priority?: DashboardItem['priority'];
      tags?: string[];
    }
  ): Promise<DashboardItem[]> {
    let query = "SELECT * FROM c WHERE c.userId = @userId";
    const parameters: { name: string; value: any }[] = [
      { name: "@userId", value: userId }
    ];

    if (filters?.type?.length) {
      query += " AND c.type IN (@types)";
      parameters.push({ name: "@types", value: filters.type });
    }

    if (filters?.status) {
      query += " AND c.status = @status";
      parameters.push({ name: "@status", value: filters.status });
    }

    if (filters?.priority) {
      query += " AND c.priority = @priority";
      parameters.push({ name: "@priority", value: filters.priority });
    }

    if (filters?.tags?.length) {
      query += " AND ARRAY_CONTAINS(c.metadata.tags, @tag)";
      parameters.push({ name: "@tag", value: filters.tags[0] }); // Simple tag filter
    }

    return this.query<DashboardItem>(
      this.getDashboardContainer(),
      query,
      parameters
    );
  }

  async addNotification(
    id: string,
    userId: string,
    notification: Omit<DashboardItem['notifications'][0], 'id' | 'timestamp' | 'read'>
  ): Promise<DashboardItem> {
    const item = await this.getDashboardItemById(id, userId);
    
    if (!item) {
      throw new Error(`Dashboard item with id ${id} not found`);
    }

    const newNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false
    };

    const updates: Partial<DashboardItem> = {
      notifications: [...(item.notifications || []), newNotification]
    };

    return this.updateDashboardItem(id, userId, updates);
  }

  async markNotificationAsRead(
    itemId: string,
    userId: string,
    notificationId: string
  ): Promise<DashboardItem> {
    const item = await this.getDashboardItemById(itemId, userId);
    
    if (!item) {
      throw new Error(`Dashboard item with id ${itemId} not found`);
    }

    const notifications = item.notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );

    return this.updateDashboardItem(itemId, userId, { notifications });
  }

  async updateAnalytics(
    id: string,
    userId: string,
    analytics: Partial<DashboardItem['analytics']>
  ): Promise<DashboardItem> {
    const item = await this.getDashboardItemById(id, userId);
    
    if (!item) {
      throw new Error(`Dashboard item with id ${id} not found`);
    }

    const updates: Partial<DashboardItem> = {
      analytics: {
        ...item.analytics,
        ...analytics
      }
    };

    return this.updateDashboardItem(id, userId, updates);
  }

  async addTag(
    id: string,
    userId: string,
    tag: string
  ): Promise<DashboardItem> {
    const item = await this.getDashboardItemById(id, userId);
    
    if (!item) {
      throw new Error(`Dashboard item with id ${id} not found`);
    }

    const tags = new Set([...(item.metadata.tags || []), tag]);

    return this.updateDashboardItem(id, userId, {
      metadata: {
        ...item.metadata,
        tags: Array.from(tags)
      }
    } as any);
  }
} 