import { IRoutes } from '@interfaces';
import { requirePermission } from '@middlewares';
import { AnnouncementsListController } from '@modules/announcements';
import { setIdentity } from '@modules/auth';
import express from 'express';

export class AnnouncementsListRoute implements IRoutes {
  public path = '/announcements-list';
  public router = express.Router();
  private readonly _controller: AnnouncementsListController;

  constructor() {
    this._controller = new AnnouncementsListController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}`, [setIdentity, requirePermission(user => user.canPreviewAnnouncementsList())], this._controller.get);
  }
}
