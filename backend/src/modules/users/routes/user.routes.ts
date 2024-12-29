import { ForbiddenException, UnauthorizedException } from '@exceptions';
import { IRequestWithIdentity, IRoutes } from '@interfaces';
import { validateData } from '@middlewares';
import { setIdentity } from '@modules/auth';
import { CreateUserDto, UserController } from '@modules/users';
import { REGEX_GUID_PATTERN } from '@utils';
import express, { NextFunction, Response } from 'express';

export class UserRoute implements IRoutes {
  public path = '/user';
  public deactivatePath = 'deactivate';
  public activatePath = 'activate';
  public router = express.Router();
  private readonly _controller: UserController;

  public constructor() {
    this._controller = new UserController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}/:id(${REGEX_GUID_PATTERN})`, [setIdentity, this.checkGetPermission], this._controller.get);
    this.router.post(`${this.path}`, [validateData(CreateUserDto), setIdentity, this.checkCreatePermission], this._controller.create);
    this.router.post(
      `${this.path}/:id(${REGEX_GUID_PATTERN})/${this.deactivatePath}`,
      [setIdentity, this.checkDeactivatePermission],
      this._controller.deactivate,
    );
    this.router.post(
      `${this.path}/:id(${REGEX_GUID_PATTERN})/${this.activatePath}`,
      [setIdentity, this.checkActivatePermission],
      this._controller.activate,
    );
    // this.router.put(`${this.path}/:id(${REGEX_INT_PATTERN)`, ValidationMiddleware(UpdateUserDto, true),verifyToken, this._userController.update);
    this.router.delete(`${this.path}/:id(${REGEX_GUID_PATTERN})`, [setIdentity, this.checkDeletePermission], this._controller.delete);
  }

  private readonly checkCreatePermission = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity?.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToAddUser()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private readonly checkGetPermission = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity?.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToEditUser()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private readonly checkDeactivatePermission = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity?.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToDeactivateUser()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private readonly checkActivatePermission = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity?.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToActivateUser()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private readonly checkDeletePermission = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity?.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToDeleteUser()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };
}
