import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { AnnouncementsService } from '@modules/news/services/announcements.service';
import { events } from '@events/events';
import { GetAnnouncementsDto } from '@modules/news/dtos/announcements.dto';

export class AnnouncementsController {
  public announcementsService = Container.get(AnnouncementsService);

  public get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: GetAnnouncementsDto = await this.announcementsService.get();

      res.status(200).json({ data: data, message: events.news.announcements.retrieved });
    } catch (error) {
      next(error);
    }
  };
}
