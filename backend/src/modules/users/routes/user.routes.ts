import { REGEX_PATTERNS } from '@config';
import { IRoutes } from '@interfaces';
import { requirePermission, validateData } from '@middlewares';
import { setIdentity } from '@modules/auth';
import { CreateUserDto, UpdateUserDto, UserController } from '@modules/users';
import express from 'express';

export class UserRoute implements IRoutes {
  public path = '/user';
  public deactivatePath = 'deactivate';
  public activatePath = 'activate';
  public unlockPath = 'unlock';
  public router = express.Router();
  private readonly _controller: UserController;

  constructor() {
    this._controller = new UserController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}/:id(${REGEX_PATTERNS.GUID})`, [setIdentity, requirePermission(user => user.canEditUser())], this._controller.get);

    this.router.post(
      `${this.path}`,
      [validateData(CreateUserDto), setIdentity, requirePermission(user => user.canAddUser())],
      this._controller.create,
    );

    this.router.post(
      `${this.path}/:id(${REGEX_PATTERNS.GUID})/${this.deactivatePath}`,
      [setIdentity, requirePermission(user => user.canDeactivateUser())],
      this._controller.deactivate,
    );

    this.router.post(
      `${this.path}/:id(${REGEX_PATTERNS.GUID})/${this.activatePath}`,
      [setIdentity, requirePermission(user => user.canActivateUser())],
      this._controller.activate,
    );

    this.router.post(
      `${this.path}/:id(${REGEX_PATTERNS.GUID})/${this.unlockPath}`,
      [setIdentity, requirePermission(user => user.canUnlockUser())],
      this._controller.unlock,
    );

    this.router.put(
      `${this.path}/:id(${REGEX_PATTERNS.GUID})`,
      [validateData(UpdateUserDto), setIdentity, requirePermission(user => user.canEditUser())],
      this._controller.update,
    );

    this.router.delete(
      `${this.path}/:id(${REGEX_PATTERNS.GUID})`,
      [setIdentity, requirePermission(user => user.canDeleteUser())],
      this._controller.delete,
    );
  }
}
