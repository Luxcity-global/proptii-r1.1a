const { RetryableError } = require('./errors');
const logger = require('./logger');
const { config } = require('./config');

/**
 * Implements exponential backoff retry logic
 * @param {Function} operation - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} - Resolves with operation result or rejects with error
 */
async function retry(operation, options = {}) {
  const {
    maxAttempts = config.retry.maxAttempts || 3,
    initialDelay = config.retry.initialDelay || 1000,
    maxDelay = config.retry.maxDelay || 10000,
    factor = config.retry.factor || 2,
    shouldRetry = (error) => error instanceof RetryableError
  } = options;

  let lastError;
  let attempt = 1;

  while (attempt <= maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!shouldRetry(error) || attempt === maxAttempts) {
        logger.error('Operation failed permanently', {
          error: error.message,
          attempt,
          maxAttempts
        });
        throw error;
      }

      const delay = Math.min(initialDelay * Math.pow(factor, attempt - 1), maxDelay);
      
      logger.warn('Operation failed, retrying', {
        error: error.message,
        attempt,
        nextAttemptDelay: delay
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }

  throw lastError;
}

/**
 * Decorator function to make any async function retryable
 * @param {Function} fn - Function to make retryable
 * @param {Object} options - Retry options
 * @returns {Function} - Wrapped function with retry logic
 */
function withRetry(fn, options = {}) {
  return async (...args) => {
    return retry(() => fn(...args), options);
  };
}

/**
 * Creates a batch processor with retry logic
 * @param {Array} items - Items to process
 * @param {Function} processFn - Function to process each item
 * @param {Object} options - Batch and retry options
 * @returns {Promise<Array>} - Results of processing
 */
async function batchWithRetry(items, processFn, options = {}) {
  const {
    batchSize = config.batch.size || 100,
    concurrency = config.batch.concurrency || 3,
    ...retryOptions
  } = options;

  const results = [];
  const errors = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map(item => 
      retry(() => processFn(item), retryOptions)
        .then(result => results.push(result))
        .catch(error => errors.push({ item, error }))
    );

    // Process batches with controlled concurrency
    for (let j = 0; j < batchPromises.length; j += concurrency) {
      const concurrent = batchPromises.slice(j, j + concurrency);
      await Promise.all(concurrent);
    }

    logger.migration.progress({
      processed: results.length,
      failed: errors.length,
      total: items.length,
      progress: ((i + batch.length) / items.length * 100).toFixed(2) + '%'
    });
  }

  return { results, errors };
}

module.exports = {
  retry,
  withRetry,
  batchWithRetry
}; 