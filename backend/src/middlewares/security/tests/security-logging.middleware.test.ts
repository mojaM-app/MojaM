import { NextFunction, Request, Response } from 'express';
import { getRequestId } from '../request-id.middleware';
import { SecurityLoggerService } from '../security-logger.service';
import { securityLoggingMiddleware } from '../security-logging.middleware';

jest.mock('../request-id.middleware', () => ({
  getRequestId: jest.fn(),
}));

jest.mock('@core/logger/database-logger.service', () => ({
  DatabaseLoggerService: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    security: jest.fn(),
  })),
}));

jest.mock('@core/logger/security-logger.service', () => ({
  SecurityLoggerService: jest.fn().mockImplementation(() => ({
    logSuspiciousActivity: jest.fn(),
    logFailedLogin: jest.fn(),
    logSuccessfulLogin: jest.fn(),
    logPasswordChange: jest.fn(),
    logUnauthorizedAccess: jest.fn(),
    logTokenValidationFailure: jest.fn(),
  })),
}));

// Mock Container.get to return our mocked SecurityLoggerService
const mockSecurityLoggerService = {
  logSuspiciousActivity: jest.fn(),
  logFailedLogin: jest.fn(),
  logSuccessfulLogin: jest.fn(),
  logPasswordChange: jest.fn(),
  logUnauthorizedAccess: jest.fn(),
  logTokenValidationFailure: jest.fn(),
};

jest.mock('typedi', () => ({
  Container: {
    get: jest.fn().mockImplementation(token => {
      if (token.name === 'SecurityLoggerService' || token === SecurityLoggerService) {
        return mockSecurityLoggerService;
      }
      return {};
    }),
  },
  Service:
    () =>
    (target: any): any =>
      target,
}));

const mockGetRequestId = getRequestId as jest.MockedFunction<typeof getRequestId>;

// Mock express types
const mockRequest = (
  path = '/test',
  method = 'GET',
  ip = '127.0.0.1',
  userAgent = 'Test Browser',
): Partial<Request> => ({
  path,
  method,
  ip,
  get: jest.fn().mockImplementation((name: string) => (name === 'User-Agent' ? userAgent : undefined)) as any,
});

const mockResponse = (): Partial<Response> => ({});
const mockNext = (): NextFunction => jest.fn();

describe('Security Logging Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRequestId.mockReturnValue('test-request-id');
  });

  describe('securityLoggingMiddleware', () => {
    it('should detect path traversal attacks', () => {
      const req = mockRequest('/../admin') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      securityLoggingMiddleware(req, res, next);

      expect(mockSecurityLoggerService.logSuspiciousActivity).toHaveBeenCalledWith({
        req,
        reason: 'Potential attack pattern detected',
        additionalData: { suspiciousPattern: true },
      });
      expect(next).toHaveBeenCalled();
    });

    it('should detect Windows path traversal attacks', () => {
      const req = mockRequest('/..\\admin') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      securityLoggingMiddleware(req, res, next);

      expect(mockSecurityLoggerService.logSuspiciousActivity).toHaveBeenCalledWith({
        req,
        reason: 'Potential attack pattern detected',
        additionalData: { suspiciousPattern: true },
      });
    });

    it('should detect script injection attempts', () => {
      const req = mockRequest('/users?search=<script>alert(1)</script>') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      securityLoggingMiddleware(req, res, next);

      expect(mockSecurityLoggerService.logSuspiciousActivity).toHaveBeenCalledWith({
        req,
        reason: 'Potential attack pattern detected',
        additionalData: { suspiciousPattern: true },
      });
    });

    it('should detect bot user agents', () => {
      const req = mockRequest('/users', 'GET', '127.0.0.1', 'Googlebot/2.1') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      securityLoggingMiddleware(req, res, next);

      expect(mockSecurityLoggerService.logSuspiciousActivity).toHaveBeenCalledWith({
        req,
        reason: 'Potential attack pattern detected',
        additionalData: { suspiciousPattern: true },
      });
    });

    it('should detect excessively long paths', () => {
      const longPath = '/' + 'a'.repeat(1000);
      const req = mockRequest(longPath) as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      securityLoggingMiddleware(req, res, next);

      expect(mockSecurityLoggerService.logSuspiciousActivity).toHaveBeenCalledWith({
        req,
        reason: 'Excessively long request path',
        additionalData: { pathLength: longPath.length },
      });
    });

    it('should not log for normal requests', () => {
      const req = mockRequest('/users', 'GET', '127.0.0.1', 'Mozilla/5.0') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      securityLoggingMiddleware(req, res, next);

      expect(mockSecurityLoggerService.logSuspiciousActivity).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should handle missing user agent', () => {
      const req = mockRequest('/users', 'GET', '127.0.0.1', '') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      securityLoggingMiddleware(req, res, next);

      expect(mockSecurityLoggerService.logSuspiciousActivity).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
});
