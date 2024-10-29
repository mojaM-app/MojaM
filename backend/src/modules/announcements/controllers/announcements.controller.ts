import { IRequestWithIdentity } from '@interfaces';
import { AnnouncementsService, CreateAnnouncementsDto, CreateAnnouncementsReqDto, CreateAnnouncementsResponseDto, DeleteAnnouncementsReqDto, DeleteAnnouncementsResponseDto, PublishAnnouncementsReqDto, PublishAnnouncementsResponseDto } from '@modules/announcements';
import { BaseController } from '@modules/common';
import { isGuid } from '@utils';
import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';

export class AnnouncementsController extends BaseController {
  private readonly _announcementsService: AnnouncementsService;

  public constructor() {
    super();
    this._announcementsService = Container.get(AnnouncementsService);
  }

  public create = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: CreateAnnouncementsDto = req.body;
      const result = await this._announcementsService.create(new CreateAnnouncementsReqDto(model, this.getCurrentUserId(req)));
      res.status(201).json(new CreateAnnouncementsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new DeleteAnnouncementsReqDto(this.getAnnouncementsGuid(req), this.getCurrentUserId(req)!);
      const result = await this._announcementsService.delete(reqDto);
      res.status(200).json(new DeleteAnnouncementsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public publish = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new PublishAnnouncementsReqDto(this.getAnnouncementsGuid(req), this.getCurrentUserId(req)!);
      const result = await this._announcementsService.publish(reqDto);
      res.status(200).json(new PublishAnnouncementsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  private getAnnouncementsGuid(req: Request): string | undefined {
    return isGuid(req?.params?.id) ? req.params.id : undefined;
  }
}
