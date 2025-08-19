import { type IRoutes } from '@core';
import { requirePermission, setIdentity } from '@middlewares';
import { default as express } from 'express';
import { BulletinListController } from '../controllers/bulletin-list.controller';

export class BulletinListRoutes implements IRoutes {
  public static path = '/bulletin-list';

  public router = express.Router();

  private readonly _bulletinListController: BulletinListController;

  constructor() {
    this._bulletinListController = new BulletinListController();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.get(
      BulletinListRoutes.path,
      [setIdentity, requirePermission(user => user.canPreviewBulletinList())],
      this._bulletinListController.get,
    );
  }
}
