import { REGEX_PATTERNS } from '@config';
import { type IRoutes, RouteConstants } from '@core';
import { requirePermission, setIdentity, userManagementRateLimit, validateData } from '@middlewares';
import express from 'express';
import { UserController } from '../controllers/user.controller';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

export class UserRoute implements IRoutes {
  public static path = RouteConstants.USER_PATH;
  public static deactivatePath = RouteConstants.USER_DEACTIVATE_PATH;
  public static activatePath = RouteConstants.USER_ACTIVATE_PATH;
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
      [userManagementRateLimit, validateData(CreateUserDto), setIdentity, requirePermission(user => user.canAddUser())],
      this._controller.create,
    );

    this.router.post(
      `${UserRoute.path}/:id(${REGEX_PATTERNS.GUID})/${UserRoute.deactivatePath}`,
      [userManagementRateLimit, setIdentity, requirePermission(user => user.canDeactivateUser())],
      this._controller.deactivate,
    );

    this.router.post(
      `${UserRoute.path}/:id(${REGEX_PATTERNS.GUID})/${UserRoute.activatePath}`,
      [userManagementRateLimit, setIdentity, requirePermission(user => user.canActivateUser())],
      this._controller.activate,
    );

    this.router.post(
      `${UserRoute.path}/:id(${REGEX_PATTERNS.GUID})/${UserRoute.unlockPath}`,
      [userManagementRateLimit, setIdentity, requirePermission(user => user.canUnlockUser())],
      this._controller.unlock,
    );

    this.router.put(
      `${UserRoute.path}/:id(${REGEX_PATTERNS.GUID})`,
      [
        userManagementRateLimit,
        validateData(UpdateUserDto),
        setIdentity,
        requirePermission(user => user.canEditUser()),
      ],
      this._controller.update,
    );

    this.router.delete(
      `${UserRoute.path}/:id(${REGEX_PATTERNS.GUID})`,
      [userManagementRateLimit, setIdentity, requirePermission(user => user.canDeleteUser())],
      this._controller.delete,
    );
  }
}
