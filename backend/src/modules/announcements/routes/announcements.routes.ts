import { ForbiddenException, UnauthorizedException } from '@exceptions';
import { IRequestWithIdentity, IRoutes } from '@interfaces';
import { validateData } from '@middlewares';
import { AnnouncementsController, CreateAnnouncementsDto, CurrentAnnouncementsController } from '@modules/announcements';
import { setIdentity } from '@modules/auth';
import { REGEX_GUID_PATTERN } from '@utils';
import express, { NextFunction, Response } from 'express';
import { UpdateAnnouncementsDto } from '../dtos/update-announcements.dto';

export class AnnouncementsRout implements IRoutes {
  public path = '/announcements';
  public currentAnnouncementsPath = `${this.path}/current`;
  public publishPath = 'publish';

  public router = express.Router();

  private readonly _announcementsController: AnnouncementsController;
  private readonly _currentAnnouncementsController: CurrentAnnouncementsController;

  public constructor() {
    this._announcementsController = new AnnouncementsController();
    this._currentAnnouncementsController = new CurrentAnnouncementsController();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.get(`${this.path}/:id(${REGEX_GUID_PATTERN})`, [setIdentity, this.checkGetPermission], this._announcementsController.get);
    this.router.post(
      `${this.path}`,
      [validateData(CreateAnnouncementsDto), setIdentity, this.checkCreatePermission],
      this._announcementsController.create,
    );
    this.router.put(
      `${this.path}/:id(${REGEX_GUID_PATTERN})`,
      [validateData(UpdateAnnouncementsDto), setIdentity, this.checkUpdatePermission],
      this._announcementsController.update,
    );
    this.router.delete(`${this.path}/:id(${REGEX_GUID_PATTERN})`, [setIdentity, this.checkDeletePermission], this._announcementsController.delete);
    this.router.post(
      `${this.path}/:id(${REGEX_GUID_PATTERN})/${this.publishPath}`,
      [setIdentity, this.checkPublishPermission],
      this._announcementsController.publish,
    );

    this.router.get(this.currentAnnouncementsPath, this._currentAnnouncementsController.get);
  }

  private readonly checkGetPermission = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity?.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToGetAnnouncements()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private readonly checkPublishPermission = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity?.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToPublishAnnouncements()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private readonly checkCreatePermission = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity?.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToAddAnnouncements()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private readonly checkUpdatePermission = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity?.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToEditAnnouncements()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };

  private readonly checkDeletePermission = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    if (!req.identity?.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!req.identity.hasPermissionToDeleteAnnouncements()) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };
}
