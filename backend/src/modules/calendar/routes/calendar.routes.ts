import { default as express } from 'express';
import { type IRoutes } from '@core';
import { setIdentity } from '@middlewares';
import { CalendarController } from '../controllers/calendar.controller';

export class CalendarRoutes implements IRoutes {
  public static path = '/calendar';
  public router = express.Router();

  private readonly _controller: CalendarController;

  constructor() {
    this._controller = new CalendarController();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.get(`${CalendarRoutes.path}/events`, [setIdentity], this._controller.getEvents);
  }
}
