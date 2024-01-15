import { events } from '@events';
import { RequestWithIdentity } from '@modules/auth';
import { BaseController } from '@modules/common';
import { CalendarService, GetCalendarEventsDto } from '@modules/news';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class CalendarController extends BaseController {
  private readonly _calendarService: CalendarService;

  public constructor() {
    super();
    this._calendarService = Container.get(CalendarService);
  }

  public get = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: GetCalendarEventsDto = await this._calendarService.get();
      res.status(200).json({ data, message: events.news.calendar.retrieved });
    } catch (error) {
      next(error);
    }
  };
}
