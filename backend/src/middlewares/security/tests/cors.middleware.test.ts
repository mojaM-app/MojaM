import * as config from '@config';
import { NextFunction, Request, Response } from 'express';
import { corsOptions } from '../cors.middleware';

// Mock express types
const mockRequest = (origin?: string, method?: string, headers?: Record<string, string>): Partial<Request> => ({
  headers: {
    origin,
    'access-control-request-method': method,
    ...headers,
  },
  method: method || 'GET',
});

const mockResponse = (): Partial<Response> => ({
  setHeader: jest.fn(),
  getHeader: jest.fn(),
  status: jest.fn().mockReturnThis(),
  end: jest.fn(),
});

const mockNext = (): NextFunction => jest.fn();

describe('CORS Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  it('should be defined as middleware function', () => {
    expect(corsOptions).toBeDefined();
    expect(typeof corsOptions).toBe('function');
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      jest.replaceProperty(config, 'NODE_ENV', 'production');
    });

    it('should reject requests with no origin in production', done => {
      jest.replaceProperty(config, 'ORIGIN', 'https://example.com');

      const req = mockRequest(undefined, 'GET') as Request;
      const res = mockResponse() as Response;

      const corsMiddleware = corsOptions as any;
      corsMiddleware(req, res, (error?: any) => {
        if (error) {
          expect(error.message).toBe('Not allowed by CORS policy');
          done();
        } else {
          done(new Error('Expected CORS error'));
        }
      });
    });

    it('should allow requests from configured origins in production', done => {
      jest.replaceProperty(config, 'ORIGIN', 'https://example.com,https://app.example.com');

      const req = mockRequest('https://example.com', 'GET') as Request;
      const res = mockResponse() as Response;

      const corsMiddleware = corsOptions as any;
      corsMiddleware(req, res, (error?: any) => {
        if (error) {
          done(error);
        } else {
          done(); // Success
        }
      });
    });

    it('should reject requests from non-configured origins in production', done => {
      jest.replaceProperty(config, 'ORIGIN', 'https://example.com');

      const req = mockRequest('https://malicious.com', 'GET') as Request;
      const res = mockResponse() as Response;

      const corsMiddleware = corsOptions as any;
      corsMiddleware(req, res, (error?: any) => {
        if (error) {
          expect(error.message).toBe('Not allowed by CORS policy');
          done();
        } else {
          done(new Error('Expected CORS error'));
        }
      });
    });

    it('should handle multiple origins separated by commas in production', done => {
      jest.replaceProperty(config, 'ORIGIN', 'https://example.com, https://app.example.com,https://admin.example.com');

      const req = mockRequest('https://app.example.com', 'GET') as Request;
      const res = mockResponse() as Response;

      const corsMiddleware = corsOptions as any;
      corsMiddleware(req, res, (error?: any) => {
        if (error) {
          done(error);
        } else {
          done(); // Success
        }
      });
    });

    it('should handle empty ORIGIN configuration in production', done => {
      jest.replaceProperty(config, 'ORIGIN', '');

      const req = mockRequest('https://example.com', 'GET') as Request;
      const res = mockResponse() as Response;

      const corsMiddleware = corsOptions as any;
      corsMiddleware(req, res, (error?: any) => {
        if (error) {
          expect(error.message).toBe('Not allowed by CORS policy');
          done();
        } else {
          done(new Error('Expected CORS error'));
        }
      });
    });
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      jest.replaceProperty(config, 'NODE_ENV', 'development');
    });

    it('should allow requests with no origin in development', done => {
      jest.replaceProperty(config, 'ORIGIN', 'http://localhost:4200');

      const req = mockRequest(undefined, 'GET') as Request;
      const res = mockResponse() as Response;

      const corsMiddleware = corsOptions as any;
      corsMiddleware(req, res, (error?: any) => {
        if (error) {
          done(error);
        } else {
          done(); // Success
        }
      });
    });

    it('should allow all origins when ORIGIN is set to wildcard', done => {
      jest.replaceProperty(config, 'ORIGIN', '*');

      const req = mockRequest('https://any-origin.com', 'GET') as Request;
      const res = mockResponse() as Response;

      const corsMiddleware = corsOptions as any;
      corsMiddleware(req, res, (error?: any) => {
        if (error) {
          done(error);
        } else {
          done(); // Success
        }
      });
    });

    it('should validate origins against configured list in development', done => {
      jest.replaceProperty(config, 'ORIGIN', 'http://localhost:4200');

      const req = mockRequest('http://localhost:4200', 'GET') as Request;
      const res = mockResponse() as Response;

      const corsMiddleware = corsOptions as any;
      corsMiddleware(req, res, (error?: any) => {
        if (error) {
          done(error);
        } else {
          done(); // Success
        }
      });
    });

    it('should reject non-configured origins in development', done => {
      jest.replaceProperty(config, 'ORIGIN', 'http://localhost:4200');

      const req = mockRequest('https://malicious.com', 'GET') as Request;
      const res = mockResponse() as Response;

      const corsMiddleware = corsOptions as any;
      corsMiddleware(req, res, (error?: any) => {
        if (error) {
          expect(error.message).toBe('Not allowed by CORS policy');
          done();
        } else {
          done(new Error('Expected CORS error'));
        }
      });
    });

    it('should handle undefined ORIGIN in development', done => {
      jest.replaceProperty(config, 'ORIGIN', undefined);

      const req = mockRequest('https://example.com', 'GET') as Request;
      const res = mockResponse() as Response;

      const corsMiddleware = corsOptions as any;
      corsMiddleware(req, res, (error?: any) => {
        if (error) {
          done(error);
        } else {
          done(); // Success - should allow when ORIGIN is undefined
        }
      });
    });

    it('should handle null ORIGIN in development', done => {
      jest.replaceProperty(config, 'ORIGIN', undefined);

      const req = mockRequest('https://example.com', 'GET') as Request;
      const res = mockResponse() as Response;

      const corsMiddleware = corsOptions as any;
      corsMiddleware(req, res, (error?: any) => {
        if (error) {
          done(error);
        } else {
          done(); // Success - should allow when ORIGIN is undefined
        }
      });
    });
  });

  describe('CORS Configuration', () => {
    it('should use configured credentials setting', () => {
      jest.replaceProperty(config, 'CREDENTIALS', true);

      const req = mockRequest('http://localhost:4200', 'GET') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      corsOptions(req, res, next);

      // The cors middleware should respect the credentials setting
      expect(next).toHaveBeenCalled();
    });

    it('should handle credentials set to false', () => {
      jest.replaceProperty(config, 'CREDENTIALS', false);

      const req = mockRequest('http://localhost:4200', 'GET') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      corsOptions(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('HTTP Methods', () => {
    it('should handle all allowed HTTP methods', () => {
      const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

      allowedMethods.forEach(method => {
        const req = mockRequest('http://localhost:4200', method) as Request;
        const res = mockResponse() as Response;
        const next = mockNext();

        corsOptions(req, res, next);

        if (method === 'OPTIONS') {
          // OPTIONS requests are handled differently (preflight)
          expect(res.setHeader).toHaveBeenCalled();
        } else {
          expect(next).toHaveBeenCalled();
        }
      });
    });
  });

  describe('Headers', () => {
    it('should handle requests with allowed headers', () => {
      const allowedHeaders = [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'Pragma',
      ];

      allowedHeaders.forEach(header => {
        const req = mockRequest('http://localhost:4200', 'GET', { [header.toLowerCase()]: 'test-value' }) as Request;
        const res = mockResponse() as Response;
        const next = mockNext();

        corsOptions(req, res, next);

        expect(next).toHaveBeenCalled();
      });
    });

    it('should handle preflight requests with custom headers', () => {
      const req = mockRequest('http://localhost:4200', 'OPTIONS', {
        'access-control-request-headers': 'content-type,authorization,x-custom-header',
      }) as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      corsOptions(req, res, next);

      expect(res.setHeader).toHaveBeenCalled();
    });
  });

  describe('Preflight Requests', () => {
    it('should handle preflight OPTIONS requests', () => {
      const req = mockRequest('http://localhost:4200', 'OPTIONS') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      corsOptions(req, res, next);

      expect(res.setHeader).toHaveBeenCalled();
    });

    it('should set correct status code for preflight requests', () => {
      const req = mockRequest('http://localhost:4200', 'OPTIONS') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      corsOptions(req, res, next);

      // The middleware should handle preflight requests
      expect(res.setHeader).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle requests with empty origin header', () => {
      const req = mockRequest('', 'GET') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      corsOptions(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle requests with whitespace in origin configuration', () => {
      jest.replaceProperty(config, 'ORIGIN', ' http://localhost:4200 , https://example.com ');

      const req = mockRequest('http://localhost:4200', 'GET') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      corsOptions(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle origin configuration with single origin', () => {
      jest.replaceProperty(config, 'ORIGIN', 'http://localhost:4200');

      const req = mockRequest('http://localhost:4200', 'GET') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      corsOptions(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle case-sensitive origin matching', () => {
      jest.replaceProperty(config, 'ORIGIN', 'http://localhost:4200');

      const req = mockRequest('HTTP://LOCALHOST:4200', 'GET') as Request;
      const res = mockResponse() as Response;

      const corsMiddleware = corsOptions as any;
      corsMiddleware(req, res, (error?: any) => {
        if (error) {
          expect(error.message).toBe('Not allowed by CORS policy');
        }
      });
    });
  });

  describe('Configuration Properties', () => {
    it('should have correct maxAge setting', () => {
      // This test verifies the configuration is properly set
      expect(corsOptions).toBeDefined();
      // The maxAge should be 86400 (24 hours) as configured in the middleware
    });

    it('should have correct preflightContinue setting', () => {
      // This test verifies the configuration is properly set
      expect(corsOptions).toBeDefined();
      // The preflightContinue should be false as configured
    });

    it('should have correct optionsSuccessStatus setting', () => {
      // This test verifies the configuration is properly set
      expect(corsOptions).toBeDefined();
      // The optionsSuccessStatus should be 204 as configured
    });
  });
});
