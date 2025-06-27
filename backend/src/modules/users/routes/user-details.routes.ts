import express from 'express';
import { REGEX_PATTERNS } from '@config';
import { type IRoutes, RouteConstants } from '@core';
import { requirePermission, setIdentity } from '@middlewares';
import { UserDetailsController } from '../controllers/user-details.controller';

export class UserDetailsRoute implements IRoutes {
  public static path = RouteConstants.USER_DETAILS_PATH;
  public router = express.Router();
  private readonly _controller: UserDetailsController;

  constructor() {
    this._controller = new UserDetailsController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      `${UserDetailsRoute.path}/:id(${REGEX_PATTERNS.GUID})`,
      [setIdentity, requirePermission(user => user.canPreviewUserDetails())],
      this._controller.get,
    );
  }
}
