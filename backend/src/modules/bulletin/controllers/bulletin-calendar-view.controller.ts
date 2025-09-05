import { BaseController, IRequestWithIdentity } from '@core';
import type { NextFunction, Response } from 'express';
import StatusCode from 'status-code-enum';
import { Container } from 'typedi';
import {
  GetBulletinDaysMinMaxDateReqDto,
  GetBulletinDaysMinMaxDateResponseDto,
} from '../dtos/get-bulletin-days-min-max-date.dto';
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
}
