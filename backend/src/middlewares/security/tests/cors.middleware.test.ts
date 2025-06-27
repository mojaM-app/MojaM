import { NextFunction, Request, Response } from 'express';
import { corsOptions } from '../cors.middleware';

// Mock express types
const mockRequest = (origin?: string, method?: string): Partial<Request> => ({
  headers: {
    origin,
    'access-control-request-method': method,
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

  it('should be defined as middleware function', () => {
    expect(corsOptions).toBeDefined();
    expect(typeof corsOptions).toBe('function');
  });

  it('should handle preflight requests', () => {
    const req = mockRequest('http://localhost:4200', 'OPTIONS') as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    corsOptions(req, res, next);

    // CORS middleware should set appropriate headers
    expect(res.setHeader).toHaveBeenCalled();
  });

  it('should handle simple requests', () => {
    const req = mockRequest('http://localhost:4200', 'GET') as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    corsOptions(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should allow configured origins', () => {
    // Mock environment variable
    const originalOrigin = process.env.ORIGIN;
    process.env.ORIGIN = 'http://localhost:4200';

    const req = mockRequest('http://localhost:4200', 'GET') as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    corsOptions(req, res, next);

    expect(next).toHaveBeenCalled();

    // Restore environment
    process.env.ORIGIN = originalOrigin;
  });

  it('should handle credentials', () => {
    // Mock environment variable
    const originalCredentials = process.env.CREDENTIALS;
    process.env.CREDENTIALS = 'true';

    const req = mockRequest('http://localhost:4200', 'GET') as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    corsOptions(req, res, next);

    expect(next).toHaveBeenCalled();

    // Restore environment
    process.env.CREDENTIALS = originalCredentials;
  });

  it('should handle different HTTP methods', () => {
    // Test non-OPTIONS methods (these should call next())
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    methods.forEach(method => {
      const req = mockRequest('http://localhost:4200', method) as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      corsOptions(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    // Test OPTIONS method separately (this might not call next due to preflight handling)
    const optionsReq = mockRequest('http://localhost:4200', 'OPTIONS') as Request;
    const optionsRes = mockResponse() as Response;
    const optionsNext = mockNext();

    corsOptions(optionsReq, optionsRes, optionsNext);

    // For OPTIONS requests, CORS middleware handles preflight and might not call next()
    // This is expected behavior when preflightContinue is false
    expect(optionsRes.setHeader).toHaveBeenCalled();
  });

  it('should handle requests without origin', () => {
    const req = mockRequest(undefined, 'GET') as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    corsOptions(req, res, next);

    // Should still call next even without origin
    expect(next).toHaveBeenCalled();
  });

  it('should handle common frontend development origins', () => {
    const commonOrigins = ['http://localhost:3000', 'http://localhost:4200', 'http://127.0.0.1:4200', 'https://localhost:4200'];

    commonOrigins.forEach(origin => {
      const req = mockRequest(origin, 'GET') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      corsOptions(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  it('should handle wildcard origin configuration', () => {
    // Mock environment variable
    const originalOrigin = process.env.ORIGIN;
    process.env.ORIGIN = '*';

    const req = mockRequest('https://example.com', 'GET') as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    corsOptions(req, res, next);

    expect(next).toHaveBeenCalled();

    // Restore environment
    process.env.ORIGIN = originalOrigin;
  });

  it('should handle custom headers in preflight requests', () => {
    const req = {
      ...mockRequest('http://localhost:4200', 'OPTIONS'),
      headers: {
        origin: 'http://localhost:4200',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type,authorization',
      },
    } as Request;

    const res = mockResponse() as Response;
    const next = mockNext();

    corsOptions(req, res, next);

    expect(res.setHeader).toHaveBeenCalled();
  });
});
