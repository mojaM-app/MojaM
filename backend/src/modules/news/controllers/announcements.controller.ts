import { events } from '@events';
import { RequestWithIdentity } from '@modules/auth';
import { BaseController } from '@modules/common';
import { AnnouncementsService, GetAnnouncementsDto } from '@modules/news';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class AnnouncementsController extends BaseController {
  private readonly _announcementsService: AnnouncementsService | undefined = undefined;

  public constructor() {
    super();
    this._announcementsService = Container.get(AnnouncementsService);
  }

  public get = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: GetAnnouncementsDto = await this._announcementsService.get();

      res.status(200).json({ data: data, message: events.news.announcements.retrieved });
    } catch (error) {
      next(error);
    }
  };
}
