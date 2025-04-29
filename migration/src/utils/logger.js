const winston = require('winston');
const { format } = winston;
const path = require('path');

// Import config (assuming it's been created)
const { config } = require('./config');

const logFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const logger = winston.createLogger({
  level: config.logging.level || 'info',
  format: logFormat,
  defaultMeta: { service: 'migration-service' },
  transports: [
    new winston.transports.File({
      filename: path.join(config.logging.directory, 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(config.logging.directory, 'combined.log')
    })
  ]
});

// If we're not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

// Add custom logging methods for migration events
logger.migration = {
  start: (details) => logger.info('Starting migration process', { event: 'migration_start', ...details }),
  complete: (details) => logger.info('Migration completed successfully', { event: 'migration_complete', ...details }),
  error: (error, details) => logger.error('Migration error occurred', {
    event: 'migration_error',
    error: error.message,
    stack: error.stack,
    code: error.code,
    ...details
  }),
  progress: (details) => logger.info('Migration progress update', { event: 'migration_progress', ...details }),
  warning: (message, details) => logger.warn(message, { event: 'migration_warning', ...details }),
  validation: (details) => logger.info('Data validation', { event: 'data_validation', ...details }),
  transform: (details) => logger.debug('Data transformation', { event: 'data_transform', ...details })
};

module.exports = logger; 