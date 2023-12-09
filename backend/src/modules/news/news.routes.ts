import { Routes } from '@interfaces/routes.interface';
import { AnnouncementsController } from '@modules/news/controllers/announcements.controller';
import { CalendarController } from '@modules/news/controllers/calendar.controller';
import { InformationController } from '@modules/news/controllers/information.controller';
import express, { Router } from 'express';
import { verifyToken } from '../auth/middlewares/auth.middleware';

class InformationRout implements Routes {
  public path = '/information';
  public controller: InformationController = new InformationController();

  public constructor(
    public router: Router,
    private _parentPath: string,
  ) {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this._parentPath}${this.path}`, verifyToken, this.controller.get);
  }
}

class AnnouncementsRout implements Routes {
  public path = '/announcements';
  public controller: AnnouncementsController = new AnnouncementsController();

  public constructor(
    public router: Router,
    private _parentPath: string,
  ) {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this._parentPath}${this.path}`, verifyToken, this.controller.get);
  }
}

class CalendarRout implements Routes {
  public path = '/calendar';
  public controller: CalendarController = new CalendarController();

  public constructor(
    public router: Router,
    private _parentPath: string,
  ) {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this._parentPath}${this.path}`, verifyToken, this.controller.get);
  }
}

export class NewsRoute implements Routes {
  public path = '/news';
  public router = express.Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const informationRout: InformationRout = new InformationRout(this.router, this.path);
    informationRout.initializeRoutes();

    const announcementsRout: AnnouncementsRout = new AnnouncementsRout(this.router, this.path);
    announcementsRout.initializeRoutes();

    const calendarRout: CalendarRout = new CalendarRout(this.router, this.path);
    calendarRout.initializeRoutes();
  }
}
