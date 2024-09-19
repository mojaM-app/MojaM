import { ForbiddenException, UnauthorizedException } from '@exceptions';
import { RequestWithIdentity, Routes } from '@interfaces';
import { setIdentity } from '@modules/auth';
import { UserListController } from '@modules/users';
import express, { NextFunction, Response } from 'express';

export class UserListRoute implements Routes {
  public path = '/user-list';
  public router = express.Router();
  private readonly _userListController: UserListController;

  public constructor() {
    this._userListController = new UserListController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}`, [setIdentity, this.checkPreviewUserList], this._userListController.get);
  }

  private readonly checkPreviewUserList = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity?.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToPreviewUserList()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };
}
