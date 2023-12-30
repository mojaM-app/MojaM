import { ForbiddenException } from '@exceptions/ForbiddenException';
import { Routes } from '@interfaces/routes.interface';
import { RequestWithUser } from '@modules/auth/interfaces/RequestWithUser';
import { setIdentity } from '@modules/auth/middlewares/set-identity.middleware';
import { PermissionsController } from '@modules/permissions/controllers/permissions.controller';
import { SystemPermission } from '@modules/permissions/system-permission.enum';
import { REGEX_GUID_PATTERN, REGEX_INT_PATTERN } from '@utils/constants';
import express, { NextFunction, Response } from 'express';

export class PermissionsRoute implements Routes {
  public path = '/permissions';
  public router = express.Router();
  private _permissionsController: PermissionsController | undefined = undefined;

  public constructor() {
    this._permissionsController = new PermissionsController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/:userId(${REGEX_GUID_PATTERN})/:permissionId(${REGEX_INT_PATTERN})`,
      [setIdentity, this.checkAddPermission],
      this._permissionsController.add,
    );
    this.router.delete(
      `${this.path}/:userId(${REGEX_GUID_PATTERN})/:permissionId(${REGEX_INT_PATTERN})`,
      [setIdentity, this.checkDeletePermission],
      this._permissionsController.delete,
    );
  }

  checkAddPermission = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (req.permissions?.includes(SystemPermission.AddPermission) !== true) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  checkDeletePermission = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (req.permissions?.includes(SystemPermission.DeletePermission) !== true) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };
}
