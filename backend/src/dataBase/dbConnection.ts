import { NODE_ENV } from '@config';
import { fileLogger as logger } from '@core';
import { EventEmitter } from 'events';
import { DbContext } from './dbContext';

export interface IDbConnectionConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  factor: number;
  healthCheckIntervalMs: number;
  maxReconnectAttempts: number;
}

export interface IDbConnection {
  connect(): Promise<void>;
  close(): Promise<void>;
  getDbContext(): DbContext;
  isConnected(): boolean;
  gracefulShutdown(): Promise<void>;

  // EventEmitter methods
  on(event: string | symbol, listener: (...args: any[]) => void): this;
  emit(event: string | symbol, ...args: any[]): boolean;
  off(event: string | symbol, listener: (...args: any[]) => void): this;
  once(event: string | symbol, listener: (...args: any[]) => void): this;
}

export class DbConnectionError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'DbConnectionError';
  }
}

export class DbConnection extends EventEmitter implements IDbConnection {
  private _connectPromise: Promise<void> | null = null;
  private _healthCheckInterval: NodeJS.Timeout | null = null;
  private _reconnectAttempts = 0;
  private _isShuttingDown = false;
  private _hasBeenConnected = false; // Track if we've ever been connected
  private _disableHealthCheck = false; // Allow disabling health check for tests

  private readonly _config: IDbConnectionConfig = {
    maxRetries: 5,
    initialDelayMs: 1000, // 1 second
    maxDelayMs: 30000, // 30 seconds
    factor: 2, // Exponential backoff factor
    healthCheckIntervalMs: 30 * 60 * 1000, // 30 minutes
    maxReconnectAttempts: 10,
  };

  constructor(
    private readonly _dataContext: DbContext,
    config?: Partial<IDbConnectionConfig>,
  ) {
    super();

    if (config) {
      this._config = { ...this._config, ...config };
    }

    this.on('error', error => {
      logger.error('DbConnection error:', error);
    });
  }

  public async connect(): Promise<void> {
    if (this._isShuttingDown) {
      throw new DbConnectionError('Cannot connect during shutdown');
    }

    if (this._connectPromise) {
      return this._connectPromise;
    }

    this._connectPromise = this.connectWithRetry()
      .then(async () => {
        // Only setup health check if not disabled and not in test environment
        if (!this._disableHealthCheck && NODE_ENV !== 'test') {
          this.setupHealthCheck();
        }

        // Mark as connected for the first time
        if (!this._hasBeenConnected) {
          this._hasBeenConnected = true;
        }

        this.emit('connected');
      })
      .catch(error => {
        this._connectPromise = null;
        const dbError = new DbConnectionError(
          'Failed to establish database connection',
          error instanceof Error ? error : new Error(String(error)),
        );
        this.emit('connection-failed', dbError);
        throw dbError;
      });

    return this._connectPromise;
  }

  public async close(): Promise<void> {
    this._isShuttingDown = true;

    // Always clear the health check interval first
    if (this._healthCheckInterval) {
      clearInterval(this._healthCheckInterval);
      this._healthCheckInterval = null;
    }

    if (this._dataContext?.isInitialized) {
      try {
        await this._dataContext.destroy();
        logger.info('Database connection closed successfully');
      } catch (error) {
        logger.error('Error closing database connection:', error);
        throw new DbConnectionError(
          'Failed to close database connection',
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }

    this._connectPromise = null;
    this.emit('disconnected');
  }

  public getDbContext(): DbContext {
    if (!this._dataContext) {
      throw new DbConnectionError('Database context not available');
    }
    return this._dataContext;
  }

  public isConnected(): boolean {
    return this._dataContext?.isInitialized ?? false;
  }

  public async gracefulShutdown(): Promise<void> {
    logger.info('Initiating graceful database shutdown...');
    try {
      await this.close();
      logger.info('Graceful database shutdown completed');
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      throw error;
    }
  }

  // Method to control health check for testing
  public setHealthCheckEnabled(enabled: boolean): void {
    this._disableHealthCheck = !enabled;
    if (!enabled && this._healthCheckInterval) {
      clearInterval(this._healthCheckInterval);
      this._healthCheckInterval = null;
    }
  }

  // Method to reset shutdown state for testing
  public resetShutdownState(): void {
    this._isShuttingDown = false;
  }

  private async connectWithRetry(retryCount = 0): Promise<void> {
    try {
      if (!this._dataContext.isInitialized) {
        await this._dataContext.initialize();
        // Don't reset _reconnectAttempts here - it will be reset in setupHealthCheck after successful health check
      }
    } catch (error) {
      if (retryCount < this._config.maxRetries && !this._isShuttingDown) {
        const delay = Math.min(
          this._config.initialDelayMs * Math.pow(this._config.factor, retryCount),
          this._config.maxDelayMs,
        );

        logger.warn(
          `Database connection failed. Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${this._config.maxRetries})`,
        );
        logger.error(`Connection error: ${error instanceof Error ? error.message : String(error)}`);

        await this.delay(delay);
        return this.connectWithRetry(retryCount + 1);
      } else {
        const message = this._isShuttingDown
          ? 'Connection attempt aborted due to shutdown'
          : `Failed to connect to database after ${this._config.maxRetries} attempts`;

        logger.error(message);
        throw new DbConnectionError(message, error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  private setupHealthCheck(): void {
    if (this._healthCheckInterval) {
      clearInterval(this._healthCheckInterval);
    }

    this._healthCheckInterval = setInterval(async () => {
      if (this._isShuttingDown) {
        return;
      }

      try {
        await this.performHealthCheck();

        if (this._reconnectAttempts > 0) {
          logger.info('Database connection restored successfully');
          this._reconnectAttempts = 0;
          this.emit('connection-restored');
        }
      } catch (error) {
        await this.handleHealthCheckFailure(error);
      }
    }, this._config.healthCheckIntervalMs);
  }

  private async performHealthCheck(): Promise<void> {
    if (!this._dataContext.isInitialized) {
      throw new Error('Database connection not initialized');
    }

    await this._dataContext.query('SELECT 1');
  }

  private async handleHealthCheckFailure(error: unknown): Promise<void> {
    logger.warn('Database health check failed. Attempting to reconnect...');
    logger.error(`Health check error: ${error instanceof Error ? error.message : String(error)}`);

    this._reconnectAttempts++;
    this.emit('health-check-failed', error);

    if (this._reconnectAttempts >= this._config.maxReconnectAttempts) {
      logger.error(`Failed to reconnect to database after ${this._config.maxReconnectAttempts} attempts.`);
      this.emit('max-reconnection-attempts-reached', this._config.maxReconnectAttempts);

      // Stop health check interval when max attempts reached
      if (this._healthCheckInterval) {
        clearInterval(this._healthCheckInterval);
        this._healthCheckInterval = null;
      }
      return;
    }

    logger.warn(`Reconnection attempt ${this._reconnectAttempts}/${this._config.maxReconnectAttempts}`);
    this.emit('reconnection-attempt', this._reconnectAttempts);

    try {
      if (this._dataContext.isInitialized) {
        await this._dataContext.destroy();
      }
    } catch (closeError) {
      logger.error(
        `Error closing connection: ${closeError instanceof Error ? closeError.message : String(closeError)}`,
      );
    }

    this._connectPromise = null;

    try {
      await this.connect();
    } catch (reconnectError) {
      logger.error(
        `Failed to reconnect: ${reconnectError instanceof Error ? reconnectError.message : String(reconnectError)}`,
      );
      this.emit('reconnection-failed', reconnectError);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
