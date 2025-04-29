require('dotenv').config();
const { logger } = require('./logger');

const requiredEnvVars = [
  'COSMOS_DB_ENDPOINT',
  'COSMOS_DB_KEY',
  'COSMOS_DB_DATABASE',
];

// Validate required environment variables
const validateEnv = () => {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
};

const config = {
  cosmosDb: {
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY,
    database: process.env.COSMOS_DB_DATABASE,
    containers: {
      users: 'Users',
      references: 'References',
      viewings: 'Viewings',
      contracts: 'Contracts',
      dashboard: 'Dashboard'
    }
  },
  migration: {
    batchSize: parseInt(process.env.MIGRATION_BATCH_SIZE, 10) || 100,
    retryAttempts: parseInt(process.env.MIGRATION_RETRY_ATTEMPTS, 10) || 3,
    retryDelay: parseInt(process.env.MIGRATION_RETRY_DELAY, 10) || 1000, // milliseconds
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    errorFile: 'migration-error.log',
    combinedFile: 'migration.log'
  }
};

// Initialize configuration
const initializeConfig = () => {
  try {
    validateEnv();
    logger.info('Configuration validated successfully');
    return config;
  } catch (error) {
    logger.error('Configuration validation failed:', error);
    throw error;
  }
};

module.exports = {
  config,
  initializeConfig
}; 