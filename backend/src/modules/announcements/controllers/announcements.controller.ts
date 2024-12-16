import { IRequestWithIdentity } from '@interfaces';
import {
  AnnouncementsService,
  CopyAnnouncementsReqDto,
  CopyAnnouncementsResponseDto,
  CopyAnnouncementsResultDto,
  CreateAnnouncementsDto,
  CreateAnnouncementsReqDto,
  CreateAnnouncementsResponseDto,
  DeleteAnnouncementsReqDto,
  DeleteAnnouncementsResponseDto,
  GetAnnouncementsReqDto,
  GetAnnouncementsResponseDto,
  PublishAnnouncementsReqDto,
  PublishAnnouncementsResponseDto,
  UpdateAnnouncementsDto,
  UpdateAnnouncementsReqDto,
  UpdateAnnouncementsResponseDto,
} from '@modules/announcements';
import { BaseController } from '@modules/common';
import { isGuid } from '@utils';
import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';

export class AnnouncementsController extends BaseController {
  private readonly _service: AnnouncementsService;

  public constructor() {
    super();
    this._service = Container.get(AnnouncementsService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetAnnouncementsReqDto(this.getAnnouncementsGuid(req), this.getCurrentUserId(req)!);
      const result = await this._service.get(reqDto);
      res.status(200).json(new GetAnnouncementsResponseDto(result!));
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: CreateAnnouncementsDto = req.body;
      const result = await this._service.create(new CreateAnnouncementsReqDto(model, this.getCurrentUserId(req)));
      res.status(201).json(new CreateAnnouncementsResponseDto(result!.id));
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: UpdateAnnouncementsDto = req.body;
      const reqDto = new UpdateAnnouncementsReqDto(this.getAnnouncementsGuid(req), model, this.getCurrentUserId(req));
      const result = await this._service.update(reqDto);
      res.status(200).json(new UpdateAnnouncementsResponseDto(result!.id));
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new DeleteAnnouncementsReqDto(this.getAnnouncementsGuid(req), this.getCurrentUserId(req)!);
      const result = await this._service.delete(reqDto);
      res.status(200).json(new DeleteAnnouncementsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public publish = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new PublishAnnouncementsReqDto(this.getAnnouncementsGuid(req), this.getCurrentUserId(req)!);
      const result = await this._service.publish(reqDto);
      res.status(200).json(new PublishAnnouncementsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public copy = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new CopyAnnouncementsReqDto(this.getAnnouncementsGuid(req), this.getCurrentUserId(req)!);
      const result = await this._service.copy(reqDto);
      res.status(201).json(new CopyAnnouncementsResponseDto({ uuid: result?.id, success: true } satisfies CopyAnnouncementsResultDto));
    } catch (error) {
      next(error);
    }
  };

  private getAnnouncementsGuid(req: Request): string | undefined {
    return isGuid(req?.params?.id) ? req.params.id : undefined;
  }
}
