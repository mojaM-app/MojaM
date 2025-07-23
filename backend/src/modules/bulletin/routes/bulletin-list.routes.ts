import { type IRoutes } from '@core';
import { requirePermission, setIdentity } from '@middlewares';
import { default as express } from 'express';
import { BulletinController } from '../controllers/bulletin.controller';

export class BulletinRoutes implements IRoutes {
  public static path = '/bulletin-list';

  public router = express.Router();

  private readonly _bulletinController: BulletinController;

  constructor() {
    this._bulletinController = new BulletinController();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.get(
      BulletinRoutes.path,
      [setIdentity, requirePermission(user => user.canGetBulletinList())],
      this._bulletinController.get,
    );
  }
}
