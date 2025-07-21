import { BaseController, type IRequestWithIdentity } from '@core';
import { isGuid } from '@utils';
import type { NextFunction, Request, Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';
import { CreateBulletinDto, CreateBulletinReqDto, CreateBulletinResponseDto } from '../dtos/create-bulletin.dto';
import { DeleteBulletinReqDto, DeleteBulletinResponseDto } from '../dtos/delete-bulletin.dto';
import {
  GetBulletinListReqDto,
  GetBulletinListResponseDto,
  GetBulletinReqDto,
  GetBulletinResponseDto,
} from '../dtos/get-bulletin.dto';
import { PublishBulletinReqDto, PublishBulletinResponseDto } from '../dtos/publish-bulletin.dto';
import { UpdateBulletinDto, UpdateBulletinReqDto, UpdateBulletinResponseDto } from '../dtos/update-bulletin.dto';
import { BulletinState } from '../enums/bulletin-state.enum';
import { BulletinPdfService } from '../services/bulletin-pdf.service';
import { BulletinService } from '../services/bulletin.service';

export class BulletinController extends BaseController {
  private readonly _bulletinService: BulletinService;
  private readonly _bulletinPdfService: BulletinPdfService;

  constructor() {
    super();
    this._bulletinService = Container.get(BulletinService);
    this._bulletinPdfService = Container.get(BulletinPdfService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetBulletinReqDto(this.getBulletinGuid(req), this.getCurrentUserId(req)!);
      const result = await this._bulletinService.get(reqDto);
      res.status(StatusCode.SuccessOK).json(new GetBulletinResponseDto(result!));
    } catch (error) {
      next(error);
    }
  };

  public getList = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const state = req.query.state ? (parseInt(req.query.state as string) as BulletinState) : undefined;
      const reqDto = new GetBulletinListReqDto(state, this.getCurrentUserId(req)!);
      const result = await this._bulletinService.getList(reqDto);
      res.status(StatusCode.SuccessOK).json(new GetBulletinListResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: CreateBulletinDto = req.body;
      const result = await this._bulletinService.create(new CreateBulletinReqDto(model, this.getCurrentUserId(req)));
      res.status(StatusCode.SuccessCreated).json(new CreateBulletinResponseDto(result!.id));
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: UpdateBulletinDto = req.body;
      const reqDto = new UpdateBulletinReqDto(this.getBulletinGuid(req)!, model, this.getCurrentUserId(req));
      const result = await this._bulletinService.update(reqDto);
      res.status(StatusCode.SuccessOK).json(new UpdateBulletinResponseDto(result!.id));
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new DeleteBulletinReqDto(this.getBulletinGuid(req)!, this.getCurrentUserId(req)!);
      const result = await this._bulletinService.delete(reqDto);
      res.status(StatusCode.SuccessOK).json(new DeleteBulletinResponseDto(result!.id));
    } catch (error) {
      next(error);
    }
  };

  public publish = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new PublishBulletinReqDto(this.getBulletinGuid(req)!, this.getCurrentUserId(req)!);
      const result = await this._bulletinService.publish(reqDto);
      res.status(StatusCode.SuccessOK).json(new PublishBulletinResponseDto(result!.id));
    } catch (error) {
      next(error);
    }
  };

  private getBulletinGuid(req: Request): string | undefined {
    return isGuid(req.params.id) ? req.params.id : undefined;
  }
}
