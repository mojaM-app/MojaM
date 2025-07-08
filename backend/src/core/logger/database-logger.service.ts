import { LOG_LEVEL } from '@config';
import { BaseRepository } from '@db';
import { Service } from 'typedi';
import { fileLogger } from './file-logger.service';

export interface ILogMetadata {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  requestId?: string;
  source?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  isSecurityEvent?: boolean;
  additionalData?: any;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';

// Log level hierarchy (higher number = higher priority)
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

@Service()
export class DatabaseLoggerService extends BaseRepository {
  private readonly configuredLogLevel: LogLevel;

  constructor() {
    super();
    this.configuredLogLevel = (LOG_LEVEL?.toLowerCase() as LogLevel) ?? 'warn';
  }

  private shouldLog(level: LogLevel): boolean {
    const currentLevelPriority = LOG_LEVEL_PRIORITY[level];
    const configuredLevelPriority = LOG_LEVEL_PRIORITY[this.configuredLogLevel];
    return currentLevelPriority <= configuredLevelPriority;
  }

  private isDatabaseAvailable(): boolean {
    try {
      return !!(
        this._dbContext &&
        this._dbContext.isInitialized &&
        this._dbContext.logs &&
        this._dbContext.manager !== undefined
      );
    } catch {
      return false;
    }
  }

  private async writeLog(level: LogLevel, message: string, metadata?: ILogMetadata): Promise<void> {
    // Check if this log level should be logged
    if (!this.shouldLog(level)) {
      return;
    }

    try {
      // Check if database context and connection are available
      if (!this.isDatabaseAvailable()) {
        fileLogger.info(`[${level.toUpperCase()}] ${message}`, metadata);
        return;
      }

      const logEntry = this._dbContext.logs.create({
        level: level.toUpperCase(),
        message,
        meta: metadata ? JSON.stringify(metadata) : undefined,
        source: metadata?.source || 'application',
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        path: metadata?.path,
        method: metadata?.method,
        requestId: metadata?.requestId,
        userId: metadata?.userId ?? null,
        severity: metadata?.severity,
        isSecurityEvent: metadata?.isSecurityEvent || false,
        additionalData: metadata?.additionalData ? JSON.stringify(metadata.additionalData) : undefined,
      });

      await this._dbContext.logs.save(logEntry);
    } catch (error) {
      // Fallback to file logging if database write fails
      fileLogger.error('Failed to write log to database', error);
      fileLogger.info(`[${level.toUpperCase()}] ${message}`, metadata);
    }
  }

  public async error(message: string, metadata?: ILogMetadata | Error): Promise<void> {
    if (!this.shouldLog('error')) {
      return;
    }

    if (metadata instanceof Error) {
      if (metadata.message) {
        if (!message.endsWith('\n\r')) {
          message += '\n\r';
        }
        message += metadata.message;
      }

      metadata = {
        additionalData: metadata.stack,
      } satisfies ILogMetadata;
    }

    await this.writeLog('error', message, { ...metadata, severity: metadata?.severity || 'high' }).catch(() => {
      // Fallback to file logger if database logging fails
      fileLogger.error(message, metadata);
    });
  }

  public async warn(message: string, metadata?: ILogMetadata): Promise<void> {
    if (!this.shouldLog('warn')) {
      return;
    }

    await this.writeLog('warn', message, { ...metadata, severity: metadata?.severity || 'medium' }).catch(() => {
      // Fallback to file logger if database logging fails
      fileLogger.warn(message, metadata);
    });
  }

  public async info(message: string, metadata?: ILogMetadata): Promise<void> {
    if (!this.shouldLog('info')) {
      return;
    }

    await this.writeLog('info', message, { ...metadata, severity: metadata?.severity || 'low' }).catch(() => {
      // Fallback to file logger if database logging fails
      fileLogger.info(message, metadata);
    });
  }

  public async http(message: string, metadata?: ILogMetadata): Promise<void> {
    if (!this.shouldLog('http')) {
      return;
    }

    await this.writeLog('http', message, { ...metadata, severity: metadata?.severity || 'low' }).catch(() => {
      // Fallback to file logger if database logging fails
      fileLogger.http(message, metadata);
    });
  }

  public async verbose(message: string, metadata?: ILogMetadata): Promise<void> {
    if (!this.shouldLog('verbose')) {
      return;
    }

    await this.writeLog('verbose', message, { ...metadata, severity: metadata?.severity || 'low' }).catch(() => {
      // Fallback to file logger if database logging fails
      fileLogger.verbose(message, metadata);
    });
  }

  public async debug(message: string, metadata?: ILogMetadata): Promise<void> {
    if (!this.shouldLog('debug')) {
      return;
    }

    await this.writeLog('debug', message, { ...metadata, severity: metadata?.severity || 'low' }).catch(() => {
      // Fallback to file logger if database logging fails
      fileLogger.debug(message, metadata);
    });
  }

  public async silly(message: string, metadata?: ILogMetadata): Promise<void> {
    if (!this.shouldLog('silly')) {
      return;
    }

    await this.writeLog('silly', message, { ...metadata, severity: metadata?.severity || 'low' }).catch(() => {
      // Fallback to file logger if database logging fails
      fileLogger.silly(message, metadata);
    });
  }

  // Security-specific logging method
  // Security logs are always written regardless of log level configuration
  public async security(
    level: LogLevel,
    message: string,
    metadata?: Omit<ILogMetadata, 'isSecurityEvent'>,
  ): Promise<void> {
    // Security logs bypass log level filtering for safety
    try {
      // Check if database context and connection are available
      if (!this.isDatabaseAvailable()) {
        fileLogger[level](`[SECURITY] ${message}`, metadata);
        return;
      }

      const logEntry = this._dbContext.logs.create({
        level: level.toUpperCase(),
        message: `[SECURITY] ${message}`,
        meta: metadata ? JSON.stringify(metadata) : undefined,
        source: metadata?.source || 'security',
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        path: metadata?.path,
        method: metadata?.method,
        requestId: metadata?.requestId,
        userId: metadata?.userId ?? null,
        severity: metadata?.severity || 'high',
        isSecurityEvent: true,
        additionalData: metadata?.additionalData ? JSON.stringify(metadata.additionalData) : undefined,
      });

      await this._dbContext.logs.save(logEntry);
    } catch (error) {
      // Fallback to file logging if database write fails
      fileLogger.error('Failed to write security log to database', error);
      fileLogger[level](`[SECURITY] ${message}`, metadata);
    }
  }
}
