import { logger } from '@modules/logger/logger.core';
import { AppDataSource } from './data-source';
import { DbContext } from './dbContext';

interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  factor: number;
}

export class DbConnection {
  // eslint-disable-next-line no-use-before-define
  private static instance: DbConnection | null = null;

  private readonly _dataContext: DbContext;
  private _connectPromise: Promise<void> | null = null;
  private _healthCheckInterval: NodeJS.Timeout | null = null;
  private _reconnectAttempts = 0;
  private readonly _healthCheckTimeMs = 30 * 60 * 1000; // 30 minutes

  // Default retry options
  private readonly _retryOptions: RetryOptions = {
    maxRetries: 5,
    initialDelayMs: 1000, // 1 second
    maxDelayMs: 30000, // 30 seconds
    factor: 2, // Exponential backoff factor
  };

  private constructor() {
    this._dataContext = AppDataSource;
  }

  public static getConnection(): DbConnection {
    if (DbConnection.instance === null) {
      DbConnection.instance = new DbConnection();
    }

    return DbConnection.instance;
  }

  public async connect(): Promise<void> {
    // If we're already connecting, return the existing promise
    if (this._connectPromise) {
      return this._connectPromise;
    }

    // Otherwise, create a new connection promise
    this._connectPromise = this._connectWithRetry();

    try {
      await this._connectPromise;
      this._setupHealthCheck();
    } catch (error) {
      this._connectPromise = null;
      throw error;
    }

    return this._connectPromise;
  }

  public async close(): Promise<void> {
    if (this._healthCheckInterval) {
      clearInterval(this._healthCheckInterval);
      this._healthCheckInterval = null;
    }

    if ((DbConnection.instance?._dataContext ?? null) !== null && DbConnection.instance!._dataContext.isInitialized) {
      await DbConnection.instance!._dataContext.destroy();
    }

    this._connectPromise = null;
    this._reconnectAttempts = 0;
  }

  public static getDbContext(): DbContext {
    const connection = DbConnection.getConnection();
    return connection._dataContext;
  }

  private async _connectWithRetry(retryCount = 0): Promise<void> {
    try {
      if ((DbConnection.instance?._dataContext ?? null) !== null && !DbConnection.instance!._dataContext.isInitialized) {
        await DbConnection.instance!._dataContext.initialize();
        this._reconnectAttempts = 0;
        logger.info('Database connection established successfully');
      }
    } catch (error) {
      if (retryCount < this._retryOptions.maxRetries) {
        const delay = Math.min(this._retryOptions.initialDelayMs * Math.pow(this._retryOptions.factor, retryCount), this._retryOptions.maxDelayMs);

        logger.warn(`Database connection failed. Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${this._retryOptions.maxRetries})`);
        logger.error(`Connection error: ${error instanceof Error ? error.message : String(error)}`);

        await new Promise(resolve => setTimeout(resolve, delay));
        return this._connectWithRetry(retryCount + 1);
      } else {
        logger.error(`Failed to connect to database after ${this._retryOptions.maxRetries} attempts`);
        throw error;
      }
    }
  }

  private _setupHealthCheck(): void {
    if (this._healthCheckInterval) {
      clearInterval(this._healthCheckInterval);
    }

    this._healthCheckInterval = setInterval(async () => {
      try {
        if (this._dataContext.isInitialized) {
          await this._dataContext.query('SELECT 1');
        } else {
          logger.warn('Database connection lost. Attempting to reconnect...');
          this._connectPromise = null;
          this._reconnectAttempts++;

          if (this._reconnectAttempts > 10) {
            logger.error('Failed to reconnect to database after multiple attempts. Exiting...');
            process.exit(1);
          }

          await this.connect();
        }
      } catch (error) {
        logger.warn('Database health check failed. Attempting to reconnect...');
        logger.error(`Health check error: ${error instanceof Error ? error.message : String(error)}`);

        try {
          if (this._dataContext.isInitialized) {
            await this._dataContext.destroy();
          }
        } catch (closeError) {
          logger.error(`Error closing connection: ${closeError instanceof Error ? closeError.message : String(closeError)}`);
        }

        this._connectPromise = null;
        this._reconnectAttempts++;

        await this.connect().catch(e => {
          logger.error(`Failed to reconnect: ${e instanceof Error ? e.message : String(e)}`);

          if (this._reconnectAttempts > 10) {
            logger.error('Failed to reconnect to database after multiple attempts. Exiting...');
            process.exit(1);
          }
        });
      }
    }, this._healthCheckTimeMs);
  }
}
