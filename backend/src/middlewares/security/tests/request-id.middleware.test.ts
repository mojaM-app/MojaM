import * as config from '@config';
import { NextFunction, Request, Response } from 'express';
import { Guid } from 'guid-typescript';
import { getRequestId, IRequestWithId, requestIdMiddleware } from '../request-id.middleware';

// Mock express types
const mockRequest = (headers: Record<string, string> = {}): Partial<Request> => ({
  get: jest.fn().mockImplementation((name: string) => headers[name] || undefined) as any,
});

const mockResponse = (): Partial<Response> => ({
  set: jest.fn(),
});

const mockNext = (): NextFunction => jest.fn();

describe('Request ID Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestIdMiddleware', () => {
    it('should generate a new request ID when none is provided', () => {
      const req = mockRequest() as IRequestWithId;
      const res = mockResponse() as Response;
      const next = mockNext();

      requestIdMiddleware(req, res, next);

      expect(req.requestId).toBeDefined();
      expect(typeof req.requestId).toBe('string');
      expect(req.requestId.length).toBe(Guid.EMPTY.length);
      expect(res.set).toHaveBeenCalledWith('X-Request-ID', req.requestId);
      expect(next).toHaveBeenCalled();
    });

    it('should use existing request ID from header', () => {
      const existingId = Guid.create().toString();
      const req = mockRequest({ 'X-Request-ID': existingId }) as IRequestWithId;
      const res = mockResponse() as Response;
      const next = mockNext();

      requestIdMiddleware(req, res, next);

      expect(req.requestId).toBe(existingId);
      expect(res.set).toHaveBeenCalledWith('X-Request-ID', existingId);
      expect(next).toHaveBeenCalled();
    });

    it('should use custom header name from environment', () => {
      jest.replaceProperty(config, 'SECURITY_REQUEST_ID_HEADER', 'X-Custom-Request-ID');
      const customId = Guid.create().toString();
      const req = mockRequest({ 'X-Custom-Request-ID': customId }) as IRequestWithId;
      const res = mockResponse() as Response;
      const next = mockNext();

      requestIdMiddleware(req, res, next);

      expect(req.requestId).toBe(customId);
      expect(res.set).toHaveBeenCalledWith('X-Custom-Request-ID', customId);
    });
  });

  describe('getRequestId', () => {
    it('should return request ID from request object', () => {
      const testId = Guid.create().toString();
      const req = { requestId: testId } as IRequestWithId;

      const result = getRequestId(req);

      expect(result).toBe(testId);
    });

    it('should return "unknown" when request ID is not set', () => {
      const req = {} as Request;

      const result = getRequestId(req);

      expect(result).toBe('unknown');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
