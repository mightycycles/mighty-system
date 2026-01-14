import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  } : undefined,
  base: {
    service: 'mighty-system-api',
  },
});

export class LoggerService {
  private logger: typeof logger;

  constructor(context?: Record<string, unknown>) {
    this.logger = logger.child(context ?? {});
  }

  info(message: string, metadata?: Record<string, unknown>) {
    this.logger.info(metadata, message);
  }

  error(error: Error, message?: string, metadata?: Record<string, unknown>) {
    this.logger.error({ err: error, ...metadata }, message ?? error.message);
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    this.logger.warn(metadata, message);
  }

  debug(message: string, metadata?: Record<string, unknown>) {
    this.logger.debug(metadata, message);
  }

  child(context: Record<string, unknown>) {
    return new LoggerService(context);
  }
}
