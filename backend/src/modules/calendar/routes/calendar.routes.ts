import { IRoutes } from '@interfaces';
import { setIdentity } from '@modules/auth';
import { CalendarController } from '@modules/calendar';
import express from 'express';

export class CalendarRoutes implements IRoutes {
  public path = '/calendar';
  public router = express.Router();

  private readonly _controller: CalendarController;

  public constructor() {
    this._controller = new CalendarController();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.get(`${this.path}/events`, [setIdentity], this._controller.getEvents);
  }
}
