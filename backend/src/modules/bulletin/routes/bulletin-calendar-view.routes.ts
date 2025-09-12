import { type IRoutes } from '@core';
import { default as express } from 'express';
import { BulletinCalendarViewController } from '../controllers/bulletin-calendar-view.controller';

export class BulletinCalendarViewRoutes implements IRoutes {
  public static path = '/bulletin-calendar-view';

  public router = express.Router();

  private readonly _bulletinController: BulletinCalendarViewController;

  constructor() {
    this._bulletinController = new BulletinCalendarViewController();
    this.initializeRoutes();
  }

  // No authorization required for this route
  public initializeRoutes(): void {
    this.router.get(`${BulletinCalendarViewRoutes.path}/min-max-date`, this._bulletinController.getMinMaxDate);
    this.router.get(`${BulletinCalendarViewRoutes.path}/days`, this._bulletinController.getDays);
  }
}
