import { getRequestId } from '@middlewares';
import { type Request } from 'express';
import { Service } from 'typedi';
import { DatabaseLoggerService } from './database-logger.service';

interface ISecurityLogData {
  event: string;
  ip: string;
  requestId?: string;
  userAgent?: string;
  path: string;
  method: string;
  timestamp: Date;
  userId?: string;
  email?: string;
  phone?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  additionalData?: Record<string, any>;
}

@Service()
export class SecurityLoggerService {
  constructor(private readonly _databaseLogger: DatabaseLoggerService) {}

  private logSecurityEvent(data: ISecurityLogData): void {
    const logMessage = `SECURITY_EVENT: ${data.event} | IP: ${data.ip} | RequestID: ${data.requestId || 'unknown'} | Path: ${data.path} | Method: ${data.method}`;

    const metadata = {
      ipAddress: data.ip,
      requestId: data.requestId,
      userAgent: data.userAgent,
      path: data.path,
      method: data.method,
      userId: data.userId,
      severity: data.severity,
      source: 'security',
      additionalData: {
        event: data.event,
        email: data.email,
        phone: data.phone,
        timestamp: data.timestamp,
        ...data.additionalData,
      },
    };

    switch (data.severity) {
      case 'critical':
        this._databaseLogger.security('error', logMessage, metadata);
        break;
      case 'high':
        this._databaseLogger.security('warn', logMessage, metadata);
        break;
      case 'medium':
        this._databaseLogger.security('info', logMessage, metadata);
        break;
      case 'low':
      default:
        this._databaseLogger.security('debug', logMessage, metadata);
        break;
    }
  }

  public logFailedLogin({
    req,
    email,
    phone,
    reason,
  }: {
    req: Request;
    email?: string;
    phone?: string;
    reason?: string;
  }): void {
    this.logSecurityEvent({
      event: 'FAILED_LOGIN_ATTEMPT',
      ip: req.ip ?? 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      email,
      phone,
      severity: 'high',
      additionalData: { reason },
    });
  }

  public logSuccessfulLogin({
    req,
    userId,
    email,
    phone,
  }: {
    req: Request;
    userId: string;
    email: string;
    phone?: string;
  }): void {
    this.logSecurityEvent({
      event: 'SUCCESSFUL_LOGIN',
      ip: req.ip ?? 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      userId,
      email,
      phone,
      severity: 'low',
    });
  }

  public logAccountLockout({
    req,
    userId,
    email,
    phone,
  }: {
    req: Request;
    userId: string | undefined;
    email: string | undefined;
    phone?: string;
  }): void {
    this.logSecurityEvent({
      event: 'ACCOUNT_LOCKOUT',
      ip: req.ip ?? 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      userId,
      email,
      phone,
      severity: 'critical',
    });
  }

  public logPasswordReset({ req, email, phone }: { req: Request; email: string; phone?: string }): void {
    this.logSecurityEvent({
      event: 'PASSWORD_RESET_REQUEST',
      ip: req.ip ?? 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      email,
      phone,
      severity: 'medium',
    });
  }

  public logSuspiciousActivity({
    req,
    reason,
    additionalData,
  }: {
    req: Request;
    reason: string;
    additionalData?: Record<string, any>;
  }): void {
    this.logSecurityEvent({
      event: 'SUSPICIOUS_ACTIVITY',
      ip: req.ip ?? 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      severity: 'high',
      additionalData: { reason, ...additionalData },
    });
  }

  public logUnauthorizedAccess({ req, userId }: { req: Request; userId?: string }): void {
    this.logSecurityEvent({
      event: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      ip: req.ip ?? 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      userId,
      severity: 'high',
    });
  }

  public logTokenValidationFailure({ req, reason }: { req: Request; reason: string }): void {
    this.logSecurityEvent({
      event: 'TOKEN_VALIDATION_FAILURE',
      ip: req.ip ?? 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      severity: 'high',
      additionalData: { reason },
    });
  }

  public logUserManagementOperation({
    req,
    operation,
    targetUserId,
    performedBy,
  }: {
    req: Request;
    operation: string;
    targetUserId?: string;
    performedBy?: string;
  }): void {
    this.logSecurityEvent({
      event: 'USER_MANAGEMENT_OPERATION',
      ip: req.ip ?? 'unknown',
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

  public logPermissionEscalation({
    req,
    userId,
    attemptedAction,
  }: {
    req: Request;
    userId: string;
    attemptedAction: string;
  }): void {
    this.logSecurityEvent({
      event: 'PERMISSION_ESCALATION_ATTEMPT',
      ip: req.ip ?? 'unknown',
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

  public logDataAccess({
    req,
    userId,
    dataType,
    recordId,
  }: {
    req: Request;
    userId: string;
    dataType: string;
    recordId?: string;
  }): void {
    this.logSecurityEvent({
      event: 'SENSITIVE_DATA_ACCESS',
      ip: req.ip ?? 'unknown',
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

  public logError({ req, message, error }: { req: Request; message: string; error: unknown }): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logSecurityEvent({
      event: message,
      ip: req.ip ?? 'unknown',
      requestId: getRequestId(req),
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date(),
      severity: 'high',
      additionalData: { message: errorMessage },
    });
  }
}
