import { BaseController } from '@core';
import { cspReportHandler } from '@middlewares';
import { type NextFunction, type Request, type Response } from 'express';

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
