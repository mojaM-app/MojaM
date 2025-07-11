import { CREDENTIALS, NODE_ENV, ORIGIN } from '@config';
import cors from 'cors';

// Enhanced CORS configuration with security hardening
export const corsOptions = cors({
  origin: (origin, callback) => {
    // In production, strictly validate origins
    if (NODE_ENV === 'production') {
      const allowedOrigins = ORIGIN?.split(',').map(o => o.trim()) || [];

      // In production, reject requests with no origin
      if (!origin) {
        return callback(new Error('Not allowed by CORS policy'));
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS policy'));
      }
    } else {
      // In development, be more permissive but still validate if ORIGIN is set
      if (ORIGIN === '*') {
        callback(null, true);
      } else if (!ORIGIN) {
        // If ORIGIN is undefined/null in development, allow all origins
        callback(null, true);
      } else {
        const allowedOrigins = ORIGIN.split(',').map(o => o.trim());
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS policy'));
        }
      }
    }
  },

  credentials: CREDENTIALS,

  // Specify allowed methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Specify allowed headers
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control', 'Pragma'],

  // Specify exposed headers
  exposedHeaders: ['Content-Length'],

  // Preflight cache time (in seconds)
  maxAge: 86400, // 24 hours

  // Handle preflight requests
  preflightContinue: false,
  optionsSuccessStatus: 204,
});
