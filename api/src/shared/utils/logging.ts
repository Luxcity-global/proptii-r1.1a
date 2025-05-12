import * as appInsights from 'applicationinsights';
import { InvocationContext } from '@azure/functions';
import { validateEnv } from '../config/environment';

export const setupLogging = (): void => {
    const config = validateEnv();

    if (config.APPINSIGHTS_INSTRUMENTATIONKEY) {
        appInsights.setup(config.APPINSIGHTS_INSTRUMENTATIONKEY)
            .setAutoDependencyCorrelation(true)
            .setAutoCollectRequests(true)
            .setAutoCollectPerformance(true, true)
            .setAutoCollectExceptions(true)
            .setAutoCollectDependencies(true)
            .setAutoCollectConsole(true)
            .setUseDiskRetryCaching(true)
            .start();
    }
};

export const createLogger = (context: InvocationContext) => {
    return {
        info: (message: string, ...args: unknown[]): void => {
            context.log(message, ...args);
        },
        error: (message: string, error?: unknown): void => {
            context.error(message, error);
            if (appInsights.defaultClient) {
                appInsights.defaultClient.trackException({ exception: error as Error });
            }
        },
        warn: (message: string, ...args: unknown[]): void => {
            context.warn(message, ...args);
        },
        debug: (message: string, ...args: unknown[]): void => {
            context.debug(message, ...args);
        },
    };
}; 