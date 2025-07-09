import { DefaultAzureCredential } from '@azure/identity';
import { WebSiteManagementClient } from '@azure/arm-appservice';
import { validateEnv } from '../config/environment';
import { AppError } from '../middleware/error-handling';

interface FunctionConfig {
    resourceGroup: string;
    functionAppName: string;
    subscriptionId: string;
}

interface FunctionInfo {
    name: string;
    status: string;
    lastRunTime?: string;
    nextRunTime?: string;
    triggerType: string;
}

export class FunctionService {
    private client: WebSiteManagementClient;
    private config: FunctionConfig;

    constructor() {
        const envConfig = validateEnv();
        this.config = {
            resourceGroup: process.env.AZURE_RESOURCE_GROUP || '',
            functionAppName: process.env.AZURE_FUNCTION_APP_NAME || '',
            subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || ''
        };

        if (!this.config.resourceGroup || !this.config.functionAppName || !this.config.subscriptionId) {
            throw new AppError(500, 'Azure Functions configuration missing', 'FUNCTION_CONFIG_ERROR');
        }

        const credential = new DefaultAzureCredential();
        this.client = new WebSiteManagementClient(credential, this.config.subscriptionId);
    }

    async getFunctionStatus(functionName: string): Promise<FunctionInfo> {
        try {
            const functionApp = await this.client.webApps.getFunction(
                this.config.resourceGroup,
                this.config.functionAppName,
                functionName
            );

            return {
                name: functionName,
                status: functionApp.state || 'Unknown',
                lastRunTime: functionApp.lastRunTime,
                nextRunTime: functionApp.nextRunTime,
                triggerType: functionApp.triggerType || 'Unknown'
            };
        } catch (error) {
            throw new AppError(500, 'Failed to get function status', 'FUNCTION_STATUS_ERROR');
        }
    }

    async listFunctions(): Promise<FunctionInfo[]> {
        try {
            const functions = await this.client.webApps.listFunctions(
                this.config.resourceGroup,
                this.config.functionAppName
            );

            return functions.map(func => ({
                name: func.name || 'Unknown',
                status: func.state || 'Unknown',
                lastRunTime: func.lastRunTime,
                nextRunTime: func.nextRunTime,
                triggerType: func.triggerType || 'Unknown'
            }));
        } catch (error) {
            throw new AppError(500, 'Failed to list functions', 'FUNCTION_LIST_ERROR');
        }
    }

    async invokeFunction(functionName: string, data?: any): Promise<any> {
        try {
            const response = await this.client.webApps.invokeFunction(
                this.config.resourceGroup,
                this.config.functionAppName,
                functionName,
                {
                    body: data
                }
            );

            return response;
        } catch (error) {
            throw new AppError(500, 'Failed to invoke function', 'FUNCTION_INVOKE_ERROR');
        }
    }

    async getFunctionLogs(functionName: string, startTime?: Date, endTime?: Date): Promise<string[]> {
        try {
            const logs = await this.client.webApps.getFunctionLogs(
                this.config.resourceGroup,
                this.config.functionAppName,
                functionName,
                {
                    startTime,
                    endTime
                }
            );

            return logs;
        } catch (error) {
            throw new AppError(500, 'Failed to get function logs', 'FUNCTION_LOGS_ERROR');
        }
    }

    async updateFunctionConfig(functionName: string, config: Record<string, any>): Promise<void> {
        try {
            await this.client.webApps.updateFunctionConfiguration(
                this.config.resourceGroup,
                this.config.functionAppName,
                functionName,
                {
                    config
                }
            );
        } catch (error) {
            throw new AppError(500, 'Failed to update function configuration', 'FUNCTION_CONFIG_UPDATE_ERROR');
        }
    }

    async getFunctionMetrics(functionName: string, startTime: Date, endTime: Date): Promise<{
        executionCount: number;
        executionTime: number;
        memoryUsage: number;
        errors: number;
    }> {
        try {
            const metrics = await this.client.webApps.getFunctionMetrics(
                this.config.resourceGroup,
                this.config.functionAppName,
                functionName,
                {
                    startTime,
                    endTime
                }
            );

            return {
                executionCount: metrics.executionCount || 0,
                executionTime: metrics.executionTime || 0,
                memoryUsage: metrics.memoryUsage || 0,
                errors: metrics.errors || 0
            };
        } catch (error) {
            throw new AppError(500, 'Failed to get function metrics', 'FUNCTION_METRICS_ERROR');
        }
    }

    // Helper method to check if a function is healthy
    async isFunctionHealthy(functionName: string): Promise<boolean> {
        try {
            const status = await this.getFunctionStatus(functionName);
            return status.status === 'Running';
        } catch (error) {
            return false;
        }
    }

    // Helper method to get function execution history
    async getFunctionHistory(functionName: string, limit: number = 10): Promise<Array<{
        timestamp: string;
        status: string;
        duration: number;
        error?: string;
    }>> {
        try {
            const logs = await this.getFunctionLogs(functionName);
            return logs
                .slice(-limit)
                .map(log => {
                    const match = log.match(/\[(.*?)\] (.*?) completed in (.*?)ms(?: with error: (.*))?/);
                    if (match) {
                        return {
                            timestamp: match[1],
                            status: match[2],
                            duration: parseInt(match[3]),
                            error: match[4]
                        };
                    }
                    return null;
                })
                .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
        } catch (error) {
            throw new AppError(500, 'Failed to get function history', 'FUNCTION_HISTORY_ERROR');
        }
    }
} 