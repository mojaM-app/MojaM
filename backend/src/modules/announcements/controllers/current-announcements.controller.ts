import { IRequestWithIdentity } from '@interfaces';
import { CurrentAnnouncementsService, GetCurrentAnnouncementsResponseDto } from '@modules/announcements';
import { BaseController } from '@modules/common';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class CurrentAnnouncementsController extends BaseController {
  private readonly _service: CurrentAnnouncementsService;

  constructor() {
    super();
    this._service = Container.get(CurrentAnnouncementsService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this._service.get(this.getCurrentUserId(req));
      res.status(200).json(new GetCurrentAnnouncementsResponseDto(data));
    } catch (error) {
      next(error);
    }
  };
}
