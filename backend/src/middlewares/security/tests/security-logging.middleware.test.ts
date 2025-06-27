import { logger } from '@core';
import { NextFunction, Request, Response } from 'express';
import { getRequestId } from '../request-id.middleware';
import { SecurityLogger, securityLoggingMiddleware } from '../security-logging.middleware';

// Mock dependencies
jest.mock('@core', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../request-id.middleware', () => ({
  getRequestId: jest.fn(),
}));

const mockLogger = logger as jest.Mocked<typeof logger>;
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

  describe('SecurityLogger', () => {
    describe('logFailedLogin', () => {
      it('should log failed login attempt with high severity', () => {
        const req = mockRequest() as Request;

        SecurityLogger.logFailedLogin({ req, email: 'test@example.com', reason: 'Invalid password' });
        expect(mockLogger.warn).toHaveBeenCalledWith(
          expect.stringContaining('FAILED_LOGIN_ATTEMPT'),
          expect.objectContaining({
            event: 'FAILED_LOGIN_ATTEMPT',
            ip: '127.0.0.1',
            requestId: 'test-request-id',
            email: 'test@example.com',
            severity: 'high',
            reason: 'Invalid password', // flattened from additionalData
          }),
        );
      });

      it('should handle missing email and reason', () => {
        const req = mockRequest() as Request;

        SecurityLogger.logFailedLogin({ req });
        expect(mockLogger.warn).toHaveBeenCalledWith(
          expect.stringContaining('FAILED_LOGIN_ATTEMPT'),
          expect.objectContaining({
            event: 'FAILED_LOGIN_ATTEMPT',
            email: undefined,
            reason: undefined, // flattened from additionalData
          }),
        );
      });
    });

    describe('logSuccessfulLogin', () => {
      it('should log successful login with low severity', () => {
        const req = mockRequest() as Request;

        SecurityLogger.logSuccessfulLogin({ req, userId: 'user123', email: 'test@example.com' });

        expect(mockLogger.debug).toHaveBeenCalledWith(
          expect.stringContaining('SUCCESSFUL_LOGIN'),
          expect.objectContaining({
            event: 'SUCCESSFUL_LOGIN',
            userId: 'user123',
            email: 'test@example.com',
            severity: 'low',
          }),
        );
      });
    });

    describe('logAccountLockout', () => {
      it('should log account lockout with critical severity', () => {
        const req = mockRequest() as Request;

        SecurityLogger.logAccountLockout({ req, userId: 'user123', email: 'test@example.com' });

        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('ACCOUNT_LOCKOUT'),
          expect.objectContaining({
            event: 'ACCOUNT_LOCKOUT',
            userId: 'user123',
            email: 'test@example.com',
            severity: 'critical',
          }),
        );
      });
    });

    describe('logPasswordReset', () => {
      it('should log password reset with medium severity', () => {
        const req = mockRequest() as Request;

        SecurityLogger.logPasswordReset({ req, email: 'test@example.com' });

        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('PASSWORD_RESET_REQUEST'),
          expect.objectContaining({
            event: 'PASSWORD_RESET_REQUEST',
            email: 'test@example.com',
            severity: 'medium',
          }),
        );
      });
    });

    describe('logSuspiciousActivity', () => {
      it('should log suspicious activity with high severity', () => {
        const req = mockRequest() as Request;
        const additionalData = { pattern: 'SQL injection attempt' };

        SecurityLogger.logSuspiciousActivity({ req, reason: 'Malicious request detected', additionalData });
        expect(mockLogger.warn).toHaveBeenCalledWith(
          expect.stringContaining('SUSPICIOUS_ACTIVITY'),
          expect.objectContaining({
            event: 'SUSPICIOUS_ACTIVITY',
            severity: 'high',
            reason: 'Malicious request detected', // flattened from additionalData
            pattern: 'SQL injection attempt', // flattened from additionalData
          }),
        );
      });

      it('should handle missing additional data', () => {
        const req = mockRequest() as Request;

        SecurityLogger.logSuspiciousActivity({ req, reason: 'Suspicious behavior' });
        expect(mockLogger.warn).toHaveBeenCalledWith(
          expect.stringContaining('SUSPICIOUS_ACTIVITY'),
          expect.objectContaining({
            reason: 'Suspicious behavior', // flattened from additionalData
          }),
        );
      });
    });

    describe('logRateLimitExceeded', () => {
      it('should log rate limit exceeded with medium severity', () => {
        const req = mockRequest() as Request;

        SecurityLogger.logRateLimitExceeded({ req });

        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('RATE_LIMIT_EXCEEDED'),
          expect.objectContaining({
            event: 'RATE_LIMIT_EXCEEDED',
            severity: 'medium',
          }),
        );
      });
    });

    describe('logUnauthorizedAccess', () => {
      it('should log unauthorized access with high severity', () => {
        const req = mockRequest() as Request;

        SecurityLogger.logUnauthorizedAccess({ req, userId: 'user123' });

        expect(mockLogger.warn).toHaveBeenCalledWith(
          expect.stringContaining('UNAUTHORIZED_ACCESS_ATTEMPT'),
          expect.objectContaining({
            event: 'UNAUTHORIZED_ACCESS_ATTEMPT',
            userId: 'user123',
            severity: 'high',
          }),
        );
      });

      it('should handle missing user ID', () => {
        const req = mockRequest() as Request;

        SecurityLogger.logUnauthorizedAccess({ req });

        expect(mockLogger.warn).toHaveBeenCalledWith(
          expect.stringContaining('UNAUTHORIZED_ACCESS_ATTEMPT'),
          expect.objectContaining({
            userId: undefined,
          }),
        );
      });
    });

    describe('logTokenValidationFailure', () => {
      it('should log token validation failure with high severity', () => {
        const req = mockRequest() as Request;

        SecurityLogger.logTokenValidationFailure({ req, reason: 'Invalid signature' });
        expect(mockLogger.warn).toHaveBeenCalledWith(
          expect.stringContaining('TOKEN_VALIDATION_FAILURE'),
          expect.objectContaining({
            event: 'TOKEN_VALIDATION_FAILURE',
            severity: 'high',
            reason: 'Invalid signature', // flattened from additionalData
          }),
        );
      });
    });

    describe('logUserManagementOperation', () => {
      it('should log user management operation with medium severity', () => {
        const req = mockRequest() as Request;

        SecurityLogger.logUserManagementOperation({
          req,
          operation: 'CREATE_USER',
          targetUserId: 'target123',
          performedBy: 'admin123',
        });
        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('USER_MANAGEMENT_OPERATION'),
          expect.objectContaining({
            event: 'USER_MANAGEMENT_OPERATION',
            userId: 'admin123',
            severity: 'medium',
            operation: 'CREATE_USER', // flattened from additionalData
            targetUserId: 'target123', // flattened from additionalData
          }),
        );
      });
    });

    describe('logPermissionEscalation', () => {
      it('should log permission escalation with critical severity', () => {
        const req = mockRequest() as Request;

        SecurityLogger.logPermissionEscalation({ req, userId: 'user123', attemptedAction: 'access_admin_panel' });
        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('PERMISSION_ESCALATION_ATTEMPT'),
          expect.objectContaining({
            event: 'PERMISSION_ESCALATION_ATTEMPT',
            userId: 'user123',
            severity: 'critical',
            attemptedAction: 'access_admin_panel', // flattened from additionalData
          }),
        );
      });
    });

    describe('logDataAccess', () => {
      it('should log data access with low severity', () => {
        const req = mockRequest() as Request;

        SecurityLogger.logDataAccess({ req, userId: 'user123', dataType: 'user_profile', recordId: 'record456' });
        expect(mockLogger.debug).toHaveBeenCalledWith(
          expect.stringContaining('SENSITIVE_DATA_ACCESS'),
          expect.objectContaining({
            event: 'SENSITIVE_DATA_ACCESS',
            userId: 'user123',
            severity: 'low',
            dataType: 'user_profile', // flattened from additionalData
            recordId: 'record456', // flattened from additionalData
          }),
        );
      });

      it('should handle missing record ID', () => {
        const req = mockRequest() as Request;

        SecurityLogger.logDataAccess({ req, userId: 'user123', dataType: 'user_profile' });
        expect(mockLogger.debug).toHaveBeenCalledWith(
          expect.stringContaining('SENSITIVE_DATA_ACCESS'),
          expect.objectContaining({
            dataType: 'user_profile', // flattened from additionalData
            recordId: undefined, // flattened from additionalData
          }),
        );
      });
    });
  });

  describe('securityLoggingMiddleware', () => {
    it('should detect path traversal attacks', () => {
      const req = mockRequest('/../admin') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      const logSpy = jest.spyOn(SecurityLogger, 'logSuspiciousActivity');

      securityLoggingMiddleware(req, res, next);

      expect(logSpy).toHaveBeenCalledWith({
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

      const logSpy = jest.spyOn(SecurityLogger, 'logSuspiciousActivity');

      securityLoggingMiddleware(req, res, next);

      expect(logSpy).toHaveBeenCalledWith({
        req,
        reason: 'Potential attack pattern detected',
        additionalData: { suspiciousPattern: true },
      });
    });

    it('should detect script injection attempts', () => {
      const req = mockRequest('/users?search=<script>alert(1)</script>') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      const logSpy = jest.spyOn(SecurityLogger, 'logSuspiciousActivity');

      securityLoggingMiddleware(req, res, next);

      expect(logSpy).toHaveBeenCalledWith({
        req,
        reason: 'Potential attack pattern detected',
        additionalData: { suspiciousPattern: true },
      });
    });

    it('should detect bot user agents', () => {
      const req = mockRequest('/users', 'GET', '127.0.0.1', 'Googlebot/2.1') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      const logSpy = jest.spyOn(SecurityLogger, 'logSuspiciousActivity');

      securityLoggingMiddleware(req, res, next);

      expect(logSpy).toHaveBeenCalledWith({
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

      const logSpy = jest.spyOn(SecurityLogger, 'logSuspiciousActivity');

      securityLoggingMiddleware(req, res, next);

      expect(logSpy).toHaveBeenCalledWith({
        req,
        reason: 'Excessively long request path',
        additionalData: { pathLength: longPath.length },
      });
    });

    it('should not log for normal requests', () => {
      const req = mockRequest('/users', 'GET', '127.0.0.1', 'Mozilla/5.0') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      const logSpy = jest.spyOn(SecurityLogger, 'logSuspiciousActivity');

      securityLoggingMiddleware(req, res, next);

      expect(logSpy).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should handle missing user agent', () => {
      const req = mockRequest('/users', 'GET', '127.0.0.1', '') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      const logSpy = jest.spyOn(SecurityLogger, 'logSuspiciousActivity');

      securityLoggingMiddleware(req, res, next);

      expect(logSpy).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Log message format', () => {
    it('should include request ID in log message', () => {
      const req = mockRequest() as Request;

      SecurityLogger.logFailedLogin({ req, email: 'test@example.com' });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('RequestID: test-request-id'),
        expect.any(Object),
      );
    });

    it('should handle unknown request ID', () => {
      mockGetRequestId.mockReturnValue('unknown');
      const req = mockRequest() as Request;

      SecurityLogger.logFailedLogin({ req, email: 'test@example.com' });

      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('RequestID: unknown'), expect.any(Object));
    });
  });
});
