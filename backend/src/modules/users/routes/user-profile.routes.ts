import { ForbiddenException, UnauthorizedException } from '@exceptions';
import { IRequestWithIdentity, IRoutes } from '@interfaces';
import { setIdentity } from '@modules/auth';
import { UserProfileController } from '@modules/users';
import { REGEX_GUID_PATTERN } from '@utils';
import express, { NextFunction, Response } from 'express';

export class UserProfileRoute implements IRoutes {
  public path = '/user-profile';
  public router = express.Router();
  private readonly _controller: UserProfileController;

  public constructor() {
    this._controller = new UserProfileController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}/:id(${REGEX_GUID_PATTERN})`, [setIdentity, this.checkPreviewPermission], this._controller.get);
  }

  private readonly checkPreviewPermission = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity?.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToPreviewUserProfile()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };
}
