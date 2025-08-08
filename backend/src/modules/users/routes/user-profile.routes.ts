import { default as express } from 'express';
import { type IRoutes } from '@core';
import { requirePermission, setIdentity, validateData } from '@middlewares';
import { UserProfileController } from '../controllers/user-profile.controller';
import { UpdateUserProfileDto } from '../dtos/update-user-profile.dto';

export class UserProfileRoute implements IRoutes {
  public static path = '/user-profile';
  public router = express.Router();
  private readonly _controller: UserProfileController;

  constructor() {
    this._controller = new UserProfileController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      `${UserProfileRoute.path}`,
      [
        setIdentity,
        requirePermission(() => true), // Just requires authentication
      ],
      this._controller.get,
    );

    this.router.put(
      `${UserProfileRoute.path}`,
      [
        validateData(UpdateUserProfileDto),
        setIdentity,
        requirePermission(() => true), // Just requires authentication
      ],
      this._controller.update,
    );
  }
}
