import { z } from 'zod';

// Feature flag schema definition
const featureFlagSchema = z.object({
    isEnabled: z.boolean(),
    description: z.string(),
    environments: z.array(z.enum(['development', 'staging', 'production'])),
});

// Type for feature flag configuration
type FeatureFlag = z.infer<typeof featureFlagSchema>;

// Feature flags configuration
const featureFlags: Record<string, FeatureFlag> = {
    debugLogging: {
        isEnabled: process.env.VITE_ENABLE_DEBUG_LOGGING === 'true',
        description: 'Enable detailed logging for debugging purposes',
        environments: ['development', 'staging'],
    },
    performanceMonitoring: {
        isEnabled: process.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
        description: 'Enable performance monitoring and metrics collection',
        environments: ['staging', 'production'],
    },
    errorReporting: {
        isEnabled: process.env.VITE_ENABLE_ERROR_REPORTING === 'true',
        description: 'Enable error reporting and tracking',
        environments: ['staging', 'production'],
    },
    detailedErrors: {
        isEnabled: process.env.VITE_ENABLE_DETAILED_ERRORS === 'true',
        description: 'Show detailed error messages',
        environments: ['development'],
    },
    betaFeatures: {
        isEnabled: process.env.VITE_ENABLE_BETA_FEATURES === 'true',
        description: 'Enable beta features for testing',
        environments: ['development', 'staging'],
    },
    maintenanceMode: {
        isEnabled: process.env.VITE_ENABLE_MAINTENANCE_MODE === 'true',
        description: 'Enable maintenance mode',
        environments: ['development', 'staging', 'production'],
    },
    securityHeaders: {
        isEnabled: process.env.VITE_ENABLE_SECURITY_HEADERS === 'true',
        description: 'Enable security headers',
        environments: ['staging', 'production'],
    },
    caching: {
        isEnabled: process.env.VITE_ENABLE_CACHING === 'true',
        description: 'Enable response caching',
        environments: ['staging', 'production'],
    },
};

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (featureName: keyof typeof featureFlags): boolean => {
    const flag = featureFlags[featureName];
    if (!flag) return false;

    const currentEnv = process.env.VITE_ENVIRONMENT || 'development';
    return flag.isEnabled && flag.environments.includes(currentEnv as any);
};

// Helper function to get all enabled features for current environment
export const getEnabledFeatures = (): string[] => {
    const currentEnv = process.env.VITE_ENVIRONMENT || 'development';
    return Object.entries(featureFlags)
        .filter(([_, flag]) => flag.isEnabled && flag.environments.includes(currentEnv as any))
        .map(([name]) => name);
};

// Helper function to validate feature flag configuration
export const validateFeatureFlags = (): void => {
    Object.entries(featureFlags).forEach(([name, flag]) => {
        try {
            featureFlagSchema.parse(flag);
        } catch (error) {
            console.error(`Invalid configuration for feature flag "${name}":`, error);
        }
    });
};

export default featureFlags; 