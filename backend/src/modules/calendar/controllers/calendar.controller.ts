import { BaseController, IRequestWithIdentity } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';
import { GetCalendarEventsReqDto, GetCalendarEventsResponseDto } from '../dtos/calendar.dto';
import { CalendarService } from '../services/calendar.service';

export class CalendarController extends BaseController {
  private readonly _calendarService: CalendarService;

  constructor() {
    super();
    this._calendarService = Container.get(CalendarService);
  }

  public getEvents = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const startDate = req?.query?.start?.toString();
      const isoStartDate = this.getISODate(startDate);
      if (isoStartDate && !this.isValidISODate(isoStartDate)) {
        throw new BadRequestException(errorKeys.calendar.Invalid_Start_Date, { startDate: startDate });
      }

      const endDate = req?.query?.end?.toString();
      const isoEndDate = this.getISODate(endDate);
      if (isoEndDate && !this.isValidISODate(isoEndDate)) {
        throw new BadRequestException(errorKeys.calendar.Invalid_End_Date, { endDate: endDate });
      }

      const result = await this._calendarService.getEvents(new GetCalendarEventsReqDto(isoStartDate, isoEndDate, this.getCurrentUserId(req)));
      res.status(200).json(new GetCalendarEventsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  private isValidISODate(dateString: string): boolean {
    try {
      if (!dateString) {
        return false;
      }

      const date = new Date(dateString);
      return !isNaN(date.getTime()) && dateString === date.toISOString();
    } catch {
      return false;
    }
  }

  private getISODate(date: string | undefined): string | undefined {
    if (!date) {
      return undefined;
    }
    let dateString = date.toString();

    if (!dateString.includes('T')) {
      dateString += 'T00:00:00.000Z';
    }

    return dateString;
  }
}
