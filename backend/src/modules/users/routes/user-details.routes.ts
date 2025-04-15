import { REGEX_PATTERNS } from '@config';
import { IRoutes } from '@interfaces';
import { requirePermission } from '@middlewares';
import { setIdentity } from '@modules/auth';
import express from 'express';
import { UserDetailsController } from '../controllers/user-details.controller';

export class UserDetailsRoute implements IRoutes {
  public path = '/user-details';
  public router = express.Router();
  private readonly _controller: UserDetailsController;

  constructor() {
    this._controller = new UserDetailsController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      `${this.path}/:id(${REGEX_PATTERNS.GUID})`,
      [setIdentity, requirePermission(user => user.canPreviewUserDetails())],
      this._controller.get,
    );
  }
}
