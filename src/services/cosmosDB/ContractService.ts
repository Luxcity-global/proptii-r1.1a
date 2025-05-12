import { CosmosDBService, CosmosConfig } from './CosmosDBService';

export interface Contract {
  id: string;
  propertyId: string;
  type: 'sale' | 'rental';
  status: 'draft' | 'pending' | 'active' | 'completed' | 'terminated' | 'expired';
  parties: {
    owner: {
      userId: string;
      name: string;
      email: string;
      phone: string;
      signature?: {
        timestamp: string;
        ipAddress: string;
      };
    };
    tenant: {
      userId: string;
      name: string;
      email: string;
      phone: string;
      signature?: {
        timestamp: string;
        ipAddress: string;
      };
    };
    agent: {
      userId: string;
      name: string;
      email: string;
      signature?: {
        timestamp: string;
        ipAddress: string;
      };
    };
  };
  terms: {
    startDate: string;
    endDate?: string;
    price: {
      amount: number;
      currency: string;
      paymentFrequency?: 'monthly' | 'yearly'; // For rentals
      paymentDueDay?: number; // Day of month for rental payments
    };
    deposit: {
      amount: number;
      currency: string;
      paymentDate?: string;
      refundDate?: string;
    };
    specialConditions?: string[];
  };
  documents: {
    id: string;
    type: 'contract' | 'addendum' | 'termination' | 'other';
    title: string;
    url: string;
    uploadedAt: string;
    status: 'draft' | 'final';
  }[];
  history: {
    timestamp: string;
    action: string;
    userId: string;
    notes?: string;
  }[];
  metadata: {
    createdAt: string;
    lastUpdated: string;
    version: number;
    nextReviewDate?: string;
  };
}

export class ContractService extends CosmosDBService {
  constructor(config: CosmosConfig) {
    super(config);
  }

  async createContract(contractData: Omit<Contract, 'id' | 'metadata' | 'history'>): Promise<Contract> {
    const now = new Date().toISOString();
    const contract: Contract = {
      ...contractData,
      id: crypto.randomUUID(),
      history: [{
        timestamp: now,
        action: 'created',
        userId: contractData.parties.agent.userId,
        notes: 'Contract created'
      }],
      metadata: {
        createdAt: now,
        lastUpdated: now,
        version: 1
      }
    };

    return this.create(this.getContractsContainer(), contract);
  }

  async getContractById(id: string): Promise<Contract | undefined> {
    return this.read<Contract>(this.getContractsContainer(), id, id);
  }

  async updateContract(
    id: string,
    updates: Partial<Omit<Contract, 'id' | 'metadata' | 'history'>>,
    userId: string,
    actionNotes?: string
  ): Promise<Contract> {
    const now = new Date().toISOString();
    const contract = await this.getContractById(id);
    
    if (!contract) {
      throw new Error(`Contract with id ${id} not found`);
    }

    const updatedContract: Contract = {
      ...contract,
      ...updates,
      history: [
        {
          timestamp: now,
          action: 'updated',
          userId,
          notes: actionNotes || 'Contract updated'
        },
        ...contract.history
      ],
      metadata: {
        ...contract.metadata,
        lastUpdated: now,
        version: contract.metadata.version + 1
      }
    };

    return this.update<Contract>(
      this.getContractsContainer(),
      id,
      id,
      updatedContract
    );
  }

  async deleteContract(id: string): Promise<void> {
    return this.delete(this.getContractsContainer(), id, id);
  }

  async getContractsForProperty(propertyId: string): Promise<Contract[]> {
    const query = "SELECT * FROM c WHERE c.propertyId = @propertyId";
    const parameters = [{ name: "@propertyId", value: propertyId }];
    
    return this.query<Contract>(
      this.getContractsContainer(),
      query,
      parameters
    );
  }

  async getContractsForUser(userId: string): Promise<Contract[]> {
    const query = `
      SELECT * FROM c 
      WHERE c.parties.tenant.userId = @userId 
      OR c.parties.owner.userId = @userId
      OR c.parties.agent.userId = @userId
    `;
    const parameters = [{ name: "@userId", value: userId }];
    
    return this.query<Contract>(
      this.getContractsContainer(),
      query,
      parameters
    );
  }

  async addSignature(
    id: string,
    partyType: 'owner' | 'tenant' | 'agent',
    userId: string,
    ipAddress: string
  ): Promise<Contract> {
    const contract = await this.getContractById(id);
    
    if (!contract) {
      throw new Error(`Contract with id ${id} not found`);
    }

    if (contract.parties[partyType].userId !== userId) {
      throw new Error(`User ${userId} is not authorized to sign as ${partyType}`);
    }

    const now = new Date().toISOString();
    const updates: Partial<Contract> = {
      parties: {
        ...contract.parties,
        [partyType]: {
          ...contract.parties[partyType],
          signature: {
            timestamp: now,
            ipAddress
          }
        }
      }
    };

    return this.updateContract(
      id,
      updates,
      userId,
      `Contract signed by ${partyType}`
    );
  }

  async addDocument(
    id: string,
    document: Omit<Contract['documents'][0], 'uploadedAt'>,
    userId: string
  ): Promise<Contract> {
    const contract = await this.getContractById(id);
    
    if (!contract) {
      throw new Error(`Contract with id ${id} not found`);
    }

    const newDocument = {
      ...document,
      uploadedAt: new Date().toISOString()
    };

    const updates: Partial<Contract> = {
      documents: [...(contract.documents || []), newDocument]
    };

    return this.updateContract(
      id,
      updates,
      userId,
      `Document "${document.title}" added to contract`
    );
  }

  async updateContractStatus(
    id: string,
    status: Contract['status'],
    userId: string,
    notes?: string
  ): Promise<Contract> {
    const updates: Partial<Contract> = {
      status
    };

    return this.updateContract(
      id,
      updates,
      userId,
      notes || `Contract status updated to ${status}`
    );
  }
} 