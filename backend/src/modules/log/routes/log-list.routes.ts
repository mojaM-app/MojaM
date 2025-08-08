import { default as express } from 'express';
import type { IRoutes } from '@core';
import { requirePermission, setIdentity } from '@middlewares';
import { LogListController } from '../controllers/log-list.controller';

export class LogListRoutes implements IRoutes {
  public static path = '/logs';
  public router = express.Router();
  private readonly _controller: LogListController;

  constructor() {
    this._controller = new LogListController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      `${LogListRoutes.path}`,
      [setIdentity, requirePermission(user => user.canPreviewLogList())],
      this._controller.get,
    );
  }
}
