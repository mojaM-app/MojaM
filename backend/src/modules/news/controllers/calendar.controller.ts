import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { CalendarService } from '@modules/news/services/calendar.service';
import { events } from '@events/events';
import { GetCalendarEventsDto } from '@modules/news/dtos/calendar.dto';

export class CalendarController {
  public calendarService = Container.get(CalendarService);

  public get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: GetCalendarEventsDto = await this.calendarService.get();

      res.status(200).json({ data: data, message: events.news.calendar.retrieved });
    } catch (error) {
      next(error);
    }
  };
}
