import { ForbiddenException } from '@exceptions';
import { Routes } from '@interfaces';
import { validateData } from '@middlewares';
import { RequestWithIdentity, setIdentity } from '@modules/auth';
import { CreateUserDto, UsersController } from '@modules/users';
import { REGEX_GUID_PATTERN } from '@utils';
import express, { NextFunction, Response } from 'express';

export class UsersRoute implements Routes {
  public path = '/users';
  public deactivatePath = 'deactivate';
  public activatePath = 'activate';
  public router = express.Router();
  private readonly _usersController: UsersController | undefined = undefined;

  public constructor() {
    this._usersController = new UsersController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    //this.router.get(`${this.path}`,verifyToken, this.usersController.getUsers);
    this.router.get(
      `${this.path}/:id(${REGEX_GUID_PATTERN})`,
      [setIdentity, this.checkPreviewUserProfilePermission],
      this._usersController.getUserProfile,
    );
    this.router.post(`${this.path}`, [validateData(CreateUserDto), setIdentity, this.checkCreatePermission], this._usersController.create);
    this.router.post(
      `${this.path}/:id(${REGEX_GUID_PATTERN})/${this.deactivatePath}`,
      [setIdentity, this.checkDeactivatePermission],
      this._usersController.deactivate,
    );
    this.router.post(
      `${this.path}/:id(${REGEX_GUID_PATTERN})/${this.activatePath}`,
      [setIdentity, this.checkActivatePermission],
      this._usersController.activate,
    );
    //this.router.put(`${this.path}/:id(${REGEX_INT_PATTERN)`, ValidationMiddleware(UpdateUserDto, true),verifyToken, this._usersController.update);
    this.router.delete(`${this.path}/:id(${REGEX_GUID_PATTERN})`, [setIdentity, this.checkDeletePermission], this._usersController.delete);
  }

  private checkPreviewUserProfilePermission = async (req: RequestWithIdentity, res: Response, next: NextFunction) => {
    if (req.identity.hasPermissionToPreviewUserProfile() !== true) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private checkCreatePermission = async (req: RequestWithIdentity, res: Response, next: NextFunction) => {
    if (req.identity.hasPermissionToAddUser() !== true) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private checkDeactivatePermission = async (req: RequestWithIdentity, res: Response, next: NextFunction) => {
    if (req.identity.hasPermissionToDeactivateUser() !== true) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private checkActivatePermission = async (req: RequestWithIdentity, res: Response, next: NextFunction) => {
    if (req.identity.hasPermissionToActivateUser() !== true) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private checkDeletePermission = async (req: RequestWithIdentity, res: Response, next: NextFunction) => {
    if (req.identity.hasPermissionToDeleteUser() !== true) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };
}
