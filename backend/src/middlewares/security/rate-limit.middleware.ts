import rateLimit from 'express-rate-limit';
import {
  NODE_ENV,
  RATE_LIMIT_AUTH_MAX_ATTEMPTS,
  RATE_LIMIT_AUTH_WINDOW_MS,
  RATE_LIMIT_GENERAL_MAX_REQUESTS,
  RATE_LIMIT_GENERAL_WINDOW_MS,
  RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS,
  RATE_LIMIT_PASSWORD_RESET_WINDOW_MS,
  RATE_LIMIT_USER_MANAGEMENT_MAX_REQUESTS,
  RATE_LIMIT_USER_MANAGEMENT_WINDOW_MS,
} from '@config';

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: Number(RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max:
    NODE_ENV === 'production' ? Number(RATE_LIMIT_AUTH_MAX_ATTEMPTS) || 5 : Number(RATE_LIMIT_AUTH_MAX_ATTEMPTS) || 10, // Use env values or fallback
  message: {
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.floor((Number(RATE_LIMIT_AUTH_WINDOW_MS) || 900000) / 1000), // window in seconds
    });
  },
  skip: req => {
    if (NODE_ENV === 'test') {
      return false; // Always apply rate limiting in production and other environments
    }

    if (NODE_ENV !== 'production') {
      const trustedIPs = ['127.0.0.1', '::1', 'localhost'];
      const clientIP = req.ip || req.connection.remoteAddress || '';
      return trustedIPs.some(ip => clientIP.includes(ip));
    }

    return false;
  },
});

// More permissive rate limiting for general API endpoints
export const generalRateLimit = rateLimit({
  windowMs: Number(RATE_LIMIT_GENERAL_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max:
    NODE_ENV === 'production'
      ? Number(RATE_LIMIT_GENERAL_MAX_REQUESTS) || 100
      : Number(RATE_LIMIT_GENERAL_MAX_REQUESTS) || 1000, // Use env values or fallback
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.floor((Number(RATE_LIMIT_GENERAL_WINDOW_MS) || 900000) / 1000), // window in seconds
    });
  },
  skip: req => {
    if (NODE_ENV === 'test') {
      return false; // Always apply rate limiting in production and other environments
    }

    if (NODE_ENV !== 'production') {
      const trustedIPs = ['127.0.0.1', '::1', 'localhost'];
      const clientIP = req.ip || req.connection.remoteAddress || '';
      return trustedIPs.some(ip => clientIP.includes(ip));
    }

    return false;
  },
});

// Strict rate limiting for password reset endpoints
export const passwordResetRateLimit = rateLimit({
  windowMs: Number(RATE_LIMIT_PASSWORD_RESET_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
  max:
    NODE_ENV === 'production'
      ? Number(RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS) || 3
      : Number(RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS) || 10, // Very strict: only 3 password reset attempts per hour in production
  message: {
    error: 'Too many password reset attempts from this IP, please try again after 1 hour.',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many password reset attempts from this IP, please try again after 1 hour.',
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.floor((Number(RATE_LIMIT_PASSWORD_RESET_WINDOW_MS) || 3600000) / 1000), // window in seconds
    });
  },
  skip: req => {
    if (NODE_ENV === 'test') {
      return false; // Always apply rate limiting in production and other environments
    }

    if (NODE_ENV !== 'production') {
      const trustedIPs = ['127.0.0.1', '::1', 'localhost'];
      const clientIP = req.ip || req.connection.remoteAddress || '';
      return trustedIPs.some(ip => clientIP.includes(ip));
    }

    return false;
  },
});

// Rate limiting for user management endpoints (create, update, delete users)
export const userManagementRateLimit = rateLimit({
  windowMs: Number(RATE_LIMIT_USER_MANAGEMENT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max:
    NODE_ENV === 'production'
      ? Number(RATE_LIMIT_USER_MANAGEMENT_MAX_REQUESTS) || 20
      : Number(RATE_LIMIT_USER_MANAGEMENT_MAX_REQUESTS) || 100, // Use env values or fallback
  message: {
    error: 'Too many user management operations from this IP, please try again later.',
    code: 'USER_MANAGEMENT_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many user management operations from this IP, please try again later.',
      code: 'USER_MANAGEMENT_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.floor((Number(RATE_LIMIT_USER_MANAGEMENT_WINDOW_MS) || 900000) / 1000), // window in seconds
    });
  },
  skip: req => {
    if (NODE_ENV === 'test') {
      return false; // Always apply rate limiting in production and other environments
    }

    if (NODE_ENV !== 'production') {
      const trustedIPs = ['127.0.0.1', '::1', 'localhost'];
      const clientIP = req.ip || req.connection.remoteAddress || '';
      return trustedIPs.some(ip => clientIP.includes(ip));
    }

    return false;
  },
});
