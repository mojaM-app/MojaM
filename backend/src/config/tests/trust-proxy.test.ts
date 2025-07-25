import * as config from '@config';
import request from 'supertest';
import { App } from '../../app';

describe('Trust Proxy Configuration', () => {
  describe('configureTrustProxy', () => {
    let app: App;

    beforeEach(() => {
      app = new App();
    });

    afterEach(async () => {
      await app.closeDbConnection();
      jest.restoreAllMocks();
    });

    it('should configure trust proxy based on environment variable', async () => {
      // Mock environment variable
      jest.replaceProperty(config, 'TRUST_PROXY', 'true');

      await app.initialize([]);
      const expressApp = app.getServer();

      // Check if trust proxy is enabled
      expect(expressApp.get('trust proxy')).toBe(true);
    });

    it('should default to true in production environment', async () => {
      // Mock production environment
      jest.replaceProperty(config, 'NODE_ENV', 'production');

      // Create new app instance after setting environment variable
      const prodApp = new App();
      await prodApp.initialize([]);
      const expressApp = prodApp.getServer();

      expect(expressApp.get('trust proxy')).toBe(true);

      await prodApp.closeDbConnection();
    });

    it('should default to false in development environment', async () => {
      // Mock development environment
      jest.replaceProperty(config, 'NODE_ENV', 'development');

      const devApp = new App();
      await devApp.initialize([]);
      const expressApp = devApp.getServer();

      expect(expressApp.get('trust proxy')).toBe(false);

      await devApp.closeDbConnection();
    });

    it('should handle custom trust proxy values', async () => {
      jest.replaceProperty(config, 'TRUST_PROXY', '127.0.0.1');

      await app.initialize([]);
      const expressApp = app.getServer();

      expect(expressApp.get('trust proxy')).toBe('127.0.0.1');
    });

    it('should correctly identify client IP when trust proxy is enabled', async () => {
      jest.replaceProperty(config, 'TRUST_PROXY', 'true');

      // Add a test route before initializing middleware
      const expressApp = app.getServer();
      expressApp.get('/test-ip', (req: any, res: any) => {
        res.json({ ip: req.ip });
      });

      await app.initialize([]);

      // Test with X-Forwarded-For header
      const response = await request(expressApp)
        .get('/test-ip')
        .set('X-Forwarded-For', '192.168.1.100, 10.0.0.1')
        .expect(200);

      // When trust proxy is enabled, Express should parse the X-Forwarded-For header
      expect(response.body.ip).toBe('192.168.1.100');
    });

    it('should not trust X-Forwarded-For when trust proxy is disabled', async () => {
      jest.replaceProperty(config, 'TRUST_PROXY', 'false');

      // Add a test route before initializing middleware
      const expressApp = app.getServer();
      expressApp.get('/test-ip-no-trust', (req: any, res: any) => {
        res.json({ ip: req.ip });
      });

      await app.initialize([]);

      // Test with X-Forwarded-For header
      const response = await request(expressApp)
        .get('/test-ip-no-trust')
        .set('X-Forwarded-For', '192.168.1.100, 10.0.0.1')
        .expect(200);

      // When trust proxy is disabled, Express should ignore X-Forwarded-For
      // and use the actual connection IP (typically ::1 or 127.0.0.1 in tests)
      expect(response.body.ip).not.toBe('192.168.1.100');
      expect(['::1', '127.0.0.1', '::ffff:127.0.0.1']).toContain(response.body.ip);
    });
  });
});
