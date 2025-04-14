import { REGEX_PATTERNS } from '@config';
import { ForbiddenException, UnauthorizedException } from '@exceptions';
import { IRequestWithIdentity, IRoutes } from '@interfaces';
import { setIdentity } from '@modules/auth';
import { PermissionsController } from '@modules/permissions';
import express, { NextFunction, Response } from 'express';

export class PermissionsRoute implements IRoutes {
  public path = '/permissions';
  public router = express.Router();
  private readonly _permissionsController: PermissionsController;

  constructor() {
    this._permissionsController = new PermissionsController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}`, [setIdentity, this.checkGet], this._permissionsController.get);
    this.router.post(
      `${this.path}/:userId(${REGEX_PATTERNS.GUID})/:permissionId(${REGEX_PATTERNS.INT})`,
      [setIdentity, this.checkAdd],
      this._permissionsController.add,
    );
    this.router.delete(
      `${this.path}/:userId(${REGEX_PATTERNS.GUID})/:permissionId(${REGEX_PATTERNS.INT})?`,
      [setIdentity, this.checkDelete],
      this._permissionsController.delete,
    );
  }

  private readonly checkGet = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToAddPermission() && !req.identity.hasPermissionToDeletePermission()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private readonly checkAdd = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToAddPermission()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private readonly checkDelete = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToDeletePermission()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };
}
