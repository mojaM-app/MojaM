import { ForbiddenException, UnauthorizedException } from '@exceptions';
import { IRequestWithIdentity, IRoutes } from '@interfaces';
import { setIdentity } from '@modules/auth';
import { UserListController } from '@modules/users';
import express, { NextFunction, Response } from 'express';

export class UserListRoute implements IRoutes {
  public path = '/user-list';
  public router = express.Router();
  private readonly _controller: UserListController;

  public constructor() {
    this._controller = new UserListController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}`, [setIdentity, this.checkPreviewPermission], this._controller.get);
  }

  private readonly checkPreviewPermission = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToPreviewUserList()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };
}
