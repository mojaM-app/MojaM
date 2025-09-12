import { BaseController, IRequestWithIdentity } from '@core';
import { getISODate } from '@utils';
import type { NextFunction, Response } from 'express';
import StatusCode from 'status-code-enum';
import { Container } from 'typedi';
import {
  GetBulletinDaysMinMaxDateReqDto,
  GetBulletinDaysMinMaxDateResponseDto,
} from '../dtos/get-bulletin-days-min-max-date.dto';
import { GetBulletinDaysReqDto, GetBulletinDaysResponseDto } from '../dtos/get-bulletin-days.dto';
import { BulletinCalendarService } from '../services/bulletin-calendar.service';

export class BulletinCalendarViewController extends BaseController {
  private readonly _bulletinCalendarService: BulletinCalendarService;

  constructor() {
    super();
    this._bulletinCalendarService = Container.get(BulletinCalendarService);
  }

  public getMinMaxDate = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetBulletinDaysMinMaxDateReqDto(this.getCurrentUserId(req));
      const result = await this._bulletinCalendarService.getMinMaxDate(reqDto);
      res.status(StatusCode.SuccessOK).json(new GetBulletinDaysMinMaxDateResponseDto(result!));
    } catch (error) {
      next(error);
    }
  };

  public getDays = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isoStartDate = getISODate(req.query.start?.toString());
      const isoEndDate = getISODate(req.query.end?.toString());
      const reqDto = new GetBulletinDaysReqDto(isoStartDate, isoEndDate, this.getCurrentUserId(req));
      const result = await this._bulletinCalendarService.getDays(reqDto);
      res.status(StatusCode.SuccessOK).json(new GetBulletinDaysResponseDto(result));
    } catch (error) {
      next(error);
    }
  };
}
