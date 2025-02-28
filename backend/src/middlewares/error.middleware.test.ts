/* eslint-disable */
import { TranslatableHttpException } from '@/exceptions/TranslatableHttpException';
import { HttpException } from '@exceptions/HttpException';
import { logger } from '@modules/logger';
import { NextFunction, Request, Response } from 'express';
import { ErrorMiddleware } from './error.middleware';

jest.mock('@modules/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('ErrorMiddleware tests', () => {
  let error: HttpException;
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    error = new HttpException(400, 'Test error');
    req = {} as Request;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('should handle HttpException and send response with status code and error message', async () => {
    await ErrorMiddleware(error, req, res, next);

    expect(logger.error).toHaveBeenCalledWith('[undefined] undefined >> StatusCode:: 400, Message:: Test error::{}');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ data: { message: 'Test error' } });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle TranslatableHttpException and send response with status code, error message, and arguments', async () => {
    const translatableError = new TranslatableHttpException(500, 'Test error', { id: 1, msg: 'message' });
    await ErrorMiddleware(translatableError, req, res, next);

    expect(logger.error).toHaveBeenCalledWith('[undefined] undefined >> StatusCode:: 500, Message:: Test error::{"id":1,"msg":"message"}');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ data: { message: 'Test error', args: { id: 1, msg: 'message' } } });
    expect(next).not.toHaveBeenCalled();
  });

  it("should set '' when error message is undefined", async () => {
    error = new HttpException(400, undefined as any);
    await ErrorMiddleware(error, req, res, next);
    expect(logger.error).toHaveBeenCalledWith('[undefined] undefined >> StatusCode:: 400, Message:: ::{}');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ data: { message: '' } });
    expect(next).not.toHaveBeenCalled();
  });

  it("should set '' when error message is null", async () => {
    await ErrorMiddleware(new HttpException(400, undefined as any), req, res, next);
    expect(logger.error).toHaveBeenCalledWith('[undefined] undefined >> StatusCode:: 400, Message:: ::{}');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ data: { message: '' } });
    expect(next).not.toHaveBeenCalled();
  });

  it("should set message='Something went wrong' when error message is not set", async () => {
    await ErrorMiddleware({} as any, req, res, next);
    expect(logger.error).toHaveBeenCalledWith('[undefined] undefined >> StatusCode:: 500, Message:: Something went wrong::{}');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ data: { message: 'Something went wrong' } });
    expect(next).not.toHaveBeenCalled();
  });

  it('should set status=500 when error status is not set', async () => {
    await ErrorMiddleware({} as any, req, res, next);
    expect(logger.error).toHaveBeenCalledWith('[undefined] undefined >> StatusCode:: 500, Message:: Something went wrong::{}');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ data: { message: 'Something went wrong' } });
    expect(next).not.toHaveBeenCalled();
  });

  it('should set status=501 when status is set', async () => {
    await ErrorMiddleware({ status: 501 } as any, req, res, next);
    expect(logger.error).toHaveBeenCalledWith('[undefined] undefined >> StatusCode:: 501, Message:: Something went wrong::{}');
    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({ data: { message: 'Something went wrong' } });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle unexpected error and call next middleware', async () => {
    const unexpectedError = new Error('Unexpected error');
    jest.spyOn(logger, 'error').mockImplementation(() => {
      throw unexpectedError;
    });

    await ErrorMiddleware(error, req, res, next);

    expect(logger.error).toHaveBeenCalledWith('[undefined] undefined >> StatusCode:: 400, Message:: Test error::{}');
    expect(next).toHaveBeenCalledWith(unexpectedError);
  });
});
