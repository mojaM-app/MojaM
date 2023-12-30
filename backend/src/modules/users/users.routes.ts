import { ForbiddenException } from '@exceptions/ForbiddenException';
import { Routes } from '@interfaces/routes.interface';
import { validateData } from '@middlewares/validate-data.middleware';
import { RequestWithUser } from '@modules/auth/interfaces/RequestWithUser';
import { setIdentity } from '@modules/auth/middlewares/set-identity.middleware';
import { SystemPermission } from '@modules/permissions/system-permission.enum';
import { UsersController } from '@modules/users/controllers/users.controller';
import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { REGEX_GUID_PATTERN } from '@utils/constants';
import express, { NextFunction, Response } from 'express';

export class UsersRoute implements Routes {
  public path = '/users';
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
    //this.router.put(`${this.path}/:id(${REGEX_INT_PATTERN)`, ValidationMiddleware(UpdateUserDto, true),verifyToken, this._usersController.update);
    this.router.delete(`${this.path}/:id(${REGEX_GUID_PATTERN})`, [setIdentity, this.checkDeletePermission], this._usersController.delete);
  }

  checkPreviewUserProfilePermission = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (req.permissions?.includes(SystemPermission.PreviewUserProfile) !== true) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  checkCreatePermission = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (req.permissions?.includes(SystemPermission.AddUser) !== true) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  checkDeletePermission = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (req.permissions?.includes(SystemPermission.DeleteUser) !== true) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };
}
