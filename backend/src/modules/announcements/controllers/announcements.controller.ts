import { GET_TOP_ANNOUNCEMENTS_ITEMS } from '@config';
import { BaseController, type IRequestWithIdentity } from '@core';
import { isGuid, toNumber } from '@utils';
import type { NextFunction, Request, Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';
import {
  type CreateAnnouncementsDto,
  CreateAnnouncementsReqDto,
  CreateAnnouncementsResponseDto,
} from '../dtos/create-announcements.dto';
import { DeleteAnnouncementsReqDto, DeleteAnnouncementsResponseDto } from '../dtos/delete-announcements.dto';
import { GetAnnouncementsReqDto, GetAnnouncementsResponseDto } from '../dtos/get-announcements.dto';
import {
  GetTopAnnouncementItemsDto,
  GetTopAnnouncementItemsReqDto,
  GetTopAnnouncementItemsResponseDto,
} from '../dtos/get-top-announcement-items.dto';
import { PublishAnnouncementsReqDto, PublishAnnouncementsResponseDto } from '../dtos/publish-announcements.dto';
import {
  type UpdateAnnouncementsDto,
  UpdateAnnouncementsReqDto,
  UpdateAnnouncementsResponseDto,
} from '../dtos/update-announcements.dto';
import { AnnouncementsService } from '../services/announcements.service';

export class AnnouncementsController extends BaseController {
  private readonly _service: AnnouncementsService;

  constructor() {
    super();
    this._service = Container.get(AnnouncementsService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetAnnouncementsReqDto(this.getAnnouncementsGuid(req), this.getCurrentUserId(req)!);
      const result = await this._service.get(reqDto);
      res.status(StatusCode.SuccessOK).json(new GetAnnouncementsResponseDto(result!));
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: CreateAnnouncementsDto = req.body;
      const result = await this._service.create(new CreateAnnouncementsReqDto(model, this.getCurrentUserId(req)));
      res.status(StatusCode.SuccessCreated).json(new CreateAnnouncementsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: UpdateAnnouncementsDto = req.body;
      const reqDto = new UpdateAnnouncementsReqDto(this.getAnnouncementsGuid(req), model, this.getCurrentUserId(req));
      const result = await this._service.update(reqDto);
      res.status(StatusCode.SuccessOK).json(new UpdateAnnouncementsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new DeleteAnnouncementsReqDto(this.getAnnouncementsGuid(req), this.getCurrentUserId(req)!);
      const result = await this._service.delete(reqDto);
      res.status(StatusCode.SuccessOK).json(new DeleteAnnouncementsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public publish = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new PublishAnnouncementsReqDto(this.getAnnouncementsGuid(req), this.getCurrentUserId(req)!);
      const result = await this._service.publish(reqDto);
      res.status(StatusCode.SuccessOK).json(new PublishAnnouncementsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public getTopAnnouncementItems = async (
    req: IRequestWithIdentity,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const numberOfItems = toNumber(GET_TOP_ANNOUNCEMENTS_ITEMS) || 10;
      const model: GetTopAnnouncementItemsDto = req.body;
      const reqDto = new GetTopAnnouncementItemsReqDto(numberOfItems, model, this.getCurrentUserId(req));
      const result = await this._service.getTopAnnouncementItems(reqDto);
      res.status(StatusCode.SuccessOK).json(new GetTopAnnouncementItemsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  private getAnnouncementsGuid(req: Request): string | undefined {
    return isGuid(req.params.id) ? req.params.id : undefined;
  }
}
