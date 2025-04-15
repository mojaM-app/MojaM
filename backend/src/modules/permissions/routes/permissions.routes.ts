import { REGEX_PATTERNS } from '@config';
import { IRoutes } from '@interfaces';
import { requirePermission } from '@middlewares';
import { setIdentity } from '@modules/auth';
import { PermissionsController } from '@modules/permissions';
import express from 'express';

export class PermissionsRoute implements IRoutes {
  public path = '/permissions';
  public router = express.Router();
  private readonly _permissionsController: PermissionsController;

  constructor() {
    this._permissionsController = new PermissionsController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      `${this.path}`,
      [setIdentity, requirePermission(user => user.canAddPermission() || user.canDeletePermission())],
      this._permissionsController.get,
    );

    this.router.post(
      `${this.path}/:userId(${REGEX_PATTERNS.GUID})/:permissionId(${REGEX_PATTERNS.INT})`,
      [setIdentity, requirePermission(user => user.canAddPermission())],
      this._permissionsController.add,
    );

    this.router.delete(
      `${this.path}/:userId(${REGEX_PATTERNS.GUID})/:permissionId(${REGEX_PATTERNS.INT})?`,
      [setIdentity, requirePermission(user => user.canDeletePermission())],
      this._permissionsController.delete,
    );
  }
}
