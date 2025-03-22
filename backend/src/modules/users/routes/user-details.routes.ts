import { REGEX_PATTERNS } from '@config';
import { ForbiddenException, UnauthorizedException } from '@exceptions';
import { IRequestWithIdentity, IRoutes } from '@interfaces';
import { setIdentity } from '@modules/auth';
import express, { NextFunction, Response } from 'express';
import { UserDetailsController } from '../controllers/user-details.controller';

export class UserDetailsRoute implements IRoutes {
  public path = '/user-details';
  public router = express.Router();
  private readonly _controller: UserDetailsController;

  public constructor() {
    this._controller = new UserDetailsController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}/:id(${REGEX_PATTERNS.GUID})`, [setIdentity, this.checkPreviewPermission], this._controller.get);
  }

  private readonly checkPreviewPermission = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity?.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToPreviewUserDetails()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };
}
