import { NextFunction, Request, Response } from 'express';
import { securityHeaders } from '../security-headers.middleware';

// Mock express types
const mockRequest = (): Partial<Request> => ({});

const mockResponse = (): Partial<Response> => ({
  setHeader: jest.fn(),
  removeHeader: jest.fn(),
});

const mockNext = (): NextFunction => jest.fn();

// Helper function to run all middleware in array
const runMiddlewareArray = async (middlewares: any[], req: Request, res: Response, next: NextFunction): Promise<void> => {
  for (const middleware of middlewares) {
    await new Promise<void>(resolve => {
      middleware(req, res, () => {
        resolve();
      });
    });
  }
  next();
};

describe('Security Headers Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set all required security headers', async () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    await runMiddlewareArray([securityHeaders], req, res, next);

    const setHeaderMock = res.setHeader as jest.Mock;
    const setHeaderCalls = setHeaderMock.mock.calls;

    // Check that all security headers are set
    const headerNames = setHeaderCalls.map(call => call[0]);

    expect(headerNames).toContain('X-Frame-Options');
    expect(headerNames).toContain('X-Content-Type-Options');
    expect(headerNames).toContain('X-XSS-Protection');
    expect(headerNames).toContain('Strict-Transport-Security');
    expect(headerNames).toContain('Referrer-Policy');
    expect(headerNames).toContain('X-DNS-Prefetch-Control');
    expect(headerNames).toContain('X-Download-Options');
    expect(headerNames).toContain('Permissions-Policy');

    expect(next).toHaveBeenCalled();
  });

  it('should set X-Frame-Options to DENY', async () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    await runMiddlewareArray([securityHeaders], req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
  });

  it('should set X-Content-Type-Options to nosniff', () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
  });

  it('should set X-XSS-Protection to block mode', () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
  });

  it('should set HSTS header with appropriate max-age', () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  });

  it('should set Referrer-Policy to strict-origin-when-cross-origin', () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
  });

  it('should disable DNS prefetching', () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-DNS-Prefetch-Control', 'off');
  });

  it('should set X-Download-Options for IE', () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Download-Options', 'noopen');
  });

  it('should set restrictive Permissions-Policy', () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Permissions-Policy', expect.stringContaining('camera=(), microphone=(), geolocation=()'));
  });

  it('should remove X-Powered-By header', () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    securityHeaders(req, res, next);

    expect(res.removeHeader).toHaveBeenCalledWith('X-Powered-By');
  });

  it('should call next() to continue middleware chain', () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    securityHeaders(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });
});
