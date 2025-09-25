const { logger } = require('./logger');

class MigrationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'MigrationError';
    this.details = details;
  }
}

const handleError = (error, context = {}) => {
  if (error instanceof MigrationError) {
    logger.error(`Migration Error: ${error.message}`, {
      ...context,
      ...error.details,
      stack: error.stack
    });
  } else {
    logger.error(`Unexpected Error: ${error.message}`, {
      ...context,
      stack: error.stack
    });
  }
};

const wrapAsync = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error);
      throw error;
    }
  };
};

module.exports = {
  MigrationError,
  handleError,
  wrapAsync
}; 