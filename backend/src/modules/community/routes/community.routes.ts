import { type IRoutes } from '@core';
import { setIdentity } from '@middlewares';
import { default as express } from 'express';
import { CommunityController } from '../controllers/community.controller';

export class CommunityRoute implements IRoutes {
  public static path = '/community';
  public router = express.Router();
  private readonly _controller: CommunityController;

  constructor() {
    this._controller = new CommunityController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${CommunityRoute.path}`, [setIdentity], this._controller.get);
  }
}
