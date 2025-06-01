import { REGEX_PATTERNS } from '@config';
import { IRoutes } from '@interfaces';
import { requirePermission, setIdentity, validateData } from '@middlewares';
import express from 'express';
import { AnnouncementsController } from '../controllers/announcements.controller';
import { CurrentAnnouncementsController } from '../controllers/current-announcements.controller';
import { CreateAnnouncementsDto } from '../dtos/create-announcements.dto';
import { UpdateAnnouncementsDto } from '../dtos/update-announcements.dto';

export class AnnouncementsRout implements IRoutes {
  public static path = '/announcements';
  public static currentAnnouncementsPath = `${AnnouncementsRout.path}/current`;
  public static publishPath = 'publish';

  public router = express.Router();

  private readonly _announcementsController: AnnouncementsController;
  private readonly _currentAnnouncementsController: CurrentAnnouncementsController;

  constructor() {
    this._announcementsController = new AnnouncementsController();
    this._currentAnnouncementsController = new CurrentAnnouncementsController();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.get(
      `${AnnouncementsRout.path}/:id(${REGEX_PATTERNS.GUID})`,
      [setIdentity, requirePermission(user => user.canGetAnnouncements())],
      this._announcementsController.get,
    );

    this.router.post(
      `${AnnouncementsRout.path}`,
      [validateData(CreateAnnouncementsDto), setIdentity, requirePermission(user => user.canAddAnnouncements())],
      this._announcementsController.create,
    );

    this.router.put(
      `${AnnouncementsRout.path}/:id(${REGEX_PATTERNS.GUID})`,
      [validateData(UpdateAnnouncementsDto), setIdentity, requirePermission(user => user.canEditAnnouncements())],
      this._announcementsController.update,
    );

    this.router.delete(
      `${AnnouncementsRout.path}/:id(${REGEX_PATTERNS.GUID})`,
      [setIdentity, requirePermission(user => user.canDeleteAnnouncements())],
      this._announcementsController.delete,
    );

    this.router.post(
      `${AnnouncementsRout.path}/:id(${REGEX_PATTERNS.GUID})/${AnnouncementsRout.publishPath}`,
      [setIdentity, requirePermission(user => user.canPublishAnnouncements())],
      this._announcementsController.publish,
    );

    // No authorization required for current announcements
    this.router.get(AnnouncementsRout.currentAnnouncementsPath, this._currentAnnouncementsController.get);
  }
}
