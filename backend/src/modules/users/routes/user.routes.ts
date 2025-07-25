import { REGEX_PATTERNS } from '@config';
import { type IRoutes } from '@core';
import { requirePermission, setIdentity, validateData } from '@middlewares';
import { default as express } from 'express';
import { UserController } from '../controllers/user.controller';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

export class UserRoute implements IRoutes {
  public static path = '/user';
  public static deactivatePath = 'deactivate';
  public static activatePath = 'activate';
  public static unlockPath = 'unlock';
  public router = express.Router();
  private readonly _controller: UserController;

  constructor() {
    this._controller = new UserController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      `${UserRoute.path}/:id(${REGEX_PATTERNS.GUID})`,
      [setIdentity, requirePermission(user => user.canEditUser())],
      this._controller.get,
    );

    this.router.post(
      `${UserRoute.path}`,
      [validateData(CreateUserDto), setIdentity, requirePermission(user => user.canAddUser())],
      this._controller.create,
    );

    this.router.post(
      `${UserRoute.path}/:id(${REGEX_PATTERNS.GUID})/${UserRoute.deactivatePath}`,
      [setIdentity, requirePermission(user => user.canDeactivateUser())],
      this._controller.deactivate,
    );

    this.router.post(
      `${UserRoute.path}/:id(${REGEX_PATTERNS.GUID})/${UserRoute.activatePath}`,
      [setIdentity, requirePermission(user => user.canActivateUser())],
      this._controller.activate,
    );

    this.router.post(
      `${UserRoute.path}/:id(${REGEX_PATTERNS.GUID})/${UserRoute.unlockPath}`,
      [setIdentity, requirePermission(user => user.canUnlockUser())],
      this._controller.unlock,
    );

    this.router.put(
      `${UserRoute.path}/:id(${REGEX_PATTERNS.GUID})`,
      [validateData(UpdateUserDto), setIdentity, requirePermission(user => user.canEditUser())],
      this._controller.update,
    );

    this.router.delete(
      `${UserRoute.path}/:id(${REGEX_PATTERNS.GUID})`,
      [setIdentity, requirePermission(user => user.canDeleteUser())],
      this._controller.delete,
    );
  }
}
