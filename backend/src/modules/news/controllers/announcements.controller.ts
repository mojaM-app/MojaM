import { RequestWithIdentity } from '@interfaces';
import { BaseController } from '@modules/common';
import { AnnouncementsService, GetAnnouncementsDto, GetAnnouncementsResponseDto } from '@modules/news';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class AnnouncementsController extends BaseController {
  private readonly _announcementsService: AnnouncementsService;

  public constructor() {
    super();
    this._announcementsService = Container.get(AnnouncementsService);
  }

  public get = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: GetAnnouncementsDto = await this._announcementsService.get();
      res.status(200).json(new GetAnnouncementsResponseDto(data));
    } catch (error) {
      next(error);
    }
  };
}
