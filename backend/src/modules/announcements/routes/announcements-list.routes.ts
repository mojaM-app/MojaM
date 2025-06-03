import { IRoutes } from '@core';
import { requirePermission, setIdentity } from '@middlewares';
import express from 'express';
import { AnnouncementsListController } from '../controllers/announcements-list.controller';

export class AnnouncementsListRoute implements IRoutes {
  public static path = '/announcements-list';
  public router = express.Router();
  private readonly _controller: AnnouncementsListController;

  constructor() {
    this._controller = new AnnouncementsListController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      `${AnnouncementsListRoute.path}`,
      [setIdentity, requirePermission(user => user.canPreviewAnnouncementsList())],
      this._controller.get,
    );
  }
}
