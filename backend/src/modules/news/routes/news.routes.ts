import { IRoutes } from '@interfaces';
import { setIdentity } from '@modules/auth';
import { NewsController } from '@modules/news';
import express from 'express';

export class NewsRoutes implements IRoutes {
  public path = '/news';
  public router = express.Router();

  private readonly _controller: NewsController;

  public constructor(
  ) {
    this._controller = new NewsController();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.get(`${this.path}`, [setIdentity], this._controller.get);
  }
}
