import { UnauthorizedException } from '@exceptions';
import { IRequestWithIdentity, IRoutes } from '@interfaces';
import { validateData } from '@middlewares';
import { setIdentity } from '@modules/auth';
import { UpdateUserProfileDto, UserProfileController } from '@modules/users';
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
    this.router.get(`${this.path}`, [setIdentity, this.checkGetPermission], this._controller.get);
    this.router.put(`${this.path}`, [validateData(UpdateUserProfileDto), setIdentity, this.checkUpdatePermission], this._controller.update);
  }

  private readonly checkGetPermission = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity.isAuthenticated()) {
      next(new UnauthorizedException());
    } else {
      next();
    }
  };

  private readonly checkUpdatePermission = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity.isAuthenticated()) {
      next(new UnauthorizedException());
    } else {
      next();
    }
  };
}
