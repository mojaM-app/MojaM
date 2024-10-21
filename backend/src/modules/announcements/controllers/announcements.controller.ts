import { RequestWithIdentity } from '@interfaces';
import { AnnouncementsService, CreateAnnouncementsDto, CreateAnnouncementsReqDto, CreateAnnouncementsResponseDto } from '@modules/announcements';
import { BaseController } from '@modules/common';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class AnnouncementsController extends BaseController {
  private readonly _announcementsService: AnnouncementsService;

  public constructor() {
    super();
    this._announcementsService = Container.get(AnnouncementsService);
  }

  public create = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: CreateAnnouncementsDto = req.body;
      const result: boolean = await this._announcementsService.create(new CreateAnnouncementsReqDto(model, this.getCurrentUserId(req)));
      res.status(200).json(new CreateAnnouncementsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };
}
