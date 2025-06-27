import { NODE_ENV } from '@config';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

// Main helmet middleware
const helmetMiddleware = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for development
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  // Prevent browsers from MIME-sniffing
  noSniff: true,

  // Set X-Frame-Options to DENY to prevent clickjacking
  frameguard: { action: 'deny' },

  // Hide powered-by header
  hidePoweredBy: true,

  // Set HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // Prevent IE from executing downloads in site's context
  ieNoOpen: true,

  // Set X-Permitted-Cross-Domain-Policies for Adobe Flash/PDF
  permittedCrossDomainPolicies: false,

  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // Cross-Origin-Embedder-Policy
  crossOriginEmbedderPolicy: NODE_ENV === 'production',

  // Cross-Origin-Opener-Policy
  crossOriginOpenerPolicy: { policy: 'same-origin' },

  // Cross-Origin-Resource-Policy
  crossOriginResourcePolicy: { policy: 'same-origin' },

  // Origin-Agent-Cluster
  originAgentCluster: true,
});

// Combined security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // First run helmet
  helmetMiddleware(req, res, (err?: any) => {
    if (err) {
      return next(err);
    }

    // Then add additional headers
    try {
      // Set X-XSS-Protection (removed from helmet 8.x as it's deprecated)
      res.setHeader('X-XSS-Protection', '1; mode=block');

      // Set Permissions-Policy to restrict dangerous features
      res.setHeader(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()',
      );

      // DNS prefetch control
      res.setHeader('X-DNS-Prefetch-Control', 'off');
    } catch (error) {
      // If setting headers fails, log but don't break the middleware chain
      console.warn('Failed to set additional security headers:', error);
    }

    next();
  });
};
