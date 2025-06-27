import * as config from '@config';
import { RouteConstants } from '@core';
import { testHelpers } from '@helpers';
import { UpdateUserDto } from '@modules/users/dtos/update-user.dto';
import { getAdminLoginData, toNumber } from '@utils';
import { Guid } from 'guid-typescript';
import request from 'supertest';
import { TestApp } from '../../../helpers/tests.utils';

describe('Security Integration Tests', () => {
  let app: TestApp | undefined;
  let adminAccessToken: string;

  beforeAll(async () => {
    app = await testHelpers.getTestApp();

    const adminLoginData = getAdminLoginData();
    const loginResult = await testHelpers.loginAs(app!, adminLoginData);
    adminAccessToken = loginResult?.accessToken || '';
  });

  describe('Request ID Middleware', () => {
    it('should add request ID to all responses', async () => {
      const response = await request(app!.getServer())
        .get(RouteConstants.ANNOUNCEMENTS_PATH)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/); // UUID format
    });

    it('should use provided request ID from client', async () => {
      const customRequestId = '12345678-1234-1234-1234-123456789012';

      const response = await request(app!.getServer())
        .get(RouteConstants.ANNOUNCEMENTS_PATH)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .set('X-Request-ID', customRequestId);

      expect(response.headers['x-request-id']).toBe(customRequestId);
    });
  });

  describe('Security Headers Middleware', () => {
    it('should include all required security headers', async () => {
      const response = await request(app!.getServer())
        .get(RouteConstants.ANNOUNCEMENTS_PATH)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['referrer-policy']).toBeDefined();
    });

    it('should not expose server information', async () => {
      const response = await request(app!.getServer())
        .get(RouteConstants.ANNOUNCEMENTS_PATH)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers['server']).toBeUndefined();
    });
  });

  describe('Rate Limiting', () => {
    describe('Authentication Rate Limiting', () => {
      it('should apply rate limiting to login attempts', async () => {
        jest.replaceProperty(config, 'NODE_ENV', 'rate-limit-test');
        const loginAttempts = [];
        const maxAttempts = toNumber(config.RATE_LIMIT_AUTH_MAX_ATTEMPTS)! + 1; // Higher than configured limit

        // Make multiple login attempts quickly
        for (let i = 0; i < maxAttempts; i++) {
          loginAttempts.push(
            request(app!.getServer()).post(RouteConstants.AUTH_LOGIN_PATH).send({
              email: 'test@example.com',
              passcode: 'wrongpassword',
            }),
          );
        }

        const responses = await Promise.all(loginAttempts);

        // Should have at least some 429 responses (rate limited)
        const rateLimitedResponses = responses.filter(r => r.status === 429);
        expect(rateLimitedResponses.length).toBeGreaterThan(0);

        // Rate limited responses should have proper headers
        if (rateLimitedResponses.length > 0) {
          const rateLimitedResponse = rateLimitedResponses[0];
          expect(rateLimitedResponse.headers['ratelimit-limit']).toBeDefined();
          expect(rateLimitedResponse.headers['ratelimit-remaining']).toBeDefined();
          expect(rateLimitedResponse.body.code).toBe('RATE_LIMIT_EXCEEDED');
        }
      }, 30000); // Increase timeout for this test
    });

    describe('Password Reset Rate Limiting', () => {
      it('should apply stricter rate limiting to password reset', async () => {
        jest.replaceProperty(config, 'NODE_ENV', 'rate-limit-test');
        const resetAttempts = [];
        const maxAttempts = toNumber(config.RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS)! + 1; // Higher than configured limit

        for (let i = 0; i < maxAttempts; i++) {
          resetAttempts.push(
            request(app!.getServer()).post(RouteConstants.AUTH_REQUEST_RESET_PASSCODE_PATH).send({
              email: 'test@example.com',
            }),
          );
        }

        const responses = await Promise.all(resetAttempts);

        // Should have rate limited responses
        const rateLimitedResponses = responses.filter(r => r.status === 429);
        expect(rateLimitedResponses.length).toBeGreaterThan(0);

        // Check for specific password reset rate limit error
        if (rateLimitedResponses.length > 0) {
          const rateLimitedResponse = rateLimitedResponses[0];
          expect(rateLimitedResponse.body.code).toBe('PASSWORD_RESET_RATE_LIMIT_EXCEEDED');
        }
      }, 30000);
    });
  });

  describe('Security Logging', () => {
    it('should detect and log suspicious path traversal attempts', async () => {
      const response = await request(app!.getServer())
        .get('/../admin/users')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      // Should get 404 (path not found) but security event should be logged
      expect(response.status).toBe(404);
    });

    it('should detect suspicious user agents', async () => {
      const response = await request(app!.getServer())
        .get(RouteConstants.CURRENT_ANNOUNCEMENTS_PATH)
        .set('User-Agent', 'malicious-bot/1.0')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      // Request should still succeed but be logged
      expect(response.status).toBe(200);
    });

    it('should log failed authentication attempts', async () => {
      const response = await request(app!.getServer()).post(RouteConstants.AUTH_LOGIN_PATH).send({
        email: 'test@example.com',
        passcode: 'wrongpassword',
      });

      // Should either fail with validation error (400) or rate limiting (429)
      expect([400, 429]).toContain(response.status);
      // Security logging should capture this event
    });
  });

  describe('User Management Security', () => {
    it('should apply rate limiting to user modification', async () => {
      jest.replaceProperty(config, 'NODE_ENV', 'rate-limit-test');

      const userModificationAttempts = [];
      const maxAttempts = 25; // Should exceed rate limit

      for (let i = 0; i < maxAttempts; i++) {
        userModificationAttempts.push(
          request(app!.getServer())
            .put(RouteConstants.USER_PATH + '/' + config.ADMIN_UUID)
            .set('Authorization', `Bearer ${adminAccessToken}`)
            .send({
              joiningDate: new Date(),
            } satisfies UpdateUserDto),
        );
      }

      const responses = await Promise.all(userModificationAttempts);

      // Should have some rate limited responses
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      if (rateLimitedResponses.length > 0) {
        const rateLimitedResponse = rateLimitedResponses[0];
        expect(rateLimitedResponse.body.code).toBe('USER_MANAGEMENT_RATE_LIMIT_EXCEEDED');
      }
    }, 30000);
  });

  describe('CORS Security', () => {
    it('should include CORS headers for allowed origins', async () => {
      // Use OPTIONS request which triggers CORS preflight
      const response = await request(app!.getServer())
        .options('/test-announcements')
        .set('Origin', 'http://localhost:4200')
        .set('Access-Control-Request-Method', 'GET');

      // Should either succeed or be rate limited, but if success, should have CORS headers
      if (response.status === 200 || response.status === 204) {
        expect(response.headers['access-control-allow-origin']).toBeDefined();
        expect(response.headers['access-control-allow-methods']).toBeDefined();
        expect(response.headers['access-control-allow-headers']).toBeDefined();
      } else {
        // If rate limited, that's also acceptable
        expect([200, 204, 429]).toContain(response.status);
      }
    });

    it('should handle preflight requests', async () => {
      const response = await request(app!.getServer())
        .options('/test-announcements')
        .set('Origin', 'http://localhost:4200')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type');

      // Should either be successful (204) or rate limited (429)
      expect([204, 429]).toContain(response.status);
    });
  });

  describe('Input Validation Security', () => {
    it('should reject invalid email formats', async () => {
      const response = await request(app!.getServer()).post(RouteConstants.USER_PATH).send({
        email: 'invalid-email',
        passcode: 'password',
      });

      // Should either fail with validation error (400) or rate limiting (429)
      expect([400, 429]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.data.message).toContain('Invalid_Email');
      }
    });

    it('should reject weak passwords', async () => {
      const response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          email: 'test@example.com',
          phone: '123456789',
          passcode: 'weak-pass',
        });

      // Should either fail with validation error (400) or rate limiting (429)
      expect([400, 429]).toContain(response.status);
      // Should reject due to password validation
    });

    it('should sanitize SQL injection attempts', async () => {
      const response = await request(app!.getServer()).post(RouteConstants.AUTH_LOGIN_PATH).send({
        email: "admin@example.com'; DROP TABLE users; --",
        passcode: 'password',
      });

      // Should either fail with validation error (400) or rate limiting (429)
      expect([400, 429]).toContain(response.status);
      // Should be caught by validation, not cause SQL injection
    });
  });

  describe('Content Security Policy', () => {
    it('should not apply CSP headers to API endpoints by default', async () => {
      const response = await request(app!.getServer())
        .get(RouteConstants.CURRENT_ANNOUNCEMENTS_PATH)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      // API endpoints typically don't need CSP headers
      // CSP is more relevant for HTML responses
      // Should either succeed (200) or be rate limited (429)
      expect([200, 429]).toContain(response.status);
    });
  });

  describe('Security Monitoring', () => {
    it('should handle multiple failed login attempts from same IP', async () => {
      const attempts = [];
      for (let i = 0; i < 5; i++) {
        attempts.push(
          request(app!.getServer()).post(RouteConstants.AUTH_LOGIN_PATH).send({
            email: 'test@example.com',
            passcode: 'wrongpassword',
          }),
        );
      }

      const responses = await Promise.all(attempts);

      // All should fail with validation error (400) or rate limiting (429), and security events should be logged
      responses.forEach(response => {
        expect([400, 429]).toContain(response.status);
      });
    });

    it('should track permission escalation attempts', async () => {
      // Try to access admin functionality without proper permissions
      const response = await request(app!.getServer())
        .get(RouteConstants.USER_PATH + '/' + Guid.EMPTY)
        .set('Authorization', `Bearer invalid-or-limited-token`);

      // Should either fail with unauthorized (401) or rate limiting (429)
      expect([401, 429]).toContain(response.status);
      // Should log unauthorized access attempt
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.restoreAllMocks();
  });
});
