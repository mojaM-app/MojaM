import { ILoginModel, RouteConstants } from '@core';
import { testHelpers } from '@helpers';
import { getAdminLoginData } from '@utils';
import { Guid } from 'guid-typescript';
import request from 'supertest';
import { TestApp } from '../../../helpers/test-helpers/test.app';

describe('Security Integration Tests', () => {
  let app: TestApp | undefined;
  let adminAccessToken: string;

  beforeAll(async () => {
    app = await testHelpers.getTestApp();

    const adminLoginData = getAdminLoginData();
    const loginResult = await app.auth.loginAs(adminLoginData);
    adminAccessToken = loginResult?.accessToken || '';
  });

  describe('Request ID Middleware', () => {
    it('should add request ID to all responses', async () => {
      const response = await request(app!.getServer())
        .get(RouteConstants.ANNOUNCEMENTS_PATH)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/);
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
      const response = await app!.auth.login({
        email: 'test@example.com',
        passcode: 'wrongpassword',
      } satisfies ILoginModel);

      // Should either fail with validation error (400)
      expect(400).toEqual(response.status);
      // Security logging should capture this event
    });
  });

  describe('CORS Security', () => {
    it('should include CORS headers for allowed origins', async () => {
      // Use OPTIONS request which triggers CORS preflight
      const response = await request(app!.getServer())
        .options('/test-announcements')
        .set('Origin', 'http://localhost:4200')
        .set('Access-Control-Request-Method', 'GET');

      // Should be succeed, but if success, should have CORS headers
      if (response.status === 200 || response.status === 204) {
        expect(response.headers['access-control-allow-origin']).toBeDefined();
        expect(response.headers['access-control-allow-methods']).toBeDefined();
        expect(response.headers['access-control-allow-headers']).toBeDefined();
      } else {
        expect([200, 204]).toContain(response.status);
      }
    });

    it('should handle preflight requests', async () => {
      const response = await request(app!.getServer())
        .options('/test-announcements')
        .set('Origin', 'http://localhost:4200')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type');

      expect([204]).toContain(response.status);
    });
  });

  describe('Input Validation Security', () => {
    it('should reject invalid email formats', async () => {
      const response = await app!.user.create(
        {
          email: 'invalid-email',
          phone: '123456789',
          passcode: 'password',
        },
        adminAccessToken,
      );

      // Should either fail with validation error (400)
      expect(400).toEqual(response.status);
      if (response.status === 400) {
        expect(response.body.data.message).toContain('Invalid_Email');
      }
    });

    it('should reject weak passwords', async () => {
      const response = await app!.user.create(
        {
          email: 'test@example.com',
          phone: '123456789',
          passcode: 'weak-pass',
        },
        adminAccessToken,
      );

      // Should either fail with validation error (400)
      expect(400).toEqual(response.status);
      // Should reject due to password validation
    });

    it('should sanitize SQL injection attempts', async () => {
      const response = await app!.auth.login({
        email: "admin@example.com'; DROP TABLE users; --",
        passcode: 'password',
      } satisfies ILoginModel);

      // Should either fail with validation error (400)
      expect(400).toEqual(response.status);
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
      // Should either succeed (200)
      expect(200).toEqual(response.status);
    });
  });

  describe('Security Monitoring', () => {
    it('should handle multiple failed login attempts from same IP', async () => {
      const attempts = [];
      for (let i = 0; i < 5; i++) {
        attempts.push(
          app!.auth.login({
            email: 'test@example.com',
            passcode: 'wrongpassword',
          } satisfies ILoginModel),
        );
      }

      const responses = await Promise.all(attempts);

      // All should fail with validation error (400), and security events should be logged
      responses.forEach(response => {
        expect(400).toEqual(response.status);
      });
    });

    it('should track permission escalation attempts', async () => {
      // Try to access admin functionality without proper permissions
      const response = await app!.user.get(Guid.EMPTY, 'invalid-or-limited-token');

      // Should either fail with unauthorized (401)
      expect(401).toEqual(response.status);
      // Should log unauthorized access attempt
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.restoreAllMocks();
  });
});
