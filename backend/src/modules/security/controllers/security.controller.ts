import { BaseController } from '@core';
import { cspReportHandler } from '@middlewares';
import { NextFunction, Request, Response } from 'express';

export class SecurityController extends BaseController {
  constructor() {
    super();
  }

  public cspReport = (req: Request, res: Response, next: NextFunction): void => {
    try {
      cspReportHandler(req, res);
    } catch (error) {
      next(error);
    }
  };
}
