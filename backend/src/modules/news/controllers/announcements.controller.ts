import { events } from '@events/events';
import { RequestWithUser } from '@modules/auth/interfaces/RequestWithUser';
import { GetAnnouncementsDto } from '@modules/news/dtos/announcements.dto';
import { AnnouncementsService } from '@modules/news/services/announcements.service';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class AnnouncementsController {
  public announcementsService = Container.get(AnnouncementsService);

  public get = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: GetAnnouncementsDto = await this.announcementsService.get();

      res.status(200).json({ data: data, message: events.news.announcements.retrieved });
    } catch (error) {
      next(error);
    }
  };
}
