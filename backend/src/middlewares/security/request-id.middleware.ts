import { SECURITY_REQUEST_ID_HEADER } from '@config';
import { NextFunction, Request, Response } from 'express';
import { Guid } from 'guid-typescript';

export interface IRequestWithId extends Request {
  requestId: string;
}

/**
 * Middleware to add unique request ID to every request
 * Supports both incoming request IDs and generates new ones
 */
export const requestIdMiddleware = (req: IRequestWithId, res: Response, next: NextFunction): void => {
  const headerName = SECURITY_REQUEST_ID_HEADER || 'X-Request-ID';

  // Check if request already has an ID from client
  let requestId = req.get(headerName) as string;

  // If no request ID provided, generate a new one
  if (!requestId) {
    requestId = Guid.create().toString();
  }

  // Attach request ID to request object
  req.requestId = requestId;

  // Set response header
  res.set(headerName, requestId);

  next();
};

/**
 * Get request ID from request object
 */
export const getRequestId = (req: Request): string => {
  return (req as IRequestWithId).requestId || 'unknown';
};
