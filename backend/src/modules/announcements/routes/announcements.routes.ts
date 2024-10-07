import { Routes } from '@interfaces';
import { AnnouncementsController } from '@modules/announcements';
import { setIdentity } from '@modules/auth';
import express from 'express';

export class AnnouncementsRout implements Routes {
  public path = '/announcements';
  public router = express.Router();

  private readonly _controller: AnnouncementsController;

  public constructor() {
    this._controller = new AnnouncementsController();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.get(`${this.path}`, [setIdentity], this._controller.get);
  }
}
