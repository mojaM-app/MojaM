import { DbConnectionManager } from '@db';
import { HealthService } from './health.service';

jest.mock('@db');

describe('HealthService', () => {
  let healthService: HealthService;
  let mockDbConnection: any;

  beforeEach(() => {
    healthService = new HealthService();
    mockDbConnection = {
      getDbContext: jest.fn(),
      isConnected: jest.fn(),
    };
    (DbConnectionManager.getConnection as jest.Mock).mockReturnValue(mockDbConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHealthStatus', () => {
    it('should return minimal health status when database is connected', async () => {
      const mockDbContext = {
        isInitialized: true,
        query: jest.fn().mockResolvedValue([{ '1': 1 }]),
      };
      mockDbConnection.getDbContext.mockReturnValue(mockDbContext);

      const result = await healthService.getHealthStatus();

      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
      expect(result).not.toHaveProperty('uptime');
      expect(result).not.toHaveProperty('environment');
      expect(result).not.toHaveProperty('system');
    });

    it('should return degraded status when database is disconnected', async () => {
      const mockDbContext = {
        isInitialized: false,
      };
      mockDbConnection.getDbContext.mockReturnValue(mockDbContext);

      const result = await healthService.getHealthStatus();

      expect(result.status).toBe('degraded');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getSystemInfo', () => {
    it('should return comprehensive system info when database is connected', async () => {
      const mockDbContext = {
        isInitialized: true,
        query: jest
          .fn()
          .mockResolvedValueOnce([{ '1': 1 }])
          .mockResolvedValueOnce([{ version: '8.0.32' }]),
      };
      mockDbConnection.getDbContext.mockReturnValue(mockDbContext);

      const result = await healthService.getSystemInfo();

      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.environment).toBeDefined();
      expect(result.application).toBeDefined();
      expect(result.system).toBeDefined();
      expect(result.database.status).toBe('connected');
      expect(result.database.version).toBe('8.0.32');
      expect(mockDbContext.query).toHaveBeenCalledWith('SELECT 1');
      expect(mockDbContext.query).toHaveBeenCalledWith('SELECT VERSION() as version');
    });

    it('should return degraded status when database is disconnected', async () => {
      const mockDbContext = {
        isInitialized: false,
      };
      mockDbConnection.getDbContext.mockReturnValue(mockDbContext);

      const result = await healthService.getSystemInfo();

      expect(result.status).toBe('degraded');
      expect(result.database.status).toBe('disconnected');
    });

    it('should return degraded status when database query fails', async () => {
      const mockDbContext = {
        isInitialized: true,
        query: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      mockDbConnection.getDbContext.mockReturnValue(mockDbContext);

      const result = await healthService.getSystemInfo();

      expect(result.status).toBe('degraded');
      expect(result.database.status).toBe('error');
    });

    it('should include environment information', async () => {
      const mockDbContext = {
        isInitialized: true,
        query: jest.fn().mockResolvedValue([{ '1': 1 }]),
      };
      mockDbConnection.getDbContext.mockReturnValue(mockDbContext);

      const result = await healthService.getSystemInfo();

      expect(result.environment).toMatchObject({
        nodeVersion: expect.any(String),
        platform: expect.any(String),
        arch: expect.any(String),
        hostname: expect.any(String),
      });
    });

    it('should include application information', async () => {
      const mockDbContext = {
        isInitialized: true,
        query: jest.fn().mockResolvedValue([{ '1': 1 }]),
      };
      mockDbConnection.getDbContext.mockReturnValue(mockDbContext);

      const result = await healthService.getSystemInfo();

      expect(result.application).toMatchObject({
        name: expect.any(String),
        version: expect.any(String),
        port: expect.anything(),
        basePath: expect.any(String),
      });
    });

    it('should include system metrics', async () => {
      const mockDbContext = {
        isInitialized: true,
        query: jest.fn().mockResolvedValue([{ '1': 1 }]),
      };
      mockDbConnection.getDbContext.mockReturnValue(mockDbContext);

      const result = await healthService.getSystemInfo();

      expect(result.system.cpus).toBeGreaterThan(0);
      expect(result.system.totalMemory).toMatch(/MB|GB/);
      expect(result.system.freeMemory).toMatch(/MB|GB/);
      expect(result.system.memoryUsage).toBeDefined();
      expect(result.system.memoryUsage.rss).toMatch(/MB|GB/);
      expect(result.system.memoryUsage.heapTotal).toMatch(/MB|GB/);
      expect(result.system.memoryUsage.heapUsed).toMatch(/MB|GB/);
      expect(result.system.memoryUsage.external).toMatch(/MB|GB/);
      expect(Array.isArray(result.system.loadAverage)).toBe(true);
      expect(result.system.loadAverage).toHaveLength(3);
    });

    it('should handle null dbContext gracefully', async () => {
      mockDbConnection.getDbContext.mockReturnValue(null);

      const result = await healthService.getSystemInfo();

      expect(result.status).toBe('degraded');
      expect(result.database.status).toBe('disconnected');
    });

    it('should handle database version query failure gracefully', async () => {
      const mockDbContext = {
        isInitialized: true,
        query: jest
          .fn()
          .mockResolvedValueOnce([{ '1': 1 }])
          .mockRejectedValueOnce(new Error('Version query failed')),
      };
      mockDbConnection.getDbContext.mockReturnValue(mockDbContext);

      const result = await healthService.getSystemInfo();

      expect(result.status).toBe('healthy');
      expect(result.database.status).toBe('connected');
      expect(result.database.version).toBeUndefined();
    });
  });
});
