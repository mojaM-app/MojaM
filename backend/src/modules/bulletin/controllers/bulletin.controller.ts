import { BaseController, type IRequestWithIdentity } from '@core';
import { isGuid } from '@utils';
import type { NextFunction, Request, Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';
import { CreateBulletinDto, CreateBulletinReqDto, CreateBulletinResponseDto } from '../dtos/create-bulletin.dto';
import { DeleteBulletinReqDto, DeleteBulletinResponseDto } from '../dtos/delete-bulletin.dto';
import { GetBulletinReqDto, GetBulletinResponseDto } from '../dtos/get-bulletin.dto';
import { PublishBulletinReqDto, PublishBulletinResponseDto } from '../dtos/publish-bulletin.dto';
import { UpdateBulletinDto, UpdateBulletinReqDto, UpdateBulletinResponseDto } from '../dtos/update-bulletin.dto';
import { BulletinService } from '../services/bulletin.service';

export class BulletinController extends BaseController {
  private readonly _bulletinService: BulletinService;

  constructor() {
    super();
    this._bulletinService = Container.get(BulletinService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetBulletinReqDto(this.getBulletinGuid(req), this.getCurrentUserId(req));
      const result = await this._bulletinService.get(reqDto);
      res.status(StatusCode.SuccessOK).json(new GetBulletinResponseDto(result!));
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: CreateBulletinDto = req.body;
      const reqDto = new CreateBulletinReqDto(model, this.getCurrentUserId(req));
      const result = await this._bulletinService.create(reqDto);
      res.status(StatusCode.SuccessCreated).json(new CreateBulletinResponseDto(result!.id));
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: UpdateBulletinDto = req.body;
      const reqDto = new UpdateBulletinReqDto(this.getBulletinGuid(req), model, this.getCurrentUserId(req)!);
      const result = await this._bulletinService.update(reqDto);
      res.status(StatusCode.SuccessOK).json(new UpdateBulletinResponseDto(!!result));
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new DeleteBulletinReqDto(this.getBulletinGuid(req), this.getCurrentUserId(req)!);
      const result = await this._bulletinService.delete(reqDto);
      res.status(StatusCode.SuccessOK).json(new DeleteBulletinResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public publish = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new PublishBulletinReqDto(this.getBulletinGuid(req), this.getCurrentUserId(req)!);
      const result = await this._bulletinService.publish(reqDto);
      res.status(StatusCode.SuccessOK).json(new PublishBulletinResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  private getBulletinGuid(req: Request): string | undefined {
    return isGuid(req.params.id) ? req.params.id : undefined;
  }
}
