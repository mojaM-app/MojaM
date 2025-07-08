import { BaseController, type IRequestWithIdentity } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { isNullOrUndefined } from '@utils';
import type { NextFunction, Response } from 'express';
import { StatusCode } from 'status-code-enum';
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
      const startDate = req.query.start?.toString();
      const isoStartDate = this.getISODate(startDate);
      if ((isoStartDate?.length ?? 0) > 0 && !this.isValidISODate(isoStartDate)) {
        throw new BadRequestException(errorKeys.calendar.Invalid_Start_Date, { startDate });
      }

      const endDate = req.query.end?.toString();
      const isoEndDate = this.getISODate(endDate);
      if ((isoEndDate?.length ?? 0) > 0 && !this.isValidISODate(isoEndDate)) {
        throw new BadRequestException(errorKeys.calendar.Invalid_End_Date, { endDate });
      }

      const result = await this._calendarService.getEvents(
        new GetCalendarEventsReqDto(isoStartDate, isoEndDate, this.getCurrentUserId(req)),
      );
      res.status(StatusCode.SuccessOK).json(new GetCalendarEventsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  private isValidISODate(dateString: string | undefined): boolean {
    try {
      if (isNullOrUndefined(dateString) || dateString!.length === 0) {
        return false;
      }

      const date = new Date(dateString!);
      return !isNaN(date.getTime()) && dateString === date.toISOString();
    } catch {
      return false;
    }
  }

  private getISODate(date: string | undefined): string | undefined {
    if (isNullOrUndefined(date) || date!.length === 0) {
      return undefined;
    }

    let dateString = date!.toString();

    if (!dateString.includes('T')) {
      dateString += 'T00:00:00.000Z';
    }

    return dateString;
  }
}
