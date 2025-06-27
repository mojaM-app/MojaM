import { DbConnection } from './dbConnection';
import { DbConnectionManager } from './dbConnectionManager';

// Mock DbConnection class
jest.mock('./dbConnection');
jest.mock('./data-source', () => ({
  AppDataSource: {
    isInitialized: false,
    initialize: jest.fn(),
    destroy: jest.fn(),
    query: jest.fn(),
  },
}));

const MockedDbConnection = DbConnection as jest.MockedClass<typeof DbConnection>;

describe('DbConnectionManager', () => {
  let mockDbConnectionInstance: jest.Mocked<DbConnection>;

  beforeEach(() => {
    // Reset the singleton
    DbConnectionManager.reset();

    // Clear all mocks
    jest.clearAllMocks();

    // Create mock instance
    mockDbConnectionInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      getDbContext: jest.fn().mockReturnValue({ isInitialized: true }),
      isConnected: jest.fn().mockReturnValue(true),
      gracefulShutdown: jest.fn().mockResolvedValue(undefined),
      on: jest.fn().mockReturnThis(),
      emit: jest.fn().mockReturnValue(true),
      off: jest.fn().mockReturnThis(),
      once: jest.fn().mockReturnThis(),
    } as any;

    // Mock the constructor to return our mock instance
    MockedDbConnection.mockImplementation(() => mockDbConnectionInstance);
  });

  afterEach(() => {
    DbConnectionManager.reset();
  });

  it('should create a singleton connection through manager', () => {
    const connection1 = DbConnectionManager.getConnection();
    const connection2 = DbConnectionManager.getConnection();

    expect(connection1).toBe(connection2);
    expect(MockedDbConnection).toHaveBeenCalledTimes(1);
  });

  it('should provide access to database context through manager', () => {
    const dbContext = DbConnectionManager.getDbContext();

    expect(dbContext).toEqual({ isInitialized: true });
    expect(mockDbConnectionInstance.getDbContext).toHaveBeenCalledTimes(1);
  });

  it('should handle graceful shutdown', async () => {
    // Get connection first to initialize singleton
    DbConnectionManager.getConnection();

    await DbConnectionManager.gracefulShutdown();

    expect(mockDbConnectionInstance.gracefulShutdown).toHaveBeenCalledTimes(1);
  });

  it('should allow setting mock connection for testing', () => {
    const customMockConnection = {
      connect: jest.fn(),
      close: jest.fn(),
      getDbContext: jest.fn().mockReturnValue({ custom: true }),
      isConnected: jest.fn(),
      gracefulShutdown: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
    } as any;

    DbConnectionManager.setConnectionForTesting(customMockConnection);

    const connection = DbConnectionManager.getConnection();
    expect(connection).toBe(customMockConnection);

    const dbContext = DbConnectionManager.getDbContext();
    expect(dbContext).toEqual({ custom: true });
  });

  it('should reset singleton instance', () => {
    DbConnectionManager.getConnection();

    DbConnectionManager.reset();

    DbConnectionManager.getConnection();

    // Should create new instance after reset
    expect(MockedDbConnection).toHaveBeenCalledTimes(2);
  });

  it('should handle graceful shutdown when no connection exists', async () => {
    // Don't create connection, just call shutdown
    await expect(DbConnectionManager.gracefulShutdown()).resolves.not.toThrow();

    // Should not throw error when no connection exists
    expect(mockDbConnectionInstance.gracefulShutdown).not.toHaveBeenCalled();
  });
});
