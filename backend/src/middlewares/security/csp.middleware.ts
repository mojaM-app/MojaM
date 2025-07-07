import { SECURITY_CSP_REPORT_URI } from '@config';
import { DatabaseLoggerService, ILogMetadata } from '@core';
import type { NextFunction, Request, Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';

/**
 * Content Security Policy middleware
 * Implements strict CSP headers to prevent XSS attacks
 */
export const contentSecurityPolicy = (req: Request, res: Response, next: NextFunction): void => {
  const reportUri = SECURITY_CSP_REPORT_URI ?? '/security/csp-report';

  // CSP directives for API endpoints
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    `report-uri ${reportUri}`,
    'upgrade-insecure-requests',
  ].join('; ');

  res.setHeader('Content-Security-Policy', cspDirectives);
  next();
};

/**
 * CSP violation report handler
 */
export const cspReportHandler = (req: Request, res: Response): void => {
  const report = req.body;
  const logger = Container.get(DatabaseLoggerService);

  logger.warn('CSP Violation Report', {
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip,
    additionalData: report,
  } satisfies ILogMetadata);

  res.status(StatusCode.SuccessNoContent).end();
};
