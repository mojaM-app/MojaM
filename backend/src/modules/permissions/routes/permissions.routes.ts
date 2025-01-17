import { REGEX_GUID_PATTERN, REGEX_INT_PATTERN } from '@config';
import { ForbiddenException, UnauthorizedException } from '@exceptions';
import { IRequestWithIdentity, IRoutes } from '@interfaces';
import { setIdentity } from '@modules/auth';
import { PermissionsController } from '@modules/permissions';
import express, { NextFunction, Response } from 'express';

export class PermissionsRoute implements IRoutes {
  public path = '/permissions';
  public router = express.Router();
  private readonly _permissionsController: PermissionsController;

  public constructor() {
    this._permissionsController = new PermissionsController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      `${this.path}/:userId(${REGEX_GUID_PATTERN})/:permissionId(${REGEX_INT_PATTERN})`,
      [setIdentity, this.checkAddPermission],
      this._permissionsController.add,
    );
    this.router.delete(
      `${this.path}/:userId(${REGEX_GUID_PATTERN})/:permissionId(${REGEX_INT_PATTERN})?`,
      [setIdentity, this.checkDeletePermission],
      this._permissionsController.delete,
    );
  }

  private readonly checkAddPermission = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity?.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToAddPermission()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private readonly checkDeletePermission = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity?.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToDeletePermission()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };
}
