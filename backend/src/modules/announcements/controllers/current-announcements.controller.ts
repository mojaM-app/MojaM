import { BaseController, type IRequestWithIdentity } from '@core';
import type { NextFunction, Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';
import { GetCurrentAnnouncementsResponseDto } from '../dtos/get-current-announcements.dto';
import { CurrentAnnouncementsService } from '../services/current-announcements.service';

export class CurrentAnnouncementsController extends BaseController {
  private readonly _service: CurrentAnnouncementsService;

  constructor() {
    super();
    this._service = Container.get(CurrentAnnouncementsService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this._service.get(this.getCurrentUserId(req));
      res.status(StatusCode.SuccessOK).json(new GetCurrentAnnouncementsResponseDto(data));
    } catch (error) {
      next(error);
    }
  };
}
