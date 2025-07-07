import { type NextFunction, type Request, type Response } from 'express';
import { Container } from 'typedi';
import { SecurityLoggerService } from './../../core/logger/security-logger.service';

// Middleware to log security events for requests
export const securityLoggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Log suspicious patterns
  const userAgent = req.get('User-Agent') ?? '';
  const { path } = req;
  const securityLoggerService = Container.get(SecurityLoggerService);

  // Check for common attack patterns
  if (
    path.includes('../') ||
    path.includes('..\\') ||
    path.includes('script') ||
    path.includes('eval') ||
    userAgent.toLowerCase().includes('bot') ||
    userAgent.toLowerCase().includes('crawler') ||
    userAgent.toLowerCase().includes('scanner')
  ) {
    securityLoggerService.logSuspiciousActivity({
      req,
      reason: 'Potential attack pattern detected',
      additionalData: {
        suspiciousPattern: true,
      },
    });
  }

  // Check for excessively long requests
  if (path.length > 1000) {
    securityLoggerService.logSuspiciousActivity({
      req,
      reason: 'Excessively long request path',
      additionalData: {
        pathLength: path.length,
      },
    });
  }

  next();
};
