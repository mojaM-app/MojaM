import { HttpException } from '@exceptions/HttpException';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { logger } from '@utils/logger';
import { NextFunction, Request, Response } from 'express';

export const ErrorMiddleware = (error: HttpException, req: Request, res: Response, next: NextFunction) => {
  try {
    const data: { message: string; args?: (string | number)[] } = {
      message: error.message || 'Something went wrong',
    };

    if (error instanceof TranslatableHttpException) {
      data.args = error.args;
    }

    const status: number = error.status || 500;
    const args: string = JSON.stringify(data.args ?? []);
    logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${data.message}::${args}`);
    res.status(status).json({ data });
  } catch (error) {
    next(error);
  }
};
