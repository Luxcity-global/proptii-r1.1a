import winston from 'winston';

/**
 * Custom Logger class providing NestJS-like API using Winston.
 * Supports context-tagging, colorized output, and multiple log levels.
 */
export class Logger {
  private logger: winston.Logger;
  private context: string;

  constructor(context: string = 'System') {
    this.context = context;

    const customFormat = winston.format.printf(({ level, message, timestamp, context }) => {
      const ctx = context ? ` [\x1b[33m${context}\x1b[0m]` : '';
      return `\x1b[2m${timestamp}\x1b[0m ${level}${ctx}: ${message}`;
    });

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.colorize(),
        customFormat
      ),
      transports: [new winston.transports.Console()],
    });
  }

  log(message: string, ...args: any[]) {
    this.logger.info(this.formatMessage(message, args), { context: this.context });
  }

  error(message: string, ...args: any[]) {
    this.logger.error(this.formatMessage(message, args), { context: this.context });
  }

  warn(message: string, ...args: any[]) {
    this.logger.warn(this.formatMessage(message, args), { context: this.context });
  }

  debug(message: string, ...args: any[]) {
    this.logger.debug(this.formatMessage(message, args), { context: this.context });
  }

  info(message: string, ...args: any[]) {
    this.logger.info(this.formatMessage(message, args), { context: this.context });
  }

  private formatMessage(message: any, args: any[]): string {
    let formatted = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
    if (args.length > 0) {
      formatted += ' ' + args.map(arg => 
        typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)
      ).join(' ');
    }
    return formatted;
  }
}

// Default export of a global logger instance
export const logger = new Logger('App');
