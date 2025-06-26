import { logger } from '@core';
import { NextFunction, Request, Response } from 'express';
import { getRequestId } from './request-id.middleware';

interface SecurityLogData {
  event: string;
  ip: string;
  requestId?: string;
  userAgent?: string;
  path: string;
  method: string;
  timestamp: Date;
  userId?: string;
  email?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  additionalData?: Record<string, any>;
}

export class SecurityLogger {
  private static logSecurityEvent(data: SecurityLogData): void {
    const logMessage = `SECURITY_EVENT: ${data.event} | IP: ${data.ip} | RequestID: ${data.requestId || 'unknown'} | Path: ${data.path} | Method: ${data.method}`;
    const logData = {
      event: data.event,
      ip: data.ip,
      requestId: data.requestId,
      userAgent: data.userAgent,
      path: data.path,
      method: data.method,
      timestamp: data.timestamp,
      userId: data.userId,
      email: data.email,
      severity: data.severity,
      ...data.additionalData,
    };

    switch (data.severity) {
      case 'critical':
        logger.error(logMessage, logData);
        break;
      case 'high':
        logger.warn(logMessage, logData);
        break;
      case 'medium':
        logger.info(logMessage, logData);
        break;
      case 'low':
      default:
        logger.debug(logMessage, logData);
        break;
    }
  }

  public static logFailedLogin(req: Request, email?: string, reason?: string): void {
    this.logSecurityEvent({
      event: 'FAILED_LOGIN_ATTEMPT',
      ip: req.ip || 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      email,
      severity: 'high',
      additionalData: { reason },
    });
  }

  public static logSuccessfulLogin(req: Request, userId: string, email: string): void {
    this.logSecurityEvent({
      event: 'SUCCESSFUL_LOGIN',
      ip: req.ip || 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      userId,
      email,
      severity: 'low',
    });
  }

  public static logAccountLockout(req: Request, userId: string, email: string): void {
    this.logSecurityEvent({
      event: 'ACCOUNT_LOCKOUT',
      ip: req.ip || 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      userId,
      email,
      severity: 'critical',
    });
  }

  public static logPasswordReset(req: Request, email: string): void {
    this.logSecurityEvent({
      event: 'PASSWORD_RESET_REQUEST',
      ip: req.ip || 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      email,
      severity: 'medium',
    });
  }

  public static logSuspiciousActivity(req: Request, reason: string, additionalData?: Record<string, any>): void {
    this.logSecurityEvent({
      event: 'SUSPICIOUS_ACTIVITY',
      ip: req.ip || 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      severity: 'high',
      additionalData: { reason, ...additionalData },
    });
  }

  public static logRateLimitExceeded(req: Request): void {
    this.logSecurityEvent({
      event: 'RATE_LIMIT_EXCEEDED',
      ip: req.ip || 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      severity: 'medium',
    });
  }

  public static logUnauthorizedAccess(req: Request, userId?: string): void {
    this.logSecurityEvent({
      event: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      ip: req.ip || 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      userId,
      severity: 'high',
    });
  }

  public static logTokenValidationFailure(req: Request, reason: string): void {
    this.logSecurityEvent({
      event: 'TOKEN_VALIDATION_FAILURE',
      ip: req.ip || 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      severity: 'high',
      additionalData: { reason },
    });
  }

  public static logUserManagementOperation(req: Request, operation: string, targetUserId?: string, performedBy?: string): void {
    this.logSecurityEvent({
      event: 'USER_MANAGEMENT_OPERATION',
      ip: req.ip || 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      userId: performedBy,
      severity: 'medium',
      additionalData: { operation, targetUserId },
    });
  }

  public static logPermissionEscalation(req: Request, userId: string, attemptedAction: string): void {
    this.logSecurityEvent({
      event: 'PERMISSION_ESCALATION_ATTEMPT',
      ip: req.ip || 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      userId,
      severity: 'critical',
      additionalData: { attemptedAction },
    });
  }

  public static logDataAccess(req: Request, userId: string, dataType: string, recordId?: string): void {
    this.logSecurityEvent({
      event: 'SENSITIVE_DATA_ACCESS',
      ip: req.ip || 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      userId,
      severity: 'low',
      additionalData: { dataType, recordId },
    });
  }
}

// Middleware to log security events for requests
export const securityLoggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Log suspicious patterns
  const userAgent = req.get('User-Agent') || '';
  const path = req.path;

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
    SecurityLogger.logSuspiciousActivity(req, 'Potential attack pattern detected', {
      suspiciousPattern: true,
    });
  }

  // Check for excessively long requests
  if (path.length > 1000) {
    SecurityLogger.logSuspiciousActivity(req, 'Excessively long request path', {
      pathLength: path.length,
    });
  }

  next();
};
