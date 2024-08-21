import { RequestWithIdentity } from '@interfaces';
import { BaseController } from '@modules/common';
import { CalendarService, GetCalendarEventsDto, GetCalendarEventsResponseDto } from '@modules/news';
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
      res.status(200).json(new GetCalendarEventsResponseDto(data));
    } catch (error) {
      next(error);
    }
  };
}
