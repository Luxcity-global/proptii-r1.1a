const { logger } = require('./logger');

// Error codes for different types of migration errors
const ErrorCodes = {
  // Export related errors
  EXPORT_ERROR: 'EXPORT_ERROR',
  EXPORT_SAVE_ERROR: 'EXPORT_SAVE_ERROR',
  SCHEMA_VALIDATION_ERROR: 'SCHEMA_VALIDATION_ERROR',
  REFERENCE_VALIDATION_ERROR: 'REFERENCE_VALIDATION_ERROR',
  
  // Transform related errors
  TRANSFORM_ERROR: 'TRANSFORM_ERROR',
  TYPE_CONVERSION_ERROR: 'TYPE_CONVERSION_ERROR',
  
  // Import related errors
  IMPORT_ERROR: 'IMPORT_ERROR',
  COSMOS_CONNECTION_ERROR: 'COSMOS_CONNECTION_ERROR',
  BATCH_OPERATION_ERROR: 'BATCH_OPERATION_ERROR',
  
  // General errors
  CONFIG_ERROR: 'CONFIG_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

class MigrationError extends Error {
  constructor(message, code = ErrorCodes.UNKNOWN_ERROR, details = {}) {
    super(message);
    this.name = 'MigrationError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

function handleExportError(error, documentId, collectionName) {
  const errorDetails = {
    documentId,
    collectionName,
    timestamp: new Date().toISOString()
  };

  if (error instanceof MigrationError) {
    logger.error('Export error:', {
      ...error.toJSON(),
      ...errorDetails
    });
  } else {
    logger.error('Unexpected export error:', {
      error: error.message,
      stack: error.stack,
      ...errorDetails
    });
  }
}

async function withRetry(operation, options = {}) {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffFactor = 2,
    context = {}
  } = options;

  let lastError;
  let attempt = 1;

  while (attempt <= maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        break;
      }

      const delay = delayMs * Math.pow(backoffFactor, attempt - 1);
      logger.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`, {
        error: error.message,
        context
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }

  throw new MigrationError(
    `Operation failed after ${maxAttempts} attempts`,
    ErrorCodes.UNKNOWN_ERROR,
    {
      lastError: lastError.message,
      attempts: maxAttempts,
      context
    }
  );
}

module.exports = {
  ErrorCodes,
  MigrationError,
  handleExportError,
  withRetry
}; 