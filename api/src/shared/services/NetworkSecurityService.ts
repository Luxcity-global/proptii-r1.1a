import { CosmosClient, Database } from '@azure/cosmos';
import { validateEnv } from '../config/environment';
import { AppError } from '../middleware/error-handling';

interface NetworkRule {
    id: string;
    type: 'ip' | 'vnet';
    value: string;
    description: string;
    enabled: boolean;
}

interface PrivateEndpoint {
    id: string;
    name: string;
    subnetId: string;
    status: 'pending' | 'approved' | 'rejected';
}

export class NetworkSecurityService {
    private client: CosmosClient;
    private database: Database;
    private rulesContainer: Container;
    private endpointsContainer: Container;

    constructor() {
        const config = validateEnv();
        this.client = new CosmosClient({
            endpoint: config.COSMOS_DB_CONNECTION_STRING,
            key: process.env.COSMOS_DB_KEY || ''
        });
        this.database = this.client.database(config.COSMOS_DB_DATABASE_NAME);
        this.rulesContainer = this.database.container('NetworkRules');
        this.endpointsContainer = this.database.container('PrivateEndpoints');
    }

    async addNetworkRule(rule: Omit<NetworkRule, 'id'>): Promise<NetworkRule> {
        try {
            const newRule: NetworkRule = {
                id: `rule_${Date.now()}`,
                ...rule
            };

            await this.rulesContainer.items.create(newRule);
            return newRule;
        } catch (error) {
            throw new AppError(500, 'Failed to add network rule', 'NETWORK_RULE_ERROR');
        }
    }

    async removeNetworkRule(ruleId: string): Promise<void> {
        try {
            await this.rulesContainer.item(ruleId).delete();
        } catch (error) {
            throw new AppError(500, 'Failed to remove network rule', 'NETWORK_RULE_ERROR');
        }
    }

    async listNetworkRules(): Promise<NetworkRule[]> {
        try {
            const { resources } = await this.rulesContainer.items.query({
                query: 'SELECT * FROM c'
            }).fetchAll();
            return resources as NetworkRule[];
        } catch (error) {
            throw new AppError(500, 'Failed to list network rules', 'NETWORK_RULE_ERROR');
        }
    }

    async updateNetworkRule(ruleId: string, updates: Partial<NetworkRule>): Promise<NetworkRule> {
        try {
            const { resource: existingRule } = await this.rulesContainer.item(ruleId).read();
            if (!existingRule) {
                throw new AppError(404, 'Network rule not found', 'NETWORK_RULE_NOT_FOUND');
            }

            const updatedRule = {
                ...existingRule,
                ...updates
            };

            const { resource } = await this.rulesContainer.item(ruleId).replace(updatedRule);
            return resource as NetworkRule;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to update network rule', 'NETWORK_RULE_ERROR');
        }
    }

    async addPrivateEndpoint(endpoint: Omit<PrivateEndpoint, 'id'>): Promise<PrivateEndpoint> {
        try {
            const newEndpoint: PrivateEndpoint = {
                id: `endpoint_${Date.now()}`,
                ...endpoint
            };

            await this.endpointsContainer.items.create(newEndpoint);
            return newEndpoint;
        } catch (error) {
            throw new AppError(500, 'Failed to add private endpoint', 'PRIVATE_ENDPOINT_ERROR');
        }
    }

    async removePrivateEndpoint(endpointId: string): Promise<void> {
        try {
            await this.endpointsContainer.item(endpointId).delete();
        } catch (error) {
            throw new AppError(500, 'Failed to remove private endpoint', 'PRIVATE_ENDPOINT_ERROR');
        }
    }

    async listPrivateEndpoints(): Promise<PrivateEndpoint[]> {
        try {
            const { resources } = await this.endpointsContainer.items.query({
                query: 'SELECT * FROM c'
            }).fetchAll();
            return resources as PrivateEndpoint[];
        } catch (error) {
            throw new AppError(500, 'Failed to list private endpoints', 'PRIVATE_ENDPOINT_ERROR');
        }
    }

    async updatePrivateEndpointStatus(endpointId: string, status: PrivateEndpoint['status']): Promise<PrivateEndpoint> {
        try {
            const { resource: existingEndpoint } = await this.endpointsContainer.item(endpointId).read();
            if (!existingEndpoint) {
                throw new AppError(404, 'Private endpoint not found', 'PRIVATE_ENDPOINT_NOT_FOUND');
            }

            const updatedEndpoint = {
                ...existingEndpoint,
                status
            };

            const { resource } = await this.endpointsContainer.item(endpointId).replace(updatedEndpoint);
            return resource as PrivateEndpoint;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to update private endpoint status', 'PRIVATE_ENDPOINT_ERROR');
        }
    }

    async validateNetworkAccess(ipAddress: string): Promise<boolean> {
        try {
            const { resources: rules } = await this.rulesContainer.items.query({
                query: 'SELECT * FROM c WHERE c.enabled = true'
            }).fetchAll();

            return rules.some((rule: NetworkRule) => {
                if (rule.type === 'ip') {
                    return rule.value === ipAddress;
                }
                // Add VNet validation logic here if needed
                return false;
            });
        } catch (error) {
            throw new AppError(500, 'Failed to validate network access', 'NETWORK_ACCESS_ERROR');
        }
    }
} 