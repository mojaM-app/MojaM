import { RequestWithIdentity } from '@interfaces';
import { CalendarService, GetCalendarEventsResponseDto } from '@modules/calendar';
import { BaseController } from '@modules/common';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class CalendarController extends BaseController {
  private readonly _calendarService: CalendarService;

  public constructor() {
    super();
    this._calendarService = Container.get(CalendarService);
  }

  public getEvents = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const startDate = new Date(req?.query?.start?.toString() ?? new Date().toISOString());
      const endDate = new Date(req?.query?.end?.toString() ?? new Date().toISOString());
      const data = await this._calendarService.getEvents(startDate, endDate);
      res.status(200).json(new GetCalendarEventsResponseDto(data));
    } catch (error) {
      next(error);
    }
  };
}