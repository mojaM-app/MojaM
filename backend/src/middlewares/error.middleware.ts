import { HttpException, TranslatableHttpException } from '@exceptions';
import { IResponseError } from '@interfaces';
import { logger } from '@modules/logger';
import { NextFunction, Request, Response } from 'express';

export const ErrorMiddleware = async (error: HttpException, req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data: IResponseError = {
      message: error.message ?? 'Something went wrong',
    };

    if (error instanceof TranslatableHttpException) {
      data.args = error.args;
    }

    const status: number = error.status ?? 500;
    const args: string = JSON.stringify(data.args ?? {});
    logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${data.message}::${args}`);
    res.status(status).json({ data });
  } catch (ex) {
    next(ex);
  }
};
