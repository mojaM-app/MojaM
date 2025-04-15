import { IRoutes } from '@interfaces';
import { requirePermission, validateData } from '@middlewares';
import { setIdentity } from '@modules/auth';
import { UpdateUserProfileDto, UserProfileController } from '@modules/users';
import express from 'express';

export class UserProfileRoute implements IRoutes {
  public path = '/user-profile';
  public router = express.Router();
  private readonly _controller: UserProfileController;

  constructor() {
    this._controller = new UserProfileController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      `${this.path}`,
      [
        setIdentity,
        requirePermission(() => true), // Just requires authentication
      ],
      this._controller.get,
    );

    this.router.put(
      `${this.path}`,
      [
        validateData(UpdateUserProfileDto),
        setIdentity,
        requirePermission(() => true), // Just requires authentication
      ],
      this._controller.update,
    );
  }
}
