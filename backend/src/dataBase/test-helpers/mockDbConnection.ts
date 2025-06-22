import { IDbConnection } from '../dbConnection';
import { DbConnectionManager } from '../dbConnectionManager';

/**
 * Mock implementation of IDbConnection for testing
 */
export class MockDbConnection implements IDbConnection {
  private _isConnected = false;

  // EventEmitter methods (simplified for testing)
  public on = jest.fn();
  public off = jest.fn();
  public emit = jest.fn();
  public once = jest.fn();
  public addListener = jest.fn();
  public removeListener = jest.fn();
  public removeAllListeners = jest.fn();
  public setMaxListeners = jest.fn();
  public getMaxListeners = jest.fn();
  public listeners = jest.fn();
  public rawListeners = jest.fn();
  public listenerCount = jest.fn();
  public prependListener = jest.fn();
  public prependOnceListener = jest.fn();
  public eventNames = jest.fn();

  constructor(private mockDbContext: any) {}

  public async connect(): Promise<void> {
    this._isConnected = true;
  }

  public async close(): Promise<void> {
    this._isConnected = false;
  }

  public getDbContext(): any {
    return this.mockDbContext;
  }

  public isConnected(): boolean {
    return this._isConnected;
  }

  public async gracefulShutdown(): Promise<void> {
    await this.close();
  }
}

/**
 * Set up mock database connection for tests
 */
export const setupMockDbConnection = (mockDbContext: any): MockDbConnection => {
  const mockConnection = new MockDbConnection(mockDbContext);
  DbConnectionManager.setConnectionForTesting(mockConnection);
  return mockConnection;
};

/**
 * Reset database connection manager after tests
 */
export const resetDbConnection = (): void => {
  DbConnectionManager.reset();
};
