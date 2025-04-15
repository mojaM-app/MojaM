import { REGEX_PATTERNS } from '@config';
import { IRoutes } from '@interfaces';
import { requirePermission, validateData } from '@middlewares';
import { AnnouncementsController, CreateAnnouncementsDto, CurrentAnnouncementsController } from '@modules/announcements';
import { setIdentity } from '@modules/auth';
import express from 'express';
import { UpdateAnnouncementsDto } from '../dtos/update-announcements.dto';

export class AnnouncementsRout implements IRoutes {
  public path = '/announcements';
  public currentAnnouncementsPath = `${this.path}/current`;
  public publishPath = 'publish';

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
      `${this.path}/:id(${REGEX_PATTERNS.GUID})`,
      [setIdentity, requirePermission(user => user.canGetAnnouncements())],
      this._announcementsController.get,
    );

    this.router.post(
      `${this.path}`,
      [validateData(CreateAnnouncementsDto), setIdentity, requirePermission(user => user.canAddAnnouncements())],
      this._announcementsController.create,
    );

    this.router.put(
      `${this.path}/:id(${REGEX_PATTERNS.GUID})`,
      [validateData(UpdateAnnouncementsDto), setIdentity, requirePermission(user => user.canEditAnnouncements())],
      this._announcementsController.update,
    );

    this.router.delete(
      `${this.path}/:id(${REGEX_PATTERNS.GUID})`,
      [setIdentity, requirePermission(user => user.canDeleteAnnouncements())],
      this._announcementsController.delete,
    );

    this.router.post(
      `${this.path}/:id(${REGEX_PATTERNS.GUID})/${this.publishPath}`,
      [setIdentity, requirePermission(user => user.canPublishAnnouncements())],
      this._announcementsController.publish,
    );

    // No authorization required for current announcements
    this.router.get(this.currentAnnouncementsPath, this._currentAnnouncementsController.get);
  }
}
