import { type IRoutes } from '@core';
import { requirePermission, setIdentity, validateData } from '@middlewares';
import { default as express } from 'express';
import { BulletinController } from '../controllers/bulletin.controller';
import { CreateBulletinDto } from '../dtos/create-bulletin.dto';
import { UpdateBulletinDto } from '../dtos/update-bulletin.dto';

export class BulletinRoutes implements IRoutes {
  public static path = '/bulletins';

  public router = express.Router();

  private readonly _bulletinController: BulletinController;

  constructor() {
    this._bulletinController = new BulletinController();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    // Create new bulletin
    this.router.post(
      BulletinRoutes.path,
      [setIdentity, requirePermission(user => user.canAddBulletin()), validateData(CreateBulletinDto)],
      this._bulletinController.create,
    );

    // Get all bulletins
    this.router.get(
      BulletinRoutes.path,
      [setIdentity, requirePermission(user => user.canGetBulletin())],
      this._bulletinController.getList,
    );

    // Get specific bulletin
    this.router.get(
      `${BulletinRoutes.path}/:id(\\d+)`,
      [setIdentity, requirePermission(user => user.canGetBulletin())],
      this._bulletinController.get,
    );

    // Update bulletin
    this.router.put(
      `${BulletinRoutes.path}/:id(\\d+)`,
      [setIdentity, requirePermission(user => user.canEditBulletin()), validateData(UpdateBulletinDto)],
      this._bulletinController.update,
    );

    // Publish bulletin
    this.router.post(
      `${BulletinRoutes.path}/:id(\\d+)/publish`,
      [setIdentity, requirePermission(user => user.canPublishBulletin())],
      this._bulletinController.publish,
    );

    // Delete bulletin
    this.router.delete(
      `${BulletinRoutes.path}/:id(\\d+)`,
      [setIdentity, requirePermission(user => user.canDeleteBulletin())],
      this._bulletinController.delete,
    );
  }
}
