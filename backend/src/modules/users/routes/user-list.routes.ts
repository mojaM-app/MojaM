import { IRoutes } from '@interfaces';
import { requirePermission } from '@middlewares';
import { setIdentity } from '@modules/auth';
import { UserListController } from '@modules/users';
import express from 'express';

export class UserListRoute implements IRoutes {
  public path = '/user-list';
  public router = express.Router();
  private readonly _controller: UserListController;

  constructor() {
    this._controller = new UserListController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}`, [setIdentity, requirePermission(user => user.canPreviewUserList())], this._controller.get);
  }
}
