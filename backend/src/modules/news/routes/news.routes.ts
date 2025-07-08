import { type IRoutes } from '@core';
import { setIdentity } from '@middlewares';
import { default as express } from 'express';
import { NewsController } from '../controllers/news.controller';

export class NewsRoutes implements IRoutes {
  public static path = '/news';
  public router = express.Router();

  private readonly _controller: NewsController;

  constructor() {
    this._controller = new NewsController();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.get(`${NewsRoutes.path}`, [setIdentity], this._controller.get);
  }
}
