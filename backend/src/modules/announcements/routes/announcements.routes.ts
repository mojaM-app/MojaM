import { ForbiddenException, UnauthorizedException } from '@exceptions';
import { RequestWithIdentity, Routes } from '@interfaces';
import { validateData } from '@middlewares';
import { AnnouncementsController, CreateAnnouncementsDto, CurrentAnnouncementsController } from '@modules/announcements';
import { setIdentity } from '@modules/auth';
import express, { NextFunction, Response } from 'express';

export class AnnouncementsRout implements Routes {
  public path = '/announcements';
  public currentAnnouncementsPath = `${this.path}/current`;

  public router = express.Router();

  private readonly _announcementsController: AnnouncementsController;
  private readonly _currentAnnouncementsController: CurrentAnnouncementsController;

  public constructor() {
    this._announcementsController = new AnnouncementsController();
    this._currentAnnouncementsController = new CurrentAnnouncementsController();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.post(`${this.path}`, [validateData(CreateAnnouncementsDto), setIdentity, this.checkCreatePermission], this._announcementsController.create);

    this.router.get(this.currentAnnouncementsPath, this._currentAnnouncementsController.get);
  }

  private readonly checkCreatePermission = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity?.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToAddAnnouncements()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };
}
