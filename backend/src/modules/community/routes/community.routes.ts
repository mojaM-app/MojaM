import { IRoutes } from '@interfaces';
import { setIdentity } from '@middlewares';
import express from 'express';
import { CommunityController } from '../controllers/community.controller';

export class CommunityRoute implements IRoutes {
  public path = '/community';
  public router = express.Router();
  private readonly _controller: CommunityController;

  constructor() {
    this._controller = new CommunityController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}`, [setIdentity], this._controller.get);
  }
}
