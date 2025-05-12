/**
 * Base error class for migration errors
 */
class MigrationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error class for retryable errors (e.g., network timeouts)
 */
class RetryableError extends MigrationError {
  constructor(message, details = {}) {
    super(message, details);
    this.isRetryable = true;
  }
}

/**
 * Error class for validation failures
 */
class ValidationError extends MigrationError {
  constructor(message, details = {}) {
    super(message, details);
    this.isRetryable = false;
  }
}

/**
 * Error class for data transformation failures
 */
class TransformationError extends MigrationError {
  constructor(message, details = {}) {
    super(message, details);
    this.isRetryable = false;
  }
}

/**
 * Error class for configuration errors
 */
class ConfigurationError extends MigrationError {
  constructor(message, details = {}) {
    super(message, details);
    this.isRetryable = false;
  }
}

/**
 * Error class for database connection/operation errors
 */
class DatabaseError extends MigrationError {
  constructor(message, details = {}, isRetryable = true) {
    super(message, details);
    this.isRetryable = isRetryable;
  }
}

module.exports = {
  MigrationError,
  RetryableError,
  ValidationError,
  TransformationError,
  ConfigurationError,
  DatabaseError
}; 