import * as config from '@config';
import { logger } from '@core';
import { NextFunction, Request, Response } from 'express';
import { contentSecurityPolicy, cspReportHandler } from '../csp.middleware';

// Mock dependencies
jest.mock('@core', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock mockLogger.warn to avoid noise in tests
const mockLogger = logger as jest.Mocked<typeof logger>;

// Mock express types
const mockRequest = (body?: any, headers?: Record<string, string>): Partial<Request> => ({
  get: jest.fn().mockImplementation((name: string) => headers?.[name] || undefined) as any,
  ip: '127.0.0.1',
  body,
});

const mockResponse = (): Partial<Response> => ({
  setHeader: jest.fn(),
  status: jest.fn().mockReturnThis(),
  end: jest.fn(),
});

const mockNext = (): NextFunction => jest.fn();

describe('CSP Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('contentSecurityPolicy', () => {
    it('should set CSP header with default report URI', () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      contentSecurityPolicy(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Security-Policy', expect.stringContaining("default-src 'self'"));
      expect(res.setHeader).toHaveBeenCalledWith('Content-Security-Policy', expect.stringContaining('report-uri /security/csp-report'));
      expect(next).toHaveBeenCalled();
    });

    it('should use custom report URI from environment', () => {
      jest.replaceProperty(config, 'SECURITY_CSP_REPORT_URI', '/custom/csp-report');
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      contentSecurityPolicy(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Security-Policy', expect.stringContaining('report-uri /custom/csp-report'));
    });

    it('should include all required CSP directives', () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      contentSecurityPolicy(req, res, next);

      const cspHeaderCall = (res.setHeader as jest.Mock).mock.calls.find(call => call[0] === 'Content-Security-Policy');
      const cspValue = cspHeaderCall[1];

      expect(cspValue).toContain("default-src 'self'");
      expect(cspValue).toContain("script-src 'self'");
      expect(cspValue).toContain("style-src 'self' 'unsafe-inline'");
      expect(cspValue).toContain("frame-src 'none'");
      expect(cspValue).toContain("object-src 'none'");
      expect(cspValue).toContain('upgrade-insecure-requests');
    });
  });

  describe('cspReportHandler', () => {
    it('should log CSP violation and respond with 204', () => {
      const cspReport = {
        'csp-report': {
          'blocked-uri': 'eval',
          'document-uri': 'https://example.com',
          'violated-directive': 'script-src',
        },
      };

      const req = mockRequest(cspReport, { 'User-Agent': 'Test Browser' }) as Request;
      const res = mockResponse() as Response;

      cspReportHandler(req, res);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'CSP Violation Report:',
        expect.objectContaining({
          timestamp: expect.any(String),
          userAgent: 'Test Browser',
          ip: '127.0.0.1',
          report: cspReport,
        }),
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });

    it('should handle missing user agent', () => {
      const cspReport = { 'csp-report': { 'blocked-uri': 'eval' } };
      const req = mockRequest(cspReport) as Request;
      const res = mockResponse() as Response;

      cspReportHandler(req, res);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'CSP Violation Report:',
        expect.objectContaining({
          userAgent: undefined,
          report: cspReport,
        }),
      );
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});
