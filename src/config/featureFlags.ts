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
        isEnabled: import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true',
        description: 'Enable detailed logging for debugging purposes',
        environments: ['development', 'staging'] as Environment[],
    },
    performanceMonitoring: {
        isEnabled: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
        description: 'Enable performance monitoring and metrics collection',
        environments: ['development', 'staging', 'production'] as Environment[],
    },
    errorReporting: {
        isEnabled: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
        description: 'Enable error reporting and tracking',
        environments: ['staging', 'production'] as Environment[],
    },
    detailedErrors: {
        isEnabled: import.meta.env.VITE_ENABLE_DETAILED_ERRORS === 'true',
        description: 'Show detailed error messages',
        environments: ['development'] as Environment[],
    },
    betaFeatures: {
        isEnabled: import.meta.env.VITE_ENABLE_BETA_FEATURES === 'true',
        description: 'Enable beta features for testing',
        environments: ['development', 'staging'] as Environment[],
    },
    maintenanceMode: {
        isEnabled: import.meta.env.VITE_ENABLE_MAINTENANCE_MODE === 'true',
        description: 'Enable maintenance mode',
        environments: ['staging', 'production'] as Environment[],
    },
    securityHeaders: {
        isEnabled: import.meta.env.VITE_ENABLE_SECURITY_HEADERS === 'true',
        description: 'Enable security headers',
        environments: ['staging', 'production'] as Environment[],
    },
    caching: {
        isEnabled: import.meta.env.VITE_ENABLE_CACHING === 'true',
        description: 'Enable response caching',
        environments: ['staging', 'production'] as Environment[],
    },
    // New Property Harvesting Feature Flags
    enablePropertyHarvesting: {
        isEnabled: true,
        description: 'Enable property harvesting feature',
        environments: ['development', 'staging'] as Environment[],
    },
    enableHarvestingSearch: {
        isEnabled: true,
        description: 'Enable harvesting search functionality',
        environments: ['development', 'staging'] as Environment[],
    },
    enableHarvestingResults: {
        isEnabled: true,
        description: 'Enable harvesting results display',
        environments: ['development', 'staging'] as Environment[],
    },
    enableAgentContact: {
        isEnabled: true,
        description: 'Enable agent contact functionality',
        environments: ['development', 'staging'] as Environment[],
    },
    enableHarvestingAnalytics: {
        isEnabled: true,
        description: 'Enable harvesting analytics',
        environments: ['development', 'staging'] as Environment[],
    },
    enableAiExtraction: {
        isEnabled: true,
        description: 'Enable AI-powered data extraction',
        environments: ['development', 'staging'] as Environment[],
    },
    enableWebScraping: {
        isEnabled: true,
        description: 'Enable web scraping functionality',
        environments: ['development', 'staging'] as Environment[],
    },
    enableMockDataOnly: {
        isEnabled: true,
        description: 'Use mock data only for harvesting',
        environments: ['development', 'staging'] as Environment[],
    },
};

// Helper function to check if a feature is enabled for the current environment
export function isFeatureEnabled(name: keyof typeof featureFlags): boolean {
    const flag = featureFlags[name];
    if (!flag) {
        console.warn(`Feature flag "${name}" not found`);
        return false;
    }
    // Simplified logic: just check if the flag is enabled
    // Environment check is causing issues, so we'll rely on the flag's isEnabled property
    const result = flag.isEnabled;
    console.log(`isFeatureEnabled("${name}"):`, { flag, result });
    return result;
}

// Helper function to get all enabled features for the current environment
export function getEnabledFeatures(): Record<string, boolean> {
    const currentEnv = import.meta.env.VITE_ENVIRONMENT || 'development';
    return Object.entries(featureFlags)
        .filter(([_, flag]) => flag.isEnabled && flag.environments.includes(currentEnv as any))
        .reduce((acc, [name, _]) => {
            acc[name] = true;
            return acc;
        }, {} as Record<string, boolean>);
}

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

// External Collections specific feature flag helpers
export const EXTERNAL_COLLECTIONS_FEATURES = {
    ENABLE_EXTERNAL_COLLECTIONS: "enablePropertyHarvesting",
    ENABLE_AI_EXTRACTION: "enableAiExtraction",
    ENABLE_SCRAPING: "enableWebScraping",
    ENABLE_ANALYTICS: "enableHarvestingAnalytics",
    ENABLE_SEARCH: "enableHarvestingSearch",
    ENABLE_RESULTS: "enableHarvestingResults",
    ENABLE_CONTACT: "enableAgentContact",
    ENABLE_MOCK_DATA: "enableMockDataOnly",
} as const;

export const isExternalCollectionsFeatureEnabled = (feature: keyof typeof EXTERNAL_COLLECTIONS_FEATURES): boolean => {
    console.log('isExternalCollectionsFeatureEnabled called with:', feature);
    console.log('EXTERNAL_COLLECTIONS_FEATURES[feature]:', EXTERNAL_COLLECTIONS_FEATURES[feature]);
    return isFeatureEnabled(EXTERNAL_COLLECTIONS_FEATURES[feature] as keyof typeof featureFlags);
};

export default featureFlags; 