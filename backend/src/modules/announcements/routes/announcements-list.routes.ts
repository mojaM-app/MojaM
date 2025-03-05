import { ForbiddenException, UnauthorizedException } from '@exceptions';
import { IRequestWithIdentity, IRoutes } from '@interfaces';
import { AnnouncementsListController } from '@modules/announcements';
import { setIdentity } from '@modules/auth';
import express, { NextFunction, Response } from 'express';

export class AnnouncementsListRoute implements IRoutes {
  public path = '/announcements-list';
  public router = express.Router();
  private readonly _controller: AnnouncementsListController;

  public constructor() {
    this._controller = new AnnouncementsListController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}`, [setIdentity, this.checkPreviewPermission], this._controller.get);
  }

  private readonly checkPreviewPermission = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToPreviewAnnouncementsList()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };
}
