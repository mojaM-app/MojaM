import { Routes } from '@interfaces';
import { setIdentity } from '@modules/auth';
import { AnnouncementsController, CalendarController, InformationController } from '@modules/news';
import express, { Router } from 'express';

class InformationRout implements Routes {
  public path = '/information';
  private readonly _controller: InformationController | undefined = undefined;

  public constructor(
    public router: Router,
    private _parentPath: string,
  ) {
    this._controller = new InformationController();
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this._parentPath}${this.path}`, setIdentity, this._controller.get);
  }
}

class AnnouncementsRout implements Routes {
  public path = '/announcements';
  private readonly _controller: AnnouncementsController | undefined = undefined;

  public constructor(
    public router: Router,
    private _parentPath: string,
  ) {
    this._controller = new AnnouncementsController();
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this._parentPath}${this.path}`, setIdentity, this._controller.get);
  }
}

class CalendarRout implements Routes {
  public path = '/calendar';
  private readonly _controller: CalendarController | undefined = undefined;

  public constructor(
    public router: Router,
    private _parentPath: string,
  ) {
    this._controller = new CalendarController();
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this._parentPath}${this.path}`, setIdentity, this._controller.get);
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
