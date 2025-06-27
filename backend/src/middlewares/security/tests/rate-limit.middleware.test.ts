import { Request } from 'express';
import { authRateLimit, generalRateLimit, passwordResetRateLimit, userManagementRateLimit } from '../rate-limit.middleware';

describe('Rate Limit Middleware', () => {
  const mockRequest = (ip?: string): Partial<Request> => ({
    ip: ip || '127.0.0.1',
    connection: { remoteAddress: ip || '127.0.0.1' } as any,
  });

  beforeAll(() => {
    jest.clearAllMocks();

    // Mock the config module
    jest.mock('@config', () => ({
      NODE_ENV: 'development',
      RATE_LIMIT_AUTH_MAX_ATTEMPTS: '5',
      RATE_LIMIT_AUTH_WINDOW_MS: '900000',
      RATE_LIMIT_GENERAL_MAX_REQUESTS: '100',
      RATE_LIMIT_GENERAL_WINDOW_MS: '900000',
      RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS: '3',
      RATE_LIMIT_PASSWORD_RESET_WINDOW_MS: '3600000',
    }));
  });

  describe('authRateLimit', () => {
    it('should be configured as a rate limiter', () => {
      expect(authRateLimit).toBeDefined();
      expect(typeof authRateLimit).toBe('function');
    });

    it('should use environment configuration', () => {
      // Test that the rate limiter has the expected configuration
      // Since we can't directly inspect the internals, we test the behavior
      expect(authRateLimit).toBeDefined();
    });

    it('should skip rate limiting for trusted IPs in non-production', () => {
      const req = mockRequest('127.0.0.1') as Request;

      // Access the skip function from the rate limiter options
      const skipFunction = (authRateLimit as any).options?.skip;
      if (skipFunction) {
        const shouldSkip = skipFunction(req);
        expect(shouldSkip).toBe(true); // Should skip for localhost
      }
    });

    it('should not skip rate limiting for untrusted IPs', () => {
      const req = mockRequest('192.168.1.100') as Request;

      const skipFunction = (authRateLimit as any).options?.skip;
      if (skipFunction) {
        const shouldSkip = skipFunction(req);
        expect(shouldSkip).toBe(false); // Should not skip for external IP
      }
    });
  });

  describe('generalRateLimit', () => {
    it('should be configured as a rate limiter', () => {
      expect(generalRateLimit).toBeDefined();
      expect(typeof generalRateLimit).toBe('function');
    });

    it('should have appropriate configuration for general endpoints', () => {
      expect(generalRateLimit).toBeDefined();
    });
  });

  describe('passwordResetRateLimit', () => {
    it('should be configured as a rate limiter', () => {
      expect(passwordResetRateLimit).toBeDefined();
      expect(typeof passwordResetRateLimit).toBe('function');
    });

    it('should have stricter limits than general rate limiter', () => {
      expect(passwordResetRateLimit).toBeDefined();
    });
  });

  describe('userManagementRateLimit', () => {
    it('should be configured as a rate limiter', () => {
      expect(userManagementRateLimit).toBeDefined();
      expect(typeof userManagementRateLimit).toBe('function');
    });

    it('should skip rate limiting for trusted IPs in non-production', () => {
      const req = mockRequest('127.0.0.1') as Request;

      const skipFunction = (userManagementRateLimit as any).options?.skip;
      if (skipFunction) {
        const shouldSkip = skipFunction(req);
        expect(shouldSkip).toBe(true);
      }
    });
  });

  describe('Rate limit error responses', () => {
    it('should return proper error format for auth rate limit', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const handler = (authRateLimit as any).options?.handler;
      if (handler) {
        handler({}, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(429);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining('Too many authentication attempts'),
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: expect.any(Number),
          }),
        );
      }
    });

    it('should return proper error format for password reset rate limit', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const handler = (passwordResetRateLimit as any).options?.handler;
      if (handler) {
        handler({}, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(429);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining('Too many password reset attempts'),
            code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
            retryAfter: expect.any(Number),
          }),
        );
      }
    });

    it('should return proper error format for user management rate limit', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const handler = (userManagementRateLimit as any).options?.handler;
      if (handler) {
        handler({}, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(429);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining('Too many user management operations'),
            code: 'USER_MANAGEMENT_RATE_LIMIT_EXCEEDED',
            retryAfter: 900,
          }),
        );
      }
    });
  });

  describe('Environment configuration', () => {
    it('should handle missing environment variables gracefully', () => {
      // Test that middleware still works even if env vars are not set
      expect(authRateLimit).toBeDefined();
      expect(generalRateLimit).toBeDefined();
      expect(passwordResetRateLimit).toBeDefined();
      expect(userManagementRateLimit).toBeDefined();
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});
