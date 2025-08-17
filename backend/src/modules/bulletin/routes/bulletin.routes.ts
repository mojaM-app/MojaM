import { REGEX_PATTERNS } from '@config';
import { type IRoutes } from '@core';
import { requirePermission, setIdentity, validateData } from '@middlewares';
import { default as express } from 'express';
import { BulletinController } from '../controllers/bulletin.controller';
import { CreateBulletinDto } from '../dtos/create-bulletin.dto';
import { UpdateBulletinDto } from '../dtos/update-bulletin.dto';

export class BulletinRoutes implements IRoutes {
  public static path = '/bulletin';

  public router = express.Router();

  private readonly _bulletinController: BulletinController;

  constructor() {
    this._bulletinController = new BulletinController();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.get(
      `${BulletinRoutes.path}/:id(${REGEX_PATTERNS.GUID})`,
      [setIdentity, requirePermission(user => user.canGetBulletin())],
      this._bulletinController.get,
    );

    this.router.post(
      BulletinRoutes.path,
      [setIdentity, requirePermission(user => user.canAddBulletin()), validateData(CreateBulletinDto)],
      this._bulletinController.create,
    );

    this.router.put(
      `${BulletinRoutes.path}/:id(${REGEX_PATTERNS.GUID})`,
      [setIdentity, requirePermission(user => user.canEditBulletin()), validateData(UpdateBulletinDto)],
      this._bulletinController.update,
    );

    this.router.post(
      `${BulletinRoutes.path}/:id(${REGEX_PATTERNS.GUID})/publish`,
      [setIdentity, requirePermission(user => user.canPublishBulletin())],
      this._bulletinController.publish,
    );

    this.router.delete(
      `${BulletinRoutes.path}/:id(${REGEX_PATTERNS.GUID})`,
      [setIdentity, requirePermission(user => user.canDeleteBulletin())],
      this._bulletinController.delete,
    );
  }
}
