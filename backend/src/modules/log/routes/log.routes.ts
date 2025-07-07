import { IRoutes } from '@core';
import { requirePermission, setIdentity } from '@middlewares';
import express from 'express';
import { LogListController } from '../controllers/log-list.controller';

export class LogRoute implements IRoutes {
  public static path = '/logs';
  public router = express.Router();
  private readonly _controller: LogListController;

  constructor() {
    this._controller = new LogListController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      `${LogRoute.path}`,
      [setIdentity, requirePermission(user => user.canPreviewLogList())],
      this._controller.get,
    );
  }
}
