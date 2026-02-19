const dotenv = require('dotenv');
const path = require('path');
const { logger } = require('./logger');
const { MigrationError, ErrorCodes } = require('./errorHandling');

function loadEnvFile() {
  const env = process.env.NODE_ENV || 'development';
  const envFile = `.env.${env}`;
  
  const result = dotenv.config({
    path: path.resolve(process.cwd(), envFile)
  });

  if (result.error) {
    logger.warn(`Failed to load ${envFile}, falling back to .env`);
    dotenv.config(); // Try loading default .env file
  }
}

function validateEnv() {
  const required = [
    'FIRESTORE_PROJECT_ID',
    'FIRESTORE_CLIENT_EMAIL',
    'FIRESTORE_PRIVATE_KEY',
    'COSMOS_DB_ENDPOINT',
    'COSMOS_DB_KEY',
    'COSMOS_DB_DATABASE'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new MigrationError(
      'Missing required environment variables',
      ErrorCodes.CONFIG_ERROR,
      { missing }
    );
  }
}

// Initialize configuration
async function getConfig() {
  try {
    // Load environment variables
    loadEnvFile();
    validateEnv();

    const config = {
      firestore: {
        projectId: process.env.FIRESTORE_PROJECT_ID,
        clientEmail: process.env.FIRESTORE_CLIENT_EMAIL,
        privateKey: process.env.FIRESTORE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        emulator: process.env.FIRESTORE_EMULATOR === 'true'
      },
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
        retryDelay: parseInt(process.env.MIGRATION_RETRY_DELAY, 10) || 1000,
        parallel: process.env.MIGRATION_PARALLEL === 'true',
        validateData: process.env.MIGRATION_VALIDATE_DATA !== 'false'
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        directory: process.env.LOG_DIRECTORY || 'logs'
      }
    };

    return config;
  } catch (error) {
    throw new MigrationError(
      'Failed to initialize configuration',
      ErrorCodes.CONFIG_ERROR,
      { error: error.message }
    );
  }
}

module.exports = {
  getConfig
}; 