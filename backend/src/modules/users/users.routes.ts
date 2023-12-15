import { ForbiddenException } from '@exceptions/ForbiddenException';
import { Routes } from '@interfaces/routes.interface';
import { validateData } from '@middlewares/validate-data.middleware';
import { UsersController } from '@modules/users/controllers/users.controller';
import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { REGEX_GUID_PATTERN } from '@utils/constants';
import express, { NextFunction, Response } from 'express';
import { RequestWithUser } from '../auth/interfaces/RequestWithUser';
import { setIdentity } from '../auth/middlewares/set-identity.middleware';
import { SystemPermission } from '../permissions/system-permission.enum';

export class UsersRoute implements Routes {
  public path = '/users';
  public router = express.Router();
  public usersController: UsersController = new UsersController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    //this.router.get(`${this.path}`,verifyToken, this.usersController.getUsers);
    this.router.get(`${this.path}/:id(${REGEX_GUID_PATTERN})`, [setIdentity], this.usersController.getById);
    this.router.post(`${this.path}`, [validateData(CreateUserDto), setIdentity, this.checkCreatePermission], this.usersController.create);
    //this.router.put(`${this.path}/:id(${REGEX_INT_PATTERN)`, ValidationMiddleware(UpdateUserDto, true),verifyToken, this.usersController.updateUser);
    this.router.delete(`${this.path}/:id(${REGEX_GUID_PATTERN})`, [setIdentity], this.usersController.delete);
  }

  checkCreatePermission = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (req.permissions?.includes(SystemPermission.AddUser) !== true) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };
}
