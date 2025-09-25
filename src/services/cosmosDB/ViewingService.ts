import { CosmosDBService, CosmosConfig } from './CosmosDBService';

export interface Viewing {
  id: string;
  propertyId: string;
  userId: string;
  agentId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  schedule: {
    preferredDate: string;
    preferredTime: string;
    alternateDate?: string;
    alternateTime?: string;
    confirmedDateTime?: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
    preferredContactMethod: 'email' | 'phone' | 'sms';
  };
  notes: {
    userNotes?: string;
    agentNotes?: string;
    internalNotes?: string;
  };
  metadata: {
    createdAt: string;
    lastUpdated: string;
    version: number;
    followUpDate?: string;
    reminderSent: boolean;
  };
}

export class ViewingService extends CosmosDBService {
  constructor(config: CosmosConfig) {
    super(config);
  }

  async createViewing(viewingData: Omit<Viewing, 'id' | 'metadata'>): Promise<Viewing> {
    const now = new Date().toISOString();
    const viewing: Viewing = {
      ...viewingData,
      id: crypto.randomUUID(),
      metadata: {
        createdAt: now,
        lastUpdated: now,
        version: 1,
        reminderSent: false
      }
    };

    return this.create(this.getViewingsContainer(), viewing);
  }

  async getViewingById(id: string, propertyId: string): Promise<Viewing | undefined> {
    return this.read<Viewing>(this.getViewingsContainer(), id, propertyId);
  }

  async updateViewing(
    id: string,
    propertyId: string,
    updates: Partial<Omit<Viewing, 'id' | 'metadata'>>
  ): Promise<Viewing> {
    const now = new Date().toISOString();
    const viewing = await this.getViewingById(id, propertyId);
    
    if (!viewing) {
      throw new Error(`Viewing with id ${id} not found`);
    }

    const updatedViewing: Viewing = {
      ...viewing,
      ...updates,
      metadata: {
        ...viewing.metadata,
        lastUpdated: now,
        version: viewing.metadata.version + 1
      }
    };

    return this.update<Viewing>(
      this.getViewingsContainer(),
      id,
      propertyId,
      updatedViewing
    );
  }

  async deleteViewing(id: string, propertyId: string): Promise<void> {
    return this.delete(this.getViewingsContainer(), id, propertyId);
  }

  async getViewingsForProperty(propertyId: string): Promise<Viewing[]> {
    const query = "SELECT * FROM c WHERE c.propertyId = @propertyId";
    const parameters = [{ name: "@propertyId", value: propertyId }];
    
    return this.query<Viewing>(
      this.getViewingsContainer(),
      query,
      parameters
    );
  }

  async getViewingsForUser(userId: string): Promise<Viewing[]> {
    const query = "SELECT * FROM c WHERE c.userId = @userId";
    const parameters = [{ name: "@userId", value: userId }];
    
    return this.query<Viewing>(
      this.getViewingsContainer(),
      query,
      parameters
    );
  }

  async getViewingsForAgent(agentId: string): Promise<Viewing[]> {
    const query = "SELECT * FROM c WHERE c.agentId = @agentId";
    const parameters = [{ name: "@agentId", value: agentId }];
    
    return this.query<Viewing>(
      this.getViewingsContainer(),
      query,
      parameters
    );
  }

  async getUpcomingViewings(
    agentId: string,
    startDate: string,
    endDate: string
  ): Promise<Viewing[]> {
    const query = `
      SELECT * FROM c 
      WHERE c.agentId = @agentId 
      AND c.status IN ('confirmed', 'pending')
      AND (
        (c.schedule.confirmedDateTime BETWEEN @startDate AND @endDate)
        OR
        (c.schedule.preferredDate BETWEEN @startDate AND @endDate)
      )
    `;
    const parameters = [
      { name: "@agentId", value: agentId },
      { name: "@startDate", value: startDate },
      { name: "@endDate", value: endDate }
    ];
    
    return this.query<Viewing>(
      this.getViewingsContainer(),
      query,
      parameters
    );
  }

  async updateViewingStatus(
    id: string,
    propertyId: string,
    status: Viewing['status'],
    notes?: string
  ): Promise<Viewing> {
    const viewing = await this.getViewingById(id, propertyId);
    
    if (!viewing) {
      throw new Error(`Viewing with id ${id} not found`);
    }

    const updates: Partial<Viewing> = {
      status,
      notes: {
        ...viewing.notes,
        internalNotes: notes 
          ? `${viewing.notes.internalNotes || ''}\n${new Date().toISOString()}: ${notes}`
          : viewing.notes.internalNotes
      }
    };

    return this.updateViewing(id, propertyId, updates);
  }

  async confirmViewing(
    id: string,
    propertyId: string,
    confirmedDateTime: string,
    agentNotes?: string
  ): Promise<Viewing> {
    const updates: Partial<Viewing> = {
      status: 'confirmed',
      schedule: {
        confirmedDateTime
      },
      notes: {
        agentNotes
      }
    };

    return this.updateViewing(id, propertyId, updates);
  }
} 