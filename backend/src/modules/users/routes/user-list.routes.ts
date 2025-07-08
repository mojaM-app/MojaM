import { type IRoutes } from '@core';
import { requirePermission, setIdentity } from '@middlewares';
import { default as express } from 'express';
import { UserListController } from '../controllers/user-list.controller';

export class UserListRoute implements IRoutes {
  public static path = '/user-list';
  public router = express.Router();
  private readonly _controller: UserListController;

  constructor() {
    this._controller = new UserListController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      `${UserListRoute.path}`,
      [setIdentity, requirePermission(user => user.canPreviewUserList())],
      this._controller.get,
    );
  }
}
