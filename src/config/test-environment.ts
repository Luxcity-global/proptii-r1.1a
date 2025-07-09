/**
 * Test Environment Configuration for Property Harvesting
 * This configuration is used for isolated testing of the harvesting feature
 */

export const testConfig = {
  harvesting: {
    enabled: true,
    testMode: true,
    mockDataOnly: true, // Start with mock data only
    aiEnabled: false, // Disable AI initially
    scrapingEnabled: false, // Disable scraping initially
  },
  featureFlags: {
    enableHarvestingSearch: true,
    enableHarvestingResults: true,
    enableAgentContact: true,
    enableAnalytics: false,
  },
  api: {
    baseUrl: 'http://localhost:3000/api',
    testEndpoints: {
      search: '/test/harvesting/search',
      results: '/test/harvesting/results',
      contact: '/test/harvesting/contact',
      analytics: '/test/harvesting/analytics',
    },
  },
  database: {
    testTables: {
      harvestedProperties: 'test_harvested_properties',
      searchHistory: 'test_search_history',
      contactRequests: 'test_contact_requests',
    },
  },
  monitoring: {
    enabled: true,
    logLevel: 'debug',
    performanceTracking: true,
    errorReporting: true,
  },
};

export type TestConfig = typeof testConfig; 