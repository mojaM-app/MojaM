import { REGEX_PATTERNS } from '@config';
import { type IRoutes, RouteConstants } from '@core';
import { requirePermission, setIdentity } from '@middlewares';
import { default as express } from 'express';
import { PermissionsController } from '../controllers/permissions.controller';

export class PermissionsRoute implements IRoutes {
  public static path = RouteConstants.PERMISSIONS_PATH;
  public router = express.Router();
  private readonly _permissionsController: PermissionsController;

  constructor() {
    this._permissionsController = new PermissionsController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      `${PermissionsRoute.path}`,
      [setIdentity, requirePermission(user => user.canAddPermission() || user.canDeletePermission())],
      this._permissionsController.get,
    );

    this.router.post(
      `${PermissionsRoute.path}/:userId(${REGEX_PATTERNS.GUID})/:permissionId(${REGEX_PATTERNS.INT})`,
      [setIdentity, requirePermission(user => user.canAddPermission())],
      this._permissionsController.add,
    );

    this.router.delete(
      `${PermissionsRoute.path}/:userId(${REGEX_PATTERNS.GUID})/:permissionId(${REGEX_PATTERNS.INT})?`,
      [setIdentity, requirePermission(user => user.canDeletePermission())],
      this._permissionsController.delete,
    );
  }
}
