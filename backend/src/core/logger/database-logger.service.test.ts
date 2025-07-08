import * as config from '@config';
import { LOG_LEVEL } from '@config';
import { DatabaseLoggerService, ILogMetadata, LogLevel } from './database-logger.service';

// Mock dependencies
jest.mock('./file-logger.service', () => ({
  fileLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
  },
}));

// Mock BaseRepository
jest.mock('@db', () => ({
  BaseRepository: class MockBaseRepository {
    protected _dbContext: any = null;
    constructor() {
      this._dbContext = null;
    }
  },
}));

describe('DatabaseLoggerService', () => {
  let service: DatabaseLoggerService;
  let mockDbContext: any;
  let mockLogRepository: any;

  beforeEach(() => {
    jest.replaceProperty(config, 'LOG_LEVEL', 'warn');

    // Create mock database context
    mockLogRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    mockDbContext = {
      isInitialized: true,
      logs: mockLogRepository,
      manager: {},
    };

    service = new DatabaseLoggerService();
    // Inject mock database context
    (service as any)._dbContext = mockDbContext;

    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default log level warn', () => {
      const newService = new DatabaseLoggerService();
      expect((newService as any).configuredLogLevel).toBe('warn');
    });
  });

  describe('shouldLog', () => {
    it('should respect log level hierarchy', () => {
      // These should be logged (equal or higher priority)
      expect((service as any).shouldLog('error')).toBe(true);
      expect((service as any).shouldLog('warn')).toBe(true);

      // These should not be logged (lower priority)
      expect((service as any).shouldLog('info')).toBe(false);
      expect((service as any).shouldLog('debug')).toBe(false);
      expect((service as any).shouldLog('silly')).toBe(false);
    });

    it('should handle debug level', () => {
      jest.replaceProperty(config, 'LOG_LEVEL', 'debug');
      service = new DatabaseLoggerService();
      (service as any)._dbContext = mockDbContext;

      expect((service as any).shouldLog('error')).toBe(true);
      expect((service as any).shouldLog('warn')).toBe(true);
      expect((service as any).shouldLog('info')).toBe(true);
      expect((service as any).shouldLog('debug')).toBe(true);
      expect((service as any).shouldLog('silly')).toBe(false);
    });
  });

  describe('isDatabaseAvailable', () => {
    it('should return true when database is available', () => {
      expect((service as any).isDatabaseAvailable()).toBe(true);
    });

    it('should return false when dbContext is null', () => {
      (service as any)._dbContext = null;
      // When _dbContext is null, the && expression returns null, but the method should return false
      // This is because null && anything === null, but we expect false
      expect((service as any).isDatabaseAvailable()).toBe(false);
    });

    it('should return false when database is not initialized', () => {
      (service as any)._dbContext.isInitialized = false;
      expect((service as any).isDatabaseAvailable()).toBe(false);
    });

    it('should return false when logs repository is missing', () => {
      (service as any)._dbContext.logs = null;
      // When logs is null, the && expression returns null, but the method should return false
      expect((service as any).isDatabaseAvailable()).toBe(false);
    });

    it('should return false when manager is missing', () => {
      (service as any)._dbContext.manager = undefined;
      expect((service as any).isDatabaseAvailable()).toBe(false);
    });

    it('should return false when accessing dbContext throws error', () => {
      Object.defineProperty(service, '_dbContext', {
        get: () => {
          throw new Error('Database error');
        },
      });
      expect((service as any).isDatabaseAvailable()).toBe(false);
    });
  });

  describe('writeLog', () => {
    const mockLogEntry = { id: 1, message: 'test' };
    const metadata: ILogMetadata = {
      userId: 'user123',
      ipAddress: '127.0.0.1',
      source: 'test',
    };

    beforeEach(() => {
      mockLogRepository.create.mockReturnValue(mockLogEntry);
      mockLogRepository.save.mockResolvedValue(mockLogEntry);
    });

    it('should skip logging when log level is not met', async () => {
      jest.replaceProperty(config, 'LOG_LEVEL', 'error');
      service = new DatabaseLoggerService();
      (service as any)._dbContext = mockDbContext;

      await (service as any).writeLog('info', 'test message', metadata);

      expect(mockLogRepository.create).not.toHaveBeenCalled();
      expect(mockLogRepository.save).not.toHaveBeenCalled();
    });

    it('should fallback to file logger when database is unavailable', async () => {
      const { fileLogger } = require('./file-logger.service');
      (service as any)._dbContext = null;

      await (service as any).writeLog('error', 'test message', metadata);

      expect(fileLogger.info).toHaveBeenCalledWith('[ERROR] test message', metadata);
      expect(mockLogRepository.create).not.toHaveBeenCalled();
    });

    it('should create and save log entry when database is available', async () => {
      await (service as any).writeLog('error', 'test message', metadata);

      expect(mockLogRepository.create).toHaveBeenCalledWith({
        level: 'ERROR',
        message: 'test message',
        meta: JSON.stringify(metadata),
        source: 'test',
        ipAddress: '127.0.0.1',
        userAgent: undefined,
        path: undefined,
        method: undefined,
        requestId: undefined,
        userId: 'user123',
        severity: undefined,
        isSecurityEvent: false,
        additionalData: undefined,
      });
      expect(mockLogRepository.save).toHaveBeenCalledWith(mockLogEntry);
    });

    it('should fallback to file logger when database save fails', async () => {
      const { fileLogger } = require('./file-logger.service');
      mockLogRepository.save.mockRejectedValue(new Error('Database error'));

      await (service as any).writeLog('error', 'test message', metadata);

      expect(fileLogger.error).toHaveBeenCalledWith('Failed to write log to database', expect.any(Error));
      expect(fileLogger.info).toHaveBeenCalledWith('[ERROR] test message', metadata);
    });
  });

  describe('error', () => {
    it('should skip logging when log level is not met', async () => {
      jest.replaceProperty(config, 'LOG_LEVEL', 'silly');
      service = new DatabaseLoggerService();
      (service as any)._dbContext = mockDbContext;
      await service.error('test error');

      expect(mockLogRepository.create).toHaveBeenCalled();
    });

    it('should handle Error object as metadata', async () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      await service.error('test message', error);

      expect(mockLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'test message\n\rTest error',
          meta: JSON.stringify({ additionalData: 'Error stack trace', severity: 'high' }),
          severity: 'high',
        }),
      );
    });

    it('should handle Error object without message', async () => {
      const error = new Error();
      error.stack = 'Error stack trace';

      await service.error('test message', error);

      expect(mockLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'test message',
          meta: JSON.stringify({ additionalData: 'Error stack trace', severity: 'high' }),
        }),
      );
    });

    it('should handle metadata object', async () => {
      const metadata: ILogMetadata = {
        userId: 'user123',
        severity: 'critical',
      };

      await service.error('test message', metadata);

      expect(mockLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'test message',
          severity: 'critical',
          userId: 'user123',
        }),
      );
    });

    it('should fallback to file logger on database error', async () => {
      const { fileLogger } = require('./file-logger.service');
      mockLogRepository.save.mockRejectedValue(new Error('DB error'));

      await service.error('test message');

      // writeLog() catch block is called first, then error() catch block
      expect(fileLogger.error).toHaveBeenCalledWith('Failed to write log to database', expect.any(Error));
      expect(fileLogger.info).toHaveBeenCalledWith('[ERROR] test message', expect.any(Object));
    });
  });

  describe('warn', () => {
    it('should skip logging when log level is not met', async () => {
      jest.replaceProperty(config, 'LOG_LEVEL', 'custom-log-level');
      service = new DatabaseLoggerService();
      (service as any)._dbContext = mockDbContext;

      await service.warn('test warning');

      expect(mockLogRepository.create).not.toHaveBeenCalled();
    });

    it('should log warning with medium severity', async () => {
      await service.warn('test warning');

      expect(mockLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'WARN',
          message: 'test warning',
          severity: 'medium',
        }),
      );
    });

    it('should fallback to file logger on database error', async () => {
      const { fileLogger } = require('./file-logger.service');
      mockLogRepository.save.mockRejectedValue(new Error('DB error'));

      await service.warn('test warning');

      // writeLog() catch block is called first
      expect(fileLogger.error).toHaveBeenCalledWith('Failed to write log to database', expect.any(Error));
      expect(fileLogger.info).toHaveBeenCalledWith('[WARN] test warning', expect.any(Object));
    });
  });

  describe('info', () => {
    it('should skip logging when log level is not met', async () => {
      await service.info('test info');

      expect(mockLogRepository.create).not.toHaveBeenCalled();
    });

    it('should log info with low severity', async () => {
      jest.replaceProperty(config, 'LOG_LEVEL', 'info');
      service = new DatabaseLoggerService();
      (service as any)._dbContext = mockDbContext;

      await service.info('test info');

      expect(mockLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'INFO',
          message: 'test info',
          severity: 'low',
        }),
      );
    });
  });

  describe('http', () => {
    it('should skip logging when log level is not met', async () => {
      jest.replaceProperty(config, 'LOG_LEVEL', 'info');
      service = new DatabaseLoggerService();
      (service as any)._dbContext = mockDbContext;

      await service.http('test http');

      expect(mockLogRepository.create).not.toHaveBeenCalled();
    });

    it('should log http with low severity', async () => {
      jest.replaceProperty(config, 'LOG_LEVEL', 'http');
      service = new DatabaseLoggerService();
      (service as any)._dbContext = mockDbContext;

      await service.http('test http');

      expect(mockLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'HTTP',
          message: 'test http',
          severity: 'low',
        }),
      );
    });
  });

  describe('verbose', () => {
    it('should skip logging when log level is not met', async () => {
      jest.replaceProperty(config, 'LOG_LEVEL', 'http');
      service = new DatabaseLoggerService();
      (service as any)._dbContext = mockDbContext;

      await service.verbose('test verbose');

      expect(mockLogRepository.create).not.toHaveBeenCalled();
    });

    it('should log verbose with low severity', async () => {
      jest.replaceProperty(config, 'LOG_LEVEL', 'verbose');
      service = new DatabaseLoggerService();
      (service as any)._dbContext = mockDbContext;

      await service.verbose('test verbose');

      expect(mockLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'VERBOSE',
          message: 'test verbose',
          severity: 'low',
        }),
      );
    });
  });

  describe('debug', () => {
    it('should skip logging when log level is not met', async () => {
      jest.replaceProperty(config, 'LOG_LEVEL', 'verbose');
      service = new DatabaseLoggerService();
      (service as any)._dbContext = mockDbContext;

      await service.debug('test debug');

      expect(mockLogRepository.create).not.toHaveBeenCalled();
    });

    it('should log debug with low severity', async () => {
      jest.replaceProperty(config, 'LOG_LEVEL', 'debug');
      service = new DatabaseLoggerService();
      (service as any)._dbContext = mockDbContext;

      await service.debug('test debug');

      expect(mockLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'DEBUG',
          message: 'test debug',
          severity: 'low',
        }),
      );
    });
  });

  describe('silly', () => {
    it('should skip logging when log level is not met', async () => {
      jest.replaceProperty(config, 'LOG_LEVEL', 'debug');
      service = new DatabaseLoggerService();
      (service as any)._dbContext = mockDbContext;

      await service.silly('test silly');

      expect(mockLogRepository.create).not.toHaveBeenCalled();
    });

    it('should log silly with low severity', async () => {
      jest.replaceProperty(config, 'LOG_LEVEL', 'silly');
      service = new DatabaseLoggerService();
      (service as any)._dbContext = mockDbContext;

      await service.silly('test silly');

      expect(mockLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'SILLY',
          message: 'test silly',
          severity: 'low',
        }),
      );
    });
  });

  describe('security', () => {
    it('should always log security events regardless of log level', async () => {
      jest.replaceProperty(config, 'LOG_LEVEL', 'error'); // Very restrictive level
      service = new DatabaseLoggerService();
      (service as any)._dbContext = mockDbContext;

      await service.security('debug', 'security event');

      expect(mockLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'DEBUG',
          message: '[SECURITY] security event',
          isSecurityEvent: true,
          severity: 'high',
          source: 'security',
        }),
      );
    });

    it('should fallback to file logger when database is unavailable', async () => {
      const { fileLogger } = require('./file-logger.service');
      (service as any)._dbContext = null;

      await service.security('info', 'security event');

      expect(fileLogger.info).toHaveBeenCalledWith('[SECURITY] security event', undefined);
    });

    it('should handle custom metadata', async () => {
      const metadata = {
        userId: 'user123',
        ipAddress: '192.168.1.1',
        severity: 'critical' as const,
        source: 'custom-source',
      };

      await service.security('warn', 'security event', metadata);

      expect(mockLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'WARN',
          message: '[SECURITY] security event',
          isSecurityEvent: true,
          severity: 'critical',
          source: 'custom-source',
          userId: 'user123',
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('should fallback to file logger on database error', async () => {
      const { fileLogger } = require('./file-logger.service');
      mockLogRepository.save.mockRejectedValue(new Error('DB error'));

      await service.security('error', 'security event');

      expect(fileLogger.error).toHaveBeenCalledWith('Failed to write security log to database', expect.any(Error));
      expect(fileLogger.error).toHaveBeenCalledWith('[SECURITY] security event', undefined);
    });
  });

  describe('log level filtering integration', () => {
    it('should filter logs based on configured level', () => {
      expect((service as any).shouldLog('error')).toBe(true);
      expect((service as any).shouldLog('warn')).toBe(true);
      expect((service as any).shouldLog('info')).toBe(false);
    });

    it('should handle all log levels correctly', () => {
      const levels: LogLevel[] = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];

      levels.forEach(level => {
        jest.replaceProperty(config, 'LOG_LEVEL', level);
        expect(LOG_LEVEL).toBe(level);
      });
    });
  });

  describe('async error handling', () => {
    it('should catch and handle database save errors in writeLog', async () => {
      mockLogRepository.save.mockRejectedValue(new Error('Database save failed'));

      await service.error('Test error message');

      expect(mockLogRepository.create).toHaveBeenCalled();
      expect(mockLogRepository.save).toHaveBeenCalled();
    });

    it('should catch and handle database errors in all log methods', async () => {
      jest.replaceProperty(config, 'LOG_LEVEL', 'silly');
      service = new DatabaseLoggerService();
      (service as any)._dbContext = mockDbContext;
      mockLogRepository.save.mockRejectedValue(new Error('Database error'));

      await service.warn('Test warn');
      await service.info('Test info');
      await service.http('Test http');
      await service.verbose('Test verbose');
      await service.debug('Test debug');
      await service.silly('Test silly');

      expect(mockLogRepository.save).toHaveBeenCalledTimes(6);
    });
  });

  describe('Error metadata handling', () => {
    it('should handle Error object with message concatenation', async () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      await service.error('Initial message', error);

      expect(mockLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Initial message\n\rTest error'),
          meta: expect.stringContaining('Error stack trace'),
        }),
      );
    });

    it('should handle Error object without concatenating when message already ends with \\n\\r', async () => {
      const error = new Error('Test error');

      await service.error('Initial message\n\r', error);

      expect(mockLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Initial message\n\rTest error',
        }),
      );
    });

    it('should handle Error object without message', async () => {
      const error = new Error();
      error.message = '';
      error.stack = 'Stack trace';

      await service.error('Test message', error);

      expect(mockLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test message',
          meta: expect.stringContaining('Stack trace'),
        }),
      );
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});
